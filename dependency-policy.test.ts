import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const checker = resolve('scripts/check-dependency-policy.mjs');
const metadata = {
  version: '1.0.0',
  integrity: 'sha512-fixture',
  resolved: 'https://registry.npmjs.org/fixture/-/fixture-1.0.0.tgz',
  license: 'MIT',
};

function checkPolicy(
  packages: Record<string, unknown>,
  version = '1.0.0',
): ReturnType<typeof spawnSync> {
  const directory = mkdtempSync(join(tmpdir(), 'xquik-dependency-policy-'));
  try {
    mkdirSync(join(directory, 'config'));
    for (const [name, contents] of Object.entries({
      'config/dependency-license-policy.json': {
        allowedLicenses: ['MIT'],
        packageLicenses: {},
        licenseReferences: [{
          declared: 'SEE LICENSE IN LICENSE.md',
          license: 'MIT',
          packages: ['fixture@1.0.0'],
        }],
      },
      'package.json': { devDependencies: { fixture: version } },
      'package-lock.json': { packages },
    })) {
      writeFileSync(join(directory, name), JSON.stringify(contents));
    }
    return spawnSync(process.execPath, [checker], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 5000,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('dependency policy', (): void => {
  it('counts locked dependencies without counting the root package', (): void => {
    expect.assertions(2);
    const result = checkPolicy({ '': {}, 'node_modules/fixture': metadata });
    expect(result.status).toBe(0);
    expect(String(result.stdout)).toContain('Verified 1 locked dependencies');
  });

  it('rejects an empty dependency lockfile', (): void => {
    expect.assertions(2);
    const result = checkPolicy({ '': {} });
    expect(result.status).toBe(1);
    expect(String(result.stderr)).toContain('lockfile contains no dependencies');
  });

  it.each([
    [{ ...metadata, integrity: undefined }, 'SHA-512 package integrity'],
    [{ ...metadata, resolved: 'https://example.com/file' }, 'approved registry'],
    [{ ...metadata, license: undefined }, 'missing license metadata'],
    [{ ...metadata, license: 'unapproved' }, 'unapproved license'],
  ])('retains metadata enforcement for %j', (entry, message): void => {
    expect.assertions(2);
    const result = checkPolicy({ 'node_modules/fixture': entry });
    expect(result.status).toBe(1);
    expect(String(result.stderr)).toContain(String(message));
  });

  it('rejects unpinned direct dependencies', (): void => {
    expect.assertions(2);
    const result = checkPolicy({ 'node_modules/fixture': metadata }, '^1.0.0');
    expect(result.status).toBe(1);
    expect(String(result.stderr)).toContain('must use an exact version');
  });

  it.each([
    ['fixture', '1.0.0', 'SEE LICENSE IN LICENSE.md', 0],
    ['other', '1.0.0', 'SEE LICENSE IN LICENSE.md', 1],
    ['fixture', '1.0.1', 'SEE LICENSE IN LICENSE.md', 1],
    ['fixture', '1.0.0', 'SEE LICENSE IN README.md', 1],
    ['fixture', '1.0.0', 'unapproved', 1],
  ])('resolves only reviewed package references: %s@%s %s', (name, version, license, status): void => {
    expect.assertions(2);
    const result = checkPolicy({ [`node_modules/${name}`]: { ...metadata, version, license } });
    expect(result.status).toBe(status);
    expect(String(status === 0 ? result.stdout : result.stderr)).toContain(
      status === 0 ? 'Verified 1 locked dependencies' : `unapproved license ${license}`,
    );
  });
});
