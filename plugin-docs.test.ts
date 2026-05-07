import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const TWEETCLAW_ROOT =
  process.env['TWEETCLAW_ROOT'] ?? join(PROJECT_ROOT, '..', 'tweetclaw');
const HERMES_TWEET_ROOT =
  process.env['HERMES_TWEET_ROOT'] ?? join(PROJECT_ROOT, '..', 'hermes-tweet');

const TWEETCLAW_GUIDE = join(PROJECT_ROOT, 'guides/tweetclaw.mdx');
const HERMES_TWEET_GUIDE = join(PROJECT_ROOT, 'guides/hermes-tweet.mdx');
const TWEETCLAW_PACKAGE = join(TWEETCLAW_ROOT, 'package.json');
const TWEETCLAW_API_SPEC = join(TWEETCLAW_ROOT, 'src/api-spec.ts');
const HERMES_TWEET_PYPROJECT = join(HERMES_TWEET_ROOT, 'pyproject.toml');
const HERMES_TWEET_CATALOG = join(
  HERMES_TWEET_ROOT,
  'hermes_tweet/catalog_data.json',
);

interface PackageJson {
  readonly engines?: { readonly node?: string };
  readonly name?: string;
  readonly openclaw?: {
    readonly compat?: {
      readonly minGatewayVersion?: string;
      readonly pluginApi?: string;
    };
    readonly install?: {
      readonly npmSpec?: string;
    };
  };
  readonly version?: string;
}

interface CatalogEndpoint {
  readonly mpp?: unknown;
}

function fileIncludes(source: string, expected: readonly string[]): readonly string[] {
  return expected.filter((value): boolean => !source.includes(value));
}

function regexValue(source: string, regex: RegExp, label: string): string {
  const value = regex.exec(source)?.[1];
  if (value === undefined) {
    throw new Error(`Could not read ${label}.`);
  }
  return value;
}

function tweetclawSourceExists(): boolean {
  return existsSync(TWEETCLAW_PACKAGE) && existsSync(TWEETCLAW_API_SPEC);
}

function hermesTweetSourceExists(): boolean {
  return existsSync(HERMES_TWEET_PYPROJECT) && existsSync(HERMES_TWEET_CATALOG);
}

describe('Plugin docs', (): void => {
  it('keeps the TweetClaw guide aligned with the local plugin package', (): void => {
    expect.assertions(1);

    if (!tweetclawSourceExists()) {
      expect(tweetclawSourceExists()).toBe(false);
      return;
    }

    const guide = readFileSync(TWEETCLAW_GUIDE, 'utf8');
    const packageJson = JSON.parse(
      readFileSync(TWEETCLAW_PACKAGE, 'utf8'),
    ) as PackageJson;
    const apiSpec = readFileSync(TWEETCLAW_API_SPEC, 'utf8');
    const endpointCount =
      [...apiSpec.matchAll(/^\s+path: '/gmu)].length -
      [...apiSpec.matchAll(/^\s+agentProhibited: true/gmu)].length;
    const mppEndpointCount = [...apiSpec.matchAll(/^\s+mpp: /gmu)].length;
    const expected = [
      `OpenClaw \`${packageJson.openclaw?.compat?.minGatewayVersion}\` or newer`,
      `Node.js \`${packageJson.engines?.node?.replace('>=', '')}\` or newer`,
      `openclaw plugins install ${packageJson.openclaw?.install?.npmSpec} --pin`,
      `The current source-truth version is \`${packageJson.version}\``,
      `${mppEndpointCount} read-only X API endpoints`,
      `${endpointCount} agent-callable endpoints`,
      '`explore`',
      '`tweetclaw`',
      '`/xstatus`',
      '`/xtrends`',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
  });

  it('keeps the Hermes Tweet guide aligned with the local plugin package', (): void => {
    expect.assertions(1);

    if (!hermesTweetSourceExists()) {
      expect(hermesTweetSourceExists()).toBe(false);
      return;
    }

    const guide = readFileSync(HERMES_TWEET_GUIDE, 'utf8');
    const pyproject = readFileSync(HERMES_TWEET_PYPROJECT, 'utf8');
    const catalog = JSON.parse(
      readFileSync(HERMES_TWEET_CATALOG, 'utf8'),
    ) as readonly CatalogEndpoint[];
    const version = regexValue(pyproject, /^version = "([^"]+)"/mu, 'version');
    const python = regexValue(
      pyproject,
      /^requires-python = ">=([^"]+)"/mu,
      'requires-python',
    );
    const mppEndpointCount = catalog.filter(
      (endpoint): boolean =>
        typeof endpoint.mpp === 'object' && endpoint.mpp !== null,
    ).length;
    const expected = [
      `Python \`${python}\` or newer`,
      'hermes-tweet',
      `The current package version is \`${version}\``,
      `${catalog.length} agent-callable Xquik endpoints`,
      `${mppEndpointCount} MPP-tagged read endpoints`,
      '`tweet_explore`',
      '`tweet_read`',
      '`tweet_action`',
      '`/xstatus`',
      '`/xtrends`',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
  });
});
