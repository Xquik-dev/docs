import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const productRoot =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];
const source = readFileSync(
  new URL('api-reference/styles/analyze.mdx', import.meta.url),
  'utf8',
);

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, 'utf8');
}

describe('analyze tweet writing style documentation', (): void => {
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
      responseTabs: ['200', '201', '400', '401', '402', '429'],
    });
  });

  it('documents every cache branch and its billing result', (): void => {
    expect.assertions(1);

    expect({
      freshCache200: source.includes(
        '| `200` | Profile is under 7 days old | No | Free cached response |',
      ),
      refresh201: source.includes(
        '| `201` | Profile is missing or older and refresh is funded | Yes | 1 credit per returned Tweet |',
      ),
      staleFallback200: source.includes(
        '| `200` | Profile is older, but refresh cannot be funded | No | Existing stale cache returned |',
      ),
      unfundedMissing402: source.includes(
        '| `402` | No cache exists and refresh cannot be funded | No | `no_cached_style` returned |',
      ),
    }).toStrictEqual({
      freshCache200: true,
      refresh201: true,
      staleFallback200: true,
      unfundedMissing402: true,
    });
  });

  it('documents source samples without inventing generated analysis fields', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      derivedSignalsDenied:
        /It does not generate a tone\s+label, vocabulary summary, sentence score, or engagement analysis\./u.test(
          source,
        ),
      mediaContractDenied: source.includes(
        'The public Style Profile contract does not include cached media objects.',
      ),
      supportedTweetFields: [
        'id',
        'text',
        'authorUsername',
        'createdAt',
      ].every((field) => source.includes(`<ResponseField name="${field}"`)),
      unsupportedMetadataClaims:
        /tone|vocabulary|engagement/iu.test(frontmatter),
    }).toStrictEqual({
      derivedSignalsDenied: true,
      mediaContractDenied: true,
      supportedTweetFields: true,
      unsupportedMetadataClaims: false,
    });
  });

  it('uses focused tweet-writing phrases from the supplied research', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      focusedTitle: frontmatter.includes(
        'Tweet writing style API for cached X profile samples',
      ),
      keywordsPresent: [
        'tweet writing',
        'Twitter writing style',
        'X writing style',
        'tweet writing samples',
        'Twitter brand voice',
      ].every((keyword) => frontmatter.includes(keyword)),
      vagueDescription: /data|details|information/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      vagueDescription: false,
    });
  });

  it('remains synchronized with the optional product implementation', (): void => {
    expect.assertions(1);

    const parser = readProductFile('lib/api/parse-username-body.ts');
    const route = readProductFile('app/api/v1/styles/route.ts');

    expect({
      existingCacheCanReturn200:
        route === undefined ||
        route.includes('NextResponse.json(formatStyleDetail(existing))'),
      refreshRemains201:
        route === undefined || route.includes('styleUpsertResponse(upserted, 201)'),
      refreshUsesUsernameSearch:
        route === undefined || route.includes('searchTweets(`from:${username}`)'),
      unfundedMissingReturns402:
        route === undefined ||
        (route.includes("error: 'no_cached_style'") &&
          route.includes('{ status: 402 }')),
      usernameRemainsLowercase:
        parser === undefined || parser.includes("body['username'].toLowerCase()"),
      usageMatchesReturnedTweets:
        route === undefined ||
        route.includes(
          'cost: CREDIT_COST_READ * BigInt(result.tweets.length)',
        ),
    }).toStrictEqual({
      existingCacheCanReturn200: true,
      refreshRemains201: true,
      refreshUsesUsernameSearch: true,
      unfundedMissingReturns402: true,
      usernameRemainsLowercase: true,
      usageMatchesReturnedTweets: true,
    });
  });
});
