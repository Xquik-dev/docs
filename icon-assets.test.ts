import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface IconFinding {
  readonly file: string;
  readonly issue: string;
}

interface DocsIconConfig {
  readonly favicon: string;
  readonly logo: {
    readonly dark: string;
    readonly light: string;
  };
}

const INVALID_ICON_REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ['bell-slash', 'bell-off'],
  ['circle-exclamation', 'circle-alert'],
  ['circle-info', 'info'],
  ['clock-rotate-left', 'history'],
  ['file-json', 'braces'],
  ['file-warning', 'triangle-alert'],
  ['filter', 'funnel'],
  ['home', 'house'],
  ['magnifying-glass', 'search'],
  ['messages', 'messages-square'],
  ['microsoft', 'workflow'],
  ['pause-circle', 'circle-pause'],
  ['play-circle', 'circle-play'],
  ['retweet', 'repeat-2'],
  ['user-group', 'users'],
  ['user-shield', 'shield-user'],
]);

const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.github',
  'node_modules',
] as const);

function listMarkdownFiles(directory = '.'): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name)
        ? []
        : listMarkdownFiles(path);
    }

    if (entry.name === 'DOCS_QUALITY_POLL.md') {
      return [];
    }

    return entry.isFile() && /\.mdx?$/u.test(entry.name) ? [path] : [];
  });
}

function inspectIcon(
  file: string,
  icon: string,
  findings: IconFinding[],
): void {
  if (icon.startsWith('/')) {
    if (!existsSync(`.${icon}`)) {
      findings.push({ file, issue: `Local icon ${icon} does not exist.` });
    }
    return;
  }

  const replacement = INVALID_ICON_REPLACEMENTS.get(icon);
  if (replacement !== undefined) {
    findings.push({
      file,
      issue: `Lucide icon ${icon} returns 403. Use ${replacement}.`,
    });
  }
}

function collectIconFindings(): readonly IconFinding[] {
  const findings: IconFinding[] = [];

  for (const file of listMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /\bicon\s*=\s*["']([^"']+)["']/gu,
    )) {
      inspectIcon(file, match[1], findings);
    }
  }

  const docsSource = readFileSync('docs.json', 'utf8');
  for (const match of docsSource.matchAll(/"icon"\s*:\s*"([^"]+)"/gu)) {
    inspectIcon('docs.json', match[1], findings);
  }

  const docsConfig = JSON.parse(docsSource) as DocsIconConfig;
  for (const asset of [
    docsConfig.favicon,
    docsConfig.logo.dark,
    docsConfig.logo.light,
  ]) {
    inspectIcon('docs.json', asset, findings);
  }

  return findings;
}

describe('icon assets', (): void => {
  it('keeps local and Lucide icon references loadable', (): void => {
    expect.assertions(1);

    expect(collectIconFindings()).toStrictEqual([]);
  });
});
