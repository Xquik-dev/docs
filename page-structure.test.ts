import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface PageStructureFinding {
  readonly file: string;
  readonly issue: string;
}

const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules'] as const);

function listMdxFiles(directory = '.'): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name) ? [] : listMdxFiles(path);
    }

    return entry.isFile() && entry.name.endsWith('.mdx') ? [path] : [];
  });
}

function collectPageStructureFindings(): readonly PageStructureFinding[] {
  const findings: PageStructureFinding[] = [];

  for (const file of listMdxFiles()) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split(/\r?\n/u);
    let insideCodeFence = false;
    let insideCodeGroup = false;
    let previousHeadingLevel = 1;

    if (/<Tabs>(?:(?!<\/Tabs>)[\s\S])*?<ResponseField\b/u.test(source)) {
      findings.push({
        file,
        issue: 'ResponseField cannot be nested inside Tabs.',
      });
    }

    for (const [index, line] of lines.entries()) {
      if (
        insideCodeGroup &&
        !insideCodeFence &&
        /^\s*```[A-Za-z0-9#+.-]+\s*$/u.test(line)
      ) {
        findings.push({
          file,
          issue: `CodeGroup fence on line ${index + 1} needs a visible tab title.`,
        });
      }

      if (/^\s*```/u.test(line)) {
        insideCodeFence = !insideCodeFence;
        continue;
      }

      if (insideCodeFence) {
        continue;
      }

      if (/^\s*<CodeGroup>\s*$/u.test(line)) {
        insideCodeGroup = true;
      } else if (/^\s*<\/CodeGroup>\s*$/u.test(line)) {
        insideCodeGroup = false;
      }

      const heading = /^(#{1,6})\s+/u.exec(line);
      if (heading === null) {
        continue;
      }

      const headingLevel = heading[1].length;
      if (headingLevel > previousHeadingLevel + 1) {
        findings.push({
          file,
          issue: `Heading on line ${index + 1} skips from H${previousHeadingLevel} to H${headingLevel}.`,
        });
      }
      previousHeadingLevel = headingLevel;
    }
  }

  return findings;
}

describe('page structure', (): void => {
  it('keeps CodeGroup labels and heading order accessible', (): void => {
    expect.assertions(1);

    expect(collectPageStructureFindings()).toStrictEqual([]);
  });
});
