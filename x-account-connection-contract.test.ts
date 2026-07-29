import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface OpenApiSchema {
  readonly $ref?: string;
  readonly oneOf?: readonly OpenApiSchema[];
  readonly required?: readonly string[];
  readonly 'x-stainless-override-schema'?: OpenApiSchema;
}

interface OpenApiResponse {
  readonly content: {
    readonly 'application/json': {
      readonly schema: OpenApiSchema;
    };
  };
  readonly headers?: Readonly<Record<string, unknown>>;
}

interface OpenApiDocument {
  readonly components: {
    readonly schemas: Readonly<Record<string, OpenApiSchema>>;
  };
  readonly paths: {
    readonly '/x/account-connection-attempts/{id}': {
      readonly get: {
        readonly responses: {
          readonly '200': OpenApiResponse;
        };
      };
    };
    readonly '/x/accounts': {
      readonly post: {
        readonly requestBody: {
          readonly content: {
            readonly 'application/json': {
              readonly schema: OpenApiSchema;
            };
          };
        };
        readonly responses: {
          readonly '201': OpenApiResponse;
          readonly '202': OpenApiResponse;
        };
      };
    };
  };
}

const PROJECT_ROOT = process.cwd();
const CONNECT_PAGE = readFileSync(
  join(PROJECT_ROOT, 'api-reference/x-accounts/connect.mdx'),
  'utf8',
);
const STATUS_PAGE = readFileSync(
  join(PROJECT_ROOT, 'api-reference/x-accounts/connection-attempt.mdx'),
  'utf8',
);
const X_ACCOUNT_PAGES = [
  'bulk-retry.mdx',
  'connect.mdx',
  'connection-attempt.mdx',
  'disconnect.mdx',
  'get.mdx',
  'list.mdx',
  'reauth.mdx',
  'submit-challenge.mdx',
]
  .map((file) =>
    readFileSync(join(PROJECT_ROOT, 'api-reference/x-accounts', file), 'utf8'),
  )
  .join('\n');
const OPENAPI_SOURCE = readFileSync(
  join(PROJECT_ROOT, 'openapi.yaml'),
  'utf8',
);
const DOCS_CONFIG = readFileSync(join(PROJECT_ROOT, 'docs.json'), 'utf8');
const LLMS_INDEX = readFileSync(join(PROJECT_ROOT, 'llms.txt'), 'utf8');
const PRIVATE_CONNECTION_COPY =
  /automatic retr(?:y|ies)|browser session|network tunnel|retry automatically/iu;

function parseOpenApi(source: string): OpenApiDocument {
  const bun = globalThis as {
    readonly Bun?: { readonly YAML?: { parse: (yaml: string) => unknown } };
  };
  const parse = bun.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error('Bun.YAML.parse is required for OpenAPI docs tests.');
  }
  return parse(source) as OpenApiDocument;
}

function refs(schema: Readonly<OpenApiSchema>): readonly string[] {
  return (schema.oneOf ?? []).map((variant) => variant.$ref ?? '');
}

const openapi = parseOpenApi(OPENAPI_SOURCE);

describe('X account connection documentation contract', (): void => {
  it('publishes every durable connection result', (): void => {
    expect.assertions(5);
    const connect = openapi.paths['/x/accounts'].post.responses;
    const status =
      openapi.paths['/x/account-connection-attempts/{id}'].get.responses['200'];

    expect(connect['201'].content['application/json'].schema.$ref).toBe(
      '#/components/schemas/SanitizedXAccount',
    );
    expect(
      refs(
        connect['201'].content['application/json'].schema[
          'x-stainless-override-schema'
        ] ?? {},
      ),
    ).toStrictEqual([
      '#/components/schemas/SanitizedXAccount',
      '#/components/schemas/XAccountConnectionAttempt',
      '#/components/schemas/XAccountConnectionChallenge',
    ]);
    expect(refs(connect['202'].content['application/json'].schema)).toStrictEqual(
      [
        '#/components/schemas/XAccountConnectionAttempt',
        '#/components/schemas/XAccountConnectionChallenge',
      ],
    );
    expect(refs(status.content['application/json'].schema)).toStrictEqual([
      '#/components/schemas/XAccountConnectionAttempt',
      '#/components/schemas/XAccountConnectionChallenge',
    ]);
    expect(
      refs(openapi.components.schemas['XAccountConnectionAttempt'] ?? {}),
    ).toStrictEqual([
      '#/components/schemas/XAccountConnectionAttemptPending',
      '#/components/schemas/XAccountConnectionAttemptSuccess',
      '#/components/schemas/XAccountConnectionAttemptFailed',
    ]);
  });

  it('keeps status fields and headers exact', (): void => {
    expect.assertions(5);
    const schemas = openapi.components.schemas;
    const connect = openapi.paths['/x/accounts'].post.responses['202'];
    const status =
      openapi.paths['/x/account-connection-attempts/{id}'].get.responses['200'];

    expect(
      schemas['XAccountConnectionAttemptPending']?.required,
    ).toStrictEqual(['object', 'id', 'status', 'pollAfterMs']);
    expect(
      schemas['XAccountConnectionAttemptSuccess']?.required,
    ).toStrictEqual(['object', 'id', 'status']);
    expect(schemas['XAccountConnectionAttemptFailed']?.required).toStrictEqual([
      'object',
      'id',
      'status',
      'error',
      'retryable',
    ]);
    expect(Object.keys(connect.headers ?? {}).sort()).toStrictEqual([
      'Cache-Control',
      'Location',
      'Retry-After',
    ]);
    expect(Object.keys(status.headers ?? {}).sort()).toStrictEqual([
      'Cache-Control',
      'Retry-After',
    ]);
  });

  it('requires the TOTP secret for a durable connection', (): void => {
    expect.assertions(4);
    const requestSchema =
      openapi.paths['/x/accounts'].post.requestBody.content['application/json']
        .schema;

    expect(requestSchema.required).toStrictEqual([
      'username',
      'email',
      'password',
      'totp_secret',
    ]);
    expect(CONNECT_PAGE).toContain(
      '<ParamField body="totp_secret" type="string" required>',
    );
    expect(LLMS_INDEX).toContain(
      'with credentials and the required Authenticator App TOTP secret.',
    );
    expect(LLMS_INDEX).not.toContain('optional TOTP');
  });

  it('keeps the guide discoverable and copy-ready', (): void => {
    expect.assertions(5);

    expect(CONNECT_PAGE).toContain('"status": "pending"');
    expect(STATUS_PAGE).toContain(
      'api: "GET /x/account-connection-attempts/{id}"',
    );
    expect(DOCS_CONFIG).toContain(
      '"api-reference/x-accounts/connection-attempt"',
    );
    expect(LLMS_INDEX).toContain(
      'https://docs.xquik.com/api-reference/x-accounts/connection-attempt',
    );
    expect(CONNECT_PAGE).not.toMatch(
      /elon@example\.com|s3cureP@ss|JBSWY3DPEHPK3PXP"\s*[,}]/u,
    );
  });

  it('keeps connection guidance customer-safe', (): void => {
    expect.assertions(1);

    expect(X_ACCOUNT_PAGES).not.toMatch(PRIVATE_CONNECTION_COPY);
  });
});
