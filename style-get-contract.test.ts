import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const productRoot =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];
const source = readFileSync(
  new URL('api-reference/styles/get.mdx', import.meta.url),
  'utf8',
);

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, 'utf8');
}

describe('get tweet style documentation', (): void => {
  it('matches every canonical status and authentication method', (): void => {
    expect.assertions(1);

    expect({
      apiKeyDocumented: source.includes('Send `x-api-key`'),
      bearerDocumented: source.includes('OAuth clients can send a bearer token'),
      responseTabs: [...source.matchAll(/<Tab title="(\d{3})"/gu)].map(
        ([, status]) => status,
      ),
    }).toStrictEqual({
      apiKeyDocumented: true,
      bearerDocumented: true,
      responseTabs: ['200', '401', '404', '429'],
    });
  });

  it('documents exact top-level and nested response fields', (): void => {
    expect.assertions(1);

    expect({
      nestedFields: ['id', 'text', 'authorUsername', 'createdAt'].every((field) =>
        source.includes(`<ResponseField name="${field}"`),
      ),
      topLevelFields: [
        'xUsername',
        'tweetCount',
        'isOwnAccount',
        'fetchedAt',
        'tweets',
      ].every((field) => source.includes(`<ResponseField name="${field}"`)),
      unsafeNumberCastDenied: source.includes(
        'Do not cast them to `number`.',
      ),
    }).toStrictEqual({
      nestedFields: true,
      topLevelFields: true,
      unsafeNumberCastDenied: true,
    });
  });

  it('keeps cache retrieval separate from refreshes and Twitter analytics', (): void => {
    expect.assertions(1);

    expect({
      accountScopeDocumented: source.includes(
        'The lookup stays inside the authenticated Xquik account.',
      ),
      cacheOnlyDocumented:
        /It does not contact X or refresh\s+tweets\./u.test(source),
      metricBoundaryDocumented: source.includes(
        'It does not fetch likes, replies,\nreposts, quotes, bookmarks, views, followers, or impressions.',
      ),
      numericIdDenied: source.includes(
        'The route does not accept a numeric database ID.',
      ),
    }).toStrictEqual({
      accountScopeDocumented: true,
      cacheOnlyDocumented: true,
      metricBoundaryDocumented: true,
      numericIdDenied: true,
    });
  });

  it('uses focused tweet-style search language without inventing signals', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      focusedTitle: frontmatter.includes(
        'Get Cached Tweet Style Samples with the Xquik API',
      ),
      keywordsPresent: [
        'cached tweet style',
        'tweet writing samples',
        'X writing style',
        'tweet voice profile',
        'Twitter style API',
      ].every((keyword) => frontmatter.includes(keyword)),
      unsupportedDescriptionSignals:
        /tone signals|engagement metrics/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      unsupportedDescriptionSignals: false,
    });
  });

  it('remains synchronized with the optional product implementation', (): void => {
    expect.assertions(1);

    const route = readProductFile('app/api/v1/styles/[id]/route.ts');
    const query = readProductFile('lib/api/style-cache-query.ts');

    expect({
      queryIsAccountScoped:
        query === undefined ||
        (query.includes('eq(tweetStyleCache.userId, userId)') &&
          query.includes('eq(tweetStyleCache.xUsername, normalizedUsername)')),
      routeFormatsRow:
        route === undefined || route.includes('formatStyleDetail(row)'),
      routeReturnsNotFound:
        route === undefined || route.includes("error: 'style_not_found'"),
      routeUsesProfileKey:
        route === undefined ||
        route.includes('queryStyleDetail(auth.userId, username)'),
    }).toStrictEqual({
      queryIsAccountScoped: true,
      routeFormatsRow: true,
      routeReturnsNotFound: true,
      routeUsesProfileKey: true,
    });
  });
});
