import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const OVERVIEW = readFileSync(join(PROJECT_ROOT, 'mcp/overview.mdx'), 'utf8');
const TOOLS = readFileSync(join(PROJECT_ROOT, 'mcp/tools.mdx'), 'utf8');
const AGENT_HANDOFF = readFileSync(
  join(PROJECT_ROOT, 'mcp/agent-handoff.mdx'),
  'utf8',
);
const DOCS_MCP = readFileSync(join(PROJECT_ROOT, 'mcp/docs-mcp.mdx'), 'utf8');
const QUICKSTART = readFileSync(
  join(PROJECT_ROOT, 'x-api-quickstart.mdx'),
  'utf8',
);
const INTRODUCTION = readFileSync(join(PROJECT_ROOT, 'index.mdx'), 'utf8');
const SKILL = readFileSync(join(PROJECT_ROOT, 'skill.md'), 'utf8');
const LLMS = readFileSync(join(PROJECT_ROOT, 'llms.txt'), 'utf8');
const CONTEXT7 = readFileSync(join(PROJECT_ROOT, 'context7.json'), 'utf8');
const CHANGELOG = readFileSync(join(PROJECT_ROOT, 'changelog.mdx'), 'utf8');
const README = readFileSync(join(PROJECT_ROOT, 'README.md'), 'utf8');

describe('MCP 2026-07-28 documentation contract', (): void => {
  it('projects the search example without returning large response schemas', async (): Promise<void> => {
    expect.assertions(6);
    const example = /```javascript\n([\s\S]*?)\n```/u.exec(TOOLS)?.[1];
    expect(example).toBeDefined();
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
    expect(TOOLS).toContain('Inspect specific response properties');
    expect(TOOLS).toContain('Pass the function itself, not a promise or its result.');
    expect(TOOLS).toContain('Non-functions fail before any API request starts.');
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
