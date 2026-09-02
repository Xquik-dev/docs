import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('hosted MCP idempotency contract', () => {
  it('documents automatic required-header injection without a header input', () => {
    expect.assertions(12);

    const overview = read('mcp/overview.mdx');
    const tools = read('mcp/tools.mdx');
    const handoff = read('mcp/agent-handoff.mdx');
    const skill = read('skill.md');

    expect(overview).toMatch(/required idempotency headers (?:are )?injected/);
    expect(tools).toMatch(/required idempotency headers (?:are )?injected/);
    expect(handoff).toContain(
      'Hosted MCP injects authentication and required idempotency headers.',
    );
    expect(skill).toContain(
      'Hosted MCP injects required write\nidempotency headers.',
    );
    expect(tools).toContain(
      'Hosted MCP injects the required `Idempotency-Key`.',
    );
    expect(tools).not.toMatch(/headers\??:\s*Record/);
    expect(tools).toContain(
      'reuses it for bounded transient retries.',
    );
    expect(overview).toContain(
      'reuses each generated key for bounded transient retries.',
    );
    expect(tools).toContain(
      'Retry only when `safe_to_retry` is true.',
    );
    expect(skill).toContain('Never resubmit an ambiguous write.');
    expect(skill).toContain(
      'Start a new write attempt only when `safeToRetry` is true.',
    );
    expect(skill).not.toContain(
      'Retry only `429` and `5xx` responses.',
    );
  });
});
