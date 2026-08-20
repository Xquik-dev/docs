import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const productRoot =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];
const source = readFileSync(
  new URL('api-reference/styles/save.mdx', import.meta.url),
  'utf8',
);

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, 'utf8');
}

describe('save custom tweet style documentation', (): void => {
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
      responseTabs: ['200', '400', '401', '429'],
    });
  });

  it('documents the exact saved custom profile response', (): void => {
    expect.assertions(1);

    expect({
      customExampleCorrect:
        source.includes('"xUsername": "professional voice"') &&
        source.includes('"isOwnAccount": false') &&
        source.includes('"authorUsername": "professional voice"'),
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
      xTweetIdDenied: source.includes('This is not an X Tweet ID.'),
    }).toStrictEqual({
      customExampleCorrect: true,
      nestedFields: true,
      topLevelFields: true,
      xTweetIdDenied: true,
    });
  });

  it('explains body-label storage and full-array replacement', (): void => {
    expect.assertions(1);

    expect({
      bodyControlsKey: source.includes(
        'The body `label` controls the stored profile key.',
      ),
      mismatchNotReconciled: source.includes(
        'The current PUT route does not reconcile `{id}` with `label`.',
      ),
      replacementIsComplete: source.includes(
        'Sending the same label replaces the entire saved Tweet array.',
      ),
      renameDenied: source.includes(
        'Changing only the path `{id}` does not rename a profile.',
      ),
    }).toStrictEqual({
      bodyControlsKey: true,
      mismatchNotReconciled: true,
      replacementIsComplete: true,
      renameDenied: true,
    });
  });

  it('documents input limits and every validation branch', (): void => {
    expect.assertions(1);

    expect({
      blankTweetRejected: source.includes(
        '| Missing, non-string, or blank `text` | Send non-empty text for every object. |',
      ),
      labelLimit: source.includes('Profile label containing 1-50 characters.'),
      sampleLimit: source.includes(
        'Complete array of 1-100 approved Tweet examples.',
      ),
      underscoreBehavior: source.includes(
        'The validator also accepts underscores.',
      ),
    }).toStrictEqual({
      blankTweetRejected: true,
      labelLimit: true,
      sampleLimit: true,
      underscoreBehavior: true,
    });
  });

  it('uses focused tweet-writing language without invented analysis', (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf('---', 4) + 3);

    expect({
      focusedTitle: frontmatter.includes(
        'Save tweet writing samples for a reusable X style',
      ),
      keywordsPresent: [
        'tweet writing',
        'save tweet style',
        'Twitter writing style',
        'X brand voice',
        'tweet writing samples',
      ].every((keyword) => frontmatter.includes(keyword)),
      unsupportedDescriptionSignals:
        /tone|vocabulary|sentiment|engagement/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      unsupportedDescriptionSignals: false,
    });
  });

  it('remains synchronized with the optional product implementation', (): void => {
    expect.assertions(1);

    const compose = readProductFile('lib/compose/handler.ts');
    const constants = readProductFile('lib/styles/constants.ts');
    const route = readProductFile('app/api/v1/styles/[id]/route.ts');
    const validator = readProductFile('lib/styles/validate-label.ts');
    const putRoute =
      route === undefined
        ? undefined
        : route.slice(route.indexOf('export async function PUT'));

    expect({
      bodyLabelRemainsKey:
        putRoute === undefined ||
        putRoute.includes('const label = body.label.trim().toLowerCase()'),
      composeReturnsSavedSamples:
        compose === undefined ||
        compose.includes('return { ...result, styleTweets: [...style.tweets] }'),
      pathRemainsUnreconciled:
        putRoute === undefined ||
        (putRoute.includes('await params;') &&
          !putRoute.includes('const { id') &&
          !putRoute.includes('body.label ===')),
      replacementRemainsAccountScoped:
        putRoute === undefined ||
        (putRoute.includes(
          'target: [tweetStyleCache.userId, tweetStyleCache.xUsername]',
        ) && putRoute.includes('.onConflictDoUpdate({')),
      sampleIdsRemainLocal:
        putRoute === undefined || putRoute.includes('id: String(index)'),
      sampleLimitRemains100:
        constants === undefined || constants.includes('MAX_STYLE_TWEETS = 100'),
      underscoresRemainAccepted:
        validator === undefined || validator.includes('const LABEL_PATTERN = /^\\w'),
    }).toStrictEqual({
      bodyLabelRemainsKey: true,
      composeReturnsSavedSamples: true,
      pathRemainsUnreconciled: true,
      replacementRemainsAccountScoped: true,
      sampleIdsRemainLocal: true,
      sampleLimitRemains100: true,
      underscoresRemainAccepted: true,
    });
  });
});
