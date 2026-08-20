import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  stripGeneratedResponseExamples,
} from './scripts/lib/generated-response-examples';

const ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? process.env['XQUIK_ROOT'];

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function readProductFile(relativePath: string): string | undefined {
  if (PRODUCT_ROOT === undefined) return undefined;
  return readFileSync(join(PRODUCT_ROOT, relativePath), 'utf8');
}

const COMPOSE_PAGE = stripGeneratedResponseExamples(
  read('api-reference/compose/create.mdx'),
);
const OPENAPI = read('openapi.yaml');
const RELATED_GUIDES = [
  read('index.mdx'),
  read('skill.md'),
  read('mcp/tools.mdx'),
  read('guides/x-api-typescript-types.mdx'),
].join('\n');

const REQUIRED_PAGE_COPY = [
  'Returns 18 editorial rules, 4 follow-up questions, and 7 source-specific',
  '<ResponseField name="radarRecommendations" type="object[]" required>',
  '<ResponseField name="radarRecommendations[].endpoint" type="string" required>',
  'Optional Radar research guidance and exact fields required for `refine`.',
  'Runs 9 deterministic text checks.',
  'It does not predict reach.',
  'production ranking weights.',
  'Every `weight` is `null`.',
  'The deprecated\n    `hasMedia` field remains accepted. Text checks ignore it.',
  'These are Xquik style checks. They are not X ranking guarantees.',
  '"totalChecks": 9',
] as const;

const FOCUSED_COMPOSER_COPY = [
  'title: "Tweet composer API, writing rules & 9 draft checks"',
  '"tweet composer"',
  '"how to write a good tweet"',
  'OAuth bearer token using `Bearer YOUR_TOKEN`.',
  'Uppercase letters are at most 30% of letters',
  'The draft contains 50 through 280 characters',
  'No run contains 4 consecutive `!` or `?` marks',
  'At least 8 words remain after removing URLs, hashtags, and mentions',
  'The endpoint has no\nper-check disable switch.',
  '<ResponseField name="contentRules[].rule" type="string" required>',
  '<ResponseField name="engagementMultipliers[].action" type="string" required>',
  '<ResponseField name="scorerWeights[].weight" type="null" required>',
  '<ResponseField name="examplePatterns[].pattern" type="string" required>',
  '<ResponseField name="checklist[].suggestion" type="string">',
  '<ResponseField name="passedCount" type="integer" required>',
  'Missing style without available credits | 200 response with `styleNote`',
  'Missing style with available credits | 400 `invalid_input`',
  'Analyze the username with `POST /api/v1/styles`',
  'It never returns finished Tweet text.',
  'It cannot predict likes,\nreplies, reposts, bookmarks, profile visits, or follower growth.',
] as const;

const FORBIDDEN_COMPOSE_COPY = [
  'algorithm-optimized',
  'against X ranking factors',
  'Algorithm scorer weights',
  'First 30 minutes are critical',
  'External links reduce reach',
  '"multiplier": "1.5x"',
  '"weight": 2',
  '"totalChecks": 11',
  'Conversation-driving CTA',
  '"factor": "Media attached"',
  'Optimal length (50-280 characters)',
  'session cookie',
] as const;

describe('compose documentation contract', (): void => {
  it('documents the current workflow without ranking promises', (): void => {
    expect.assertions(REQUIRED_PAGE_COPY.length + 1);

    for (const snippet of REQUIRED_PAGE_COPY) {
      expect(COMPOSE_PAGE).toContain(snippet);
    }
    expect(COMPOSE_PAGE.match(/"factor":/gu)).toHaveLength(9);
  });

  it('rejects retired compose claims and fields', (): void => {
    expect.assertions(FORBIDDEN_COMPOSE_COPY.length);

    const allCopy = `${COMPOSE_PAGE}\n${RELATED_GUIDES}`;
    for (const snippet of FORBIDDEN_COMPOSE_COPY) {
      expect(allCopy).not.toContain(snippet);
    }
  });

  it('locks focused writing guidance and exact response details', (): void => {
    expect.assertions(1);

    expect(
      FOCUSED_COMPOSER_COPY.filter(
        (snippet: string): boolean => !COMPOSE_PAGE.includes(snippet),
      ),
    ).toEqual([]);
  });

  it('locks the OpenAPI variants and exact check count', (): void => {
    expect.assertions(11);

    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposePrepareRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeRefineRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeScoreRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposePrepareResult'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeRefineResult'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeScoreResult'");
    expect(OPENAPI).toContain('ComposeRadarRecommendation:');
    expect(OPENAPI).toContain(
      "$ref: '#/components/schemas/ComposeRadarRecommendation'",
    );
    expect(OPENAPI).toMatch(
      /radarRecommendations:[\s\S]*?minItems: 7[\s\S]*?maxItems: 7/gu,
    );
    expect(OPENAPI).toContain('const: Production weight not published by X');
    expect(OPENAPI).toMatch(/ComposeScoreResult:[\s\S]*?const: 9/gu);
  });

  it('remains synchronized with compose scoring and style lookup', (): void => {
    expect.assertions(1);

    const handler = readProductFile('lib/compose/handler.ts');
    const scorer = readProductFile('lib/mcp/tweet-composer/score.ts');

    expect({
      capsThreshold:
        scorer === undefined || scorer.includes('const CAPS_THRESHOLD = 0.3;'),
      characterRange:
        scorer === undefined ||
        (scorer.includes('const MIN_LENGTH = 50;') &&
          scorer.includes('const MAX_LENGTH = 280;')),
      punctuationThreshold:
        scorer === undefined ||
        scorer.includes(
          'const EXCESSIVE_PUNCTUATION_PATTERN = /[!?]{4}/u;',
        ),
      substantiveWordMinimum:
        scorer === undefined ||
        scorer.includes('const MIN_SUBSTANTIVE_WORDS = 8;'),
      styleFallbackReturns200:
        handler === undefined ||
        (handler.includes('...result,') && handler.includes('styleNote:')),
      styleLookupCanReturn400:
        handler === undefined ||
        handler.includes(
          'Call POST /api/v1/styles with the username to analyze first.',
        ),
      successfulStyleReturnsTweets:
        handler === undefined ||
        handler.includes(
          'return { ...result, styleTweets: [...style.tweets] };',
        ),
    }).toStrictEqual({
      capsThreshold: true,
      characterRange: true,
      punctuationThreshold: true,
      substantiveWordMinimum: true,
      styleFallbackReturns200: true,
      styleLookupCanReturn400: true,
      successfulStyleReturnsTweets: true,
    });
  });
});
