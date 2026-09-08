import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const API_REFERENCE_DIR = join(PROJECT_ROOT, "api-reference");
const FRONTMATTER_API_PATTERN = /^api:\s*"([A-Z]+) ([^"]+)"/mu;
const MDX_IMPORT_PATTERN = /^import\s+\w+\s+from\s+"(\/[^"\n]+\.mdx)";$/gmu;

interface ApiDoc {
  readonly file: string;
  readonly method: string;
  readonly path: string;
  readonly source: string;
}

interface DocumentedField {
  readonly name: string;
  readonly required: boolean;
}

interface FieldFinding {
  readonly file: string;
  readonly field: string;
  readonly issue: string;
  readonly kind: "body" | "path" | "query";
  readonly operation: string;
}

interface DocumentedOperationField {
  readonly field: string;
  readonly method: string;
  readonly path: string;
}

interface OpenApiParameter {
  readonly $ref?: string;
  readonly in?: string;
  readonly name?: string;
  readonly required?: boolean;
  readonly schema?: OpenApiSchema;
}

interface OpenApiRequestBody {
  readonly content?: Record<string, { readonly schema?: OpenApiSchema }>;
}

interface OpenApiOperation {
  readonly parameters?: readonly OpenApiParameter[];
  readonly requestBody?: OpenApiRequestBody;
}

interface OpenApiSchema {
  readonly $ref?: string;
  readonly allOf?: readonly OpenApiSchema[];
  readonly anyOf?: readonly OpenApiSchema[];
  readonly oneOf?: readonly OpenApiSchema[];
  readonly properties?: Record<string, OpenApiSchema>;
  readonly required?: readonly string[];
  readonly type?: string;
  readonly minimum?: number;
  readonly maximum?: number;
}

interface OpenApiSpec {
  readonly components?: {
    readonly parameters?: Record<string, OpenApiParameter>;
    readonly schemas?: Record<string, OpenApiSchema>;
  };
  readonly paths?: Record<string, Record<string, OpenApiOperation>>;
}

interface SchemaFields {
  readonly properties: readonly string[];
  readonly required: readonly string[];
}

function parseYaml(source: string): OpenApiSpec {
  return Bun.YAML.parse(source) as OpenApiSpec;
}

function listApiReferenceFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listApiReferenceFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith(".mdx")) {
      files.push(relative(PROJECT_ROOT, fullPath));
    }
  }
  return files.sort();
}

function readApiDocs(): readonly ApiDoc[] {
  return listApiReferenceFiles(API_REFERENCE_DIR).flatMap((file) => {
    const source = readFileSync(join(PROJECT_ROOT, file), "utf8");
    const match = FRONTMATTER_API_PATTERN.exec(source);
    if (match?.[1] === undefined || match[2] === undefined) {
      return [];
    }
    return [
      {
        file,
        method: match[1].toLowerCase(),
        path: match[2],
        source: expandMdxImports(source),
      },
    ];
  });
}

function expandMdxImports(source: string, importedFiles = new Set<string>()): string {
  const imports = [...source.matchAll(MDX_IMPORT_PATTERN)].flatMap((match): readonly string[] => {
    const importedPath = match[1];
    if (importedPath === undefined || importedFiles.has(importedPath)) {
      return [];
    }
    importedFiles.add(importedPath);
    const importedSource = readFileSync(join(PROJECT_ROOT, importedPath.slice(1)), "utf8");
    return [expandMdxImports(importedSource, importedFiles)];
  });
  return [source, ...imports].join("\n");
}

function documentedFields(
  source: string,
  kind: "body" | "path" | "query",
): readonly DocumentedField[] {
  const pattern = new RegExp(`<ParamField\\s+${kind}="([^"]+)"([^>]*)>`, "gu");
  return [...source.matchAll(pattern)].map((match): DocumentedField => ({
    name: match[1] ?? "",
    required: /\srequired(?:\s|>|$)/u.test(match[2] ?? ""),
  }));
}

function operationKey(apiDoc: ApiDoc): string {
  return `${apiDoc.method.toUpperCase()} ${apiDoc.path}`;
}

function resolveReference<T>(spec: OpenApiSpec, value: T & { readonly $ref?: string }): T {
  if (value.$ref === undefined) {
    return value;
  }
  const [, section, kind, name] = value.$ref.split("/");
  if (section !== "components" || name === undefined) {
    throw new Error(`Unsupported OpenAPI reference: ${value.$ref}`);
  }
  if (kind === "parameters") {
    return spec.components?.parameters?.[name] as T;
  }
  if (kind === "schemas") {
    return spec.components?.schemas?.[name] as T;
  }
  throw new Error(`Unsupported OpenAPI reference: ${value.$ref}`);
}

function schemaFields(
  spec: OpenApiSpec,
  schema: OpenApiSchema | undefined,
  seenRefs = new Set<string>(),
): SchemaFields {
  if (schema === undefined) {
    return { properties: [], required: [] };
  }
  if (schema.$ref !== undefined) {
    if (seenRefs.has(schema.$ref)) {
      return { properties: [], required: [] };
    }
    seenRefs.add(schema.$ref);
    return schemaFields(spec, resolveReference(spec, schema), seenRefs);
  }
  const composedFields = (schema.allOf ?? []).map((item): SchemaFields =>
    schemaFields(spec, item, seenRefs),
  );
  const variantFields = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].map(
    (item): SchemaFields => schemaFields(spec, item, seenRefs),
  );
  return {
    properties: [
      ...new Set([
        ...Object.keys(schema.properties ?? {}),
        ...composedFields.flatMap((item) => item.properties),
        ...variantFields.flatMap((item) => item.properties),
      ]),
    ],
    required: [
      ...new Set([
        ...(schema.required ?? []),
        ...composedFields.flatMap((item) => item.required),
        ...intersect(variantFields.map((item) => item.required)),
      ]),
    ],
  };
}

function intersect(groups: readonly (readonly string[])[]): readonly string[] {
  if (groups.length === 0) {
    return [];
  }
  const [first = [], ...rest] = groups;
  return first.filter((item): boolean => rest.every((group): boolean => group.includes(item)));
}

function requestBodyFields(spec: OpenApiSpec, operation: OpenApiOperation): SchemaFields {
  const content = Object.values(operation.requestBody?.content ?? {});
  const contentFields = content.map((entry): SchemaFields => schemaFields(spec, entry.schema));
  return {
    properties: [...new Set(contentFields.flatMap((item) => item.properties))],
    required: intersect(contentFields.map((item) => item.required)),
  };
}

function openApiParameters(
  spec: OpenApiSpec,
  operation: OpenApiOperation,
  kind: "path" | "query",
): readonly OpenApiParameter[] {
  return (operation.parameters ?? [])
    .map((parameter): OpenApiParameter => resolveReference(spec, parameter))
    .filter((parameter): boolean => parameter.in === kind && parameter.name !== undefined)
    .sort((left, right): number => (left.name ?? "").localeCompare(right.name ?? ""));
}

function collectFieldFindings(spec: OpenApiSpec): readonly FieldFinding[] {
  const findings: FieldFinding[] = [];
  for (const apiDoc of readApiDocs()) {
    const operation = spec.paths?.[apiDoc.path]?.[apiDoc.method];
    if (operation === undefined) {
      findings.push({
        field: apiDoc.path,
        file: apiDoc.file,
        issue: "API reference frontmatter does not match openapi.yaml.",
        kind: "path",
        operation: operationKey(apiDoc),
      });
      continue;
    }

    const bodyFields = requestBodyFields(spec, operation);
    for (const kind of ["path", "query", "body"] as const) {
      const docs = documentedFields(apiDoc.source, kind);
      const fields: readonly DocumentedField[] =
        kind === "body"
          ? bodyFields.properties.map((name): DocumentedField => ({
              name,
              required: bodyFields.required.includes(name),
            }))
          : openApiParameters(spec, operation, kind).map((parameter): DocumentedField => ({
              name: parameter.name ?? "",
              required: parameter.required === true,
            }));
      const noun = kind === "body" ? "body field" : "parameter";
      for (const field of fields) {
        const documented = docs.find((entry): boolean => entry.name === field.name);
        if (documented === undefined) {
          findings.push({
            field: field.name,
            file: apiDoc.file,
            issue: `OpenAPI ${noun} is not documented.`,
            kind,
            operation: operationKey(apiDoc),
          });
        } else if (field.required && !documented.required) {
          findings.push({
            field: field.name,
            file: apiDoc.file,
            issue: `Required OpenAPI ${noun} lacks the required marker.`,
            kind,
            operation: operationKey(apiDoc),
          });
        }
      }
      if (kind === "body") continue;
      for (const documented of docs) {
        if (!fields.some((field): boolean => field.name === documented.name)) {
          findings.push({
            field: documented.name,
            file: apiDoc.file,
            issue: "Documented parameter is absent from OpenAPI.",
            kind,
            operation: operationKey(apiDoc),
          });
        }
      }
    }
  }
  return findings;
}

function collectDocumentedRequestBodyFieldFindings(
  spec: OpenApiSpec,
  expectedFields: readonly DocumentedOperationField[],
): readonly FieldFinding[] {
  const apiDocs = readApiDocs();
  const findings: FieldFinding[] = [];

  for (const expected of expectedFields) {
    const apiDoc = apiDocs.find(
      (doc): boolean => doc.method === expected.method && doc.path === expected.path,
    );
    const operation = spec.paths?.[expected.path]?.[expected.method];
    const operationLabel = `${expected.method.toUpperCase()} ${expected.path}`;

    if (apiDoc === undefined || operation === undefined) {
      findings.push({
        field: expected.field,
        file: apiDoc?.file ?? expected.path,
        issue: "API reference frontmatter does not match openapi.yaml.",
        kind: "body",
        operation: operationLabel,
      });
      continue;
    }

    if (!requestBodyFields(spec, operation).properties.includes(expected.field)) {
      findings.push({
        field: expected.field,
        file: apiDoc.file,
        issue: "Expected OpenAPI field is missing.",
        kind: "body",
        operation: operationLabel,
      });
    }

    const docsFields = documentedFields(apiDoc.source, "body");
    if (!docsFields.some((field): boolean => field.name === expected.field)) {
      findings.push({
        field: expected.field,
        file: apiDoc.file,
        issue: "Expected API reference field is missing.",
        kind: "body",
        operation: operationLabel,
      });
    }
  }

  return findings;
}

describe("API reference request fields", (): void => {
  it("documents every OpenAPI path, query, and body field", (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8"));
    expect(collectFieldFindings(spec)).toStrictEqual([]);
  });
});

describe("API reference cost-control fields", (): void => {
  it("keeps complete reply limits editable above and below the default", (): void => {
    expect.assertions(3);
    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8"));
    const limit = spec.paths?.["/x/tweets/{id}/replies"]?.get?.parameters?.find(
      (parameter) => parameter.in === "query" && parameter.name === "limit",
    );
    expect(limit?.schema).toStrictEqual({ type: "integer", minimum: 1 });
    const replies = readFileSync("api-reference/x/tweet-replies.mdx", "utf8");
    expect(replies).toContain("Set a smaller or larger total with `limit`, starting at `1`.");
    expect(replies).toContain(
      "Complete mode defaults to `25000` combined direct and nested replies.",
    );
  });

  it("keeps extraction resultsLimit documented and present in OpenAPI", (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8"));
    expect(
      collectDocumentedRequestBodyFieldFindings(spec, [
        {
          field: "resultsLimit",
          method: "post",
          path: "/extractions",
        },
        {
          field: "resultsLimit",
          method: "post",
          path: "/extractions/estimate",
        },
      ]),
    ).toStrictEqual([]);
  });
});
