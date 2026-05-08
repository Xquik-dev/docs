import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const API_REFERENCE_DIR = join(PROJECT_ROOT, 'api-reference');
const FRONTMATTER_API_PATTERN = /^api:\s*"([A-Z]+) ([^"]+)"/mu;

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
  readonly kind: 'body' | 'path' | 'query';
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
  const bun = globalThis as {
    readonly Bun?: { readonly YAML?: { parse: (yaml: string) => unknown } };
  };
  const parse = bun.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error('Bun.YAML.parse is required for OpenAPI docs tests.');
  }
  return parse(source) as OpenApiSpec;
}

function listApiReferenceFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listApiReferenceFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.mdx')) {
      files.push(relative(PROJECT_ROOT, fullPath));
    }
  }
  return files.sort();
}

function readApiDocs(): readonly ApiDoc[] {
  return listApiReferenceFiles(API_REFERENCE_DIR).flatMap((file) => {
    const source = readFileSync(join(PROJECT_ROOT, file), 'utf8');
    const match = FRONTMATTER_API_PATTERN.exec(source);
    if (match?.[1] === undefined || match[2] === undefined) {
      return [];
    }
    return [
      {
        file,
        method: match[1].toLowerCase(),
        path: match[2],
        source,
      },
    ];
  });
}

function documentedFields(
  source: string,
  kind: 'body' | 'path' | 'query',
): readonly DocumentedField[] {
  const pattern = new RegExp(
    `<ParamField\\s+${kind}="([^"]+)"([^>]*)>`,
    'gu',
  );
  return [...source.matchAll(pattern)].map((match): DocumentedField => ({
    name: match[1] ?? '',
    required: /\srequired(?:\s|>|$)/u.test(match[2] ?? ''),
  }));
}

function operationKey(apiDoc: ApiDoc): string {
  return `${apiDoc.method.toUpperCase()} ${apiDoc.path}`;
}

function resolveReference<T>(
  spec: OpenApiSpec,
  value: T & { readonly $ref?: string },
): T {
  if (value.$ref === undefined) {
    return value;
  }
  const [, section, kind, name] = value.$ref.split('/');
  if (section !== 'components' || name === undefined) {
    throw new Error(`Unsupported OpenAPI reference: ${value.$ref}`);
  }
  if (kind === 'parameters') {
    return spec.components?.parameters?.[name] as T;
  }
  if (kind === 'schemas') {
    return spec.components?.schemas?.[name] as T;
  }
  throw new Error(`Unsupported OpenAPI reference: ${value.$ref}`);
}

function getOperation(
  spec: OpenApiSpec,
  apiDoc: ApiDoc,
): OpenApiOperation | undefined {
  return spec.paths?.[apiDoc.path]?.[apiDoc.method];
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
  if (schema.allOf !== undefined) {
    const schemas = schema.allOf.map((item): SchemaFields =>
      schemaFields(spec, item, seenRefs),
    );
    return {
      properties: [...new Set(schemas.flatMap((item) => item.properties))],
      required: [...new Set(schemas.flatMap((item) => item.required))],
    };
  }
  if (schema.oneOf !== undefined || schema.anyOf !== undefined) {
    const variants = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].map(
      (item): SchemaFields => schemaFields(spec, item, seenRefs),
    );
    return {
      properties: [...new Set(variants.flatMap((item) => item.properties))],
      required: intersect(variants.map((item) => item.required)),
    };
  }
  return {
    properties: Object.keys(schema.properties ?? {}),
    required: [...(schema.required ?? [])],
  };
}

function intersect(groups: readonly (readonly string[])[]): readonly string[] {
  if (groups.length === 0) {
    return [];
  }
  const [first = [], ...rest] = groups;
  return first.filter((item): boolean =>
    rest.every((group): boolean => group.includes(item)),
  );
}

function requestBodyFields(
  spec: OpenApiSpec,
  operation: OpenApiOperation,
): SchemaFields {
  const content = Object.values(operation.requestBody?.content ?? {});
  const contentFields = content.map((entry): SchemaFields =>
    schemaFields(spec, entry.schema),
  );
  return {
    properties: [...new Set(contentFields.flatMap((item) => item.properties))],
    required: intersect(contentFields.map((item) => item.required)),
  };
}

function requiredOpenApiParameters(
  spec: OpenApiSpec,
  operation: OpenApiOperation,
  kind: 'path' | 'query',
): readonly string[] {
  return (operation.parameters ?? [])
    .map((parameter): OpenApiParameter => resolveReference(spec, parameter))
    .filter(
      (parameter): boolean =>
        parameter.in === kind &&
        parameter.required === true &&
        parameter.name !== undefined,
    )
    .map((parameter): string => parameter.name ?? '')
    .sort();
}

function collectRequiredFieldFindings(spec: OpenApiSpec): readonly FieldFinding[] {
  const findings: FieldFinding[] = [];
  for (const apiDoc of readApiDocs()) {
    const operation = getOperation(spec, apiDoc);
    if (operation === undefined) {
      findings.push({
        field: apiDoc.path,
        file: apiDoc.file,
        issue: 'API reference frontmatter does not match openapi.yaml.',
        kind: 'path',
        operation: operationKey(apiDoc),
      });
      continue;
    }

    for (const kind of ['path', 'query'] as const) {
      const docs = documentedFields(apiDoc.source, kind);
      for (const requiredField of requiredOpenApiParameters(spec, operation, kind)) {
        const documented = docs.find(
          (field): boolean => field.name === requiredField,
        );
        if (documented === undefined) {
          findings.push({
            field: requiredField,
            file: apiDoc.file,
            issue: 'Required OpenAPI parameter is not documented.',
            kind,
            operation: operationKey(apiDoc),
          });
          continue;
        }
        if (!documented.required) {
          findings.push({
            field: requiredField,
            file: apiDoc.file,
            issue: 'Required OpenAPI parameter lacks the required marker.',
            kind,
            operation: operationKey(apiDoc),
          });
        }
      }
    }

    const bodyDocs = documentedFields(apiDoc.source, 'body');
    for (const requiredField of requestBodyFields(spec, operation).required) {
      const documented = bodyDocs.find(
        (field): boolean => field.name === requiredField,
      );
      if (documented === undefined) {
        findings.push({
          field: requiredField,
          file: apiDoc.file,
          issue: 'Required OpenAPI body field is not documented.',
          kind: 'body',
          operation: operationKey(apiDoc),
        });
        continue;
      }
      if (!documented.required) {
        findings.push({
          field: requiredField,
          file: apiDoc.file,
          issue: 'Required OpenAPI body field lacks the required marker.',
          kind: 'body',
          operation: operationKey(apiDoc),
        });
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
      (doc): boolean =>
        doc.method === expected.method && doc.path === expected.path,
    );
    const operation = apiDoc === undefined ? undefined : getOperation(spec, apiDoc);
    const operationLabel = `${expected.method.toUpperCase()} ${expected.path}`;

    if (apiDoc === undefined || operation === undefined) {
      findings.push({
        field: expected.field,
        file: apiDoc?.file ?? expected.path,
        issue: 'API reference frontmatter does not match openapi.yaml.',
        kind: 'body',
        operation: operationLabel,
      });
      continue;
    }

    if (!requestBodyFields(spec, operation).properties.includes(expected.field)) {
      findings.push({
        field: expected.field,
        file: apiDoc.file,
        issue: 'Expected OpenAPI field is missing.',
        kind: 'body',
        operation: operationLabel,
      });
    }

    const docsFields = documentedFields(apiDoc.source, 'body');
    if (!docsFields.some((field): boolean => field.name === expected.field)) {
      findings.push({
        field: expected.field,
        file: apiDoc.file,
        issue: 'Expected API reference field is missing.',
        kind: 'body',
        operation: operationLabel,
      });
    }
  }

  return findings;
}

describe('API reference required fields', (): void => {
  it('documents every required OpenAPI path, query, and body field', (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'));
    expect(collectRequiredFieldFindings(spec)).toStrictEqual([]);
  });
});

describe('API reference cost-control fields', (): void => {
  it('keeps extraction resultsLimit documented and present in OpenAPI', (): void => {
    expect.assertions(1);

    const spec = parseYaml(readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'));
    expect(
      collectDocumentedRequestBodyFieldFindings(spec, [
        {
          field: 'resultsLimit',
          method: 'post',
          path: '/extractions',
        },
        {
          field: 'resultsLimit',
          method: 'post',
          path: '/extractions/estimate',
        },
      ]),
    ).toStrictEqual([]);
  });
});
