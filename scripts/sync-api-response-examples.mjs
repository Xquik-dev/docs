import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  GENERATED_RESPONSE_EXAMPLES_END as END_MARKER,
  GENERATED_RESPONSE_EXAMPLES_START as START_MARKER,
  stripGeneratedResponseExamples,
} from './lib/generated-response-examples.ts';

const PROJECT_ROOT = process.cwd();
const API_REFERENCE_DIR = join(PROJECT_ROOT, 'api-reference');
const OPENAPI_PATH = join(PROJECT_ROOT, 'openapi.yaml');
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

function listMdxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listMdxFiles(path);
    }
    return entry.name.endsWith('.mdx') ? [path] : [];
  });
}

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

function resolveNode(document, node) {
  if (node?.$ref === undefined) {
    return node;
  }
  const resolved = resolveReference(document, node.$ref);
  if (resolved === undefined) {
    throw new Error(`OpenAPI reference not found: ${node.$ref}`);
  }
  return resolved;
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

function exampleFromSchema(document, rawSchema, depth = 0, visited = new Set()) {
  if (rawSchema === undefined || depth > 7) {
    return {};
  }
  if (rawSchema.example !== undefined) {
    return rawSchema.example;
  }
  if (rawSchema.const !== undefined) {
    return rawSchema.const;
  }
  if (rawSchema.default !== undefined) {
    return rawSchema.default;
  }
  if (rawSchema.enum?.[0] !== undefined) {
    return rawSchema.enum[0];
  }

  if (rawSchema.$ref !== undefined) {
    if (visited.has(rawSchema.$ref)) {
      return {};
    }
    const nextVisited = new Set(visited).add(rawSchema.$ref);
    return exampleFromSchema(
      document,
      resolveReference(document, rawSchema.$ref),
      depth + 1,
      nextVisited,
    );
  }

  if (rawSchema.allOf !== undefined) {
    return mergeExamples(
      rawSchema.allOf.map((schema) =>
        exampleFromSchema(document, schema, depth + 1, visited),
      ),
    );
  }
  const variant = rawSchema.oneOf?.[0] ?? rawSchema.anyOf?.[0];
  if (variant !== undefined) {
    return exampleFromSchema(document, variant, depth + 1, visited);
  }

  const schema = resolveNode(document, rawSchema);
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

function responseExample(document, rawResponse) {
  const response = resolveNode(document, rawResponse);
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

  return {
    language: mediaType.includes('json') ? 'json' : 'text',
    value,
  };
}

function formatValue(language, value) {
  if (language === 'json') {
    return JSON.stringify(value, null, 2);
  }
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function responseExampleBlock(document, responses) {
  const codeBlocks = Object.entries(responses).map(([status, rawResponse]) => {
    const example = responseExample(document, rawResponse);
    const value = formatValue(example.language, example.value)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `  \`\`\`${example.language} ${status}\n${value}\n  \`\`\``;
  });

  return [
    START_MARKER,
    '<ResponseExample>',
    ...codeBlocks.flatMap((block, index) => (index === 0 ? [block] : ['', block])),
    '</ResponseExample>',
    END_MARKER,
  ].join('\n');
}

function replaceGeneratedBlock(source, block) {
  const sourceWithoutBlock = stripGeneratedResponseExamples(source);

  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u.exec(sourceWithoutBlock);
  if (frontmatter === null) {
    throw new Error('API reference page has no frontmatter insertion point.');
  }

  const topLevelImports = /^(?:\r?\n)*import [^\r\n]+;\r?\n/u.exec(
    sourceWithoutBlock.slice(frontmatter[0].length),
  );
  if (topLevelImports === null) {
    throw new Error('API reference page has no import insertion point.');
  }

  let insertion = frontmatter[0].length + topLevelImports[0].length;
  while (true) {
    const nextImport = /^import [^\r\n]+;\r?\n/u.exec(
      sourceWithoutBlock.slice(insertion),
    );
    if (nextImport === null) {
      break;
    }
    insertion += nextImport[0].length;
  }

  return `${sourceWithoutBlock.slice(0, insertion)}\n${block}\n${sourceWithoutBlock.slice(insertion).replace(/^\r?\n*/u, '')}`;
}

const document = Bun.YAML.parse(readFileSync(OPENAPI_PATH, 'utf8'));
const check = process.argv.includes('--check');
const findings = [];
let pages = 0;
let statuses = 0;

for (const file of listMdxFiles(API_REFERENCE_DIR)) {
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

  const block = responseExampleBlock(document, operation.responses ?? {});
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
