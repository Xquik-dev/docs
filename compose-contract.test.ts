import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

const COMPOSE_PAGE = read('api-reference/compose/create.mdx');
const OPENAPI = read('openapi.yaml');
const RELATED_GUIDES = [
  read('index.mdx'),
  read('skill.md'),
  read('mcp/tools.mdx'),
  read('guides/types.mdx'),
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
});
