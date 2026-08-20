import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const page = readFileSync(
  join(PROJECT_ROOT, 'api-reference/drafts/list.mdx'),
  'utf8',
);
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const routePath = join(PRODUCT_ROOT, 'app/api/v1/drafts/route.ts');
const listOperation = openapi.slice(
  openapi.indexOf('      operationId: listDrafts'),
  openapi.indexOf('    post:', openapi.indexOf('      operationId: listDrafts')),
);

describe('list tweet drafts documentation', (): void => {
  it('keeps every response and authentication scheme aligned', (): void => {
    expect.assertions(1);

    expect({
      apiKeyAuth: listOperation.includes('- apiKey: []'),
      oauthAuth: listOperation.includes('- oauthBearer: []'),
      statuses: ['200', '401', '429'].every((status) =>
        listOperation.includes(`        '${status}':`),
      ),
    }).toStrictEqual({
      apiKeyAuth: true,
      oauthAuth: true,
      statuses: true,
    });
  });

  it('documents only the canonical draft and pagination fields', (): void => {
    expect.assertions(1);

    expect({
      canonicalDraftFields: [
        'id',
        'text',
        'topic',
        'goal',
        'createdAt',
        'updatedAt',
      ].every((field) =>
        page.includes(`<ResponseField name="drafts[].${field}"`),
      ),
      paginationFields: ['drafts', 'hasMore', 'nextCursor'].every((field) =>
        page.includes(`<ResponseField name="${field}"`),
      ),
      unsupportedFieldsDenied: normalizedPage.includes(
        'The canonical draft object contains no thread order, media attachment, reply target, or public tweet ID.',
      ),
    }).toStrictEqual({
      canonicalDraftFields: true,
      paginationFields: true,
      unsupportedFieldsDenied: true,
    });
  });

  it('preserves focused list and pagination search intent', (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "List Xquik tweet drafts with cursor-based pagination"',
        '"list tweet drafts"',
        '"tweet draft API"',
        '## Paginate through every draft',
        '## Build a tweet draft review queue',
        '## Answer tweet draft list questions',
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });

  it('separates Xquik drafts from native posts and filters', (): void => {
    expect.assertions(1);

    expect({
      nativeBoundary: normalizedPage.includes(
        "Xquik drafts are separate from [X's native Unsent posts]",
      ),
      noFilters: normalizedPage.includes(
        'This route exposes no topic, goal, text, date, or status filter.',
      ),
      noPublish: normalizedPage.includes(
        'The route never publishes draft text or sends it to followers.',
      ),
    }).toStrictEqual({
      nativeBoundary: true,
      noFilters: true,
      noPublish: true,
    });
  });

  it('matches product pagination when its source is available', (): void => {
    expect.assertions(1);

    if (!existsSync(routePath)) {
      expect(existsSync(routePath)).toBe(false);
      return;
    }

    const route = readFileSync(routePath, 'utf8');
    const getStart = route.indexOf('export async function GET(');
    const postStart = route.indexOf('\nexport async function POST(', getStart);
    const getSource = route.slice(getStart, postStart);
    const configSource = route.slice(
      route.indexOf('const LIST_CONFIG:'),
      route.indexOf('const MAX_TEXT_LENGTH'),
    );

    expect({
      afterCursor: configSource.includes("afterParam: 'afterCursor'"),
      defaultLimit: configSource.includes('defaultLimit: 50'),
      formatsDrafts: getSource.includes(
        'drafts: items.map((row) => formatDraftRow(row))',
      ),
      maxLimit: configSource.includes('maxLimit: 50'),
      newestFirst: getSource.includes(
        '.orderBy(sql`${tweetDrafts.createdAt} DESC, ${tweetDrafts.id} DESC`)',
      ),
      routeFound: getStart >= 0 && postStart > getStart,
    }).toStrictEqual({
      afterCursor: true,
      defaultLimit: true,
      formatsDrafts: true,
      maxLimit: true,
      newestFirst: true,
      routeFound: true,
    });
  });
});
