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

function tweetclawCategoryCounts(apiSpec: string): ReadonlyMap<string, number> {
  const constants = new Map<string, string>([
    ['CATEGORY_X_ACCOUNTS', 'x-accounts'],
    ['CATEGORY_X_WRITE', 'x-write'],
  ]);
  const counts = new Map<string, number>();

  for (const entry of apiSpec.split(/\n\s*\{\n/gu).slice(1)) {
    if (/^\s+agentProhibited: true/gmu.test(entry)) {
      continue;
    }

    const hasPath = /^\s+path: '/gmu.test(entry);
    const categoryMatch = /^\s+category: (?:'([^']+)'|(CATEGORY_[A-Z_]+))/gmu.exec(entry);
    const literalCategory = categoryMatch?.[1];
    const constantCategory =
      categoryMatch?.[2] === undefined ? undefined : constants.get(categoryMatch[2]);
    const category = literalCategory ?? constantCategory;

    if (!hasPath || category === undefined) {
      continue;
    }

    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return counts;
}

function categoryCount(counts: ReadonlyMap<string, number>, category: string): number {
  const count = counts.get(category);
  if (count === undefined) {
    throw new Error(`Could not read TweetClaw category count for ${category}.`);
  }
  return count;
}

function tweetclawSourceExists(): boolean {
  return existsSync(TWEETCLAW_PACKAGE) && existsSync(TWEETCLAW_API_SPEC);
}

function hermesTweetSourceExists(): boolean {
  return existsSync(HERMES_TWEET_PYPROJECT) && existsSync(HERMES_TWEET_CATALOG);
}

describe('Plugin docs', (): void => {
  it('keeps the TweetClaw guide aligned with the local plugin package', (): void => {
    expect.assertions(tweetclawSourceExists() ? 5 : 1);

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
    const categoryCounts = tweetclawCategoryCounts(apiSpec);
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
      '<Card title="/xstatus" icon="terminal">',
      'Show the connected X account, email, locale, subscription status, plan, and',
      'usage when API key auth is configured.',
      '<Card title="/xtrends" icon="trending-up">',
      'Show current topics from Xquik Radar.',
      '<Card title="/xtrends tech" icon="search">',
      'Show current Xquik Radar topics filtered by the `tech` category.',
      '<Card title="account" icon="user">',
      `${categoryCount(categoryCounts, 'account')} endpoint for account status and usage.`,
      '<Card title="composition" icon="pen-line">',
      `${categoryCount(categoryCounts, 'composition')} endpoints for compose, drafts, writing styles, and radar.`,
      '<Card title="credits" icon="coins">',
      `${categoryCount(categoryCounts, 'credits')} endpoint for credit balance reads.`,
      '<Card title="extraction" icon="file-spreadsheet">',
      `${categoryCount(categoryCounts, 'extraction')} endpoints for extraction jobs, giveaway draws, and exports.`,
      '<Card title="media" icon="image">',
      `${categoryCount(categoryCounts, 'media')} endpoint for authenticated tweet media downloads and gallery links.`,
      '<Card title="monitoring" icon="radio">',
      `${categoryCount(categoryCounts, 'monitoring')} endpoints for account monitors, keyword monitors, events, and webhooks.`,
      '<Card title="twitter" icon="search">',
      `${categoryCount(categoryCounts, 'twitter')} endpoints for search, lookups, timelines, articles, trends, bookmarks,`,
      'and notifications.',
      '<Card title="x-accounts" icon="users">',
      `${categoryCount(categoryCounts, 'x-accounts')} endpoint for listing connected accounts before explicit user-selected`,
      'actions.',
      '<Card title="x-write" icon="send">',
      `${categoryCount(categoryCounts, 'x-write')} endpoints for post, reply, like, retweet, follow, remove follower, DM,`,
      'profile, media, and community actions.',
      '## Runtime Diagnostics',
      'TweetClaw can be installed before credentials are configured.',
      'Live API calls return setup guidance until you add an API key or MPP signing key.',
      'openclaw plugins inspect tweetclaw --runtime',
      'openclaw skills info tweetclaw',
      'TweetClaw requires an HTTPS base URL with no embedded credentials.',
      '<Card title="Tools Missing" icon="terminal">',
      'Add `explore` and `tweetclaw` to `tools.alsoAllow`, run the runtime',
      'inspection commands, then restart OpenClaw.',
      '<Card title="Auth Fails" icon="key-round">',
      'Create a fresh Xquik API key and update',
      '`plugins.entries.tweetclaw.config.apiKey`.',
      '<Card title="MPP Setup Fails" icon="wallet">',
      'Install `mppx` and `viem`, fund the MPP account, and call only',
      'MPP-eligible read endpoints.',
      '<Card title="Monitor Alerts Missing" icon="radio">',
      'Set `pollingEnabled` to `true` and keep `pollingInterval` at 60 seconds or',
      'higher.',
      '<Card title="Write Approval Required" icon="shield-check">',
      'Review the structured request and approve only the exact intended post,',
      'delete, follow, DM, monitor, extraction, webhook, profile, or community',
      'action.',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
    expect(guide).not.toContain('| Tool | Purpose | Network Access |');
    expect(guide).not.toContain('| Command | Purpose |');
    expect(guide).not.toContain('| Category | Examples |');
    expect(guide).not.toContain('| Symptom | Fix |');
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
