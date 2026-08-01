import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const API_REFERENCE_DIR = join(PROJECT_ROOT, 'api-reference');
const WRITE_ACTION_LIFECYCLE_SNIPPET_PATH = join(
  PROJECT_ROOT,
  'snippets/write-action-lifecycle-response.mdx',
);
const WRITE_ACTION_DIR = join(PROJECT_ROOT, 'api-reference/x-write');
const FRONTMATTER_API_PATTERN = /^api:\s*"([A-Z]+) ([^"]+)"/mu;
const RESPONSE_STATUS_PATTERN =
  /(?:<Tab title="|^### |^  ```(?:json|text) )(\d{3})\b/gmu;
const STATUS_CODE_PATTERN = /^\d{3}$/u;
interface ApiDoc {
  readonly file: string;
  readonly method: string;
  readonly path: string;
  readonly source: string;
}

interface OpenApiOperation {
  readonly responses?: Record<string, unknown>;
}

interface OpenApiSpec {
  readonly paths?: Record<string, Record<string, OpenApiOperation>>;
}

interface ResponseStatusFinding {
  readonly file: string;
  readonly issue: string;
  readonly operation: string;
  readonly status: string;
}

function parseYaml(source: string): OpenApiSpec {
  const bun = globalThis as {
    readonly Bun?: { readonly YAML?: { parse: (yaml: string) => unknown } };
  };
  const parse = bun.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error('Bun.YAML.parse is required for OpenAPI docs tests.');
  }
  return parse(source) as OpenApiSpec;
}

function listApiReferenceFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listApiReferenceFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.mdx')) {
      files.push(relative(PROJECT_ROOT, fullPath));
    }
  }
  return files.sort();
}

function readApiDocs(): readonly ApiDoc[] {
  return listApiReferenceFiles(API_REFERENCE_DIR).flatMap((file) => {
    const pageSource = readFileSync(join(PROJECT_ROOT, file), 'utf8');
    const source = pageSource.includes('<WriteActionLifecycleResponse />')
      ? `${pageSource}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`
      : pageSource;
    const match = FRONTMATTER_API_PATTERN.exec(pageSource);
    if (match?.[1] === undefined || match[2] === undefined) {
      return [];
    }
    return [
      {
        file,
        method: match[1].toLowerCase(),
        path: match[2],
        source,
      },
    ];
  });
}

function successfulResponseStatuses(
  operation: OpenApiOperation,
): readonly string[] {
  return Object.keys(operation.responses ?? {})
    .filter(
      (status): boolean =>
        STATUS_CODE_PATTERN.test(status) && status.startsWith('2'),
    )
    .sort();
}

function documentedSuccessfulResponseStatuses(
  source: string,
): readonly string[] {
  return [...source.matchAll(RESPONSE_STATUS_PATTERN)]
    .map((match): string => match[1] ?? '')
    .filter((status): boolean => status.startsWith('2'))
    .sort();
}

function documentedResponseStatuses(source: string): readonly string[] {
  return [...source.matchAll(RESPONSE_STATUS_PATTERN)]
    .map((match): string => match[1] ?? '')
    .sort();
}

function operationKey(apiDoc: ApiDoc): string {
  return `${apiDoc.method.toUpperCase()} ${apiDoc.path}`;
}

function getOperation(
  spec: OpenApiSpec,
  apiDoc: ApiDoc,
): OpenApiOperation | undefined {
  return spec.paths?.[apiDoc.path]?.[apiDoc.method];
}

function collectResponseStatusFindings(
  spec: OpenApiSpec,
): readonly ResponseStatusFinding[] {
  return collectStatusFindings({
    docsStatusProvider: documentedSuccessfulResponseStatuses,
    issuePrefix: 'success ',
    spec,
    statusProvider: successfulResponseStatuses,
  });
}

function responseStatuses(operation: OpenApiOperation): readonly string[] {
  return Object.keys(operation.responses ?? {})
    .filter((status): boolean => STATUS_CODE_PATTERN.test(status))
    .sort();
}

function collectAuditedResponseStatusFindings(
  spec: OpenApiSpec,
): readonly ResponseStatusFinding[] {
  return collectStatusFindings({
    docsStatusProvider: documentedResponseStatuses,
    issuePrefix: '',
    spec,
    statusProvider: responseStatuses,
  });
}

function collectStatusFindings({
  docsStatusProvider,
  issuePrefix,
  spec,
  statusProvider,
}: {
  readonly docsStatusProvider: (source: string) => readonly string[];
  readonly issuePrefix: string;
  readonly spec: OpenApiSpec;
  readonly statusProvider: (operation: OpenApiOperation) => readonly string[];
}): readonly ResponseStatusFinding[] {
  const findings: ResponseStatusFinding[] = [];

  for (const apiDoc of readApiDocs()) {
    const operation = getOperation(spec, apiDoc);
    if (operation === undefined) {
      findings.push({
        file: apiDoc.file,
        issue: 'API reference frontmatter does not match openapi.yaml.',
        operation: operationKey(apiDoc),
        status: apiDoc.path,
      });
      continue;
    }

    const openApiStatuses = statusProvider(operation);
    const docsStatuses = docsStatusProvider(apiDoc.source);

    for (const status of openApiStatuses.filter(
      (statusCode): boolean => !docsStatuses.includes(statusCode),
    )) {
      findings.push({
        file: apiDoc.file,
        issue: `OpenAPI ${issuePrefix}response status is missing from endpoint docs.`,
        operation: operationKey(apiDoc),
        status,
      });
    }

    for (const status of docsStatuses.filter(
      (statusCode): boolean => !openApiStatuses.includes(statusCode),
    )) {
      findings.push({
        file: apiDoc.file,
        issue: `Endpoint docs include a ${issuePrefix}status not present in OpenAPI.`,
        operation: operationKey(apiDoc),
        status,
      });
    }
  }

  return findings;
}

describe('API success response status documentation', (): void => {
  it('keeps endpoint success response tabs aligned with OpenAPI status codes', (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'));
    expect(collectResponseStatusFindings(spec)).toStrictEqual([]);
  });

  it('keeps fully audited endpoint response tabs aligned with OpenAPI status codes', (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'));
    expect(collectAuditedResponseStatusFindings(spec)).toStrictEqual([]);
  });

  it('keeps every write page idempotent and lifecycle-aware', (): void => {
    expect.assertions(2);

    const pages = readdirSync(WRITE_ACTION_DIR)
      .filter(
        (file): boolean =>
          file.endsWith('.mdx') && file !== 'get-write-action-status.mdx',
      )
      .sort();
    const findings = pages.flatMap((file): readonly string[] => {
      const source = readFileSync(join(WRITE_ACTION_DIR, file), 'utf8');
      const required = [
        '-H "Idempotency-Key:',
        '<ParamField header="Idempotency-Key" type="string" required>',
        '<WriteActionLifecycleResponse />',
      ] as const;
      return [
        ...required
          .filter((snippet): boolean => !source.includes(snippet))
          .map((snippet): string => `${file}: missing ${snippet}`),
        ...(source.includes('Safe to retry with exponential backoff.')
          ? [`${file}: unsafe retry guidance`]
          : []),
      ];
    });

    expect(pages).toHaveLength(18);
    expect(findings).toStrictEqual([]);
  });
});
