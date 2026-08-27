import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const DOCS_ORIGIN = 'https://docs.xquik.com';
const MARKDOWN_LINK_PATTERN =
  /\[[^\]]+\]\(https:\/\/docs\.xquik\.com\/([^\s)]*)\)/gu;

interface NavigationGroup {
  readonly anchors?: readonly NavigationItem[];
  readonly groups?: readonly NavigationItem[];
  readonly pages?: readonly NavigationItem[];
  readonly tabs?: readonly NavigationItem[];
}

type NavigationItem = string | NavigationGroup;

interface DocsConfig {
  readonly navigation: NavigationGroup;
}

function firstNavigationPage(item: NavigationItem): string | undefined {
  if (typeof item === 'string') {
    return normalizePagePath(item);
  }

  for (const child of [
    ...(item.anchors ?? []),
    ...(item.groups ?? []),
    ...(item.pages ?? []),
    ...(item.tabs ?? []),
  ]) {
    const page = firstNavigationPage(child);
    if (page !== undefined) return page;
  }

  return undefined;
}

function navigationGroupEntries(navigation: NavigationGroup): readonly string[] {
  return (navigation.tabs ?? []).flatMap((tab): readonly string[] => {
    if (typeof tab === 'string') return [normalizePagePath(tab)];

    return (tab.groups ?? []).flatMap((group): readonly string[] => {
      const page = firstNavigationPage(group);
      return page === undefined ? [] : [page];
    });
  });
}

function normalizePagePath(page: string): string {
  const normalizedPage = page
    .replace(/^\/+/u, '')
    .replace(/\.mdx?$/u, '')
    .replace(/#.*$/u, '');

  return normalizedPage === 'index' ? '' : normalizedPage;
}

function documentedLlmsPages(source: string): ReadonlySet<string> {
  return new Set(
    [...source.matchAll(MARKDOWN_LINK_PATTERN)].map((match): string =>
      normalizePagePath(match[1] ?? ''),
    ),
  );
}

describe('llms.txt coverage', (): void => {
  it('links every top-level docs navigation group', (): void => {
    expect.assertions(1);

    const docsConfig = JSON.parse(
      readFileSync('docs.json', 'utf8'),
    ) as DocsConfig;
    const expectedPages = navigationGroupEntries(docsConfig.navigation);
    const actualPages = documentedLlmsPages(readFileSync('llms.txt', 'utf8'));
    const missingPages = expectedPages
      .filter((page): boolean => !actualPages.has(page))
      .map((page): string => `${DOCS_ORIGIN}/${page}`);

    expect(missingPages).toStrictEqual([]);
  });
});
