import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const AUTOMATIC_COVERAGE_PAGES = [
  'api-reference/x/search-tweets.mdx',
  'api-reference/x/tweet-replies.mdx',
  'api-reference/x/followers.mdx',
  'api-reference/x/following.mdx',
  'api-reference/x/verified-followers.mdx',
] as const;

describe('automatic maximum coverage contract', (): void => {
  it('keeps the default rule consistent across affected API pages', (): void => {
    expect.assertions(AUTOMATIC_COVERAGE_PAGES.length);

    for (const file of AUTOMATIC_COVERAGE_PAGES) {
      const source = readFileSync(file, 'utf8');

      expect(source).toContain('<AutomaticCoveragePagination />');
    }
  });

  it('preserves pagination, billing, and legacy behavior', (): void => {
    expect.assertions(13);

    const source = readFileSync(
      'snippets/automatic-coverage-pagination.mdx',
      'utf8',
    );
    const search = readFileSync(
      'api-reference/x/search-tweets.mdx',
      'utf8',
    );

    expect(source).toContain('Omit `mode` for automatic maximum coverage.');
    expect(source).toContain('Pass `next_cursor` back unchanged as `cursor`.');
    expect(source).toContain('Billing still counts only returned rows.');
    expect(source).toContain('Use `mode=standard` only');
    expect(source).toContain('409 coverage_cursor_unavailable');
    expect(search).toContain('return available automatic rows');
    expect(search).toContain('Xquik uses standard pagination');
    expect(search).toContain('never switch sources mid-sequence');
    expect(search).toContain('every returned page');
    expect(search).toContain('The start is inclusive. The end is exclusive.');
    expect(search).toContain('continues past rejected rows');
    expect(search).toContain('`since_time:`');
    expect(search).toContain('`until_time:`');
  });

  it('keeps OpenAPI and MCP guidance aligned', (): void => {
    expect.assertions(4);

    const openApi = readFileSync('openapi.yaml', 'utf8');
    const mcp = readFileSync('mcp/tools.mdx', 'utf8');

    expect(openApi).toContain(
      'Omit mode for automatic maximum coverage with cursor-based',
    );
    expect(openApi).toContain('Existing unprefixed cursors keep legacy');
    expect(mcp).toContain('Those operations use automatic maximum coverage.');
    expect(mcp).toContain('Use `mode=standard` only for legacy pagination.');
  });
});
