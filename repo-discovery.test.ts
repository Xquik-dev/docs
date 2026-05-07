import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface DiscoveryFinding {
  readonly issue: string;
}

const REQUIRED_README_SNIPPETS = [
  'tweet search',
  'user lookup',
  'follower exports',
  'media uploads',
  'direct messages',
  '1-second tweet monitors',
  'signed webhooks',
  'SDK clients',
  'X automation',
  '[Quickstart](https://docs.xquik.com/quickstart)',
  '[API Reference](https://docs.xquik.com/api-reference)',
  '[SDKs](https://docs.xquik.com/sdks)',
  '[MCP Server](https://docs.xquik.com/mcp)',
  '[Webhooks](https://docs.xquik.com/webhooks/overview)',
  '[llms.txt](https://docs.xquik.com/llms.txt)',
  '## Use With AI Coding Agents',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[OpenAPI spec](https://docs.xquik.com/openapi.yaml)',
] as const;

const REQUIRED_INTRODUCTION_SNIPPETS = [
  '## Use Xquik with AI agents',
  '[llms.txt](/llms.txt)',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[Xquik Skill](https://github.com/Xquik-dev/x-twitter-scraper)',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
] as const;

const REQUIRED_LLMS_SNIPPETS = [
  '## Agent Entry Points',
  'https://context7.com/xquik-dev/xquik-docs',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
  'https://docs.xquik.com/openapi.yaml',
] as const;

const MAX_LLMS_TXT_CHARS = 48_000;

const VAGUE_PUBLIC_POSITIONING = [
  ['X-specific', 'workflows'].join(' '),
  ['workflow', 'surface'].join(' '),
  ['operational', 'layer'].join(' '),
  ['high', 'tech'].join('-'),
] as const;

function collectReadmeDiscoveryFindings(): readonly DiscoveryFinding[] {
  const source = readFileSync('README.md', 'utf8');
  const findings: DiscoveryFinding[] = [];

  for (const snippet of REQUIRED_README_SNIPPETS) {
    if (!source.includes(snippet)) {
      findings.push({ issue: `README is missing "${snippet}".` });
    }
  }

  for (const phrase of VAGUE_PUBLIC_POSITIONING) {
    if (source.includes(phrase)) {
      findings.push({
        issue: `README contains vague positioning phrase "${phrase}".`,
      });
    }
  }

  return findings;
}

function collectSnippetFindings(
  source: string,
  label: string,
  snippets: readonly string[],
): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const snippet of snippets) {
    if (!source.includes(snippet)) {
      findings.push({ issue: `${label} is missing "${snippet}".` });
    }
  }

  return findings;
}

describe('repository discovery', (): void => {
  it('keeps the public README concrete and easy to find from GitHub search', (): void => {
    expect.assertions(1);

    expect(collectReadmeDiscoveryFindings()).toStrictEqual([]);
  });

  it('keeps public agent entry points visible to docs crawlers', (): void => {
    expect.assertions(1);

    const introduction = readFileSync('introduction.mdx', 'utf8');
    const llms = readFileSync('llms.txt', 'utf8');

    expect([
      ...collectSnippetFindings(
        introduction,
        'Introduction',
        REQUIRED_INTRODUCTION_SNIPPETS,
      ),
      ...collectSnippetFindings(llms, 'llms.txt', REQUIRED_LLMS_SNIPPETS),
    ]).toStrictEqual([]);
  });

  it('keeps llms.txt below the agent score size threshold with headroom', (): void => {
    expect.assertions(1);

    const llms = readFileSync('llms.txt', 'utf8');

    expect(llms.length).toBeLessThanOrEqual(MAX_LLMS_TXT_CHARS);
  });
});
