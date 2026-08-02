import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const productRoot =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];
const source = readFileSync(
  new URL('api-reference/x-accounts/list.mdx', import.meta.url),
  'utf8',
);

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, 'utf8');
}

describe('connected X accounts list documentation', (): void => {
  it('documents every status and supported authentication method', (): void => {
    expect.assertions(1);

    expect({
      apiKeyDocumented: source.includes(
        '<ParamField header="x-api-key" type="string">',
      ),
      bearerDocumented: source.includes(
        '<ParamField header="Authorization" type="string">',
      ),
      responseTabs: [...source.matchAll(/<Tab title="(\d{3})"/gu)].map(
        ([, status]) => status,
      ),
      sessionCookieClaim: source
        .toLowerCase()
        .includes('session cookie authentication'),
    }).toStrictEqual({
      apiKeyDocumented: true,
      bearerDocumented: true,
      responseTabs: ['200', '401', '429'],
      sessionCookieClaim: false,
    });
  });

  it('uses focused account-management phrases without broad search intent', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      focusedTitle: frontmatter.includes(
        'Connected X Accounts API, Health & Write Readiness',
      ),
      keywordsPresent: [
        'Twitter account API',
        'Twitter API account',
        'X account health',
        'X account status',
        'multiple Twitter accounts',
      ].every((keyword) => frontmatter.includes(keyword)),
      publicSearchBoundary: source.includes(
        'It does not search public Twitter\naccounts.',
      ),
      vagueDescription: /data|details|information/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      publicSearchBoundary: true,
      vagueDescription: false,
    });
  });

  it('explains scope, ordering, empty lists, and account identifiers', (): void => {
    expect.assertions(1);

    expect({
      accountScoped: source.includes(
        'The response contains only connections owned by the authenticated Xquik',
      ),
      earliestFirst: source.includes(
        'Accounts are ordered by `createdAt` from earliest to latest.',
      ),
      emptyList: source.includes('receives `{"accounts": []}`.'),
      noPagination: source.includes(
        'The endpoint accepts no query parameters. It does not paginate, search, or',
      ),
      xUserIdBoundary: source.includes(
        'Do not send `xUserId` where a write endpoint requires `accountId`.',
      ),
    }).toStrictEqual({
      accountScoped: true,
      earliestFirst: true,
      emptyList: true,
      noPagination: true,
      xUserIdBoundary: true,
    });
  });

  it('maps every health value to a concrete write decision', (): void => {
    expect.assertions(1);

    expect({
      healthRows: [
        'healthy',
        'recovering',
        'temporaryIssue',
        'needsReauth',
        'locked',
        'suspended',
      ].every((health) => source.includes(`| \`${health}\` |`)),
      statusIsInsufficient: source.includes(
        'The `status` field alone is insufficient.',
      ),
      retryBoundary: source.includes(
        'Use Bulk Retry only for eligible temporary\nfailures.',
      ),
    }).toStrictEqual({
      healthRows: true,
      retryBoundary: true,
      statusIsInsufficient: true,
    });
  });

  it('remains synchronized with the optional product implementation', (): void => {
    expect.assertions(1);

    const handler = readProductFile('lib/x-accounts/accounts-route.ts');
    const route = readProductFile('app/api/v1/x/accounts/route.ts');

    expect({
      accountScopedQuery:
        route === undefined ||
        route.includes('.where(eq(connectedXAccounts.userId, userId))'),
      createdAscending:
        route === undefined ||
        route.includes(
          '.orderBy(sql`${connectedXAccounts.createdAt} ASC`)',
        ),
      listUsesV1Auth:
        route === undefined ||
        route.includes("withV1Auth(request, 'Failed to list X accounts'"),
      optionalCookieTimestamp:
        handler === undefined ||
        handler.includes('row.cookiesObtainedAt?.toISOString()'),
      resultMapsEveryRow:
        handler === undefined ||
        handler.includes('accounts: rows.map((row) => formatAccount(row))'),
    }).toStrictEqual({
      accountScopedQuery: true,
      createdAscending: true,
      listUsesV1Auth: true,
      optionalCookieTimestamp: true,
      resultMapsEveryRow: true,
    });
  });
});
