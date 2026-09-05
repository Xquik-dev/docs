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
    writeFileSync(
      join(directory, 'config/dependency-license-policy.json'),
      JSON.stringify({ allowedLicenses: ['MIT'], packageLicenses: {} }),
    );
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ devDependencies: { fixture: version } }),
    );
    writeFileSync(
      join(directory, 'package-lock.json'),
      JSON.stringify({ packages }),
    );
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
});
