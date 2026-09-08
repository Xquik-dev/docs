import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { stripGeneratedResponseExamples } from "./scripts/lib/generated-response-examples";

const ROOT = process.cwd();
const PRODUCT_ROOT = process.env["XQUIK_PRODUCT_ROOT"] ?? process.env["XQUIK_ROOT"];

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readProductFile(relativePath: string): string | undefined {
  if (PRODUCT_ROOT === undefined) return undefined;
  return readFileSync(join(PRODUCT_ROOT, relativePath), "utf8");
}

const COMPOSE_PAGE = stripGeneratedResponseExamples(read("api-reference/compose/create.mdx"));
const OPENAPI = read("openapi.yaml");
const RELATED_GUIDES = [
  read("index.mdx"),
  read("skill.md"),
  read("mcp/tools.mdx"),
  read("guides/x-api-typescript-types.mdx"),
].join("\n");

const REQUIRED_PAGE_COPY = [
  "Returns 10 source facts and 4 follow-up questions.",
  '<ResponseField name="radarRecommendations" type="object[]" required>',
  "Deprecated compatibility field. Always empty.",
  "Checks that the draft contains text.",
  "Runs one deterministic input check.",
  "Ranking stays viewer-specific.",
  "Every `weight` is `null`.",
  "`hasLink` and the deprecated `hasMedia` field remain accepted. Validation",
  "`xai-org/x-algorithm`",
  '"totalChecks": 1',
] as const;

const FOCUSED_COMPOSER_COPY = [
  'title: "Tweet composer API with X algorithm guidance"',
  '"tweet composer"',
  '"how to write a good tweet"',
  "OAuth bearer token using `Bearer YOUR_TOKEN`.",
  '<ResponseField name="contentRules[].rule" type="string" required>',
  '<ResponseField name="engagementMultipliers[].action" type="string" required>',
  '<ResponseField name="scorerWeights[].weight" type="null" required>',
  '<ResponseField name="checklist[].suggestion" type="string">',
  '<ResponseField name="passedCount" type="integer" required>',
  "Missing style without available credits | 200 response with `styleNote`",
  "Missing style with available credits | 400 `invalid_input`",
  "Analyze the username with `POST /api/v1/styles`",
  "It never returns finished Tweet text.",
  "It never predicts likes, replies,\nreposts, bookmarks, profile visits, or follower growth.",
] as const;

const FORBIDDEN_COMPOSE_COPY = [
  "algorithm-optimized",
  "against X ranking factors",
  "Algorithm scorer weights",
  "First 30 minutes are critical",
  "External links reduce reach",
  '"multiplier": "1.5x"',
  '"weight": 2',
  '"totalChecks": 11',
  "9 deterministic",
  "7 `radarRecommendations`",
  "3 example patterns",
  "Conversation-driving CTA",
  '"factor": "Media attached"',
  "Optimal length (50-280 characters)",
  "session cookie",
] as const;

describe("compose documentation contract", (): void => {
  it("documents the current workflow without ranking promises", (): void => {
    expect.assertions(REQUIRED_PAGE_COPY.length + 1);

    for (const snippet of REQUIRED_PAGE_COPY) {
      expect(COMPOSE_PAGE).toContain(snippet);
    }
    expect(COMPOSE_PAGE.match(/"factor":/gu)).toHaveLength(1);
  });

  it("rejects retired compose claims and fields", (): void => {
    expect.assertions(FORBIDDEN_COMPOSE_COPY.length);

    const allCopy = `${COMPOSE_PAGE}\n${RELATED_GUIDES}`;
    for (const snippet of FORBIDDEN_COMPOSE_COPY) {
      expect(allCopy).not.toContain(snippet);
    }
  });

  it("locks focused writing guidance and exact response details", (): void => {
    expect.assertions(1);
    const normalizedPage = COMPOSE_PAGE.replace(/\s+/gu, " ");

    expect(
      FOCUSED_COMPOSER_COPY.filter(
        (snippet: string): boolean => !normalizedPage.includes(snippet.replace(/\s+/gu, " ")),
      ),
    ).toEqual([]);
  });

  it("locks the OpenAPI variants and source-backed counts", (): void => {
    expect.assertions(14);

    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposePrepareRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeRefineRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeScoreRequest'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposePrepareResult'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeRefineResult'");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeScoreResult'");
    expect(OPENAPI).toContain("ComposeRadarRecommendation:");
    expect(OPENAPI).toContain("$ref: '#/components/schemas/ComposeRadarRecommendation'");
    expect(OPENAPI).toMatch(/contentRules:[\s\S]*?minItems: 10[\s\S]*?maxItems: 10/gu);
    expect(OPENAPI).toMatch(/radarRecommendations:[\s\S]*?minItems: 0[\s\S]*?maxItems: 0/gu);
    expect(OPENAPI).toMatch(/engagementMultipliers:[\s\S]*?minItems: 26[\s\S]*?maxItems: 26/gu);
    expect(OPENAPI).toMatch(/scorerWeights:[\s\S]*?minItems: 26[\s\S]*?maxItems: 26/gu);
    expect(OPENAPI).toContain("Null prevents source defaults becoming production claims.");
    expect(OPENAPI).toMatch(/ComposeScoreResult:[\s\S]*?const: 1/gu);
  });

  it("remains synchronized with draft validation and style lookup", (): void => {
    expect.assertions(1);

    const handler = readProductFile("lib/compose/handler.ts");
    const scorer = readProductFile("lib/mcp/tweet-composer/score.ts");

    expect({
      oneTextCheck:
        scorer === undefined ||
        (scorer.includes("factor: 'Draft contains text'") && scorer.includes("totalChecks: 1")),
      sourceLimit: scorer === undefined || scorer.includes("Ranking uses per-viewer predictions."),
      styleFallbackReturns200:
        handler === undefined || (handler.includes("...result,") && handler.includes("styleNote:")),
      styleLookupCanReturn400:
        handler === undefined ||
        handler.includes("Call POST /api/v1/styles with the username to analyze first."),
      successfulStyleReturnsTweets:
        handler === undefined ||
        handler.includes("return { ...result, styleTweets: [...style.tweets] };"),
    }).toStrictEqual({
      oneTextCheck: true,
      sourceLimit: true,
      styleFallbackReturns200: true,
      styleLookupCanReturn400: true,
      successfulStyleReturnsTweets: true,
    });
  });
});
