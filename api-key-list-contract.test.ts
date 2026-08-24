import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('api-reference/api-keys/list.mdx', 'utf8');
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync('openapi.yaml', 'utf8');
const listOperation = openapi.slice(
  openapi.indexOf('  /api-keys:'),
  openapi.indexOf('  /api-keys/{id}:'),
);

describe('API key list documentation', (): void => {
  it('documents only returned inventory fields', (): void => {
    expect.assertions(1);

    const description =
      /^description: "(?<description>[^"]+)"$/mu.exec(page)?.groups?.[
        'description'
      ] ?? '';

    expect({
      activeState: page.includes('| Current state | `isActive` |'),
      createdAt: page.includes('| Credential age | `createdAt` |'),
      descriptionOmitsExpiration: !description.includes('expiration'),
      descriptionOmitsScopes: !description.includes('scopes'),
      fullKeyHidden: normalizedPage.includes(
        'This endpoint returns key inventory metadata. It never returns a complete API key.',
      ),
      keyId: page.includes('| Stable key record | `id` |'),
      keyName: page.includes('| Workload label | `name` |'),
      lastUsedAt: page.includes('| Last authentication | `lastUsedAt` |'),
      prefix: page.includes('| Safe identifier | `prefix` |'),
    }).toStrictEqual({
      activeState: true,
      createdAt: true,
      descriptionOmitsExpiration: true,
      descriptionOmitsScopes: true,
      fullKeyHidden: true,
      keyId: true,
      keyName: true,
      lastUsedAt: true,
      prefix: true,
    });
  });

  it('keeps management authentication aligned with OpenAPI', (): void => {
    expect.assertions(1);

    expect({
      cookieSession: listOperation.includes('cookieSession: []'),
      listOperation: listOperation.includes('operationId: listApiKeys'),
      sessionOnlyCopy: page.includes(
        'This management endpoint requires a same-origin dashboard session.',
      ),
      statuses: ['200', '401', '429'].every((status) =>
        listOperation.includes(`        '${status}':`),
      ),
    }).toStrictEqual({
      cookieSession: true,
      listOperation: true,
      sessionOnlyCopy: true,
      statuses: true,
    });
  });

  it('preserves focused X API key search intent', (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "X API key management: list active Xquik keys"',
        '"X API key"',
        '"Twitter API key"',
        '"API key management"',
        '"list API keys"',
        '## Distinguish Xquik keys from official X credentials',
        '## Rotate an Xquik API key safely',
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });
});
