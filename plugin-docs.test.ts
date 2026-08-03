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
      'openclaw plugins install clawhub:@xquik/tweetclaw',
      `openclaw plugins install npm:@xquik/tweetclaw@${packageJson.version} --pin`,
      `The published npm and source-truth versions are both \`${packageJson.version}\`.`,
      `${mppEndpointCount} fixed-price, read-only X API endpoints`,
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
      'Show the connected X account, email, locale, subscription, plan, and usage.',
      'This command requires API key authentication.',
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
      `${categoryCount(categoryCounts, 'x-write')} endpoints cover posts, replies, likes, reposts, follows, DMs, profiles,`,
      'media, and community actions.',
      '## Runtime Diagnostics',
      'TweetClaw can be installed before credentials are configured.',
      'Live calls show setup guidance until authentication',
      'is configured.',
      'openclaw plugins inspect tweetclaw --runtime',
      'openclaw skills info tweetclaw',
      'Use an HTTPS URL',
      'without embedded credentials.',
      '## Workflow Handoffs',
      'Use `explore` first. Then call `tweetclaw` for one intended endpoint, target,',
      'and limit.',
      '<Card title="Tweet Replies Export" icon="message-circle">',
      'Estimate `reply_extractor` with `targetTweetId`. Create the extraction and',
      'poll `/api/v1/extractions/{id}`. Return CSV, JSON, and XLSX export URLs.',
      '<Card title="Follower Export" icon="users">',
      'Estimate `follower_explorer` with `targetUsername`. Create the extraction',
      'and poll until completion. Export the job for CRM or warehouse import.',
      '<Card title="Monitor Webhook Handoff" icon="radio">',
      'Use `explore` to find monitor and webhook endpoints. Call `tweetclaw` for',
      '`POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`. Call',
      '`POST /api/v1/webhooks` only after approval.',
      'Store its `secret` in a secret',
      'Receivers must verify `X-Xquik-Signature`.',
      '`deliveryId` and `streamEventId`. Return `2xx` for accepted duplicates.',
      'Keep endpoint signing values, raw request body, raw signature, and full headers out of chat logs and shared workflow outputs.',
      '<Card title="Media Tweets and DM Attachments" icon="image">',
      'For tweets or replies, call `POST /api/v1/x/tweets` with public media URLs',
      'Store the durable action `id`, `status`, `billing`, `result`,',
      'and `statusUrl`. Poll while `terminal` is false. Upload DM media first.',
      'Pass the returned `mediaId` as the one-item `media_ids` value. Store the DM',
      'action. Exclude full DM bodies. Leave `reply_to_message_id` unset.',
      'Use explore to find reply_extractor extraction endpoints.',
      'Create the job with targetTweetId and resultsLimit 500 only if allowed.',
      'Use explore to find follower_explorer extraction endpoints.',
      'Estimate followers for @username with resultsLimit 10000.',
      'Create the job only if allowed.',
      'Use explore to find monitor and webhook endpoints.',
      'Create an account monitor or keyword monitor only after approval.',
      'Register the receiver URL with POST /api/v1/webhooks.',
      'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
      'Use explore to find media write endpoints.',
      'For a tweet or reply, call POST /api/v1/x/tweets with media set to public HTTPS image or MP4 URLs. Do not send media_ids.',
      'Send a unique Idempotency-Key. Store id, status, billing, result, and statusUrl. Poll while terminal is false. Retry only when safeToRetry is true, using a new key.',
      'For a DM attachment, call POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value.',
      'Return the complete action record. Read the confirmed resource ID from result.id.',
      '<Card title="Tools Missing" icon="terminal">',
      'Add `explore` and `tweetclaw` to `tools.alsoAllow`, run the runtime',
      'inspection commands, then restart OpenClaw.',
      '<Card title="Auth Fails" icon="key-round">',
      'Create a fresh Xquik API key and update',
      '`plugins.entries.tweetclaw.config.apiKey`.',
      '<Card title="MPP Setup Fails" icon="wallet">',
      'Install `mppx` and `viem`. Fund the MPP account. Call only the 7 direct MPP',
      'operations.',
      '<Card title="Monitor Alerts Missing" icon="radio">',
      'Set `pollingEnabled` to `true` and keep `pollingInterval` at 60 seconds or',
      'higher.',
      '<Card title="Write Approval Required" icon="shield-check">',
      'Review the structured request. Approve only the exact intended action and',
      'account.',
      'The package also serves as an OpenClaw X Twitter skill for catalog-guided tasks.',
      'TweetClaw does not implement MCP.',
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
      'hermes -z "Use tweet_explore, then read /api/v1/x/trends. Do not call tweet_action." --toolsets hermes-tweet',
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
      '## Hermes Agent Twitter Search',
      'For keyword searches, use `GET /api/v1/x/tweets/search`.',
      'Available extraction types include `follower_explorer`, `following_explorer`, and `reply_extractor`.',
      '## Approved Twitter Actions',
      '## Workflow Handoffs',
      'Use `tweet_explore` first, then choose `tweet_read` for public reads or',
      '`tweet_action` for approved jobs that create or change state.',
      '<Card title="Tweet Search Read" icon="search">',
      'Use `tweet_read` with `GET /api/v1/x/tweets/search`, a concrete `q`, and a',
      'bounded `limit` to return tweet IDs, text, authors, timestamps, and metrics.',
      '<Card title="Follower Export Action" icon="users">',
      'Use `tweet_action` to estimate and create `follower_explorer`, then use',
      '`tweet_read` to poll the job and export CSV, JSON, or XLSX results.',
      '<Card title="Monitor Webhook Action" icon="radio">',
      'Use `tweet_explore` with `include_actions true` to find monitor and webhook',
      'endpoints, then use `tweet_action` for `POST /api/v1/monitors` or',
      '`POST /api/v1/monitors/keywords` and `POST /api/v1/webhooks` only after',
      'Store the webhook `secret` in a secret manager.',
      'verify `X-Xquik-Signature`, store `deliveryId` and `streamEventId`, return',
      '`2xx` for accepted duplicates',
      'Keep endpoint signing values and raw request bodies out of Hermes transcripts.',
      'Also exclude raw signatures and full headers from shared workflow outputs.',
      '<Card title="Media Tweet or DM Action" icon="image">',
      'Use public media URLs in `media` for tweet or reply actions. Store',
      'durable action `id`, `status`, `billing`, `result`, and `statusUrl`. Poll',
      'with `tweet_read` while `terminal` is false. For DM attachments, upload',
      'media first, pass one returned `mediaId` in `media_ids`, then store the DM',
      'action.',
      'Use tweet_explore to find tweet search endpoints.',
      'Use tweet_read for GET /api/v1/x/tweets/search with q "AI agents". Set limit 25.',
      'Return tweet id, text, author username, createdAt, and engagement counts.',
      'Use tweet_explore with include_actions true to find follower export endpoints.',
      'Estimate follower_explorer for @username with resultsLimit 10000.',
      'Create the job with tweet_action only after approval.',
      'Poll /api/v1/extractions/{id}, then export CSV, JSON, and XLSX with tweet_read.',
      'Use tweet_explore with include_actions true to find monitor and webhook endpoints.',
      'Create an account monitor or keyword monitor with tweet_action only after approval.',
      'Register the receiver URL with tweet_action for POST /api/v1/webhooks.',
      'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
      'Use tweet_explore with include_actions true to find media write endpoints.',
      'For a tweet or reply, call tweet_action for POST /api/v1/x/tweets.',
      'Set media to public HTTPS image or MP4 URLs. Do not send media_ids.',
      'For tweet_action, send a unique Idempotency-Key. Store id, status, billing, result, and statusUrl. Poll with tweet_read while terminal is false. Retry only when safeToRetry is true, using a new key.',
      'For a DM attachment, call tweet_action for POST /api/v1/x/media first.',
      'Then call POST /api/v1/x/dm/{userId} with one media_ids value.',
      'Return the complete action record. Read the confirmed resource ID from result.id.',
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
      '## Hermes Agent Twitter FAQ',
      '### Is Hermes Tweet a Hermes Agent Skill or Plugin?',
      'A skill supplies operating guidance. The plugin supplies the Python tools that make API calls.',
      '### Hermes Agent vs OpenClaw: Which Plugin Should I Use?',
      'Choose Hermes Tweet for Hermes Agent. Choose TweetClaw for OpenClaw.',
      '### Is Hermes Tweet an MCP Server?',
      'No X developer credentials are required.',
    ];

    expect(fileIncludes(guide, expected)).toStrictEqual([]);
    expect(guide).not.toContain('| Tool | Purpose | Enabled By Default |');
    expect(guide).not.toContain('| Command | Purpose |');
    expect(guide).not.toContain('| Area | Examples |');
    expect(guide).not.toContain('| Symptom | Fix |');
  });
});
