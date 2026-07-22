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
  const runtime = globalThis as unknown as Readonly<{
    readonly Bun?: Readonly<{
      readonly YAML?: Readonly<{
        readonly parse: (source: string) => unknown;
      }>;
    }>;
  }>;
  const parse = runtime.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error("Bun.YAML.parse is required for error contract tests.");
  }
  return parse(readFileSync("openapi.yaml", "utf8")) as OpenApiDocument;
}

function requireErrorVariant(title: string): SchemaNode {
  const variants = parseOpenApi().components?.schemas?.["Error"]?.properties?.[
    "error"
  ]?.oneOf;
  const variant = variants?.find((candidate) => candidate.title === title);
  if (variant === undefined) {
    throw new Error(`OpenAPI Error is missing ${title}.`);
  }
  return variant;
}

function requireEnum(node: SchemaNode, label: string): readonly string[] {
  if (node.enum === undefined) {
    throw new Error(`${label} is missing its enum.`);
  }
  return node.enum;
}

describe("public error contract", (): void => {
  it("documents only canonical OpenAPI error codes", (): void => {
    expect.assertions(6);

    const guide = readFileSync("guides/error-handling.mdx", "utf8");
    const legacyCodes = requireEnum(
      requireErrorVariant("LegacyErrorCode"),
      "LegacyErrorCode",
    );
    const structuredCodes = requireEnum(
      requireErrorVariant("StructuredError").properties?.["code"] ?? {},
      "StructuredError.code",
    );
    const documentedCodes = [...guide.matchAll(/<Card title="([a-z][a-z0-9_]+)"/gu)]
      .map((match): string => match[1] ?? "")
      .filter((code): boolean => code !== "");
    const canonicalCodes = new Set(legacyCodes);

    expect(structuredCodes).toStrictEqual(legacyCodes);
    expect(documentedCodes.length).toBeGreaterThan(0);
    expect(new Set(documentedCodes).size).toBe(documentedCodes.length);
    expect(
      documentedCodes.filter((code): boolean => !canonicalCodes.has(code)),
    ).toStrictEqual([]);
    expect(guide).toContain("schema lists every public code.");
    expect(guide).not.toMatch(/no_addon|monitor_limit_reached/u);
  });

  it("keeps copied TypeScript error types aligned with OpenAPI", (): void => {
    expect.assertions(3);

    const source = readFileSync("guides/types.mdx", "utf8");
    const typeBlock = source.match(/type ApiErrorType =([\s\S]*?);/u)?.[1];
    if (typeBlock === undefined) {
      throw new Error("guides/types.mdx is missing ApiErrorType.");
    }
    const documentedTypes = [...typeBlock.matchAll(/"([a-z_]+)"/gu)].map(
      (match): string => match[1] ?? "",
    );
    const canonicalTypes = requireEnum(
      requireErrorVariant("StructuredError").properties?.["type"] ?? {},
      "StructuredError.type",
    );

    expect(documentedTypes).toStrictEqual(canonicalTypes);
    expect(source).toContain("error: string | StructuredApiError;");
    expect(source).not.toMatch(/no_addon|monitor_limit_reached/u);
  });
});
