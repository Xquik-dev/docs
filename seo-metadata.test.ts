import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIN_DESCRIPTION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 170;
const MIN_RENDERED_TITLE_LENGTH = 30;
const MAX_RENDERED_TITLE_LENGTH = 70;
const TITLE_SUFFIX = ' - Xquik';
const SITE_DESCRIPTION =
  'Search tweets, export followers and replies, retrieve profiles and timelines, monitor accounts, post tweets, and use webhooks, SDKs & MCP. Not affiliated with X Corp.';

interface NavigationGroup {
  readonly anchors?: readonly NavigationItem[];
  readonly groups?: readonly NavigationItem[];
  readonly pages?: readonly NavigationItem[];
  readonly tabs?: readonly NavigationItem[];
}

type NavigationItem = string | NavigationGroup;

interface DocsConfig {
  readonly description: string;
  readonly metadata: {
    readonly 'og:description': string;
    readonly timestamp: boolean;
  };
  readonly navigation: NavigationGroup;
  readonly search: {
    readonly prompt: string;
  };
  readonly seo: {
    readonly indexing: string;
  };
}

interface MetadataFinding {
  readonly file: string;
  readonly issue: string;
}

function flattenNavigationPages(item: NavigationItem): readonly string[] {
  if (typeof item === 'string') {
    return [normalizePagePath(item)];
  }

  return [
    ...(item.anchors ?? []),
    ...(item.groups ?? []),
    ...(item.pages ?? []),
    ...(item.tabs ?? []),
  ].flatMap(flattenNavigationPages);
}

function normalizePagePath(page: string): string {
  return page
    .replace(/^\/+/u, '')
    .replace(/\.mdx?$/u, '')
    .replace(/#.*$/u, '');
}

function frontmatter(source: string): string | undefined {
  return /^---\n([\s\S]*?)\n---/u.exec(source)?.[1];
}

function frontmatterValue(metadata: string, key: string): string | undefined {
  const match = new RegExp(
    `^${key}:\\s*(?:"([^"]*)"|'([^']*)'|(.+))$`,
    'mu',
  ).exec(metadata);
  return match?.[1] ?? match?.[2] ?? match?.[3]?.trim();
}

function loadDocsConfig(): DocsConfig {
  return JSON.parse(readFileSync('docs.json', 'utf8')) as DocsConfig;
}

function navigationPages(): readonly string[] {
  return [...new Set(flattenNavigationPages(loadDocsConfig().navigation))];
}

function collectMetadataFindings(): readonly MetadataFinding[] {
  const findings: MetadataFinding[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  for (const page of navigationPages()) {
    const file = `${page}.mdx`;
    const metadata = frontmatter(readFileSync(file, 'utf8'));
    if (metadata === undefined) {
      findings.push({ file, issue: 'Missing frontmatter.' });
      continue;
    }

    const title = frontmatterValue(metadata, 'title');
    if (title === undefined || title.trim() === '') {
      findings.push({ file, issue: 'Missing title.' });
    } else {
      const renderedTitle = `${title}${TITLE_SUFFIX}`;
      if (renderedTitle.length < MIN_RENDERED_TITLE_LENGTH) {
        findings.push({
          file,
          issue: `Rendered title is ${renderedTitle.length} characters; minimum is ${MIN_RENDERED_TITLE_LENGTH}.`,
        });
      }

      if (renderedTitle.length > MAX_RENDERED_TITLE_LENGTH) {
        findings.push({
          file,
          issue: `Rendered title is ${renderedTitle.length} characters; maximum is ${MAX_RENDERED_TITLE_LENGTH}.`,
        });
      }

      const duplicateFile = titles.get(renderedTitle);
      if (duplicateFile === undefined) {
        titles.set(renderedTitle, file);
      } else {
        findings.push({
          file,
          issue: `Rendered title duplicates ${duplicateFile}.`,
        });
      }
    }

    const description = frontmatterValue(metadata, 'description');
    if (description === undefined || description.trim() === '') {
      findings.push({ file, issue: 'Missing description.' });
      continue;
    }

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      findings.push({
        file,
        issue: `Description is ${description.length} characters; minimum is ${MIN_DESCRIPTION_LENGTH}.`,
      });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      findings.push({
        file,
        issue: `Description is ${description.length} characters; maximum is ${MAX_DESCRIPTION_LENGTH}.`,
      });
    }

    const duplicateFile = descriptions.get(description);
    if (duplicateFile === undefined) {
      descriptions.set(description, file);
    } else {
      findings.push({
        file,
        issue: `Description duplicates ${duplicateFile}.`,
      });
    }
  }

  return findings;
}

describe('SEO metadata', (): void => {
  it('keeps site discovery metadata specific and intentionally indexed', (): void => {
    expect.assertions(1);

    const config = loadDocsConfig();
    expect({
      description: config.description,
      indexing: config.seo.indexing,
      openGraphDescription: config.metadata['og:description'],
      searchPrompt: config.search.prompt,
      timestamps: config.metadata.timestamp,
    }).toStrictEqual({
      description: SITE_DESCRIPTION,
      indexing: 'all',
      openGraphDescription: SITE_DESCRIPTION,
      searchPrompt: 'Search documentation...',
      timestamps: true,
    });
  });

  it('keeps every navigation page title and description usable for search previews', (): void => {
    expect.assertions(1);

    expect(collectMetadataFindings()).toStrictEqual([]);
  });
});
