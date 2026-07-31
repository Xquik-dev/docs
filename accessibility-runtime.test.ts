import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('Mintlify accessibility overrides', (): void => {
  it('leaves linked card semantics to the nested anchor', (): void => {
    expect.assertions(8);

    const source = readFileSync('accessibility.js', 'utf8');

    expect(source).toContain('#content .card[role="link"]');
    expect(source).toContain("card.removeAttribute('role')");
    expect(source).toContain("card.removeAttribute('tabindex')");
    expect(source).toContain("card.removeAttribute('aria-labelledby')");
    expect(source).toContain("anchor.removeAttribute('aria-hidden')");
    expect(source).toContain("anchor.setAttribute('tabindex', '0')");
    expect(source).toContain('new MutationObserver(scheduleAccessibilityUpdate)');
    expect(source).not.toMatch(/https?:\/\//u);
  });

  it('uses an AA-safe light-theme label color', (): void => {
    expect.assertions(3);

    const source = readFileSync('custom.css', 'utf8');

    expect(source).toContain('html:not(.dark) #pagination a span');
    expect(source).toContain('html:not(.dark) footer a');
    expect(source).toContain('color: #5f5d5c !important;');
  });
});
