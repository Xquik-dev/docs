import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const CONTEXT7_LIBRARY_URL = 'https://context7.com/xquik-dev/xquik-docs';
const PUBLIC_KEY_PREFIX = 'pk_';
const REQUIRED_EXCLUDED_FILES = [
  '.gitignore',
  '.mintignore',
  'AGENTS.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'DOCS_QUALITY_POLL.md',
  'LICENSE',
  'SECURITY.md',
  'agent-docs.config.yml',
  'agent-docs.test.ts',
  'api-content-quality.test.ts',
  'api-params.test.ts',
  'api-response-fields.test.ts',
  'api-response-status.test.ts',
  'context7-config.test.ts',
  'endpoint-strings.test.ts',
  'event-types.test.ts',
  'llms-coverage.test.ts',
  'mintignore.test.ts',
  'mpp-payment-metadata.test.ts',
  'navigation-state.test.ts',
  'openapi-parity.test.ts',
  'package-lock.json',
  'package.json',
  'plugin-docs.test.ts',
  'repo-discovery.test.ts',
  'seo-metadata.test.ts',
] as const;

const REQUIRED_EXCLUDED_FOLDERS = ['.github', 'node_modules'] as const;
const REQUIRED_RULE_SNIPPETS = [
  'quickstart.mdx',
  'api-reference/overview.mdx',
  'sdks/',
  'mcp/',
  'webhooks/',
] as const;

interface Context7Config {
  readonly $schema?: string;
  readonly branch?: string;
  readonly excludeFiles?: readonly string[];
  readonly excludeFolders?: readonly string[];
  readonly public_key?: string;
  readonly rules?: readonly string[];
  readonly url?: string;
}

function readContext7Config(): Context7Config {
  return JSON.parse(readFileSync('context7.json', 'utf8')) as Context7Config;
}

function missingEntries(
  actual: readonly string[] | undefined,
  expected: readonly string[],
): readonly string[] {
  const actualEntries = new Set(actual ?? []);

  return expected.filter((entry): boolean => !actualEntries.has(entry));
}

describe('Context7 configuration', (): void => {
  it('keeps ownership fields exact for the public docs repository library', (): void => {
    expect.assertions(4);

    const config = readContext7Config();

    expect(config.$schema).toBe('https://context7.com/schema/context7.json');
    expect(config.branch).toBe('main');
    expect(config.url).toBe(CONTEXT7_LIBRARY_URL);
    expect(config.public_key?.startsWith(PUBLIC_KEY_PREFIX)).toBe(true);
  });

  it('keeps non-doc repository files out of Context7 parsing', (): void => {
    expect.assertions(2);

    const config = readContext7Config();

    expect(missingEntries(config.excludeFiles, REQUIRED_EXCLUDED_FILES)).toStrictEqual(
      [],
    );
    expect(
      missingEntries(config.excludeFolders, REQUIRED_EXCLUDED_FOLDERS),
    ).toStrictEqual([]);
  });

  it('keeps Context7 rules pointed at the pages agents should read first', (): void => {
    expect.assertions(1);

    const config = readContext7Config();
    const rules = (config.rules ?? []).join('\n');
    const missingRuleSnippets = REQUIRED_RULE_SNIPPETS.filter(
      (snippet): boolean => !rules.includes(snippet),
    );

    expect(missingRuleSnippets).toStrictEqual([]);
  });
});
