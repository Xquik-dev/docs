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
    expect.assertions(tweetclawSourceExists() ? 2 : 1);

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
      '<Card title="explore" icon="search">',
      'Search the bundled Xquik endpoint catalog and inspect parameters.',
      'does not call the network.',
      '<Card title="tweetclaw" icon="terminal">',
      'Call catalog-listed Xquik endpoints with structured method, path, query, and',
      'body input. This tool can make network requests.',
      '`/xstatus`',
      '`/xtrends`',
      '## Runtime Diagnostics',
      'TweetClaw can be installed before credentials are configured.',
      'Live API calls return setup guidance until you add an API key or MPP signing key.',
      'openclaw plugins inspect tweetclaw --runtime',
      'openclaw skills info tweetclaw',
      'TweetClaw requires an HTTPS base URL with no embedded credentials.',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
    expect(guide).not.toContain('| Tool | Purpose | Network Access |');
  });

  it('keeps the Hermes Tweet guide aligned with the local plugin package', (): void => {
    expect.assertions(hermesTweetSourceExists() ? 5 : 1);

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
      '## Runtime Diagnostics',
      'hermes tools list',
      'hermes -z "Use tweet_explore, then read /api/v1/account. Do not call tweet_action." --toolsets hermes-tweet',
      'Without `XQUIK_API_KEY`, a non-mutating Hermes probe exposes `tweet_explore` only.',
      '`tweet_action` stays hidden or disabled unless `HERMES_TWEET_ENABLE_ACTIONS=true`.',
      'Hermes one-shot prompts do not dispatch `/xstatus` as an interactive slash command.',
      'Non-interactive installs cannot prompt for credentials; set `XQUIK_API_KEY` in the process environment or `~/.hermes/.env`.',
      '<Card title="tweet_explore" icon="search">',
      'Search the bundled Xquik endpoint catalog without making an API call.',
      '<Card title="tweet_read" icon="book-open">',
      'Call catalog-listed read-only endpoints after `XQUIK_API_KEY` is configured.',
      '<Card title="tweet_action" icon="shield-check">',
      'Call write-like or private endpoints only when `HERMES_TWEET_ENABLE_ACTIONS=true`.',
      '<Card title="/xstatus" icon="terminal">',
      'Show Xquik account, subscription, and usage status in an active Hermes CLI or gateway session.',
      '<Card title="/xtrends" icon="trending-up">',
      'Show current X trends from the plugin command registry.',
      '<Card title="Public Reads" icon="search">',
      'Tweet search, tweet lookup, user lookup, timelines, articles, and trends.',
      '<Card title="Actions" icon="trending-up">',
      'Tweet, reply, like, retweet, follow, DM, profile, media, and communities.',
      '<Card title="Tools Missing" icon="terminal">',
      'Run `hermes plugins enable hermes-tweet`, then confirm `hermes-tweet` appears in `hermes tools list`.',
      '<Card title="Risky Writes" icon="shield-check">',
      'Keep `HERMES_TWEET_ENABLE_ACTIONS=false` and use read tools only.',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
    expect(guide).not.toContain('| Tool | Purpose | Enabled By Default |');
    expect(guide).not.toContain('| Command | Purpose |');
    expect(guide).not.toContain('| Area | Examples |');
    expect(guide).not.toContain('| Symptom | Fix |');
  });
});
