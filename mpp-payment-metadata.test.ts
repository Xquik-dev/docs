import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const DOCS_OPENAPI_PATH = join(PROJECT_ROOT, 'openapi.yaml');
const PRODUCT_OPENAPI_PATH = join(PRODUCT_ROOT, 'openapi.yaml');
const PRODUCT_MPP_PRICING_PATH = join(PRODUCT_ROOT, 'lib/mpp/pricing.ts');
const HTTP_METHODS = new Set(['delete', 'get', 'patch', 'post', 'put']);
const PRODUCT_ROUTE_PATTERN = /'(?<route>[A-Z]+ \/api\/v1[^']+)'/gu;
const PRODUCT_ROUTE_BLOCK_ENDS = {
  DIRECT_MPP_ROUTES: 'function getMppPrice',
  PAID_READ_ROUTE_KEYS: 'const PAID_READ_ROUTES',
} as const;

interface OpenApiOperation {
  readonly responses?: Readonly<
    Record<string, { readonly ['$ref']?: string }>
  >;
  readonly security?: readonly Record<string, readonly string[]>[];
  readonly ['x-payment-info']?: {
    readonly offers?: readonly {
      readonly intent?: string;
    }[];
  };
}

interface OpenApiSpec {
  readonly paths?: Record<string, Record<string, OpenApiOperation>>;
}

interface OperationMetadata {
  readonly anonymous: boolean;
  readonly key: string;
  readonly paymentIntents: readonly string[];
  readonly paymentEnabled: boolean;
  readonly paymentRequiredResponse: string;
  readonly unauthorizedResponse: string;
}

interface MppFinding {
  readonly issue: string;
  readonly operation: string;
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

function readOpenApi(path: string): OpenApiSpec {
  return parseYaml(readFileSync(path, 'utf8'));
}

function normalizeOperationKey(method: string, path: string): string {
  const productPath = path.replaceAll(
    /\{(?<name>[A-Za-z][A-Za-z0-9_]*)\}/gu,
    '[$<name>]',
  );
  return `${method.toUpperCase()} /api/v1${productPath}`;
}

function hasAnonymousSecurity(operation: OpenApiOperation): boolean {
  return (operation.security ?? []).some(
    (entry): boolean => Object.keys(entry).length === 0,
  );
}

function collectOperations(spec: OpenApiSpec): readonly OperationMetadata[] {
  const operations: OperationMetadata[] = [];
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }
      operations.push({
        anonymous: hasAnonymousSecurity(operation),
        key: normalizeOperationKey(method, path),
        paymentIntents:
          operation['x-payment-info']?.offers
            ?.map((offer): string => offer.intent ?? '')
            .filter((intent): boolean => intent.length > 0) ?? [],
        paymentEnabled: operation['x-payment-info'] !== undefined,
        paymentRequiredResponse: operation.responses?.['402']?.['$ref'] ?? '',
        unauthorizedResponse: operation.responses?.['401']?.['$ref'] ?? '',
      });
    }
  }
  return operations.sort((left, right): number =>
    left.key.localeCompare(right.key),
  );
}

function paymentOperationKeys(spec: OpenApiSpec): ReadonlySet<string> {
  return new Set(
    collectOperations(spec)
      .filter((operation): boolean => operation.paymentEnabled)
      .map((operation): string => operation.key),
  );
}

function productRouteKeys(
  blockName: keyof typeof PRODUCT_ROUTE_BLOCK_ENDS,
): ReadonlySet<string> {
  const source = readFileSync(PRODUCT_MPP_PRICING_PATH, 'utf8');
  const blockStart = source.indexOf(`const ${blockName}`);
  const blockEnd = source.indexOf(
    PRODUCT_ROUTE_BLOCK_ENDS[blockName],
    blockStart,
  );

  if (blockStart < 0 || blockEnd < 0) {
    return new Set();
  }

  const block = source.slice(blockStart, blockEnd);
  return new Set(
    [...block.matchAll(PRODUCT_ROUTE_PATTERN)]
      .map((match): string => match.groups?.['route'] ?? '')
      .filter((route): boolean => route.length > 0),
  );
}

function compareSets(
  actual: ReadonlySet<string>,
  expected: ReadonlySet<string>,
): readonly MppFinding[] {
  const findings: MppFinding[] = [];
  for (const operation of actual) {
    if (!expected.has(operation)) {
      findings.push({ issue: 'Unexpected payment metadata.', operation });
    }
  }
  for (const operation of expected) {
    if (!actual.has(operation)) {
      findings.push({ issue: 'Missing payment metadata.', operation });
    }
  }
  return findings.sort((left, right): number =>
    left.operation.localeCompare(right.operation),
  );
}

describe('MPP payment metadata', (): void => {
  it('keeps anonymous paid reads aligned with the product paid-read catalog', (): void => {
    expect.assertions(1);

    const productSourceExists = existsSync(PRODUCT_MPP_PRICING_PATH);
    if (!productSourceExists) {
      expect(productSourceExists).toBe(false);
      return;
    }

    const anonymousOperations = new Set(
      collectOperations(readOpenApi(DOCS_OPENAPI_PATH))
        .filter((operation): boolean => operation.anonymous)
        .map((operation): string => operation.key),
    );

    expect(
      compareSets(
        anonymousOperations,
        productRouteKeys('PAID_READ_ROUTE_KEYS'),
      ),
    ).toStrictEqual([]);
  });

  it(
    'maps docs payment metadata to product MPP routes when product source is available',
    (): void => {
      expect.assertions(1);

      const productSourceExists = existsSync(PRODUCT_MPP_PRICING_PATH);
      if (!productSourceExists) {
        expect(productSourceExists).toBe(false);
        return;
      }

      expect(
        compareSets(
          paymentOperationKeys(readOpenApi(DOCS_OPENAPI_PATH)),
          productRouteKeys('DIRECT_MPP_ROUTES'),
        ),
      ).toStrictEqual([]);
    },
  );

  it(
    'keeps docs and product OpenAPI payment metadata aligned when product OpenAPI is available',
    (): void => {
      expect.assertions(1);

      const productOpenApiExists = existsSync(PRODUCT_OPENAPI_PATH);
      if (!productOpenApiExists) {
        expect(productOpenApiExists).toBe(false);
        return;
      }

      expect(
        compareSets(
          paymentOperationKeys(readOpenApi(DOCS_OPENAPI_PATH)),
          paymentOperationKeys(readOpenApi(PRODUCT_OPENAPI_PATH)),
        ),
      ).toStrictEqual([]);
    },
  );

  it('keeps every direct MPP offer on the fixed charge intent', (): void => {
    expect.assertions(1);

    const intentFindings = collectOperations(readOpenApi(DOCS_OPENAPI_PATH))
      .filter((operation): boolean => operation.paymentEnabled)
      .filter(
        (operation): boolean =>
          operation.paymentIntents.length !== 1 ||
          operation.paymentIntents[0] !== 'charge',
      )
      .map((operation): string => operation.key);

    expect(intentFindings).toStrictEqual([]);
  });

  it('keeps Bearer authentication distinct from MPP payment challenges', (): void => {
    expect.assertions(1);

    const findings = collectOperations(readOpenApi(DOCS_OPENAPI_PATH))
      .filter((operation): boolean => operation.anonymous)
      .flatMap((operation): readonly MppFinding[] => {
        const expectedUnauthorizedResponse = operation.paymentEnabled
          ? '#/components/responses/Unauthenticated'
          : '#/components/responses/AnonymousGuestAuthenticationRequired';
        const operationFindings: MppFinding[] = [];
        if (operation.unauthorizedResponse !== expectedUnauthorizedResponse) {
          operationFindings.push({
            issue: `Expected 401 response ${expectedUnauthorizedResponse}.`,
            operation: operation.key,
          });
        }
        if (
          operation.paymentRequiredResponse !==
          '#/components/responses/PaymentRequired'
        ) {
          operationFindings.push({
            issue: 'Expected authenticated or MPP 402 response.',
            operation: operation.key,
          });
        }
        return operationFindings;
      });

    expect(findings).toStrictEqual([]);
  });
});
