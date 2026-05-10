import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const CONTEXT7_LIBRARY_URL = 'https://context7.com/xquik-dev/xquik-docs';
const CONTEXT7_WEBSITE_URL = 'https://context7.com/websites/xquik';
const CONTEXT7_REFRESH_WORKFLOW = '.github/workflows/context7-refresh.yml';
const PUBLIC_KEY_PREFIX = 'pk_';
const CONTEXT7_PUBLIC_KEY = 'pk_oCPeRRqZFJsY4cCUSotDD';
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
  'alternatives.mdx',
  'context7-config.test.ts',
  'custom.css',
  'docs.json',
  'endpoint-strings.test.ts',
  'event-types.test.ts',
  'favicon.svg',
  'llms-coverage.test.ts',
  'mintignore.test.ts',
  'mpp-payment-metadata.test.ts',
  'navigation-state.test.ts',
  'openapi-parity.test.ts',
  'package-lock.json',
  'package.json',
  'plugin-docs.test.ts',
  'repo-discovery.test.ts',
  'robots.txt',
  'seo-metadata.test.ts',
] as const;

const REQUIRED_EXCLUDED_FOLDERS = [
  '.github',
  'alternatives',
  'node_modules',
] as const;
const REQUIRED_RULE_SNIPPETS = [
  'quickstart.mdx',
  'api-reference/overview.mdx',
  'sdks/',
  'mcp/',
  'webhooks/',
  'guides/workflows.mdx',
  'guides/tweet-search-export.mdx',
  'guides/tweet-replies-export.mdx',
  'guides/follower-export-crm.mdx',
  'guides/media-upload-workflow.mdx',
  'guides/direct-message-workflow.mdx',
] as const;
const REQUIRED_REFRESH_WORKFLOW_SNIPPETS = [
  'CONTEXT7_API_KEY: ${{ secrets.CONTEXT7_API_KEY }}',
  '::warning ::CONTEXT7_API_KEY secret is not configured.',
  'exit 0',
  'https://context7.com/api/v1/refresh',
  '{"libraryName": "/xquik-dev/xquik-docs"}',
  'Context7 refresh is not due yet.',
  'Context7 refresh is rate limited.',
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

function readContext7WebsiteClaim(): Context7Config {
  return JSON.parse(readFileSync('docs/context7.json', 'utf8')) as Context7Config;
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

  it('keeps the public website ownership claim exact', (): void => {
    expect.assertions(2);

    const claim = readContext7WebsiteClaim();

    expect(claim.url).toBe(CONTEXT7_WEBSITE_URL);
    expect(claim.public_key).toBe(CONTEXT7_PUBLIC_KEY);
  });

  it('keeps skipped Context7 refreshes visible in GitHub Actions', (): void => {
    expect.assertions(1);

    const workflow = readFileSync(CONTEXT7_REFRESH_WORKFLOW, 'utf8');
    const missingSnippets = REQUIRED_REFRESH_WORKFLOW_SNIPPETS.filter(
      (snippet): boolean => !workflow.includes(snippet),
    );

    expect(missingSnippets).toStrictEqual([]);
  });
});
