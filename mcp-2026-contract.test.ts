import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8');
const OVERVIEW = read('mcp/overview.mdx');
const TOOLS = read('mcp/tools.mdx');
const AGENT_HANDOFF = read('mcp/agent-handoff.mdx');
const DOCS_MCP = read('mcp/docs-mcp.mdx');
const QUICKSTART = read('x-api-quickstart.mdx');
const INTRODUCTION = read('index.mdx');
const SKILL = read('skill.md');
const LLMS = read('llms.txt');
const CONTEXT7 = read('context7.json');
const CHANGELOG = read('changelog.mdx');
const README = read('README.md');

describe('MCP 2026-07-28 documentation contract', (): void => {
  it('projects the search example without returning large response schemas', async (): Promise<void> => {
    expect.assertions(10);
    const example = /```javascript\n([\s\S]*?)\n```/u.exec(TOOLS)?.[1];
    expect(example).toBeDefined();
    const responseExample = [...TOOLS.matchAll(/```javascript\n([\s\S]*?)\n```/gu)][1]?.[1];
    const properties = { tweets: { type: 'array' } };
    const spec = { components: { schemas: { PaginatedTweets: { properties } } } };
    expect(await runInNewContext(`(${responseExample})()`, { spec })).toEqual(properties);
    const path = '/api/v1/x/tweets/search';
    const operation = {
      operationId: 'searchTweets',
      summary: 'Search Tweets',
      parameters: [{ name: 'q', in: 'query', required: true }],
      responses: { description: 'x'.repeat(24_001) },
    };
    const result: unknown = await runInNewContext(`(${example})()`, {
      spec: { paths: { [path]: { get: operation } } },
    });
    expect(result).toEqual({
      path,
      method: 'GET',
      operationId: operation.operationId,
      summary: operation.summary,
      parameters: operation.parameters,
    });
    expect(JSON.stringify(result).length).toBeLessThan(24_000);
    expect(TOOLS).toMatch(/Inspect specific response properties[\s\S]*Both `search` and `execute` return compact JSON within 24,000 characters\. Whitespace inside strings stays unchanged\./u);
    expect(TOOLS).toContain('Pass the function itself, not a promise or its result.');
    expect(TOOLS).toContain('Non-functions fail before any API request starts.');
    expect(TOOLS).toContain('Native API tools apply the same limit to successful & failed responses.');
    expect(TOOLS).toContain('Oversized output returns `isError: true`');
    expect(TOOLS).toContain('Output errors do not undo completed API actions or charges.');
  });

  it('keeps volatile server versions out of setup documents', (): void => {
    const setupDocuments = [
      OVERVIEW,
      TOOLS,
      AGENT_HANDOFF,
      DOCS_MCP,
      QUICKSTART,
      INTRODUCTION,
      SKILL,
      LLMS,
      CONTEXT7,
      README,
    ];
    expect.assertions(setupDocuments.length);

    for (const document of setupDocuments) {
      expect(document).not.toMatch(/\b(?:API )?MCP (?:server )?v\d+\.\d+\.\d+\b/u);
    }
  });

  it('explains modern negotiation and safe cache behavior', (): void => {
    expect.assertions(10);

    expect(OVERVIEW).toContain('MCP `2026-07-28`');
    expect(OVERVIEW).toContain('server/discover');
    expect(OVERVIEW).toContain('They do not call `initialize`');
    expect(OVERVIEW).toContain('private cache hints');
    expect(OVERVIEW).toContain('same authorization context');
    expect(OVERVIEW).toContain('stateless 2025-era clients');
    expect(OVERVIEW).toContain('application/json');
    expect(OVERVIEW).toContain('text/event-stream');
    expect(SKILL).toContain('MCP `2026-07-28`');
    expect(LLMS).toContain('MCP 2026-07-28');
  });

  it('keeps README and changelog release guidance visible', (): void => {
    expect.assertions(5);

    expect(README).toContain('MCP 2026-07-28');
    expect(README).toContain('server/discover');
    expect(CHANGELOG).toContain('API MCP v2.6.0');
    expect(CHANGELOG).toContain('MCP `2026-07-28`');
    expect(CHANGELOG).toContain('private cache hints');
  });

  it('documents optional OpenAPI-native tools without changing the default', (): void => {
    expect.assertions(7);

    expect(OVERVIEW).toContain('https://xquik.com/mcp?codemode=false');
    expect(OVERVIEW).toContain('Code Mode is the default');
    expect(OVERVIEW).toContain('one tool per OpenAPI operation');
    expect(TOOLS).toContain('119 tools');
    expect(TOOLS).toContain('34 tools');
    expect(TOOLS).toContain('embeds no model prompt');
    expect(README).toContain('OpenAPI-native tools');
  });
});
