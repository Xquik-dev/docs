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
const RESPONSE_TAB_PATTERN = /<Tab title="(\d{3})\b/gu;
const STATUS_CODE_PATTERN = /^\d{3}$/u;
const FULL_STATUS_AUDITED_OPERATIONS = new Set([
  'DELETE /api-keys/{id}',
  'DELETE /drafts/{id}',
  'DELETE /monitors/{id}',
  'DELETE /monitors/keywords/{id}',
  'DELETE /styles/{id}',
  'DELETE /webhooks/{id}',
  'DELETE /x/accounts/{id}',
  'DELETE /x/tweets/{id}',
  'DELETE /x/tweets/{id}/like',
  'DELETE /x/tweets/{id}/retweet',
  'DELETE /x/users/{id}/follow',
  'DELETE /x/communities/{id}',
  'DELETE /x/communities/{id}/join',
  'GET /account',
  'GET /api-keys',
  'GET /credits',
  'GET /credits/topup/status',
  'GET /drafts',
  'GET /drafts/{id}',
  'GET /draws',
  'GET /draws/{id}',
  'GET /draws/{id}/export',
  'GET /events',
  'GET /events/{id}',
  'GET /extractions',
  'GET /extractions/{id}',
  'GET /extractions/{id}/export',
  'GET /monitors',
  'GET /monitors/{id}',
  'GET /monitors/keywords',
  'GET /monitors/keywords/{id}',
  'GET /radar',
  'GET /styles',
  'GET /styles/{id}',
  'GET /styles/{id}/performance',
  'GET /styles/compare',
  'GET /support/tickets',
  'GET /support/tickets/{id}',
  'GET /trends',
  'GET /webhooks',
  'GET /webhooks/{id}/deliveries',
  'GET /x/followers/check',
  'GET /x/articles/{tweetId}',
  'GET /x/accounts',
  'GET /x/accounts/{id}',
  'GET /x/bookmarks',
  'GET /x/bookmarks/folders',
  'GET /x/communities/search',
  'GET /x/communities/tweets',
  'GET /x/communities/{id}/info',
  'GET /x/communities/{id}/members',
  'GET /x/communities/{id}/moderators',
  'GET /x/communities/{id}/tweets',
  'GET /x/dm/{userId}/history',
  'GET /x/lists/{id}/followers',
  'GET /x/lists/{id}/members',
  'GET /x/lists/{id}/tweets',
  'GET /x/notifications',
  'GET /x/timeline',
  'GET /x/trends',
  'GET /x/tweets',
  'GET /x/tweets/search',
  'GET /x/tweets/{id}',
  'GET /x/tweets/{id}/favoriters',
  'GET /x/tweets/{id}/quotes',
  'GET /x/tweets/{id}/replies',
  'GET /x/tweets/{id}/retweeters',
  'GET /x/tweets/{id}/thread',
  'GET /x/users/batch',
  'GET /x/users/search',
  'GET /x/users/{id}',
  'GET /x/users/{id}/followers',
  'GET /x/users/{id}/followers-you-know',
  'GET /x/users/{id}/following',
  'GET /x/users/{id}/likes',
  'GET /x/users/{id}/media',
  'GET /x/users/{id}/mentions',
  'GET /x/users/{id}/replies',
  'GET /x/users/{id}/tweets',
  'GET /x/users/{id}/verified-followers',
  'PATCH /account',
  'PATCH /monitors/{id}',
  'PATCH /monitors/keywords/{id}',
  'PATCH /support/tickets/{id}',
  'PATCH /webhooks/{id}',
  'POST /api-keys',
  'POST /compose',
  'POST /subscribe',
  'POST /credits/quick-topup',
  'POST /credits/topup',
  'POST /drafts',
  'POST /draws',
  'POST /extractions',
  'POST /extractions/estimate',
  'POST /monitors',
  'POST /monitors/keywords',
  'POST /styles',
  'POST /support/tickets',
  'POST /support/tickets/{id}/messages',
  'POST /webhooks',
  'POST /webhooks/{id}/test',
  'POST /x/account-connection-challenges/{id}/submit',
  'POST /x/accounts',
  'POST /x/accounts/{id}/reauth',
  'POST /x/accounts/bulk-retry',
  'POST /x/communities',
  'POST /x/communities/{id}/join',
  'POST /x/dm/{userId}',
  'POST /x/media/download',
  'POST /x/media',
  'POST /x/tweets',
  'POST /x/tweets/{id}/like',
  'POST /x/tweets/{id}/retweet',
  'POST /x/users/{id}/follow',
  'POST /x/users/{id}/remove-follower',
  'PUT /account/x-identity',
  'PATCH /x/profile',
  'PATCH /x/profile/avatar',
  'PATCH /x/profile/banner',
  'PUT /styles/{id}',
]);

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

function documentedSuccessfulResponseTabs(source: string): readonly string[] {
  return [...source.matchAll(RESPONSE_TAB_PATTERN)]
    .map((match): string => match[1] ?? '')
    .filter((status): boolean => status.startsWith('2'))
    .sort();
}

function documentedResponseTabs(source: string): readonly string[] {
  return [...source.matchAll(RESPONSE_TAB_PATTERN)]
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
    docsStatusProvider: documentedSuccessfulResponseTabs,
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
    docsStatusProvider: documentedResponseTabs,
    issuePrefix: '',
    operationFilter: (apiDoc): boolean =>
      FULL_STATUS_AUDITED_OPERATIONS.has(operationKey(apiDoc)),
    spec,
    statusProvider: responseStatuses,
  });
}

function collectStatusFindings({
  docsStatusProvider,
  issuePrefix,
  operationFilter = (): boolean => true,
  spec,
  statusProvider,
}: {
  readonly docsStatusProvider: (source: string) => readonly string[];
  readonly issuePrefix: string;
  readonly operationFilter?: (apiDoc: ApiDoc) => boolean;
  readonly spec: OpenApiSpec;
  readonly statusProvider: (operation: OpenApiOperation) => readonly string[];
}): readonly ResponseStatusFinding[] {
  const findings: ResponseStatusFinding[] = [];

  for (const apiDoc of readApiDocs()) {
    if (!operationFilter(apiDoc)) {
      continue;
    }
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
