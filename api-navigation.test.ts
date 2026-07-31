import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface ApiPageNavigation {
  readonly file: string;
  readonly sidebarTitle: string;
}

interface GuidePageNavigation extends ApiPageNavigation {
  readonly title: string;
}

interface SidebarFindings {
  readonly duplicates: [string, string[]][];
  readonly missing: ApiPageNavigation[];
  readonly verbose: ApiPageNavigation[];
}

function listMdxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listMdxFiles(path);
    }

    return entry.isFile() && entry.name.endsWith('.mdx') ? [path] : [];
  });
}

function readApiNavigation(): ApiPageNavigation[] {
  return listMdxFiles('api-reference')
    .sort()
    .map((file): ApiPageNavigation => {
      const source = readFileSync(file, 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? '';
      const sidebarTitle =
        frontmatter.match(/^sidebarTitle:\s*["']?(.*?)["']?\s*$/mu)?.[1] ?? '';

      return { file, sidebarTitle };
    });
}

function readLongGuideNavigation(): GuidePageNavigation[] {
  return listMdxFiles('guides')
    .sort()
    .map((file): GuidePageNavigation => {
      const source = readFileSync(file, 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? '';
      const title =
        frontmatter.match(/^title:\s*["']?(.*?)["']?\s*$/mu)?.[1] ?? '';
      const sidebarTitle =
        frontmatter.match(/^sidebarTitle:\s*["']?(.*?)["']?\s*$/mu)?.[1] ?? '';

      return { file, sidebarTitle, title };
    })
    .filter((page): boolean => page.title.length > 32);
}

function collectSidebarFindings(
  pages: ApiPageNavigation[],
): SidebarFindings {
  const missing = pages.filter((page): boolean => page.sidebarTitle.length === 0);
  const verbose = pages.filter((page): boolean => page.sidebarTitle.length > 24);
  const filesByTitle = new Map<string, string[]>();

  for (const page of pages) {
    const files = filesByTitle.get(page.sidebarTitle) ?? [];
    files.push(page.file);
    filesByTitle.set(page.sidebarTitle, files);
  }

  const duplicates = [...filesByTitle.entries()].filter(
    ([title, files]): boolean => title.length > 0 && files.length > 1,
  );

  return { duplicates, missing, verbose };
}

describe('API navigation', (): void => {
  it('keeps every API sidebar label concise and unique', (): void => {
    expect.assertions(3);

    const pages = readApiNavigation();
    const { duplicates, missing, verbose } = collectSidebarFindings(pages);

    expect(missing).toStrictEqual([]);
    expect(verbose).toStrictEqual([]);
    expect(duplicates).toStrictEqual([]);
  });

  it('keeps long guide SEO titles out of the sidebar', (): void => {
    expect.assertions(3);

    const pages = readLongGuideNavigation();
    const { duplicates, missing, verbose } = collectSidebarFindings(pages);

    expect(missing).toStrictEqual([]);
    expect(verbose).toStrictEqual([]);
    expect(duplicates).toStrictEqual([]);
  });
});
