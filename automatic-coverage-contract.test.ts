import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const AUTOMATIC_COVERAGE_PAGES = [
  'api-reference/x/search-tweets.mdx',
  'api-reference/x/tweet-replies.mdx',
  'api-reference/x/followers.mdx',
  'api-reference/x/following.mdx',
  'api-reference/x/list-followers.mdx',
  'api-reference/x/list-members.mdx',
  'api-reference/x/verified-followers.mdx',
  'api-reference/x/user-tweets.mdx',
  'api-reference/x/user-replies.mdx',
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
    expect.assertions(21);

    const source = readFileSync(
      'snippets/automatic-coverage-pagination.mdx',
      'utf8',
    );
    const search = readFileSync(
      'api-reference/x/search-tweets.mdx',
      'utf8',
    );
    const replies = readFileSync(
      'api-reference/x/tweet-replies.mdx',
      'utf8',
    );
    const followers = readFileSync(
      'api-reference/x/followers.mdx',
      'utf8',
    );

    expect(source).toContain('Omit `mode` for automatic maximum coverage.');
    expect(source).toContain('Pass `next_cursor` back unchanged as `cursor`.');
    expect(source).toContain('Billing still counts only returned rows.');
    expect(source).toContain('Use `mode=standard` only');
    expect(source).toContain('A page can be empty or underfilled.');
    expect(source).toContain('has_next_page=false');
    expect(source).toContain('409 coverage_cursor_unavailable');
    expect(source).toContain('`Retry-After`');
    expect(source).toContain('retry the same cursor once.');
    expect(source).toContain('410 coverage_cursor_gone');
    expect(source).toContain('The response omits `Retry-After`.');
    expect(source).toContain('identity-mismatched cursors');
    expect(source).toContain('400 invalid_coverage_cursor');
    expect(source).toContain('Restart without them.');
    expect(replies).toContain('Automatic pages accept `1` through `300`.');
    expect(followers).toContain('Automatic pages accept `20` through `300`.');
    expect(search).toContain('every returned page');
    expect(search).toContain('The start is inclusive. The end is exclusive.');
    expect(search).toContain('continues past rejected rows');
    expect(search).toContain('`since_time:`');
    expect(search).toContain('`until_time:`');
  });

  it('keeps coverage guidance canonical', (): void => {
    expect.assertions(6);

    const openApi = readFileSync('openapi.yaml', 'utf8');
    const mcp = readFileSync('mcp/tools.mdx', 'utf8');

    expect(openApi).not.toContain('x-guidance');
    expect(openApi).not.toContain('**Find a tweet**');
    expect(openApi).toContain('Omit mode for resumable maximum coverage.');
    expect(openApi).toContain('Existing unprefixed cursors keep legacy');
    expect(mcp).toContain('Those operations use automatic maximum coverage.');
    expect(mcp).toContain('Use `mode=standard` only for legacy pagination.');
  });
});
