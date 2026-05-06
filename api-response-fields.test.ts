import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const DOCS_OPENAPI_PATH = join(PROJECT_ROOT, 'openapi.yaml');
const PRODUCT_ROUTE_HELPERS_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/route-helpers.ts',
);

interface OpenApiSpec {
  readonly components?: {
    readonly schemas?: Record<string, OpenApiSchema>;
  };
}

interface OpenApiSchema {
  readonly $ref?: string;
  readonly items?: OpenApiSchema;
  readonly properties?: Record<string, OpenApiSchema>;
}

interface PageContract {
  readonly allowedFields: readonly string[];
  readonly page: string;
  readonly requiredFields: readonly string[];
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

function readOpenApi(): OpenApiSpec {
  return parseYaml(readFileSync(DOCS_OPENAPI_PATH, 'utf8'));
}

function schemaByName(spec: OpenApiSpec, name: string): OpenApiSchema {
  const schema = spec.components?.schemas?.[name];
  if (schema === undefined) {
    throw new Error(`Missing OpenAPI schema: ${name}`);
  }
  return schema;
}

function resolveSchema(spec: OpenApiSpec, schema: OpenApiSchema): OpenApiSchema {
  if (schema.$ref === undefined) {
    return schema;
  }
  const name = schema.$ref.replace('#/components/schemas/', '');
  return schemaByName(spec, name);
}

function schemaPropertyNames(spec: OpenApiSpec, name: string): readonly string[] {
  const schema = resolveSchema(spec, schemaByName(spec, name));
  return Object.keys(schema.properties ?? {}).sort((left, right): number =>
    left.localeCompare(right),
  );
}

function propertyNames(schema: OpenApiSchema | undefined): readonly string[] {
  return Object.keys(schema?.properties ?? {}).sort((left, right): number =>
    left.localeCompare(right),
  );
}

function schemaProperty(
  spec: OpenApiSpec,
  schemaName: string,
  property: string,
): OpenApiSchema | undefined {
  return resolveSchema(spec, schemaByName(spec, schemaName)).properties?.[
    property
  ];
}

function itemPropertyNames(
  spec: OpenApiSpec,
  schemaName: string,
  property: string,
): readonly string[] {
  const schema = schemaProperty(spec, schemaName, property);
  return propertyNames(resolveSchema(spec, schema?.items ?? {}));
}

function uniqueSorted(fields: readonly string[]): readonly string[] {
  return [...new Set(fields)].sort((left, right): number =>
    left.localeCompare(right),
  );
}

function responseFields(page: string): readonly string[] {
  const source = readFileSync(join(PROJECT_ROOT, page), 'utf8');
  return uniqueSorted(
    [...source.matchAll(/<ResponseField\s+name="(?<field>[^"]+)"/gu)].map(
      (match): string => match.groups?.['field'] ?? '',
    ),
  ).filter((field): boolean => field.length > 0);
}

function setDifference(
  actual: readonly string[],
  expected: readonly string[],
): readonly string[] {
  const expectedSet = new Set(expected);
  return actual.filter((field): boolean => !expectedSet.has(field));
}

function mapFunctionBody(source: string, functionName: string): string {
  const start = source.indexOf(`function ${functionName}`);
  if (start < 0) {
    throw new Error(`Missing product mapper: ${functionName}`);
  }
  const end = source.indexOf('\n}\n\n', start);
  if (end < 0) {
    throw new Error(`Could not locate product mapper end: ${functionName}`);
  }
  return source.slice(start, end);
}

function productMapperFields(functionName: string): readonly string[] {
  const source = readFileSync(PRODUCT_ROUTE_HELPERS_PATH, 'utf8');
  const body = mapFunctionBody(source, functionName);
  const directFields = [...body.matchAll(/^\s{4}(?<field>[A-Za-z_]\w*):/gmu)]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  const optionalFields = [
    ...body.matchAll(/optionalField\(\s*'(?<field>[^']+)'/gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  return uniqueSorted([...directFields, ...optionalFields]);
}

function pageContracts(spec: OpenApiSpec): readonly PageContract[] {
  const paginatedTweets = schemaPropertyNames(spec, 'PaginatedTweets');
  const searchTweet = schemaPropertyNames(spec, 'SearchTweet');
  const userProfile = schemaPropertyNames(spec, 'UserProfile');
  const tweetDetail = schemaPropertyNames(spec, 'TweetDetail');
  const tweetAuthor = schemaPropertyNames(spec, 'TweetAuthor');
  const searchTweetMedia = itemPropertyNames(spec, 'SearchTweet', 'media');
  const tweetDetailMedia = itemPropertyNames(spec, 'TweetDetail', 'media');

  return [
    {
      allowedFields: uniqueSorted([
        ...paginatedTweets,
        ...searchTweet,
        ...userProfile,
        ...searchTweetMedia,
      ]),
      page: 'api-reference/x/search-tweets.mdx',
      requiredFields: uniqueSorted([
        ...paginatedTweets,
        ...searchTweet,
        ...searchTweetMedia,
      ]),
    },
    {
      allowedFields: uniqueSorted([
        'author',
        'tweet',
        ...tweetDetail,
        ...tweetAuthor,
        ...tweetDetailMedia,
      ]),
      page: 'api-reference/x/get-tweet.mdx',
      requiredFields: uniqueSorted([
        'author',
        'tweet',
        ...tweetDetail,
        ...tweetAuthor,
        ...tweetDetailMedia,
      ]),
    },
    {
      allowedFields: userProfile,
      page: 'api-reference/x/get-user.mdx',
      requiredFields: userProfile,
    },
  ];
}

describe('API response field docs', (): void => {
  it('keeps selected X read endpoint fields aligned with OpenAPI schemas', (): void => {
    expect.assertions(1);

    const spec = readOpenApi();
    const findings = pageContracts(spec).flatMap(
      (contract): readonly string[] => {
        const documented = responseFields(contract.page);
        return [
          ...setDifference(contract.requiredFields, documented).map(
            (field): string => `${contract.page} is missing ${field}.`,
          ),
          ...setDifference(documented, contract.allowedFields).map(
            (field): string => `${contract.page} documents unknown ${field}.`,
          ),
        ];
      },
    );

    expect(findings).toStrictEqual([]);
  });

  it('keeps selected X read OpenAPI schemas aligned with product mappers', (): void => {
    expect.assertions(1);

    const productSourceExists = existsSync(PRODUCT_ROUTE_HELPERS_PATH);
    if (!productSourceExists) {
      expect(productSourceExists).toBe(false);
      return;
    }

    const spec = readOpenApi();
    const findings = [
      ...setDifference(
        schemaPropertyNames(spec, 'SearchTweet'),
        productMapperFields('mapTweet'),
      ).map((field): string => `SearchTweet has no product field ${field}.`),
      ...setDifference(
        productMapperFields('mapTweet'),
        schemaPropertyNames(spec, 'SearchTweet'),
      ).map((field): string => `SearchTweet is missing ${field}.`),
      ...setDifference(
        schemaPropertyNames(spec, 'UserProfile'),
        productMapperFields('mapUser'),
      ).map((field): string => `UserProfile has no product field ${field}.`),
      ...setDifference(
        productMapperFields('mapUser'),
        schemaPropertyNames(spec, 'UserProfile'),
      ).map((field): string => `UserProfile is missing ${field}.`),
    ];

    expect(findings).toStrictEqual([]);
  });
});
