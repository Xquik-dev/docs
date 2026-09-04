import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readDocument(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const OVERVIEW = readDocument('mcp/overview.mdx');
const TOOLS = readDocument('mcp/tools.mdx');
const SKILL = readDocument('skill.md');
const LLMS = readDocument('llms.txt');
const CHANGELOG = readDocument('changelog.mdx');
const README = readDocument('README.md');

describe('MCP 2026-07-28 documentation contract', (): void => {
  it('keeps volatile server versions out of setup documents', (): void => {
    const setupDocuments = [
      OVERVIEW,
      TOOLS,
      readDocument('mcp/agent-handoff.mdx'),
      readDocument('mcp/docs-mcp.mdx'),
      readDocument('x-api-quickstart.mdx'),
      readDocument('index.mdx'),
      SKILL,
      LLMS,
      readDocument('context7.json'),
      README,
    ];
    expect.assertions(setupDocuments.length);

    for (const document of setupDocuments) {
      expect(document).not.toMatch(/\b(?:API )?MCP (?:server )?v\d+\.\d+\.\d+\b/u);
    }
  });

  it('explains modern negotiation and safe cache behavior', (): void => {
    expect.assertions(12);

    expect(OVERVIEW).toContain('MCP `2026-07-28`');
    expect(OVERVIEW).toContain('server/discover');
    expect(OVERVIEW).toContain('They do not call `initialize`');
    expect(OVERVIEW).toContain('private cache hints');
    expect(OVERVIEW).toContain('same authorization context');
    expect(OVERVIEW).toContain('stateless 2025-era clients');
    expect(OVERVIEW).toContain('application/json');
    expect(OVERVIEW).toContain('text/event-stream');
    expect(OVERVIEW).toContain('`X-Request-Id`');
    expect(OVERVIEW).toContain('not the JSON-RPC message or authenticated session');
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
