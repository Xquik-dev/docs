import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const productRoot =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];
const source = readFileSync(
  new URL('api-reference/styles/compare.mdx', import.meta.url),
  'utf8',
);

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, 'utf8');
}

describe('compare tweet writing profiles documentation', (): void => {
  it('matches every canonical response status and authentication method', (): void => {
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
      responseTabs: ['200', '400', '401', '404', '429'],
    });
  });

  it('documents ordered cache lookups for usernames and custom labels', (): void => {
    expect.assertions(1);

    expect({
      accountScopeDocumented: source.includes(
        'Xquik performs 2 account-scoped cache lookups.',
      ),
      customLabelsSupported: source.includes(
        'Both query values accept custom labels.',
      ),
      numericIdsDenied:
        /Do not\s+send numeric database IDs\./u.test(source),
      responseOrderDocumented:
        /`style1` matches `username1`\. `style2`\s+matches `username2`\./u.test(
          source,
        ),
    }).toStrictEqual({
      accountScopeDocumented: true,
      customLabelsSupported: true,
      numericIdsDenied: true,
      responseOrderDocumented: true,
    });
  });

  it('separates returned writing samples from calculated conclusions', (): void => {
    expect.assertions(1);

    expect({
      analyticsBoundaryDocumented:
        /Compare Styles returns no likes, replies, reposts, quotes, bookmarks, views,\s+followers, or impressions\./u.test(
          source,
        ),
      calculationDenied: source.includes(
        'It does not contact X, refresh\ntweets, or calculate a writing-style score.',
      ),
      observableReviewDocumented: source.includes(
        'Use observable text features before assigning subjective labels:',
      ),
      toneOutputDenied:
        /It does not\s+generate conclusions about voice, tone, vocabulary, readability, or sentiment\./u.test(
          source,
        ),
    }).toStrictEqual({
      analyticsBoundaryDocumented: true,
      calculationDenied: true,
      observableReviewDocumented: true,
      toneOutputDenied: true,
    });
  });

  it('uses measured and tightly related tweet-writing language', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      focusedTitle: frontmatter.includes(
        'Compare 2 cached tweet writing profiles with Xquik',
      ),
      keywordsPresent: [
        'tweet writing',
        'compare tweet styles',
        'Twitter writing style',
        'X brand voice',
        'tweet writing samples',
      ].every((keyword) => frontmatter.includes(keyword)),
      unsupportedDescriptionSignals:
        /tone|vocabulary|engagement signals/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      unsupportedDescriptionSignals: false,
    });
  });

  it('remains synchronized with the optional product implementation', (): void => {
    expect.assertions(1);

    const route = readProductFile('app/api/v1/styles/compare/route.ts');
    const query = readProductFile('lib/api/style-cache-query.ts');

    expect({
      missingParamsRemain400:
        route === undefined ||
        (route.includes("error: 'missing_params'") &&
          route.includes('{ status: 400 }')),
      parallelLookupsRemainAccountScoped:
        route === undefined ||
        (route.includes('queryStyleDetail(auth.userId, username1)') &&
          route.includes('queryStyleDetail(auth.userId, username2)')),
      queryRemainsLowercase:
        query === undefined ||
        query.includes('const normalizedUsername = username.toLowerCase()'),
      responseOrderRemainsStable:
        route === undefined ||
        (route.includes('style1: formatStyleDetail(row1)') &&
          route.includes('style2: formatStyleDetail(row2)')),
      styleNotFoundRemains404:
        route === undefined ||
        (route.includes("error: 'style_not_found'") &&
          route.includes('{ status: 404 }')),
    }).toStrictEqual({
      missingParamsRemain400: true,
      parallelLookupsRemainAccountScoped: true,
      queryRemainsLowercase: true,
      responseOrderRemainsStable: true,
      styleNotFoundRemains404: true,
    });
  });
});
