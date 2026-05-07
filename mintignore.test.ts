import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const GIT_IGNORED_INTERNAL_FILES = ['DOCS_QUALITY_POLL.md'] as const;
const MINTLIFY_IGNORED_SUPPORT_FILES = [
  'AGENTS.md',
  ...GIT_IGNORED_INTERNAL_FILES,
] as const;

function mintignoreEntries(): ReadonlySet<string> {
  return new Set(
    readFileSync('.mintignore', 'utf8')
      .split(/\r?\n/u)
      .map((line): string => line.trim())
      .filter((line): boolean => line !== '' && !line.startsWith('#')),
  );
}

function gitignoreEntries(): ReadonlySet<string> {
  return new Set(
    readFileSync('.gitignore', 'utf8')
      .split(/\r?\n/u)
      .map((line): string => line.trim())
      .filter((line): boolean => line !== '' && !line.startsWith('#')),
  );
}

describe('Mintlify ignore rules', (): void => {
  it('keeps support and handoff files out of the public docs build', (): void => {
    expect.assertions(1);

    const ignoredFiles = mintignoreEntries();
    const mintlifyExposedFiles = MINTLIFY_IGNORED_SUPPORT_FILES.filter(
      (file): boolean => !ignoredFiles.has(file),
    );

    expect(mintlifyExposedFiles).toStrictEqual([]);
  });

  it('keeps internal handoff files ignored by Git', (): void => {
    expect.assertions(1);

    const gitIgnoredFiles = gitignoreEntries();
    const gitExposedFiles = GIT_IGNORED_INTERNAL_FILES.filter(
      (file): boolean => !gitIgnoredFiles.has(file),
    );

    expect(gitExposedFiles).toStrictEqual([]);
  });
});
