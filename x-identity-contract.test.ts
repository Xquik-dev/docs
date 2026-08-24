import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const page = readFileSync(
  join(PROJECT_ROOT, 'api-reference/account/x-identity.mdx'),
  'utf8',
);
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const routePath = join(PRODUCT_ROOT, 'app/api/v1/account/x-identity/route.ts');
const styleRoutePath = join(PRODUCT_ROOT, 'app/api/v1/styles/route.ts');
const operation = openapi.slice(
  openapi.indexOf('      operationId: setXIdentity'),
  openapi.indexOf(
    '  /api-keys:',
    openapi.indexOf('      operationId: setXIdentity'),
  ),
);

describe('set X identity documentation', (): void => {
  it('keeps every response and authentication scheme aligned', (): void => {
    expect.assertions(1);

    expect({
      apiKeyAuth: operation.includes('apiKey: []'),
      oauthAuth: operation.includes('oauthBearer: []'),
      statuses: ['200', '400', '401', '429'].every((status) =>
        operation.includes(`        '${status}':`),
      ),
    }).toStrictEqual({ apiKeyAuth: true, oauthAuth: true, statuses: true });
  });

  it('documents the canonical request and response fields', (): void => {
    expect.assertions(1);

    expect({
      requestField: page.includes('<ParamField body="username"'),
      responseFields: ['success', 'xUsername'].every((field) =>
        page.includes(`<ResponseField name="${field}"`),
      ),
      lowercase: normalizedPage.includes('The stored value becomes lowercase.'),
    }).toStrictEqual({
      requestField: true,
      responseFields: true,
      lowercase: true,
    });
  });

  it('preserves focused Twitter handle search intent', (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "Set a Twitter handle for Xquik tweet style analysis"',
        '"twitter handle"',
        '"X username"',
        '## Understand handle, display name, and user ID',
        '## Apply the identity to tweet style analysis',
        '## Answer X username questions',
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });

  it('separates stored identity from lookup and connection', (): void => {
    expect.assertions(1);

    expect({
      noConnection: normalizedPage.includes(
        'This endpoint changes one Xquik account field. It does not create an authenticated connection to X.',
      ),
      noLookup: normalizedPage.includes(
        'This route does not look up an X profile.',
      ),
      noOwnership: normalizedPage.includes(
        'It also does not prove that the handle belongs to you.',
      ),
      noUserIdConversion: normalizedPage.includes(
        'This route does not convert a Twitter ID to a username.',
      ),
    }).toStrictEqual({
      noConnection: true,
      noLookup: true,
      noOwnership: true,
      noUserIdConversion: true,
    });
  });

  it('matches product behavior when its source is available', (): void => {
    expect.assertions(1);

    if (!existsSync(routePath) || !existsSync(styleRoutePath)) {
      expect(existsSync(routePath) && existsSync(styleRoutePath)).toBe(false);
      return;
    }

    const route = readFileSync(routePath, 'utf8');
    const styleRoute = readFileSync(styleRoutePath, 'utf8');

    expect({
      invalidInput: route.includes('return invalidInputResponse()'),
      invalidUsername: route.includes("error: 'invalid_username'"),
      lowercase: route.includes("body['username'].toLowerCase()"),
      storesUsername: route.includes('.set({ xUsername })'),
      styleMatch: styleRoute.includes(
        'user?.xUsername?.toLowerCase() === username',
      ),
      usernamePattern: route.includes('X_USERNAME_PATTERN.test'),
    }).toStrictEqual({
      invalidInput: true,
      invalidUsername: true,
      lowercase: true,
      storesUsername: true,
      styleMatch: true,
      usernamePattern: true,
    });
  });
});
