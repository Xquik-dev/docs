import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  it('publishes the current server version in every setup document', (): void => {
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
    expect.assertions(setupDocuments.length * 2);

    for (const document of setupDocuments) {
      expect(document).toContain('2.6.39');
      expect(document).not.toContain('2.5.6');
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
});
