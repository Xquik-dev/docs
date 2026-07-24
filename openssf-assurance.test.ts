import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const INDEPENDENCE_NOTICE =
  'Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.';

describe('OpenSSF shared-site assurance', (): void => {
  it('records the repository applicability without claiming Gold', (): void => {
    expect.assertions(7);

    const page = readFileSync('guides/open-source-assurance.mdx', 'utf8');
    const docsConfig = readFileSync('docs.json', 'utf8');

    expect(page).toContain('17 standalone Xquik open-source projects');
    expect(page).toContain('xquik-docs` has no separate badge entry');
    expect(page).toContain(
      'https://www.bestpractices.dev/en/criteria_discussion#terminology',
    );
    expect(page).toContain(
      'https://github.com/Xquik-dev/.github/blob/main/OPENSSF.md',
    );
    expect(page).toContain('Do not claim Gold');
    expect(page).toContain(INDEPENDENCE_NOTICE);
    expect(docsConfig).toContain('guides/open-source-assurance');
  });

  it('keeps contribution and vulnerability policies verifiable', (): void => {
    expect.assertions(8);

    const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
    const security = readFileSync('SECURITY.md', 'utf8');
    const securityPage = readFileSync('security.mdx', 'utf8');

    expect(contributing).toContain('Developer Certificate of Origin');
    expect(contributing).toContain('git commit --signoff');
    expect(contributing).toContain(
      'Another human must review maintainer-authored, nontrivial changes.',
    );
    expect(contributing).toContain(
      'https://github.com/Xquik-dev/.github/blob/main/REVIEWING.md',
    );
    expect(security).toContain(
      'https://github.com/Xquik-dev/xquik-docs/security/advisories/new',
    );
    expect(security).toContain('at least every 14 days');
    expect(security).toContain('## Threat Model');
    expect(securityPage).toContain('Pinned workflows and lockfile integrity');
  });

  it('pins CI actions and limits workflow authority', (): void => {
    expect.assertions(7);

    const docsWorkflow = readFileSync(
      '.github/workflows/agent-docs.yml',
      'utf8',
    );
    const refreshWorkflow = readFileSync(
      '.github/workflows/context7-refresh.yml',
      'utf8',
    );
    const actionUses = [...docsWorkflow.matchAll(/^\s*uses:\s*(.+)$/gmu)].map(
      (match): string => match[1] ?? '',
    );

    expect(actionUses).not.toHaveLength(0);
    expect(actionUses.every((use): boolean => /@[0-9a-f]{40}\b/u.test(use))).toBe(
      true,
    );
    expect(`${docsWorkflow}\n${refreshWorkflow}`).not.toContain(
      'runs-on: ubuntu-latest',
    );
    expect(docsWorkflow).toContain('permissions:\n  contents: read');
    expect(docsWorkflow).toContain('persist-credentials: false');
    expect(docsWorkflow).toContain('npm ci --ignore-scripts');
    expect(refreshWorkflow).toContain("--proto '=https'");
  });
});
