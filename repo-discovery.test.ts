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

describe('repository discovery', (): void => {
  it('keeps the public README concrete and easy to find from GitHub search', (): void => {
    expect.assertions(1);

    expect(collectReadmeDiscoveryFindings()).toStrictEqual([]);
  });
});
