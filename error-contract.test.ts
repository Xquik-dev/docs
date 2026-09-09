import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface SchemaNode {
  readonly enum?: readonly string[];
  readonly oneOf?: readonly SchemaNode[];
  readonly properties?: Readonly<Record<string, SchemaNode>>;
  readonly title?: string;
}

interface OpenApiDocument {
  readonly components?: Readonly<{
    readonly schemas?: Readonly<Record<string, SchemaNode>>;
  }>;
}

function parseOpenApi(): OpenApiDocument {
  return Bun.YAML.parse(readFileSync("openapi.yaml", "utf8")) as OpenApiDocument;
}

function requireErrorEnum(title: string, property?: string): readonly string[] {
  const variants = parseOpenApi().components?.schemas?.["Error"]?.properties?.["error"]?.oneOf;
  const variant = variants?.find((candidate) => candidate.title === title);
  if (variant === undefined) {
    throw new Error(`OpenAPI Error is missing ${title}.`);
  }
  const values = (property === undefined ? variant : variant.properties?.[property])?.enum;
  if (values === undefined) {
    const label = property === undefined ? title : `${title}.${property}`;
    throw new Error(`${label} is missing its enum.`);
  }
  return values;
}

describe("public error contract", (): void => {
  it("documents only canonical OpenAPI error codes", (): void => {
    expect.assertions(10);

    const guide = readFileSync("guides/error-handling.mdx", "utf8");
    const legacyCodes = requireErrorEnum("LegacyErrorCode");
    const structuredCodes = requireErrorEnum("StructuredError", "code");
    const documentedCodes = [...guide.matchAll(/<Card title="([a-z][a-z0-9_]+)"/gu)]
      .map((match): string => match[1] ?? "")
      .filter((code): boolean => code !== "");
    const canonicalCodes = new Set(legacyCodes);

    expect(structuredCodes).toStrictEqual(legacyCodes);
    expect(documentedCodes.length).toBeGreaterThan(0);
    expect(new Set(documentedCodes).size).toBe(documentedCodes.length);
    expect(documentedCodes.filter((code): boolean => !canonicalCodes.has(code))).toStrictEqual([]);
    expect(guide).toContain("schema lists every public code.");
    expect(guide).not.toMatch(/no_addon|monitor_limit_reached/u);
    expect(documentedCodes).toContain("x_reply_not_allowed");
    expect(guide).toContain("Target is missing or invisible to the connected X account.");
    const createGuide = readFileSync("api-reference/x-write/create-tweet.mdx", "utf8");
    expect(createGuide).toContain("`x_target_not_found`");
    expect(createGuide).toContain("`x_reply_not_allowed`");
  });

  it("keeps copied TypeScript error types aligned with OpenAPI", (): void => {
    expect.assertions(3);

    const source = readFileSync("guides/x-api-typescript-types.mdx", "utf8");
    const typeBlock = source.match(/type ApiErrorType =([\s\S]*?);/u)?.[1];
    if (typeBlock === undefined) {
      throw new Error("guides/x-api-typescript-types.mdx is missing ApiErrorType.");
    }
    const documentedTypes = [...typeBlock.matchAll(/"([a-z_]+)"/gu)].map(
      (match): string => match[1] ?? "",
    );
    const canonicalTypes = requireErrorEnum("StructuredError", "type");

    expect(documentedTypes).toStrictEqual(canonicalTypes);
    expect(source).toContain("error: string | StructuredApiError;");
    expect(source).not.toMatch(/no_addon|monitor_limit_reached/u);
  });
});
