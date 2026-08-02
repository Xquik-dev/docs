import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const page = readFileSync(
  join(PROJECT_ROOT, 'api-reference/drafts/get.mdx'),
  'utf8',
);
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const routePath = join(PRODUCT_ROOT, 'app/api/v1/drafts/[id]/route.ts');
const getOperation = openapi.slice(
  openapi.indexOf('      operationId: getDraft'),
  openapi.indexOf('    delete:', openapi.indexOf('      operationId: getDraft')),
);

describe('get tweet draft documentation', (): void => {
  it('keeps every response and authentication scheme aligned', (): void => {
    expect.assertions(1);

    expect({
      apiKeyAuth: getOperation.includes('- apiKey: []'),
      oauthAuth: getOperation.includes('- oauthBearer: []'),
      statuses: ['200', '400', '401', '404', '429'].every((status) =>
        getOperation.includes(`        '${status}':`),
      ),
    }).toStrictEqual({
      apiKeyAuth: true,
      oauthAuth: true,
      statuses: true,
    });
  });

  it('documents only the canonical draft response fields', (): void => {
    expect.assertions(1);

    expect({
      canonicalFields: [
        'id',
        'text',
        'topic',
        'goal',
        'createdAt',
        'updatedAt',
      ].every((field) => page.includes(`<ResponseField name="${field}"`)),
      mediaDenied: normalizedPage.includes(
        'The canonical draft object contains no media, reply target, or tweet ID.',
      ),
      threadDenied: normalizedPage.includes(
        'It does not return thread order, media attachments, reply targets, or publishing results.',
      ),
    }).toStrictEqual({
      canonicalFields: true,
      mediaDenied: true,
      threadDenied: true,
    });
  });

  it('separates retrieval from native drafts and write actions', (): void => {
    expect.assertions(1);

    expect({
      nativeBoundary: normalizedPage.includes(
        "Xquik drafts are separate from [X's native Unsent posts]",
      ),
      noEdit: normalizedPage.includes('This route provides no edit operation.'),
      noPublish: normalizedPage.includes(
        'Reading a draft never sends text to followers or creates likes and replies.',
      ),
      readScope: page.includes('## Retrieve One Tweet Draft by ID'),
    }).toStrictEqual({
      nativeBoundary: true,
      noEdit: true,
      noPublish: true,
      readScope: true,
    });
  });

  it('preserves focused tweet draft retrieval search intent', (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "Get a Tweet Draft by ID with the Xquik API"',
        '"get tweet draft"',
        '"retrieve tweet draft"',
        '## Read the Tweet Draft Fields',
        '## Build a Tweet Draft Review Workflow',
        '## Answer Tweet Draft Retrieval Questions',
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });

  it('matches the product route when its source is available', (): void => {
    expect.assertions(1);

    if (!existsSync(routePath)) {
      expect(existsSync(routePath)).toBe(false);
      return;
    }

    const route = readFileSync(routePath, 'utf8');
    const getStart = route.indexOf('export async function GET(');
    const deleteStart = route.indexOf('\nexport async function DELETE(', getStart);
    const getSource = route.slice(getStart, deleteStart);

    expect({
      formatsDraft: getSource.includes('formatDraftRow(row)'),
      invalidId: getSource.includes("error: 'invalid_id'"),
      notFound: getSource.includes("error: 'draft_not_found'"),
      routeFound: getStart >= 0 && deleteStart > getStart,
    }).toStrictEqual({
      formatsDraft: true,
      invalidId: true,
      notFound: true,
      routeFound: true,
    });
  });
});
