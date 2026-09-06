import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  GENERATED_RESPONSE_EXAMPLES_END as END_MARKER,
  GENERATED_RESPONSE_EXAMPLES_START as START_MARKER,
  stripGeneratedResponseExamples,
} from './lib/generated-response-examples.ts';

const PROJECT_ROOT = process.cwd();
const API_PATTERN = /^api: "([A-Z]+) ([^"]+)"$/mu;
const HTTP_METHODS = new Set([
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
]);
const ERROR_EXAMPLE_KEYS = [
  'error',
  'message',
  'code',
  'status',
  'retryAfter',
  'charged',
  'chargedCredits',
  'retryable',
  'safeToRetry',
  'writeActionId',
  'statusUrl',
];

function resolveReference(document, reference) {
  if (!reference.startsWith('#/')) {
    throw new Error(`Only local OpenAPI references are supported: ${reference}`);
  }

  return reference
    .slice(2)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((value, segment) => value?.[segment], document);
}

function mergeExamples(values) {
  return values.reduce((result, value) => {
    if (
      result !== null &&
      value !== null &&
      typeof result === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(result) &&
      !Array.isArray(value)
    ) {
      return { ...result, ...value };
    }
    return value ?? result;
  }, {});
}

function exampleFromSchema(document, schema, depth = 0, visited = new Set()) {
  if (schema === undefined || depth > 7) {
    return {};
  }
  for (const value of [
    schema.example,
    schema.const,
    schema.default,
    schema.enum?.[0],
  ]) {
    if (value !== undefined) {
      return value;
    }
  }

  if (schema.$ref !== undefined) {
    if (visited.has(schema.$ref)) {
      return {};
    }
    return exampleFromSchema(
      document,
      resolveReference(document, schema.$ref),
      depth + 1,
      new Set(visited).add(schema.$ref),
    );
  }

  if (schema.allOf !== undefined) {
    return mergeExamples(
      schema.allOf.map((schema) =>
        exampleFromSchema(document, schema, depth + 1, visited),
      ),
    );
  }
  const variant = schema.oneOf?.[0] ?? schema.anyOf?.[0];
  if (variant !== undefined) {
    return exampleFromSchema(document, variant, depth + 1, visited);
  }

  if (schema.type === 'array') {
    return [exampleFromSchema(document, schema.items, depth + 1, visited)];
  }
  if (schema.type === 'object' || schema.properties !== undefined) {
    const properties = Object.entries(schema.properties ?? {});
    const required = new Set(schema.required ?? []);
    const selected = properties.filter(([name]) => required.has(name));
    const fields = (selected.length > 0 ? selected : properties).slice(0, 12);
    return Object.fromEntries(
      fields.map(([name, property]) => [
        name,
        exampleFromSchema(document, property, depth + 1, visited),
      ]),
    );
  }
  if (schema.type === 'boolean') {
    return false;
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return 0;
  }
  if (schema.format === 'date-time') {
    return '2026-08-01T09:00:00.000Z';
  }
  if (schema.format === 'uri' || schema.format === 'url') {
    return 'https://example.com/resource';
  }
  return '<string>';
}

function compactExample(value, maxFields, depth = 0) {
  if (Array.isArray(value)) {
    return value
      .slice(0, 1)
      .map((item) => compactExample(item, maxFields, depth + 1));
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const fieldLimit = depth === 0 ? maxFields : Math.min(maxFields, 5);
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, fieldLimit)
      .map(([key, item]) => [key, compactExample(item, maxFields, depth + 1)]),
  );
}

function compactErrorExample(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const entries = Object.entries(value);
  const selected = ERROR_EXAMPLE_KEYS
    .filter((key) => Object.hasOwn(value, key))
    .map((key) => [key, value[key]]);
  return Object.fromEntries(
    (selected.length > 0 ? selected : entries.slice(0, 6)).map(([key, item]) => [
      key,
      compactExample(item, 5, 1),
    ]),
  );
}

function responseExample(document, rawResponse, status, writeAction) {
  const reference = rawResponse?.$ref;
  const response = reference === undefined ? rawResponse : resolveReference(document, reference);
  if (reference !== undefined && response === undefined) {
    throw new Error(`OpenAPI reference not found: ${reference}`);
  }
  if (status === '204') {
    return { language: 'text', value: 'No response body.' };
  }
  const contentEntries = Object.entries(response.content ?? {});
  if (contentEntries.length === 0) {
    return { language: 'text', value: response.description ?? 'No response body.' };
  }

  const [mediaType, media] =
    contentEntries.find(([type]) => type === 'application/json') ??
    contentEntries.find(([type]) => type.includes('json')) ??
    contentEntries[0];
  const firstNamedExample = Object.values(media.examples ?? {})[0];
  const value =
    media.example ??
    firstNamedExample?.value ??
    exampleFromSchema(document, media.schema);
  const operationValue =
    (status === '200' || status === '202') &&
    typeof writeAction === 'string' &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.hasOwn(value, 'action')
      ? { ...value, action: writeAction }
      : value;
  const compactValue =
    status.startsWith('4') || status.startsWith('5')
      ? compactErrorExample(operationValue)
      : compactExample(operationValue, 10);

  return {
    language: mediaType.includes('json') ? 'json' : 'text',
    value: compactValue,
  };
}

function responseExampleBlock(document, operation, scope) {
  const responses = operation.responses ?? {};
  const tabs = Object.entries(responses).map(([status, rawResponse]) => {
    const example = responseExample(
      document,
      rawResponse,
      status,
      operation['x-write-action'],
    );
    const tabId = `response-${scope.replaceAll('/', '-')}-${status}`;
    const formatted = example.language === 'json' || typeof example.value !== 'string'
      ? JSON.stringify(example.value, null, 2)
      : example.value;
    const value = formatted
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n');
    return [
      `  <Tab title="${status}" id="${tabId}">`,
      `    \`\`\`${example.language}\n${value}\n    \`\`\``,
      '  </Tab>',
    ].join('\n');
  });

  return [
    START_MARKER,
    '<Panel>',
    '<Tabs defaultTabIndex={0} sync={false}>',
    ...tabs.flatMap((tab, index) => (index === 0 ? [tab] : ['', tab])),
    '</Tabs>',
    '</Panel>',
    END_MARKER,
  ].join('\n');
}

function replaceGeneratedBlock(source, block) {
  const sourceWithoutBlock = stripGeneratedResponseExamples(source);

  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u.exec(sourceWithoutBlock);
  if (frontmatter === null) {
    throw new Error('API reference page has no frontmatter insertion point.');
  }

  const topLevelImports = /^(?:\r?\n)*(?:import [^\r\n]+;\r?\n)+/u.exec(
    sourceWithoutBlock.slice(frontmatter[0].length),
  );
  if (topLevelImports === null) {
    throw new Error('API reference page has no import insertion point.');
  }

  const insertion = frontmatter[0].length + topLevelImports[0].length;

  return `${sourceWithoutBlock.slice(0, insertion)}\n${block}\n${sourceWithoutBlock.slice(insertion).replace(/^\r?\n*/u, '')}`;
}

const document = Bun.YAML.parse(readFileSync('openapi.yaml', 'utf8'));
const check = process.argv.includes('--check');
const findings = [];
let pages = 0;
let statuses = 0;

for (const file of new Bun.Glob('**/*.mdx').scanSync({
  cwd: join(PROJECT_ROOT, 'api-reference'),
  absolute: true,
  dot: true,
})) {
  const source = readFileSync(file, 'utf8');
  const match = API_PATTERN.exec(source);
  if (match === null) {
    continue;
  }
  const [, method, path] = match;
  const operation = document.paths?.[path]?.[method.toLowerCase()];
  if (operation === undefined || !HTTP_METHODS.has(method.toLowerCase())) {
    findings.push(`${relative(PROJECT_ROOT, file)}: OpenAPI operation not found.`);
    continue;
  }

  const scope = relative(join(PROJECT_ROOT, 'api-reference'), file).replace(/\.mdx$/u, '');
  const block = responseExampleBlock(document, operation, scope);
  const nextSource = replaceGeneratedBlock(source, block);
  pages += 1;
  statuses += Object.keys(operation.responses ?? {}).length;

  if (nextSource !== source) {
    if (check) {
      findings.push(`${relative(PROJECT_ROOT, file)}: response examples are stale.`);
    } else {
      writeFileSync(file, nextSource);
    }
  }
}

if (findings.length > 0) {
  throw new Error(findings.join('\n'));
}

process.stdout.write(
  `${check ? 'Verified' : 'Synchronized'} ${statuses} response statuses across ${pages} API pages.\n`,
);
