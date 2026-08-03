import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  stripGeneratedResponseExamples,
} from './scripts/lib/generated-response-examples';

interface DiscoveryFinding {
  readonly file?: string;
  readonly issue: string;
}

interface DocsRedirect {
  readonly destination: string;
  readonly source: string;
}

interface DocsConfig {
  readonly redirects: readonly DocsRedirect[];
}

const SKIPPED_PUBLIC_SCAN_DIRS = new Set([
  '.git',
  'node_modules',
  '.github',
] as const);

const CREDITS_QUICK_TOPUP_PAGE = 'api-reference/credits/quick-topup.mdx';
const API_KEYS_CREATE_PAGE = 'api-reference/api-keys/create.mdx';
const WRITE_ACTION_LIFECYCLE_SNIPPET_PATH =
  'snippets/write-action-lifecycle-response.mdx';
const PRODUCT_APP_ICON_FILE = '/Users/burak/Developer/xquik/app/icon.svg';
const DOCS_X_ONLY_ICON_SHA256 =
  '7002c1dd82b5b903d69777fa212f39b0e0410cb156e7bcb1b4426fcec3a7cdc5';
const TWEET_SEARCH_EXPORT_SEMRUSH_SHA256 =
  'f4f68801cf41aa548dd58d94537fd76d8c02c3ede0e3769dcef8bf57a3de3812';
const CODEX_OAUTH_ISSUER_ERROR =
  'Authorization server response missing required issuer: expected https://xquik.com';
const CODEX_OAUTH_UPSTREAM_ISSUE =
  'https://github.com/openai/codex/issues/31573';
const CODEX_OAUTH_TROUBLESHOOTING_ANCHOR =
  'guides/troubleshooting#codex-oauth-issuer-validation-error';
const CODEX_OAUTH_GUIDANCE_FILES = [
  'mcp/overview.mdx',
  'guides/troubleshooting.mdx',
  'oauth/overview.mdx',
  'mcp/docs-mcp.mdx',
  'guides/composio-migration.mdx',
  'skill.md',
  'llms.txt',
  'README.md',
  'context7.json',
] as const;
const GOOSE_OAUTH_GUIDANCE_FILES = [
  'mcp/overview.mdx',
  'guides/troubleshooting.mdx',
  'mcp/docs-mcp.mdx',
  'context7.json',
] as const;

const REQUIRED_CUSTOM_CSS_MOBILE_VIEWPORT_SNIPPETS = [
  '/* Keep mobile guide content inside the viewport. */',
  '@media (max-width: 640px)',
  'overflow-x: clip;',
  '#content-area',
  'inline-size: calc(100vw - 2rem) !important;',
  'width: calc(100vw - 2rem) !important;',
  'max-inline-size: calc(100vw - 2rem) !important;',
  'max-width: calc(100vw - 2rem) !important;',
  '#content .columns',
  'max-inline-size: 100%;',
  '#header .prose > *',
  '#content > span[data-as="p"]',
  'overflow-wrap: anywhere;',
  '#content blockquote a[href$="/llms.txt"]',
  '#content-area blockquote a[href$="/llms.txt"]',
  'word-break: break-word !important;',
  'white-space: normal !important;',
] as const;

const REQUIRED_README_SNIPPETS = [
  '# Xquik Docs - X API, 1-Second Monitors & Automation Reference',
  'tweet search',
  'user lookup',
  'follower exports',
  'media uploads',
  'direct messages',
  'send DMs with returned message IDs',
  '1-second tweet monitors',
  'signed webhooks',
  'SDK clients',
  'X automation',
  '[Quickstart](https://docs.xquik.com/x-api-quickstart)',
  '[API Reference](https://docs.xquik.com/api-reference)',
  'browse 128 OpenAPI-backed operations',
  '**REST API** - 128 operations',
  '[SDKs](https://docs.xquik.com/sdks)',
  '[Tweet search export](https://docs.xquik.com/guides/tweet-scraper-csv-export)',
  'export tweets by keyword to CSV, JSON, or XLSX',
  '[Tweet replies export](https://docs.xquik.com/guides/tweet-replies-export)',
  'export replies to CSV, JSON, or XLSX',
  '[Follower export](https://docs.xquik.com/guides/follower-export-crm)',
  'export X followers to CRM or warehouse',
  '[Direct message workflow](https://docs.xquik.com/guides/direct-message-workflow)',
  'send DMs and store returned message IDs',
  '[Prefect](https://docs.xquik.com/guides/prefect)',
  'schedule tweet, user, timeline, and trend reads in Prefect flows',
  '[MCP Server](https://docs.xquik.com/mcp)',
  '[Webhooks](https://docs.xquik.com/webhooks/overview)',
  '[Apify Actors](https://docs.xquik.com/alternatives/apify)',
  '[X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper)',
  '[X Follower Scraper](https://apify.com/xquik/x-follower-scraper)',
  'Search tweets with `from:`, `since:`, `until:`, filters, and cursor pagination.',
  'tweet and follower export jobs on Apify',
  'Apify dataset workflows',
  '[llms.txt](https://docs.xquik.com/llms.txt)',
  '## Use With AI Coding Agents',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[Agent index](https://xquik.com/.well-known/agent-index.json)',
  '[auth.md](https://xquik.com/auth.md)',
  '[OpenAPI spec](https://docs.xquik.com/openapi.yaml)',
] as const;

const FORBIDDEN_README_SNIPPETS = [
  'deepwiki.com/badge.svg',
  'skills.sh/b/xquik-dev/x-twitter-scraper',
] as const;

const REQUIRED_INTRODUCTION_SNIPPETS = [
  'search tweets',
  'since:YYYY-MM-DD',
  'until:YYYY-MM-DD',
  'scrape follower lists',
  'post tweets',
  'upload media',
  'monitor tweets every 1 second',
  'send signed webhooks',
  "Free trending topics and news from Xquik's own infrastructure.",
  '## Use Xquik with AI agents',
  '[llms.txt](/llms.txt)',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[Xquik Skill](https://github.com/Xquik-dev/x-twitter-scraper)',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
] as const;

const FORBIDDEN_INTRODUCTION_CONFIDENTIALITY_SNIPPETS = [
  'Free trending topics and news from 7 sources:',
] as const;

const REQUIRED_QUICKSTART_SNIPPETS = [
  'X API quickstart',
  '`GET /account`',
  'monitor tweets every 1 second',
  '`POST /monitors`',
  '`POST /webhooks`',
  '<Step title="Fund your account">',
  'An active plan is not required while sufficient credits remain.',
  '"isActive": true',
  '"nextBillingAt": "2026-02-24T10:30:00.000Z"',
  'const webhookSecret = webhook.secret;',
  'Store webhookSecret in your secret manager; do not print it.',
  'webhook_secret = webhook["secret"]',
  'Store webhook_secret in your secret manager; do not print it.',
  'Save the `secret` from the response in a secret manager.',
  'Do not print it in shared logs.',
  'https://dashboard.xquik.com/en/account?tab=subscription',
  'https://dashboard.xquik.com/en/account?tab=api-keys',
] as const;

const FORBIDDEN_QUICKSTART_SECRET_LOG_SNIPPETS = [
  'process.stdout.write(`${JSON.stringify(webhook, null, 2)}\\n`);',
  'print(webhook)',
  'fmt.Println(string(respBody))\n        // Save the "secret" field for signature verification',
  'https://xquik.com/dashboard/account',
] as const;

const REQUIRED_SDK_OVERVIEW_SNIPPETS = [
  'tweet search exports',
  'JSON Lines, CSV, or XLSX',
  '`xquik-tweet-search.jsonl`',
  'For SDK extraction jobs, treat `202 Accepted` as a queued run receipt.',
  'Poll `GET /extractions/{id}` before exporting rows.',
  'Credits are reserved after the job starts',
  'lower `resultsLimit` to the affordable count',
  'fail with `insufficient_credits`',
  '<Card title="TypeScript / Node.js" icon="braces" href="/sdks/typescript">',
  'Install with `npm install x-twitter-scraper`;',
  '<Card title="Python" icon="bot" href="/sdks/python">',
  'Install with `pip install x_twitter_scraper`;',
  '<Card title="Go" icon="terminal" href="/sdks/go">',
  'Install with `go get github.com/Xquik-dev/x-twitter-scraper-go`;',
  '<Card title="Java" icon="coffee" href="/sdks/java">',
  'Maven Central publication is pending. Build from source at',
  '<Card title="Kotlin" icon="blocks" href="/sdks/kotlin">',
  '<Card title="C# / .NET" icon="hash" href="/sdks/csharp-x-api-sdk">',
  'Install with `dotnet add package XTwitterScraper`;',
  '<Card title="Ruby" icon="gem" href="/sdks/ruby">',
  'Install with `gem install x-twitter-scraper`;',
  '<Card title="PHP" icon="file-code" href="/sdks/php">',
  'Install with `composer require xquik/x-twitter-scraper`;',
  '<Card title="CLI" icon="square-terminal" href="/sdks/cli">',
  '`go install github.com/Xquik-dev/x-twitter-scraper-cli/cmd/x-twitter-scraper@latest`;',
  '<Card title="Terraform Provider" icon="boxes" href="/sdks/terraform">',
  'Terraform Registry publication is pending. Build locally from the',
  '[Terraform guide](/sdks/terraform); source repo is linked there.',
  '<Card title="Tweet search exports" icon="search">',
  '<Card title="Follower export files" icon="users">',
  '<Card title="Post media tweets or replies" icon="image">',
  '<Card title="Upload DM attachments" icon="message-circle">',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  '<Card title="Agent handoff" icon="bot">',
  '[TypeScript](/sdks/typescript)',
  '[Python](/sdks/python)',
  '[Go SDK](/sdks/go)',
  '[CLI](/sdks/cli)',
  '[Search Tweets](/api-reference/x/search-tweets)',
  '[Follower Export CRM Workflow](/guides/follower-export-crm)',
  'Run `follower_explorer` with `targetUsername` and optional',
  '[Export Extraction](/api-reference/extractions/export)',
  'Store the',
  '`202 Accepted` receipt `id` and `toolType`, then poll',
  '`GET /extractions/{id}` for `job.status`, `results`, `hasMore`, and',
  '`nextCursor`.',
  '[Create Tweet](/api-reference/x-write/create-tweet)',
  '[Upload Media](/api-reference/x-write/upload-media)',
  '[Send Direct Message](/api-reference/x-write/send-dm)',
  'public media URLs',
  'up to 4 image URLs or exactly 1 MP4 video URL up to 100 MB',
  '`mediaId` as the one-item `media_ids` value',
  'store `mediaUrl` and the',
  'one-item `media_ids`',
  'Cost: 1 credit per',
  'Cost: 1 credit per follower extracted or returned.',
  'Cost: 30 credits text-only, plus 2 credits per started MB across attached media.',
  'Cost: 10 credits per media upload plus 10 credits per',
  'active monitors cost 21 credits per monitor-hour.',
  '[MCP Server](/mcp/overview)',
  'export X_TWITTER_SCRAPER_API_KEY="xq_YOUR_KEY_HERE"',
  'OAuth 2.1 bearer tokens are supported where the generated SDK exposes `X_TWITTER_SCRAPER_BEARER_TOKEN`.',
] as const;

const FORBIDDEN_SDK_OVERVIEW_SNIPPETS = [
  '| SDK | Install | Source |',
  '| TypeScript | `npm install x-twitter-scraper` |',
  '| Python | `pip install x_twitter_scraper` |',
  '| CLI | `go install github.com/Xquik-dev/x-twitter-scraper-cli/cmd/x-twitter-scraper@latest` |',
  '| Terraform | Local',
  '| Job | Start here | Handoff & Cost |',
  '| Tweet search exports | [TypeScript](/sdks/typescript), [Python](/sdks/python), [Go](/sdks/go), or [CLI](/sdks/cli) with [Search Tweets](/api-reference/x/search-tweets) |',
  '| Post image tweets or replies | [TypeScript](/sdks/typescript), [Go](/sdks/go), or [CLI](/sdks/cli) with [Create Tweet](/api-reference/x-write/create-tweet) |',
  '| Upload DM attachments | [Upload Media](/api-reference/x-write/upload-media), then [Send Direct Message](/api-reference/x-write/send-dm) |',
] as const;

const REQUIRED_TYPESCRIPT_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'const page = await client.x.tweets.search({',
  'const tweetRows = page.tweets.map((tweet) => ({',
  'tweet_id: tweet.id',
  'author_username: tweet.author?.username',
  'created_at: tweet.createdAt',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  'const query = "from:username webhook OR SDK";',
  'let pageIndex = 0;',
  'const pageCursor = cursor ?? null;',
  'source: "xquik.typescript.search"',
  'author_id: tweet.author?.id ?? null',
  'author_name: tweet.author?.name ?? null',
  'like_count: tweet.likeCount ?? 0',
  'page_index: pageIndex',
  'page_cursor: pageCursor',
  'has_next_page: page.has_next_page',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  '`q`',
  '`limit`',
  '`cursor`',
  '`sinceTime`',
  '`untilTime`',
  '`queryType`',
  'Maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.has_next_page` is true, keep the same `q`, filters, `queryType`, and `limit`',
  'Maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains tweet records with `id`, `text`, optional `author`, `createdAt`, `likeCount`, `replyCount`, `retweetCount`, `quoteCount`, `bookmarkCount`, `viewCount`, and `isNoteTweet` when available.',
  'JSON field `next_cursor`. Store it only when `page.has_next_page` is true.',
  'bounded pulls that return fewer tweets than `limit`',
  'same query, filters, `queryType`, and `limit`',
  'Tweet search costs 1 credit per tweet returned.',
  'Project `page.tweets` into JSON Lines rows in `xquik-tweet-search.jsonl`',
  'Store `tweet_id`, `author_username`, engagement counts, `page_index`, `page_cursor`, `next_cursor`, and `has_next_page`',
  'without replaying raw SDK objects.',
  'For explicit `limit` pulls, resume with the same query, filters, `queryType`, and `limit`; only `cursor` changes.',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '`follower_explorer` requires `targetUsername`.',
  'targetUsername,',
  'await open("xquik-followers.jsonl", "w")',
  'await writeFile("xquik-followers.csv", Buffer.from(await csv.arrayBuffer()))',
  'await writeFile("xquik-followers.json", Buffer.from(await json.arrayBuffer()))',
  'await writeFile("xquik-followers.xlsx", Buffer.from(await xlsx.arrayBuffer()))',
  'Persist `job.id`, `targetUsername`, `estimate.estimatedResults`, and `estimate.source` before polling',
  'pass `nextCursor` back as `after`',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`client.extractions.estimateCost`',
  '`client.extractions.run`',
  '`client.extractions.run` returns the queued `202 Accepted` receipt from `POST /extractions`: `id`, `toolType`, and `status: "running"`',
  'Store `job.id` immediately, then poll `client.extractions.retrieve` before reading pages or calling `client.extractions.exportResults`.',
  'Credit reservation happens after the job starts.',
  'set `resultsLimit` to the affordable count before fetching rows',
  'mark the job `failed` with `insufficient_credits`',
  '`client.extractions.retrieve`',
  '`client.extractions.exportResults`',
  '`reply_extractor` requires `targetTweetId`.',
  '`client.extractions.retrieve` returns `results`, `hasMore`, and `nextCursor`',
  'await open("xquik-replies.jsonl", "w")',
  'await writeFile("xquik-replies.csv", Buffer.from(await csv.arrayBuffer()))',
  'await writeFile("xquik-replies.json", Buffer.from(await json.arrayBuffer()))',
  'await writeFile("xquik-replies.xlsx", Buffer.from(await xlsx.arrayBuffer()))',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  '`client.extractions.exportResults` supports `csv`, `json`, and `xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  'interface TweetWriteAction {',
  'safeToRetry: boolean;',
  'request: { hash: string | null };',
  'billing: { charged: boolean; chargedCredits: string };',
  'write_action_id: action.id',
  'request_hash: action.request.hash',
  'tweet_id: action.result?.id ?? action.tweetId ?? null',
  'poll: action.terminal ? null : action.statusUrl',
  'Capture the durable write action from the raw response.',
  'Send a unique `Idempotency-Key`',
  'Retry only when `safeToRetry` is true, using a new key.',
  'const tweetHandoff = createTweetHandoff(tweet, {',
  'const replyHandoff = createTweetHandoff(reply, {',
  'process.stdout.write(`${JSON.stringify(tweetHandoff)}\\n`);',
  'process.stdout.write(`${JSON.stringify(replyHandoff)}\\n`);',
  '`client.x.media.upload`',
  '`media.mediaId`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.messageId`',
  'const dmHandoff = {',
  'message_id: dm.messageId',
  'media_id: media.mediaId',
  'process.stdout.write(`${JSON.stringify(dmHandoff)}\\n`);',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave `reply_to_message_id` unset even if generated SDK types expose it; the REST endpoint rejects DM reply threading.',
  'Do not pass uploaded `media.mediaId` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_TYPESCRIPT_SDK_RAW_SEARCH_SNIPPETS = [
  'process.stdout.write(`${JSON.stringify(tweet)}\\n`);',
  'Write `page.tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'process.stdout.write(JSON.stringify(tweets, null, 2));',
  'results_limit',
  'Maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_GO_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'page, err := client.X.Tweets.Search(context.Background(), xtwitterscraper.XTweetSearchParams{',
  'for _, tweet := range page.Tweets {',
  '"tweet_id":        tweet.ID',
  '"author_username": tweet.Author.Username',
  '"created_at":      tweet.CreatedAt',
  'if err := encoder.Encode(row); err != nil {',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.X.Tweets.Search`',
  '`GET /x/tweets/search`',
  '`XTweetSearchParams`',
  '`Q`',
  '`Limit`',
  '`Cursor`',
  '`SinceTime`',
  '`UntilTime`',
  '`QueryType`',
  'Go field `Q` maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Go field `Limit` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.HasNextPage` is true, keep the same `Q`, filters, `QueryType`, and `Limit`',
  'Go field `Cursor` maps to REST `cursor`. Pass the opaque cursor from `NextCursor` to request the next page.',
  '`PaginatedTweets`',
  '`Tweets`',
  '`HasNextPage`',
  '`NextCursor`',
  'JSON field `tweets`. Contains tweet records with `ID`, `Text`, `Author`, `CreatedAt`, `LikeCount`, `ReplyCount`, `RetweetCount`, `QuoteCount`, `BookmarkCount`, `ViewCount`, and `IsNoteTweet` when available.',
  'JSON field `next_cursor`. Store it only when `page.HasNextPage` is true.',
  'bounded pulls that return fewer tweets than `Limit`',
  'same query, filters, `QueryType`, and `Limit`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'For explicit `Limit` pulls, resume with the same query, filters, `QueryType`, and `Limit`; only `Cursor` changes.',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '`client.Extractions.EstimateCost`',
  '`client.Extractions.Run`',
  '`client.Extractions.Run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as Go `job.ID`, `job.ToolType`, and `job.Status`',
  'Store `job.ID` immediately, then poll `client.Extractions.Get` before reading pages or calling `client.Extractions.ExportResults`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  '`client.Extractions.Get`',
  '`client.Extractions.ExportResults`',
  '`follower_explorer` requires `TargetUsername`.',
  'ExtractionEstimateCostParamsToolTypeFollowerExplorer',
  'ExtractionRunParamsToolTypeFollowerExplorer',
  'TargetUsername: xtwitterscraper.String(targetUsername)',
  'writeRows(ctx, client, job.ID, "xquik-followers.jsonl")',
  'func writeRows(',
  'params.After = xtwitterscraper.String(cursor)',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatCsv, "xquik-followers.csv")',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatJson, "xquik-followers.json")',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatXlsx, "xquik-followers.xlsx")',
  'Persist `job.ID`, `targetUsername`, `estimate.EstimatedResults`, and `estimate.Source` before polling',
  '`client.Extractions.Get` returns `Results`, `HasMore`, and `NextCursor`; pass `NextCursor` back as `After`',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`reply_extractor` requires `TargetTweetID`.',
  '`client.Extractions.Get` returns `Results`, `HasMore`, and `NextCursor`',
  'writeRows(ctx, client, job.ID, "xquik-replies.jsonl")',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatCsv, "xquik-replies.csv")',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatJson, "xquik-replies.json")',
  'writeExport(ctx, client, job.ID, xtwitterscraper.ExtractionExportResultsParamsFormatXlsx, "xquik-replies.xlsx")',
  'the shared `writeRows` helper passes `NextCursor` back as `After`',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  '`client.Extractions.ExportResults` supports CSV, JSON, and XLSX',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.X.Tweets.New`',
  '`ReplyToTweetID`',
  '`Media` with public media URLs',
  'type tweetCreatePayload struct {',
  'SafeToRetry bool               `json:"safeToRetry"`',
  'Request     writeActionRequest `json:"request"`',
  'Billing     writeActionBilling `json:"billing"`',
  'func createTweetHandoff(action tweetCreatePayload, base map[string]any) map[string]any {',
  '"write_action_id": action.ID',
  '"request_hash":    action.Request.Hash',
  '"charged_credits": action.Billing.ChargedCredits',
  '"poll":            poll',
  'Use `option.WithResponseBodyInto` to capture the durable write action.',
  'Send a unique `Idempotency-Key`',
  'Retry only when `safeToRetry` is true, using a new key.',
  'var tweetPayload tweetCreatePayload',
  'option.WithResponseBodyInto(&tweetPayload)',
  'tweetHandoff := createTweetHandoff(tweetPayload, map[string]any{',
  'var replyPayload tweetCreatePayload',
  'option.WithResponseBodyInto(&replyPayload)',
  'replyHandoff := createTweetHandoff(replyPayload, map[string]any{',
  'json.NewEncoder(os.Stdout).Encode(tweetHandoff)',
  'json.NewEncoder(os.Stdout).Encode(replyHandoff)',
  '`client.X.Media.Upload`',
  '`media.MediaID`',
  '`client.X.Dm.Send`',
  '`MediaIDs`',
  '"message_id": dm.MessageID',
  'dmHandoff := map[string]any{',
  '"message_id": dm.MessageID',
  '"media_id":   media.MediaID',
  'json.NewEncoder(os.Stdout).Encode(dmHandoff)',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave `ReplyToMessageID` unset even if generated SDK params expose it; the REST endpoint rejects DM reply threading.',
  'Do not pass uploaded `MediaID` values to `client.X.Tweets.New`',
] as const;

const FORBIDDEN_GO_SDK_WEAK_SEARCH_SNIPPETS = [
  'fmt.Printf("%+v\\n", tweets.HasNextPage)',
  'ResultsLimit',
  'Go field `Limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_PYTHON_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'page = client.x.tweets.search(',
  'page = await client.x.tweets.search(q="xquik", limit=10)',
  '"tweet_id": tweet.id',
  '"author_username": tweet.author.username if tweet.author else None',
  '"created_at": tweet.created_at',
  'sys.stdout.write(json.dumps(row, ensure_ascii=False) + "\\n")',
  '## Workflow: Search Tweets to CSV, JSON Lines, or XLSX',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  'query = "from:username webhook OR SDK"',
  'page_index = 0',
  'page_cursor = cursor',
  '"source": "xquik.python.search"',
  '"author_id": tweet.author.id if tweet.author else None',
  '"author_name": tweet.author.name if tweet.author else None',
  '"bookmark_count": tweet.bookmark_count or 0',
  '"page_index": page_index',
  '"page_cursor": page_cursor',
  '"has_next_page": page.has_next_page',
  'jsonl_file.write(json.dumps(row, ensure_ascii=False) + "\\n")',
  '`q`',
  '`limit`',
  '`cursor`',
  '`since_time`',
  '`until_time`',
  '`query_type`',
  'Python argument `q` maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Python argument `limit` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.has_next_page` is true, keep the same `q`, filters, `query_type`, and `limit`',
  'Python argument `cursor` maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains `SearchTweet` records with `id`, `text`, optional `author`, `created_at`, `like_count`, `reply_count`, `retweet_count`, `quote_count`, `bookmark_count`, `view_count`, and `is_note_tweet` when available.',
  'JSON field `next_cursor`. Store it only when `page.has_next_page` is true.',
  'bounded pulls that return fewer tweets than `limit`',
  'same query, filters, `query_type`, and `limit`',
  'Tweet search costs 1 credit per tweet returned.',
  'Project `page.tweets` into CSV rows for analysts and JSON Lines rows for queues and data lakes',
  'Load the same projected rows into pandas or openpyxl when account teams need an XLSX workbook.',
  'Store `tweet_id`, `author_username`, engagement counts, `page_index`, `page_cursor`, `next_cursor`, and `has_next_page`',
  'without replaying raw SDK models.',
  'For explicit `limit` pulls, resume with the same query, filters, `query_type`, and `limit`; only `cursor` changes.',
  '`xquik-tweet-search.jsonl`',
  '`client.extractions.estimate_cost`',
  '`client.extractions.run`',
  '`client.extractions.run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as Python `job.id`, `job.tool_type`, and `job.status`',
  'Store `job.id` immediately, then poll `client.extractions.retrieve` before reading pages or calling `client.extractions.export_results`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  '`client.extractions.retrieve`',
  '`client.extractions.export_results`',
  '`follower_explorer` requires `target_username`.',
  'target_username = "username"',
  'target_username=target_username',
  'Path("xquik-followers.jsonl")',
  'Path("xquik-followers.csv")',
  'Path("xquik-followers.json")',
  'Path("xquik-followers.xlsx")',
  'Persist `job.id`, `target_username`, `estimate.estimated_results`, and `estimate.source` before polling',
  'pass `next_cursor` back as `after`',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`reply_extractor` requires `target_tweet_id`.',
  'Path("xquik-replies.jsonl")',
  'Path("xquik-replies.csv")',
  'Path("xquik-replies.json")',
  'Path("xquik-replies.xlsx")',
  '`client.extractions.retrieve` returns `results`, `has_more`, and `next_cursor`',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  '`client.extractions.export_results` supports `csv`, `json`, and `xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  'def create_tweet_handoff(',
  'action: dict[str, Any]',
  '"safe_to_retry": action["safeToRetry"]',
  '"write_action_id": action["id"]',
  '"request_hash": action["request"]["hash"]',
  '"charged_credits": action["billing"]["chargedCredits"]',
  '"poll": None if action["terminal"] else action["statusUrl"]',
  'Use `with_raw_response.create` to capture the durable write action.',
  'Send a unique `Idempotency-Key`',
  'Retry only when `safeToRetry` is true, using a new key.',
  'response = client.x.tweets.with_raw_response.create(',
  'tweet_handoff = create_tweet_handoff(',
  'reply_handoff = create_tweet_handoff(',
  'sys.stdout.write(json.dumps(tweet_handoff, ensure_ascii=False) + "\\n")',
  'sys.stdout.write(json.dumps(reply_handoff, ensure_ascii=False) + "\\n")',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.message_id`',
  'dm_handoff = {',
  '"message_id": dm.message_id',
  '"media_id": media.media_id',
  'sys.stdout.write(json.dumps(dm_handoff, ensure_ascii=False) + "\\n")',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave `reply_to_message_id` unset even if generated SDK types expose it; the REST endpoint rejects DM reply threading.',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_PYTHON_SDK_RAW_SEARCH_SNIPPETS = [
  'tweet.to_json(indent=None)',
  'jsonl_file.write(tweet.to_json(indent=None) + "\\n")',
  'Write `page.tweets` to CSV for analysts',
  'print(tweets.to_json())',
  'results_limit',
  'Python argument `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_RUBY_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'page = client.x.tweets.search(',
  'page.tweets.each do |tweet|',
  'tweet_id: tweet.id',
  'author_username: tweet.author&.username',
  'created_at: tweet.created_at',
  'puts(JSON.generate(row))',
  '## Workflow: Search Tweets to CSV, JSON Lines, or XLSX',
  'query = "from:username webhook OR SDK"',
  '"source" => "xquik.ruby.search"',
  '"query" => query',
  '"tweet_id" => tweet.id',
  '"author_id" => tweet.author&.id',
  '"author_name" => tweet.author&.name',
  '"bookmark_count" => tweet.bookmark_count || 0',
  '"is_note_tweet" => tweet.is_note_tweet || false',
  '"page_index" => page_index',
  '"page_cursor" => page_cursor',
  '"next_cursor" => page.next_cursor == "" ? nil : page.next_cursor',
  '"has_next_page" => page.has_next_page',
  'csv << headers.map { |header| row.fetch(header) }',
  'jsonl.puts(JSON.generate(row))',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`XTwitterScraper::X::TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`since_time`',
  '`until_time`',
  '`query_type`',
  'Ruby keyword `q` maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Ruby keyword `limit` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.has_next_page` is true, keep the same `q`, filters, `query_type`, and `limit`',
  'Ruby keyword `cursor` maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`XTwitterScraper::PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains `SearchTweet` records with `id`, `text`, optional `author`, `created_at`, `like_count`, `reply_count`, `retweet_count`, `quote_count`, `bookmark_count`, `view_count`, and `is_note_tweet` when available.',
  'JSON field `next_cursor`. Store it only when `page.has_next_page` is true.',
  'bounded pulls that return fewer tweets than `limit`',
  'same query, filters, `query_type`, and `limit`',
  'Tweet search costs 1 credit per tweet returned.',
  'Project `page.tweets` into CSV rows for analysts and JSON Lines rows for queues and data lakes',
  'Store `tweet_id`, `author_username`, engagement counts, `page_index`, `page_cursor`, `next_cursor`, and `has_next_page`',
  'For explicit `limit` pulls, resume with the same query, filters, `query_type`, and `limit`; only `cursor` changes.',
  '`xquik-tweet-search.jsonl`',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '`client.extractions.estimate_cost`',
  '`client.extractions.run`',
  '`client.extractions.retrieve`',
  '`client.extractions.export_results`',
  '`client.extractions.run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as Ruby `job.id`, `job.tool_type`, and `job.status`.',
  'Store `job.id` immediately, then poll `client.extractions.retrieve` before reading pages or calling `client.extractions.export_results`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  '`follower_explorer` requires `target_username`.',
  'target_username = "username"',
  'target_username: target_username',
  'File.open("xquik-followers.jsonl", "w")',
  'format_: :csv',
  'File.binwrite("xquik-followers.csv", csv_response.read)',
  'format_: :json',
  'File.binwrite("xquik-followers.json", json_response.read)',
  'format_: :xlsx',
  'File.binwrite("xquik-followers.xlsx", xlsx_response.read)',
  'Persist `job.id`, `target_username`, `estimate.estimated_results`, and `estimate.source` before polling',
  'pass `next_cursor` back as `after`',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`reply_extractor` requires `target_tweet_id`.',
  'File.open("xquik-replies.jsonl", "w")',
  'File.binwrite("xquik-replies.csv", csv_response.read)',
  'File.binwrite("xquik-replies.json", json_response.read)',
  'File.binwrite("xquik-replies.xlsx", xlsx_response.read)',
  '`client.extractions.retrieve` returns `results`, `has_more`, and `next_cursor`',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  '`client.extractions.export_results` supports `:csv`, `:json`, and `:xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  'Use `client.request` to capture the durable write action.',
  'def create_tweet_handoff(client, payload)',
  'response = client.request(',
  'path: "x/tweets"',
  '"safe_to_retry" => response.fetch(:safeToRetry)',
  '"write_action_id" => response.fetch(:id)',
  '"request_hash" => response.dig(:request, :hash)',
  '"charged_credits" => response.dig(:billing, :chargedCredits)',
  '"poll" => response.fetch(:terminal) ? nil : response.fetch(:statusUrl)',
  'tweet_handoff = create_tweet_handoff(',
  'reply_handoff = create_tweet_handoff(',
  'puts(JSON.generate(tweet_handoff))',
  'puts(JSON.generate(reply_handoff))',
  'Send a unique `Idempotency-Key`',
  'Retry only when `safeToRetry` is true, using a new key.',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send_`',
  '`media_ids`',
  '`dm.message_id`',
  'dm_handoff = {',
  'message_id: dm.message_id',
  'media_id: media.media_id',
  'user_id: "44196397"',
  'account: "@username"',
  'status: "sent"',
  'puts(JSON.generate(dm_handoff))',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave generated `reply_to_message_id` unset even if SDK params expose it; the REST endpoint rejects DM reply threading.',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_RUBY_SDK_WEAK_SEARCH_SNIPPETS = [
  'puts(tweets.has_next_page)',
  'jsonl.puts(tweet.to_json)',
  'Write `page.tweets` to CSV for analysts',
  '`tweet.to_json`',
  '`tweet.deep_to_h`',
  'results_limit',
  'Ruby keyword `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_CLI_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets, Replies, and DM Attachments',
  '`x-twitter-scraper x:tweets search`',
  '`GET /x/tweets/search`',
  '`--q`',
  '`--limit`',
  '`--cursor`',
  '`--since-time`',
  '`--until-time`',
  '`--query-type`',
  '`--format json`',
  '`.tweets[]`',
  '`.has_next_page`',
  '`.next_cursor`',
  'Tweet search costs 1 credit per tweet returned.',
  'Use `--limit` as a 1 to 200 upper bound for a bounded pull.',
  'When `.has_next_page` is true, keep the same `--q`, filters, `--query-type`, and `--limit`; only `--cursor` changes.',
  'For bounded pulls that return fewer tweets than the requested `--limit`',
  'pass `.next_cursor` back as `--cursor` with the same query, filters, `--query-type`, and `--limit`.',
  '`xquik-tweet-search.jsonl`',
  '`xquik-tweet-search.csv`',
  'xquik.cli.search',
  'page_cursor="$cursor"',
  'headers=\'["source","query","tweet_id","text","author_id","author_username","author_name","created_at","like_count","reply_count","retweet_count","quote_count","view_count","bookmark_count","is_note_tweet","page_index","page_cursor","next_cursor","has_next_page"]\'',
  'jq -nr "$headers | @csv" > xquik-tweet-search.csv',
  'bookmark_count: (.bookmarkCount // 0)',
  'is_note_tweet: (.isNoteTweet // false)',
  'page_index: $page_index',
  'page_cursor: $page_cursor',
  'next_cursor: $next_cursor',
  'has_next_page: $has_next_page',
  'Project `.tweets[]` into `xquik-tweet-search.jsonl` and `xquik-tweet-search.csv` rows',
  '`page_index`',
  '`page_cursor`',
  '`next_cursor`',
  '`has_next_page`',
  '`--format-error json`',
  'x-twitter-scraper extractions estimate-cost',
  '`POST /extractions/estimate`',
  '`follower_explorer` requires `targetUsername`.',
  '`--target-username`',
  'follower-estimate.json',
  'For follower exports, `source` is usually `followers`.',
  '--format json > follower-run.json',
  'jq -e \'.status == "running" and .toolType == "follower_explorer"\' follower-run.json >/dev/null',
  'job_id="$(jq -r \'.id\' follower-run.json)"',
  'returns the queued `202 Accepted` receipt: `id`, `toolType`, and `status: "running"`',
  'Persist `follower-run.json`, `job_id`, the source username, and the estimate before polling',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  'followers-page.json',
  'When `.hasMore` is true, pass `.nextCursor` back as `--after`',
  ': > xquik-followers.jsonl',
  "jq -c '.results[]' followers-page.json >> xquik-followers.jsonl",
  '--after "$after"',
  '--output xquik-followers.csv',
  '--output xquik-followers.json',
  '--output xquik-followers.xlsx',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  'Map `User ID` or result `xUserId` as the CRM unique key.',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`reply_extractor` requires `targetTweetId`.',
  '`--target-tweet-id`',
  'x-twitter-scraper extractions run',
  '`POST /extractions`',
  '--transform id',
  '--raw-output',
  'Persist `job_id` before polling',
  'x-twitter-scraper extractions retrieve',
  '`GET /extractions/{id}`',
  '`.results`',
  '`.hasMore`',
  '`.nextCursor`',
  '--after "$next_cursor"',
  'x-twitter-scraper extractions export-results',
  '`GET /extractions/{id}/export`',
  '`--format csv`',
  '`--format json`',
  '`--format xlsx`',
  '`--output`',
  'Cost: 1 credit per reply extracted or returned.',
  '`x-twitter-scraper x:tweets create`',
  '`--media`',
  '`--reply-to-tweet-id`',
  'Send a unique `Idempotency-Key`.',
  'write_handoff() {',
  'input_file="$1"',
  'safe_to_retry: .safeToRetry',
  'write_action_id: .id',
  'request_hash: .request.hash',
  'charged_credits: .billing.chargedCredits',
  'poll: (if .terminal then null else .statusUrl end)',
  'tweet_id: (.result.id // .tweetId // null)',
  'write_handoff posted-tweet.json > tweet-handoff.jsonl',
  'write_handoff posted-reply.json > reply-handoff.jsonl',
  '## Useful Commands',
  'Run `x-twitter-scraper x:tweets search` to return tweet objects, author objects, metrics, media, `has_next_page`, and `next_cursor`.',
  'Run `x-twitter-scraper x:tweets retrieve` to return the full tweet text, author, metrics, media, quoted tweet, and retweeted tweet.',
  'Run `x-twitter-scraper x:tweets get-replies` to return reply tweets plus cursor fields.',
  '`x-twitter-scraper x:users retrieve-followers`',
  '`x-twitter-scraper x:media upload`',
  '`--file`',
  '`--transform mediaId`',
  '`x-twitter-scraper x:dm send`',
  '`--media-id`',
  'message_id: .messageId',
  'dm-handoff.jsonl',
  'DMs accept exactly 1 uploaded media ID.',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, recipient/account identifiers from your job context, and send status instead of full DM bodies.',
  'Do not pass `--reply-to-message-id` to `x:dm send`; the REST endpoint rejects `reply_to_message_id`.',
  'Do not pass uploaded `mediaId` values to `x:tweets create`',
] as const;

const FORBIDDEN_CLI_SDK_WORKFLOW_SNIPPETS = [
  '--results-limit',
  'Write one JSON object per line for downstream jobs',
  'projected records to CSV for analysts',
  'produce XLSX from those rows',
  'Use `--limit` for a bounded request from 1 to 200. Omit it when passing `--cursor` in page loops.',
] as const;

const REQUIRED_CSHARP_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'PaginatedTweets page = await client.X.Tweets.Search(parameters);',
  'foreach (SearchTweet tweet in page.Tweets)',
  'tweet_id = tweet.ID',
  'author_username = tweet.Author?.Username',
  'created_at = tweet.CreatedAt',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(row));',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '`client.X.Tweets.Search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`Q`',
  '`Limit`',
  '`Cursor`',
  '`SinceTime`',
  '`UntilTime`',
  '`QueryType`',
  'C# property `Q` maps to REST `q`.',
  'C# property `Limit` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.HasNextPage` is true, keep the same `Q`, filters, `QueryType`, and `Limit`',
  'C# property `Cursor` maps to REST `cursor`.',
  'C# property `QueryType` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.Tweets`',
  '`page.HasNextPage`',
  '`page.NextCursor`',
  'For bounded pulls that return fewer tweets than `Limit`',
  'pass `page.NextCursor` back as `Cursor`',
  'same query, filters, `QueryType`, and `Limit`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'For explicit `Limit` pulls, resume with the same query, filters, `QueryType`, and `Limit`; only `Cursor` changes.',
  'File.CreateText("xquik-tweet-search.jsonl")',
  'File.CreateText("xquik-tweet-search.csv")',
  'Dictionary<string, object?> row = new()',
  '["source"] = "xquik.csharp.search"',
  '["tweet_id"] = tweet.ID',
  '["author_id"] = tweet.Author?.ID',
  '["author_username"] = tweet.Author?.Username',
  '["author_name"] = tweet.Author?.Name',
  '["bookmark_count"] = tweet.BookmarkCount ?? 0',
  '["is_note_tweet"] = tweet.IsNoteTweet ?? false',
  '["page_index"] = pageIndex',
  '["page_cursor"] = pageCursor',
  '["next_cursor"] = page.HasNextPage ? page.NextCursor : null',
  'await WriteCsvRow(csvWriter, headers.Select(header => row[header]));',
  'Project `page.Tweets` into JSON Lines and CSV rows',
  '`BookmarkCount`',
  '`IsNoteTweet`',
  '`page_index`',
  '`page_cursor`',
  '`next_cursor`',
  '`has_next_page`',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`client.Extractions.EstimateCost`',
  '`client.Extractions.Run`',
  '`client.Extractions.Run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as C# `job.ID`, `job.ToolType`, and `job.Status`',
  'Store `job.ID` immediately, then poll `client.Extractions.Retrieve` before reading pages or calling `client.Extractions.ExportResults`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  '`ExtractionEstimateCostParamsToolType.FollowerExplorer`',
  '`ExtractionRunParamsToolType.FollowerExplorer`',
  '`follower_explorer` requires `TargetUsername`.',
  'string targetUsername = "username";',
  'TargetUsername = targetUsername',
  'File.CreateText("xquik-followers.jsonl")',
  'new ExtractionExportResultsParams { Format = Format.Csv }',
  'File.WriteAllTextAsync("xquik-followers.csv", await csvResponse.ReadAsString())',
  'new ExtractionExportResultsParams { Format = Format.Json }',
  'File.WriteAllTextAsync("xquik-followers.json", await jsonResponse.ReadAsString())',
  'new ExtractionExportResultsParams { Format = Format.Xlsx }',
  'File.Create("xquik-followers.xlsx")',
  'Persist `job.ID`, `targetUsername`, `estimate.EstimatedResults`, and `estimate.Source` before polling',
  'map exported `User ID` or row `xUserId` as the CRM unique key.',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`ExtractionEstimateCostParamsToolType.ReplyExtractor`',
  '`ExtractionRunParamsToolType.ReplyExtractor`',
  '`reply_extractor` requires `TargetTweetID`.',
  '`client.Extractions.Retrieve` returns `Results`, `HasMore`, and `NextCursor`',
  '`client.Extractions.ExportResults` returns an `HttpResponse`',
  'read CSV and JSON as strings, and copy XLSX from the response stream',
  'File.CreateText("xquik-replies.jsonl")',
  'File.WriteAllTextAsync("xquik-replies.csv", await csvResponse.ReadAsString())',
  'File.WriteAllTextAsync("xquik-replies.json", await jsonResponse.ReadAsString())',
  'File.Create("xquik-replies.xlsx")',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  'Cost: 1 credit per reply extracted or returned.',
  'Store `job.ID` on the queue job, ticket, or warehouse batch before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.X.Tweets.Create`',
  '`POST /x/tweets`',
  '`Media`',
  '`ReplyToTweetID`',
  'client.X.Tweets.WithRawResponse.Create',
  'static async Task<Dictionary<string, object?>> CreateTweetHandoff(',
  'row["safe_to_retry"] = payload.GetProperty("safeToRetry").GetBoolean();',
  'row["write_action_id"] = payload.GetProperty("id").GetString();',
  'row["request_hash"] = payload.GetProperty("request").GetProperty("hash").GetString();',
  'row["charged_credits"] = billing.GetProperty("chargedCredits").GetString();',
  'row["poll"] = terminal ? null : payload.GetProperty("statusUrl").GetString();',
  'Dictionary<string, object?> tweetHandoff = await CreateTweetHandoff(',
  'Dictionary<string, object?> replyHandoff = await CreateTweetHandoff(',
  '`client.X.Tweets.WithRawResponse.Create`',
  'Send a unique `Idempotency-Key`',
  'store `id`, `request.hash`, `billing`, `result`, and `statusUrl`',
  'Retry only when `safeToRetry` is true, using a new key.',
  '`client.X.Media.Upload`',
  '`POST /x/media`',
  '`media.MediaID`',
  '`MediaIds`',
  '`client.X.Dm.Send`',
  '["message_id"] = dm.MessageID',
  'Dictionary<string, object?> dmHandoff = new()',
  '["media_id"] = media.MediaID',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(tweetHandoff));',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(replyHandoff));',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(dmHandoff));',
  'Keep DM body text in private systems.',
  'Shared logs and handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and lifecycle status.',
  'Leave `ReplyToMessageID` unset because the REST endpoint rejects DM reply threading.',
  'Use public media URLs with `client.X.Tweets.Create`.',
  'Do not pass uploaded `media.MediaID` values to tweet creation.',
  'Throws `XTwitterScraperBadRequestException`.',
  'Throws `XTwitterScraperRateLimitException`.',
  'Throws `XTwitterScraper5xxException`.',
] as const;

const FORBIDDEN_CSHARP_SDK_WEAK_SEARCH_SNIPPETS = [
  'var tweets = await client.X.Tweets.Search(parameters);',
  'Write `page.Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  '\n            id = tweet.ID,',
  'projected rows into CSV for analysts',
  'results_limit',
  'xquik-tweet-replies',
  'C# property `Limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_PHP_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  '$page = $client->x->tweets->search(',
  'foreach ($page->tweets as $tweet) {',
  '$tweet->id',
  '$tweet->author?->username',
  '$tweet->createdAt',
  'echo json_encode($row, JSON_THROW_ON_ERROR) . PHP_EOL;',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  "$query = 'from:username webhook OR SDK';",
  "'source' => 'xquik.php.search'",
  "'query' => $query",
  "'tweet_id' => $tweet->id",
  "'author_id' => $tweet->author?->id",
  "'author_name' => $tweet->author?->name",
  "'bookmark_count' => $tweet->bookmarkCount ?? 0",
  "'is_note_tweet' => $tweet->isNoteTweet ?? false",
  "'page_index' => $pageIndex",
  "'page_cursor' => $pageCursor",
  "'next_cursor' => '' === $page->nextCursor ? null : $page->nextCursor",
  "'has_next_page' => $page->hasNextPage",
  '$csvRow[] = $row[$header];',
  'fputcsv($csvHandle, $csvRow);',
  'json_encode($row, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)',
  '`$client->x->tweets->search()`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`sinceTime`',
  '`untilTime`',
  '`queryType`',
  '`QueryType::LATEST`',
  'PHP argument `q` maps to REST `q`.',
  'PHP argument `limit` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `$page->hasNextPage` is true, keep the same `q`, filters, `queryType`, and `limit`',
  'PHP argument `cursor` maps to REST `cursor`.',
  'PHP argument `queryType` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`$page->tweets`',
  '`$page->hasNextPage`',
  '`$page->nextCursor`',
  'For bounded pulls that return fewer tweets than `limit`',
  'pass `$page->nextCursor` back as `cursor`',
  'same query, filters, `queryType`, and `limit`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'For explicit `limit` pulls, resume with the same query, filters, `queryType`, and `limit`; only `cursor` changes.',
  'Project `$page->tweets` into JSON Lines and CSV rows',
  '`$bookmarkCount`, `$viewCount`, and `$isNoteTweet`',
  '`page_index`, `page_cursor`, `next_cursor`, and `has_next_page`',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '`$client->extractions->run()` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as PHP `$job->id`, `$job->toolType`, and `$job->status`.',
  'Store `$job->id` immediately, then poll `$client->extractions->retrieve()` before reading pages or calling `$client->extractions->exportResults()`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  '`follower_explorer` requires `targetUsername`.',
  'EstimateToolType::FOLLOWER_EXPLORER',
  'RunToolType::FOLLOWER_EXPLORER',
  "'xquik-followers.jsonl'",
  'format: ExportFormat::CSV',
  "'xquik-followers.csv'",
  'format: ExportFormat::JSON',
  "'xquik-followers.json'",
  'format: ExportFormat::XLSX',
  "'xquik-followers.xlsx'",
  'Persist `$job->id`, `$targetUsername`, `$estimate->estimatedResults`, and `$estimate->source` before polling',
  'pass `$page->nextCursor` back as `after`',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`$client->extractions->estimateCost()`',
  '`$client->extractions->run()`',
  '`ToolType::REPLY_EXTRACTOR`',
  '`reply_extractor` requires `targetTweetID`.',
  '`$client->extractions->retrieve()` returns `results`, `hasMore`, and `nextCursor`',
  '`$client->extractions->exportResults()`',
  '`CSV`, `JSON`, and `XLSX` export formats',
  "fopen('xquik-replies.jsonl', 'wb')",
  "'xquik-replies.csv'",
  "'xquik-replies.json'",
  "'xquik-replies.xlsx'",
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  'Cost: 1 credit per reply extracted or returned.',
  'Store `$job->id` on the queue job, ticket, or warehouse batch before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`$client->x->tweets->create()`',
  'Use `$client->x->tweets->raw->create()` to capture the durable write action.',
  'function createTweetHandoff(Client $client, array $payload): array',
  '$response = $client->x->tweets->raw->create(params: $payload);',
  "'safe_to_retry' => $action['safeToRetry']",
  "'write_action_id' => $action['id']",
  "'request_hash' => $action['request']['hash']",
  "'charged_credits' => $action['billing']['chargedCredits']",
  "'poll' => $action['terminal'] ? null : $action['statusUrl']",
  '$tweetHandoff = createTweetHandoff($client, [',
  '$replyHandoff = createTweetHandoff($client, [',
  "'tweet_handoff' => $tweetHandoff",
  "'reply_handoff' => $replyHandoff",
  "'dm_handoff' => $dmHandoff",
  'Send a unique `Idempotency-Key`',
  'Retry only when `safeToRetry` is true, using a new key.',
  '`POST /x/tweets`',
  '`media`',
  '`replyToTweetID`',
  "'tweet_id' => $result['id'] ?? $action['tweetId'] ?? null",
  '$replyHandoff',
  '`$client->x->media->upload()`',
  '`POST /x/media`',
  '`$media->mediaID`',
  '`mediaIDs`',
  '`$client->x->dm->send()`',
  '`$dm->messageID`',
  "'user_id' => '44196397'",
  "'account' => '@username'",
  "'status' => 'sent'",
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave generated `replyToMessageID` unset even if SDK params expose it; the REST endpoint rejects DM reply threading.',
  'Text-only tweet and reply writes cost 30 credits.',
  'Do not pass uploaded `$media->mediaID` values to `$client->x->tweets->create()`',
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_PHP_SDK_WEAK_SEARCH_SNIPPETS = [
  'var_export($tweets->hasNextPage)',
  'Write `$page->tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  "'id' => $tweet->id",
  'results_limit',
  'PHP argument `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_JAVA_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'PaginatedTweets page = client.x().tweets().search(params);',
  'for (SearchTweet tweet : page.tweets()) {',
  'row.put("tweet_id", tweet.id());',
  'row.put("author_username", tweet.author().map(SearchTweet.Author::username).orElse(null));',
  'row.put("created_at", tweet.createdAt().orElse(null));',
  'System.out.println(objectMapper.writeValueAsString(row));',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '`client.x().tweets().search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`.q()`',
  '`.limit()`',
  '`.cursor()`',
  '`.sinceTime()`',
  '`.untilTime()`',
  '`.queryType()`',
  '`QueryType.LATEST`',
  'Java builder method `.q()` maps to REST `q`.',
  'Java builder method `.limit()` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.hasNextPage()` is true, keep the same `.q()`, filters, `.queryType()`, and `.limit()`',
  'Java builder method `.cursor()` maps to REST `cursor`.',
  'Java builder method `.queryType()` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  'For bounded pulls that return fewer tweets than the requested `.limit()`',
  'pass `page.nextCursor()` back as `.cursor()`',
  'same query, filters, `QueryType`, and `.limit()`',
  '`SearchTweet`',
  'Paths.get("xquik-tweet-search.csv")',
  'writeCsvRow(csvWriter, headers);',
  'row.put("source", "xquik.java.search");',
  'row.put("query", query);',
  'row.put("author_id", tweet.author().map(SearchTweet.Author::id).orElse(null));',
  'row.put("author_name", tweet.author().map(SearchTweet.Author::name).orElse(null));',
  'row.put("bookmark_count", tweet.bookmarkCount().orElse(0L));',
  'row.put("is_note_tweet", tweet.isNoteTweet().orElse(false));',
  'row.put("page_index", pageIndex);',
  'row.put("page_cursor", pageCursor);',
  'row.put("next_cursor", page.hasNextPage() ? page.nextCursor() : null);',
  'row.put("has_next_page", page.hasNextPage());',
  'writeCsvRow(csvWriter, csvRow);',
  'Project `page.tweets()` into JSON Lines and CSV rows',
  '`bookmarkCount()`',
  '`isNoteTweet()`',
  '`page_index`',
  '`page_cursor`',
  '`next_cursor`',
  '`has_next_page`',
  'Tweet search costs 1 credit per tweet returned.',
  'For explicit `.limit()` pulls, resume with the same query, filters, `QueryType`, and `.limit()`; only `.cursor()` changes.',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`follower_explorer` requires `targetUsername`.',
  '`reply_extractor` requires `targetTweetId`',
  '`client.extractions().estimateCost`',
  '`POST /extractions/estimate`',
  '`client.extractions().run`',
  '`POST /extractions`',
  '`client.extractions().retrieve`',
  '`GET /extractions/{id}`',
  '`client.extractions().exportResults`',
  '`GET /extractions/{id}/export`',
  'ExtractionEstimateCostParams.ToolType.FOLLOWER_EXPLORER',
  'ExtractionRunParams.ToolType.FOLLOWER_EXPLORER',
  'ExtractionRetrieveParams.Builder pageParams',
  'Paths.get("xquik-followers.jsonl")',
  '.format(ExtractionExportResultsParams.Format.CSV)',
  'Paths.get("xquik-followers.csv")',
  '.format(ExtractionExportResultsParams.Format.JSON)',
  'Paths.get("xquik-followers.json")',
  '.format(ExtractionExportResultsParams.Format.XLSX)',
  'Paths.get("xquik-followers.xlsx")',
  'Persist `job.id()`, `targetUsername`, `estimate.estimatedResults()`, and `estimate.source()` before polling',
  'pass `nextCursor()` back as `after`',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`client.extractions().run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as Java `job.id()`, `job.toolType()`, and `job._status()`.',
  'Store `job.id()` immediately, then poll `client.extractions().retrieve` before reading pages or calling `client.extractions().exportResults`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  'ExtractionEstimateCostParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionRunParams.ToolType.REPLY_EXTRACTOR',
  'Paths.get("xquik-replies.jsonl")',
  'ExtractionExportResultsParams.Format.CSV',
  'Paths.get("xquik-replies.csv")',
  'ExtractionExportResultsParams.Format.JSON',
  'Paths.get("xquik-replies.json")',
  'ExtractionExportResultsParams.Format.XLSX',
  'Paths.get("xquik-replies.xlsx")',
  'Keep `page.nextCursor()` as the checkpoint when you stream replies to JSON Lines.',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  'HttpResponse export',
  'export.body()',
  'Persist `job.id()` before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x().tweets().create`',
  '`POST /x/tweets`',
  '`.addMedia()`',
  '`.replyToTweetId()`',
  'static Map<String, Object> createTweetHandoff(',
  'handoff.put("safe_to_retry", payload.get("safeToRetry"));',
  'handoff.put("write_action_id", payload.get("id"));',
  'handoff.put("request_hash", request.get("hash"));',
  'handoff.put("charged_credits", billing.get("chargedCredits"));',
  'handoff.put("poll", terminal ? null : payload.get("statusUrl"));',
  '`client.x().tweets().withRawResponse().create(...)`',
  'Send a unique `Idempotency-Key`',
  'store `id`, `request.hash`, `billing`, `result`, and `statusUrl`',
  'Retry only when `safeToRetry` is true, using a new key.',
  'try (HttpResponseFor<TweetCreateResponse> response = client.x().tweets().withRawResponse().create(',
  'new TypeReference<Map<String, Object>>() {}',
  'Map<String, Object> tweetHandoff = createTweetHandoff(tweetPayload, tweetBase);',
  'Map<String, Object> replyHandoff = createTweetHandoff(replyPayload, replyBase);',
  '`client.x().media().upload`',
  '`POST /x/media`',
  '.file(Paths.get("handoff.png"))',
  '`media.mediaId()`',
  '`.addMediaId()`',
  'dm.messageId()',
  'Map<String, Object> dmHandoff = new LinkedHashMap<>();',
  'dmHandoff.put("message_id", dm.messageId());',
  'dmHandoff.put("media_id", media.mediaId());',
  'System.out.println(objectMapper.writeValueAsString(tweetHandoff));',
  'System.out.println(objectMapper.writeValueAsString(replyHandoff));',
  'System.out.println(objectMapper.writeValueAsString(dmHandoff));',
  'Keep DM body text in private systems.',
  'Shared logs and handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and lifecycle status.',
  'Leave `replyToMessageId` unset because the REST endpoint rejects DM reply threading.',
  'Use public media URLs with `client.x().tweets().create`.',
  'Do not pass uploaded `media.mediaId()` values to tweet creation.',
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_JAVA_SDK_WEAK_SEARCH_SNIPPETS = [
  'PaginatedTweets tweets = client.x().tweets().search(params);',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  'row.put("id", tweet.id());',
  'transform the same projected records into CSV for analysts',
  'results_limit',
  'xquik-tweet-replies',
  'Java builder method `.limit()` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const REQUIRED_KOTLIN_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'val page: PaginatedTweets = client.x().tweets().search(params)',
  'for (tweet: SearchTweet in page.tweets()) {',
  '"tweet_id" to tweet.id(),',
  '"author_username" to author?.username(),',
  '"created_at" to tweet.createdAt(),',
  'println(objectMapper.writeValueAsString(row))',
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '`client.x().tweets().search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`.q()`',
  '`.limit()`',
  '`.cursor()`',
  '`.sinceTime()`',
  '`.untilTime()`',
  '`.queryType()`',
  '`QueryType.LATEST`',
  'Kotlin builder method `.q()` maps to REST `q`.',
  'Kotlin builder method `.limit()` maps to REST `limit`. Use it as a 1 to 200 upper bound for a bounded pull.',
  'If `page.hasNextPage()` is true, keep the same `.q()`, filters, `.queryType()`, and `.limit()`',
  'Kotlin builder method `.cursor()` maps to REST `cursor`.',
  'Kotlin builder method `.queryType()` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  'For bounded pulls that return fewer tweets than the requested `.limit()`',
  'pass `page.nextCursor()` back as `.cursor()`',
  'same query, filters, `QueryType`, and `.limit()`',
  '`SearchTweet`',
  'Paths.get("xquik-tweet-search.csv")',
  'writeCsvRow(csvWriter, headers)',
  '"source" to "xquik.kotlin.search",',
  '"query" to query,',
  '"author_id" to author?.id(),',
  '"author_name" to author?.name(),',
  '"bookmark_count" to (tweet.bookmarkCount() ?: 0L),',
  '"is_note_tweet" to (tweet.isNoteTweet() ?: false),',
  '"page_index" to pageIndex,',
  '"page_cursor" to pageCursor,',
  '"next_cursor" to if (page.hasNextPage()) page.nextCursor() else null,',
  '"has_next_page" to page.hasNextPage(),',
  'jsonlWriter.write(objectMapper.writeValueAsString(row))',
  'writeCsvRow(csvWriter, headers.map { header -> row[header] })',
  'Project `page.tweets()` into JSON Lines and CSV rows',
  '`bookmarkCount()`',
  '`isNoteTweet()`',
  '`page_index`',
  '`page_cursor`',
  '`next_cursor`',
  '`has_next_page`',
  'Tweet search costs 1 credit per tweet returned.',
  'For explicit `.limit()` pulls, resume with the same query, filters, `QueryType`, and `.limit()`; only `.cursor()` changes.',
  '## Workflow: Follower Export to CSV, JSON, or XLSX',
  '`follower_explorer` requires `targetUsername`.',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`reply_extractor` requires `targetTweetId`',
  '`client.extractions().estimateCost`',
  '`POST /extractions/estimate`',
  '`client.extractions().run`',
  '`POST /extractions`',
  '`client.extractions().retrieve`',
  '`GET /extractions/{id}`',
  '`client.extractions().exportResults`',
  '`GET /extractions/{id}/export`',
  'ExtractionEstimateCostParams.ToolType.FOLLOWER_EXPLORER',
  'ExtractionRunParams.ToolType.FOLLOWER_EXPLORER',
  'ExtractionRetrieveParams.builder()',
  'Paths.get("xquik-followers.jsonl")',
  '.format(ExtractionExportResultsParams.Format.CSV)',
  'Paths.get("xquik-followers.csv")',
  '.format(ExtractionExportResultsParams.Format.JSON)',
  'Paths.get("xquik-followers.json")',
  '.format(ExtractionExportResultsParams.Format.XLSX)',
  'Paths.get("xquik-followers.xlsx")',
  'Persist `job.id()`, `targetUsername`, `estimate.estimatedResults()`, and `estimate.source()` before polling',
  'pass `nextCursor()` back as `after`',
  'Map exported `User ID` or row `xUserId` as the CRM unique key.',
  '`xquik-followers.jsonl` for queue replay or warehouse loads',
  '`xquik-followers.json` for app ingestion',
  '`xquik-followers.csv` for CRM import',
  '`xquik-followers.xlsx` for analyst handoff',
  'Cost: 1 credit per follower extracted or returned.',
  'Exports are free after the extraction job exists.',
  '`client.extractions().run` returns the queued `202 Accepted` receipt from `POST /extractions`: REST `id`, `toolType`, and `status: "running"` as Kotlin `job.id()`, `job.toolType()`, and `job._status()`.',
  'Store `job.id()` immediately, then poll `client.extractions().retrieve` before reading pages or calling `client.extractions().exportResults`.',
  'Credit reservation happens after the job starts.',
  'fetch only the affordable count before export',
  'mark the job `failed` with `insufficient_credits`',
  'ExtractionEstimateCostParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionRunParams.ToolType.REPLY_EXTRACTOR',
  'Paths.get("xquik-replies.jsonl")',
  'ExtractionExportResultsParams.Format.CSV',
  'Paths.get("xquik-replies.csv")',
  'ExtractionExportResultsParams.Format.JSON',
  'Paths.get("xquik-replies.json")',
  'ExtractionExportResultsParams.Format.XLSX',
  'Paths.get("xquik-replies.xlsx")',
  'Keep `page.nextCursor()` as the checkpoint when you stream replies to JSON Lines.',
  '`xquik-replies.jsonl` for queue replay or warehouse loads',
  '`xquik-replies.json` for app ingestion',
  '`xquik-replies.csv` for CRM import',
  '`xquik-replies.xlsx` for analyst handoff',
  'export.body()',
  'Persist `job.id()` before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x().tweets().create`',
  '`POST /x/tweets`',
  '`.addMedia()`',
  '`.replyToTweetId()`',
  'fun createTweetHandoff(',
  'handoff["safe_to_retry"] = payload["safeToRetry"]',
  'handoff["write_action_id"] = payload["id"]',
  'handoff["request_hash"] = request["hash"]',
  'handoff["charged_credits"] = billing["chargedCredits"]',
  'handoff["poll"] = if (terminal) null else payload["statusUrl"]',
  'client.x().tweets().withRawResponse().create(',
  'object : TypeReference<Map<String, Any?>>() {}',
  'val tweetHandoff = createTweetHandoff(',
  'val replyHandoff = createTweetHandoff(',
  '`client.x().media().upload`',
  '`POST /x/media`',
  '.file(Paths.get("handoff.png"))',
  '`media.mediaId()`',
  '`.addMediaId()`',
  'dm.messageId()',
  'val dmHandoff = linkedMapOf(',
  '"message_id" to dm.messageId()',
  '"media_id" to media.mediaId()',
  'println(objectMapper.writeValueAsString(tweetHandoff))',
  'println(objectMapper.writeValueAsString(replyHandoff))',
  'println(objectMapper.writeValueAsString(dmHandoff))',
  'Keep DM body text in private systems.',
  'Shared logs and handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and lifecycle status.',
  'Leave `replyToMessageId` unset because the REST endpoint rejects DM reply threading.',
  '`client.x().tweets().withRawResponse().create(...)`',
  'Send a unique `Idempotency-Key`',
  'store `id`, `request.hash`, `billing`, `result`, and `statusUrl`',
  'Retry only when `safeToRetry` is true, using a new key.',
  'Use public media URLs with `client.x().tweets().create`.',
  'Do not pass uploaded `media.mediaId()` values to tweet creation.',
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_KOTLIN_SDK_WEAK_SEARCH_SNIPPETS = [
  'val tweets: PaginatedTweets = client.x().tweets().search(params)',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  '"id" to tweet.id(),',
  'transform the projected records into CSV for analysts',
  'results_limit',
  'xquik-tweet-replies',
  'Kotlin builder method `.limit()` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
] as const;

const FORBIDDEN_TWEET_SEARCH_CURSOR_LIMIT_SNIPPETS = [
  'Use it for the page size from 1 to 200',
  'Use it for the maximum tweets to return for the page',
  '`q`, `limit`, and optional `cursor`',
  'with `q`, `limit`, and optional `cursor`',
  'page loops or `limit` for bounded pulls',
  'use `limit` only for bounded pulls',
  'sends `limit` and omits `cursor`',
  'Omit `limit` when passing a cursor.',
  'Omit `limit` for a\nsimple cursor-driven page loop.',
  'limit: 100,\n    queryType: "Latest",\n    cursor,',
  'limit=100,\n            query_type="Latest",\n            cursor=cursor,',
  'Limit:     xtwitterscraper.Int(100),\n\t\t\tQueryType:',
  'limit: 100,\n        query_type: :Latest,\n        cursor: cursor',
  'Limit = 100,\n            Cursor = cursor,',
  'limit: 100,\n      cursor: $cursor,',
  '"limit": "{{parameters.limit || 25}}",\n    "cursor": "{{parameters.cursor}}"',
  '.limit(100L)\n            .queryType(QueryType.LATEST)',
] as const;

const FORBIDDEN_TWEET_SEARCH_DATE_WINDOW_SNIPPETS = [
  'Strict `from:` date windows favor timeline completeness.',
  'Plain from:user date windows are optimized for timeline completeness.',
  'timeline completeness. Add keywords when ranked search semantics matter more.',
] as const;

const REQUIRED_TERRAFORM_PROVIDER_WORKFLOW_SNIPPETS = [
  '## Workflow: Monitor Tweets to Signed Webhooks',
  '`x-twitter-scraper_monitor`',
  '`x-twitter-scraper_webhook`',
  '`POST /monitors`',
  '`POST /webhooks`',
  '`username`',
  '`event_types`',
  '`url`',
  '`secret`',
  '`x-twitter-scraper_event`',
  'Terraform data source `x-twitter-scraper_event` reads one stored monitor event.',
  'It requires `id` and returns `type`, `username`, `monitor_id`, `occurred_at`, `x_event_id`, and `data`.',
  'Production webhook payloads include `deliveryId` and `streamEventId`.',
  'Store `deliveryId` for receiver idempotency.',
  'Store `streamEventId` when one monitor event must be processed once across retries or endpoint changes.',
  '`GET /webhooks/{id}/deliveries`',
  '`tweet.new`',
  '`tweet.reply`',
  'Webhook operations are free.',
  'Active monitors check every second and cost 21',
  'credits per monitor-hour.',
  'Terraform state can contain the webhook `secret` returned at creation time.',
  '`sensitive = true`',
  '## Workflow: Declare Media Tweets and Replies',
  '`x-twitter-scraper_x_tweet`',
  '`POST /x/tweets`',
  'media             = ["https://example.com/product-demo.mp4"]',
  'launch_reply_tweet_id',
  'Text-only tweets and replies cost 30 credits, and attached media adds 2 credits per started MB.',
  'Do not pass uploaded media IDs to this resource',
  'Generated provider docs may list `media_ids` on `x-twitter-scraper_x_tweet`, but `POST /x/tweets` rejects `media_ids`.',
  'Use `media` with public image or MP4 URLs for tweets.',
  'Reserve uploaded media IDs for one-item DM `media_ids` through REST, MCP tools, or a generated SDK.',
  'Terraform state for `x-twitter-scraper_x_tweet` does not expose durable write action fields, media upload resources, or direct-message send resources.',
  'Use the REST API, MCP tools, or a generated SDK when a worker must store lifecycle handoffs',
  'Terraform should not be the handoff surface for extraction files.',
  'use the REST extraction endpoints, CLI, MCP tools, or generated SDKs to write CSV, JSON, XLSX, or JSON Lines files.',
  'Keep Terraform state focused on long-lived resources and IDs that must be reviewed through plan and apply.',
] as const;

const FORBIDDEN_TERRAFORM_PROVIDER_WORKFLOW_SNIPPETS = [
  'x-twitter-scraper_x_media',
  'x-twitter-scraper_x_dm',
  'x-twitter-scraper_direct_message',
  'media_ids =',
  'message_id =',
  'write_action_id =',
  'xquik-replies.csv',
  'xquik-followers.csv',
  'exportResults(',
] as const;

const REQUIRED_LLMS_SNIPPETS = [
  '## Agent Entry Points',
  'https://context7.com/xquik-dev/xquik-docs',
  '[Xquik Skill](https://docs.xquik.com/skill.md)',
  'Docs `https://docs.xquik.com/mcp` (docs, no auth)',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
  'https://docs.xquik.com/openapi.yaml',
  '"status": "pending_confirmation"',
  '"writeActionId": "42"',
  '`GET /x/write-actions/{id}`',
  'opt in to the normalized v1 response contract',
  '**Tweet Search Filters** (`tweet_search_extractor` and `GET /x/tweets/search`)',
  'Use `since:` and `until:` with `from:` for account date windows.',
  '`minQuotes`',
  '`anyWords`',
  '`quotesOfTweetId`',
  '`listId`',
  '`placeCountry`',
  '`pointRadius`',
  '`boundingBox`',
  '**Tweet result filters**',
  '`GET /x/users/{id}/tweets`',
  '`GET /x/tweets/{id}/quotes`',
  'signed `webhook.test` payloads without `deliveryId`/`streamEventId`',
  'Search and read indexed public docs',
] as const;

const REQUIRED_LLMS_RUNTIME_CONTRACT_SNIPPETS = [
  '## Monitor Event Types (21)',
  'Account monitors and webhooks accept all 21. Keyword monitors accept only the 10 tweet types.',
  'Retry: up to 10 attempts. Backoff starts at 1s and caps at 60s.',
  'Default responses always include `error`.',
  'Retry writes only when `safeToRetry` is `true`; use a new `Idempotency-Key`.',
] as const;

const FORBIDDEN_LLMS_RUNTIME_CONTRACT_SNIPPETS = [
  '## Monitor Event Types (4)',
  '5 attempts max',
  '`no_addon`',
  '`monitor_limit_reached`',
  'retry only on `429` and `5xx`',
] as const;

const REQUIRED_SKILL_RATE_LIMIT_SNIPPETS = [
  '### Rate limits',
  '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 300 per 1s user bucket.',
  '- **Write**: `POST`, `PUT`, and `PATCH` share a 120 per 60s user bucket.',
  '- **Delete**: `DELETE` requests use a 60 per 60s user bucket.',
  'Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header.',
] as const;

const FORBIDDEN_SKILL_RATE_LIMIT_SNIPPETS = [
  '| Tier | Methods | Limit |',
  '| Read | GET, HEAD, OPTIONS | 60 per 1s |',
  '| Write | POST, PUT, PATCH | 30 per 60s |',
  '| Delete | DELETE | 15 per 60s |',
] as const;

const PUBLIC_READ_RATE_LIMIT_EXPECTATIONS = [
  {
    file: 'guides/rate-limits.mdx',
    required: [
      '**Standard limits:** 300 reads per second, 120 writes per minute, and 60',
      '`GET`, `HEAD`, and `OPTIONS` allow 300 requests per 1 second.',
      'Read bucket: 300 requests per 1 second',
      'reservoir: 270,',
      'reservoirRefreshAmount: 270,',
      'reservoirRefreshInterval: 1_000,',
      'This Bottleneck configuration reserves 10% read headroom.',
    ],
    forbidden: [
      '60 GET/1s',
      '60 requests per 1 second',
      'Read tier (60 per 1s)',
      'WindowRateLimiter(60',
      'NewWindowRateLimiter(60',
      'reservoir: 60',
      '60 requests per read window',
      '60 requests per 1s',
      '~17ms',
      '20ms stays under 60',
    ],
  },
  {
    file: 'api-reference/overview.mdx',
    required: [
      'The read bucket covers `GET`, `HEAD`, and `OPTIONS`.',
      'It allows 300 calls each second.',
      'Exceeding a bucket returns `429 rate_limit_exceeded`',
    ],
    forbidden: ['Read calls are 60 per 1s', 'share a 60 per 1s user bucket'],
  },
  {
    file: 'x-api-quickstart.mdx',
    required: ['300 reads/1s, 120 writes/60s, and 60 deletes/60s'],
    forbidden: ['60 reads/1s, 30 writes/60s, 15 deletes/60s'],
  },
  {
    file: 'guides/prefect.mdx',
    required: ['Read endpoints share a 300 per 1s user bucket.'],
    forbidden: ['Read endpoints share a 60 per 1s user bucket.'],
  },
  {
    file: 'guides/troubleshooting.mdx',
    required: [
      '`GET`, `HEAD`, and `OPTIONS` share 300 requests per 1 second.',
      '`POST`, `PUT`, and `PATCH` share 120 requests per 60 seconds.',
      '`DELETE` requests are limited to 60 requests per 60 seconds.',
    ],
    forbidden: [
      '`GET`, `HEAD`, and `OPTIONS` share a limit of 60 requests per 1 second.',
      '`POST`, `PUT`, and `PATCH` share a limit of 30 requests per 60 seconds.',
      '`DELETE` requests are limited to 15 requests per 60 seconds.',
    ],
  },
  {
    file: 'guides/architecture.mdx',
    required: [
      '`GET`, `HEAD`, and `OPTIONS` share a standard user limit of 300 requests per',
      '`POST`, `PUT`, and `PATCH` share a standard user limit of 120 requests per',
      '`DELETE` requests are limited to 60 requests per 60 seconds.',
    ],
    forbidden: [
      'standard user limit of 10 requests per',
      'standard user limit of 30 requests per',
      '`DELETE` requests are limited to 15 requests per 60 seconds.',
    ],
  },
  {
    file: 'skill.md',
    required: [
      '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 300 per 1s user bucket.',
    ],
    forbidden: [
      '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 60 per 1s user bucket.',
    ],
  },
  {
    file: 'llms.txt',
    required: ['- Read endpoints: 300 requests per 1s (fixed window)'],
    forbidden: ['- Read endpoints: 60 requests per 1s (fixed window)'],
  },
] as const;

const REQUIRED_SKILL_DECISION_GUIDANCE_SNIPPETS = [
  '## Decision guidance',
  '- **Use the REST API** for backend services, automation scripts, interval polling, file exports, and fine-grained pagination or request control.',
  '- **Use Docs MCP** for AI agents that need read-only docs search and page retrieval for API parameters, examples, error codes, billing rules, webhook setup, or SDK guidance.',
  '- **Use API MCP** for AI agents that need authenticated Xquik account actions in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients.',
  '- **Use webhooks** when monitor events must reach an HTTPS endpoint. Add them when pushed events fit better than polling.',
] as const;

const FORBIDDEN_SKILL_DECISION_GUIDANCE_SNIPPETS = [
  '- **Use the MCP server** for AI agents in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients, especially natural language queries.',
  '| Scenario | Use REST API | Use MCP Server | Use Webhooks |',
  '| Backend service or automation script | Yes | No | Optional |',
  '| AI agent in Claude, ChatGPT, Cursor, VS Code, or Codex | Optional | Yes | Optional |',
  '| Real-time event delivery | No | No | Yes |',
  '| Polling for events on interval | Yes | Yes | No |',
  '| File export as CSV, XLSX, JSON, Markdown, PDF, or text | Yes | Optional | No |',
  '| Natural language queries | No | Yes | No |',
  '| Fine-grained pagination and request control | Yes | Optional | No |',
] as const;

const REQUIRED_SKILL_MCP_HANDOFF_SNIPPETS = [
  '- **Connecting AI agents**: Use Docs MCP for no-auth docs search and page retrieval, and API MCP for authenticated account actions.',
  '- **OAuth 2.1**: Browser-based MCP clients keep account access granted by OAuth scopes.',
  '### Connect an AI agent through MCP',
  '1. Add Docs MCP at `https://docs.xquik.com/mcp` for read-only docs search and page retrieval.',
  '2. Configure API MCP at `https://xquik.com/mcp` for live authenticated calls.',
  '3. Use full credentials for 120 catalog routes. Of these, 119 return JSON or text. Use REST for private support downloads. Guest keys expose 33 GET routes.',
  '4. Use `explore` to search the scoped catalog and `xquik` to run allowed requests.',
  '- Full account REST and API MCP share account state. Guest keys remain limited to wallet-backed paid reads.',
  'Refunds and disputes reconcile affected-purchase credits only. Unrelated credits remain usable.',
  '- Docs MCP server: https://docs.xquik.com/mcp',
  '- API MCP server: https://docs.xquik.com/mcp/overview',
] as const;

const REQUIRED_SKILL_DIRECT_MESSAGE_HANDOFF_SNIPPETS = [
  '### Direct message handoff',
  '1. Send text DMs with `POST /api/v1/x/dm/{userId}` and store `messageId`.',
  '2. For media DMs, call `POST /api/v1/x/media` first, then pass exactly 1 returned `mediaId` in `media_ids`.',
  '3. Keep DM body text in private systems. Shared outputs should store IDs, status, timestamps, and media references instead of full DM bodies.',
  '4. Leave `reply_to_message_id` unset because the REST endpoint rejects DM reply threading.',
] as const;

const FORBIDDEN_SKILL_MCP_HANDOFF_SNIPPETS = [
  'Use the MCP server to let Claude, ChatGPT, Cursor, VS Code, Codex, or other agents interact with X data.',
  '1. Configure the MCP endpoint `https://xquik.com/mcp`.',
  'Use Docs MCP for no-auth documentation search and API MCP',
  'for read-only documentation search.',
  '- The REST API and MCP server connect to the same backend and share the same account state.',
  '- MCP server: https://docs.xquik.com/mcp/overview',
] as const;

const REQUIRED_SKILL_CONFIDENTIALITY_SNIPPETS = [
  '- **Trending data**: Access current X trends across 12 regions plus Radar topics.',
] as const;

const FORBIDDEN_SKILL_CONFIDENTIALITY_PATTERN =
  /radar topics from (?!Xquik's own infrastructure\.)[^\n.]+(?:,| and )[^\n.]+/u;

const REQUIRED_MCP_CONTRACT_SNIPPETS = [
  'Xquik compatibility discovery metadata is available at:',
  'This page covers the API MCP server at `https://xquik.com/mcp` for',
  'authenticated account actions and guest paid reads. For public documentation',
  '[Docs MCP server](/mcp/docs-mcp) at `https://docs.xquik.com/mcp`.',
  'https://xquik.com/.well-known/mcp.json',
  '`GET` and `POST` requests to `/.well-known/mcp.json` return an Xquik',
  'compatibility discovery document based on the official MCP Registry',
  '`GET /server.json` and',
  '`GET /.well-known/mcp/server-card.json` return the same compatibility document.',
  'they are not MCP Registry or experimental MCP Server Card fields.',
  'can also read `GET /.well-known/oauth-protected-resource/.well-known/mcp.json`',
  '`Authorization: Bearer {XQUIK_API_KEY}`',
  '`https://dashboard.xquik.com/en/account?tab=api-keys`',
  'direct client examples',
  'only when the client documents secure request headers',
  'This is an Xquik-specific fallback, not an OAuth token.',
  'Agent discovery metadata is also available at',
  '`https://xquik.com/.well-known/agent-index.json`',
  '`com.xquik/mcp`',
  '`https://xquik.com/auth.md`',
  'the supported anonymous OAuth client registration path',
  'Unauthenticated requests to `https://xquik.com/mcp` return `401` with a',
  '`WWW-Authenticate: Bearer` challenge.',
  'resource_metadata="https://xquik.com/.well-known/oauth-protected-resource/mcp"',
  '`scope="mcp:tools"`',
  '`error="invalid_token"`',
  '`error_description="Invalid access token"`',
  'The JSON body is',
  '`{ "error": "Authentication required" }`',
  'API-key clients should send',
  '`x-api-key` on the first request.',
  'Full credentials see 120 catalog routes. Of these, 119 return JSON or text through MCP.',
  'Write and media responses also use the MCP-normalized snake_case contract.',
  'Read `tweet_id`, `write_action_id`, `charged_credits`, `media_id`, `media_url`, and `message_id` from `xquik.request()` results.',
  'REST and generated SDK pages may show camelCase fields such as `tweetId`, `writeActionId`, `chargedCredits`, `mediaId`, and `messageId`; keep MCP agents on snake_case when reading tool results.',
  'Search the authenticated catalog. Full credentials see 120 routes. Guest keys see 33 GET routes.',
  'The call uses no credits. MCP authentication remains required.',
  'Search the authenticated API catalog. `explore` makes no network calls and uses no credits.',
  'has_more',
  'next_cursor',
  'query?: Record<string, string | number | boolean>;',
  'Pass `next_cursor` as `cursor` for tweet, profile, follower, reply, timeline, community, and list pages.',
  'Use `q` for keywords and X search operators, or pass a plain Tweet ID or X',
  'status URL when the agent receives a single stored link.',
  'API MCP v2.6.0 sends that contract',
  '## Agent handoff patterns',
  'MCP returns JSON.',
  'Use extraction export endpoints when you need Xquik to generate',
  'CSV, JSON, XLSX, Markdown, or PDF files.',
  'normalized rows or IDs to store',
  'Avoid returning raw `tweets` or `users` pages',
  '<Card title="Search tweets to JSON" icon="search">',
  'Call `GET /api/v1/x/tweets/search` with keywords, operators, a Tweet ID, or an X status URL in `q`.',
  'Store `tweets[].id`, `tweets[].text`, `tweets[].author`, `tweets[].created`, `has_more`, `next_cursor`, and the original `q`. Cost: 1 credit per tweet returned.',
  "source: 'xquik_mcp'",
  "job: 'tweet_search'",
  'tweet_id: tweet.id',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  "created: tweet['created'] ?? null",
  'rows,',
  'has_more: hasMore',
  'next_cursor: nextCursor',
  '<Card title="Scrape tweet replies to files" icon="messages-square">',
  'Call `POST /api/v1/extractions/estimate`, then `POST /api/v1/extractions` with `reply_extractor` and `targetTweetId`.',
  'Poll `GET /api/v1/extractions/{id}`, export CSV/JSON/XLSX with `GET /api/v1/extractions/{id}/export`, and store reply rows plus `has_more` and `next_cursor`.',
  'Cost: 1 credit per reply extracted or returned.',
  '> Scrape tweet replies to CSV, JSON, or XLSX (credits required)',
  "toolType: 'reply_extractor'",
  "targetTweetId: '1893704267862470862'",
  "job: 'reply_extraction'",
  'credits_required: estimate.credits_required',
  'credits_available: estimate.credits_available',
  'target_tweet_id: body.targetTweetId',
  'export_csv: `/api/v1/extractions/${extraction.id}/export?format=csv`',
  'export_json: `/api/v1/extractions/${extraction.id}/export?format=json`',
  'export_xlsx: `/api/v1/extractions/${extraction.id}/export?format=xlsx`',
  '<Card title="Export followers to CRM" icon="users">',
  'Call `GET /api/v1/x/users/{id}/followers` or `POST /api/v1/extractions` with `follower_explorer`.',
  "sourceUser = 'username'",
  "job: 'follower_export'",
  'source_user: sourceUser',
  'user_id: user.id',
  'profile_picture: user.profile_picture ?? null',
  'rows,',
  'has_more: hasMore',
  'next_cursor: nextCursor',
  '> Post a tweet or reply with public media URLs (credits required)',
  "media: ['https://example.com/product-demo.mp4']",
  "source: 'xquik_mcp'",
  "job: 'tweet_write'",
  'safe_to_retry: result.safe_to_retry',
  'write_action_id: result.id',
  'request_hash: result.request.hash',
  'poll: result.terminal ? null : result.status_url',
  'tweet_id: result.result?.id ?? result.tweet_id ?? null',
  "> Upload media for a DM (credits required)",
  "source_url = 'https://example.com/image.png'",
  'media_ids: [media.media_id]',
  "job: 'dm_media'",
  'media_url: media.media_url',
  'message_id: dm.message_id',
  'Keep full DM bodies out of',
  'shared MCP outputs; return IDs, status, media references, and source filenames',
  'Leave `reply_to_message_id` unset because the DM send endpoint rejects',
  'reply threading.',
  '> Download media and get gallery link (credits required)',
  "job: 'media_download'",
  "mode: 'single'",
  'tweet_id: download.tweet_id',
  'gallery_url: download.gallery_url',
  'cache_hit: download.cache_hit',
  'Store gallery_url as the saved media gallery. It is not an uploaded media_id for DMs.',
  '> Bulk download: search + download combined',
  "job: 'bulk_media_download'",
  'tweet_ids: tweetIds',
  'total_tweets: download.total_tweets',
  'total_media: download.total_media',
  '<Card title="Post media tweets or replies" icon="image">',
  'Call `POST /api/v1/x/tweets` with `media: ["https://..."]`. Store `tweet_id` or `write_action_id`, `reply_to_tweet_id`, `account`, `charged_credits`, and the original `media` URLs. Cost: 30 credits text-only, plus 2 credits per started MB across attached media.',
  '<Card title="Send DMs with media" icon="send">',
  'Call `POST /api/v1/x/media`, then `POST /api/v1/x/dm/{userId}` with one `media_ids` value. Store `media_id`, `media_url`, `message_id`, `user_id`, `account`, and source URL or filename. Keep full DM bodies out of shared outputs and leave `reply_to_message_id` unset. Cost: 10 credits per media upload plus 10 credits per DM send.',
  'Do not upload media before posting tweets or replies when the media is already public.',
  '`POST /api/v1/x/tweets` rejects `media_ids` with `400 unsupported_field`',
  'Reserve uploaded `media_id` values for direct messages.',
  '<Card title="Track tweet or reply writes" icon="activity">',
  'Call `POST /api/v1/x/tweets`, then `GET /api/v1/x/write-actions/{id}` when pending. Store `tweet_id`, `reply_to_tweet_id`, `write_action_id`, `status`, `charged`, `charged_credits`, and `media`. Cost: 30 credits text-only, plus 2 credits per started MB across attached media.',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  'Call `POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`, then `POST /api/v1/webhooks`.',
  "save_secret_once: 'Store webhook.secret for X-Xquik-Signature verification; do not print it in logs.'",
  "idempotency_keys: ['deliveryId', 'streamEventId']",
  'delivery_status: `/api/v1/webhooks/${webhook.id}/deliveries`',
  'run `POST /api/v1/webhooks/{id}/test` before routing production events',
  'Verify `X-Xquik-Signature`, de-dupe production payloads with `deliveryId` and `streamEventId`, and inspect `GET /api/v1/webhooks/{id}/deliveries` for retry status rows.',
  '> Poll stored monitor events (free)',
  "job: 'monitor_event_poll'",
  'query: { monitorId: monitor_id, eventType: event_type }',
  'event_id: event.id',
  'monitor_type: event.monitor_type',
  'next_query: page.next_cursor',
  '? { monitorId: monitor_id, eventType: event_type, after: page.next_cursor }',
  '<Card title="Replay monitor events" icon="activity">',
  'Call `GET /api/v1/events` when a receiver missed webhook delivery or a downstream queue needs replay.',
  'Store `event_id`, `type`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`; use `after` for the next page.',
  'Do not use `cursor` on event pages.',
  "source: 'xquik_mcp'",
  "job: 'tweet_search'",
  '> Run an extraction with a resumable handoff (credits required)',
  "toolType: 'tweet_search_extractor'",
  "searchQuery: 'launch announcement'",
  "job: 'tweet_search_extraction'",
  "status: 'blocked'",
  'credits_required: estimate.credits_required',
  'credits_available: estimate.credits_available',
  'extraction_id: job.id',
  'tool_type: job.tool_type',
  'status: job.status',
  'estimated_results: estimate.estimated_results',
  'poll: `/api/v1/extractions/${job.id}`',
  'export_after_complete: `/api/v1/extractions/${job.id}/export?format=json`',
  '**402 / `no_subscription` / `subscription_inactive`**',
  'Ask the user to choose and confirm before calling `POST /api/v1/subscribe`.',
  '**402 / `no_credits` / `insufficient_credits`**',
  'Full account sessions may create account checkout after confirmation.',
  'Guest wallet creation and top-up remain direct REST after confirmation.',
  'The MCP server never starts subscriptions, checkout, top-up, or other billing mutations in response to an API error.',
  'The REST API documents 128 operations. The full MCP catalog exposes 120 across 10 categories:',
  '6 operations in `support`: create, list, read, reply, close, and download attachments.',
  '27 operations across `x-accounts` and `x-write`:',
  '<Card title="Tweets, profiles & followers" icon="search">',
  '38 operations in `twitter`: batch and single tweet lookup, tweet search, article lookup, user lookup, follow checks, trends, bookmarks, notifications, timeline, DM history, likes, media, followers, replies, communities, and lists.',
  '<Card title="X accounts and writes" icon="send">',
  '27 operations across `x-accounts` and `x-write`: connect accounts, resolve challenges, post tweets, like, retweet, follow, remove followers, send DMs, upload media, update profiles, and manage communities.',
  '<Card title="Monitor billing" icon="radio">',
  'Active monitors cost 21 credits per monitor-hour. Creating one requires enough available credits.',
] as const;

const REQUIRED_OAUTH_AGENT_DISCOVERY_SNIPPETS = [
  '"protected_resources": ["https://xquik.com/mcp"]',
  '"service_documentation": "https://docs.xquik.com/oauth/overview"',
  '"resource_documentation": "https://docs.xquik.com/mcp/overview"',
  '"agent_auth": {',
  '"register_uri": "https://xquik.com/api/oauth/register"',
  '"claim_uri": "https://xquik.com/api/oauth/authorize"',
  '"revocation_uri": "https://xquik.com/api/oauth/revoke"',
  '"identity_types_supported": ["anonymous", "oauth_client"]',
  '"credential_types_supported": ["oauth_access_token"]',
  '"scopes_supported": ["mcp:tools"]',
  '"skill": "https://xquik.com/auth.md"',
  '"registration_endpoint": "https://xquik.com/api/oauth/register"',
  '"response_types_supported": ["code"]',
  '"grant_types_supported": ["authorization_code", "refresh_token"]',
  '"token_endpoint_auth_methods_supported": ["none", "client_secret_post"]',
  '"revocation_endpoint_auth_methods_supported": ["none", "client_secret_post"]',
  'callback?code=AUTH_CODE_HERE&state=random_csrf_token&iss=https%3A%2F%2Fxquik.com',
  '"expires_in": 3600',
  '| Access token | 1 hour |',
  '`invalid_redirect_uri`',
  'Defaults to `MCP Client`',
  '`agent_auth` is a Xquik discovery extension, not an RFC 8414 or MCP core field.',
] as const;

const FORBIDDEN_OAUTH_AGENT_DISCOVERY_SNIPPETS = [
  '"expires_in": 86400',
  '| Access token | 24 hours |',
  '| `client_name` | string | Yes |',
  '| `Invalid request body` |',
] as const;

const REQUIRED_MCP_EXAMPLE_PROMPT_SNIPPETS = [
  'Replay stored events for monitor mon_123 using the last next_cursor as after.',
  'Search recent X posts about TypeScript.',
  'Pull all replies to this tweet: `https://x.com/elonmusk/status/1893456789012345678`',
  'Set up a webhook at `https://my-server.com/events` for new tweets.',
  'Post a tweet saying: Just shipped v2.0!',
  'Post a tweet saying: New feature! Use public image URL `https://example.com/launch.png`.',
] as const;

const FORBIDDEN_MCP_EXAMPLE_PROMPT_SNIPPETS = [
  '- "Can you',
  '- "What',
  'What\'s',
  'don\'t',
  'Upload this image and tweet it',
] as const;

const REQUIRED_MCP_SETUP_CALLOUT_SNIPPETS = [
  '<Tip>',
  'Start with [Claude.ai](https://claude.ai) for OAuth login or [Claude Code](#setup) for terminal setup.',
  '</Tip>',
] as const;

const FORBIDDEN_MCP_SETUP_CALLOUT_SNIPPETS = [
  '<Tip>**',
  '(zero config, OAuth login)',
  '(terminal, most flexible)',
] as const;

const REQUIRED_MCP_SETUP_TAB_SNIPPETS = [
  '### Web and terminal clients',
  '### Editor clients',
  '<Tab title="Claude.ai (Web)">',
  '<Tab title="Codex CLI">',
  '<Tab title="Cursor">',
  '<Tab title="OpenCode">',
] as const;

const REQUIRED_CURRENT_MCP_CLIENT_SETUP_SNIPPETS = [
  '## Client compatibility',
  '[Claude Code](https://docs.anthropic.com/en/docs/claude-code/mcp)',
  '[OpenCode](https://opencode.ai/docs/mcp-servers/)',
  '[Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)',
  '[Cursor](https://docs.cursor.com/context/model-context-protocol)',
  '[GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)',
  '[Cline](https://docs.cline.bot/cli/cli-reference)',
  '[Qwen Code](https://github.com/QwenLM/qwen-code)',
  '[Codex](https://learn.chatgpt.com/docs/extend/mcp)',
  '[Goose](https://goose-docs.ai/docs/getting-started/using-extensions/)',
  '[Roo Code](https://github.com/RooCodeInc/Roo-Code)',
  '[Pi](https://github.com/earendil-works/pi/tree/main/packages/coding-agent)',
  "Roo Code's archived final release has Streamable HTTP but no MCP OAuth provider",
  'Pi requires a separately installed and tested MCP adapter',
  '**Settings > Security and login**',
  '**Settings > Plugins**',
  'https://chatgpt.com/plugins',
  'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt',
  'ChatGPT uses Xquik OAuth and cannot present a custom API key.',
  'Custom remote',
  'connectors require Pro, Max, Team, or Enterprise.',
  'an Owner or Primary Owner must add the connector first.',
  'copilot mcp add xquik --type http --url https://xquik.com/mcp',
  'run `/mcp add`',
  'gemini mcp add --transport http xquik https://xquik.com/mcp',
  '"httpUrl": "https://xquik.com/mcp"',
  'Run `cline mcp`',
  'QWEN_CODE_FORCE_ENCRYPTED_FILE_STORAGE=true',
  'qwen mcp add --transport http xquik https://xquik.com/mcp',
  '`httpUrl` for manual Streamable HTTP configuration',
  '`~/.config/goose/config.yaml`',
  'Authorization: "Bearer ${XQUIK_API_KEY}"',
  '"Authorization": "Bearer ${env:XQUIK_API_KEY}"',
  "Pi's coding agent has no native MCP client.",
  'API-key fallback is client-specific.',
] as const;

const FORBIDDEN_CURRENT_MCP_CLIENT_SETUP_SNIPPETS = [
  '**Settings > Apps > Advanced settings**',
  '**Settings > Apps > Create**',
  'Scan tools',
  'Custom MCP apps are web-only.',
  '"Authorization": "Bearer ${XQUIK_API_KEY}"',
  'Claude\'s CIMD client',
  'Free accounts can add 1 custom connector.',
  'copilot mcp add --transport http xquik https://xquik.com/mcp',
  'Older Gemini CLI builds also accept the legacy `httpUrl` field.',
] as const;

const REQUIRED_DOCS_MCP_SERVER_SNIPPETS = [
  'title: "Docs MCP Server for Tweet, Follower & Webhook Docs"',
  'Xquik documentation is available as an MCP server at `https://docs.xquik.com/mcp`.',
  'AI tools can search the full docs site and retrieve indexed public pages',
  'This differs from the [Xquik API MCP server](/mcp/overview) at `xquik.com/mcp`.',
  'The docs MCP server is read-only and requires no authentication.',
  '<Card title="Docs MCP Server" icon="book-open">',
  'Search docs and read indexed public pages at `https://docs.xquik.com/mcp`. No auth required. Free.',
  '<Card title="API MCP Server" icon="terminal">',
  'Search tweets, inspect profiles, export followers, and manage monitors at',
  'Full credentials search 120 catalog routes. Guest `paid_reads` keys search 33',
  '## Agent route checklist',
  '<Card title="Read docs first" icon="book-open">',
  'Use Docs MCP at `https://docs.xquik.com/mcp` for public docs, API',
  'parameters, examples, error codes, SDK guidance, and no-auth page',
  '<Card title="Run account actions" icon="terminal">',
  'Use API MCP at `https://xquik.com/mcp` for live X reads, writes, monitors,',
  'webhooks, draws, or extraction jobs. Authenticate with an API key or OAuth',
  '<Card title="Persist outside chat" icon="boxes">',
  'Use REST or generated SDKs when a backend must own retries, cursor storage,',
  'file downloads, queues, or batch orchestration.',
  '<Card title="Hand off results" icon="braces">',
  'Store the endpoint path, request parameters, returned IDs, `has_more`,',
  '`next_cursor`, export route, or webhook replay route before ending the',
  '## Quick connect',
  '**Copy MCP Server URL**',
  '**Copy MCP Install Command**',
  '**Connect to Cursor**',
  '**Connect to VS Code**',
  '<Tab title="Claude.ai (Web)">',
  'URL: `https://docs.xquik.com/mcp`',
  '<Tab title="Claude Code">',
  '<Tab title="Cursor">',
  '<Tab title="VS Code">',
  '<Tab title="Windsurf">',
  '<Tab title="OpenCode">',
  '<Tab title="ChatGPT">',
  '<Tab title="GitHub Copilot CLI">',
  '<Tab title="Cline">',
  '<Tab title="Qwen Code">',
  '<Tab title="Goose">',
  '<Tab title="Roo Code">',
  '<Tab title="Pi">',
  'copilot mcp add --transport http xquik-docs https://docs.xquik.com/mcp',
  'gemini mcp add --transport http xquik-docs https://docs.xquik.com/mcp',
  'qwen mcp add --transport http xquik-docs https://docs.xquik.com/mcp',
  'goose session --with-streamable-http-extension https://docs.xquik.com/mcp',
  'Roo Code is archived.',
  'Pi has no native MCP client.',
  '## Using both MCP servers',
  '**Docs MCP** (`docs.xquik.com/mcp`)',
  '**API MCP** (`xquik.com/mcp`)',
  'The AI decides which server to query based on context.',
  'A question about how draw filters work hits the docs server.',
  'A request to run a draw hits the API server.',
  '## What gets searched',
  'API reference (128 documented operations)',
  'Webhook documentation (overview, signature verification)',
  'MCP server setup and tools reference',
  'OAuth 2.1 documentation',
  '`llms.txt` (complete API technical reference)',
  '"mcp/docs-mcp"',
] as const;

const REQUIRED_AGENT_MCP_HANDOFF_SNIPPETS = [
  'title: "AI Agent MCP Handoff for Tweet Search & Exports"',
  'description: "Route AI agents between tweet search, follower exports, account actions, Docs MCP, API MCP, REST, SDKs, webhooks, and event replay. See tool examples."',
  '<Card title="Docs MCP" icon="book-open">',
  '`https://docs.xquik.com/mcp`',
  '<Card title="API MCP" icon="terminal">',
  '`https://xquik.com/mcp`',
  '<Card title="REST or SDK" icon="code">',
  '<Card title="Webhooks and Replay" icon="history">',
  'Use `explore` before `xquik.request(...)`',
  '`xquik.request(path, { method?, body?, query? })`',
  'required parameters, costs, and response shape',
  "source: 'xquik_mcp'",
  "job: 'tweet_search'",
  'has_more: page.has_more',
  'next_cursor: page.next_cursor',
  'Pass `next_cursor` back as `cursor`',
  'Pass `next_cursor` back as `after`.',
  '`GET /api/v1/credits`',
  '"surface": "api_mcp"',
  '"event_replay_route": "GET /api/v1/events?after=9002"',
  '"export_route": "GET /api/v1/extractions/77777/export?format=json"',
  'Keep API keys, webhook secrets, raw request bodies, raw signatures, and full',
  '<Card title="File Exports" icon="braces" href="/guides/response-formats-exports">',
  '<Card title="Webhook Receivers" icon="webhook" href="/guides/twitter-webhook-testing">',
  '<Card title="SDK Backends" icon="boxes" href="/sdks">',
  '"mcp/agent-handoff"',
  '[Agent MCP Handoff](https://docs.xquik.com/mcp/agent-handoff)',
] as const;

const REQUIRED_TROUBLESHOOTING_MCP_HANDOFF_SNIPPETS = [
  'Xquik has 2 MCP servers. Choose based on what the agent needs to do.',
  '<Card title="Search docs" icon="book-open">',
  'Connect `https://docs.xquik.com/mcp`. It is read-only and requires no auth.',
  '<Card title="Run API actions" icon="terminal">',
  'Connect `https://xquik.com/mcp`. Full credentials expose 120 catalog routes. Of these, 119 return JSON or text. Guest `paid_reads` keys expose 33 GET routes.',
  'For docs search, add `https://docs.xquik.com/mcp`.',
  'For account actions, use a full API key or OAuth login.',
  'For guest reads, activate a guest key through direct REST, then authenticate MCP with that key.',
  '[Docs MCP server](/mcp/docs-mcp)',
  '[MCP Server overview](/mcp/overview)',
] as const;

const FORBIDDEN_TROUBLESHOOTING_MCP_HANDOFF_SNIPPETS = [
  'Xquik provides an MCP (Model Context Protocol) server for AI agent integration. 2 tools',
  'The agent authenticates via the `x-api-key` header, same as the REST API',
] as const;

const FORBIDDEN_DOCS_MCP_SERVER_SNIPPETS = [
  'Docs MCP server is authenticated',
  'Docs MCP server executes actions',
  'Search docs at `https://docs.xquik.com/mcp`. Use an API key',
  'Interact with X data at `https://docs.xquik.com/mcp`',
  'One search tool.',
] as const;

const FORBIDDEN_MCP_CONTRACT_SNIPPETS = [
  'returns the same response shapes documented here. No field name mapping is needed.',
  'The sandbox automatically calls `POST /api/v1/subscribe` and includes a checkout URL in the error message.',
  'The sandbox attempts `POST /api/v1/subscribe`; when it returns a URL, the error includes it.',
  'Call `POST /api/v1/credits/topup`, return its checkout URL, then retry after payment completes.',
  '```http',
  'HTTP/1.1 401 Unauthorized',
  'The JSON body is:',
  'const tweets = [];',
  'tweets.push(...page.tweets);',
  'return { tweets, next_cursor: cursor };',
  'const users = [];',
  'users.push(...page.users);',
  'return { users, next_cursor: cursor };',
  "idempotency_keys: ['deliveryId']",
  "idempotency_keys: ['streamEventId']",
  'console.log(webhook.secret)',
  'console.log(test)',
  'query?: Record<string, string>;',
] as const;

const REQUIRED_BILLING_RECOVERY_SNIPPETS = [
  '### Recover from 402',
  'An account `402` creates no checkout.',
  '402 insufficient_credits',
  'get explicit confirmation before billing',
  'https://xquik.com/api/v1/credits',
  'https://xquik.com/api/v1/credits/topup',
  'https://xquik.com/api/v1/credits/quick-topup',
  'A USD 25 quick top-up adds 166,666 credits',
  '"balance": "167116"',
  '"credits": "166666"',
  'Only the `charged` quick top-up outcome grants credits.',
  'If quick top-up returns `no_payment_method`, create a checkout top-up instead.',
  'If it returns `requires_action`, complete the payment confirmation flow before retrying the metered API call.',
] as const;

const REQUIRED_BILLING_MONITOR_SNIPPETS = [
  '## Subscription',
  '<Card title="Starter" icon="rocket">',
  'USD 20/month. Includes 140,000 monthly credits (USD 0.00014/credit).',
  'Prototyping and low-volume integrations. Monitor slots are unlimited.',
  '<Card title="Pro" icon="gauge">',
  'USD 99/month. Includes 770,000 monthly credits (USD 0.00013/credit).',
  'Production workloads and growing teams. Monitor slots are unlimited.',
  '<Card title="Business" icon="building-2">',
  'USD 199/month. Includes 1,670,000 monthly credits (USD 0.00012/credit).',
  'High-volume automation and enterprise use. Monitor slots are unlimited.',
  '### Pick a billing path by job',
  '<Card title="Search tweets to CSV or JSON" icon="search">',
  'Cost: 1 credit per tweet returned or extracted.',
  '<Card title="Export followers" icon="users">',
  'Cost: 1 credit per follower returned.',
  '<Card title="Post tweets or replies" icon="send">',
  'Send public media URLs in `media` when posting media.',
  'Cost: 30 credits text-only, plus 2 credits per started MB across attached media.',
  '<Card title="Upload media for DMs" icon="image">',
  'uploaded `media_id`',
  'Cost: 10 credits per media upload call.',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  'signed webhooks',
  'Cost: 21 credits per active monitor-hour, with a 500-credit daily estimate.',
  '<Card title="Recover from 402" icon="credit-card">',
  'Inspect `payment_options`. Ask the user to choose and confirm.',
  '### Monitor pricing',
  '<Card title="Account monitor slots" icon="users">',
  'Account monitor slots are unlimited.',
  '<Card title="Keyword monitor slots" icon="search">',
  'Keyword monitor slots are unlimited.',
  '<Card title="Active monitor hour" icon="clock">',
  'Each active monitor costs 21 credits per monitor-hour.',
  '<Card title="Check interval" icon="timer">',
  'Active monitors check every 1 second.',
  '<Card title="Webhook and event delivery" icon="radio">',
  'Webhook and event deliveries are included in active monitor billing.',
  'Creating or reactivating an account monitor requires at least 22 available credits',
  '1 credit for the username lookup',
  'Creating or reactivating a keyword monitor also requires at least 22 available credits',
  'New active monitors are due for billing immediately',
  '`nextBillingAt`',
  '`monitorsUsed`, `monitorBilling.activeHourlyBurn`, and `monitorBilling.activeDailyEstimate` include active account monitors and active keyword monitors.',
  '### Plan monitor credits before you monitor tweets',
  'Use `GET /account` before creating more tweet monitors or tweet alerts.',
  'Each active account monitor or keyword monitor adds `21` credits to `monitorBilling.activeHourlyBurn` and `500` credits to `monitorBilling.activeDailyEstimate`.',
  '<Card title="1 active monitor" icon="radio">',
  'Hourly burn: 21 credits/hour. Daily estimate: 500 credits/day.',
  '<Card title="5 active monitors" icon="activity">',
  'Hourly burn: 105 credits/hour. Daily estimate: 2,500 credits/day.',
  '<Card title="10 active monitors" icon="gauge">',
  'Hourly burn: 210 credits/hour. Daily estimate: 5,000 credits/day.',
  'Keep at least 22 credits before creating or reactivating one more monitor.',
  'If `creditInfo.balance` is below the next hourly burn, top up before enabling more monitors.',
  '### Extractions & draws',
  '<Card title="Tweet-style results" icon="message-square">',
  '1 credit per result. Includes tweets, replies, quotes, mentions, posts, likes, media, and search exports.',
  '<Card title="People results" icon="users">',
  '1 credit per result. Includes followers, following, favoriters, retweeters, community members, people search, list members, list followers, and verified followers.',
  '<Card title="Article results" icon="file-text">',
  '5 credits per result. Applies to article extractions.',
  'A USD 10 top-up adds 66,666 credits',
  'Account, guest, and anonymous callers receive different payment choices.',
] as const;

const REQUIRED_BILLING_CARRYOVER_SNIPPETS = [
  'Metered calls need enough available credits, not an active plan.',
  '## Monthly credits & carry-over',
  'Every paid subscription invoice adds the monthly credit grant to your account balance.',
  'Subscription credits, top-up credits, and automatic top-up credits stay in that balance until you spend them.',
  'Unused subscription credits **carry over** to the next billing period',
  'When the shared balance reaches 0, metered calls return `402 Payment Required`',
  'Yes. Subscription credits and top-up credits stay in the shared balance until you spend them.',
  '## Cancel renewal & request a refund',
  'Cancellation stops future renewals.',
  'Cancellation does not issue a refund.',
  '[Terms](https://xquik.com/en/terms)',
] as const;

const REQUIRED_BILLING_MPP_SNIPPETS = [
  '## Pay-per-use (MPP)',
  'Seven fixed-price read operations accept direct [MPP](/mpp/machine-payments-protocol) payments.',
  'Use [MPP overview](/mpp/machine-payments-protocol#eligible-endpoints) for the complete 7-operation list.',
  'Direct MPP uses fixed `charge` pricing:',
  '<Card title="USD 0.00015 units" icon="coins">',
  '`GET /x/tweets/{id}`, `GET /x/users/{id}`, and `GET /x/communities/{id}/info` cost USD 0.00015 per call.',
  '<Card title="USD 0.00075 calls" icon="badge-dollar-sign">',
  '`GET /x/followers/check` and `GET /x/articles/{tweetId}` cost USD 0.00075 per call.',
  '<Card title="USD 0.00045 trends" icon="trending-up">',
  'Trend lookups use flat charge intent pricing: `GET /trends` and `GET /x/trends`.',
  '<Card title="Fixed charge intent" icon="receipt">',
  'Every direct MPP operation advertises one fixed `charge` offer per request.',
  'Guest wallets prepay the 33 eligible GET routes without an account.',
  '`POST /api/v1/guest-wallets` creates a one-use Stripe-hosted Payment Link and returns a `paid_reads` key.',
  'The key stays inactive until a verified Stripe webhook.',
  'A guest `402` offers only `POST /api/v1/guest-wallets/topups`.',
  'Anonymous non-MPP paid reads return `401` with a Bearer challenge and guest wallet action.',
  'The 7 direct MPP reads return `402` with a Payment challenge and the same action.',
] as const;

const REQUIRED_GUEST_WALLET_GUIDE_SNIPPETS = [
  'Guest wallets provide prepaid access to 33 eligible X read routes without an account',
  '## Accountless Twitter Scraper API Questions',
  '### What Twitter APIs Work Without Connecting an X Account?',
  '### Can I Scrape Twitter Without an API Account?',
  '### Twitter API No Account Required',
  '### Accountless Twitter Scraper',
  '### Guest Key Twitter API',
  'Every guest-wallet paid read requires the active guest key returned during wallet creation.',
  'Direct MPP reads use a per-request payment credential.',
  'A `401` or `402` response never creates a checkout.',
  'Create a Payment Link only after the user explicitly confirms.',
  'The `paid_reads` scope permits exactly the 33 GET routes',
  '## Eligible paid-read routes',
  'Seven routes also accept [direct MPP payment](/mpp/machine-payments-protocol#eligible-endpoints).',
  'The other 26 routes require a guest or full account credential.',
  'Available account credits; plans add monthly credits',
  'The 3 guest credential routes remain direct REST only:',
  'MCP cannot execute these routes.',
  'Refunds and disputes reconcile only affected-purchase credits. Unrelated credits remain usable.',
  'Access pauses only during unresolved settlement risk or unrecovered liability. It resumes after resolution.',
] as const;

const REQUIRED_GUEST_WALLET_CREATE_SECURITY_SNIPPETS = [
  'api_key=$(jq -r \'.api_key\' <<<"$response")',
  'Store $api_key and $idempotency_key in your secret manager. Do not print them.',
  'const apiKey = wallet.api_key;',
  'Store apiKey and idempotencyKey in your secret manager. Do not print them.',
] as const;

const FORBIDDEN_GUEST_WALLET_CREATE_LOG_SNIPPETS = [
  '| jq',
  'console.log(wallet)',
  'process.stdout.write(String(wallet.api_key)',
] as const;

const PAID_READ_REFERENCE_PAGES = [
  'api-reference/trends/list.mdx',
  'api-reference/x/batch-tweets.mdx',
  'api-reference/x/batch-users.mdx',
  'api-reference/x/check-follower.mdx',
  'api-reference/x/community-info.mdx',
  'api-reference/x/community-members.mdx',
  'api-reference/x/community-moderators.mdx',
  'api-reference/x/community-search.mdx',
  'api-reference/x/community-tweets.mdx',
  'api-reference/x/favoriters.mdx',
  'api-reference/x/followers-you-know.mdx',
  'api-reference/x/followers.mdx',
  'api-reference/x/following.mdx',
  'api-reference/x/get-article.mdx',
  'api-reference/x/get-tweet.mdx',
  'api-reference/x/twitter-profile-lookup.mdx',
  'api-reference/x/list-followers.mdx',
  'api-reference/x/list-members.mdx',
  'api-reference/x/list-tweets.mdx',
  'api-reference/x/retweeters.mdx',
  'api-reference/x/search-tweets.mdx',
  'api-reference/x/search-users.mdx',
  'api-reference/x/trends.mdx',
  'api-reference/x/tweet-quotes.mdx',
  'api-reference/x/tweet-replies.mdx',
  'api-reference/x/tweet-thread.mdx',
  'api-reference/x/user-likes.mdx',
  'api-reference/x/user-media.mdx',
  'api-reference/x/user-mentions.mdx',
  'api-reference/x/user-replies.mdx',
  'api-reference/x/user-tweets.mdx',
  'api-reference/x/verified-followers.mdx',
] as const;

const DIRECT_MPP_REFERENCE_PAGES = new Set([
  'api-reference/trends/list.mdx',
  'api-reference/x/check-follower.mdx',
  'api-reference/x/community-info.mdx',
  'api-reference/x/get-article.mdx',
  'api-reference/x/get-tweet.mdx',
  'api-reference/x/twitter-profile-lookup.mdx',
  'api-reference/x/trends.mdx',
]);

const REQUIRED_PAID_READ_REFERENCE_SNIPPETS = [
  '<ParamField header="Authorization" type="string">',
  '`paid_reads`',
  'guest wallet',
  'checkout',
] as const;

const REQUIRED_DIRECT_MPP_REFERENCE_SNIPPETS = [
  'Direct [MPP](/mpp/machine-payments-protocol):',
  '`Payment ...`',
  '`WWW-Authenticate: Payment` challenge',
] as const;

const REQUIRED_GUEST_ONLY_REFERENCE_SNIPPETS = [
  '`WWW-Authenticate: Bearer`',
  'This is not a Payment challenge.',
] as const;

const FORBIDDEN_BILLING_CARRYOVER_SNIPPETS = [
  'Every subscription includes a monthly credit allowance that resets each billing period.',
  'Unused credits **do not carry over**',
  'No. Credits reset to zero each billing period.',
  '| Tier | Price | Monthly credits | Monitor slots | Use case |',
  '| Starter | USD 20/month | 140,000 credits (USD 0.00014/credit) | Unlimited | Prototyping and low-volume integrations |',
  '| Job users search for | Use this API path | Credit behavior |',
  '| Search tweets or scrape tweets to CSV | [`GET /x/tweets/search`](/api-reference/x/search-tweets) or [extractions](/guides/extraction-workflow) | 1 credit per tweet returned or extracted |',
  '| Monitor item | Billing behavior |',
  '| Account monitor slots | Unlimited |',
  '| Active monitors | Hourly burn | Daily estimate | Credits needed before creating or reactivating one more monitor |',
  '| 5 | 105 credits/hour | 2,500 credits/day | 22 |',
  '| Credit cost | Extraction types |',
  '| 1 per result | Tweets, replies, quotes, mentions, posts, likes, media, search |',
  '| Endpoint | Price | Intent |',
  '| `GET /x/users/{id}/verified-followers` | USD 0.00015 per user | session |',
] as const;

const REQUIRED_GLOSSARY_CREDIT_CARRYOVER_SNIPPETS = [
  '<Accordion title="Credits">',
  'Subscription grants, top-ups, and automatic top-ups add credits to one shared balance.',
  'Unused credits carry over until you spend them.',
  '<Accordion title="PAYG">',
  'Top-up credits are added to your balance immediately and do not expire.',
] as const;

const REQUIRED_GLOSSARY_API_KEY_SNIPPETS = [
  '<Accordion title="API key">',
  'Authentication credential passed via the `x-api-key` header.',
  '[API Keys dashboard](https://dashboard.xquik.com/en/account?tab=api-keys)',
  '[API keys endpoint](/api-reference/api-keys/create)',
] as const;

const FORBIDDEN_GLOSSARY_CREDIT_CARRYOVER_SNIPPETS = [
  'Credits are included in your subscription and reset each billing period.',
  'reset each billing period',
  'Credits reset',
  'https://xquik.com/dashboard/account',
] as const;

const REQUIRED_X_API_GLOSSARY_SNIPPETS = [
  'title: "X API Glossary for Tweets, Followers & Webhooks"',
  'X calls its content objects posts. Xquik keeps `tweet` in public route names.',
  '## Quick X API Terminology',
  '| Reply | A tweet linked to a direct parent and conversation. |',
  '| Followers | Accounts that follow the source profile. |',
  '| Following | Accounts the source profile follows. |',
  '## Tweet, Reply & Media Terms',
  '<Accordion title="Tweet ID">',
  '`inReplyToId` identifies the',
  '`quoted_tweet` contains the referenced tweet when',
  '`retweeted_tweet` contains original tweet context when available.',
  '<Accordion title="Engagement counts">',
  '## Profile, Follower & Audience Terms',
  'Following is directional. It does not prove mutual follow.',
  '## Twitter Scraper API & Export Terms',
  'pass `next_cursor` back as `cursor`. Events, draws, and extractions use',
  '## Monitor, Event & Webhook Terms',
  'Account monitors do not emit follower-gained or follower-lost events.',
  '`X-Xquik-Signature` and `X-Xquik-Timestamp`',
  '<Accordion title="Stream event ID">',
  '## X Write & Authentication Terms',
  '<Accordion title="Durable action">',
  '<Accordion title="Idempotency key">',
  '`statusUrl` identifies the durable action to poll.',
  'xquik-api-contract: 2026-04-29',
  '## Billing, Error & Rate-Limit Terms',
  '<Accordion title="402 Payment Required">',
  '<Accordion title="429 Too Many Requests">',
  '### What Is the Difference Between Followers and Following?',
  '### How Do Replies, Quotes & Reposts Differ?',
  '### Is Tweet Scraping the Same as Monitoring?',
  '### What Is the Difference Between 402 and 429?',
] as const;

const FORBIDDEN_X_API_GLOSSARY_SNIPPETS = [
  'historical data (tweets, followers, etc.)',
  'picks winners from extraction results',
  'Most write actions cost 10 credits',
  'Each API key gets a counter per tier',
  '<Accordion title="Token bucket">',
] as const;

const REQUIRED_QUICK_TOPUP_PAGE_SNIPPETS = [
  'At USD 0.00015 per credit, a USD 25 quick top-up adds 166,666 credits',
  'Only the `charged` outcome grants credits and updates `balance`.',
  'If the endpoint returns `requires_action`, complete payment authentication with `clientSecret` before retrying the metered API call.',
  'Pass `clientSecret` to the billing confirmation flow only; do not print it in logs.',
  'client_secret=$(jq -r \'.clientSecret\' <<<"$response")',
  'const paymentClientSecret = result.clientSecret;',
  'payment_client_secret = data["clientSecret"]',
  'clientSecret, _ := data["clientSecret"].(string)',
  'If it returns `no_payment_method`, create a checkout top-up instead.',
  '"balance": "466666"',
  '"credits": "166666"',
] as const;

const FORBIDDEN_QUICK_TOPUP_CLIENT_SECRET_LOG_SNIPPETS = [
  '| jq',
  'process.stdout.write(`${JSON.stringify(data, null, 2)}\\n`);',
  'print(data)',
  'fmt.Println(data)',
] as const;

const FORBIDDEN_TOPUP_EXAMPLE_SNIPPETS = [
  '"balance": "1450"',
  '"credits": "1000"',
] as const;

const REQUIRED_API_KEYS_CREATE_PAGE_SNIPPETS = [
  'Store `fullKey` immediately and log only `id` and `prefix`.',
  'full_key=$(jq -r \'.fullKey\' <<<"$response")',
  'const apiKey = key.fullKey;',
  'api_key = key["fullKey"]',
  'apiKey := key["fullKey"]',
  'Store apiKey in your secret manager; do not print it in logs.',
  'Created API key',
  'The `fullKey` is returned **only once**.',
] as const;

const FORBIDDEN_API_KEYS_CREATE_LOG_SNIPPETS = [
  '| jq',
  'console.log(key)',
  'print(key)',
  'fmt.Println(string(respBody))',
] as const;

const REQUIRED_ACCOUNT_API_SNIPPETS = [
  'Number of currently active account monitors and keyword monitors.',
  '`monitorsUsed`, `monitorBilling.activeHourlyBurn`, and `monitorBilling.activeDailyEstimate` include active account monitors and active keyword monitors.',
] as const;

const REQUIRED_AUTHENTICATION_ACCOUNT_SNIPPETS = [
  '`GET /account` accepts `x-api-key`. Use it to check plan, credit balance, and monitor billing from server-side integrations.',
] as const;

const FORBIDDEN_AUTHENTICATION_ACCOUNT_SNIPPETS = [
  'monitor quota',
] as const;

const REQUIRED_X_API_INTEGRATION_CHECKLIST_SNIPPETS = [
  '## Integration Readiness Checklist',
  '<Card title="Authentication" icon="key">',
  '`x-api-key`',
  '<Card title="Response contract" icon="braces">',
  '`xquik-api-contract: 2026-04-29`',
  '`has_more`',
  '`next_cursor`',
  '<Card title="Pagination" icon="list">',
  '`after` with `nextCursor`',
  '`cursor` with `next_cursor`',
  '/api/v1/x/tweets/search?q=xquik&cursor=',
  '<Card title="Billing" icon="credit-card">',
  '`402 no_credits`',
  '`402 insufficient_credits`',
  '<Card title="Rate limits" icon="timer">',
  '`Retry-After`',
  '<Card title="Durable writes" icon="activity">',
  'Send a unique `Idempotency-Key`.',
  'Poll `statusUrl` while `terminal` is `false`.',
  'Retry only when `safeToRetry` is `true`, using a new key.',
  'opt in to the normalized v1 response contract',
  '<Card title="400 validation" icon="circle-alert">',
  '`invalid_input` means the request body, query, or path failed',
  '<Card title="401 authentication" icon="key-round">',
  '`unauthenticated` means the API key or bearer token is missing',
  '<Card title="402 billing state" icon="credit-card">',
  '`no_subscription`, `no_credits`, and `insufficient_credits`',
  'available credits work without an active plan.',
  '<Card title="429 rate limit" icon="timer">',
  '`rate_limit_exceeded` includes `Retry-After` and JSON `retryAfter`',
  '<Card title="502 read service retry" icon="rotate-ccw">',
  '`x_api_unavailable` means the read service is temporarily unavailable',
  '"message": "Read service temporarily unavailable. Retry shortly."',
  '<Card title="tweet.new" icon="bell">',
  'no reply, quote, or retweet signal is present.',
  '<Card title="tweet.quote" icon="quote">',
  'when quote metadata is present.',
  '<Card title="tweet.reply" icon="message-circle">',
  'reply flags or reply target IDs.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'retweet flags or `RT @` text.',
] as const;

const FORBIDDEN_API_OVERVIEW_SNIPPETS = [
  'best-practice response contract',
  '/api/v1/x/tweets/search?query=xquik',
  '| 502 | `x_api_unavailable` | X data source temporarily unavailable - retry |',
  '"message": "X data source temporarily unavailable. Retry shortly."',
] as const;

const FORBIDDEN_SEARCH_TWEETS_QUERY_PARAM_SNIPPETS = [
  '/x/tweets/search?query=',
] as const;

const REQUIRED_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'Respect `Retry-After`; otherwise start at 1 second, add jitter, and stop after 3 retries.',
  'Requests sent before the fixed window resets keep returning `429` until `Retry-After` elapses.',
  'Standard read throttles return `Retry-After: 1`. Standard write and delete',
  'Account connection returns the remaining',
  'window. A login cooldown returns its own remaining duration.',
  '"error": "rate_limit_exceeded"',
  '<Card title="Node.js Libraries" icon="package">',
  '<Card title="Python Library" icon="package">',
  '`pip install ratelimit`',
  '<Card title="Go Library" icon="package">',
  '`go get golang.org/x/time/rate`',
  'Tweet searches return `has_next_page` and `next_cursor`.',
  'Store the completed page and next cursor atomically.',
  'Do not advance the cursor after a failed request.',
  'Use event reads for backfills, reconciliation, and missed delivery checks.',
] as const;

const FORBIDDEN_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'max 5 retries',
  'Sending requests before the window resets may extend your cooldown.',
] as const;

const REQUIRED_TWITTER_RATE_LIMIT_GUIDE_SNIPPETS = [
  'title: "Twitter API Rate Limits, 429 Errors & Retry-After"',
  'Standard API keys for one account share the same method buckets.',
  '| Follow or remove follower | `POST /x/users/{id}/follow` and `POST /x/users/{id}/remove-follower` | 20 actions per minute and 400 per day, shared |',
  '| Connect X account | `POST /x/accounts` | 10 attempts per 15 minutes |',
  'The window starts with your first request. It does not follow wall-clock seconds.',
  '## Xquik Limits Versus Official X API Limits',
  '| `502 x_api_rate_limited` | The read service was throttled upstream. |',
  'Store the completed page and next cursor atomically.',
  'This Bottleneck configuration reserves 10% read headroom.',
  "Multiple API keys do not multiply a standard account's limits.",
  '### What Does API Rate Limit Exceeded Mean?',
  '### Does a Rate-Limited Request Consume Tweet Credits?',
  'An Xquik tier rejection happens before the endpoint performs its work.',
  'See [X API rate limits](https://docs.x.com/x-api/fundamentals/rate-limits)',
] as const;

const FORBIDDEN_TWITTER_RATE_LIMIT_GUIDE_SNIPPETS = [
  '3 attempts per 15 minutes',
  '10 requests per 1 second',
  '120 requests per 60 seconds for reads',
] as const;

const REQUIRED_TROUBLESHOOTING_RECOVERY_SNIPPETS = [
  'GET /api/v1/events/{id}',
  'streamEventId',
  'GET /api/v1/events?monitorId={id}&limit=50',
  'GET /api/v1/events?keywordMonitorId={id}&limit=50',
  'If `hasMore` is `true`, store `nextCursor` and pass it as `after`',
  'Store `id`, `request.hash`, `account`, `target`, `billing`, and `statusUrl`',
  'Poll `statusUrl` while `terminal` is `false`',
  'Respect `Retry-After`, `pollAfterMs`, and `nextAction`',
  'Retry only when `safeToRetry` is `true`, using a new `Idempotency-Key`',
  'Verify the result before retrying when `nextAction.type` is `verify_result`',
] as const;

const REQUIRED_MONITOR_TYPES_GUIDE_SNIPPETS = [
  'interface Monitor',
  'xUserId: string;',
  'nextBillingAt: string;',
  'interface KeywordMonitor',
  'query: string;',
  'Account monitor endpoints return `Monitor`.',
  'Keyword monitor endpoints return `KeywordMonitor` with the normalized X search `query`.',
  'Both monitor types include `eventTypes`, `isActive`, `createdAt`, and `nextBillingAt`',
] as const;

const REQUIRED_EVENT_TYPES_GUIDE_SNIPPETS = [
  'monitorType: "account" | "keyword";',
  'username?: string;',
  'query?: string;',
  'keywordMonitorId?: string;',
  'xEventId?: string;',
  '`monitorType` is `account` or `keyword`; `monitorId` points to the source monitor.',
  'Account events include `username`; keyword events include `query` and `keywordMonitorId`.',
  'Use `nextCursor` with the `after` query parameter to fetch subsequent pages.',
] as const;

const REQUIRED_EVENT_LIST_API_HANDOFF_SNIPPETS = [
  'description: "Query stored tweet, follower, following, profile, and keyword monitor events by monitor, event type, time range, and cursor. Includes response fields."',
  "jq '. as $page | .events[] | {",
  'event_id: .id',
  'monitor_type: .monitorType',
  'monitor_id: .monitorId',
  'event_detail_endpoint: ("/api/v1/events/" + .id)',
  'delivery_join_key: .id',
  'has_more: $page.hasMore',
  'next_cursor: ($page.nextCursor // null)',
  'const eventRows = data.events.map((event) => ({',
  'event_id: event.id',
  'event_type: event.type',
  'monitor_type: event.monitorType',
  'monitor_id: event.monitorId',
  'keyword_monitor_id: event.keywordMonitorId ?? null',
  'tweet_id: event.data?.id ?? null',
  'author_username: event.data?.author?.userName ?? null',
  'event_detail_endpoint: `/api/v1/events/${event.id}`',
  'delivery_join_key: event.id',
  'has_more: data.hasMore',
  'next_cursor: data.nextCursor ?? null',
  'event_rows = []',
  '"event_id": event["id"]',
  '"monitor_type": event["monitorType"]',
  '"tweet_id": tweet.get("id")',
  '"author_username": author.get("userName")',
  '"event_detail_endpoint": f"/api/v1/events/{event[\'id\']}"',
  '"delivery_join_key": event["id"]',
  'type EventRow struct',
  'DeliveryJoinKey      string  `json:"delivery_join_key"`',
  'EventDetailEndpoint  string  `json:"event_detail_endpoint"`',
  'NextCursor           *string `json:"next_cursor"`',
  'encoder.Encode(row)',
  'one stored event row per line',
  '`event_detail_endpoint`, `delivery_join_key`, and `next_cursor`',
  '`nextCursor` as `after` until `hasMore` is `false`.',
  '## Source filter examples',
  'Use `monitorId` for account monitor events and `keywordMonitorId` for keyword',
  'Do not pass a keyword monitor ID as `monitorId`',
  'https://xquik.com/api/v1/events?limit=50&monitorId=7',
  '{id, type, monitorId, username}',
  'https://xquik.com/api/v1/events?limit=50&keywordMonitorId=21',
  '{id, type, keywordMonitorId, query}',
  'Filter account-monitor events by account monitor ID. Use `keywordMonitorId`',
  'Filter keyword-monitor events by keyword monitor ID.',
  '## Event inventory handoff',
  '<Card title="Event Row" icon="fingerprint">',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Monitor Source" icon="radar">',
  '`monitor_type`, `monitor_id`, `keyword_monitor_id`, `username`, and',
  'Use `monitorId` for account-monitor filters and `keywordMonitorId` for',
  '<Card title="Tweet Fields" icon="message-circle">',
  '<Card title="Delivery Join" icon="link">',
  'Store `delivery_join_key` as the event ID.',
  'it to `streamEventId`',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  '<Card title="Delivery Status" icon="activity">',
  '`lastError`, `createdAt`, and `deliveredAt`',
  '<Card title="Cursor Checkpoint" icon="milestone">',
  "jq '{event_ids: [.events[].id], has_more: .hasMore, next_cursor: (.nextCursor // null)}'",
] as const;

const FORBIDDEN_EVENT_LIST_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'JSON.stringify(data, null, 2)',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_EVENT_GET_API_HANDOFF_SNIPPETS = [
  "jq '{",
  'event_id: .id',
  'monitor_type: .monitorType',
  'x_event_id: (.xEventId // null)',
  'tweet_id: (.xEventId // .data.id // null)',
  'event_detail_endpoint: ("/api/v1/events/" + .id)',
  'delivery_join_key: .id',
  'const eventRow = {',
  'event_id: event.id',
  'event_type: event.type',
  'monitor_type: event.monitorType',
  'monitor_id: event.monitorId',
  'x_event_id: event.xEventId ?? null',
  'tweet_id: event.xEventId ?? event.data?.id ?? null',
  'author_username: event.data?.author?.userName ?? null',
  'event_detail_endpoint: `/api/v1/events/${event.id}`',
  'delivery_join_key: event.id',
  'event_row = {',
  '"event_id": event["id"]',
  '"monitor_type": event["monitorType"]',
  '"x_event_id": event.get("xEventId")',
  '"tweet_id": event.get("xEventId") or tweet.get("id")',
  '"author_username": author.get("userName")',
  '"event_detail_endpoint": f"/api/v1/events/{event[\'id\']}"',
  '"delivery_join_key": event["id"]',
  'type EventRow struct',
  'DeliveryJoinKey      string  `json:"delivery_join_key"`',
  'EventDetailEndpoint  string  `json:"event_detail_endpoint"`',
  'XEventID             *string `json:"x_event_id"`',
  'tweetID := event.XEventID',
  'DeliveryJoinKey:     event.ID',
  'EventDetailEndpoint: "/api/v1/events/" + event.ID',
  'json.NewEncoder(os.Stdout).Encode(row)',
  'convert one event into an audit row',
  '`event_detail_endpoint`, and',
  '`delivery_join_key`; keyword monitor events use',
  '## Event detail handoff',
  '<Card title="Detail Row" icon="fingerprint">',
  'Keep `event_id` as the Xquik event identifier.',
  '<Card title="Delivery Join" icon="link">',
  'Match `delivery_join_key` to webhook delivery `streamEventId`',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'Do not use',
  '`x_event_id` for delivery joins.',
  '<Card title="Monitor Source" icon="radar">',
  '<Card title="Tweet Payload" icon="message-circle">',
  '<Card title="Delivery Status" icon="activity">',
  '`lastError`, `createdAt`, and `deliveredAt`',
  '[List Events](/api-reference/events/list) &middot; [List Deliveries](/api-reference/webhooks/deliveries)',
] as const;

const FORBIDDEN_EVENT_GET_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'console.log(event);',
  'print(event)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_DRAFT_TYPES_GUIDE_SNIPPETS = [
  'interface Draft',
  'updatedAt: string;',
  'List, create, and get responses include `id`, `text`, `createdAt`, and `updatedAt`.',
  'Optional `topic` and `goal` fields are omitted (not null) when not set.',
  'Use `nextCursor` with the `afterCursor` query parameter to fetch subsequent pages.',
] as const;

const FORBIDDEN_TYPES_GUIDE_COMPLETENESS_OVERCLAIMS = [
  'TypeScript type definitions for all API request and response objects',
  'Copy-pasteable TypeScript types for every Xquik API object.',
  'Use these in your client code for full type safety.',
  'These types match the response shapes from the [API Reference](/api-reference/overview).',
] as const;

const REQUIRED_ERROR_HANDLING_WRITE_STATUS_SNIPPETS = [
  'description: "Recover from API key, subscription, credit, rate-limit, validation, cursor, write-action, monitor, webhook, and dependency errors. Follow exact steps."',
  'Use each `error` code to choose recovery.',
  'safeToRetry',
  'Start with the HTTP family. Retry only when a card says so.',
  '<Card title="400 request validation" icon="circle-alert">',
  '`invalid_json`, `invalid_id`, `invalid_tweet_url`, `invalid_tweet_id`',
  '<Card title="402 billing and credits" icon="credit-card">',
  '`payment_failed`,',
  '`no_credits`, and `insufficient_credits`.',
  '<Card title="403 permissions and account health" icon="shield-alert">',
  '`api_key_limit_reached`, `dm_not_permitted`,',
  '`account_needs_reauth`, and `account_restricted`.',
  '## Common error codes',
  'schema lists every public code.',
  '<Card title="422 write validation" icon="message-circle-warning">',
  '`x_dm_not_allowed`, `x_target_not_found`, `x_content_too_long`',
  '<Card title="202 active write" icon="clock">',
  'Store the action and poll `statusUrl` while `terminal` is',
  'Follow `Retry-After`, `pollAfterMs`, and `nextAction`.',
  '<Card title="429 rate limit or cooldown" icon="timer">',
  '`Retry-After` or exponential backoff',
  '<Card title="500, 502, and 503 transient failures" icon="rotate-ccw">',
  'For writes, retry only when',
  '<Card title="HTTP status" icon="gauge">',
  '`429 Too Many Requests` means the request is rate limited or waiting on an',
  '<Card title="Retry-After header" icon="timer">',
  'The `Retry-After` header gives seconds to wait before sending the same',
  '<Card title="x_write_ambiguous" icon="activity">',
  'Completion could not be confirmed. Poll the durable action, then verify',
  '<Card title="x_transient_error" icon="rotate-ccw">',
  'Temporary write failure. Retry only when `safeToRetry` is `true`.',
  '## Write lifecycle recovery',
  '<Step title="Store the action">',
  'Store `id`, `status`, `request.hash`, `account`, `target`, `billing`, and',
  '<Step title="Poll the write action">',
  'Poll `statusUrl` while `terminal` is `false`.',
  '<Step title="Persist the outcome">',
  'Store `result` and settled `billing` after `terminal` becomes `true`.',
  '<Step title="Follow retry safety">',
  'Retry only when `safeToRetry` is `true`, using a new `Idempotency-Key`.',
  'Verify the result when `nextAction.type` is `verify_result`.',
] as const;

const REQUIRED_CREATE_TWEET_API_SNIPPETS = [
  'Post tweets and replies from a connected X account with public image URLs or 1 MP4 video URL, write-status polling, and audit handoff',
  '"post tweet replies"',
  '`reply_to_tweet_id`',
  '`media`',
  'Create a tweet or reply from one connected X account.',
  'Put public HTTPS images or one MP4 URL in `media`.',
  'Never send `mediaId` or `media_ids` to this endpoint.',
  'Send a unique `Idempotency-Key`.',
  'Store the durable action.',
  'Poll `statusUrl` while `terminal` is `false`.',
  "X's [Create Post guide](https://docs.x.com/x-api/posts/create-post) covers its separate endpoint.",
  'Use Xquik authentication. Store its durable write fields.',
  'Choose among 6 tweet request formats.',
  'Check the account can post in that X Community.',
  'publishes 1 tweet on X.',
  'const result = await response.json();',
  'const postRecord =',
  'write_action_id: result.id',
  'request_hash: result.request.hash',
  'tweet_id: result.result?.id ?? result.tweetId ?? null',
  'process.stdout.write(`${JSON.stringify(postRecord)}\\n`);',
  'result = response.json()',
  'post_record = {',
  '"write_action_id": result["id"]',
  '"request_hash": result["request"]["hash"]',
  '"tweet_id": (result.get("result") or {}).get("id") or result.get("tweetId")',
  'type CreateTweetResponse struct',
  'TweetID string `json:"tweetId"`',
  'ID string `json:"id"`',
  'SafeToRetry bool `json:"safeToRetry"`',
  '"write_action_id": result.ID',
  'Attach public media URLs directly.',
  'Send up to 4 JPEG, PNG, GIF, WebP, or AVIF image URLs.',
  'Send exactly 1 public MP4 URL up to 100 MB.',
  'Never mix video with other media.',
  'For local files, call [Upload Media](/api-reference/x-write/upload-media) first.',
  'Pass its returned `mediaUrl` in `media`.',
  'Attached media adds 2 credits per started MB across all files.',
  '## Post With Public Media URLs',
  'Use `media` for an image or MP4 at a public HTTPS URL.',
  'Send up to 4 image URLs or exactly 1 MP4 URL.',
  'Never send `media_ids`; that field is for DMs only.',
  '"account": "brand_account"',
  '"media": ["https://cdn.example.com/product-screenshot.png"]',
  '"media": ["https://cdn.example.com/product-demo.mp4"]',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"media": ["https://cdn.example.com/reply-chart.png"]',
  'Store `id`, `request.hash`, `billing`, `result`, `reply_to_tweet_id`, and `media`.',
  'Poll [Get Write Action Status](/api-reference/x-write/get-write-action-status) while `terminal` is `false`.',
  'Retry only when `safeToRetry` is `true`, using a new key.',
  '<ParamField header="Idempotency-Key" type="string" required>',
  '<WriteActionLifecycleResponse />',
  '[Get Write Action Status](/api-reference/x-write/get-write-action-status)',
] as const;

const FORBIDDEN_CREATE_TWEET_API_SNIPPETS = [
  '"media_ids": [',
  '"mediaIds": [',
  'Pass uploaded `mediaId` values in `media`',
  'Pass `mediaId` to `POST /x/tweets`',
  'Use uploaded media IDs for tweet media',
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
] as const;

const REQUIRED_DELETE_TWEET_API_SNIPPETS = [
  'title: "Twitter API Delete Tweet: Remove an Owned Post by ID"',
  '"Twitter API delete tweet"',
  'Use this Twitter API delete tweet route to remove 1 owned post by ID.',
  'This delete tweet API accepts 1 Tweet ID per request.',
  '[Delete Post endpoint](https://docs.x.com/x-api/posts/delete-post)',
  'const deletionRecord =',
  'request_hash: result.request.hash',
  'requested_tweet_id: tweetId',
  'result.result?.id ?? result.tweetId ?? result.targetId ?? null',
  'process.stdout.write(`${JSON.stringify(deletionRecord)}\\n`);',
  'deletion_record = {',
  '"request_hash": result["request"]["hash"]',
  'response.raise_for_status()',
  'type DeleteTweetResponse struct',
  'SafeToRetry bool `json:"safeToRetry"`',
  '## Delete One Owned Tweet by ID',
  "You cannot delete another account's tweet with this route.",
  '## Authenticate the Tweet Owner',
  'The request never accepts an X password or session cookie.',
  '## Run Bulk or Scheduled Tweet Cleanup',
  'It does not provide a bulk-delete operation.',
  'After HTTP `429`, wait for `Retry-After` before continuing.',
  '## Verify Tweet Deletion',
  '## Handle Delete Tweet Errors',
  '## Twitter API Delete Tweet Questions',
  '### Can the API delete another user\'s tweet?',
  '### Can the API delete all tweets at once?',
  '### Can I schedule a tweet deletion?',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_DELETE_TWEET_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
] as const;

const REQUIRED_LIKE_TWEET_API_SNIPPETS = [
  'title: "Twitter Like API: Like a Tweet by ID With Status"',
  '"Twitter Like API"',
  '"Twitter API like Tweet"',
  'Use this Twitter Like API to like 1 tweet by ID.',
  'This Twitter API like Tweet request uses 1 connected X account.',
  '[Like Post endpoint](https://docs.x.com/x-api/users/like-post)',
  '[Developer Guidelines](https://docs.x.com/developer-guidelines)',
  'Keep every like user-initiated.',
  'const likeRecord =',
  'request_hash: result.request.hash',
  'requested_tweet_id: tweetId',
  'result.result?.id ?? result.tweetId ?? result.targetId ?? null',
  'process.stdout.write(`${JSON.stringify(likeRecord)}\\n`);',
  'like_record = {',
  '"request_hash": result["request"]["hash"]',
  'response.raise_for_status()',
  'type LikeTweetResponse struct',
  'SafeToRetry bool `json:"safeToRetry"`',
  '## Like One Tweet by ID',
  '## Keep Every Like User-Initiated',
  'Do not build auto-like, bulk-like, or purchased-like workflows.',
  'This endpoint accepts 1 Tweet ID per request.',
  '## Authenticate the Connected X Account',
  'The request never accepts an X password or session cookie.',
  '## Save a Durable Like Receipt',
  '| Like action column | Source | Engagement rule |',
  '## Poll Pending Likes and Verify Completion',
  '| Already liked | Converged terminal result |',
  '## Prevent Duplicate Tweet Likes',
  '## Handle Twitter Like API Errors',
  '## Choose Like, Unlike, or Read Likes',
  '## Twitter Like API Questions',
  '### Can an API like a tweet by ID?',
  '### Does this endpoint bulk-like tweets?',
  '### How does Twitter Like API authentication work?',
  '### How should a Twitter API like Tweet retry work?',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_LIKE_TWEET_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'Liking replies that match a verified support rule.',
  'Link the like to its human or automated rule.',
] as const;

const REQUIRED_UNLIKE_TWEET_API_SNIPPETS = [
  'title: "Remove Twitter Likes API: Unlike a Tweet by ID"',
  '"remove Twitter likes"',
  '"how to remove a like on Twitter"',
  'Use this Remove Twitter Likes API to unlike 1 tweet by ID.',
  "This Twitter unlike API changes 1 connected account's like state.",
  'Use this route to delete likes on Twitter without deleting tweets.',
  'Clean up your Twitter likes without deleting tweets, replies, or reposts.',
  'Learn how to remove a like on Twitter through REST below.',
  '[Unlike Post endpoint](https://docs.x.com/x-api/users/unlike-post)',
  'curl -X DELETE https://xquik.com/api/v1/x/tweets/1895432178065391234/like',
  '-H "Idempotency-Key: unlike-1895432178065391234"',
  '## Remove One Twitter Like by ID',
  'This endpoint accepts 1 Tweet ID per request.',
  '## Authenticate the Twitter Account',
  'The request never accepts an X password or session cookie.',
  '## Approve the Exact Like Removal',
  '## Save a Durable Unlike Receipt',
  '| Unlike action column | Source | Removal rule |',
  '## Confirm Like Removal',
  'Close already-unliked actions without another request.',
  '## Remove Twitter Likes in a Controlled Queue',
  'This route has no mass-delete request.',
  '## Prevent Duplicate Unlike Requests',
  '## Handle Remove Twitter Likes Errors',
  '## Choose Unlike, Delete, or Unretweet',
  '## Remove Twitter Likes Questions',
  '### How to remove a like on Twitter with an API?',
  '### Can I remove all Twitter likes at once?',
  '### Can I remove likes for multiple Twitter accounts?',
  '### What are the risks of third-party like removal tools?',
  '### Does unliking delete the original tweet?',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_UNLIKE_TWEET_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Unlike API for Engagement Removal Actions"',
] as const;

const REQUIRED_RETWEET_TWEET_API_SNIPPETS = [
  'title: "Twitter Retweet API: Repost One Tweet by ID"',
  '"Twitter retweet API"',
  '"Twitter API retweet"',
  'Use this Twitter Retweet API to repost 1 tweet by ID.',
  'Each Twitter API retweet request names 1 connected X account.',
  '[Repost Post endpoint](https://docs.x.com/x-api/users/repost-post)',
  'const repostReceipt = await response.json();',
  'repost_receipt = response.json()',
  'var repostReceipt map[string]interface{}',
  '## Publish One Repost by Tweet ID',
  '## Authenticate and Approve the Reposting Account',
  '## Choose a Repost or New Tweet',
  '## Reconcile Retweet Automation',
  '## Schedule Retweets Without Duplicate Posts',
  '## Verify Repost Completion and Attribution',
  '## Handle Twitter Retweet API Errors',
  '## Apply Repost Bot and Campaign Controls',
  '## Twitter Retweet API Questions',
  '### How Do I Automate a Retweet Through an API?',
  '### How Do I Authenticate a Twitter API Retweet?',
  '### Can I Schedule a Retweet?',
  '### What Is the Retweet API Rate Limit?',
  '### Is a Retweet the Same as a Quote Tweet?',
  '### Can I Bulk Retweet Several Tweet IDs?',
  '### How Do I Track Retweet Activity?',
  '### Why Can a Twitter Retweet API Request Fail?',
  '### Does a Repost Keep the Original Author?',
  '### Can I Undo an API Retweet?',
  '### Can a Bot Use This Retweet API?',
  '### Do I Need a Twitter Retweet SDK?',
  'No bulk request exists here.',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_RETWEET_TWEET_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Repost API for Retweet Automation Workflows"',
] as const;

const REQUIRED_UNRETWEET_TWEET_API_SNIPPETS = [
  'title: "How to Undo a Retweet with the Twitter API"',
  '"how to undo a retweet on Twitter"',
  '"Twitter undo retweet"',
  '"Twitter API undo retweet"',
  'Use this Twitter API undo retweet workflow for 1 repost by Tweet ID.',
  '[Unrepost Post endpoint](https://docs.x.com/x-api/users/unrepost-post)',
  'const unretweetReceipt = await response.json();',
  'unretweet_receipt = response.json()',
  'var unretweetReceipt map[string]interface{}',
  '## Authenticate and Approve the Reposting Account',
  '## Remove One Repost by Tweet ID',
  '## Choose Unretweet, Delete Tweet, or Unlike',
  '## Verify Repost Removal and Timeline State',
  '## Schedule Repost Cleanup Without Bulk Unretweet',
  '## Handle Twitter Undo Retweet Errors',
  '## Twitter Undo Retweet Questions',
  '### How Do I Undo a Retweet on Twitter with an API?',
  '### Can I Undo Recent, Old, or Several Retweets?',
  '### Why Can\'t I Undo a Retweet on Twitter?',
  '### What Happens to the Tweet, Engagement, and Notifications?',
  '### Do I Use a Twitter Archive, Retweet Icon, or Delete Button?',
  'It has no bulk unretweet body.',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_UNRETWEET_TWEET_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Unretweet API for Repost Removal Actions"',
] as const;

const REQUIRED_FOLLOW_TWITTER_API_SNIPPETS = [
  'title: "Twitter Follow API: Follow One X User by ID"',
  '"Twitter API follow"',
  '"Twitter API follow user"',
  '"Twitter Follow API"',
  'Use this Twitter API follow endpoint for 1 target user ID.',
  'Each Twitter API follow user request names 1 connected X account.',
  '[Follow User endpoint](https://docs.x.com/x-api/users/follow-user)',
  'const followReceipt = await response.json();',
  'follow_receipt = response.json()',
  'var followReceipt map[string]interface{}',
  '## Authenticate and Approve the Follow',
  'Use the URL `https://xquik.com/api/v1/x/users/{id}/follow` in Python.',
  'Start the sample with `import requests`.',
  '## Verify the Twitter Follow API Result',
  '## Handle Twitter Follow API Errors',
  '## Twitter API Follow Questions',
  '### How Do I Follow a User Programmatically?',
  '### Can I Follow a Protected X Account?',
  '### Can I Bulk Follow Twitter Users?',
  '### Do I Need a Twitter Follow SDK?',
  '### How Do I Check or Undo a Follow?',
  'No bulk request exists here.',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_FOLLOW_TWITTER_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Follow API for User & Audience Connections"',
] as const;

const REQUIRED_UNFOLLOW_TWITTER_API_SNIPPETS = [
  'title: "Twitter Unfollow API: Unfollow One X User by ID"',
  '"Twitter unfollow API"',
  '"Twitter API unfollow"',
  '"how to unfollow someone on Twitter"',
  'Use this Twitter unfollow API endpoint for 1 target user ID.',
  'Each Twitter API unfollow request names 1 connected X account.',
  '[Unfollow User endpoint](https://docs.x.com/x-api/users/unfollow-user)',
  '**20 requests per minute** and **400 per day**',
  'const unfollowReceipt = await response.json();',
  'unfollow_receipt = response.json()',
  'var unfollowReceipt map[string]interface{}',
  '## Authenticate and Select the Relationship',
  '## Unfollow Twitter Accounts Safely',
  '## Select Inactive Users Before Unfollowing',
  '## Verify the Twitter Unfollow API Result',
  '## Choose Unfollow or Remove Follower',
  '## Handle Twitter API Unfollow Errors',
  '## Twitter Unfollow API Questions',
  '### How Do I Unfollow Someone on Twitter with an API?',
  '### Can I Mass Unfollow or Schedule Unfollow Actions?',
  '### Can I Unfollow Someone Without Them Knowing?',
  '### Do I Need Unfollow Tools or Browser Extensions?',
  '### How Do I Manage Several Connected Accounts?',
  '### How Do I Get an API Key?',
  'It exposes no mass unfollow body or bulk unfollow feature.',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_UNFOLLOW_TWITTER_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Unfollow API for Following Cleanup"',
  '## Review a Following-Cleanup Batch',
] as const;

const REQUIRED_REMOVE_FOLLOWER_API_SNIPPETS = [
  'title: "How Do You Remove a Twitter Follower? Xquik API"',
  '"how do you remove a Twitter follower"',
  '"how to remove followers on Twitter"',
  '"how do you remove a follower from Twitter"',
  '[manual follower removal](https://help.x.com/en/using-x/following-faqs)',
  '**20 requests per minute** and **400 per day**',
  '**120 requests per minute**',
  'const removalReceipt = await response.json();',
  'removal_receipt = response.json()',
  'var removalReceipt map[string]interface{}',
  '## Resolve the Follower and Connected Account',
  '## Remove Followers on Twitter Safely',
  '## Poll and Verify the Removal',
  '## Choose Remove Follower, Unfollow, or Block',
  '## Review Bots, Private Accounts, and Bulk Queues',
  '## Handle Remove Follower API Errors',
  '## Twitter Follower Removal Questions',
  '### How to Remove Followers on Twitter with an API?',
  '### How Do You Remove a Follower from Twitter Without Blocking?',
  '### Can I Remove All Followers or Bot Followers at Once?',
  '### Does X Notify a Removed Follower?',
  'This route accepts 1 follower ID per request.',
  'This endpoint lets you remove a follower without blocking them.',
  '<ParamField header="Authorization" type="string">',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_REMOVE_FOLLOWER_API_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'Session cookie authentication is also supported.',
  'title: "Twitter Follower Removal API & Account Control"',
  '## Remove one follower intentionally',
  '| Follower removal record | Request or response source | Moderation rule |',
] as const;

const FORBIDDEN_PUBLIC_TWEET_MEDIA_ID_SNIPPETS = [
  'Pass returned `mediaId` in the `media` array on `POST /x/tweets`',
  'Pass `mediaId` to `POST /x/tweets`',
  'Pass uploaded `mediaId` values in `media`',
  'Use uploaded media IDs for tweet media',
  'Use `mediaId` for tweet and reply `media` arrays.',
  'Store `mediaId` for tweet and reply attachments.',
  '"media": ["1893726451023847424"]',
  '"media": ["<mediaId>"]',
  'For tweets or replies, call `POST /api/v1/x/tweets` with uploaded media IDs',
] as const;

const FORBIDDEN_PUBLIC_DM_REPLY_FIELD_EXAMPLES = [
  '"reply_to_message_id": "',
  'reply_to_message_id: "',
  'reply_to_message_id="',
  'replyToMessageId: "',
  '.replyToMessageId(',
  '--reply-to-message-id "',
  '--reply-to-message-id=',
] as const;

const REQUIRED_WRITE_ACTION_STATUS_API_SNIPPETS = [
  'title: "Twitter API Errors & X Write Action Status"',
  '"Twitter API error handling"',
  'Every X write returns a durable `x_write_action` record.',
  'Trust `terminal`, `safeToRetry`, and `nextAction`.',
  '## Handle Twitter API Errors',
  'Use this endpoint for Twitter API error handling after an Xquik write.',
  '[response codes and errors](https://docs.x.com/x-api/fundamentals/response-codes-and-errors)',
  'An error message does not prove that a write failed.',
  '## Agent Algorithm',
  'Generate one unique `Idempotency-Key` for the intended write.',
  'Store `id`, `request.hash`, `account`, `target`, `billing`, and `statusUrl`.',
  'When `terminal` is `false`, wait for `Retry-After` or `pollAfterMs`.',
  'Poll `statusUrl` until `terminal` is `true`.',
  'Record `result` and settled `billing`.',
  'Retry only when `safeToRetry` is `true`, using a new key.',
  'When `nextAction.type` is `verify_result`, verify the external state first.',
  '## Lifecycle',
  '| `accepted` | No | Poll. Dispatch has not completed. |',
  '| `dispatching` | No | Poll. Do not submit another write. |',
  '| `pending_confirmation` | No | Poll. The write may already exist. |',
  '| `success` | Yes | Store the result and settled billing. |',
  '| `failed` | Yes | Follow `safeToRetry` and `nextAction`. |',
  '| `expired` | Yes | Verify the result when dispatch may have occurred. |',
  'curl https://xquik.com/api/v1/x/write-actions/42',
  'const action = await response.json();',
  'if (!action.terminal) {',
  'print({"delay_ms": action["pollAfterMs"], "next": action["statusUrl"]})',
  '<ParamField header="x-api-key" type="string">',
  '<ParamField header="Authorization" type="string">',
  'Send an OAuth 2.1 bearer token instead of `x-api-key`.',
  '<Tab title="401 Unauthenticated">',
  'Fix the authentication credentials. Keep the original write record.',
  '<Tab title="404 Not Found">',
  'Check the action ID and environment. Never resubmit the original write.',
  '<Tab title="429 Rate Limited">',
  'Wait for `Retry-After`. Poll the same action again. Never resend the write.',
  '<ResponseField name="request" type="object">',
  '<ResponseField name="account" type="object">',
  '<ResponseField name="target" type="object | null">',
  '<ResponseField name="billing" type="object">',
  '<ResponseField name="result" type="object | null">',
  '<ResponseField name="nextAction" type="object | null">',
  '"object": "x_write_action"',
  '"status": "pending_confirmation"',
  '"terminal": false',
  '"safeToRetry": false',
  '"statusUrl": "/api/v1/x/write-actions/42"',
  '"type": "poll"',
  '## Retry Rules',
  '`retryable: true`, `safeToRetry: false`: verify the result first.',
  '`safeToRetry: true`: request approval and retry using a new key.',
  'Idempotency replay protection remains active for at least 90 days.',
] as const;

const FORBIDDEN_WRITE_ACTION_STATUS_API_SNIPPETS = [
  'JSON.stringify(status, null, 2)',
  'console.log(status)',
  'print(status)',
  'fmt.Println(status)',
] as const;

const REQUIRED_X_ACCOUNTS_LIST_API_SNIPPETS = [
  'title: "Connected X Accounts API, Health & Write Readiness"',
  'description: "List every connected X account, read its Xquik ID and username, inspect login health, and choose whether to write, reauthenticate, wait, or retry safely."',
  'Check `accounts[].health` before scheduling writes.',
  '`temporaryIssue` is still paused by a transient cooldown.',
  '`locked` and `suspended` stay blocked until the account is fixed on X.',
  'Derived login/cookie health.',
  '`recovering`, `suspended`, or `temporaryIssue`.',
  '## Account Health',
  'Your workflow can proceed, wait, or request an operator action.',
  '<Card title="healthy" icon="circle-check">',
  'Cookies are valid. Writes can proceed.',
  '<Card title="needsReauth" icon="refresh-cw">',
  'Credentials, TOTP, email verification, passkey, or another security',
  '[reauth](/api-reference/x-accounts/reauth)',
  '<Card title="locked" icon="lock">',
  'requires account-side verification',
  '<Card title="suspended" icon="circle-x">',
  'Writes stay paused until the account',
  '<Card title="recovering" icon="activity">',
  'The account can reconnect on its next use.',
  '<Card title="temporaryIssue" icon="triangle-alert">',
  '[bulk retry](/api-reference/x-accounts/bulk-retry)',
] as const;

const REQUIRED_X_ACCOUNTS_CONNECT_TOTP_SNIPPETS = [
  'description: "Connect an X account with username, password, and its saved Authenticator App TOTP secret for durable tweet, reply, DM, and profile actions. See costs."',
  'Authenticator App 2FA and `totp_secret` are required for a durable Xquik',
  'Missing the key? Restart Authentication App 2FA in X to reveal a new secret.',
  "add it to your authenticator app, and finish X's 6-digit confirmation.",
  'Then send the saved long key as `totp_secret`.',
  '## 2FA secret key setup',
  'Xquik needs the authenticator app secret key, not a live 6-digit code.',
  'The key is the long base32 string X shows while you set up',
  '`JBSWY3DPEHPK3PXP`',
  '<Card title="Use the secret key" icon="key-round">',
  '<Card title="Do not use backup codes" icon="ban">',
  'the 12-character backup code, a passkey, or a security key prompt.',
  '<Card title="You saved the key" icon="clipboard-check">',
  '<Card title="2FA is on, key is missing" icon="rotate-ccw">',
  'X shows the text secret only during Authentication App setup.',
  '<Card title="2FA is not enabled" icon="shield-check">',
  'confirm the 6-digit code on X, then connect.',
  'If you did not save it, create a fresh authenticator app secret on X',
  'Turn Authentication App off.',
  'Turn Authentication App on again.',
  "choose **Can't scan the QR code?** to reveal the text secret.",
  'store it safely before leaving the setup screen.',
  'Add that key to your authenticator app if you are setting it up fresh.',
  'Finish enabling 2FA on X by entering the current 6-digit code',
  'Do not stop after copying the secret key.',
  'Passkeys and security keys cannot satisfy this flow.',
  '"error": "passkey_required"',
  'X asked for passkey verification.',
  'then connect with `totp_secret`.',
  '{ "error": "login_failed", "message": "Login failed. Check credentials and try again.", "retryAfterMs": 300000 }',
  'X rejected the submitted username, email, password, or TOTP secret.',
  'Retry with the current password and the saved Authenticator App secret key, not a 6-digit code.',
] as const;

const REQUIRED_X_ACCOUNTS_REAUTH_TOTP_SNIPPETS = [
  'description: "Restore a connected X account by reusing its saved Authenticator App TOTP secret or sending a replacement for the login challenge. See request fields."',
  'Omit `totp_secret` to reuse the saved key.',
  'Send a replacement only if X',
  'changed or rejected the saved key.',
  '## 2FA re-authentication',
  'Xquik reuses the saved TOTP secret by default.',
  'Send `totp_secret` only when',
  'Never send a 6-digit code, backup code, passkey, or security',
  'If you never saved the secret key, or X rejects the current one',
  '<CardGroup cols={1}>',
  '<Card title="Saved key still works" icon="clipboard-check">',
  'Omit `totp_secret`. Xquik reuses the encrypted key saved during connection.',
  '<Card title="Key is missing" icon="rotate-ccw">',
  'X shows the text secret only during Authentication App setup.',
  '<Card title="Key was rejected" icon="triangle-alert">',
  'Treat the old TOTP secret as stale.',
  'Turn Authentication App off, then turn it on again.',
  "choose **Can't scan the QR code?** to reveal the text secret.",
  'store it safely before leaving the setup screen.',
  'Add that key to your authenticator app if you are setting it up fresh.',
  'Finish enabling 2FA on X by entering the current 6-digit code',
  'Send the new long key in `totp_secret` when you call Xquik.',
  'If setup is abandoned before confirmation, re-authentication cannot use that key.',
  '[2FA secret key setup](/api-reference/x-accounts/connect#2fa-secret-key-setup)',
  '"error": "passkey_required"',
  'X asked for passkey verification.',
  'then re-authenticate with `totp_secret`.',
  '{ "error": "login_failed", "message": "Login failed. Check credentials and try again." }',
  'X rejected the submitted password or TOTP secret.',
  'Retry with the current password and the saved Authenticator App secret key, not a 6-digit code.',
] as const;

const REQUIRED_X_ACCOUNTS_SUBMIT_CHALLENGE_SNIPPETS = [
  'description: "Submit an email verification code for an active X account login challenge. Start a fresh connect or reauthentication when it expires. See request fields."',
  'This endpoint cannot reopen an expired, failed, completed, or replaced challenge.',
  'After `409`, `410`, or `422`, start [Connect X Account](/api-reference/x-accounts/connect) again for a new account.',
  'For an existing account, use [Re-authenticate X Account](/api-reference/x-accounts/reauth)',
  'with the current password and any required TOTP secret key.',
  '## Continue the pending login',
  '<CardGroup cols={1}>',
  '<Card title="Use the returned challenge ID" icon="ticket-check">',
  'The challenge belongs to the same pending login attempt.',
  '<Card title="Enter the account email code" icon="mail-check">',
  'Use the one-time code X sent to the account email inbox.',
  'Xquik strips spaces before submission',
  '<Card title="Handle another code prompt" icon="refresh-cw">',
  'If X asks for a new email code, this endpoint returns `202` again.',
  '<Card title="Start over when stale" icon="timer-reset">',
  '`410` means the code expired.',
  '`409` means the challenge was already completed, failed, expired, or replaced.',
  'Start [Connect X Account](/api-reference/x-accounts/connect) again for a new account',
  'use [Re-authenticate X Account](/api-reference/x-accounts/reauth) for an existing account.',
  'The dashboard follows the same flow',
] as const;

const REQUIRED_X_ACCOUNTS_BULK_RETRY_SNIPPETS = [
  'description: "Clear only temporary login failures; use re-authentication or X-side fixes for credentials, TOTP, passkeys, locked, or suspended accounts. See fields."',
  'Bulk retry only clears `transient` and `automated` login-failure states.',
  'It does not update passwords, TOTP secret keys, passkeys, email challenges, locked accounts, or suspended accounts.',
  'Use re-authentication or reconnect for credential and 2FA fixes',
  'resolve locks or suspensions on X first.',
  '## What gets retried',
  '<CardGroup cols={1}>',
  '<Card title="Temporary issues are cleared" icon="refresh-cw">',
  'stored failure reason is `transient` or `automated`',
  'eligible to reconnect on their next use.',
  '<Card title="Credential fixes are skipped" icon="key-round">',
  'Accounts that need fresh credentials or a security challenge stay unchanged.',
  '[Re-authenticate](/api-reference/x-accounts/reauth)',
  '<Card title="X restrictions stay blocked" icon="shield-alert">',
  'Locked and suspended accounts stay unchanged.',
  '<Card title="Response is an aggregate" icon="list-checks">',
  'The API returns only `cleared`',
  'Call [List X Accounts](/api-reference/x-accounts/list) before and after',
  'The dashboard button follows the same model',
  'It does not reconnect the accounts immediately.',
] as const;

const REQUIRED_X_ACCOUNTS_GET_STATE_SNIPPETS = [
  'Check a connected X account before tweets, replies, DMs, likes, follows, or profile updates.',
  'Read `health` first.',
  'Use `recovering` on the next action.',
  'Wait or bulk retry `temporaryIssue`.',
  'Re-authenticate `needsReauth`.',
  'Fix `locked` or `suspended` on X before retrying writes.',
  '## Read the account state',
  '<CardGroup cols={1}>',
  '<Card title="Ready for actions" icon="circle-check">',
  '`health: "healthy"` means the stored session is usable.',
  '`cookiesObtainedAt` shows when the session was last obtained',
  '<Card title="Needs credentials" icon="key-round">',
  '`health: "needsReauth"` means credentials, TOTP, email verification, passkey, or another security challenge blocked login.',
  'with current credentials and a valid TOTP secret before retrying writes.',
  '[Re-authenticate](/api-reference/x-accounts/reauth)',
  '<Card title="Temporary recovery" icon="refresh-cw">',
  '`health: "temporaryIssue"` means a transient or automated cooldown is still active.',
  'use [Bulk retry](/api-reference/x-accounts/bulk-retry) for temporary failures.',
  '`health: "recovering"` means the account can reconnect on its next use.',
  '<Card title="X restriction" icon="shield-alert">',
  '`health: "locked"` or `health: "suspended"` means writes stay blocked until the account is fixed on X.',
] as const;

const X_ACCOUNT_PUBLIC_CONTRACT_FILES = [
  'api-reference/x-accounts/connect.mdx',
  'api-reference/x-accounts/connection-attempt.mdx',
  'api-reference/x-accounts/get.mdx',
  'api-reference/x-accounts/list.mdx',
  'api-reference/x-accounts/reauth.mdx',
  'api-reference/x-accounts/submit-challenge.mdx',
  'guides/rate-limits.mdx',
  'openapi.yaml',
] as const;

const FORBIDDEN_X_ACCOUNT_PUBLIC_CONTRACT_SNIPPETS = [
  '`proxy_country`',
  'body="proxy_country"',
  '`proxyCountry`',
  'name="proxyCountry"',
  'accounts[].proxyCountry',
  '`loginCountry`',
  'name="loginCountry"',
  'selected `proxy_country`',
  '3 attempts per 15 minutes',
  '3 per 15 minutes',
  'Too many connection attempts. Try again in 15 minutes.',
] as const;

const REQUIRED_X_ACCOUNTS_DISCONNECT_SNIPPETS = [
  'description: "Delete the stored Xquik connection only; the X account stays unchanged, old IDs return 404, and reconnecting creates a new ID. Includes request fields."',
  'It deletes only the stored Xquik connection for that account ID.',
  'It does not change the X account itself.',
  'After success, the old Xquik account ID returns `404`; reconnect the account to get a new ID.',
  '## What disconnect does',
  '<CardGroup cols={1}>',
  '<Card title="Removes this connection" icon="trash-2">',
  'The stored connection row is removed from your Xquik account.',
  'Future `GET /x/accounts/{id}` calls for the same ID return `404`.',
  '<Card title="Stops writes immediately" icon="send">',
  'The dashboard Disconnect button uses the same endpoint',
  'new write, DM, media upload, and profile actions must choose another connected account',
  '<Card title="Keeps monitors separate" icon="radio">',
  'Account and keyword monitors are independent.',
  'does not remove monitors that track that username.',
  '<Card title="Reconnect with a new ID" icon="refresh-cw">',
  '[Connect X Account](/api-reference/x-accounts/connect)',
  'Store the new account `id` from the connect response instead of reusing the deleted ID.',
] as const;

const REQUIRED_SERVICE_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Server & service errors (500/502/503)">',
  '<Card title="x_api_rate_limited" icon="timer-reset">',
  'Read service rate limited. Retry in a few minutes.',
  '<Card title="x_api_unavailable" icon="cloud-off">',
  'Read service temporarily unavailable or busy. Respect `Retry-After`',
  'when present, otherwise retry with backoff.',
  '<Card title="x_write_ambiguous" icon="activity">',
  'Verify the result',
  'the result before sending anything again.',
  '<Card title="x_transient_error" icon="rotate-ccw">',
  'Temporary write failure. Retry only when `safeToRetry` is `true`.',
  'The read service is temporarily unavailable or busy. This is usually transient.',
  'the read service may be experiencing an outage',
] as const;

const REQUIRED_VALIDATION_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Validation errors (400)">',
  'Request body, query, or path validation failed.',
  '<Card title="invalid_input" icon="circle-alert">',
  'Check required fields, types, and enum',
  '<Card title="invalid_json" icon="file-code">',
  'send a parseable',
  '<Card title="invalid_id" icon="hash">',
  'numeric string returned by the create or',
  '<Card title="invalid_tweet_url" icon="link">',
  '`https://x.com/user/status/ID`',
  '<Card title="invalid_tweet_id" icon="message-circle">',
  'Extract the final numeric status ID',
  '<Card title="invalid_username" icon="users">',
  'username without',
  '<Card title="invalid_user_id" icon="users">',
  'Check the username or',
  '<Card title="invalid_tool_type" icon="database">',
  '[Create Extraction](/api-reference/extractions/create)',
  '<Card title="invalid_format" icon="file-text">',
  '`csv`, `json`, `md`, `md-document`,',
  '<Card title="invalid_params" icon="circle-alert">',
  'Check the `format` and `type`',
  '<Card title="missing_query" icon="search">',
  'Add the `q` parameter',
  '<Card title="missing_ids" icon="list">',
  'Provide comma-separated numeric IDs',
  '<Card title="missing_params" icon="circle-alert">',
  'checks require both source and target.',
  '<Card title="too_many_ids" icon="list">',
  'groups of 100',
  '<Card title="unsupported_field" icon="circle-x">',
  'send public media URLs in `media`, not uploaded media IDs.',
] as const;

const REQUIRED_AUTHENTICATION_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Authentication errors (401)">',
  '<Card title="unauthenticated" icon="key-round">',
  'API key or bearer token is missing or invalid.',
  'Send `x-api-key` or',
  'regenerate a revoked key.',
  '<Card title="x_auth_failure" icon="refresh-cw">',
  'Connected X account session expired or was invalidated.',
  'Re-authenticate',
  'the account from the [dashboard](https://xquik.com/dashboard).',
] as const;

const REQUIRED_BILLING_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Billing & credit errors (402)">',
  '<Card title="no_subscription" icon="badge-x">',
  '[subscribe](/api-reference/account/subscription-checkout)',
  '<Card title="subscription_inactive" icon="badge-alert">',
  'Remaining credits work.',
  '<Card title="payment_failed" icon="credit-card">',
  'Update the payment method from the',
  '<Card title="no_credits" icon="coins">',
  'No credit balance is available.',
  '<Card title="insufficient_credits" icon="wallet-cards">',
  'Balance is below the required operation cost.',
  '[Top Up Credits](/api-reference/credits/topup)',
] as const;

const REQUIRED_PERMISSION_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Permission errors (403)">',
  '<Card title="api_key_limit_reached" icon="key-round">',
  'The account already has 100 active API keys.',
  '<Card title="dm_not_permitted" icon="message-circle">',
  'DM history requires a connected account that participates in the',
  '<Card title="account_needs_reauth" icon="refresh-cw">',
  'Connected X account session needs re-authentication.',
  '<Card title="account_restricted" icon="shield-alert">',
  'Resolve account health on x.com or wait before retrying.',
] as const;

const REQUIRED_NOT_FOUND_ERROR_GUIDE_SNIPPETS = [
  '<Card title="404 missing resource" icon="search-x">',
  '`account_not_found`, `user_not_found`, `tweet_not_found`, `no_media`,',
  '<Accordion title="Not found errors (404)">',
  'is not the expected X object type.',
  '<Card title="not_found" icon="search-x">',
  'Verify the ID belongs to your account',
  '<Card title="account_not_found" icon="users">',
  '[List X Accounts](/api-reference/x-accounts/list)',
  '<Card title="user_not_found" icon="users">',
  'does not resolve. Confirm the username',
  '<Card title="tweet_not_found" icon="message-circle">',
  'Check the numeric tweet ID',
  '<Card title="no_media" icon="image">',
  'no downloadable media attachments.',
  '<Card title="article_not_found" icon="file-text">',
  'not an X Article.',
  '<Card title="draft_not_found" icon="file-text">',
  'Verify the draft ID',
  '<Card title="style_not_found" icon="pen-line">',
  '[Analyze Style](/api-reference/styles/analyze)',
  '<Card title="no_cached_style" icon="pen-line">',
  'No cached writing style exists for username lookup.',
] as const;

const REQUIRED_CONFLICT_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Conflict errors (409)">',
  'handoff to the existing monitor instead of retrying creation.',
  '<Card title="monitor_already_exists" icon="copy-check">',
  'Duplicate account or keyword monitor.',
  '[Update Monitor](/api-reference/monitors/update)',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
] as const;

const REQUIRED_RATE_LIMIT_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Rate limit errors (429)">',
  '<Card title="rate_limit_exceeded" icon="timer">',
  'Wait the `Retry-After` seconds',
  'JSON also includes `retryAfter` when available.',
  '<Card title="login_cooldown" icon="clock">',
  'Wait `retryAfterMs` or the',
  '`Retry-After` header before reconnecting or reauthenticating.',
  '<Card title="x_rate_limited" icon="gauge">',
  'Follow `Retry-After`, then retry with backoff.',
  '<Card title="x_daily_limit" icon="calendar-x">',
  'Connected X account reached its daily posting limit.',
] as const;

const REQUIRED_WRITE_VALIDATION_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Validation errors (422)">',
  'Write validation failed. Change the account, target, content, DM',
  '<Card title="x_account_feature_required" icon="lock-keyhole">',
  'Use an account with the required',
  '<Card title="x_account_suspended" icon="shield-alert">',
  'Resolve account status',
  '<Card title="x_account_protected" icon="lock">',
  'Target account is protected.',
  '<Card title="x_duplicate_action" icon="copy-check">',
  'Do not retry unchanged; check the target',
  '<Card title="x_dm_not_allowed" icon="message-circle">',
  'Recipient does not accept DMs from this account.',
  '<Card title="x_target_not_found" icon="search-x">',
  'Verify the ID or username before',
  '<Card title="x_content_too_long" icon="message-circle-warning">',
  'Content exceeds the character limit.',
  '<Card title="x_rejected" icon="circle-x">',
  'Retry only when the durable action marks it safe.',
  '<Card title="media_download_failed" icon="image">',
  'Fix the HTTPS URL or pass the',
  'file via multipart/form-data. Do not retry the same URL.',
] as const;

const FORBIDDEN_ERROR_HANDLING_SNIPPETS = [
  'Error recovery patterns for X API writes, pending tweet confirmation, billing, retries, and rate limits',
  'Every Xquik API error returns a consistent JSON body with an `error` code.',
  'Use these codes to build reliable integrations with automatic recovery.',
  'Recover from Xquik API errors, billing failures, retries & rate limits',
  'Every Xquik API error includes an `error` code.',
  'Use it to choose the right recovery path.',
  '| Code | HTTP | Retryable | Quick fix |',
  '| Signal | Value |',
  '|--------|-------|',
  '| `x_write_unconfirmed` | Action may have been completed but could not be confirmed |',
  'Add a monitor addon from the dashboard.',
  'Delete a monitor or add capacity ($5/month).',
  'add capacity ($5/month per extra monitor)',
  '`no_addon`',
  '`monitor_limit_reached`',
  'X data source',
  'Server & upstream errors',
  'Upstream timeout or temporary failure',
  '`x_transient_error` | Read service timeout or temporary failure',
  '| `x_api_rate_limited` | Read service rate limited | Retry in a few minutes.',
  '| `x_transient_error` | Write service timeout or temporary failure |',
  '| `unauthenticated` | Missing or invalid API key |',
  '| `x_auth_failure` | X account session expired or invalid |',
  '| `no_subscription` | No active subscription |',
  '| `subscription_inactive` | Subscription is not active |',
  '| `no_addon` | Legacy monitor add-on state |',
  '| `payment_failed` | Payment processing failed |',
  '| `no_credits` | No credits available |',
  '| `insufficient_credits` | Not enough credits for this operation |',
  '| `api_key_limit_reached` | API key limit reached (100 max) |',
  '| `monitor_limit_reached` | Legacy monitor slot limit reached |',
  '| `account_needs_reauth` | Connected X account needs re-authentication |',
  '| `account_restricted` | Connected X account is restricted',
  '| `rate_limit_exceeded` | API rate limited |',
  '| `login_cooldown` | X account is on login cooldown after a flagged attempt |',
  '| `x_rate_limited` | X rate-limited the write request |',
  '| `x_daily_limit` | X account reached daily posting limit |',
  '| `x_account_feature_required` | X Premium required for this action |',
  '| `x_account_suspended` | X account suspended or restricted |',
  '| `x_account_protected` | Target account is',
  '| `x_duplicate_action` | Action already performed',
  '| `x_dm_not_allowed` | Recipient does not accept DMs from this account |',
  '| `x_target_not_found` | Tweet or user target does not exist |',
  '| `x_content_too_long` | Tweet exceeds character limit |',
  '| `x_rejected` | X rejected the write with an unknown reason |',
  '| `media_download_failed` | Failed to download media from URL',
  '| `invalid_input` | Request body failed validation |',
  '| `invalid_json` | Request body contains invalid JSON |',
  '| `invalid_id` | Path parameter is not a valid ID |',
  '| `invalid_tweet_url` | Tweet URL format is invalid |',
  '| `invalid_tweet_id` | Tweet ID is empty or invalid |',
  '| `invalid_username` | X username is empty or invalid |',
  '| `invalid_user_id` | User not found or invalid user ID |',
  '| `invalid_tool_type` | Extraction tool type not recognized |',
  '| `invalid_format` | Export format is not supported |',
  '| `invalid_params` | Export query parameters are invalid |',
  '| `missing_query` | Required query parameter is missing |',
  '| `missing_ids` | Required multi-ID query parameter is missing |',
  '| `missing_params` | Required query parameters are missing |',
  '| `too_many_ids` | Too many IDs were requested at once |',
  '| `webhook_inactive` | Webhook is disabled |',
  '| `unsupported_field` | Request body contains a field the endpoint does not accept',
  '| `not_found` | Resource does not exist |',
  '| `user_not_found` | X user not found |',
  '| `tweet_not_found` | Tweet not found |',
  '| `no_media` | Tweet has no downloadable media |',
  '| `article_not_found` | Tweet has no linked article |',
  '| `draft_not_found` | Draft does not exist |',
  '| `style_not_found` | No cached writing style |',
  '| `no_cached_style` | No cached writing style for username lookup |',
  '| `monitor_already_exists` | Duplicate monitor for this X account |',
  'data source may be experiencing an outage',
] as const;

const REQUIRED_CRM_EXPORT_WORKFLOW_SNIPPETS = [
  'title: "Twitter Follower Scraper: Export Twitter Followers"',
  'follower_explorer',
  'Use it as a Twitter follower tracker for repeatable account snapshots.',
  'A private account does not make its followers public.',
  'Do not infer inactive',
  'accounts from missing pages or unchanged follower counts.',
  'Call the result a full list only when pagination ends normally.',
  '## Twitter Follower Export Questions',
  '### Download Follower List Twitter',
  '### Export Twitter Followers API',
  '### What API Can I Use to Get Someone’s Twitter Followers?',
  '### How Do I Export All Followers of a Twitter Account?',
  'Label exports with fewer profiles as bounded.',
  '### Twitter Followers Scraper',
  '## Choose the right path',
  '`GET /x/users/{id}/followers?pageSize=200&cursor={next_cursor}`',
  '[CLI](/sdks/cli)',
  '[TypeScript](/sdks/typescript)',
  '[Python](/sdks/python)',
  '[Go SDK](/sdks/go)',
  'resultsLimit',
  'Call `GET /extractions/{id}/export?format=csv`, `format=json`, or `format=xlsx`',
  '`md`, `md-document`, `pdf`, and `txt` are also supported',
  '## End-to-end follower export handoff',
  '"workflow": "follower_export_crm"',
  '"request": {',
  '"targetUsername": "elonmusk"',
  '"estimate": {',
  '"estimatedResults": 10000',
  '"creditsRequired": "10000"',
  '"creditsAvailable": "77000"',
  '"allowed": true',
  '"source": "resultsLimit"',
  '"resolvedXUserId": "44196397"',
  '"create_receipt": {',
  '"poll_path": "/api/v1/extractions/77777"',
  '"json_pages": {',
  '"page_cursor": null',
  '"next_cursor": "1001"',
  '"has_more": true',
  '"export_paths": {',
  '"normalized_row": {',
  '"account_created_at": "2021-03-01T12:00:00.000Z"',
  '"crm_import": {',
  '"unique_field": "x_user_id"',
  '"upsert_mode": "external_id"',
  '"file_path": "x-followers-elonmusk.csv"',
  '"handoff_state": "poll_until_completed_then_export"',
  '<Card title="Estimate checkpoint" icon="calculator">',
  '<Card title="Job checkpoint" icon="clipboard-check">',
  '<Card title="Cursor checkpoint" icon="shuffle">',
  '<Card title="CRM checkpoint" icon="database">',
  '`source` is `followers` unless',
  '`resultsLimit` is lower than the follower count',
  'When the account has fewer followers',
  'the estimate keeps `source: "followers"`',
  '### Paginated JSON handoff',
  'Every result guarantees `id` and',
  '`xUserId`. The API omits optional profile and enrichment fields when absent.',
  '"toolType": "follower_explorer"',
  '"hasMore": true',
  '"nextCursor": "1001"',
  'Use `limit` up to `1000`.',
  'Pass `nextCursor` as `after` until `hasMore` becomes',
  'import { writeFile } from "node:fs/promises";',
  'const exportFilePath = "x-followers-elonmusk.csv";',
  'export_format: "csv",',
  'throw new Error(`Export failed with ${response.status}`);',
  'const bytes = Buffer.from(await response.arrayBuffer());',
  'await writeFile(exportFilePath, bytes);',
  'const exportHandoff = {',
  'export_file_path: exportFilePath',
  'content_disposition: response.headers.get("Content-Disposition") ?? ""',
  'export_file_path = "x-followers-elonmusk.csv"',
  'response.raise_for_status()',
  'Use the local `-o` path, `exportFilePath`, or `export_file_path` as the durable',
  '"job": "follower_export_file"',
  '"export_file_path": "x-followers-elonmusk.csv"',
  'const extractionHandoff = {',
  'extraction_id: job.id',
  'status: job.status',
  'source_username: "elonmusk"',
  'results_limit: 10000',
  'handoff_created_at: new Date().toISOString()',
  'Store `extractionHandoff` in your job table',
  'Poll by `extraction_id`',
  '"status": "running"',
  '<Card title="Stable account key" icon="fingerprint">',
  '`xUserId` to `x_user_id`',
  '`User ID` to `x_user_id`',
  '<Card title="Audience metrics" icon="chart-no-axes-column">',
  '`Following` to `following_count`',
  '`Posts` to `posts_count`',
  '<Card title="Profile media" icon="image">',
  '`Cover Picture` to a banner URL field',
  '"job": "follower_export"',
  '"source_username": "elonmusk"',
  '`xquik-follower-export.jsonl`',
  'title="Followers API"',
  'href="/api-reference/x/followers"',
  '### Live follower page handoff',
  'CRM enrichment job, queue worker, audience sync, or agent',
  'GET /x/users/{id}/followers',
  'pageSize=200&cursor=DAACCgACGRElMJcAAA',
  '`users`, `has_next_page`, and `next_cursor`',
  'Treat `next_cursor` as opaque',
  '`users[].id` to `x_user_id`',
  '`users[].username` to `x_username`',
  '`users[].createdAt` to `account_created_at`',
  '`statusesCount`',
  '`pageSize` accepts `20` to `200`',
  'paid calls can return fewer users',
  '`402 insufficient_credits`',
  'lower `pageSize` or add credits',
  '"page_checkpoint": "44196397:DAACCgACGE..."',
  'Never treat `cursor` as a stable follower ID',
  'x_user_id',
  'HubSpot',
  'Salesforce Bulk API 2.0',
] as const;

const REQUIRED_TWEET_REPLIES_EXPORT_SNIPPETS = [
  'scrape tweet replies',
  '`reply_extractor`',
  'POST /extractions/estimate',
  'POST /extractions',
  'GET /extractions/{id}',
  '`GET /extractions/{id}` returns `job`, `results`, `hasMore`, and `nextCursor`',
  'Use `limit` up to 1,000 and pass `nextCursor` as `after`',
  'format=csv',
  'format=xlsx',
  'format=json',
  'CSV, JSON, or XLSX',
  '## End-to-end reply export handoff',
  '"workflow": "reply_export"',
  '"request": {',
  '"targetTweetId": "1893704267862470862"',
  '"estimate": {',
  '"estimatedResults": 1200',
  '"creditsRequired": "1200"',
  '"creditsAvailable": "77000"',
  '"allowed": true',
  '"source": "replyCount"',
  '"create_receipt": {',
  '"poll_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"json_pages": {',
  '"page_cursor": null',
  '"next_cursor": "990200"',
  '"has_more": true',
  '"export_paths": {',
  '"normalized_row": {',
  '"parent_tweet_id": "1893704267862470862"',
  '"reply_tweet_id": "1893710452812718080"',
  '"reply_author_id": "44196397"',
  '"reply_author_username": "username"',
  '"handoff_state": "poll_until_completed_then_export"',
  '<Card title="Estimate checkpoint" icon="calculator">',
  '<Card title="Job checkpoint" icon="clipboard-check">',
  '<Card title="Cursor checkpoint" icon="shuffle">',
  '<Card title="Export checkpoint" icon="download">',
  '`source` is `replyCount` when the tweet',
  'count lookup succeeds',
  "The estimate uses the tweet's current `replyCount`",
  'Set `resultsLimit` on the create request',
  'when you want a smaller sample or hard run cap',
  '"job": "reply_extraction"',
  '"reply_extraction_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"target_tweet_id": "1893704267862470862"',
  '"results_limit": 500',
  '"handoff_created_at": "2026-05-16T03:07:00.000Z"',
  'Poll by `reply_extraction_id`',
  'Do not wait for `totalResults` or `createdAt` in the create response',
  'those fields arrive from `GET /extractions/{id}`',
  'Poll `GET /extractions/{id}` until the job is `completed` or `failed`.',
  'Save `xquik-replies.jsonl` for queue replay or warehouse loads, `xquik-replies.json` for app ingestion, `xquik-replies.csv` for CRM import, and `xquik-replies.xlsx` for analyst handoff.',
  '### Saved export JSON Lines handoff',
  '-o xquik-replies.csv',
  '-o xquik-replies.xlsx',
  '-o xquik-replies.json',
  '`xquik-replies.jsonl`',
  'job: "reply_export"',
  'extraction_id: $extraction_id',
  'reply_author_id: .xUserId',
  'handoff_format: "jsonl"',
  '## Copy-ready workflow: replies to moderation queue',
  '`reply_tweet_id`',
  '`reply_author_username`',
  '`reply_author_followers`',
  '`reply_author_verified`',
  '`reply_author_profile_picture`',
  '`conversation_id`',
  '`handoff_source`',
  '`parent_tweet_id`',
  '`bookmark_count`',
  '`is_note_tweet`',
  '`tweet_source`',
  '`media_urls`',
  '`next_cursor`',
  'Use `sinceTime` and `untilTime` as Unix timestamps in seconds',
  '--data-urlencode "sinceTime=1777392000"',
  '--data-urlencode "untilTime=1777478400"',
  'handoff_source: "xquik.replies.direct"',
  'parent_tweet_id: tweetId',
  'reply_author_name: tweet.author?.name ?? null',
  'reply_author_followers: tweet.author?.followers ?? null',
  'reply_author_verified: tweet.author?.verified ?? null',
  'reply_author_profile_picture: tweet.author?.profilePicture ?? null',
  'retweet_count: tweet.retweetCount ?? 0',
  'bookmark_count: tweet.bookmarkCount ?? 0',
  'is_note_tweet: tweet.isNoteTweet ?? false',
  'tweet_source: tweet.source ?? null',
  'page_index: pageIndex',
  'page_cursor: cursor ?? ""',
  'next_cursor: page.next_cursor',
  'has_next_page: page.has_next_page',
  'process.stdout.write(JSON.stringify(row) + "\\n");',
  'Use extraction jobs for saved files, credit estimates, or fixed `resultsLimit` caps.',
  '## Choose the right reply output',
  'Store each reply tweet ID and remove duplicate IDs downstream.',
  'Never advance the checkpoint before storing its reply rows.',
  'Preserve author IDs separately from usernames because usernames can change.',
  '## Related reply APIs',
  '[Fetch live tweet reply pages](/api-reference/x/tweet-replies)',
  '`resultsLimit`',
  'Estimate is free.',
  'File exports do not charge credits after job creation.',
  'Export `format=csv` to `xquik-replies.csv` or `format=xlsx` to `xquik-replies.xlsx`.',
  'Export `format=json` to `xquik-replies.json`, convert it to `xquik-replies.jsonl`, or paginate `GET /extractions/{id}`.',
  'Set `resultsLimit` on create calls when you need a smaller run.',
  '1 credit per tweet returned',
  'Status `400`. Error `invalid_tweet_id`.',
  'Status `402`. Errors `no_subscription`, `subscription_inactive`, `no_credits`, or `insufficient_credits`.',
  'Status `429`. Error `rate_limit_exceeded`.',
  'Status `424` or `502`. Error `x_api_unavailable`.',
] as const;

const REQUIRED_TWEET_REPLIES_API_HANDOFF_SNIPPETS = [
  'title: "Twitter API Get Replies to a Tweet & Author Fields"',
  'Get tweet replies returns reply tweets for one X post by numeric tweet ID.',
  'conversation analysis, support queues, moderation review, giveaway',
  '`GET /api/v1/x/tweets/{id}/replies`',
  '# First page of replies',
  '# Resume with the previous next_cursor',
  '--data-urlencode "cursor=DAACCgACGE..."',
  '# Bound a campaign or moderation window',
  '--data-urlencode "sinceTime=1777392000"',
  '--data-urlencode "untilTime=1777478400"',
  '## Direct Replies Handoff',
  '`GET /x/tweets/{id}/replies`',
  'let pageCursor = "";',
  'for (let pageCount = 0; pageCount < 3; pageCount += 1) {',
  'const replyRows = page.tweets.map((reply) => ({',
  'parent_tweet_id: tweetId',
  'reply_id: reply.id',
  'text: reply.text',
  'author_id: reply.author?.id ?? null',
  'author_username: reply.author?.username ?? null',
  'created_at: reply.createdAt ?? null',
  'in_reply_to_id: reply.inReplyToId ?? null',
  'conversation_id: reply.conversationId ?? null',
  'like_count: reply.likeCount ?? null',
  'media_urls: (reply.media ?? []).map((item) => item.mediaUrl).filter(Boolean)',
  'page_index: pageCount',
  'page_cursor: pageCursor',
  'next_cursor: page.next_cursor',
  'has_next_page: page.has_next_page',
  'if (!page.has_next_page || page.next_cursor === "") break;',
  'for (const row of replyRows) process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'page_cursor = ""',
  'for page_index in range(3):',
  '"parent_tweet_id": tweet_id',
  '"reply_id": reply["id"]',
  '"text": reply["text"]',
  '"author_id": (reply.get("author") or {}).get("id")',
  '"author_username": (reply.get("author") or {}).get("username")',
  '"created_at": reply.get("createdAt")',
  '"in_reply_to_id": reply.get("inReplyToId")',
  '"conversation_id": reply.get("conversationId")',
  '"like_count": reply.get("likeCount")',
  '"media_urls": [',
  '"page_index": page_index',
  '"page_cursor": page_cursor',
  '"next_cursor": page["next_cursor"]',
  '"has_next_page": page["has_next_page"]',
  'if not page["has_next_page"] or not page["next_cursor"]:',
  'print(json.dumps(reply_row, separators=(",", ":")))',
  'support, community, moderation,',
  'The examples above write',
  'JSON Lines rows with `parent_tweet_id`, `reply_id`, `text`, author IDs and',
  '`reply_extractor`',
  '| `reply_id` | `tweets[].id` |',
  '| `author_id` | `tweets[].author.id` |',
  '| `author_followers` | `tweets[].author.followers` |',
  '| `in_reply_to_id` | `tweets[].inReplyToId` |',
  '| Page identity | `page_index` and `page_cursor` |',
  'Use [`reply_extractor`](/guides/tweet-replies-export) instead when a team needs',
  'an estimate, durable extraction ID, stored result pages, or CSV, JSON, and XLSX',
  '<Card title="Live reply page" icon="message-square-reply">',
  'Call `GET /x/tweets/{id}/replies` when queues, agents, or dashboards need',
  'current JSON rows and can store `next_cursor`.',
  '<Card title="Saved reply export" icon="archive">',
  'Run `reply_extractor` for estimates, job status, stored pages, and',
  'downloadable reply files.',
  '`sinceTime` and `untilTime` are Unix timestamps in seconds',
  'Direct replies calls use the default paid page size',
  'Tweet author profile. Omitted if unavailable.',
  '<Expandable title="Author object fields">',
  '<ResponseField name="id" type="string">Author user ID.',
  '<ResponseField name="username" type="string">Author handle without `@`.',
  '<ResponseField name="name" type="string">Author display name.',
  '<ResponseField name="followers" type="number">This value records the author\'s follower count when available.',
  '<ResponseField name="verified" type="boolean">Whether the author is verified.',
  '<ResponseField name="profilePicture" type="string">Author profile image URL.',
  '`resultsLimit`',
  '[Tweet Replies Export Workflow](/guides/tweet-replies-export)',
  'saved CSV, JSON, or XLSX files',
  '1 credit per tweet returned',
  '`402 insufficient_credits`',
  '`Retry-After`',
  '`mode=complete`',
  '`diagnostic.complete`',
  'These optional filters apply only in standard mode.',
  'Remove every filter before requesting complete mode.',
  '## Which replies endpoint?',
  'Use `GET /api/v1/x/tweets/{id}/replies` for one tweet\'s replies as JSON rows.',
  'Use [`reply_extractor`](/guides/tweet-replies-export) when you need saved CSV, JSON, or XLSX exports.',
  'Use `GET /api/v1/x/tweets/search` when you need keyword, operator, structured-filter, or `queryType` search.',
  'Use `GET /api/v1/x/tweets/{id}/thread` when you need ordered thread context around a tweet.',
  'Opaque cursor for standard mode.',
  'Pair with',
  '`sinceTime` for closed campaign, support, or audit windows.',
] as const;

const FORBIDDEN_TWEET_REPLIES_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'const data = await response.json();',
  'data = response.json()',
  'process.stdout.write(JSON.stringify(replyRows, null, 2));',
  'print(json.dumps(reply_rows, indent=2))',
] as const;

const REQUIRED_TWEET_QUOTES_API_HANDOFF_SNIPPETS = [
  'title: "View Quote Tweets With Twitter API & Author Fields"',
  '## Quote Tweet Questions',
  '### What Are Quote Tweets?',
  '### How Does a Twitter API View Quote Tweets?',
  '### Why Are Some Quote Tweets Not Showing?',
  'https://docs.x.com/x-api/posts/quote-tweets/introduction',
  '## Direct quote tweet handoff',
  '`GET /x/tweets/{id}/quotes`',
  '`GET /api/v1/x/tweets/{id}/quotes`',
  'quote tweets API',
  'tweet quotes API',
  'Use this Twitter API to view quote tweets',
  '```bash First page',
  '```bash Next page with filters',
  '--data-urlencode "includeReplies=false"',
  '--data-urlencode "verifiedOnly=true"',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const quoteRows = data.tweets.map((tweet) => ({',
  'quoted_tweet_id: tweetId',
  'quote_id: tweet.id',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'quote_count: tweet.quoteCount ?? null',
  'media_urls: tweet.media?.map((item) => item.mediaUrl).filter(Boolean) ?? []',
  'const checkpoint = { quoted_tweet_id: tweetId, next_cursor: nextCursor };',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  '"quoted_tweet_id": tweet_id',
  '"quote_id": tweet["id"]',
  '"author_id": (tweet.get("author") or {}).get("id")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"quote_count": tweet.get("quoteCount")',
  '"media_urls": [',
  'checkpoint = {"quoted_tweet_id": tweet_id, "next_cursor": next_cursor}',
  'print(json.dumps({"checkpoint": checkpoint}))',
  'support, campaign, moderation,',
  'for every quote tweet in the response',
  'Store `quoted_tweet_id`, `quote_id`,',
  '`author_id`, `author_username`, `author_name`, `author_followers`,',
  '`author_verified`, `author_profile_picture`,',
  '<Card title="Quote rows" icon="quote">',
  '<Card title="Window filters" icon="calendar-range">',
  '## Which tweet engagement endpoint?',
  '[`GET /x/tweets/{id}/replies`](/api-reference/x/tweet-replies)',
  '[`GET /x/tweets/{id}/retweeters`](/api-reference/x/retweeters)',
  '[`GET /x/tweets/{id}/favoriters`](/api-reference/x/favoriters)',
  '`toolType=quote_extractor`',
  '## Historical pages vs live quote alerts',
  '<Card title="Historical quote pull" icon="clock-arrow-down">',
  '[`POST /monitors`](/api-reference/monitors/create)',
  '`eventTypes: ["tweet.quote"]`',
  '[`POST /monitors/keywords`](/api-reference/monitors/create-keyword)',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`GET /events`](/api-reference/events/list)',
  'Tweet author profile. Omitted if unavailable.',
  '**Author object fields:**',
  '<ResponseField name="id" type="string">Author user ID.',
  '<ResponseField name="username" type="string">Author handle without `@`.',
  '<ResponseField name="name" type="string">Author display name.',
  '<ResponseField name="followers" type="number">This value records the author\'s follower count when available.',
  '<ResponseField name="verified" type="boolean">Whether the author is verified.',
  '<ResponseField name="profilePicture" type="string">Author profile image URL.',
  '`sinceTime`, `untilTime`, `includeReplies`, and tweet result',
  'filters to bound the quote set',
] as const;

const FORBIDDEN_TWEET_QUOTES_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'console.log(data.tweets);',
  'print(data)',
  'process.stdout.write(JSON.stringify(quoteRows, null, 2));',
  'print(json.dumps(quote_rows, indent=2))',
] as const;

const REQUIRED_GET_TWEET_API_HANDOFF_SNIPPETS = [
  'title: "Tweet Lookup API, Post Details & Engagement Counts"',
  '`GET /x/tweets/{id}`',
  '`GET /api/v1/x/tweets/{id}`',
  'tweet lookup API',
  'single tweet API',
  'tweet info API',
  'Pass a 15 to 20 digit numeric tweet ID in the path.',
  'extract the final status ID first',
  'call [`Search tweets`](/api-reference/x/search-tweets) with the URL in `q`',
  'omit `cursor`, `sinceTime`, and `untilTime`',
  '`400 invalid_tweet_id`',
  'Note Tweet text, source, and media URLs',
  'const tweet = data.tweet;',
  'const author = data.author ?? {};',
  'const media = tweet.media ?? [];',
  'const quotedTweet = tweet.quoted_tweet;',
  'tweet_id: tweet.id',
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_followers: author.followers ?? null',
  'author_verified: author.verified ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'created_at: tweet.createdAt ?? null',
  'conversation_id: tweet.conversationId ?? null',
  'is_reply: tweet.isReply === true',
  'is_quote_status: tweet.isQuoteStatus === true',
  'is_note_tweet: tweet.isNoteTweet === true',
  'tweet_source: tweet.source ?? null',
  'quote_tweet_id: quotedTweet?.id ?? null',
  'metrics: {',
  'media_urls: media.map((item) => item.mediaUrl)',
  'tweet = data["tweet"]',
  'author = data.get("author") or {}',
  'media = tweet.get("media", [])',
  'quoted_tweet = tweet.get("quoted_tweet") or {}',
  '"tweet_id": tweet["id"]',
  '"author_id": author.get("id")',
  '"author_username": author.get("username")',
  '"author_followers": author.get("followers")',
  '"author_verified": author.get("verified")',
  '"author_profile_picture": author.get("profilePicture")',
  '"created_at": tweet.get("createdAt")',
  '"conversation_id": tweet.get("conversationId")',
  '"is_reply": tweet.get("isReply") is True',
  '"is_quote_status": tweet.get("isQuoteStatus") is True',
  '"is_note_tweet": tweet.get("isNoteTweet") is True',
  '"tweet_source": tweet.get("source")',
  '"quote_tweet_id": quoted_tweet.get("id")',
  '"media_urls": [item["mediaUrl"] for item in media]',
  'shape durable tweet lookup rows instead of raw response dumps',
  '`tweet_id`, `text`, `author_id`,',
  '`author_username`, `author_followers`,',
  '`author_verified`, `author_profile_picture`, `created_at`, `conversation_id`,',
  '`quote_tweet_id`, `metrics`, and `media_urls`',
  '## Direct tweet handoff',
  '<Card title="Single row" icon="message-square">',
  '<Card title="Author context" icon="user-round">',
  '<Card title="Quote context" icon="quote">',
  '<Card title="Conversation joins" icon="list-tree">',
  '## Which tweet endpoint?',
  '[`Get tweets (batch)`](/api-reference/x/batch-tweets)',
  '[`Search tweets`](/api-reference/x/search-tweets)',
  'Tweet URL exact lookup',
  '[`Get tweet thread`](/api-reference/x/tweet-thread)',
  '`reply_extractor`, `quote_extractor`, `repost_extractor`,',
  '`thread_extractor`, or `tweet_search_extractor`',
] as const;

const FORBIDDEN_GET_TWEET_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
  'io.ReadAll(resp.Body)',
] as const;

const REQUIRED_GET_USER_API_HANDOFF_SNIPPETS = [
  '`GET /x/users/{id}`',
  'user_id: data.id',
  'display_name: data.name',
  'bio: data.description ?? null',
  'follower_count: data.followers ?? null',
  'following_count: data.following ?? null',
  'verified_type: data.verifiedType ?? null',
  'profile_image_url: data.profilePicture ?? null',
  '"user_id": data["id"]',
  '"display_name": data["name"]',
  '"follower_count": data.get("followers")',
  '"verified_type": data.get("verifiedType")',
  '"profile_image_url": data.get("profilePicture")',
  'one durable profile row',
  '`user_id`, `username`, `display_name`,',
  '<Card title="Profile row" icon="user-round">',
  '<Card title="Lookup key" icon="key-round">',
  '<Card title="Availability" icon="triangle-alert">',
  '<Card title="Next action" icon="route">',
  'Use a numeric user ID for durable joins.',
  'Store `unavailable` and `unavailableReason`',
  '## Which user endpoint?',
  '<Card title="User profile" icon="user-round">',
  '<Card title="Search users" icon="search">',
  '[`GET /x/users/search`](/api-reference/x/search-users)',
  '<Card title="Profile timeline" icon="list">',
  '[`GET /x/users/{id}/tweets`](/api-reference/x/user-tweets)',
  '<Card title="Followers" icon="users">',
  '[`GET /x/users/{id}/followers`](/api-reference/x/followers)',
  '<Card title="Follow check" icon="user-check">',
  '[`GET /x/followers/check`](/api-reference/x/check-follower)',
  '<Card title="Saved exports" icon="file-spreadsheet">',
  'saved CSV/JSON/XLSX jobs',
] as const;

const FORBIDDEN_GET_USER_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_NOTIFICATIONS_API_HANDOFF_SNIPPETS = [
  'description: "Retrieve authenticated X account notifications, store triage rows, and route mentions, verified activity, and older pages with next_cursor. See costs."',
  'Get notifications reads the connected account inbox.',
  'Use `type=Mentions` for',
  'mention triage, `type=Verified` for verified-account activity',
  'Store `next_cursor` only when `has_next_page` is',
  '```bash Mentions',
  'function notificationsUrl({ cursor, type = "Mentions" })',
  'function toNotificationRows(page, { inboxType })',
  'record_type: "notification"',
  'inbox_type: inboxType',
  'notification_id: notification.id',
  'notification_type: notification.type ?? null',
  'message_preview: notification.message ?? null',
  'created_at: notification.timestamp ?? null',
  'source_endpoint: "GET /api/v1/x/notifications"',
  'page_next_cursor: page.has_next_page ? page.next_cursor : null',
  'async function saveNotificationRows(rows)',
  'const inboxType = "Mentions";',
  'def to_notification_rows(page, inbox_type):',
  '"record_type": "notification"',
  '"inbox_type": inbox_type',
  '"notification_id": notification["id"]',
  '"notification_type": notification.get("type")',
  '"message_preview": notification.get("message")',
  '"source_endpoint": "GET /api/v1/x/notifications"',
  '## Notification triage handoff',
  '<Card title="Mention queue" icon="at-sign">',
  '<Card title="Verified activity" icon="badge-check">',
  '<Card title="All inbox" icon="inbox">',
  '<Card title="Private text" icon="lock-keyhole">',
  '## Poll Twitter Notifications with the API',
  '### Build a Twitter API Mentions Queue',
  '### Resume Notification Pages Safely',
  '### Choose Polling or Webhook Delivery',
  '## Twitter Notification API Questions',
  '### Why Are Twitter API Notifications Delayed?',
  '### Can I Delete or Clear Notifications with This Route?',
  '### What Happens When a Notification Request Fails?',
  'https://docs.x.com/x-api/posts/timelines/introduction',
  'https://docs.x.com/x-api/account-activity/introduction',
  '## Which inbox endpoint?',
  '[`GET /x/timeline`](/api-reference/x/timeline)',
  '[`GET /x/dm/{userId}/history`](/api-reference/x/dm-history)',
  '[`GET /x/users/{id}/mentions`](/api-reference/x/user-mentions)',
  '[`List events`](/api-reference/events/list)',
  '[`Webhooks`](/webhooks/overview)',
] as const;

const FORBIDDEN_NOTIFICATIONS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data.notifications);',
  'console.log((await next.json()).notifications);',
  'print(data["notifications"])',
] as const;

const REQUIRED_X_TRENDS_API_HANDOFF_SNIPPETS = [
  '`GET /x/trends`',
  'const trendRows = data.trends.map((trend) => ({',
  'const detectedAt = new Date().toISOString();',
  'trend_name: trend.name',
  'search_query: trend.query ?? trend.name',
  'region_woeid: data.woeid',
  'returned_count: data.count',
  'detected_at: detectedAt',
  'detected_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")',
  '"trend_name": trend["name"]',
  '"search_query": trend.get("query", trend["name"])',
  '"region_woeid": data["woeid"]',
  '"returned_count": data["count"]',
  '"detected_at": detected_at',
  'one JSON record for every returned trend',
  'Store `trend_name` for every result.',
  '`detected_at`',
  'A Twitter API trending workflow should preserve each snapshot before searching.',
  '## Build a Regional Trend Monitor',
  'Preserve `rank`, `description`, and `query` when the response includes them.',
  'Keep missing values unset. Preserve `tweetVolume` as null when X returns null.',
  'Send a full Xquik account API key.',
  '`paid_reads` guest keys through the API-key scheme\'s Bearer alias.',
  'Account keys receive account payment options.',
  'Guest keys receive only the guest top-up action.',
  'Anonymous calls receive `WWW-Authenticate: Payment` plus a guest wallet action.',
  'Use `Retry-After` when present. Otherwise, use the JSON `retryAfter` field.',
  '### 424 Dependency Failed',
  '## Twitter Trends API Questions',
  '### How Do I Get Twitter Trends Programmatically?',
  '### Can I Track Trending Hashtags by Region?',
  '### How Do I Authenticate to the Twitter Trends API?',
  '### How Much Does a Trends Request Cost?',
  '### How Do I Build Trend Tracking Into an App?',
  '### Does This Replace X\'s Official API?',
  'Send `xquik-api-contract: 2026-04-29` to opt in. Default v1 returns 502.',
] as const;

const FORBIDDEN_X_TRENDS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_TRENDS_API_HANDOFF_SNIPPETS = [
  '## Build a Regional Twitter Trending Monitor',
  '`GET /trends`',
  'regional dashboards, alerts, queues, warehouses, or agents.',
  'const regionWoeid = "23424977";',
  'const requestedCount = "10";',
  'const trendRows = data.trends.map((trend) => ({',
  'trend_name: trend.name',
  'search_query: trend.query ?? trend.name',
  'region_woeid: data.woeid',
  'requested_count: Number(requestedCount)',
  'const returnedTotal = data.trends.length;',
  'returned_total: returnedTotal',
  'region_woeid = 23424977',
  'requested_count = 10',
  'trend_rows = [',
  '"trend_name": trend["name"]',
  '"search_query": trend.get("query", trend["name"])',
  '"region_woeid": data["woeid"]',
  '"requested_count": requested_count',
  'returned_total = len(data["trends"])',
  '"returned_total": returned_total',
  'type TrendsResponse struct {',
  'type TrendRow struct {',
  'RequestedCount int     `json:"requested_count"`',
  'ReturnedTotal  int     `json:"returned_total"`',
  'returnedTotal := len(data.Trends)',
  'searchQuery := trend.Name',
  'encoder.Encode(TrendRow{',
  'one JSON line per trend',
  'Store `trend_name`, `rank`, `description`, and `search_query`.',
  'Record `region_woeid` and `requested_count` with each snapshot.',
  'Record `returned_total` beside those request fields.',
  'Derive `returned_total` from `trends.length`.',
  'The raw `total` counts valid trends before `count` slicing.',
  'A Twitter API trends client saves each snapshot before searching.',
  'A Twitter API trending monitor compares ranks within one WOEID.',
  'Keep missing optional fields unset. Preserve null `tweetVolume` values.',
  '## Twitter Trends API Questions',
  '### How Do I Get Twitter Trends Programmatically?',
  '### Can I Get Location-Based Trending Topics?',
  '### Does the API Return Historical Twitter Trends?',
  '### How Do I Authenticate to the Twitter Trends API?',
  '### Is the Twitter Trends API Free?',
  '### Does This Replace X\'s Official API?',
  'Send `xquik-api-contract: 2026-04-29` to opt in. Default v1 returns 502.',
] as const;

const FORBIDDEN_TRENDS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_GET_ARTICLE_API_HANDOFF_SNIPPETS = [
  'title: "X Article API for Long-Form Tweet & Post Content"',
  'Retrieve one long-form X Article by tweet ID',
  '`GET /x/articles/{tweetId}`',
  '`GET /api/v1/x/articles/{tweetId}`',
  'X Articles API',
  'X article API',
  'Twitter article API',
  'tweet article API',
  'article body endpoint',
  'tweet_id: tweetId',
  'article_title: data.article.title ?? null',
  'preview_text: data.article.previewText ?? null',
  'const author = data.author ?? {};',
  'const bodyBlocks = contentBlocks.filter((block) => block.text);',
  'const mediaBlocks = contentBlocks.filter((block) => block.url);',
  'const formattedBlocks = contentBlocks',
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_name: author.name ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'cover_image_url: data.article.coverImageUrl ?? null',
  'body_text: bodyBlocks.map((block) => block.text).join("\\n\\n")',
  'block_count: contentBlocks.length',
  'block_types: contentBlocks.map((block) => block.type ?? "unknown")',
  'formatted_blocks: formattedBlocks',
  'media_urls: mediaBlocks.map((block) => block.url)',
  '## Find candidate articles',
  'Use this endpoint after you have the numeric wrapper tweet ID for an X Article.',
  '<Card title="Search first" icon="search">',
  'wrapper tweets by author, keyword, URL, or visible tweet text',
  '<Card title="Article lookup" icon="file-text">',
  '<Card title="Fallback route" icon="git-branch">',
  'store the terminal result and switch',
  '<Card title="Saved export" icon="file-spreadsheet">',
  '"candidate_source": "GET /api/v1/x/tweets/search"',
  '"article_route": "GET /api/v1/x/articles/{tweetId}"',
  '"content_type": "x_article"',
  '"fallback_route": "GET /api/v1/x/tweets/{id}"',
  'body_blocks = [block for block in content_blocks if block.get("text")]',
  'media_blocks = [block for block in content_blocks if block.get("url")]',
  'formatted_blocks = [',
  '"tweet_id": tweet_id',
  '"article_title": data["article"].get("title")',
  '"preview_text": data["article"].get("previewText")',
  'author = data.get("author") or {}',
  '"author_id": author.get("id")',
  '"author_username": author.get("username")',
  '"author_name": author.get("name")',
  '"author_profile_picture": author.get("profilePicture")',
  '"cover_image_url": data["article"].get("coverImageUrl")',
  '"body_text": "\\n\\n".join(block["text"] for block in body_blocks)',
  '"block_count": len(content_blocks)',
  '"block_types": [block.get("type") for block in content_blocks]',
  '"formatted_blocks": formatted_blocks',
  '"media_urls": [block["url"] for block in media_blocks]',
  'shape durable article handoff rows',
  '## Direct article handoff',
  '`404 article_not_found`',
  '<Card title="Article row" icon="file-text">',
  '<Card title="Body blocks" icon="list-tree">',
  '<Card title="Not an article" icon="circle-alert">',
  '<Card title="Saved exports" icon="file-spreadsheet">',
  '## Which article endpoint?',
  '[`Get tweet`](/api-reference/x/get-tweet)',
  '[`Get tweet thread`](/api-reference/x/tweet-thread)',
  '[`Search tweets`](/api-reference/x/search-tweets)',
  '`toolType=article_extractor`',
  '`article_title`, `preview_text`, `author_id`, `author_username`,',
  '`author_username`, `author_name`,',
  '`author_profile_picture`, `created_at`, `cover_image_url`,',
  '`block_count`, `block_types`, `formatted_blocks`,',
] as const;

const FORBIDDEN_GET_ARTICLE_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
  'print(response.json()["article"])',
] as const;

const REQUIRED_TWEET_THREAD_API_HANDOFF_SNIPPETS = [
  'title: "Tweet Thread API, Conversation Export & Authors"',
  '`GET /x/tweets/{id}/thread`',
  '`GET /api/v1/x/tweets/{id}/thread`',
  'tweet thread API',
  'X thread API',
  'conversation thread API',
  'thread context endpoint',
  '```bash First page',
  '```bash Next page',
  '--data-urlencode "cursor=abc123"',
  'const cursor = process.env.XQUIK_CURSOR ?? "";',
  'source_tweet_id: tweetId',
  'thread_tweet_id: tweet.id',
  'const author = tweet.author ?? {};',
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_name: author.name ?? null',
  'author_followers: author.followers ?? null',
  'author_verified: author.verified ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'conversation_id: tweet.conversationId ?? null',
  'in_reply_to_id: tweet.inReplyToId ?? null',
  'media_urls: tweet.media?.map((item) => item.mediaUrl).filter(Boolean) ?? []',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const checkpoint = { source_tweet_id: tweetId, next_cursor: nextCursor };',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'tweet_id = "1893456789012345678"',
  '"source_tweet_id": tweet_id',
  '"thread_tweet_id": tweet["id"]',
  'author = tweet.get("author") or {}',
  '"author_id": author.get("id")',
  '"author_username": author.get("username")',
  '"author_name": author.get("name")',
  '"author_followers": author.get("followers")',
  '"author_verified": author.get("verified")',
  '"author_profile_picture": author.get("profilePicture")',
  '"conversation_id": tweet.get("conversationId")',
  '"in_reply_to_id": tweet.get("inReplyToId")',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'checkpoint = {"source_tweet_id": tweet_id, "next_cursor": next_cursor}',
  'print(json.dumps({"checkpoint": checkpoint}))',
  '## Direct tweet thread handoff',
  'JSON Lines thread rows plus a separate',
  '`source_tweet_id`,',
  '`thread_tweet_id`, `text`, `author_id`,',
  '`author_followers`, `author_verified`, `author_profile_picture`,',
  '<Card title="Thread rows" icon="list-tree">',
  '<Card title="Reply joins" icon="message-square-reply">',
  '<Card title="Saved exports" icon="file-spreadsheet">',
  '## Which thread endpoint?',
  '[`GET /x/tweets/{id}/replies`](/api-reference/x/tweet-replies)',
  '[`GET /x/tweets/{id}/quotes`](/api-reference/x/tweet-quotes)',
  '[`GET /x/tweets/search`](/api-reference/x/search-tweets)',
  '`toolType=thread_extractor`',
  '<ResponseField name="profilePicture" type="string">',
] as const;

const FORBIDDEN_TWEET_THREAD_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'const output = { ...row, next_cursor: nextCursor };',
  '"next_cursor": next_cursor,',
] as const;

const REQUIRED_RETWEETERS_API_HANDOFF_SNIPPETS = [
  'title: "See Who Retweeted My Tweet with Twitter API"',
  '`GET /x/tweets/{id}/retweeters`',
  '`GET /api/v1/x/tweets/{id}/retweeters`',
  'tweet retweeters API',
  'retweet users API',
  'users who retweeted a tweet',
  '```bash First page',
  '```bash Next page',
  'source_tweet_id: tweetId',
  'retweeter_id: user.id',
  'username: user.username',
  'display_name: user.name',
  'follower_count: user.followers ?? null',
  'following_count: user.following ?? null',
  'verified: user.verified ?? false',
  'verified_type: user.verifiedType ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const checkpoint = { source_tweet_id: tweetId, next_cursor: nextCursor };',
  '"source_tweet_id": tweet_id',
  '"retweeter_id": user["id"]',
  '"display_name": user["name"]',
  '"follower_count": user.get("followers")',
  '"following_count": user.get("following")',
  '"verified_type": user.get("verifiedType")',
  '"profile_image_url": user.get("profilePicture")',
  'checkpoint = {"source_tweet_id": tweet_id, "next_cursor": next_cursor}',
  '## Direct retweeter handoff',
  'workflow needs one row per',
  'Store `source_tweet_id`,',
  '`retweeter_id`, `username`, `display_name`, `follower_count`,',
  '`following_count`, `verified`, `verified_type`, and `profile_image_url`',
  '## Retweeter Questions',
  '### Can I See Who Retweeted My Tweet?',
  '### Why Can\'t I See Every Retweeter?',
  '### Do Retweeters Include Quote Tweets?',
  '### How Do I Export Retweeters?',
  '### How Can I Analyze Retweeters?',
  'https://docs.x.com/x-api/posts/get-reposted-by',
  '<Card title="Retweeters" icon="repeat-2">',
  '[`GET /x/tweets/{id}/favoriters`](/api-reference/x/favoriters)',
  '[`GET /x/tweets/{id}/quotes`](/api-reference/x/tweet-quotes)',
  '[`GET /x/tweets/{id}/replies`](/api-reference/x/tweet-replies)',
  '`toolType=repost_extractor`',
] as const;

const FORBIDDEN_RETWEETERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'console.log(data.users);',
  'console.log((await next.json()).users);',
  'print(data)',
  'print(data["users"])',
] as const;

const REQUIRED_FAVORITERS_API_HANDOFF_SNIPPETS = [
  'title: "How to See Who Liked My Tweet with Twitter API"',
  '`GET /x/tweets/{id}/favoriters`',
  '`GET /api/v1/x/tweets/{id}/favoriters`',
  '## Tweet Liker Questions',
  '### How Do I See Who Liked My Tweet?',
  "### Why Can't I See Who Liked My Tweet?",
  "### Does This Show an Account's Private Likes?",
  '### How Do I Export Tweet Likers?',
  '### How Can I Track and Analyze Tweet Likes?',
  'https://docs.x.com/x-api/posts/get-liking-users',
  '```bash First page',
  '```bash Next page',
  'source_tweet_id: tweetId',
  'liker_id: user.id',
  'username: user.username',
  'display_name: user.name',
  'follower_count: user.followers ?? null',
  'following_count: user.following ?? null',
  'verified: user.verified ?? false',
  'verified_type: user.verifiedType ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const checkpoint = { source_tweet_id: tweetId, next_cursor: nextCursor };',
  '"source_tweet_id": tweet_id',
  '"liker_id": user["id"]',
  '"display_name": user["name"]',
  '"follower_count": user.get("followers")',
  '"following_count": user.get("following")',
  '"verified_type": user.get("verifiedType")',
  '"profile_image_url": user.get("profilePicture")',
  'checkpoint = {"source_tweet_id": tweet_id, "next_cursor": next_cursor}',
  '## Direct tweet liker handoff',
  'workflow needs one row per',
  '`liker_id`, `username`, `display_name`,',
  '`follower_count`, `following_count`,',
  '`verified_type`, `profile_image_url`,',
  '<Card title="Tweet likers" icon="heart">',
  '[`GET /x/tweets/{id}/retweeters`](/api-reference/x/retweeters)',
  '[`GET /x/tweets/{id}/quotes`](/api-reference/x/tweet-quotes)',
  '[`GET /x/tweets/{id}/replies`](/api-reference/x/tweet-replies)',
  '`toolType=favoriters`',
] as const;

const FORBIDDEN_FAVORITERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'console.log(data.users);',
  'console.log((await next.json()).users);',
  'print(data)',
  'print(data["users"])',
] as const;

const REQUIRED_COMMUNITY_INFO_API_HANDOFF_SNIPPETS = [
  '`GET /x/communities/{id}/info`',
  '<Card title="Keyword search" icon="search" href="/api-reference/x/community-search">',
  'const communityRecord = {',
  'community_id: community.id',
  'community_name: community.name ?? null',
  'member_count: community.member_count ?? null',
  'moderator_count: community.moderator_count ?? null',
  'primary_topic_name: community.primary_topic?.name ?? null',
  'rule_count: community.rules?.length ?? 0',
  '"community_id": community["id"]',
  '"community_name": community.get("name")',
  '"member_count": community.get("member_count")',
  '"moderator_count": community.get("moderator_count")',
  '"primary_topic_name": (community.get("primary_topic") or {}).get("name")',
  '"rule_count": len(community.get("rules") or [])',
  'one durable community',
  '`community_id`, `community_name`, `description`,',
] as const;

const FORBIDDEN_COMMUNITY_INFO_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_MEMBERS_API_HANDOFF_SNIPPETS = [
  '## X Community Member Scraping Questions',
  '### Scrape X Community Members',
  '### What Is the Best Way to Extract Data From a Twitter Community?',
  '### How Do I Scrape Members From an X Community?',
  '### Twitter Community API',
  '### How Should I Compare Community Member Lists?',
  '`GET /x/communities/{id}/members`',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const memberRows = data.users.map((user) => ({',
  'community_id: communityId',
  'member_id: user.id',
  'display_name: user.name',
  'bio: user.description ?? null',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  '"community_id": community_id',
  '"member_id": user["id"]',
  '"display_name": user["name"]',
  '"bio": user.get("description")',
  '"follower_count": user.get("followers")',
  '"profile_image_url": user.get("profilePicture")',
  'one row per community member',
  '`community_id`, `member_id`, `username`,',
] as const;

const FORBIDDEN_COMMUNITY_MEMBERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_MODERATORS_API_HANDOFF_SNIPPETS = [
  '`GET /x/communities/{id}/moderators`',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const moderatorRows = data.users.map((user) => ({',
  'community_id: communityId',
  'moderator_id: user.id',
  'display_name: user.name',
  'bio: user.description ?? null',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'page_size: data.users.length',
  'has_next_page: data.has_next_page',
  '"community_id": community_id',
  '"moderator_id": user["id"]',
  '"display_name": user["name"]',
  '"bio": user.get("description")',
  '"follower_count": user.get("followers")',
  '"profile_image_url": user.get("profilePicture")',
  '"page_size": len(data["users"])',
  '"has_next_page": data["has_next_page"]',
  'community moderator. Store',
  '`community_id`, `moderator_id`, `username`,',
  '## Direct Moderator Handoff',
  '<Card title="Moderator rows" icon="shield-check">',
  '<Card title="Next page" icon="arrow-right">',
  '<Card title="Default page" icon="rows-3">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  '`community_moderator_explorer` when the workflow needs an extraction',
  '## Which Community Endpoint?',
  '<Card title="Community moderators" icon="shield-check">',
  '[`GET /x/communities/{id}/members`](/api-reference/x/community-members)',
  '[`GET /x/communities/{id}/info`](/api-reference/x/community-info)',
  '[`GET /x/communities/{id}/tweets`](/api-reference/x/community-tweets)',
  '[`GET /x/communities/tweets`](/api-reference/x/community-search)',
  '`community_extractor`, or',
  '`community_post_extractor` for queued file exports',
] as const;

const FORBIDDEN_COMMUNITY_MODERATORS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_TWEETS_API_HANDOFF_SNIPPETS = [
  '## X Community Tweet Export Questions',
  '### Export Community Tweets',
  '### Are Twitter Community Posts Public or Private?',
  '### Where Can I Find Analytics for X Community Posts?',
  '### Can This API Schedule or Moderate Community Posts?',
  '[Communities guide](https://help.x.com/en/using-x/communities)',
  '### What Does the Twitter Community API Return?',
  '### How Do I Build a Complete Community Tweet Export?',
  '## Direct Community Tweet Handoff',
  '`GET /x/communities/{id}/tweets`',
  'const nextCursor = data.has_next_page && data.next_cursor ? data.next_cursor : null;',
  'const tweetRows = data.tweets.map((tweet) => ({',
  'community_id: communityId',
  'tweet_id: tweet.id',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'created_at: tweet.createdAt ?? null',
  'like_count: tweet.likeCount ?? null',
  'media_urls: tweet.media?.map((item) => item.mediaUrl).filter(Boolean) ?? []',
  'has_next_page: data.has_next_page',
  '"community_id": community_id',
  '"tweet_id": tweet["id"]',
  '"author_id": (tweet.get("author") or {}).get("id")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"created_at": tweet.get("createdAt")',
  '"media_urls": [',
  'next_cursor = data.get("next_cursor") if data.get("has_next_page") else None',
  '"has_next_page": data.get("has_next_page", False)',
  'one row per community tweet',
  'Store each Tweet ID in its own record.',
  'creation time, engagement counts, media, and cursor checkpoint.',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
  '<Card title="Community tweet rows" icon="message-square-text">',
  '<Card title="Next page" icon="arrow-right">',
  '`has_next_page` is `true` and `next_cursor` is present.',
  '<Card title="Default page" icon="rows-3">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  'Request 1 to 100 tweets with `pageSize`. The default is 20.',
  '## Which Community Endpoint?',
  '<Card title="Community tweets" icon="message-square-text">',
  '<Card title="Community tweet search" icon="search">',
  '[`GET /x/communities/tweets`](/api-reference/x/community-search)',
  '<Card title="Community members" icon="users">',
  '[`GET /x/communities/{id}/members`](/api-reference/x/community-members)',
  '<Card title="Bulk community jobs" icon="file-spreadsheet">',
  '`community_post_extractor`, `community_extractor`, or',
  '`community_moderator_explorer` when the workflow needs a saved export.',
] as const;

const FORBIDDEN_COMMUNITY_TWEETS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_SEARCH_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Community Search API & Keyword Tweet Results"',
  'Use Twitter community search to filter posts inside one known Community.',
  'Twitter search in community posts with a numeric Community ID and query.',
  '## Twitter Community Search Questions',
  '### Does This Endpoint Find Communities to Join?',
  '[X Communities guide](https://help.x.com/en/using-x/communities)',
  'Send `communityId` and `q`. Omit `queryType` to use `Latest`.',
  '### Why Does Twitter Community Search Return No Results?',
  '### Can I Find Active Authors in Matching Tweets?',
  'They do not prove influence,',
  '## Direct Community Search Handoff',
  '`GET /x/communities/search`',
  'monitoring job, research queue,',
  'social listening workflow, or agent needs matching tweets',
  'const communityId = "1234567890";',
  'const searchQuery = "web development";',
  'const queryType = "Latest";',
  'const tweetRows = data.tweets.map((tweet) => {',
  'const author = tweet.author ?? {};',
  'search_query: searchQuery',
  'query_type: queryType',
  'tweet_id: tweet.id',
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_name: author.name ?? null',
  'author_followers: author.followers ?? null',
  'author_verified: author.verified ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'created_at: tweet.createdAt ?? null',
  'media_urls: tweet.media?.map((item) => item.mediaUrl).filter(Boolean) ?? []',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const checkpoint = {',
  'search_query = "web development"',
  'query_type = "Latest"',
  'tweet_rows = []',
  'author = tweet.get("author") or {}',
  '"search_query": search_query',
  '"query_type": query_type',
  '"tweet_id": tweet["id"]',
  '"author_id": author.get("id")',
  '"author_username": author.get("username")',
  '"author_name": author.get("name")',
  '"author_followers": author.get("followers")',
  '"author_verified": author.get("verified")',
  '"author_profile_picture": author.get("profilePicture")',
  '"created_at": tweet.get("createdAt")',
  '"media_urls": [',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'shape one durable row per matching community',
  'with the same `communityId`, `q`, `queryType`, and `pageSize`.',
  '`community_id`, `search_query`, `query_type`, `tweet_id`,',
  '`author_followers`, `author_verified`,',
  '`author_profile_picture`, `created_at`, engagement counts, & `media_urls`',
  '<ResponseField name="profilePicture" type="string">',
  'Set `queryType=Latest` for recent queues or backfills',
  'Set `queryType=Top` for',
  '<Card title="Search row checkpoint" icon="search">',
  '<Card title="Sort mode" icon="arrow-down-up">',
  '<Card title="Default page" icon="rows-3">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  'Request 1 to 100 tweets with `pageSize`. The default is 20.',
  'Use `community_search` with `targetCommunityId` and `searchQuery`',
  '## Which Community Search Route?',
  '<Card title="Community search route" icon="list-filter">',
  '<Card title="Equivalent scoped route" icon="search">',
  '`GET /x/communities/tweets` when your integration already uses that',
  'path. It accepts the same `communityId`, `q`, `queryType`, `cursor`, and',
  '`pageSize` shape.',
  '<Card title="Known community posts" icon="message-square-text">',
  '[`GET /x/communities/{id}/tweets`](/api-reference/x/community-tweets)',
  '<Card title="Bulk community jobs" icon="file-spreadsheet">',
  '`community_search` with `targetCommunityId` and `searchQuery`',
] as const;

const FORBIDDEN_COMMUNITY_SEARCH_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Followers API, Profile Export & Cursors"',
  'Get an X account\'s followers by username or user ID',
  'Follower Export API',
  'X followers API',
  'Twitter followers API',
  'canonical endpoint remains `GET /api/v1/x/users/{id}/followers`',
  'https://xquik.com/api/v1/x/users/username/followers?pageSize=200',
  'https://xquik.com/api/v1/x/users/44196397/followers?pageSize=200',
  'curl -G "https://xquik.com/api/v1/x/users/username/followers"',
  '--data-urlencode "cursor=DAACCgACGE..."',
  '## Direct follower handoff',
  '## Which follower endpoint?',
  '<CardGroup cols={2}>',
  '<Card title="Follower rows"',
  '<Card title="Next page"',
  '<Card title="Credit-limited pages"',
  '`GET /api/v1/x/users/{id}/followers`',
  'agent workflow needs follower rows',
  '`follower_explorer`',
  '[Follower Export CRM Workflow](/guides/follower-export-crm)',
  'saved CSV, JSON, or XLSX files',
  'imports or upserts',
  '## Choose live API or saved export',
  'Use this endpoint for current JSON pages',
  '`next_cursor` and process `users[]` immediately',
  'cost estimate, reusable extraction ID, stored result pages',
  '<Card title="Live page" icon="zap">',
  '<Card title="Saved export" icon="archive">',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`has_next_page` and `next_cursor`',
  'const userIdOrUsername = "username";',
  'let pageCursor = "";',
  'const params = new URLSearchParams({ pageSize: "200" });',
  'const importRows = page.users.map',
  'source_user_id_or_username: userIdOrUsername',
  'follower_count: user.followers ?? null',
  'page_index: pageIndex',
  'page_cursor: pageCursor',
  'has_next_page: page.has_next_page',
  'for (const row of importRows) process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'import json',
  'user_id_or_username = "44196397"',
  '"source_user_id_or_username": user_id_or_username',
  '"follower_count": user.get("followers")',
  '"page_index": page_index',
  '"page_cursor": page_cursor',
  '"has_next_page": page["has_next_page"]',
  'print(json.dumps(import_row, separators=(",", ":")))',
  'write JSON Lines import rows instead of raw',
  '`pageSize` from 20 to 200',
  'Range: 20-200. Default: `200`. Remaining credits can reduce the returned row count.',
  'Opaque pagination cursor from `next_cursor` in the previous response.',
  'Username or numeric user ID. For example, use `username` or `44196397`.',
  'Use `users.length`, not the requested `pageSize`, for row counts and budget checks.',
  'Treat the returned `users.length` as the billable row count for that page.',
  'Use `GET /api/v1/x/users/{id}/following` for accounts the user follows.',
  'Use `GET /api/v1/x/users/{id}/verified-followers` when you only need verified followers.',
  '1 credit per result returned',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'const data = await response.json();',
  'data = response.json()',
  'const importRows = data.users.map',
  'import_rows = [',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
] as const;

const REQUIRED_FOLLOWING_API_HANDOFF_SNIPPETS = [
  'description: "Retrieve the accounts one X user follows by username or numeric user ID',
  'Following API',
  'X following API',
  'Twitter following API',
  'The canonical endpoint remains',
  '`GET /api/v1/x/users/{id}/following`',
  '```bash Username',
  '/x/users/username/following?pageSize=100',
  '```bash Numeric user ID',
  '/x/users/44196397/following',
  '```bash Resume page',
  'curl -G "https://xquik.com/api/v1/x/users/username/following"',
  '--data-urlencode "cursor=DAACCgACGE..."',
  '--data-urlencode "pageSize=200"',
  '## Direct following handoff',
  '<CardGroup cols={2}>',
  '<Card title="Following rows"',
  '<Card title="Next page"',
  '`GET /x/users/{id}/following`',
  'CRM, warehouse, audience, or agent workflow',
  'The endpoint accepts either a username or numeric user ID',
  '`following_explorer`',
  'CSV/JSON/XLSX file export',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`has_next_page` and `next_cursor`',
  'for (let pageIndex = 0; pageIndex < 3; pageIndex += 1)',
  'source_user_id_or_username: userIdOrUsername',
  'const audienceRows = page.users.map',
  'page_cursor: pageCursor',
  'next_cursor: page.next_cursor',
  '"source_user_id_or_username": user_id_or_username',
  '"page_cursor": page_cursor',
  '"next_cursor": page["next_cursor"]',
  'write JSON Lines audience rows instead of raw',
  'Pass a cursor only when `has_next_page` is true.',
  '`pageSize` from 20 to 200',
  'Remaining credits can reduce',
  '## Which following endpoint?',
  '<Card title="One user\'s following"',
  'Use `GET /x/users/{id}/following` for the accounts one profile follows.',
  '<Card title="One user\'s followers"',
  '[`GET /x/users/{id}/followers`](/api-reference/x/followers)',
  '<Card title="Verified followers"',
  '[`GET /x/users/{id}/verified-followers`](/api-reference/x/verified-followers)',
  '<Card title="Saved exports"',
  '1 credit per user returned',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_FOLLOWING_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const FORBIDDEN_CHECK_FOLLOWER_RENDER_RISK_SNIPPETS = [
  '## Direct follow relationship handoff',
  'const source = "username";',
  'const target = "elonmusk";',
  'const relationshipRow = {',
  'source_username: data.sourceUsername',
  'target_username: data.targetUsername',
  'source_follows_target: data.isFollowing',
  'target_follows_source: data.isFollowedBy',
  'process.stdout.write(`${JSON.stringify(relationshipRow)}\\n`);',
  'relationship_row = {',
  '"source_username": data["sourceUsername"]',
  '"target_username": data["targetUsername"]',
  '"source_follows_target": data["isFollowing"]',
  '"target_follows_source": data["isFollowedBy"]',
  'print(json.dumps(relationship_row))',
] as const;

const REQUIRED_CHECK_FOLLOWER_API_HANDOFF_SNIPPETS = [
  'description: "Check whether one X user follows another in either direction for giveaway eligibility, campaign proof, CRM flags, and relationship audits. See fields."',
  'Check follower verifies one known relationship without exporting a follower',
  '`isFollowing` for source-to-target proof and `isFollowedBy` for',
  'async function buildFollowCheckAudit()',
  'const campaignId = "spring-launch-2026";',
  'const participantHandle = "participant_handle";',
  'const requiredFollowHandle = "brand_handle";',
  'campaign_id: campaignId',
  'participant_handle: data.sourceUsername',
  'required_follow_handle: data.targetUsername',
  'proof_endpoint: "GET /api/v1/x/followers/check"',
  'participant_follows_required_account: data.isFollowing',
  'required_account_follows_participant: data.isFollowedBy',
  'verification_state: data.isFollowing ? "matched" : "not_matched"',
  'def build_follow_check_audit():',
  '"participant_follows_required_account": data["isFollowing"]',
  '"required_account_follows_participant": data["isFollowedBy"]',
  '## Campaign follow-check handoff',
  'Use `GET /api/v1/x/followers/check` when a workflow already has both usernames',
  '<Card title="Single proof" icon="user-check">',
  '<Card title="Both directions" icon="repeat-2">',
  '<Card title="Accepted inputs" icon="at-sign">',
  'Pass a username, `@username`, or supported X or Twitter profile URL.',
  'Numeric user IDs are not accepted.',
  '<Card title="Audit row" icon="clipboard-check">',
  '<Card title="Stopped audit" icon="coins">',
  'Canonical lowercase username resolved from `source`.',
  'Canonical lowercase username resolved from `target`.',
  '"message": "Both source and target usernames are required."',
  '"error": "invalid_username"',
  '## Which verification endpoint?',
  '<Card title="Follow task" icon="user-check">',
  '[`GET /x/tweets/{id}/retweeters`](/api-reference/x/retweeters)',
  '[`GET /x/tweets/{id}/replies`](/api-reference/x/tweet-replies)',
  '[`GET /x/tweets/{id}/quotes`](/api-reference/x/tweet-quotes)',
  '[`POST /draws`](/api-reference/draws/create)',
  '[Campaign verification workflow](/guides/campaign-verification-workflow)',
] as const;

const FORBIDDEN_CHECK_FOLLOWER_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_LIST_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  'title: "Twitter List Followers API & Profile Export"',
  'Use this Twitter List followers API for one X List.',
  '## Twitter List Followers Questions',
  '### What Is a Twitter List Follower?',
  'A List member is an account selected',
  '[Lists guide](https://help.x.com/en/using-x/x-lists)',
  '### How Do I Find Who Follows a Specific Twitter List?',
  'Xquik returns `has_next_page` and `next_cursor`.',
  '[Get List followers](https://docs.x.com/x-api/lists/get-list-followers)',
  'uses different pagination field names.',
  '### How Do I Export Twitter List Followers?',
  'Twitter List follower export',
  '### What Can I Check in Each Twitter Profile?',
  'do not show age, gender, income, identity, consent, or sentiment.',
  '### Can This API Add, Remove, or Buy List Followers?',
  '[List Members endpoint](/api-reference/x/list-members)',
  '## Direct List Follower Handoff',
  '## Measure Twitter List Follower Profiles',
  '`GET /x/lists/{id}/followers`',
  'CRM, warehouse, audience tool, or agent',
  '`list_follower_explorer`',
  'CSV, JSON, or XLSX export',
  'const followerRows = data.users.map',
  'list_id: listId',
  'follower_id: user.id',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'follower_rows = [',
  '"list_id": list_id',
  '"follower_id": user["id"]',
  '"follower_count": user.get("followers")',
  '"profile_image_url": user.get("profilePicture")',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'build one row per List follower',
  '`list_id`, `follower_id`, `username`,',
  '`has_next_page`, and `next_cursor`',
  '<Card title="List follower audience" icon="user-plus">',
  '<Card title="Next page" icon="arrow-right">',
  '<Card title="Default page" icon="rows-3">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  '`users.length` as the row count returned for this page.',
  '## Which List Endpoint?',
  '<Card title="List followers" icon="user-plus">',
  '<Card title="List members" icon="users">',
  '[`GET /x/lists/{id}/members`](/api-reference/x/list-members)',
  '<Card title="List tweets" icon="message-square-text">',
  '[`GET /x/lists/{id}/tweets`](/api-reference/x/list-tweets)',
  '<Card title="Bulk list jobs" icon="file-spreadsheet">',
  '`list_follower_explorer`, `list_member_extractor`, or `list_post_extractor`',
] as const;

const FORBIDDEN_LIST_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_LIST_MEMBERS_API_HANDOFF_SNIPPETS = [
  '## Direct List Member Handoff',
  '`GET /x/lists/{id}/members`',
  'CRM, warehouse, audience tool, or agent',
  '`list_member_extractor`',
  'CSV, JSON, or XLSX file export',
  'const memberRows = data.users.map',
  'list_id: listId',
  'member_id: user.id',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'member_rows = [',
  '"list_id": list_id',
  '"member_id": user["id"]',
  '"follower_count": user.get("followers")',
  '"profile_image_url": user.get("profilePicture")',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'create one row per List member',
  '`list_id`, `member_id`, `username`,',
  '`has_next_page`, and `next_cursor`',
  '`pageSize` from 20 through 200',
  '<Card title="Member roster" icon="users">',
  '<Card title="Next page" icon="arrow-right">',
  '<Card title="Page size" icon="rows-3">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  'Treat the returned `users.length` as the row',
  '## Which List Endpoint?',
  '<Card title="List members" icon="users">',
  '<Card title="List followers" icon="user-plus">',
  '[`GET /x/lists/{id}/followers`](/api-reference/x/list-followers)',
  '<Card title="List tweets" icon="message-square-text">',
  '[`GET /x/lists/{id}/tweets`](/api-reference/x/list-tweets)',
  '<Card title="Bulk list jobs" icon="file-spreadsheet">',
  '`list_follower_explorer`, or `list_post_extractor`',
] as const;

const FORBIDDEN_LIST_MEMBERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_LIST_TWEETS_API_HANDOFF_SNIPPETS = [
  'title: "Twitter List Tweets API & Timeline Export Guide"',
  'Use this Twitter Lists API to retrieve Twitter List tweets',
  '## Twitter List Tweets Questions',
  '### What Does the Twitter Lists API Return?',
  '### How Do I Export Tweets From a Twitter List?',
  '### Why Are Some Twitter List Tweets Missing?',
  '`includeReplies`. The default excludes replies.',
  '[Help with Lists](https://help.x.com/en/using-x/x-lists-not-working)',
  'Private Lists owned by other',
  '### Can This Endpoint Create or Edit a Twitter List?',
  '[Lists guide](https://help.x.com/en/using-x/x-lists)',
  '[List Members endpoint](/api-reference/x/list-members)',
  '### How Do I Measure Activity in a Curated List Timeline?',
  'They do not expose unique',
  'viewers, link clicks, conversions, or audience sentiment.',
  '### Does the API Preserve List Tweet Order?',
  'retries by stable Tweet ID without re-ranking the saved rows.',
  '## Direct List Tweet Handoff',
  '`GET /x/lists/{id}/tweets`',
  'CRM, warehouse, newsroom, monitoring',
  'agent needs tweets from a curated X List',
  'const tweetRows = data.tweets.map',
  'list_id: listId',
  'tweet_id: tweet.id',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'created_at: tweet.createdAt ?? null',
  'media_urls: tweet.media?.map((item) => item.mediaUrl).filter(Boolean) ?? []',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'tweet_rows = [',
  '"list_id": list_id',
  '"tweet_id": tweet["id"]',
  '"author_id": (tweet.get("author") or {}).get("id")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"created_at": tweet.get("createdAt")',
  '"media_urls": [',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'shape one durable row per returned list tweet',
  '`has_next_page` is true',
  'pass it back as `cursor`',
  '`list_id`, `tweet_id`, `text`,',
  '`author_id`, `author_username`,',
  '`author_name`, `author_followers`, `author_verified`,',
  '`author_profile_picture`,',
  'engagement counts, & `media_urls`',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
  'Use `sinceTime` & `untilTime` for bounded backfills',
  '`includeReplies=true`',
  '<Card title="List tweet rows" icon="message-square-text">',
  '<Card title="Next page" icon="arrow-right">',
  '<Card title="Default page" icon="rows-3">',
  '<Card title="Time window" icon="calendar-range">',
  '<Card title="Reply filter" icon="message-square-reply">',
  '<Card title="Saved export" icon="file-spreadsheet">',
  '`tweets.length` as the row count returned for this page.',
  'Use `list_post_extractor` when the workflow needs a saved job',
  '## Which List Endpoint?',
  '<Card title="List tweets" icon="message-square-text">',
  '<Card title="List members" icon="users">',
  '[`GET /x/lists/{id}/members`](/api-reference/x/list-members)',
  '<Card title="List followers" icon="user-plus">',
  '[`GET /x/lists/{id}/followers`](/api-reference/x/list-followers)',
  '<Card title="Bulk list jobs" icon="file-spreadsheet">',
  '`list_post_extractor`, `list_member_extractor`, or `list_follower_explorer`',
] as const;

const FORBIDDEN_LIST_TWEETS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_BATCH_TWEETS_API_HANDOFF_SNIPPETS = [
  '## Direct batch tweet handoff',
  '`GET /x/tweets`',
  'CRM, warehouse, newsroom, moderation queue,',
  '[Get Tweet](/api-reference/x/get-tweet)',
  '[Search Tweets](/api-reference/x/search-tweets)',
  'const tweetsById = new Map(data.tweets.map',
  'const tweetRows = data.tweets.map((tweet) => {',
  'const author = tweet.author ?? {};',
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_name: author.name ?? null',
  'author_followers: author.followers ?? null',
  'author_verified: author.verified ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'const missingIds = ids.filter',
  'tweets_by_id = {tweet["id"]: tweet for tweet in data["tweets"]}',
  'tweet_rows = []',
  'author = tweet.get("author") or {}',
  '"author_id": author.get("id")',
  '"author_username": author.get("username")',
  '"author_name": author.get("name")',
  '"author_followers": author.get("followers")',
  '"author_verified": author.get("verified")',
  '"author_profile_picture": author.get("profilePicture")',
  'missing_ids = [tweet_id for tweet_id in ids if tweet_id not in tweets_by_id]',
  'shape durable tweet rows instead of printing',
  '`requested_ids`, `tweet_id`, `text`,',
  '`author_name`, `author_followers`, `author_verified`,',
  '`author_profile_picture`, `created_at`,',
  '`has_next_page`, and `next_cursor`',
  'Join returned tweets by',
  '`tweet_id` instead of relying on response order.',
  '<ResponseField name="profilePicture" type="string">',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
  '100 IDs per request',
  '`has_next_page: false`',
  '`next_cursor: ""`',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_BATCH_TWEETS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_BATCH_USERS_API_HANDOFF_SNIPPETS = [
  '## Direct batch user handoff',
  '`GET /x/users/batch`',
  'CRM, warehouse, enrichment, lead scoring,',
  '[Get User](/api-reference/x/twitter-profile-lookup)',
  'const profilesById = new Map(data.users.map',
  'const profileRows = data.users.map',
  'const missingIds = ids.filter',
  'profiles_by_id = {user["id"]: user for user in data["users"]}',
  'profile_rows = [',
  'missing_ids = [user_id for user_id in ids if user_id not in profiles_by_id]',
  'shape durable profile rows instead of printing',
  '`requested_ids`, `user_id`, `username`,',
  '`has_next_page`, and `next_cursor`',
  'Join returned users by `user_id` instead of relying on response order.',
  '100 IDs per request',
  '`has_next_page: false`',
  '`next_cursor: ""`',
  '`402 insufficient_credits`',
  '<Card title="Known IDs" icon="key-round">',
  '`requested_ids` for retry and audit rows',
  '<Card title="Profile rows" icon="user-round">',
  'Store each returned `id` as `user_id`',
  '<Card title="Missing rows" icon="triangle-alert">',
  'Compare returned `user_id` values with `requested_ids`',
  '<Card title="No pagination" icon="route">',
  'single-page batch contract',
  '## Which lookup endpoint?',
  '<Card title="One profile" icon="user-round">',
  '[`GET /x/users/{id}`](/api-reference/x/twitter-profile-lookup)',
  '<Card title="Many known IDs" icon="key-round">',
  'up to 100 comma-separated user IDs',
  '<Card title="Name or partial handle" icon="search">',
  '[`GET /x/users/search`](/api-reference/x/search-users)',
  '<Card title="Tweet IDs" icon="list">',
  '[`GET /x/tweets/batch`](/api-reference/x/batch-tweets)',
  '<Card title="Audience pages" icon="users">',
  '[`GET /x/users/{id}/followers`](/api-reference/x/followers)',
  '[`GET /x/users/{id}/following`](/api-reference/x/following)',
  '<Card title="Saved exports" icon="file-spreadsheet">',
  '[`Create extraction`](/api-reference/extractions/create)',
] as const;

const FORBIDDEN_BATCH_USERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_BOOKMARK_FOLDERS_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Bookmark Folders API & Saved Tweet Export"',
  '## Direct bookmark folder handoff',
  '`GET /x/bookmarks/folders`',
  'saved-tweet workflow, CRM enrichment job,',
  'authenticated X account',
  'Store `folder_id` and `folder_name`',
  '`has_next_page` stays `false`',
  '`next_cursor` stays empty',
  '[Bookmarks](/api-reference/x/bookmarks)',
  'const folderRows = data.folders.map((folder) => ({',
  'folder_id: folder.id',
  'folder_name: folder.name',
  'bookmarks_endpoint: `/x/bookmarks?folderId=${encodeURIComponent(folder.id)}`',
  'has_more_folders: data.has_next_page',
  'import json',
  'folder_rows = [',
  '"folder_id": folder["id"]',
  '"folder_name": folder["name"]',
  '"bookmarks_endpoint": f"/x/bookmarks?folderId={folder',
  '"has_more_folders": data["has_next_page"]',
  'shape durable bookmark folder rows instead of',
  '`folderRows` or `folder_rows`',
  'pass `folder_id` into `GET /x/bookmarks?folderId=...`',
  '## Twitter Bookmark Folder Workflow',
  '### 1. Discover Existing Folders',
  '### 2. Build a Folder Index',
  '### 3. Export Saved Tweets by Folder',
  '### 4. Resume and Audit the Export',
  '## Plan a Reliable Twitter Bookmark Folder Export',
  '### Store One Checkpoint per Folder',
  '### Define Folder Export Records',
  '## Twitter Bookmark Folder Questions',
  '### Do Twitter Bookmarks Have Folders?',
  '### Can This API Create or Rename Bookmark Folders?',
  '### Can I Access Folders from Mobile and Desktop?',
  '### How Do I Back Up Twitter Bookmark Folders?',
  '### What Errors Can Stop a Folder Export?',
  'https://docs.x.com/x-api/posts/bookmarks/introduction',
] as const;

const FORBIDDEN_BOOKMARK_FOLDERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_SEARCH_USERS_API_HANDOFF_SNIPPETS = [
  '## Direct user search handoff',
  '`GET /x/users/search`',
  'CRM, enrichment, creator discovery, support,',
  '[Get User](/api-reference/x/twitter-profile-lookup)',
  '[Get Users (Batch)](/api-reference/x/batch-users)',
  'const params = new URLSearchParams({ q: query });',
  'const response = await fetch(`https://xquik.com/api/v1/x/users/search?${params}`',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const searchRows = data.users.map',
  'search_query: query',
  'result_rank: index + 1',
  'user_id: user.id',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'search_rows = [',
  '"search_query": query',
  '"result_rank": index + 1',
  '"user_id": user["id"]',
  '"profile_image_url": user.get("profilePicture")',
  'shape durable search-result rows instead of',
  '`search_query`, `result_rank`, `user_id`,',
  '`has_next_page`,',
  '`next_cursor`',
  'pass it back as `cursor`',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_SEARCH_USERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_USER_MENTIONS_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Mentions Timeline API & Profile Alerts"',
  'Twitter mentions timeline API returns tweets that mention one X account.',
  'brand mentions, support inboxes, lead routing, and agent handoffs',
  '`GET /api/v1/x/users/{id}/mentions`',
  '# Username mentions timeline',
  'https://xquik.com/api/v1/x/users/username/mentions',
  '# Numeric user ID mentions timeline',
  'https://xquik.com/api/v1/x/users/44196397/mentions',
  '# Time-bounded mentions window',
  '--data-urlencode "sinceTime=1777392000"',
  '--data-urlencode "untilTime=1777478400"',
  '## Direct mention handoff',
  '`GET /x/users/{id}/mentions`',
  'support, community, brand monitoring,',
  'This mentions timeline endpoint accepts either a username or numeric user ID',
  '[`mentions`](/api-reference/extractions/create)',
  'CSV/JSON/XLSX file export',
  '## Which timeline endpoint?',
  'Use `GET /api/v1/x/users/{id}/mentions` for one user\'s mentions timeline.',
  'Use `GET /api/v1/x/users/{id}/tweets` for one user\'s profile timeline.',
  'Use `GET /api/v1/x/tweets/search` for keyword, operator, or advanced search.',
  'Use `GET /api/v1/x/timeline` for the authenticated account\'s home timeline.',
  'const mentionRows = page.tweets.map',
  'mentioned_user_id_or_username: userIdOrUsername',
  'tweet_id: tweet.id',
  'tweet_url: tweet.url ?? null',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'created_at: tweet.createdAt ?? null',
  'conversation_id: tweet.conversationId ?? null',
  'is_reply: tweet.isReply ?? false',
  'in_reply_to_id: tweet.inReplyToId ?? null',
  'media_urls: (tweet.media ?? []).map((item) => item.mediaUrl).filter(Boolean)',
  'page_cursor: pageCursor',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'user_id_or_username = "44196397"',
  'page_cursor = ""',
  'for page_index in range(3):',
  '"mentioned_user_id_or_username": user_id_or_username',
  '"tweet_id": tweet["id"]',
  '"tweet_url": tweet.get("url")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"is_reply": tweet.get("isReply", False)',
  '"in_reply_to_id": tweet.get("inReplyToId")',
  '"media_urls": [',
  'print(json.dumps(mention_row, separators=(",", ":")))',
  'write one JSON Lines row per mentioned tweet',
  '`mentioned_user_id_or_username`, `tweet_id`, `text`,',
  '`author_username`, `author_name`, `author_followers`, `author_verified`,',
  '`author_profile_picture`,',
  '`page_cursor`,',
  '`has_next_page`, and',
  '`next_cursor`. Treat `next_cursor` as opaque',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"profilePicture": "https://pbs.twimg.com/profile_images/customer/photo.jpg"',
  'Use `sinceTime`',
  '`has_next_page` is true',
  'window. Zero affordable results return `402 insufficient_credits`',
  '`402 insufficient_credits`',
  '## Build a mentions triage job',
  'support inbox, lead queue, campaign report, or',
  'bounded mention pages with resumable cursor state',
  '<Card title="Resolve the target" icon="user-round">',
  '<Card title="Bound the window" icon="calendar-range">',
  '<Card title="Route the row" icon="git-branch">',
  '<Card title="Cursor checkpoint" icon="database">',
  '"mentions_job_id": "brand-mentions-q2"',
  '"mentions_route": "GET /api/v1/x/users/{id}/mentions"',
  '"cursor_param": "cursor"',
  '"saved_export_tool": "mentions"',
] as const;

const FORBIDDEN_USER_MENTIONS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'mention_rows = [',
] as const;

const REQUIRED_VERIFIED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  'description: "Retrieve verified X followers by username or numeric user ID',
  'verified followers API',
  'X verified followers API',
  'Twitter verified followers API',
  'The canonical',
  '`GET /api/v1/x/users/{id}/verified-followers`',
  '```bash Username',
  '/x/users/username/verified-followers',
  '```bash Numeric user ID',
  '/x/users/44196397/verified-followers',
  '## Direct verified followers handoff',
  '`GET /x/users/{id}/verified-followers`',
  'CRM, warehouse, scoring, enrichment, or agent workflow',
  'The endpoint accepts either a username or numeric user ID',
  '`verified_follower_explorer`',
  '[Create extraction](/api-reference/extractions/create)',
  '[Export extraction](/api-reference/extractions/export)',
  'saved verified follower jobs',
  'CSV, JSON, or XLSX downloads',
  'CSV/JSON/XLSX file export',
  '<CardGroup cols={2}>',
  '<Card title="Verified rows"',
  '<Card title="Verification signals"',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`users[].verified` and `verifiedType`',
  '`has_next_page` and `next_cursor`',
  'const verifiedRows = data.users.map((user) => ({',
  'source_user_id: userId',
  'x_user_id: user.id',
  'verified_type: user.verifiedType ?? "standard"',
  'follower_count: user.followers ?? null',
  'profile_image_url: user.profilePicture ?? null',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'const checkpoint = { source_user_id: userId, next_cursor: nextCursor };',
  'import json',
  'user_id = "44196397"',
  'verified_rows = [',
  '"source_user_id": user_id',
  '"x_user_id": user["id"]',
  '"verified_type": user.get("verifiedType", "standard")',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'checkpoint = {"source_user_id": user_id, "next_cursor": next_cursor}',
  'shape durable verified follower rows instead of',
  '`verifiedRows` or `verified_rows`',
  'resume pagination with `next_cursor`',
  'Pass a cursor only when `has_next_page` is true.',
  '## Which verified follower endpoint?',
  '<Card title="Verified followers"',
  'Use `GET /x/users/{id}/verified-followers` for verified accounts that follow',
  '<Card title="All followers"',
  '[`GET /x/users/{id}/followers`](/api-reference/x/followers)',
  '<Card title="Following list"',
  '[`GET /x/users/{id}/following`](/api-reference/x/following)',
  '<Card title="Saved exports"',
  '1 credit per user returned',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_VERIFIED_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_FOLLOWERS_YOU_KNOW_API_HANDOFF_SNIPPETS = [
  'description: "Retrieve mutual X followers between the authenticated context',
  'mutual followers API',
  'followers you know API',
  'X mutual followers API',
  'Twitter mutual followers API',
  'The canonical endpoint remains',
  '`GET /api/v1/x/users/{id}/followers-you-know`',
  '```bash First page',
  '/x/users/44196397/followers-you-know',
  '```bash Next page',
  '--data-urlencode "cursor=abc123"',
  'const mutualRows = data.users.map((user) => ({',
  'target_user_id: userId',
  'const checkpoint = { target_user_id: userId, next_cursor: nextCursor };',
  'import json',
  'mutual_rows = [',
  '"target_user_id": user_id',
  'shape durable mutual follower rows instead of',
  'worker can resume pagination with `next_cursor`',
  '## Direct mutual followers handoff',
  '`GET /x/users/{id}/followers-you-know`',
  'sales, community, recruiting, support, CRM, or agent workflow',
  'The path `id` is the target numeric X user ID.',
  'people who follow both the authenticated context and the target user',
  '<CardGroup cols={2}>',
  '<Card title="Mutual rows"',
  '<Card title="Warm-intro labels"',
  '<Card title="Approved contact"',
  '[Direct message workflow](/guides/direct-message-workflow)',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[DM history](/api-reference/x/dm-history)',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`messageId`',
  'participant-scoped context',
  '`has_next_page` and `next_cursor`',
  'Target X user ID as a numeric string.',
  '[Get user](/api-reference/x/twitter-profile-lookup)',
  'Pass a cursor only when `has_next_page` is true.',
  '## Which follower graph endpoint?',
  '<Card title="Mutual followers"',
  'Use `GET /x/users/{id}/followers-you-know` for people who follow both',
  '<Card title="All followers"',
  '[`GET /x/users/{id}/followers`](/api-reference/x/followers)',
  '<Card title="Verified followers"',
  '[`GET /x/users/{id}/verified-followers`](/api-reference/x/verified-followers)',
  '<Card title="DM handoff"',
  '1 credit per user returned',
  '`402 insufficient_credits`',
] as const;

const FORBIDDEN_FOLLOWERS_YOU_KNOW_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data.users);',
  'console.log((await next.json()).users);',
  'print(data["users"])',
] as const;

const REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS = [
  'title: "Twitter Advanced Search API: CSV Export via REST"',
  'description: "Install the Python SDK with pip install x_twitter_scraper. Follow this step by step flow for specific accounts. Use from:username for one Twitter account."',
  'scrape tweets',
  "For hashtags search, pass the exact hashtag token. Respect API rate limits and X's Terms of Service. Store Twitter profiles separately from tweet rows.",
  '### How Do I Scrape Tweets Without Getting Blocked?',
  'Respect each rate limit and wait for retryAfter after a 429 response.',
  '## Export Twitter Data',
  'Use CSV with Google Sheets.',
  '### Scrape Tweets Python',
  'Use the [Python SDK](/sdks/python)',
  '### How Do I Build an Automated Twitter Data Pipeline With an API?',
  '### How to Schedule Recurring Tweet Exports Using a REST API',
  'incomplete destination upload',
  'A final function validates and writes tweet rows.',
  '## Build a Scheduled Tweet Export Pipeline',
  'A recurring tweet scraping workflow needs an explicit search window.',
  'Advance the schedule checkpoint only after the file becomes durable.',
  '## Validate Tweet Export Completeness',
  'Count unique Tweet IDs after every export.',
  'Check the first and last tweet creation times.',
  'Keep user profiles separate from tweet identity.',
  'Use monitors when the workflow needs real-time events.',
  '## When to use this workflow',
  'Use this workflow for repeatable keyword, hashtag, account, or campaign exports.',
  '## End-to-end export handoff',
  'Store one checkpoint that carries the search request through estimate, job creation, JSON pagination, and file export:',
  '## Choose the right path',
  'POST /extractions/estimate',
  'GET /extractions/{id}',
  'GET /x/tweets/search',
  'exact lookup from one stored Tweet ID or X status URL.',
  'CSV, JSON, or XLSX',
  'CSV, JSON, and XLSX exports support up to 100,000 rows.',
  '## Filter fields to operators',
  'tweet_search_extractor merges structured fields into searchQuery before the job runs.',
  'Poll by tweet_search_extraction_id',
  'Do not wait for totalResults or createdAt in the create response',
  'tweets[].id, tweets[].text, and tweets[].createdAt',
  'tweets[].author.id, tweets[].author.username, has_next_page, and next_cursor',
  'xquik-tweet-search.jsonl',
  'Leave limit unset for a simple cursor-driven page loop',
  'q=from:username&sinceTime=2026-05-01&untilTime=2026-05-02 behaves like',
  'time-ordered backfills',
  'normal search ranking',
  'When a bounded request sets limit, q=from:username',
  'selects a user timeline pull',
  'single page with has_next_page: false',
  'search pagination for that user',
  'credit per tweet returned.',
  '## Failure handling',
  'Treat every failure as a stopped checkpoint, not a reason to skip tweets.',
  'Honor retryAfter after a 429 response.',
  'Treat a failed extraction status as terminal for that job.',
  'Mark every interrupted export as partial.',
  '## Handoff checklist',
  'Record the terminal status, export format, file name, checksum, byte size, row count, and unique Tweet count.',
  'Preserve Tweet ID, text, author ID, username, display name, and creation time.',
  'Name the downstream owner and destination.',
  'Advance the checkpoint only after this final confirmation.',
] as const;

const REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS = [
  'Search tweets by keyword, ID, or URL. Return text, authors, replies, metrics, media, and cursors for CRM, agents, or exports.',
  'Use Search Tweets as an advanced Twitter search API for keywords, hashtags,',
  'operators, dates, authors, media, and engagement filters.',
  'send a Tweet ID or X status URL',
  'with no time params',
  '[Search user tweets](/api-reference/x/user-tweets)',
  '`GET /x/users/{id}/tweets`',
  'Date params append `since:` and `until:`',
  '`q=from:username&sinceTime=2026-05-01&untilTime=2026-05-02` stays on search.',
  '## Direct API handoff',
  '`GET /x/tweets/search`',
  'app, queue worker, CRM enrichment job, or',
  'agent needs the latest matching tweets',
  'It returns paginated JSON for live search pages and app ingestion.',
  'The examples',
  'above write JSON Lines rows with tweet fields, author ID, username, display',
  'name, follower count, verified state, profile image URL, media, and cursor',
  'resume from the last saved `next_cursor`',
  'Use [`tweet_search_extractor`](/guides/tweet-scraper-csv-export) instead when a team',
  'needs an estimate, extraction ID, saved result pages, or CSV, JSON, and XLSX',
  '<Card title="Live search page" icon="search">',
  'Call `GET /x/tweets/search` with `q`, filters, `queryType`, `limit`, and',
  '`cursor` for low-latency JSON rows.',
  '<Card title="Exact tweet lookup" icon="hash">',
  'source queue stores links.',
  '<Card title="Saved export job" icon="archive">',
  'Run `tweet_search_extractor` for estimates, job status, stored pages, and',
  'downloadable files.',
  'const searchRows = page.tweets.map',
  'tweet_id: tweet.id',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'media_urls: (tweet.media ?? []).map',
  'page_index: pageIndex',
  'page_cursor: pageCursor',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'For CSV or XLSX output,',
  'project the returned `tweets[]` rows locally',
  '`tweet_search_extractor`',
  '`tweets[]`',
  '`tweets[].id`',
  '`tweets[].author.id`, `tweets[].author.username`, `tweets[].author.name`',
  '`tweets[].author.followers`, `tweets[].author.verified`, and',
  '`tweets[].author.profilePicture` for author joins and enrichment.',
  '`has_next_page` and `next_cursor`',
  '<Card title="File exports" icon="file-spreadsheet">',
  'Use `tweet_search_extractor` when the output must be saved CSV, JSON, or XLSX.',
  'Maximum number of tweets to collect in one bounded request (1-200).',
  'For explicit `limit` pulls, treat `limit` as a batch-size upper bound.',
  'response returns fewer tweets than `limit` and `has_next_page` is `true`',
  'continue with the same `q`, structured filters, `queryType`,',
  'and `limit` plus `cursor`.',
  'For account date windows, `sinceTime` and `untilTime` append',
  '`q=from:username&sinceTime=2026-05-01&untilTime=2026-05-02` behaves like',
  'ranked search',
  'For bounded `limit`, bare `q=from:username` with no time params',
  'timeline pull',
  '`has_next_page: false`',
  'use `fromUser` with a keyword',
  'search pagination',
  'For exact lookups, a plain Tweet ID or X status URL in `q` returns that tweet',
  'empty final page for exact IDs.',
  'For bounded',
  '`limit` batches, keep the same query, filters, `queryType`, and `limit`',
  'De-duplicate stable IDs and reject repeated cursors.',
  'partial',
  '### Structured filters',
  'Structured filters are part of the public Search Tweets API.',
  'Keep the same filters on every',
  'cursor request.',
  '<TweetResultFilterParams />',
  '### Search-only operators',
  '<TweetSearchOnlyFilterParams />',
  'fromUser',
  'mediaType',
  'verifiedOnly',
  'advancedQuery',
  '[Tweet Search Export Workflow](/guides/tweet-scraper-csv-export)',
  'saved CSV, JSON, or XLSX files',
  '1 credit per tweet returned',
  'A plain Tweet ID or X status URL returns the exact tweet when available.',
  '`402 insufficient_credits`',
  '`Retry-After`',
] as const;

const FORBIDDEN_SEARCH_TWEETS_DIRECT_FILE_EXPORT_SNIPPETS = [
  'return paginated tweet data for CSV, JSON, XLSX, CRM, or agent handoff',
  'It is the fastest path for live search pages, JSON ingestion, and small CSV or XLSX projections.',
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log(page.tweets);',
  'data = response.json()',
  'print(data["tweets"])',
  'fmt.Println(string(body))',
  'that count in one bounded request with no cursor handoff.',
  'Do not combine `limit` with `cursor` for page-by-page loops.',
] as const;

const TWEET_LIST_FILTER_API_PAGES = [
  'api-reference/x/user-tweets.mdx',
  'api-reference/x/user-likes.mdx',
  'api-reference/x/user-media.mdx',
  'api-reference/x/user-mentions.mdx',
  'api-reference/x/tweet-quotes.mdx',
] as const;

const REQUIRED_TWEET_LIST_FILTER_SNIPPETS = [
  'import TweetResultFilterParams from "/snippets/tweet-result-filter-params.mdx";',
  '### Tweet result filters',
  'These optional filters apply to `tweets[]` returned by this route.',
  'filter rows after each page is fetched',
  '<TweetResultFilterParams />',
] as const;

const HIGH_VALUE_ROW_HANDOFF_API_PAGES = [
  {
    file: 'api-reference/x/search-tweets.mdx',
    label: 'Search tweets endpoint page',
  },
  {
    file: 'api-reference/x/user-tweets.mdx',
    label: 'User tweets endpoint page',
  },
  {
    file: 'api-reference/x/user-likes.mdx',
    label: 'User likes endpoint page',
  },
  {
    file: 'api-reference/x/user-media.mdx',
    label: 'User media endpoint page',
  },
  {
    file: 'api-reference/x/user-mentions.mdx',
    label: 'User mentions endpoint page',
  },
  {
    file: 'api-reference/x/bookmarks.mdx',
    label: 'Bookmarks endpoint page',
  },
  {
    file: 'api-reference/x/timeline.mdx',
    label: 'Timeline endpoint page',
  },
  {
    file: 'api-reference/x/tweet-replies.mdx',
    label: 'Tweet replies endpoint page',
  },
  {
    file: 'api-reference/x/followers.mdx',
    label: 'Followers endpoint page',
  },
  {
    file: 'api-reference/x-write/create-tweet.mdx',
    label: 'Create tweet endpoint page',
  },
  {
    file: 'api-reference/x-write/upload-media.mdx',
    label: 'Upload media endpoint page',
  },
  {
    file: 'api-reference/x-write/send-dm.mdx',
    label: 'Send DM endpoint page',
  },
] as const;

const FORBIDDEN_HIGH_VALUE_ROW_HANDOFF_RAW_RESPONSE_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data);',
  'console.log(data.tweets);',
  'console.log(page.tweets);',
  'console.log((await next.json()).tweets);',
  'JSON.stringify(data, null, 2)',
  'process.stdout.write(JSON.stringify(data, null, 2));',
  'data = response.json()',
  'print(data)',
  'print(data["tweets"])',
  'print(json.dumps(data, indent=2))',
  'var data map[string]interface{}',
  'fmt.Println(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_BOOKMARKS_API_HANDOFF_SNIPPETS = [
  'title: "Export Twitter Bookmarks with Twitter Bookmarks API"',
  '## Bookmarks handoff',
  '`GET /x/bookmarks`',
  'reading list, CRM, research queue, or agent',
  'The examples write JSON Lines rows',
  'bookmark source, folder ID, tweet ID, tweet URL, text, author ID,',
  'username, display name, follower count, verified state, profile image URL,',
  'Store the last saved',
  '`next_cursor` per folder',
  'const bookmarkFolderId = "";',
  'const bookmarkRows = page.tweets.map',
  'bookmark_source: bookmarkFolderId === "" ? "all_bookmarks" : "folder"',
  'folder_id: bookmarkFolderId || null',
  'tweet_url: tweet.url ?? null',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'bookmark_folder_id = ""',
  'params["folderId"] = bookmark_folder_id',
  '"bookmark_source": "all_bookmarks" if not bookmark_folder_id else "folder"',
  '"folder_id": bookmark_folder_id or None',
  '"tweet_url": tweet.get("url")',
  '"author_id": (tweet.get("author") or {}).get("id")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  'print(json.dumps(bookmark_row, separators=(",", ":")))',
  '## Twitter Bookmark API Questions',
  '### How Do I Export Twitter Bookmarks?',
  '### How Does Bookmark Authentication Work?',
  "### Can I Export Another User's Bookmarks?",
  '### How Do Bookmark Folders Work?',
  '### What Limits a Bookmark Export?',
  '### How Should I Store a Bookmark Export?',
  'https://docs.x.com/x-api/posts/bookmarks/introduction',
  'This object contains the tweet author profile. X may omit it.',
  '<ResponseField name="profilePicture" type="string">This value contains the profile picture URL.',
  'This value records the follower count. X may omit it.',
  '<Card title="All saved tweets" icon="bookmark">',
  '<Card title="Folder export" icon="folder">',
  '[Bookmark Folders](/api-reference/x/bookmark-folders)',
  '<Card title="Cursor checkpoint" icon="arrow-right">',
  '<Card title="Account-scoped queue" icon="lock-keyhole">',
  'Keep saved-tweet rows in account-scoped research, CRM, or agent memory',
  '## Which saved-feed endpoint?',
  '<Card title="Saved tweets" icon="bookmark">',
  '<Card title="Bookmark folders" icon="folder">',
  '[`GET /x/bookmarks/folders`](/api-reference/x/bookmark-folders)',
  '<Card title="Home timeline" icon="house">',
  '[`GET /x/timeline`](/api-reference/x/timeline)',
  '<Card title="Notifications" icon="bell">',
  '[`GET /x/notifications`](/api-reference/x/notifications)',
] as const;

const FORBIDDEN_BOOKMARKS_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log((await next.json()).tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_TIMELINE_API_HANDOFF_SNIPPETS = [
  '## Home timeline handoff',
  '`GET /x/timeline`',
  "authenticated account's home feed",
  'The examples write JSON Lines rows',
  'author ID, username, display name,',
  'follower count, verified state, profile image URL',
  '`seenTweetIds`, and cursor fields',
  'pass them as `seenTweetIds` with the last saved `next_cursor`',
  'const seenTweetIds = new Set();',
  'const timelineRows = page.tweets.map',
  'timeline_source: "home"',
  'tweet_url: tweet.url ?? null',
  'author_id: tweet.author?.id ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'seen_tweet_ids = set()',
  'params["seenTweetIds"] = ",".join(sorted(seen_tweet_ids))',
  'seen_tweet_ids.add(tweet["id"])',
  '"timeline_source": "home"',
  '"tweet_url": tweet.get("url")',
  '"author_id": (tweet.get("author") or {}).get("id")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  'print(json.dumps(timeline_row, separators=(",", ":")))',
  'Returns the tweet author when available.',
  '<ResponseField name="profilePicture" type="string">Returns the profile image URL',
  '"followers": 150000000',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
  '<Card title="Home feed rows" icon="house">',
  'timeline_source: "home"',
  '<Card title="Seen tweet dedupe" icon="list-checks">',
  'Add processed tweet IDs to `seenTweetIds`',
  '<Card title="Cursor checkpoint" icon="arrow-right">',
  'Pass `next_cursor` back as `cursor`',
  '<Card title="Account-scoped sync" icon="lock-keyhole">',
  'Keep home timeline rows in account-scoped inbox, CRM, monitor seed, or agent',
  '## Which timeline endpoint?',
  '<Card title="Home timeline" icon="house">',
  '<Card title="Profile timeline" icon="user-round">',
  '[`GET /x/users/{id}/tweets`](/api-reference/x/user-tweets)',
  '<Card title="Mentions timeline" icon="at-sign">',
  '[`GET /x/users/{id}/mentions`](/api-reference/x/user-mentions)',
  '<Card title="Saved tweets" icon="bookmark">',
  '[`GET /x/bookmarks`](/api-reference/x/bookmarks)',
  '<Card title="Notifications" icon="bell">',
  '[`GET /x/notifications`](/api-reference/x/notifications)',
  '<Card title="Monitor events" icon="radio">',
  '[`List events`](/api-reference/events/list)',
] as const;

const FORBIDDEN_TIMELINE_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log((await next.json()).tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_USER_TWEETS_API_HANDOFF_SNIPPETS = [
  'title: "Search User Tweets, Profile Timeline & Cursors"',
  'Search user tweets returns the public profile timeline for one Twitter or X',
  '"user tweets," "profile',
  'account. Use it for "user tweets," "profile timeline," or "X user timeline"',
  '`GET /api/v1/x/users/{id}/tweets`',
  '# Username profile timeline',
  'https://xquik.com/api/v1/x/users/elonmusk/tweets',
  '# Numeric user ID profile timeline',
  'https://xquik.com/api/v1/x/users/44196397/tweets',
  '--data-urlencode "includeReplies=true"',
  '--data-urlencode "includeParentTweet=true"',
  '## User timeline handoff',
  '`GET /x/users/{id}/tweets`',
  'CRM, queue worker, or warehouse job needs',
  'one user\'s profile timeline.',
  'This endpoint accepts either a username or numeric',
  'username or numeric user ID',
  'The examples above write JSON Lines rows',
  'source profile, tweet ID,',
  '## Which timeline endpoint?',
  'Use `GET /api/v1/x/users/{id}/tweets` for one user\'s profile timeline. It',
  'returns original profile posts by default.',
  'Add `includeReplies=true` when the sync needs replies, and add',
  '`includeParentTweet=true` when reply rows need parent context.',
  'Use `GET /api/v1/x/users/{id}/media` when every returned row should contain',
  'profile media.',
  'Use `GET /api/v1/x/tweets/search` for keyword, operator, or advanced search.',
  'Use `GET /api/v1/x/timeline` for the authenticated account\'s home timeline.',
  'follower count, verified state, profile',
  'image URL, reply context, engagement counts, media URLs,',
  'resume from the last saved `next_cursor`',
  '## Build a profile timeline job',
  'switch between plain profile',
  '<Card title="Original posts" icon="list">',
  'Omit `includeReplies` to fetch the profile timeline without replies.',
  '<Card title="Replies with context" icon="message-square">',
  '`includeReplies=true` and `includeParentTweet=true`',
  '<Card title="Media timeline" icon="image">',
  '[`User media`](/api-reference/x/user-media)',
  '<Card title="Cursor checkpoint" icon="database">',
  '"timeline_job_id": "profile-timeline-q2"',
  '"timeline_route": "GET /api/v1/x/users/{id}/tweets"',
  '"include_replies": true',
  '"include_parent_tweet": true',
  '"cursor_param": "cursor"',
  '"media_handoff_route": "GET /api/v1/x/users/{id}/media"',
  'const timelineRows = page.tweets.map',
  'source_user_id_or_username: userIdOrUsername',
  'tweet_id: tweet.id',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'is_reply: tweet.isReply ?? false',
  'in_reply_to_id: tweet.inReplyToId ?? null',
  'media_urls: (tweet.media ?? []).map',
  'page_cursor: pageCursor',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'user_id_or_username = "44196397"',
  '"source_user_id_or_username": user_id_or_username',
  '"tweet_id": tweet["id"]',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"is_reply": tweet.get("isReply", False)',
  '"in_reply_to_id": tweet.get("inReplyToId")',
  'print(json.dumps(timeline_row, separators=(",", ":")))',
  'Tweet author profile. Omitted if unavailable.',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
] as const;

const FORBIDDEN_USER_TWEETS_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log(page.tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_USER_LIKES_API_HANDOFF_SNIPPETS = [
  '## User likes handoff',
  '`GET /x/users/{id}/likes`',
  'CRM, warehouse, recommendation job, or',
  'The examples above write JSON',
  'Lines rows with the liked-by user',
  'liked tweet ID, text, tweet URL, author ID,',
  'username, display name, follower count, verified state, profile image URL,',
  'the last saved `next_cursor`',
  'const likedRows = page.tweets.map',
  'liked_by_user_id: userId',
  'liked_tweet_id: tweet.id',
  'tweet_url: tweet.url ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'media_urls: (tweet.media ?? []).map',
  'page_cursor: pageCursor',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'user_id = "44196397"',
  '"liked_by_user_id": user_id',
  '"liked_tweet_id": tweet["id"]',
  '"tweet_url": tweet.get("url")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"media_urls": [',
  'print(json.dumps(liked_row, separators=(",", ":")))',
  'Tweet author profile. Omitted if unavailable.',
  '**Author object fields:**',
  '<ResponseField name="id" type="string">Author user ID.',
  '<ResponseField name="username" type="string">Author handle without `@`.',
  '<ResponseField name="name" type="string">Author display name.',
  '<ResponseField name="followers" type="number">Follower count.',
  '<ResponseField name="verified" type="boolean">Whether the author is verified.',
  '<ResponseField name="profilePicture" type="string">Author profile image URL.',
] as const;

const FORBIDDEN_USER_LIKES_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log((await next.json()).tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_USER_MEDIA_API_HANDOFF_SNIPPETS = [
  '## User media handoff',
  '`GET /x/users/{id}/media`',
  'gallery, moderation queue, warehouse, or',
  'The examples above write JSON',
  'Lines rows with the source user',
  'media tweet ID, text, tweet URL, author ID,',
  'username, display name, follower count, verified state, profile image URL,',
  'resume from the last saved `next_cursor`',
  '## Which media endpoint?',
  'Use `GET /api/v1/x/users/{id}/media` when every row must be a media tweet',
  'from one profile. Store `media_urls`, `media_types`, `media_tweet_id`,',
  '`page_cursor`, `next_cursor`, and `has_next_page`.',
  'Use `GET /api/v1/x/users/{id}/tweets` when the sync also needs non-media',
  'posts or replies.',
  'Use `GET /api/v1/x/tweets/{id}` when you already know one tweet ID and need',
  'its media plus full tweet detail.',
  'Use `POST /api/v1/x/media` only to host or validate a local file or HTTPS',
  'media URL before a write. Pass `mediaUrl` to `POST /api/v1/x/tweets`, or pass',
  '`mediaId` as the only `media_ids` item for `POST /api/v1/x/dm/{userId}`.',
  'const mediaRows = page.tweets.map',
  'source_user_id: userId',
  'media_tweet_id: tweet.id',
  'tweet_url: tweet.url ?? null',
  'author_username: tweet.author?.username ?? null',
  'author_name: tweet.author?.name ?? null',
  'author_followers: tweet.author?.followers ?? null',
  'author_verified: tweet.author?.verified ?? null',
  'author_profile_picture: tweet.author?.profilePicture ?? null',
  'media_urls: (tweet.media ?? []).map',
  'media_types: (tweet.media ?? []).map',
  'page_cursor: pageCursor',
  'process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'user_id = "44196397"',
  '"source_user_id": user_id',
  '"media_tweet_id": tweet["id"]',
  '"tweet_url": tweet.get("url")',
  '"author_username": (tweet.get("author") or {}).get("username")',
  '"author_name": (tweet.get("author") or {}).get("name")',
  '"author_followers": (tweet.get("author") or {}).get("followers")',
  '"author_verified": (tweet.get("author") or {}).get("verified")',
  '"author_profile_picture": (tweet.get("author") or {}).get("profilePicture")',
  '"media_urls": [',
  '"media_types": [item["type"] for item in media_items if item.get("type")]',
  'print(json.dumps(media_row, separators=(",", ":")))',
  'Tweet author profile. Omitted if unavailable.',
  '**Author object fields:**',
  '<ResponseField name="id" type="string">Author user ID.',
  '<ResponseField name="username" type="string">Author handle without `@`.',
  '<ResponseField name="name" type="string">Author display name.',
  '<ResponseField name="followers" type="number">Follower count.',
  '<ResponseField name="verified" type="boolean">Whether the author is verified.',
  '<ResponseField name="profilePicture" type="string">Author profile image URL.',
] as const;

const FORBIDDEN_USER_MEDIA_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log((await next.json()).tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_EXTRACTION_WORKFLOW_SNIPPETS = [
  'Scrape tweets, export followers, estimate credits, start extraction jobs, paginate JSON results, and export CSV, JSON, or XLSX files',
  'Run bulk data extractions from X in 5 stages:',
  'Use this workflow to scrape tweets, export followers, pull tweet replies, save CSV/JSON/XLSX files, or hand paginated JSON to a CRM, warehouse, queue, or AI agent.',
  'Extract visible replies to this tweet: `https://x.com/vercel/status/1893704267862470862`',
  'Treat `202 Accepted` as a queued run receipt.',
  'Credits are reserved after the job starts.',
  'Poll `GET /extractions/{id}` before handoff',
  'The run can lower `resultsLimit` to the affordable count',
  'fail with `insufficient_credits`',
  'An active plan is not required when enough',
  '<Step title="Export files">',
  'Submit the extraction job, store the `202 Accepted` receipt, then poll before handoff.',
  '## End-to-end agent handoff',
  'Store one checkpoint per extraction run so another worker can resume without rereading logs:',
  '"workflow": "reply_extractor_to_csv"',
  '"estimatedResults": 500',
  '"creditsRequired": "500"',
  '"creditsAvailable": "77000"',
  '"allowed": true',
  '"source": "replyCount"',
  '"poll_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"json_pages": {',
  '"page_cursor": null',
  '"next_cursor": "990200"',
  '"has_more": true',
  '"inventory_path": "/api/v1/extractions?status=completed&toolType=reply_extractor"',
  '"export_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=csv"',
  '"handoff_state": "poll_until_completed_then_export"',
  '<Card title="Estimate checkpoint" icon="calculator">',
  'Store `estimatedResults`, `creditsRequired`, `creditsAvailable`, `allowed`, and `source` before creating the job.',
  'When `resultsLimit` is lower than the source estimate',
  '`source: "resultsLimit"`',
  'Otherwise it keeps the source count',
  '<Card title="Create receipt" icon="clipboard-check">',
  'Store the returned job `id`, `status`, and `poll_path`',
  '<Card title="Cursor state" icon="shuffle">',
  'Store `page_cursor`, `next_cursor`, and `has_more` for each JSON page',
  '<Card title="File handoff" icon="download">',
  'Store `inventory_path` for later job lookup and `export_path`',
  '## Step 4: Retrieve results',
  'row count, cursor, and format before',
  '## Data handoff',
  '`job`, `results`, `hasMore`, `nextCursor`',
  'Use `limit` up to 1,000 and pass `nextCursor` as `after`',
  '`xUserId`, `xUsername`, `tweetId`, `tweetText`, `createdAt`',
  'Paginated JSON is not row-capped by the export limit.',
  'File exports are capped at 100,000 rows, and PDF exports are capped at 10,000 rows.',
  '### Durable JSON Lines handoff',
  'Use JSON Lines when a queue, warehouse, or agent needs replayable rows without the export row cap.',
  '"page_cursor": "990100"',
  '"next_cursor": "990200"',
  '"handoff_format": "jsonl"',
  '`xquik-extraction-results.jsonl`',
  'Keep `page_cursor` and `next_cursor` so the job can resume from the last successful page.',
  'Use structured fields first for common jobs such as search tweets from a user, search tweet replies, scrape tweets with images, or export posts in a date range.',
  'Use `advancedQuery` only when you already know the X search operator string you want to append.',
  '`502 x_api_unavailable` means the read service is temporarily unavailable.',
  'Retry with exponential backoff, then contact support if the error persists.',
] as const;

const REQUIRED_RESPONSE_FORMATS_EXPORTS_SNIPPETS = [
  'title: "Twitter API CSV, JSON & XLSX Export Formats"',
  'Export tweets, followers, following, replies, profiles, and draw rows through JSON pages or CSV, JSON, XLSX, Markdown, PDF, and TXT files with checkpoints.',
  '"Twitter API CSV export"',
  '"Twitter API JSON"',
  'It does not download tweet images or',
  'does not export your private X account archive.',
  '## Choose the Output Shape',
  '<Card title="Live JSON Page" icon="radio">',
  '`GET /api/v1/x/tweets/search`',
  '`GET /api/v1/x/users/{id}/tweets`',
  '`GET /api/v1/x/users/{id}/followers`',
  '<Card title="Saved JSON Rows" icon="rows-3">',
  '`GET /api/v1/extractions/{id}?limit=1000&after={nextCursor}`',
  '`job`,',
  '`results`,',
  '`hasMore`,',
  'optional `nextCursor`',
  '<Card title="File Export" icon="download">',
  '`GET /api/v1/extractions/{id}/export?format=csv`',
  '<Card title="Draw Export" icon="trophy">',
  '`GET /api/v1/draws/{id}/export?format=csv&type=winners`',
  '## Output Decision Map',
  '<Card title="Worker or Queue" icon="route">',
  'append JSON Lines',
  '## Match the Format to the Handoff',
  'They also neutralize spreadsheet formula prefixes in result cells.',
  '## Pagination and Cursor Map',
  'Direct X API pages expose endpoint-specific cursor fields such as',
  '`has_next_page` and `next_cursor`',
  'Extraction result pages use `hasMore` and `nextCursor`.',
  'Pass `nextCursor` back',
  'as `after`',
  'use `limit` up to `1000`; the default is `100`',
  'File exports do not paginate.',
  'File exports are capped at 100,000 rows, and PDF',
  'exports are capped at 10,000 rows.',
  'The file endpoint returns the first 100,000 rows ordered by result ID.',
  '## Format Map',
  '<Card title="CSV" icon="table">',
  '`text/csv; charset=utf-8`',
  '<Card title="JSON File" icon="braces">',
  '`application/json; charset=utf-8`',
  '<Card title="XLSX" icon="file-spreadsheet">',
  '`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`',
  '<Card title="Markdown" icon="file-text">',
  '<Card title="PDF" icon="file-down">',
  '<Card title="TXT" icon="file">',
  '## Download and Validate an Export',
  '--remote-header-name --remote-name',
  'Match `Content-Type` to the requested format.',
  'Calculate a local checksum when an audit requires one.',
  '## Handoff Checkpoint',
  '"source": "xquik.response_formats"',
  '"detail_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890?limit=1000"',
  '"export_paths": {',
  '"draw_export_path": "/api/v1/draws/f4bd00a2-7b4e-4e59-8e1b-72e2c9f12345/export?format=csv&type=winners"',
  '"nextCursor": "991200"',
  '"requested_format": "csv"',
  '"expected_content_type": "text/csv; charset=utf-8"',
  '"server_filename": "extraction-follower_explorer-2026-08-02.csv"',
  '"parsed_rows": 5000',
  '"local_sha256": "calculated-after-download"',
  '## Handle Export Failures',
  '`400 invalid_format`',
  '## Twitter API Export Questions',
  '### How Do I Export Twitter API Results to CSV?',
  '### Can I Export More Than 100,000 Rows?',
  '### What Is the Difference Between `md` and `md-document`?',
  '### Does This Download Twitter Images or Videos?',
  'Do not print downloaded export bytes to shared logs.',
  'Store the `Content-Disposition` filename',
] as const;

const FORBIDDEN_RESPONSE_FORMATS_EXPORTS_SNIPPETS = [
  '| Format |',
  'console.log(await response.text())',
  'const blob = await response.blob();',
  'only supports CSV',
] as const;

const REQUIRED_TRENDS_REGION_SNIPPETS = [
  '<CardGroup cols={3}>',
  '<Card title="Global & Americas" icon="globe">',
  '`1` - Worldwide',
  '`23424977` - United States',
  '`23424775` - Canada',
  '`23424900` - Mexico',
  '`23424768` - Brazil',
  '<Card title="Europe" icon="map-pin">',
  '`23424975` - United Kingdom',
  '`23424969` - Turkey',
  '`23424950` - Spain',
  '`23424829` - Germany',
  '`23424819` - France',
  '<Card title="Asia" icon="building-2">',
  '`23424856` - Japan',
  '`23424848` - India',
] as const;

const REQUIRED_TRENDS_GUIDE_COPY_SNIPPETS = [
  'description: "Find ranked X trends by WOEID region, preserve each trend query and rank, then search matching tweets with cursor pagination. Includes exact API steps."',
  'Xquik returns ranked X trends for 12 supported WOEID regions.',
  "Use each trend's",
  '`query` with [Search Tweets](/api-reference/x/search-tweets)',
  'Each trend includes a `name`, optional `description`, optional `rank`, and',
  'optional `query` string',
  'Defaults to',
  '`30`; valid values are `1` through `50`.',
  '## Compare Twitter Topic Trends Over Time',
  '`captured_at`: your UTC collection timestamp',
  '`current_rank`, `previous_rank`, and `best_rank`',
  '## Build a Multi-Region Twitter Trends Monitor',
  'city identifiers return `400 invalid_input`.',
  '## Search Tweets Behind a Trend',
  'manually encode it before using these examples.',
  'Use cursor pagination when you need more than one search page.',
  '## Handle Trend Request Failures',
  '### Can I Get Historical Twitter Trends?',
  '### Can I Request City-Level Twitter Trends?',
  '### Is Xquik the Official X Trends API?',
] as const;

const FORBIDDEN_TRENDS_REGION_SNIPPETS = [
  '| WOEID | Region |',
  '|-------|--------|',
  '| `23424977` | United States |',
  '| `23424975` | United Kingdom |',
  'cached in-process',
  'tweet volumes',
  'tweet volume',
  'Data refreshes with each request',
] as const;

const REQUIRED_EXTRACTION_CREATE_TOOL_TYPE_SNIPPETS = [
  '<ParamField body="queryType" type="string">',
  'Search sort for `tweet_search_extractor` and `community_search`.',
  'Defaults to `Latest` for tweet search exports and `Top` for community search jobs.',
  '<ParamField body="includeReplies" type="boolean">',
  'Include reply tweets for `post_extractor`.',
  'Omit or set to `false` to extract profile posts without replies.',
  'Each extraction job needs one target field based on `toolType`.',
  '`resultsLimit`',
  '<Card title="Tweet target" icon="message-circle">',
  'Use `targetTweetId` for tweet-centered jobs:',
  '`article_extractor` extracts article content from a tweet.',
  '`favoriters` extracts visible users who liked a post.',
  '`quote_extractor` extracts users who quote-tweeted a tweet.',
  '`reply_extractor` extracts users who replied to a tweet.',
  '`repost_extractor` extracts users who retweeted a tweet.',
  '`thread_extractor` extracts all tweets in a thread.',
  '<Card title="Username target" icon="user">',
  'Use `targetUsername` for account-centered jobs:',
  '`follower_explorer` extracts followers of an account.',
  '`following_explorer` extracts accounts followed by a user.',
  '`mention_extractor` extracts tweets mentioning an account.',
  '`post_extractor` extracts posts from an account.',
  '`user_likes` extracts tweets liked by a user.',
  '`user_media` extracts media posts from a user.',
  '`verified_follower_explorer` extracts verified followers of an account.',
  '<Card title="Community target" icon="users">',
  'Use `targetCommunityId` for community jobs:',
  '`community_extractor` extracts members of a community.',
  '`community_moderator_explorer` extracts moderators of a community.',
  '`community_post_extractor` extracts posts from a community.',
  '<Card title="Search query" icon="search">',
  'Use `searchQuery` for keyword jobs:',
  '`community_search` searches matching posts within that community and also requires `searchQuery`.',
  '`people_search` searches for users by keyword.',
  '`tweet_search_extractor` searches and extracts tweets by keyword or hashtag.',
  '<Card title="List target" icon="list">',
  'Use `targetListId` for X List jobs:',
  '`list_follower_explorer` extracts followers of a list.',
  '`list_member_extractor` extracts members of a list.',
  '`list_post_extractor` extracts posts from a list.',
  '<Card title="Space target" icon="radio">',
  'Use `targetSpaceId` for Space jobs:',
  '`space_explorer` extracts participants of a Space.',
  'Store `targetSpaceId` beside the returned extraction `id`.',
  '[Get Extraction](/api-reference/extractions/twitter-extraction-results)',
  '[Export Extraction](/api-reference/extractions/export)',
  'read participant user rows.',
] as const;

const FORBIDDEN_EXTRACTION_CREATE_TOOL_TYPE_SNIPPETS = [
  '| Tool Type | Required Field | Description |',
  '| `article_extractor` | `targetTweetId` |',
  '| `follower_explorer` | `targetUsername` |',
  '| `community_extractor` | `targetCommunityId` |',
  '| `tweet_search_extractor` | `searchQuery` |',
  '| `list_member_extractor` | `targetListId` |',
  '| `space_explorer` | `targetSpaceId` |',
] as const;

const REQUIRED_EXTRACTION_CREATE_RECEIPT_SNIPPETS = [
  '## Run receipt handoff',
  'Treat the `202 Accepted` body as a run receipt, not as extracted data.',
  '"receipt_format": "extraction_job"',
  '"poll_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"inventory_path": "/api/v1/extractions?status=completed&toolType=reply_extractor"',
  '"export_path_after_complete": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=csv"',
  '<Card title="Receipt fields" icon="clipboard-check">',
  'Store `id`, `toolType`, and `status`.',
  '`totalResults`, `createdAt`, `hasMore`, or `nextCursor` in this response.',
  '<Card title="Poll results" icon="rotate-cw">',
  'to read `job.status`, paginated `results`, `hasMore`, and `nextCursor`.',
  '<Card title="Find later" icon="list">',
  'Use [List Extractions](/api-reference/extractions/twitter-scraping-job-history) with `status` and',
  '<Card title="Export after completion" icon="download">',
  'Use [Export Extraction](/api-reference/extractions/export) after the detail',
] as const;

const FORBIDDEN_EXTRACTION_CREATE_RECEIPT_SNIPPETS = [
  '"results": [',
  '"hasMore": true',
  'const results = data.results',
] as const;

const REQUIRED_EXTRACTION_ESTIMATE_HANDOFF_SNIPPETS = [
  '## Estimate Twitter API Scraping Cost',
  '| Search tweets with filters | `tweet_search_extractor` | `searchQuery` |',
  '| Export tweet replies | `reply_extractor` | `targetTweetId` |',
  '| Export followers | `follower_explorer` | `targetUsername` |',
  '| Export following | `following_explorer` | `targetUsername` |',
  '| Export profile tweets | `post_extractor` | `targetUsername` |',
  '| Export community tweets | `community_post_extractor` | `targetCommunityId` |',
  '| Export list members | `list_member_extractor` | `targetListId` |',
  '| Export list tweets | `list_post_extractor` | `targetListId` |',
  'A quote never starts a scraping job.',
  'The estimator caps `estimatedResults` at that limit.',
  '## Decision Handoff',
  'Treat the `200 OK` response as a planning checkpoint, not a running extraction.',
  '"checkpoint_type": "extraction_estimate"',
  '"estimatedResults": 500',
  '"creditsRequired": "500"',
  '"creditsAvailable": "50000"',
  '"allowed": true',
  '"source": "replyCount"',
  '"next_action": "create_extraction"',
  '"create_path": "/api/v1/extractions"',
  '"fallback_action": "lower_results_limit_or_add_credits"',
  '<Card title="Allowed run" icon="circle-check">',
  'send the same `toolType`, target fields, filters, and `resultsLimit`',
  'Store the returned job ID from that `202 Accepted` receipt.',
  '<Card title="Blocked run" icon="circle-alert">',
  'lower `resultsLimit`, narrow the target or filters, or add credits',
  '<Card title="Source signal" icon="gauge">',
  'Store `source` so operators know whether the estimate came from',
  '<Card title="Audit fields" icon="clipboard-check">',
  'Store `estimatedResults`, `creditsRequired`, `creditsAvailable`, `allowed`, and `source`',
] as const;

const FORBIDDEN_EXTRACTION_ESTIMATE_HANDOFF_SNIPPETS = [
  '"status": "running"',
  '"receipt_format": "extraction_job"',
  '"results": [',
  '"hasMore": true',
  'poll_path',
] as const;

const REQUIRED_EXTRACTION_EXPORT_RESPONSE_SNIPPETS = [
  'curl --fail -X GET',
  'import { writeFile } from "node:fs/promises";',
  'const bytes = Buffer.from(await response.arrayBuffer());',
  'await writeFile("extraction-reply_extractor.csv", bytes);',
  'throw new Error(`Export failed with ${response.status}`);',
  'response.raise_for_status()',
  '"fmt"',
  'if resp.StatusCode < 200 || resp.StatusCode >= 300',
  'panic(fmt.Sprintf("export failed with %d", resp.StatusCode))',
  '## File handoff',
  'Treat the response body as file bytes.',
  '"export_file_path": "extraction-reply_extractor.csv"',
  '"content_type": "text/csv; charset=utf-8"',
  'Do not print downloaded',
  'export bytes to shared logs.',
  '### Format handoff map',
  '<Card title="CRM CSV" icon="table">',
  '`xquik-replies.csv`',
  '`xquik-followers.csv`',
  '<Card title="App JSON" icon="braces">',
  'Store the extraction ID and server filename with the local path.',
  '<Card title="Analyst XLSX" icon="file-spreadsheet">',
  '<Card title="Report formats" icon="file-text">',
  'For exports above 100,000 rows, use',
  '[Extraction Workflow](/guides/extraction-workflow#durable-json-lines-handoff)',
  'Returns a file download. The response includes a `Content-Disposition` header with the filename.',
  '<CardGroup cols={2}>',
  '<Card title="CSV" icon="table">',
  '`format=csv` returns `text/csv; charset=utf-8` with filenames like',
  '<Card title="JSON" icon="braces">',
  '`format=json` returns `application/json; charset=utf-8` with filenames',
  '<Card title="Markdown" icon="file-text">',
  '`format=md` returns `text/markdown; charset=utf-8` with filenames like',
  '<Card title="Markdown document" icon="file-text">',
  '`format=md-document` returns `text/markdown; charset=utf-8` with',
  '<Card title="PDF" icon="file-down">',
  '`format=pdf` returns `application/pdf` with filenames like',
  '<Card title="TXT" icon="file">',
  '`format=txt` returns `text/plain; charset=utf-8` with filenames like',
  '<Card title="XLSX" icon="file-spreadsheet">',
  '`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`',
  'Results are capped at 100,000 rows (10,000 for PDF).',
] as const;

const REQUIRED_DRAW_HISTORY_SNIPPETS = [
  'title: "Twitter Giveaway History API & Past Draw Results"',
  '"Twitter giveaway history"',
  'This endpoint returns draw summaries.',
  'It does not return winner objects or',
  '## List Past Twitter Giveaway Draws',
  '<Card title="List draw history" icon="history">',
  '<Card title="Review past winners" icon="trophy">',
  '<Card title="Export audit records" icon="file-down">',
  '<Card title="Run another draw" icon="shuffle">',
  'curl --fail-with-body "https://xquik.com/api/v1/draws?limit=10"',
  'if resp.StatusCode < 200 || resp.StatusCode >= 300',
  '## Choose the Correct Giveaway Result',
  '<Card title="Find Past Draws" icon="list-filter">',
  '<Card title="Verify Winners" icon="badge-check">',
  '<Card title="Download Results" icon="download">',
  'Do not label `validEntries` as a winner count.',
  'Winner rows exist only in the detail response.',
  '## Build a Twitter Giveaway Audit Handoff',
  'Preserve winner',
  'position and `isBackup`.',
  '<ParamField header="Authorization" type="string">',
  'Send `Bearer <token>` instead of `x-api-key` when using OAuth 2.1.',
  '## Paginate Twitter Giveaway History',
  'const seenCursors = new Set();',
  'throw new Error("Giveaway history cursor did not advance.");',
  'Never build a cursor from timestamps or draw',
  '## Handle Giveaway History Responses',
  '<Card title="200 Draw Page" icon="circle-check">',
  '<Card title="401 Authentication" icon="key-round">',
  '<Card title="429 Rate Limit" icon="timer">',
  '## Twitter Giveaway History Questions',
  '### Does Giveaway History Include Past Winners?',
  '### Can I Download Previous Twitter Giveaway Winners?',
  '### What Do Total and Valid Entries Mean?',
] as const;

const FORBIDDEN_DRAW_HISTORY_SNIPPETS = [
  'title: "Twitter Giveaway History API & Past Winners"',
  'eligibility rules, winner counts',
  'keywords: ["draw", "list", "history", "pagination"]',
  'This endpoint also accepts session cookie authentication.',
  '`totalEntries` counts inspected replies.',
] as const;

const REQUIRED_DRAW_DETAIL_SNIPPETS = [
  'title: "Twitter Giveaway Winner API & Draw Verification"',
  '"Twitter giveaway winner API"',
  'This endpoint does not return create-time eligibility rules or exclusion',
  '## Verify One Twitter Giveaway Draw',
  '<Card title="Source Tweet Snapshot" icon="message-square-text">',
  '<Card title="Candidate Counts" icon="users-round">',
  '<Card title="Ordered Winners" icon="trophy">',
  '<Card title="Draw Timing" icon="clock-3">',
  'curl --fail-with-body https://xquik.com/api/v1/draws/',
  'primary_winners: result.winners.filter((winner) => !winner.isBackup)',
  'backup_winners: result.winners.filter((winner) => winner.isBackup)',
  'if resp.StatusCode < 200 || resp.StatusCode >= 300',
  '## Interpret Twitter Giveaway Winner Rows',
  '<Card title="Primary Winner" icon="medal">',
  '<Card title="Backup Winner" icon="shield-plus">',
  '<Card title="Winning Reply" icon="reply">',
  '<Card title="Winner Account" icon="at-sign">',
  '## Preserve Eligibility Rules Separately',
  'required repost and followed-account rules',
  'minimum account age and follower count',
  'primary, backup, and unique-author settings',
  '## Build a Giveaway Verification Handoff',
  '"winner_export_path"',
  '"entry_export_path"',
  '<ParamField header="Authorization" type="string">',
  'Send `Bearer <token>` instead of `x-api-key` when using OAuth 2.1.',
  '<ResponseField name="totalEntries" type="number">Inspected candidate entries.</ResponseField>',
  '## Handle Giveaway Draw Responses',
  '<Card title="200 Draw Result" icon="circle-check">',
  '<Card title="404 Draw Missing" icon="search-x">',
  '## Twitter Giveaway Winner Verification Questions',
  '### Does the Draw Detail Include Eligibility Rules?',
  '### How Do I Identify Backup Winners?',
] as const;

const FORBIDDEN_DRAW_DETAIL_SNIPPETS = [
  'title: "Twitter Giveaway Draw API & Winner Details"',
  'eligibility rules, exclusions',
  'keywords: ["draw", "get", "winners", "results", "tweet metadata"]',
  'This endpoint also accepts session cookie authentication.',
  'Missing or invalid API key / session cookie.',
  '>Total replies collected.</ResponseField>',
  'minimum account age, followers, posts, or verification state',
  'excluded usernames or duplicate-author rules',
] as const;

const REQUIRED_DRAW_EXPORT_RESPONSE_SNIPPETS = [
  'title: "Twitter Giveaway CSV Export API & Winner Lists"',
  'sidebarTitle: "Export draw"',
  'description: "Export selected Twitter giveaway winners or inspected reply entries as CSV, XLSX, JSON, Markdown, PDF, or text. Preserve columns, order, and filenames."',
  'keywords: ["Twitter giveaway CSV", "giveaway winner export", "Twitter giveaway winner list", "X giveaway results export", "contest entries export", "download giveaway winners", "giveaway audit file"]',
  '## Export Twitter Giveaway Winners or Entries',
  'Use `type=winners` for selected primary and backup winners.',
  'Use `type=entries`\nfor every stored reply inspected during the draw.',
  '## Download a Giveaway Winner CSV',
  'Never parse a successful export as JSON. The `200` body contains file bytes.',
  '## Choose a Twitter Giveaway Export Format',
  'PDF entry exports include up to 10,000 rows. Winner exports contain selected winners.',
  '## Understand Winner Export Columns',
  'The winner export does not include the winning reply ID.',
  '## Understand Giveaway Entry Export Columns',
  'Do not call every exported entry eligible. Check `Passed Filter` first.',
  '## Build a Giveaway Audit Handoff',
  '<ParamField header="Authorization" type="string">',
  'Send `Bearer <token>` instead of `x-api-key` when using OAuth 2.1.',
  'Returns a file download. The response includes a `Content-Disposition`',
  'header with the filename.',
  '<CardGroup cols={2}>',
  '<Card title="CSV" icon="table">',
  '`format=csv` returns `text/csv; charset=utf-8` with filenames like',
  '`draw-winners-*.csv`.',
  '<Card title="JSON" icon="braces">',
  '`format=json` returns `application/json; charset=utf-8` with filenames',
  '`draw-winners-*.json`.',
  '<Card title="Markdown" icon="file-text">',
  '`format=md` returns `text/markdown; charset=utf-8` with filenames like',
  '`draw-winners-*.md`.',
  '<Card title="Markdown document" icon="file-text">',
  '`format=md-document` returns `text/markdown; charset=utf-8` with',
  '<Card title="PDF" icon="file-down">',
  '`format=pdf` returns `application/pdf` with filenames like',
  '`draw-winners-*.pdf`.',
  '<Card title="TXT" icon="file">',
  '`format=txt` returns `text/plain; charset=utf-8` with filenames like',
  '`draw-winners-*.txt`.',
  '<Card title="XLSX" icon="file-spreadsheet">',
  '`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`',
  '`draw-winners-*.xlsx`.',
  'Entry exports use the same suffix pattern with `draw-entries-*` filenames.',
  '**Winner export columns:** Position, Username, Text, Backup',
  '**Entry export columns:** Username, Text, Passed Filter, Language',
  'Entry exports are capped at 100,000 rows (10,000 for PDF).',
  '### 400 Invalid Parameters',
  '"error": "invalid_input"',
  '## Handle Giveaway Export Responses',
  '<Card title="429 Rate Limit" icon="timer">',
  '## Twitter Giveaway Export Questions',
  '### How Do I Download Twitter Giveaway Winners as CSV?',
  '### Can I Export Every Inspected Giveaway Entry?',
  '### Does an Entry Export Contain Only Eligible Replies?',
  '### Can I Export More Than 100,000 Giveaway Entries?',
  '### Does the Export Include Giveaway Eligibility Rules?',
] as const;

const FORBIDDEN_DRAW_EXPORT_RESPONSE_SNIPPETS = [
  'title: "Export Draw"',
  'keywords: ["draw", "export"]',
  '"error": "invalid_params"',
  'This endpoint also accepts session cookie authentication.',
  'The export includes the source tweet and giveaway rules.',
  'Every entry in the export is eligible.',
] as const;

const REQUIRED_EXTRACTION_EXPORT_COLUMNS_SNIPPETS = [
  'File format changes serialization only. The selected columns depend on the',
  'extraction tool type. Default exports include 29 columns; `article_extractor`',
  'exports 10 article-focused columns.',
  'All extraction tools except `article_extractor` use the default result column set.',
  'Some enrichment columns may be empty when the result does not include that data.',
  '<Card title="User identity" icon="user">',
  '`User ID`, `Username`, `Display Name`, `Verified`, and `Profile Image`.',
  '<Card title="Audience metrics" icon="chart-no-axes-column">',
  '`Followers`, `Following`, `Posts`, `Media Count`, and `Favorites`.',
  '<Card title="Profile context" icon="file-text">',
  '`Description`, `Location`, and `Cover Picture`.',
  '<Card title="Tweet content" icon="message-square">',
  '`Tweet ID`, `Tweet URL`, `Tweet Text`, and `Tweet Created At`.',
  '`Tweet URL` falls back to the status URL when the username is unavailable.',
  '<Card title="Tweet engagement" icon="activity">',
  '`Likes`, `Reposts`, `Replies`, `Quotes`, `Views`, and `Bookmarks`.',
  '<Card title="Tweet metadata" icon="braces">',
  '`Language`, `Source`, and `Conversation ID`.',
  '<Card title="Article metadata" icon="file-text">',
  '`Article Title`, `Article Preview`, and `Article Body`.',
  '`article_extractor` uses a shorter article-focused column set.',
  '<Card title="Article identity" icon="file-text">',
  '`Article Title`, `Cover Image`, and `Article Body`.',
  '<Card title="Author identity" icon="user">',
  '`Author`, `Username`, and `Verified`.',
  '<Card title="Author reach" icon="chart-no-axes-column">',
  '<Card title="Article engagement" icon="activity">',
] as const;

const FORBIDDEN_EXTRACTION_EXPORT_COLUMNS_SNIPPETS = [
  'All export formats include the same columns in this order.',
  '| Column | Description |',
  'Article Body Text',
  'Article Preview Text',
] as const;

const FORBIDDEN_EXTRACTION_WORKFLOW_SNIPPETS = [
  'quota',
  'Run bulk data extractions from X in 4 steps',
  '| `502 x_api_unavailable` | X data source temporarily down | Retry with exponential backoff |',
] as const;

const REQUIRED_EXTRACTION_GET_HANDOFF_SNIPPETS = [
  'import { appendFile } from "node:fs/promises";',
  'let pageIndex = 0;',
  'const pageCursor = cursor ?? null;',
  '"xquik-extraction-results.jsonl"',
  'handoff_format: "jsonl"',
  '## Cursor handoff',
  'Use `GET /extractions/{id}` when an integration needs structured JSON rows,',
  '`nextCursor` as an opaque checkpoint and pass it back as `after`.',
  '<Card title="Page checkpoint" icon="bookmark">',
  '`page_cursor`, `next_cursor`,',
  '<Card title="Row shape" icon="braces">',
  '`tweet_id`, and `tweet_text`. Do not dump raw result arrays into shared logs.',
  '<Card title="Large jobs" icon="list-tree">',
  'Stream pages to `xquik-extraction-results.jsonl` when you need replayable',
  '<Card title="File handoff" icon="download">',
  'Use [Export Extraction](/api-reference/extractions/export)',
  '"page_index": 3',
  '"result_count": 1000',
] as const;

const FORBIDDEN_EXTRACTION_GET_HANDOFF_SNIPPETS = [
  'const allResults = [];',
  'allResults.push(...data.results);',
] as const;

const REQUIRED_EXTRACTION_LIST_HANDOFF_SNIPPETS = [
  'import { appendFile } from "node:fs/promises";',
  'status: "completed",',
  'const pageCursor = cursor ?? null;',
  '"xquik-extraction-jobs.jsonl"',
  'detail_path: `/api/v1/extractions/${job.id}`',
  '? `/api/v1/extractions/${job.id}/export?format=csv`',
  'handoff_format: "jsonl"',
  '## Job inventory handoff',
  'Use `GET /extractions` as the job inventory step before fetching details or',
  'Treat `nextCursor` as opaque and pass it back as `after`',
  'not dump raw job lists into shared logs.',
  '<Card title="Page checkpoint" icon="bookmark">',
  '`tool_type_filter`, and `status_filter`',
  '<Card title="Completed jobs" icon="circle-check">',
  '`detail_path`, and `export_path`',
  '<Card title="Running or failed jobs" icon="circle-alert">',
  '<Card title="Next API step" icon="route">',
  'Use [Get Extraction](/api-reference/extractions/twitter-extraction-results)',
  'or [Export Extraction](/api-reference/extractions/export) for files.',
  '"tool_type_filter": "reply_extractor"',
  '"status_filter": "completed"',
] as const;

const FORBIDDEN_EXTRACTION_LIST_HANDOFF_SNIPPETS = [
  'const allExtractions = [];',
  'allExtractions.push(...data.extractions);',
] as const;

const REQUIRED_MEDIA_UPLOAD_WORKFLOW_SNIPPETS = [
  'media upload',
  'POST /x/media',
  'multipart/form-data',
  'application/json',
  '`mediaUrl`',
  '`mediaId`',
  'POST /x/tweets',
  'mediaId for one DM attachment',
  '## End-to-end media handoff',
  '"workflow": "media_upload_handoff"',
  '"upload": {',
  '"source_endpoint": "/api/v1/x/media"',
  '"media_id_expires_in_hours": 24',
  '"tweet_post": {',
  '"reply_post": {',
  '"dm_send": {',
  '"field_boundary": {',
  '"tweet_media_value": "mediaUrl"',
  '"dm_media_value": "mediaId"',
  '"forbidden_tweet_field": "media_ids"',
  '"record_type": "media_upload_handoff"',
  '"handoff_state": "store_media_url_for_tweets_and_media_id_for_dms"',
  '<Card title="Upload checkpoint" icon="paperclip">',
  '<Card title="Tweet URL checkpoint" icon="send">',
  '<Card title="Reply URL checkpoint" icon="message-square">',
  '<Card title="DM ID checkpoint" icon="mail">',
  '<Card title="Field boundary" icon="split">',
  '<Card title="Audit row" icon="file-check">',
  'If you already have public image URLs or a public MP4 video URL for a tweet or reply, skip `POST /x/media` and pass those URLs directly in the `media` array on `POST /x/tweets`.',
  'Send up to 4 images or exactly 1 MP4 video up to 100 MB.',
  'Use `POST /x/media` when you need Xquik to host a local file, validate a generated media URL, or produce a `mediaId` for a DM attachment.',
  '**Need to post an MP4 tweet?**',
  '`media: ["https://example.com/video.mp4"]`',
  'Use `POST /x/media` first only when Xquik must host a local file or validate a generated URL',
  'Post tweets with public media URLs',
  'Post tweets with media uploaded through Xquik',
  'Post tweet replies with uploaded media',
  '`reply_to_tweet_id`',
  '`tweetId`',
  '`request.hash`',
  '`safeToRetry`',
  'POST /x/dm/{userId}',
  '`media_ids`',
  'For tweet-only workflows with already public image URLs or exactly 1 public MP4 video URL up to 100 MB, call `POST /x/tweets` directly with `media`.',
  'Do not send `media_ids` to `POST /x/tweets`',
  '10 credits per upload call',
  'Posting a tweet or reply is a separate 30-credit create-tweet call before media surcharges; sending the DM is a separate 10-credit write call.',
  'AVIF, GIF, JPEG, PNG, WebP, and MP4',
  'Media IDs are valid for 24 hours',
  'The URL must use HTTPS, resolve to a public address, return a supported media content type, finish within 30 seconds, and stay under the 15,728,640-byte URL download cap.',
  '### URL upload checklist',
  'Non-HTTPS URLs return `422 media_download_failed`.',
  'Private or reserved IP targets are rejected.',
  'Slow origins can time out before upload starts.',
  '### JSON Lines handoff',
  '`xquik-media-handoff.jsonl`',
  '#### Media upload row',
  '#### Tweet or reply row',
  '#### DM media row',
  '"record_type": "media_upload"',
  '"record_type": "tweet_media_post"',
  '"record_type": "dm_media_send"',
  '"tweet_media_field": "media"',
  '"dm_media_field": "media_ids[0]"',
  '"handoff_format": "jsonl"',
  'Use `media_url` for tweet and reply `media` arrays. Use `media_id` for the single DM `media_ids` item.',
  'Store `message_id`, `media_id`, recipient, account, and send status in shared handoff rows.',
  'Keep full DM body text in private systems only.',
  'Store upload, tweet/reply, or DM handoff rows in `xquik-media-handoff.jsonl` with `media_id` and `media_url`.',
  'Use JSON URL upload only when the agent needs Xquik to validate or host a',
  'For tweet-only public URLs, pass',
  'them directly to `POST /x/tweets`.',
] as const;

const FORBIDDEN_MEDIA_UPLOAD_WORKFLOW_SNIPPETS = [
  'one-image direct messages',
  'Pass returned `mediaId` in the `media` array on `POST /x/tweets`',
  'Use `mediaId` for tweet and reply `media` arrays.',
  'Use `mediaUrl` for the single DM `media_ids` item.',
  'Prefer JSON URL upload when the agent produces a hosted image URL.',
  '"media": ["1893726451023847424"]',
  '"media": ["<mediaId>"]',
  '{"record_type":"media_upload"',
  '{"record_type":"tweet_media_post"',
  '{"record_type":"dm_media_send"',
] as const;

const REQUIRED_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Media Upload API for Tweets, Replies & DMs"',
  'twitter media upload api',
  'twitter api media upload',
  'twitter api upload media',
  'post tweet with media',
  'post tweet replies with media',
  'send DM with media',
  '## Use the Twitter API Upload Media Workflow',
  '`POST /x/media`',
  'This Twitter API media upload route accepts one local file',
  'A Twitter API upload media request uses one connected',
  'local file or hosted HTTPS media URL',
  'Send `multipart/form-data` for a file.',
  'Send `application/json` for a hosted',
  'OAuth bearer authentication is also supported.',
  'const { mediaId, mediaUrl } = await response.json();',
  'Supported media files include AVIF, GIF, JPEG, PNG, WebP, and MP4.',
  'Match the content',
  'type to the file.',
  'Every media type requires validation before upload.',
  'Use a public URL.',
  'Private and reserved addresses are rejected.',
  'The download timeout is 30 seconds.',
  '15,728,640 bytes',
  'Xquik handles the chunked upload and media category internally.',
  'For multiple images, call once per file.',
  'Collect up to 4',
  '| `mediaUrl` | Tweet or reply `media` | Send up to 4 image URLs or 1 MP4 URL up to 100 MB. |',
  '| `mediaId` | DM `media_ids` | Send exactly 1 media ID. |',
  'For replies, add `reply_to_tweet_id` in Create Tweet.',
  'Never send `media_ids` to Create Tweet.',
  '422 media_download_failed',
  'Tweet and reply writes cost 30',
  'credits, plus media surcharges.',
  'DM writes cost 10 credits.',
] as const;

const FORBIDDEN_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS = [
  'Pass `mediaId` in the `media` array on `POST /x/tweets`',
  'Use `mediaUrl` as the only item in `media_ids`',
  'Store `mediaId` for tweet and reply attachments.',
  'const data = await response.json();',
  'data = response.json()',
  'var data map[string]interface{}',
  'fmt.Println(data)',
] as const;

const REQUIRED_DOWNLOAD_MEDIA_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Media Downloader API for Photos & Video"',
  'Download media',
  'Use this Twitter media downloader API with 1-50 tweet IDs or URLs.',
  'download Twitter media',
  'This endpoint creates a saved media gallery from 1-50 tweet URLs or IDs.',
  'The response gives a `galleryUrl` plus cache or bulk',
  'It does not return',
  'per-file downloads, file metadata, or an uploaded `mediaId`.',
  '## Media download handoff',
  'Use this endpoint when your agent needs a saved gallery for tweet images, videos, or GIFs.',
  'const singleResult = await single.json();',
  'input_mode: "single"',
  'requested_tweet_id: singleTweetId',
  'gallery_url: singleResult.galleryUrl',
  'cache_hit: singleResult.cacheHit',
  'successful_tweet_count: bulkResult.totalTweets',
  'media_item_count: bulkResult.totalMedia',
  '"input_mode": "single"',
  '"requested_tweet_id": single_tweet_id',
  '"gallery_url": single_result["galleryUrl"]',
  '"cache_hit": single_result["cacheHit"]',
  '"successful_tweet_count": bulk_result["totalTweets"]',
  '"media_item_count": bulk_result["totalMedia"]',
  'type MediaDownloadRow struct',
  'GalleryURL       string `json:"gallery_url"`',
  'fmt.Println(string(output))',
  'Write one manifest row per request',
  '<Card title="Gallery URL" icon="images">',
  'Store `gallery_url` from `galleryUrl` as the durable link for downloaded media.',
  '<Card title="Single tweet" icon="message-square">',
  'Store `requested_tweet_id`, `tweet_id`, and `cache_hit`.',
  '`cacheHit: true` means the single-tweet request used cached media and is free.',
  '<Card title="Bulk result" icon="list-checks">',
  'Store `requested_tweet_ids`, `successful_tweet_count` from `totalTweets`, and `media_item_count` from `totalMedia`.',
  '`totalTweets` counts successful tweets with media after invalid or failed IDs are skipped.',
  '<Card title="Input mode" icon="list-filter">',
  'When it contains at least 1 string, bulk mode ignores `tweetInput`, `tweetId`, and `tweetUrl`.',
  '<Card title="Batch limit" icon="list-ordered">',
  'Keep `tweetIds` at 50 items or fewer.',
  '<Card title="Write handoff" icon="send">',
  'This endpoint creates a gallery download, not an uploaded media ID.',
  '[Upload Media](/api-reference/x-write/upload-media)',
  'Fresh downloads cost 1 credit per tweet processed with media.',
  'Bulk responses do not return `freshCount`',
  'You can also authenticate with an OAuth bearer token.',
  'Send `xquik-api-contract: 2026-04-29` to opt in. Default v1 returns 502.',
  '## Twitter Media Downloader Questions',
  'The gallery can',
  'contain Twitter videos and GIFs plus images.',
  'This Twitter video downloader route creates a gallery.',
  'Send 1-50 tweet IDs through `tweetIds`.',
] as const;

const FORBIDDEN_DOWNLOAD_MEDIA_RAW_OUTPUT_SNIPPETS = [
  'fmt.Println(string(body))',
  'io.ReadAll(resp.Body)',
] as const;

const REQUIRED_DIRECT_MESSAGE_WORKFLOW_SNIPPETS = [
  'send direct messages',
  'GET /x/users/{id}',
  'GET /x/dm/{userId}/history',
  'POST /x/dm/{userId}',
  'POST /x/media',
  '## Choose the DM path',
  '<Card title="Text-only send" icon="send">',
  'Call `POST /x/dm/{userId}` with `account` and non-empty `text`.',
  '`messageId`, `success`, sender account, and recipient ID.',
  '<Card title="Media send" icon="paperclip">',
  'send `media_ids: ["<mediaId>"]` on',
  'Use exactly 1 item and store `media_id` beside',
  '<Card title="History sync" icon="history">',
  'workflow needs private conversation context.',
  '<Card title="Username input" icon="user-search">',
  'DM sends',
  'require the numeric recipient ID in the path.',
  '`messages`, `has_next_page`, and `next_cursor`',
  '## End-to-end direct message handoff',
  '"workflow": "direct_message_handoff"',
  '"recipient_lookup": {',
  '"history_page": {',
  '"text_send": {',
  '"media_send": {',
  '"media_ids": ["1893726451023847424"]',
  '"audit_row": {',
  '"record_type": "dm_handoff_checkpoint"',
  '"source_endpoint": "/api/v1/x/dm/987654321"',
  '"handoff_state": "store_message_ids_and_private_rows"',
  '<Card title="Recipient checkpoint" icon="user-check">',
  '<Card title="History checkpoint" icon="history">',
  '<Card title="Text send checkpoint" icon="send">',
  '<Card title="Media checkpoint" icon="image">',
  '<Card title="Audit checkpoint" icon="file-check">',
  '<Card title="Invalid fields" icon="ban">',
  'pass the previous `next_cursor` as `cursor`',
  '<Card title="Opaque cursor" icon="shuffle">',
  'Treat `next_cursor` as opaque',
  'Do not decode it or build your own cursor.',
  '<Card title="Store message IDs" icon="key-round">',
  'Store every message `id`.',
  '<Card title="Participant account" icon="user-check">',
  'Use a participant account',
  'do not retry `403 dm_not_permitted` with the same non-participant account.',
  '<Card title="Modern pagination" icon="history">',
  'Use `cursor`; keep `maxId` only for older integrations that already depend on it.',
  '<Card title="Transient retries only" icon="refresh-cw">',
  'DM history and outbound `message_text` values can contain private customer or community conversations.',
  'Store them only in private support, CRM, warehouse, or agent memory systems.',
  'Shared logs, public artifacts, and status dashboards should keep `message_id`, `sender_id`, `receiver_id`, `created_at`, `media_url`, and job status instead of full DM bodies.',
  '1 credit per message returned',
  '`400 account_required`',
  '`403 dm_not_permitted`',
  '`422 x_dm_not_allowed`',
  'The recipient may not accept DMs from this connected account. Do not retry unchanged',
  '<Card title="400 invalid_input" icon="circle-alert">',
  'Check `account`, `text`, `userId`, and one-item `media_ids`.',
  '<Card title="400 account_required" icon="user-check">',
  'Pass the connected sender handle as `account` when reading DM history.',
  '<Card title="402 billing state" icon="credit-card">',
  'Subscribe or top up credits before retrying.',
  '<Card title="403 account_needs_reauth" icon="refresh-cw">',
  'Reconnect the sender account from the dashboard.',
  '<Card title="403 dm_not_permitted" icon="user-check">',
  '<Card title="422 x_dm_not_allowed" icon="message-circle">',
  '<Card title="422 x_rejected" icon="circle-alert">',
  '<Card title="429 or 503" icon="refresh-cw">',
  'Retry with exponential backoff and respect `Retry-After` when present.',
  'Store the required non-empty `text` value.',
  '`messageId`',
  '`success`',
  '### Store the outbound handoff',
  '"recipient_user_id": "987654321"',
  '"message_id": "1893726451029384192"',
  'use your own job timestamp if the downstream system needs `sent_at`',
  'Text-only DM sends omit media fields.',
  'Add `media_ids` in the request and',
  '`media_id` in the handoff only for the media send in Step 4.',
  '`message_id`, `sender_id`, `receiver_id`, `created_at`, optional `media_url`, and `conversation_user_id`',
  '### JSON Lines handoff',
  '`xquik-dm-handoff.jsonl`',
  '"record_type": "dm_history"',
  '"record_type": "dm_send"',
  '"conversation_user_id": "987654321"',
  '"page_next_cursor": "1893726451029384190"',
  '"handoff_format": "jsonl"',
  'History rows include `media_url` only when the message has media.',
  'Text-only send',
  'rows omit `media_id` and `media_ids`; media send rows use the Step 4 shape.',
  'for queues, warehouse loads, CRM syncs, or agent memory',
  '`media_ids`',
  'exactly one uploaded media ID',
  'The media DM send returns the same `messageId` and `success` fields as a text',
  'DM. Store the uploaded `media_id` beside that returned message ID',
  '"record_type": "dm_media_send"',
  '"message_id": "1893726451029384193"',
  '"media_ids": ["1893726451023847424"]',
  '"media_id": "1893726451023847424"',
  '<Card title="Recipient lookup" icon="search">',
  '`GET /x/users/{id}` costs 1 credit per call.',
  '<Card title="DM history" icon="history">',
  '`GET /x/dm/{userId}/history` costs 1 credit per message returned.',
  '<Card title="Media upload" icon="paperclip">',
  '`POST /x/media` costs 10 credits per upload call before a media DM send.',
  '<Card title="DM send" icon="send">',
  '`POST /x/dm/{userId}` costs 10 credits per call and returns `messageId`.',
  'Do not pass multiple IDs, an empty array, or `reply_to_message_id`',
  '<Card title="Sender" icon="user-check">',
  'Store the connected X account username or ID sent in `account`.',
  '<Card title="Recipient" icon="user">',
  'Store the numeric recipient ID used in the `POST /x/dm/{userId}` path.',
  '<Card title="History" icon="history">',
  'For DM history exports, store `messages`, `has_next_page`, and',
  '<Card title="Text" icon="message-square">',
  'Store the required non-empty `text` value.',
  '<Card title="Media" icon="image">',
  'Store the optional one-item `media_ids` array containing a `mediaId` from',
  '<Card title="Response" icon="circle-check">',
  'Store `messageId`, `recipient_user_id`, `sender_account`, `message_text`,',
  'and optional `media_id` in private audit records or support systems.',
  '<Card title="JSON Lines" icon="braces">',
  'Store history and send records in `xquik-dm-handoff.jsonl`',
] as const;

const REQUIRED_WEBHOOK_TESTING_SNIPPETS = [
  'Test with Xquik first',
  'POST /webhooks/{id}/test',
  '`webhook.test` delivery',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and `X-Xquik-Nonce`',
  '`webhook.test` payloads contain `eventType`, `data.message`, and `timestamp`;',
  'they omit `deliveryId` and `streamEventId`',
  'signature checks, not production de-dupe.',
  '"success": true',
  '"statusCode": 200',
  '## End-to-end handoff check',
  '"workflow": "signed_webhook_test_handoff"',
  '"secret_storage": "store_once"',
  '"has_delivery_id": false',
  '"has_stream_event_id": false',
  '"dedupe_keys": ["deliveryId", "streamEventId"]',
  '"return_status": "2xx_before_slow_work"',
  '"event_context": {',
  '"endpoint": "GET /api/v1/events/{id}"',
  '"id_source": "streamEventId"',
  '"store": ["monitorId", "monitorType", "type", "occurredAt", "data"]',
  '"handoff_state": "verified_signature_then_join_event_context"',
  '<Card title="Signature checkpoint" icon="shield-check">',
  '<Card title="Test payload checkpoint" icon="braces">',
  '<Card title="Production de-dupe" icon="copy-check">',
  '<Card title="Delivery triage" icon="activity">',
  '<Card title="Event join" icon="link">',
  '### Receiver replay row',
  '"record_type": "webhook_receiver_replay_check"',
  '"test_payload_has_ids": false',
  '"production_delivery_id": "502"',
  '"production_stream_event_id": "9002"',
  '"nonce_cache_key": "webhook:15:nonce_hash"',
  '"shared_storage_excludes": [',
  '"raw_request_body"',
  'Use this row after verification succeeds and before slow downstream work.',
  'store only the de-dupe IDs,',
  'verification state, and sanitized delivery context',
  'Use delivery `streamEventId` as the `{id}`',
  '`lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`',
  'Join `streamEventId` to [Get Event](/api-reference/events/get)',
  'Store the event `monitorId`, `monitorType`, `type`, `occurredAt`, and `data`',
  '### Reconcile missed deliveries',
  'Use delivery rows for receiver attempts and event pages for stored monitor',
  '"event_backfill_endpoint": "GET /api/v1/events?limit=100&after={nextCursor}"',
  '"join_key": "delivery.streamEventId == event.id"',
  'Store `nextCursor` after each event page.',
  'until `hasMore` is `false`',
  'For end-to-end verification of the configured webhook URL, prefer `POST /webhooks/{id}/test`.',
  '"schemaVersion":1',
  '"deliveryId":"502"',
  '"streamEventId":"9002"',
  '"occurredAt":"2026-02-24T14:22:00.000Z"',
  'Include `deliveryId` and `streamEventId` in offline fixtures so receiver idempotency tests match production deliveries.',
] as const;

const REQUIRED_WEBHOOK_CREATE_API_SNIPPETS = [
  '## Integration handoff',
  'Use this endpoint after creating an account monitor with [`POST /monitors`](/api-reference/monitors/create) or a keyword monitor with [`POST /monitors/keywords`](/api-reference/monitors/create-keyword).',
  'Active monitors produce the events; webhook delivery is included with monitor billing.',
  'Keyword monitors emit only `tweet.*`',
  'Account monitors can emit both `tweet.*` and `profile.*`',
  'const webhookSecret = webhook.secret;',
  'Store webhookSecret in your secret manager; do not print it in logs.',
  'webhook_secret = webhook["secret"]',
  'Store webhook_secret in your secret manager; do not print it in logs.',
  'Store secret in your secret manager; do not print it in logs.',
  '<Card title="tweet.new" icon="bell">',
  'new posts that are not replies, quotes, or retweets.',
  '<Card title="tweet.quote" icon="quote">',
  'monitors that include `tweet.quote`.',
  '<Card title="tweet.reply" icon="message-circle">',
  'monitors that include `tweet.reply`.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'monitors that include `tweet.retweet`.',
  '`webhook.test` is sent only by the [Test Webhook](/api-reference/webhooks/test) endpoint.',
  '<Card title="Webhook ID" icon="fingerprint">',
  'Store `id` for `POST /webhooks/{id}/test`, updates, deletes, and delivery',
  '<Card title="Delivery URL" icon="link">',
  'queue, CRM, warehouse, or app endpoint receives',
  '<Card title="Event Filter" icon="funnel">',
  'keep the webhook filter aligned with the account or',
  '<Card title="Signing Secret" icon="shield-check">',
  'Store `secret` once and use it to verify `X-Xquik-Signature`',
  '<Card title="Created At" icon="calendar-clock">',
  'Store `createdAt` for audit logs and configuration drift checks.',
  '<Card title="Delivery Payload" icon="webhook">',
  '`eventType`, `schemaVersion`, `deliveryId`',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and',
  '`X-Xquik-Nonce` headers. Use `deliveryId`',
  '`username` for account monitor',
  '`query` for keyword monitor',
  'Use `deliveryId` as the per-endpoint idempotency key',
  'and `streamEventId` when one monitor event must be processed once across retries',
  'Return a `2xx` response within 10 seconds',
  '[Signature Verification](/webhooks/verification)',
] as const;

const FORBIDDEN_WEBHOOK_CREATE_SECRET_LOG_SNIPPETS = [
  'console.log(webhook)',
  'print(webhook)',
  'fmt.Println(string(respBody))',
] as const;

const REQUIRED_WEBHOOK_LIST_API_SNIPPETS = [
  '## Inventory handoff',
  "jq '.webhooks[] | {",
  'webhook_id: .id',
  'delivery_status: .deliveryStatus',
  'consecutive_failures: .consecutiveFailures',
  'failure_hard_cap: .failureHardCap',
  'update_endpoint: ("/api/v1/webhooks/" + .id)',
  'delete_endpoint: ("/api/v1/webhooks/" + .id)',
  'test_endpoint: ("/api/v1/webhooks/" + .id + "/test")',
  'resume_endpoint: ("/api/v1/webhooks/" + .id + "/resume")',
  'deliveries_endpoint: ("/api/v1/webhooks/" + .id + "/deliveries")',
  'const webhookRows = data.webhooks.map((webhook) => ({',
  'webhook_id: webhook.id',
  'event_types: webhook.eventTypes',
  'delivery_status: webhook.deliveryStatus',
  'resume_endpoint: `/api/v1/webhooks/${webhook.id}/resume`',
  'update_endpoint: `/api/v1/webhooks/${webhook.id}`',
  'delete_endpoint: `/api/v1/webhooks/${webhook.id}`',
  'test_endpoint: `/api/v1/webhooks/${webhook.id}/test`',
  'deliveries_endpoint: `/api/v1/webhooks/${webhook.id}/deliveries`',
  'signing_secret_available: false',
  'webhook_rows = [',
  '"webhook_id": webhook["id"]',
  '"event_types": webhook["eventTypes"]',
  '"delivery_status": webhook["deliveryStatus"]',
  '"resume_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/resume"',
  '"update_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}"',
  '"delete_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}"',
  '"test_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/test"',
  '"deliveries_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/deliveries"',
  '"signing_secret_available": False',
  'type WebhookRow struct',
  'UpdateEndpoint         string   `json:"update_endpoint"`',
  'DeleteEndpoint         string   `json:"delete_endpoint"`',
  'ResumeEndpoint         string   `json:"resume_endpoint"`',
  'SigningSecretAvailable bool     `json:"signing_secret_available"`',
  'encoder.Encode(row)',
  'one inventory row per webhook',
  'Split the rows by `is_active` and `delivery_status`',
  'update, delete, test, resume, and delivery-log endpoints',
  'List responses never include the',
  'Store `webhooks[].id` for updates, deletes, test deliveries, and delivery',
  'Store `webhooks[].url` so configuration reviews can detect stale receiver',
  'Store `webhooks[].eventTypes` and compare it with monitor event types',
  'expecting `tweet.new`, `tweet.quote`, `tweet.reply`, or `tweet.retweet`.',
  'Store `webhooks[].isActive`; inactive webhooks do not receive monitor',
  'Store `webhooks[].deliveryStatus`',
  '[Resume Webhook](/api-reference/webhooks/resume)',
  'Store `webhooks[].consecutiveFailures` and `webhooks[].failureHardCap`',
  '<Card title="Change Links" icon="route">',
  '[Update Webhook](/api-reference/webhooks/update)',
  '[Test Webhook](/api-reference/webhooks/test)',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  '[Delete Webhook](/api-reference/webhooks/delete)',
  '<Card title="Inactive Review" icon="toggle-left">',
  'Inactive rows are configuration records, not active delivery targets.',
  '<Card title="Delivery Audit" icon="activity">',
  'Use the per-webhook deliveries endpoint to store `streamEventId`,',
  '`attempts`, `lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`',
  '<Card title="Event Join" icon="link">',
  'Use delivery `streamEventId` as the `{id}`',
  '[Get Event](/api-reference/events/get)',
  'Store `monitorId`, `monitorType`,',
  '`type`, `occurredAt`, and `data`',
  'Store `webhooks[].createdAt` for audit logs and configuration drift checks.',
  'The signing `secret` is not listed.',
  '[Create Webhook](/api-reference/webhooks/create)',
  '[Signature Verification](/webhooks/verification)',
] as const;

const FORBIDDEN_WEBHOOK_LIST_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_TEST_API_SNIPPETS = [
  'webhook_id: $webhook_id',
  'accepted: (.success == true)',
  'status_code: .statusCode',
  'error: (.error // null)',
  '## Test result handoff',
  'Treat `success: true` and a `2xx` `statusCode` as proof',
  'Treat `success: false` with a non-`2xx` `statusCode` as a receiver error.',
  'Treat `statusCode: 0` as a network or reachability failure.',
  'Store `error` with your deployment logs',
  'const testOutcome = {',
  'accepted: result.success === true',
  '"accepted": result["success"] is True',
  'type TestOutcome struct',
  'Store `accepted`,',
  'You can test active, paused, or needs-attention webhooks.',
  '`isActive`, `deliveryStatus`, or `consecutiveFailures`',
  '[Resume Webhook](/api-reference/webhooks/resume)',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and',
  '`X-Xquik-Nonce` on the raw request body',
  'The test endpoint does not return or rotate the signing secret.',
  '[Create Webhook](/api-reference/webhooks/create)',
  'keep raw request bodies, raw signatures, and full',
  'headers out of deployment logs.',
  '`webhook.test` payloads include `eventType`, `data`, and `timestamp`.',
  'They do not include `deliveryId` or `streamEventId`.',
  '<Card title="Production triage" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  '`id`, `streamEventId`, `status`, `attempts`,',
  '`lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`',
  '<Card title="Event join" icon="link">',
  'use delivery `streamEventId`',
  '[Get Event](/api-reference/events/get)',
  'Store the event',
  '`monitorId`, `monitorType`, `type`, `occurredAt`, and `data`',
  '<Card title="Paused or Needs Attention" icon="toggle-left">',
  'Tests are still sent to paused and needs-attention webhooks.',
] as const;

const FORBIDDEN_WEBHOOK_TEST_RAW_OUTPUT_SNIPPETS = [
  'console.log(result);',
  'print(result)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_RESUME_API_SNIPPETS = [
  'api: "POST /webhooks/{id}/resume"',
  'webhook_id: .webhook.id',
  'resumed: (.success == true)',
  'delivery_status: .webhook.deliveryStatus',
  'consecutive_failures: .webhook.consecutiveFailures',
  'failure_hard_cap: .webhook.failureHardCap',
  'const resumeHandoff = {',
  'resume_handoff = {',
  'type ResumeHandoff struct',
  'These snippets shape a recovery row.',
  '## What happens',
  'signed `webhook.test` request',
  'resets `consecutiveFailures` to `0`',
  'If the signed test fails',
  'The webhook is not reactivated.',
  'This endpoint does not rotate or return the signing secret.',
  '## Recovery handoff',
  '<Card title="Needs Attention" icon="triangle-alert">',
  '`deliveryStatus: "needs_attention"`',
  '<Card title="Signed Test Gate" icon="flask-conical">',
  '<Card title="Failure Counter" icon="rotate-ccw">',
  'Store `consecutiveFailures` and `failureHardCap`',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  '[Get Event](/api-reference/events/get)',
] as const;

const FORBIDDEN_WEBHOOK_RESUME_RAW_OUTPUT_SNIPPETS = [
  'console.log(result);',
  'print(result)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_UPDATE_API_SNIPPETS = [
  'webhook_id: .id',
  'delivery_status: .deliveryStatus',
  'consecutive_failures: .consecutiveFailures',
  'failure_hard_cap: .failureHardCap',
  'test_endpoint: ("/api/v1/webhooks/" + .id + "/test")',
  'resume_endpoint: ("/api/v1/webhooks/" + .id + "/resume")',
  'deliveries_endpoint: ("/api/v1/webhooks/" + .id + "/deliveries")',
  'const updateHandoff = {',
  'delivery_status: webhook.deliveryStatus',
  'test_endpoint: `/api/v1/webhooks/${webhook.id}/test`',
  'resume_endpoint: `/api/v1/webhooks/${webhook.id}/resume`',
  'deliveries_endpoint: `/api/v1/webhooks/${webhook.id}/deliveries`',
  'update_handoff = {',
  '"delivery_status": webhook["deliveryStatus"]',
  '"test_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/test"',
  '"resume_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/resume"',
  '"deliveries_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/deliveries"',
  'type UpdateHandoff struct',
  'DeliveriesEndpoint string   `json:"deliveries_endpoint"`',
  'ResumeEndpoint     string   `json:"resume_endpoint"`',
  'TestEndpoint       string   `json:"test_endpoint"`',
  'These snippets shape a reconfiguration row.',
  'Store the current webhook',
  'Use any valid account monitor event type listed below.',
  'Keyword monitor webhooks should stay on `tweet.*`',
  'webhooks can use both `tweet.*` and `profile.*`',
  '<Card title="tweet.new" icon="bell">',
  'new posts that are not replies, quotes, or retweets.',
  '<Card title="tweet.quote" icon="quote">',
  'downstream systems handle quote payloads.',
  '<Card title="tweet.reply" icon="message-circle">',
  'reply alerts or support routing should continue.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'repost activity should keep triggering deliveries.',
  '`webhook.test` is generated only by the [Test Webhook](/api-reference/webhooks/test) endpoint.',
  '## Reconfiguration handoff',
  'Store returned `id`, `url`, `eventTypes`, `isActive`, `deliveryStatus`,',
  'After changing `url`, run [Test Webhook](/api-reference/webhooks/test)',
  '`eventTypes` replaces the previous list.',
  '`isActive: false` stops future deliveries.',
  '`isActive: true` resumes delivery for matching future monitor events.',
  '[Resume Webhook](/api-reference/webhooks/resume)',
  'This endpoint does not rotate or return `secret`.',
  '<Card title="Delivery check" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  '`status`, `attempts`,',
  '`lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`',
  '<Card title="Event join" icon="link">',
  'Use delivery `streamEventId` as the `{id}`',
  '[Get Event](/api-reference/events/get)',
  'Store `monitorId`, `monitorType`,',
  '`type`, `occurredAt`, and `data`',
  '[Create Webhook](/api-reference/webhooks/create)',
] as const;

const FORBIDDEN_WEBHOOK_UPDATE_RAW_OUTPUT_SNIPPETS = [
  'console.log(webhook)',
  'print(webhook)',
  'fmt.Println(string(respBody))',
] as const;

const REQUIRED_WEBHOOK_DELETE_API_SNIPPETS = [
  'webhook_id: $webhook_id',
  'inventory_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint: ("/api/v1/webhooks/" + $webhook_id + "/deliveries")',
  'const deactivationHandoff = {',
  'deliveries_endpoint: `/api/v1/webhooks/${webhookId}/deliveries`',
  'deactivation_handoff = {',
  '"deliveries_endpoint": f"/api/v1/webhooks/{webhook_id}/deliveries"',
  'type DeactivationHandoff struct',
  'DeliveriesEndpoint string `json:"deliveries_endpoint"`',
  'InventoryEndpoint  string `json:"inventory_endpoint"`',
  'These snippets shape a deactivation receipt.',
  'Store the webhook ID with its',
  '## What delete does',
  '`DELETE /webhooks/{id}` soft-deactivates the endpoint',
  'setting `isActive` to',
  'The webhook record stays available in',
  'previous delivery rows stay',
  'The response is only `{ "success": true }`',
  'does not return the URL, event',
  'types, or signing secret.',
  'To receive events again, call',
  'before routing production monitor',
  '## Deactivation handoff',
  'Use this endpoint when a receiver should stop getting future monitor events',
  'The endpoint sets `isActive` to `false` and returns `{ "success": true }`.',
  'It does not return the webhook configuration.',
  'Inactive webhooks do not receive new monitor deliveries or scheduled retries.',
  'In-flight delivery attempts may still finish.',
  '[List Webhooks](/api-reference/webhooks/list)',
  '`webhooks[].isActive: false`',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'status, attempts, errors, and timestamps.',
  '<Card title="Delivery Audit" icon="activity">',
  'Delivery rows for inactive endpoints can show `pending`, `failed`, or',
  '`exhausted` attempts.',
  'Store `streamEventId`, `status`, `attempts`,',
  '`lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`',
  '<Card title="Event Join" icon="link">',
  'Use delivery `streamEventId` as the `{id}`',
  '[Get Event](/api-reference/events/get)',
  'Store `monitorId`, `monitorType`,',
  '`type`, `occurredAt`, and `data`',
  'Remove queue, CRM, alerting, or warehouse routing',
  '[Update Webhook](/api-reference/webhooks/update)',
  '`isActive: true`',
  '[Test Webhook](/api-reference/webhooks/test)',
  'Delete returns no `secret`.',
] as const;

const FORBIDDEN_WEBHOOK_DELETE_RAW_OUTPUT_SNIPPETS = [
  'console.log(result)',
  'print(result)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_DELIVERIES_API_SNIPPETS = [
  '## Operational handoff',
  'It returns the 100 most recent delivery records for one webhook, newest first.',
  'jq \'[.deliveries[] | {',
  'delivery_id: .id',
  'stream_event_id: .streamEventId',
  'receiver_status: (.lastStatusCode // null)',
  'last_error: (.lastError // null)',
  'queued_at: .createdAt',
  'delivered_at: (.deliveredAt // null)',
  'if .status == "exhausted" then "page"',
  'const deliveryTriage = data.deliveries.map',
  'receiver_status: delivery.lastStatusCode ?? null',
  'last_error: delivery.lastError ?? null',
  'queued_at: delivery.createdAt',
  'delivered_at: delivery.deliveredAt ?? null',
  'action:',
  'const retryCandidates = deliveryTriage.filter',
  'delivery_triage = [',
  '"receiver_status": delivery.get("lastStatusCode")',
  '"last_error": delivery.get("lastError")',
  '"queued_at": delivery["createdAt"]',
  '"delivered_at": delivery.get("deliveredAt")',
  '"action": "page"',
  'retry_candidates = [',
  'type Delivery struct',
  'LastStatusCode *int',
  'type DeliveryTriage struct',
  'ReceiverStatus *int',
  'func actionForDelivery(delivery Delivery) string',
  'deliveryTriage := make([]DeliveryTriage, 0, len(data.Deliveries))',
  'retryCandidates := make([]DeliveryTriage, 0)',
  'Map each delivery into a small incident row',
  'avoid dumping the full response into logs',
  'This endpoint returns delivery attempt metadata only.',
  'It does not return the',
  'webhook URL, event type filter, signing secret, raw payload body, raw signature,',
  'or full request headers.',
  'Do not depend on a `nextRetryAt` field.',
  'route incidents from `status`, `attempts`, `lastStatusCode`, `lastError`, `createdAt`, and `deliveredAt`.',
  '<Card title="Delivery ID" icon="fingerprint">',
  'Store `id` for delivery-level idempotency and support lookup.',
  '<Card title="Event Join" icon="link">',
  'Store `streamEventId` to join back to the stored monitor event',
  '<Card title="Status Route" icon="route">',
  'route `pending`, `failed`, and `exhausted` deliveries',
  '<Card title="Attempt Count" icon="repeat-2">',
  'failed delivery is early, repeated, or at',
  '<Card title="Receiver Result" icon="activity">',
  'Use `lastStatusCode` to separate receiver errors',
  '<Card title="Failure Reason" icon="triangle-alert">',
  'Show `lastError` as the most recent failure reason',
  '<Card title="Timing" icon="timer">',
  'Compare `createdAt` and `deliveredAt`',
  '## Incident response handoff',
  '"record_type": "webhook_delivery_incident_handoff"',
  '"webhook_id": "15"',
  '"delivery_id": "503"',
  '"stream_event_id": "9003"',
  '"terminal_reason": "receiver_returned_410"',
  '"event_join": "GET /api/v1/events/9003"',
  '"verification_check": "POST /api/v1/webhooks/15/test"',
  '"action": "page_receiver_owner"',
  '"handoff_state": "fix_receiver_then_send_signed_test"',
  '<Card title="Repeated failure" icon="repeat-2">',
  '<Card title="Terminal delivery" icon="circle-x">',
  'the 10-attempt cap, or the receiver returned `410 Gone`.',
  '<Card title="Event join" icon="link">',
  '<Card title="Receiver proof" icon="shield-check">',
  '"attempts": 10',
  'Failures retry up to 10 attempts with exponential backoff, starting at 1 second and capped at 60 seconds.',
  'A `410 Gone` response marks the delivery `exhausted` immediately.',
  'Other non-`2xx` responses and network failures stay `failed` until they are delivered or exhaust all attempts.',
  'page on `exhausted`, warn on repeated `failed`, and ignore `delivered`.',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '### Receiver backfill handoff',
  '"record_type": "webhook_delivery_backfill_handoff"',
  '"event_source": "GET /api/v1/events?limit=100&after={nextCursor}"',
  '"source_filter": "monitorId for account monitors, keywordMonitorId for keyword monitors"',
  '"join_key": "delivery.streamEventId == event.id"',
  '"stop_when": "hasMore is false"',
  '"handoff_state": "receiver_fixed_backfill_events_then_resume_webhooks"',
  'Store `nextCursor` after every event page.',
  'Add `monitorId` when replaying one account',
  'or `keywordMonitorId` when replaying one keyword monitor.',
  'then compare each event `id` with delivery `streamEventId` values',
  '## Delivery statuses',
  '<Card title="pending" icon="clock">',
  'Delivery is queued and waiting for the next attempt.',
  '<Card title="delivered" icon="circle-check">',
  'Your endpoint returned `2xx`. Delivery is complete.',
  '<Card title="failed" icon="triangle-alert">',
  'the endpoint returned non-`2xx`',
  'Xquik retries with exponential backoff.',
  '<Card title="exhausted" icon="circle-x">',
  'All retry attempts have been used.',
  'Xquik will not retry this delivery.',
] as const;

const FORBIDDEN_WEBHOOK_DELIVERIES_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_VERIFICATION_SNIPPETS = [
  'if (!verifyWebhook(req, WEBHOOK_SECRET))',
  'if not verify_webhook(request, WEBHOOK_SECRET):',
  '<timestamp>.<nonce>.<rawBody>',
  'Verify the raw body bytes',
  'Compute the HMAC over the raw request body bytes',
  '## Receiver hardening handoff',
  '"workflow": "webhook_receiver_hardening"',
  '"raw_body": true',
  '"replay_window_ms": 300000',
  '"secret_logging": "never"',
  '"key": "webhook_id:nonce"',
  '"ttl_seconds": 300',
  '"on_duplicate": "reject"',
  '"test_payload_omits_ids": true',
  '"source": "GET /api/v1/webhooks/15/deliveries"',
  '"handoff_state": "verify_raw_body_store_nonce_then_dedupe_delivery"',
  '<Card title="Raw body first" icon="braces">',
  '<Card title="Nonce store" icon="database">',
  '<Card title="Secret hygiene" icon="shield-check">',
  '<Card title="Incident fields" icon="activity">',
  '`status`, `attempts`, `lastStatusCode`, `lastError`, `createdAt`, and',
  'Production monitor deliveries include `deliveryId` and `streamEventId`.',
  '`webhook.test` deliveries include `eventType`, `data`, and `timestamp`; they omit monitor idempotency fields.',
  'Use `deliveryId` as the webhook delivery idempotency key.',
  'Use `streamEventId` when your system should process one monitor event only once across webhook retries or endpoint changes.',
  'Do not hash the raw request body when `deliveryId` is available.',
  '### Production store contract',
  '"record_type": "webhook_receiver_store_contract"',
  '"nonce_key": "webhook:15:nonce_hash"',
  '"nonce_ttl_seconds": 300',
  '"delivery_key": "webhook:15:delivery:502"',
  '"event_key": "event:9002"',
  '"duplicate_delivery_status": 200',
  '"duplicate_event_status": 200',
  '"ack_after": "signature_verified_and_queue_row_written"',
  '"ack_status": 202',
  '"slow_work": "async_worker"',
  '"delivery_log": "GET /api/v1/webhooks/15/deliveries"',
  '"shared_storage_excludes": [',
  '"raw_request_body"',
  'Keep raw request bytes only for signature verification.',
  'Store the nonce cache',
  'marker, delivery key, event key, join route, and processing status',
  'Return `2xx` only after verification and a durable queue',
  'finish within the 10-second delivery timeout.',
  'if (event.eventType === "webhook.test")',
  'if event.get("eventType") == "webhook.test":',
  'if event.EventType == "webhook.test" {',
  'processedDeliveries.add(event.deliveryId)',
  'processed_events.add(stream_event_id)',
  'processedDeliveries.LoadOrStore(',
  'event.DeliveryID,',
  'processedEvents.LoadOrStore(',
  'event.StreamEventID,',
] as const;

const REQUIRED_WEBHOOK_OVERVIEW_SNIPPETS = [
  'Account and keyword monitors check every second.',
  'Webhooks deliver matched events',
  'Keyword monitors support tweet event types only.',
  'Output: monitor ID, username or query, and selected event types.',
  '## Choose the webhook source',
  '<Card title="Account activity" icon="user-round">',
  'Create `POST /monitors` when one X account should emit selected tweet and',
  '`monitorId`, `username`, `xUserId`, and',
  '<Card title="Keyword matches" icon="search">',
  'Create `POST /monitors/keywords` when a query should emit matching tweet',
  '`keywordMonitorId`, `query`, and `eventTypes`.',
  '<Card title="Receiver endpoint" icon="webhook">',
  'Create `POST /webhooks` after the monitor.',
  'selected `eventTypes`, and one-time `secret` before sending tests.',
  '<Card title="Replay and audit" icon="rotate-ccw">',
  'Use `GET /events` for stored monitor events and',
  '`GET /webhooks/{id}/deliveries` for delivery attempts.',
  'Join on',
  '`streamEventId`.',
  'POST https://xquik.com/api/v1/monitors/keywords',
  '"query": "xquik launch"',
  'Store the returned monitor `id`; account events include `username`, keyword events include `query`.',
  'Account or keyword monitor event -> Xquik -> Your Webhook Endpoint',
  '<Card title="Keyword monitor setup" icon="search" href="/api-reference/monitors/create-keyword">',
  'base 1 second, multiplier 2x, max 60 seconds',
  'Final attempt. If it fails, the delivery is marked as `exhausted`.',
  'After the 10th failed attempt, the delivery is marked as `exhausted`.',
  'A `410 Gone` response exhausts the delivery immediately.',
  'Other non-`2xx` responses and network failures retry until the delivery is exhausted.',
  '## Backfill after a receiver outage',
  '"record_type": "webhook_receiver_backfill"',
  '"event_backfill_endpoint": "GET /api/v1/events?limit=100&after={nextCursor}"',
  '"source_filter": "monitorId for account monitors, keywordMonitorId for keyword monitors"',
  '"join_key": "delivery.streamEventId == event.id"',
  '"stop_when": "hasMore is false"',
  '"handoff_state": "receiver_fixed_resume_webhook_page_events_join_deliveries"',
  'Store `nextCursor` after every event page.',
  'Reprocess events whose `id` matches',
  'failed or exhausted delivery `streamEventId` values',
  'Scope event pages with `monitorId` for account monitors or',
  '`keywordMonitorId` for keyword monitors when the source is known;',
  'Type `string`. Webhook delivery attempt ID.',
  'delivery-level idempotency key and use it for delivery-log correlation.',
  'Type `string`. Stored monitor event ID.',
  'de-dupe key when one monitor event should be processed once across webhook',
  'Type `number`. Webhook payload schema version.',
  'Type `string`. Keyword query that matched the event.',
  'Omitted for keyword-only monitor events and `webhook.test`.',
  '### Receiver storage row',
  '"record_type": "webhook_receiver_event"',
  '"signature_verified": true',
  '"nonce_cache_key": "webhook:15:nonce_hash"',
  '"event_join": "GET /api/v1/events/9001"',
  'Use `deliveryId` for delivery-level retries and `streamEventId` for event-level processing.',
  'Do not store endpoint signing values, the raw request body, the raw signature, or full headers in shared incident rows.',
  '## Troubleshoot a delivery',
  '"record_type": "webhook_delivery_troubleshooting"',
  '"signed_test": "POST /api/v1/webhooks/15/test"',
  '"delivery_log": "GET /api/v1/webhooks/15/deliveries"',
  '"event_join": "GET /api/v1/events/{id}"',
  '"event_id_source": "streamEventId"',
  '"test_payload_has_ids": false',
  '"production_payload_ids": ["deliveryId", "streamEventId"]',
  '"handoff_state": "verify_signature_resume_if_needed_check_delivery_join_event"',
  '<Card title="Signed receiver test" icon="flask-conical">',
  '<Card title="Signature and IDs" icon="shield-check">',
  '<Card title="Delivery triage" icon="activity">',
  '<Card title="Event context" icon="link">',
  'Treat `success: true`',
  '`webhook.test` omits `deliveryId` and',
  'production deliveries include both IDs.',
  'Page on `exhausted`, warn on repeated `failed`, and ignore',
  'Join `streamEventId` to [Get Event](/api-reference/events/get)',
] as const;

const REQUIRED_WEBHOOK_ARCHITECTURE_SNIPPETS = [
  '<Card title="Event types" icon="radio">',
  'Account monitors emit `tweet.new`, `tweet.reply`, `tweet.quote`, and',
  '<Card title="Signed delivery" icon="shield-check">',
  'Verify `X-Xquik-Signature`, `X-Xquik-Timestamp`, and',
  '<Card title="Retry schedule" icon="rotate-ccw">',
  'Failed deliveries retry up to 10 attempts with exponential backoff: base 1',
  '<Card title="Receiver timeout" icon="timer">',
  'Webhook receivers should return `2xx` within 10 seconds.',
  '<Card title="Event propagation" icon="activity">',
  'Events usually appear within seconds to minutes',
] as const;

const REQUIRED_ARCHITECTURE_COMPONENT_SNIPPETS = [
  '<Card title="REST API" icon="braces">',
  '128 documented operations at `https://xquik.com/api/v1/*`',
  '<Card title="MCP server" icon="bot">',
  '2 tools, `explore` and `xquik`, at `https://xquik.com/mcp`',
  '<Card title="Dashboard" icon="layout-dashboard">',
  'Manage API keys, connected X accounts, monitors, extractions, draws,',
  '<Card title="Monitoring & webhooks" icon="radio">',
  'Track accounts or keywords, store events, and deliver HMAC-signed webhook',
  '<Card title="Extractions & draws" icon="archive">',
  'Run stored jobs for followers, replies, quotes, retweeters, favoriters,',
  '<Card title="Write actions" icon="send">',
  'Post tweets and replies, upload media, send DMs, follow, like, retweet,',
] as const;

const REQUIRED_ARCHITECTURE_AUTHENTICATION_SNIPPETS = [
  '<Card title="API header" icon="key-round">',
  'Send `x-api-key` on every REST API request.',
  '<Card title="Key format" icon="fingerprint">',
  'Keys start with `xq_` followed by 64 hex characters.',
  '<Card title="One-time display" icon="shield-check">',
  'Xquik returns the full key only during creation.',
  '<Card title="Revocation" icon="ban">',
  'Revoked or inactive keys stop authenticating immediately',
  '<Card title="Audit trail" icon="clock">',
  'Account audit views show API-key activity',
  '<Card title="OAuth 2.1" icon="lock-keyhole">',
  '[OAuth 2.1 with S256 PKCE](/oauth/overview)',
  '<Card title="Key management" icon="key-round">',
  'Create and revoke keys through the authenticated dashboard.',
] as const;

const REQUIRED_ARCHITECTURE_DATA_ISOLATION_SNIPPETS = [
  '<Card title="Monitors" icon="radio">',
  'Account and keyword monitors are scoped to the creating user account.',
  '<Card title="Events" icon="activity">',
  'Stored events resolve through account or keyword monitor ownership',
  '<Card title="Webhooks" icon="webhook">',
  'Webhook endpoints, signing configuration, and delivery logs belong to one',
  '<Card title="Extractions" icon="archive">',
  'Extraction jobs, result pages, and exports belong to the user that created',
  '<Card title="Draws" icon="gift">',
  'Giveaway draws, entries, and winner lists belong to the user that created',
  '<Card title="API keys" icon="key-round">',
  'API-key listing, creation, and revocation filter by the authenticated user',
] as const;

const REQUIRED_ARCHITECTURE_RATE_LIMIT_SNIPPETS = [
  '<Card title="Read bucket" icon="database">',
  '`GET`, `HEAD`, and `OPTIONS` share a standard user limit of 300 requests per',
  '<Card title="Write bucket" icon="pen-line">',
  '`POST`, `PUT`, and `PATCH` share a standard user limit of 120 requests per',
  '<Card title="Delete bucket" icon="circle-x">',
  '`DELETE` requests are limited to 60 requests per 60 seconds.',
  '<Card title="Retry window" icon="timer">',
  'Throttled reads return `Retry-After: 1`; throttled writes and deletes',
] as const;

const REQUIRED_ARCHITECTURE_BILLING_SNIPPETS = [
  '<Card title="Subscriptions" icon="credit-card">',
  'Starter, Pro, and Business plans run from USD 20 to USD 199 per month',
  'include monthly credits.',
  '<Card title="Active monitors" icon="radio">',
  'Monitor slots are unlimited. Active monitors check every 1 second',
  'cost 21 credits per active monitor-hour.',
  '<Card title="Credit top-ups" icon="wallet">',
  'Top up from USD 10.',
  'Credits are priced at USD 0.00015 each.',
  '[Billing & Usage](/guides/billing#credit-top-ups).',
] as const;

const REQUIRED_ARCHITECTURE_USAGE_SNIPPETS = [
  '<Card title="Credit-metered work" icon="gauge">',
  'Paid X reads, media downloads, trends, extraction estimates, extraction',
  'creation, monitor creation, active monitor hours, and draw execution can',
  'consume credits.',
  '<Card title="Credit access" icon="lock-keyhole">',
  'Tweet search, user and follower lookup, article lookup, media download,',
  'trends, draw creation, and publish actions require enough available credits.',
  '<Card title="Free management paths" icon="list-check">',
  'List, read, update, delete, export, test, and delivery-history paths stay',
  'free for draws, extractions, monitors, events, and webhooks.',
  '<Card title="Free utilities" icon="sparkles">',
  'Compose, cached styles, drafts, radar, account, API keys, X accounts,',
  'support, credit balance, and credit top-up endpoints are free.',
] as const;

const REQUIRED_ARCHITECTURE_LIMITATION_SNIPPETS = [
  '<Card title="Bookmarked tweets" icon="bookmark">',
  'Bookmarks and bookmark folders require a connected X account.',
  '[bookmarks](/api-reference/x/bookmarks)',
  '[bookmark folders](/api-reference/x/bookmark-folders)',
  '<Card title="Export caps" icon="download">',
  'Extraction exports are capped at 100,000 rows.',
  'PDF exports are capped at',
  '10,000 rows.',
  '<Card title="Webhook retries" icon="rotate-ccw">',
  'Webhook deliveries try up to 10 attempts.',
  '`410 Gone` exhausts immediately;',
  'other failures retry until delivered or exhausted.',
  '<Card title="Monitor slots" icon="activity">',
  'Active monitors check every 1 second',
  'cost 21 credits per active monitor-hour.',
] as const;

const FORBIDDEN_ARCHITECTURE_LIMITATION_SNIPPETS = [
  '| Limitation | Detail |',
  '|------------|--------|',
  '| **Bookmarked tweets** | Bookmarks require an authenticated X account connection |',
  '| **Export cap** | File exports are capped at 100,000 rows per extraction (10,000 for PDF). Formats: CSV, JSON, MD, MD Document, PDF, TXT, XLSX |',
  '<Card title="Single region" icon="map-pin">',
  'multi-region replication',
] as const;

const FORBIDDEN_ARCHITECTURE_COMPONENT_SNIPPETS = [
  '| Component | Role |',
  '|-----------|------|',
  'for programmatic access |',
  'for AI agent integration |',
  'Web UI for managing monitors, running extractions, viewing results |',
] as const;

const FORBIDDEN_ARCHITECTURE_AUTHENTICATION_SNIPPETS = [
  '| **Header** | `x-api-key`',
  '| **Key format** | `xq_` prefix + 64 hex characters |',
  '| **OAuth 2.1** | MCP server supports',
  'SHA-256 key hash',
  '`lastUsedAt`',
  '<Card title="Session auth" icon="cookie">',
] as const;

const FORBIDDEN_ARCHITECTURE_DATA_ISOLATION_SNIPPETS = [
  '| Resource | Isolation |',
  '|----------|-----------|',
  '| **Monitors** | Each user sees only their own monitors |',
  "| **Events** | Events are scoped to the user's monitors |",
  '| **API Keys** | Users manage only their own keys (session auth required) |',
] as const;

const FORBIDDEN_ARCHITECTURE_RATE_LIMIT_SNIPPETS = [
  '| Tier | Methods | Limit |',
  '|------|---------|-------|',
  '| **Read** | `GET`, `HEAD`, `OPTIONS` | 60 per 1s |',
  '| **Write** | `POST`, `PUT`, `PATCH` | 30 per 60s |',
  '| **Delete** | `DELETE` | 15 per 60s |',
] as const;

const FORBIDDEN_ARCHITECTURE_BILLING_SNIPPETS = [
  '| Aspect | Detail |',
  '|--------|--------|',
  '| **Subscription** | USD 20-199/month. Includes a monthly credit allowance |',
  '| **Active monitors** | Unlimited slots. Active instant monitors cost 21 credits per hour |',
  '| **Credit top-ups** | Purchase additional credits at USD 0.00015/credit via the dashboard.',
] as const;

const FORBIDDEN_ARCHITECTURE_USAGE_SNIPPETS = [
  '| Metered (consumes quota) | Free (unlimited) |',
  '|--------------------------|------------------|',
  '| Tweet searches | Monitor management |',
  '| User lookups | Event retrieval |',
  '| Write actions (tweet, like, retweet, follow, DM, profile, media) | Radar |',
] as const;

const REQUIRED_WEBHOOK_TYPES_SNIPPETS = [
  'schemaVersion: 1;',
  'deliveryId: string;',
  'streamEventId: string;',
  'occurredAt: string;',
  'query?: string;',
  'interface WebhookTestPayload',
  'eventType: "webhook.test";',
  'Account monitor events include `username`; keyword monitor events include `query`.',
  '`webhook.test` payloads include `timestamp` and omit monitor-only fields',
] as const;

const FORBIDDEN_WEBHOOK_OVERVIEW_SNIPPETS = [
  'After 5 failed attempts',
  'Client errors (400',
  'automatically disabled after 5 consecutive',
  'Present on all event types except `webhook.test`',
] as const;

const FORBIDDEN_WEBHOOK_ARCHITECTURE_SNIPPETS = [
  '5 retries, exp.',
  '5 attempts with exponential backoff',
  '5 attempts maximum',
  '| **Delivery** | HMAC-SHA256 signed HTTPS POST to registered webhook endpoints |',
  '| **Retries** | 10 attempts with exponential backoff: base 1 second, multiplier 2x, max 60 seconds. `410 Gone` exhausts immediately. |',
] as const;

const FORBIDDEN_WEBHOOK_VERIFICATION_SNIPPETS = [
  'verifyWebhookSignature(',
  'verify_webhook_signature(',
  'payload does not include a built-in delivery ID',
  'compute a hash of the raw request body to deduplicate events',
  'Deduplicate by hashing the raw payload',
  'processedPayloads',
  'processed_payloads',
] as const;

const FORBIDDEN_DIRECT_MESSAGE_WORKFLOW_SNIPPETS = [
  'It can contain up to 10,000 characters.',
  '"media_id": null',
  '"media_url": null',
] as const;

const REQUIRED_DM_HISTORY_API_SNIPPETS = [
  'title: "Twitter DM API for Message History & CRM Sync"',
  'Get DM history',
  'GET /x/dm/{userId}/history',
  'Read participant-scoped Twitter DMs with a connected account.',
  'Twitter DM API',
  'Twitter API DM',
  'Twitter DM history API',
  'X DM history API',
  'This Twitter API DM endpoint reads participant-scoped conversation history.',
  'Pass the connected participant account through `account`.',
  '[X\'s Direct Messages lookup guide](https://docs.x.com/x-api/direct-messages/lookup/introduction)',
  'Requires a connected X account passed via the `account` query parameter.',
  'DM history is participant-scoped',
  'DM history requires a connected participant account.',
  'DM history responses can contain private message text.',
  'Do not write full DM bodies to shared logs or public artifacts.',
  '## Which DM workflow?',
  '<Card title="Read conversation history" icon="history">',
  '`GET /x/dm/{userId}/history` with `account`',
  '`messages[].id` and `next_cursor` in a private system.',
  '<Card title="Send text reply" icon="send">',
  '[`POST /x/dm/{userId}`](/api-reference/x-write/send-dm)',
  'store the returned `messageId`',
  '<Card title="Send one media item" icon="image">',
  '[`POST /x/media`](/api-reference/x-write/upload-media)',
  'the only `media_ids` item',
  '<Card title="Resolve participant ID" icon="user-search">',
  '[`GET /x/users/{id}`](/api-reference/x/twitter-profile-lookup)',
  'params={"account": "your_handle"}',
  'function historyUrl(userId, account, cursor) {',
  'const params = new URLSearchParams({ account });',
  'if (cursor) params.set("cursor", cursor);',
  'function toDmHistoryRows(page, { account, userId }) {',
  'record_type: "dm_history"',
  'conversation_user_id: userId',
  'message_id: message.id',
  'sender_id: message.senderId',
  'receiver_id: message.receiverId',
  'message_text: message.text ?? null',
  'created_at: message.createdAt ?? null',
  'media_url: message.mediaUrl ?? null',
  'page_next_cursor: page.has_next_page ? page.next_cursor : null',
  'source_endpoint: `/api/v1/x/dm/${userId}/history`',
  'const historyRows = toDmHistoryRows(data, { account, userId });',
  'await savePrivateDmHistoryRows(historyRows);',
  'const nextRows = toDmHistoryRows(nextData, { account, userId });',
  'await savePrivateDmHistoryRows(nextRows);',
  'def to_dm_history_rows(page, account, user_id):',
  '"record_type": "dm_history"',
  '"conversation_user_id": user_id',
  '"message_id": message["id"]',
  '"sender_id": message["senderId"]',
  '"receiver_id": message["receiverId"]',
  '"message_text": message.get("text")',
  '"created_at": message.get("createdAt")',
  '"media_url": message.get("mediaUrl")',
  '"page_next_cursor": page["next_cursor"] if page["has_next_page"] else None',
  '"source_endpoint": f"/api/v1/x/dm/{user_id}/history"',
  'history_rows = to_dm_history_rows(data, "your_handle", "44196397")',
  'save_private_dm_history_rows(history_rows)',
  'next_rows = to_dm_history_rows(data, "your_handle", "44196397")',
  'save_private_dm_history_rows(next_rows)',
  'These examples turn each page into private `dm_history` rows. Store',
  '`message_id`, `sender_id`, `receiver_id`, `message_text`, and `created_at`.',
  'Also store optional `media_url`, `conversation_user_id`, `sender_account`, and',
  '`page_next_cursor` for each page.',
  'Keep `message_text` only in private systems',
  '<ParamField query="account" type="string" required>',
  'Use the previous response\'s `next_cursor` to fetch older messages.',
  'Legacy pagination cursor. Use `cursor` for new integrations.',
  'messages',
  'has_next_page',
  'next_cursor',
  'senderId',
  'receiverId',
  'createdAt',
  'mediaUrl',
  '{ "error": "account_required"',
  '{ "error": "dm_not_permitted"',
  '{ "error": "account_needs_reauth" }',
  'account_not_found',
  '424 Dependency Failed',
  'Send `xquik-api-contract: 2026-04-29` to opt in. Default v1 returns 502.',
  '1 credit per result returned',
  '## Twitter DM API Questions',
  'It does not register webhooks.',
  'Send an API key or OAuth bearer token.',
  'Wait for `Retry-After`, then retry the same page.',
  '## History sync handoff',
  'Store `messages[].id` as the external DM ID',
  'Store `messages[].senderId` and `messages[].receiverId`',
  'Store `next_cursor` when `has_next_page` is true',
  'Store optional `messages[].mediaUrl` with `messages[].createdAt`',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  '[Get User](/api-reference/x/twitter-profile-lookup)',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[Upload Media](/api-reference/x-write/upload-media)',
  'participant-scoped history sync',
] as const;

const FORBIDDEN_DM_HISTORY_LOG_SNIPPETS = [
  'process.stdout.write(`${JSON.stringify(data.messages, null, 2)}\\n`);',
  'process.stdout.write(`${JSON.stringify(nextData.messages, null, 2)}\\n`);',
  'const messages = data.messages;',
  'const nextMessages = nextData.messages;',
  'messages = data["messages"]',
  'next_messages = data["messages"]',
  'print(data["messages"])',
] as const;

const REQUIRED_SEND_DM_API_SNIPPETS = [
  'title: "Twitter DM API: Send Direct Messages with Media"',
  'sidebarTitle: "Send DM"',
  'description: "Send text or one media attachment through the Twitter DM API.',
  'Twitter DM API',
  'Twitter API DM',
  'Twitter API send DM',
  'messageId',
  '## Send Direct Messages with the Twitter DM API',
  'Use this Twitter DM API for approved, one-to-one messages.',
  'This Twitter API send DM workflow supports SDKs, support tools, and server jobs.',
  "[X's Direct Message rules](https://docs.x.com/x-api/direct-messages/manage/integrate)",
  'const dmResponse = await fetch(',
  'const dmAction = await dmResponse.json();',
  'if (!dmResponse.ok) {',
  'process.stdout.write(`${JSON.stringify(dmAction)}\\n`);',
  '## Authenticate and Select the Recipient',
  'Authenticate with an `x-api-key` header or an OAuth bearer token.',
  'Honor recipient privacy, consent, and opt-out decisions.',
  '[DM history](/api-reference/x/dm-history)',
  '## Send Text or One Media Attachment',
  'Upload media first with [Upload Media](/api-reference/x-write/upload-media)',
  'Place its `mediaId` inside a one-item `media_ids` array.',
  'This route also rejects `reply_to_message_id`.',
  'It does not send group messages or accept public media URLs.',
  '## Poll and Verify the Direct Message',
  'Wait for `terminal: true` before closing the send job.',
  'The Xquik POST limit is 120 requests per minute.',
  '## Handle Every Twitter DM API Response',
  '`422 x_dm_not_allowed` means this sender cannot message that person.',
  'Try another approved sender or ask the person to allow DMs.',
  'Honor `Retry-After` after `429`.',
  'After `500` or `503`, inspect `safeToRetry` before retrying.',
  '## Twitter DM API Questions',
  '### Can I automate customer support direct messages?',
  '### Can I send images or video through the API?',
  '### Does this endpoint retrieve message history or create webhooks?',
  '### Can third-party tools and generated SDKs call this route?',
  'OAuth bearer authentication is also supported.',
  '<WriteActionLifecycleResponse />',
] as const;

const FORBIDDEN_SEND_DM_API_SNIPPETS = [
  'const data = await response.json();',
  'const result = await response.json();',
  'Session cookie authentication is also supported.',
  'const uploadedMediaId = null;',
  'data = response.json()',
  'uploaded_media_id = None',
  'fmt.Println(data)',
  'var uploadedMediaID *string',
  'Maximum 10,000 characters.',
] as const;

const REQUIRED_COMPOSE_STYLE_SNIPPETS = [
  'savedStyles',
  'savedStyles[].username',
  'savedStyles[].tweetCount',
  'styleTweets',
  'styleNote',
  'Present when `styleUsername` matches a cached style.',
  '`ComposeRequest` drives a 3-step writing flow.',
  'Compose responses may include `savedStyles`, `styleTweets`, or',
] as const;

const FORBIDDEN_DM_HISTORY_SDK_EXAMPLE_SNIPPETS = [
  'client.x.dm.retrieveHistory(',
  'client.x.dm.retrieve_history(',
  'client.X.Dm.GetHistory(',
  'x-twitter-scraper x:dm retrieve-history',
  'x:dm retrieve-history',
] as const;

const REQUIRED_WORKFLOW_OVERVIEW_SNIPPETS = [
  'Choose the handoff here, then open the focused workflow or API page for copy-ready examples.',
  '## Use-Case Endpoint Finder',
  'Start here when a user asks which Xquik endpoint to call.',
  '- **One tweet by ID:** `GET /x/tweets/{id}`.',
  '- **Many known tweet IDs:** `GET /x/tweets`.',
  'Batch response before single-tweet loops',
  '- **Keyword or advanced search:** `GET /x/tweets/search`.',
  '`tweet_search_extractor` exports',
  '- **Profile timeline:** `GET /x/users/{id}/tweets`.',
  '`includeReplies`, and `includeParentTweet`',
  '- **Article body:** `GET /x/articles/{tweetId}`.',
  'not-found handling',
  '- **Replies, quotes, or threads:** `GET /x/tweets/{id}/replies`.',
  'Conversation rows from replies, quotes, or threads',
  '- **Follower or following page:** `GET /x/users/{id}/followers` or `GET /x/users/{id}/following`.',
  'Handoff: `users`, `has_next_page`, and `next_cursor`.',
  '- **Follower or following export:** `POST /extractions/estimate`.',
  '`follower_explorer` or `following_explorer` estimate',
  '- **Campaign verification:** `GET /x/followers/check`, retweeters, replies, quotes, or draws.',
  'Handoff: proof exports',
  '- **Direct messages:** `GET /x/dm/{userId}/history`.',
  'outbound `messageId`, and success',
  '- **1-second monitoring:** `POST /monitors` or `POST /monitors/keywords`.',
  'Signed payloads and delivery IDs',
  '- **AI agent handoff:** `xquik.request(...)`.',
  '- **Saved file exports:** `GET /extractions/{id}/export`.',
  '`GET /extractions/{id}/export`',
  '## Integration Handoff Matrix',
  '## High-Value Workflows First',
  'rows for analysts, IDs for systems of record, events for queues, and published action IDs for audit trails',
  '### 1. Scrape tweets to CSV, JSON, or XLSX',
  '`tweet_search_extractor`',
  '`GET /x/tweets/search`',
  'leave `limit` unset for a simple cursor loop',
  'keep the same `q`, filters, and `limit` while sending `next_cursor` as `cursor`',
  '`tweets`, `has_next_page`, and `next_cursor`',
  'For reply-specific exports, use the next workflow.',
  '1 credit per tweet returned or extracted',
  '### 2. Scrape tweet replies to CSV, JSON, or XLSX',
  'moderation, support, giveaway, research, or AI review system',
  '`reply_extractor` and `targetTweetId`',
  '"toolType": "reply_extractor"',
  '"targetTweetId": "1893704267862470862"',
  '`format=csv`, `format=json`, or `format=xlsx`',
  'pass `nextCursor` as `after` for more stored results',
  '`GET /x/tweets/{id}/replies`',
  'pass `next_cursor` back as `cursor`',
  '### 3. Export followers or following to CRM',
  '`follower_explorer`',
  '`following_explorer`',
  '`x_user_id`',
  '1 credit per user returned',
  '### 4. Monitor tweets to signed webhooks',
  '`POST /monitors` for accounts or `POST /monitors/keywords` for search queries',
  'account alerts, keyword alerts, support routing, warehouse ingest, or queue fanout',
  'For query alerts, call `POST /monitors/keywords` with `query` and `eventTypes` instead of `username`.',
  'Account and keyword monitors both check every 1 second while active, and both can deliver events to the same signed webhooks.',
  '`deliveryId`, `streamEventId`, `eventType`, and tweet data',
  'Store the one-time `secret` returned by `POST /webhooks` and verify `X-Xquik-Signature` against the raw body before accepting the event.',
  '#### Receiver storage handoff',
  'For Zapier, Make, and Pipedream receivers, map production payload IDs before enqueueing slow work:',
  '"record_type": "workflow_webhook_receiver_parity"',
  '"delivery_id": "502"',
  '"stream_event_id": "9002"',
  '"duplicate_delivery_status": "2xx"',
  '"duplicate_event_status": "2xx"',
  '"shared_storage_excludes": [',
  '"endpoint_signing_values"',
  '"raw_request_body"',
  '"raw_signature"',
  '"full_headers"',
  'Return `2xx` for duplicate `deliveryId` or `streamEventId` after signature verification.',
  'Store raw request bytes only long enough to verify `X-Xquik-Signature`',
  '21 credits per active monitor-hour; webhook delivery is included',
  '### 5. Post media tweets or replies',
  '`POST /x/tweets` with `media`',
  'Do not call `POST /x/media` first for tweet posts when the media is already public',
  '`POST /x/tweets` rejects `media_ids` with `400 unsupported_field`',
  '"media": ["https://example.com/product-screenshot.png"]',
  'The response is a durable action record.',
  'Store `id`, `status`, `billing`, `result`, `request.hash`, and `statusUrl`.',
  'Poll while `terminal` is false.',
  'Retry only when `safeToRetry` is true, using a new `Idempotency-Key`.',
  'Use `POST /x/media` only when you need a one-item `media_ids` array for [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm).',
  '30 credits text-only, plus 2 credits per started MB across attached media',
  '### 6. Send direct messages with returned IDs',
  '`GET /x/users/{id}` if needed; use `GET /x/dm/{userId}/history?account=...`, then `POST /x/dm/{userId}`.',
  'Handoff: `account`, `messages`, `has_next_page`, `next_cursor`, `messageId`, and `success`.',
  '1 credit per user lookup or history message; 10 credits per DM send',
  'pass the same connected sender as `account` for history reads and DM writes',
  '--data-urlencode "account=brand_account"',
  'Missing `account` returns `400 account_required`; a non-participant account returns `403 dm_not_permitted`.',
  '`messageId` and `success`',
  '`POST /monitors` for accounts or `POST /monitors/keywords` for search queries, then `GET /events`',
  '`POST /webhooks`, then `POST /webhooks/{id}/test`',
  '`POST /extractions/estimate`, then `POST /extractions`',
  '`POST /x/tweets`',
  'Post tweets or replies',
  'post tweet replies',
  '`reply_to_tweet_id`',
  '`tweetId`, `success`, `charged`, and `chargedCredits`',
  '30 credits text-only, plus 2 credits per started MB across attached media',
  '`POST /compose` with `step`',
  'CSV, JSON, XLSX, or paginated JSON',
  '21 credits per hour',
  'Compose, refine, and score are free',
  '## Focused Workflow Pages',
  'Use the overview to choose the path, then move to the focused page for copy-ready examples, SDK handoff, and endpoint-specific error recovery.',
  '<Card title="Tweet search exports" icon="search" href="/guides/tweet-scraper-csv-export">',
  'Build CSV, JSON, or XLSX exports from `tweet_search_extractor`, or use direct `GET /x/tweets/search` pagination.',
  '<Card title="Tweet replies exports" icon="messages-square" href="/guides/tweet-replies-export">',
  '<Card title="Follower CRM export" icon="users" href="/guides/follower-export-crm">',
  '<Card title="Campaign verification" icon="badge-check" href="/guides/campaign-verification-workflow">',
  'Check social actions and draw exports.',
  '<Card title="Monitor webhooks" icon="webhook" href="/guides/twitter-webhook-testing">',
  'Test signed deliveries, verify `X-Xquik-Signature`, store `deliveryId` and `streamEventId`, and return `2xx` before slow work.',
  '<Card title="Media tweets and DMs" icon="image" href="/guides/media-upload-workflow">',
  '<Card title="Direct messages" icon="send" href="/guides/direct-message-workflow">',
  '<Card title="MCP agents" icon="bot" href="/mcp/overview">',
  '`xquik.request(...)`',
  '<Card title="Tweet composition" icon="pen-line" href="/api-reference/compose/create">',
] as const;

const FORBIDDEN_WORKFLOW_SECRET_LOG_SNIPPETS = [
  'console.log("Webhook secret:", webhook.secret)',
  'print("Webhook secret:", webhook["secret"])',
  'fmt.Println("Webhook secret:", secret)',
] as const;

const FORBIDDEN_WORKFLOW_OVERVIEW_BLOAT_SNIPPETS = [
  '<Tabs>',
  '<Tab title="Monitor & Poll">',
  '<Tab title="Real-Time Webhooks">',
  '<Tab title="AI Agent (MCP)">',
  '<Tab title="Tweet Composition">',
  '## Publish Tweets & Replies',
] as const;

const FORBIDDEN_WORKFLOW_OVERVIEW_STALE_SNIPPETS = [
  'use `limit` only for bounded pulls',
] as const;

const FORBIDDEN_WORKFLOW_ENDPOINT_FINDER_TABLE_SNIPPETS = [
  '| Job | First API | Best handoff |',
  '| One tweet by ID | `GET /x/tweets/{id}` |',
  '| Many known tweet IDs | `GET /x/tweets` |',
  '| Keyword or advanced search | `GET /x/tweets/search` |',
  '| Profile timeline | `GET /x/users/{id}/tweets` |',
  '| Saved file exports | `GET /extractions/{id}/export` |',
] as const;

const REQUIRED_CAMPAIGN_VERIFICATION_WORKFLOW_SNIPPETS = [
  'title: "Twitter Giveaway Picker API & Campaign Verification"',
  'Verify giveaway follows, retweets, replies, quotes, winners, and participant exports through one reviewable API workflow.',
  '## Pick the Proof Path',
  '<Card title="Follow Task" icon="user-check">',
  '`GET /api/v1/x/followers/check?source={participant}&target={brand}`',
  '<Card title="Retweet Task" icon="repeat-2">',
  '`GET /api/v1/x/tweets/{id}/retweeters`',
  '<Card title="Reply or Quote Task" icon="messages-square">',
  '`GET /api/v1/x/tweets/{id}/replies`',
  '`GET /api/v1/x/tweets/{id}/quotes`',
  '<Card title="Giveaway Selection" icon="trophy">',
  '`POST /api/v1/draws`',
  '## Twitter Giveaway Automation Questions',
  '### What Is the Best Tool to Run a Twitter Giveaway Draw Programmatically?',
  '### How Do I Automate a Twitter Giveaway With an API?',
  '### Automate Twitter Giveaway',
  '### Tweet Draw Tool',
  '### Twitter Giveaway Picker API',
  '### How Do I Prove Giveaway Winners Were Eligible?',
  '## Programmatic Twitter Giveaway Draw Checklist',
  '## Frequently Asked Questions',
  '### How Does the Twitter Giveaway Picker Work?',
  '### What Should I Publish With the Winner?',
  '## Follow Check',
  'participant_handle',
  '## Tweet-Level Checks',
  'Pass `next_cursor` back',
  'as `cursor`',
  '## Giveaway Draw',
  '"tweetUrl": "https://x.com/example_user/status/1893704267862470862"',
  '"winnerCount": 3',
  '"uniqueAuthorsOnly": true',
  '"mustRetweet": true',
  '"mustFollowUsername": "username"',
  '"requiredKeywords": ["entered"]',
  '`type=entries`',
  '`type=winners`',
  'campaign-entries.csv',
  '## Audit Row',
  '"campaign_id": "spring-launch-2026"',
  '"proof_endpoint": "GET /api/v1/x/followers/check"',
  '"verification_state": "matched"',
  '## Cost and Retry Notes',
  'Direct X read endpoints are metered. Budget by participant count and pages.',
  'Draw execution meters the source tweet lookup, replies, optional retweeter',
  'Treat `402 insufficient_credits` as a stopped audit.',
] as const;

const REQUIRED_TARGET_AUDIENCE_DISCOVERY_WORKFLOW_SNIPPETS = [
  'title: "Twitter Audience Discovery with Follower Exports"',
  'Find Twitter audience segments with user search, follower exports, following pages, verified followers, batch enrichment, and CSV or JSON handoff steps.',
  '"Twitter audience insights"',
  '"Twitter lead generation"',
  '## Define the Audience Question',
  'create an X Ads custom audience.',
  'does not return private emails,',
  '## Pick the Discovery Path',
  '<Card title="Keyword Seeds" icon="search">',
  '`GET /api/v1/x/users/search?q={query}`',
  '<Card title="Follower Expansion" icon="users">',
  '`follower_explorer`',
  '`GET /api/v1/x/users/{id}/followers`',
  '<Card title="Following Expansion" icon="user-plus">',
  '`following_explorer`',
  '`GET /api/v1/x/users/{id}/following`',
  '<Card title="Verified Segment" icon="badge-check">',
  '`verified_follower_explorer`',
  '`GET /api/v1/x/users/{id}/verified-followers`',
  '## Seed Accounts',
  '/api/v1/x/users/batch?ids=44196397,987654321',
  '## Expand the Audience',
  '"toolType": "follower_explorer"',
  '"targetUsername": "username"',
  '"resultsLimit": 5000',
  'target-audience.csv',
  '## Direct JSON Pages',
  '/api/v1/x/users/username/followers?pageSize=200',
  '/api/v1/x/users/username/following?pageSize=200',
  '/api/v1/x/users/44196397/verified-followers',
  'Store `has_next_page` and `next_cursor`',
  'as `cursor` only when `has_next_page` is true.',
  '## Combine Audience Sources',
  'Always join on numeric X user ID.',
  '"source_count": 3',
  '## Score Rows',
  '"audience_id": "ai-founder-q2"',
  '"source_route": "GET /api/v1/x/users/{id}/followers"',
  'Store `qualified`, `qualification_reasons`, and the ruleset version.',
  'Do not invent missing profile attributes.',
  '## Validate Active Conversation',
  '/api/v1/x/tweets/search?q=ai%20founder%20min_faves%3A10&verifiedOnly=true',
  '## Build a Twitter Lead Generation Handoff',
  'Xquik does not supply',
  'private email addresses or private messages through this workflow.',
  '`ruleset_version`',
  '## Measure Twitter Audience Insights',
  'They do not represent every',
  'X user or private demographic attribute.',
  '## Handle Audience Collection Failures',
  '## Twitter Audience Discovery Questions',
  "### How Do I Analyze a Competitor's Twitter Followers?",
  '### Can I Export Twitter Followers to CSV?',
  '### Can Xquik Return Twitter Audience Demographics?',
  '### How Do I Prevent Duplicate Audience Profiles?',
  '## Cost and Retry Notes',
  'Estimate extraction jobs before running large follower, following, verified',
  'Direct JSON pages are metered by returned user or tweet rows.',
  'Treat cursors as opaque route checkpoints.',
] as const;

const REQUIRED_BRAND_MONITORING_WORKFLOW_SNIPPETS = [
  'title: "Monitor Twitter Accounts & Keywords with Webhooks"',
  'sidebarTitle: Brand monitoring',
  'Monitor Twitter accounts, keywords, mentions, hashtags, products, and campaigns every second. Deliver signed webhook alerts with replayable stored events.',
  '## Pick the Monitor Path',
  '<Card title="Account Monitor" icon="radio">',
  '`POST /api/v1/monitors`',
  '<Card title="Keyword Monitor" icon="search">',
  '`POST /api/v1/monitors/keywords`',
  '<Card title="Signed Webhook" icon="webhook">',
  '`POST /api/v1/webhooks`',
  '<Card title="Stored Event Replay" icon="database">',
  '`GET /api/v1/events`',
  '## Answer Common Twitter Monitoring Questions',
  '### What Is the Best API to Track Twitter Keyword Mentions?',
  '### How Do I Monitor a Keyword on Twitter in Real Time?',
  'Twitter keyword monitor checks for matching tweets every 1 second.',
  '### Twitter Mention Tracking Tool',
  'Xquik provides a Twitter mention tracking tool for webhook review queues.',
  'Marketing teams can route matching tweets to their',
  'This routing helps protect brand reputation.',
  'Use precise queries to track Twitter mentions in relevant conversations for',
  'Xquik events to broader social listening tools for other networks.',
  '### What Is the Best Way to Monitor a Twitter Account Programmatically?',
  'The Twitter account monitor API follows new tweets, replies, reposts, and',
  '### How Do I Get Real-Time Twitter Alerts via Webhook?',
  'These Twitter webhook alerts remain',
  'They provide instant alerts without',
  '## Plan a Brand Monitoring Scope',
  'Teams comparing social media monitoring tools can use Xquik for X-specific',
  'Use an account monitor for one known profile.',
  'Use a keyword monitor for text that can appear across many profiles.',
  '## Create an Account Monitor',
  '"username": "username"',
  '"eventTypes": ["tweet.new", "tweet.reply", "profile.bio.changed"]',
  'Store the returned `id`, `username`, `xUserId`, `eventTypes`, `isActive`,',
  '## Create a Keyword Monitor',
  'Keep the query under 512 characters',
  '"query": "\\"Xquik\\" OR @username"',
  '## Write Focused Twitter Monitoring Queries',
  'Use tweet search to test each query before monitoring starts.',
  '## Deliver Events to a Webhook',
  'Store the returned `secret` once',
  '`deliveryId`, `streamEventId`, `eventType`, `timestamp`,',
  '## Route Real Time Alerts to the Right Team',
  'Use `streamEventId` as the event identity across webhook endpoints.',
  '## Replay Stored Events',
  '/api/v1/events?monitorId=42&eventType=tweet.new&limit=50',
  '/api/v1/events?keywordMonitorId=21&eventType=tweet.new&limit=50',
  'Store `hasMore` and `nextCursor`.',
  '## Add Search Backfill',
  '/api/v1/x/tweets/search?q=%22Xquik%22%20OR%20%40username&limit=50',
  '/api/v1/x/users/username/mentions?limit=50',
  '## Measure Brand Monitoring Coverage',
  'does not return a calculated share of voice.',
  'Build Twitter analytics downstream from unique tweet IDs and event windows.',
  'Let the social media management team approve posts in its publishing workflow.',
  'Classify sentiment only after storing the original tweet.',
  '## Receiver Row',
  '"brand_monitor_id": "brand-xquik-q2"',
  '"monitor_type": "keyword"',
  '"keyword_monitor_id": "21"',
  '"event_replay_route": "GET /api/v1/events?keywordMonitorId=21"',
  'endpoint signing values, raw request bodies, raw signatures, or full',
  '## Build a Brand Mention Triage Queue',
  'Avoid automatic public replies from a brand monitoring event.',
  '## Maintain Account and Keyword Monitors',
  'Compare each monitor\'s event types with webhook subscriptions.',
  '## Cost and Retry Notes',
  'Active account and keyword monitors check every 1 second and cost 21 credits',
  'Stored event listing is free.',
  'Pause inactive monitors with `PATCH /api/v1/monitors/{id}`',
] as const;

const REQUIRED_NO_CODE_WORKFLOW_HANDOFF_SNIPPETS = [
  'title: "No-Code Twitter Automation with Webhooks & Exports"',
  'Connect Xquik monitor webhooks, extraction jobs, tweet search pages, and follower exports to Zapier, Make, Pipedream, n8n, Sheets, CRM, and queue workflows.',
  '"Twitter automation tools"',
  '"n8n Twitter"',
  '"n8n Twitter node"',
  'This no code API pattern preserves checkpoints across visual workflow retries.',
  '## Choose a Twitter Automation Outcome',
  '| Alert on new tweets or replies | Account monitor webhook | `streamEventId` |',
  '## Pick the Handoff Lane',
  '<Card title="Monitor Event Webhooks" icon="radio">',
  '`POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`',
  '`POST /api/v1/webhooks`',
  '<Card title="Bulk Export Jobs" icon="database">',
  '`POST /api/v1/extractions`',
  'export CSV, JSON, or XLSX',
  '<Card title="Direct Read Pages" icon="search">',
  '`GET /api/v1/x/tweets/search`',
  '<Card title="Replay and Repair" icon="history">',
  '`GET /api/v1/events` and `GET /api/v1/webhooks/{id}/deliveries`',
  '### Webhook or Polling?',
  '## Monitor Event Trigger',
  '/api/v1/webhooks/15/test',
  'Verify the timestamp, nonce, and HMAC signature.',
  '`X-Xquik-Timestamp`, `X-Xquik-Nonce`, and `X-Xquik-Signature`',
  '### Map the Monitor Payload',
  '"schemaVersion": 1',
  '`deliveryId` as the per-endpoint retry key',
  'and `streamEventId` when one',
  '## Bulk Export Trigger',
  '/api/v1/extractions?status=completed&limit=25',
  '/api/v1/extractions/77777/export?format=csv',
  'Store `job.id`, `job.toolType`, `job.status`, `hasMore`, and `nextCursor`',
  '## Direct Read Loop',
  '/api/v1/x/tweets/search?q=xquik%20min_faves%3A10&limit=50',
  '/api/v1/x/users/username/followers?pageSize=200',
  'Commit rows and `next_cursor` together.',
  '### Choose Direct Reads by Task',
  '## Shared Row Shape',
  '"handoff_lane": "instant_monitor"',
  '"retry_key": "delivery_id:502"',
  '"event_dedupe_key": "stream_event_id:9002"',
  '"replay_route": "GET /api/v1/events?monitorId=42&after={nextCursor}"',
  '### Persist the Workflow Checkpoint',
  '"next_event_cursor": "9003"',
  'Keep API keys, endpoint signing values, raw request bodies, raw signatures, and',
  '## Platform Notes',
  '<Card title="Zapier" icon="zap" href="/guides/zapier">',
  '<Card title="Make" icon="route" href="/guides/make">',
  '<Card title="Pipedream" icon="code" href="/guides/pipedream">',
  '<Card title="n8n" icon="workflow" href="/guides/n8n">',
  '### Zapier Twitter Automation',
  '### Make Twitter Automation',
  '### Pipedream Twitter Automation',
  '### n8n Twitter Automation',
  '## Cost and Retry Notes',
  'Active account and keyword monitors check every 1 second and cost 21 credits',
  'Extraction jobs return `202` with `id`, `toolType`, and `status`.',
  '## Handle Webhook Retries and Missed Events',
  'Attempt 10 is final.',
  '`deliveryStatus`, `consecutiveFailures`, and',
  '`failureHardCap`.',
  '## Handle No-Code API Errors',
  '<Accordion title="429 rate limited">',
  '## Keep Twitter Automation Safe',
  '## No-Code Twitter Automation Questions',
  '### How Do I Automate Twitter Without Code?',
  '### Can Zapier Connect to a Twitter API?',
  '### How Do I Connect n8n to a Twitter API?',
  '### How Do I Recover Missed Twitter Events?',
  '### Can I Export Twitter Followers to Sheets or CRM?',
  '### Does No-Code Automation Bypass Twitter API Limits?',
] as const;

const REQUIRED_TWEET_PROFILE_API_FIELDS_SNIPPETS = [
  'title: "Tweet Metadata, Profile & Media API Field Guide"',
  '"tweet metadata"',
  '"Twitter profile API"',
  '"Twitter media API"',
  'Quick answer: treat IDs as strings.',
  '## Choose the Object Before Mapping Fields',
  '| Reply or thread relationship | Tweet | `conversationId` and `inReplyToId` |',
  '| Quote context | `quoted_tweet` | Nested tweet `id` |',
  '| Repost context | `retweeted_tweet` | Nested tweet `id` |',
  '## Field Presence Rules',
  '<Card title="Required Fields" icon="badge-check">',
  '<Card title="Optional Fields" icon="circle-dashed">',
  '<Card title="String IDs" icon="fingerprint">',
  '<Card title="Count Snapshots" icon="chart-no-axes-column">',
  'A zero tweet metric can mean X did not report that count.',
  '## Tweet Fields',
  '- Quote state: `isQuoteStatus` and `quoted_tweet`',
  '- Publishing client: `source`',
  '- Repost context: `retweeted_tweet`',
  '- Counts: `retweetCount`, `replyCount`, `likeCount`, and `quoteCount`',
  '### Tweet Metadata Example',
  '"conversationId": "1893600000000000000"',
  '"inReplyToId": "1893690000000000000"',
  '### Map Replies, Quotes, and Reposts',
  '<Card title="Note Tweet" icon="notebook-tabs">',
  '### Interpret Tweet Engagement Fields',
  '### Map Entities and Content Labels',
  '## Profile Fields',
  '- Verification: `verified`, `isVerified`, `isBlueVerified`, and `verifiedType`',
  '- Access: `protected`, `unavailable`, and `unavailableReason`',
  '### Twitter Profile API Example',
  '"verifiedType": "Business"',
  '### Interpret Profile Counts',
  '### Keep Verification Fields Separate',
  '### Handle Protected or Unavailable Profiles',
  '## Media Fields',
  '### Map Photos, Videos, and GIFs',
  '### Store a Media Join Row',
  '"media_key": "3_1912345678901234567"',
  '## Reply Coverage',
  '`diagnostic.complete`',
  '`coveragePercentage`',
  '### Store Reply Relationships',
  '## Pagination Fields',
  'REST read pages commonly return `has_next_page` and `next_cursor`.',
  'Extraction result pages return `hasMore` and `nextCursor`.',
  '## Field Mapping Handoff',
  '"optional_field_policy": "preserve_absence"',
  '## Surface Mapping',
  'REST `createdAt` becomes MCP `created`.',
  '## Avoid Tweet Metadata Mapping Errors',
  '## Tweet Metadata and Profile API Questions',
  '### What Metadata Does a Tweet Include?',
  '### What Is a Twitter Conversation ID?',
  '### How Do Quotes Differ From Reposts?',
  '### Does the Twitter Profile API Include Follower Counts?',
  '### How Do I Get Tweet Media Metadata?',
  '### Can I Export Tweet Metadata to CSV?',
] as const;

const REQUIRED_REQUEST_EFFICIENT_API_USAGE_SNIPPETS = [
  'title: "Twitter API Pagination, Batching & Tweet Exports"',
  'sidebarTitle: "Efficient API Usage"',
  '"Twitter API pagination"',
  '"Twitter cursor pagination"',
  '"Twitter API usage"',
  '"Twitter search tweets"',
  'Use this Twitter API pagination guide for tweets, profiles, followers, and exports.',
  'Resume that checkpoint instead of repeating completed pages.',
  '## Choose the Smallest Twitter API Route',
  'Use `GET /api/v1/x/tweets?ids=...` for up to 100 comma-separated tweet IDs in one request.',
  'Use `GET /api/v1/x/users/batch?ids=...` for up to 100 comma-separated user IDs in one request.',
  'Use `GET /api/v1/x/users/{id}/tweets` for one user\'s profile timeline.',
  'Use `GET /api/v1/x/tweets/search` for keywords, hashtags, operators, date filters, and advanced search pages.',
  'Use `GET /api/v1/x/timeline` for the connected account\'s home timeline.',
  'Inspect `requested_count`, `processed_count`, and `returned_count`.',
  'Batch lookups are single-page requests.',
  '## Match Twitter Search, Timeline & Feed Intent',
  'Use `/x/users/{id}/tweets` for one account\'s posts.',
  'Use `/x/tweets/search` for keywords, hashtags, operators, dates, or',
  'Use `/x/timeline` for one connected account\'s ranked home feed.',
  '## Use the Correct Page-Size Parameter',
  '| Tweet search | `limit` | Up to 200 tweets; the server can paginate internally |',
  '| User tweets and replies | `pageSize` | 1 to 100; default 20 |',
  '| Followers and following | `pageSize` | 20 to 200; default 200 |',
  '| Extraction results | `limit` | 1 to 1,000 stored rows; default 100 |',
  '## Use Extraction Jobs for Saved Files',
  'Pass `nextCursor` back through `after` for more stored rows.',
  '## Store Cursor Checkpoints',
  'Treat each cursor as an opaque string.',
  'Write the rows and checkpoint in one database transaction.',
  '## Implement a Bounded Tweet Search Loop',
  'async function collectTweetSearch(',
  '(nextCursor === cursor || seenCursors.has(nextCursor))',
  'complete: false,',
  'next_cursor: cursor,',
  '## Guard High-Volume Twitter API Pagination',
  'One large timeline should not starve every other target.',
  '## Resume Recurring Tweet Collection',
  'Never reuse a cursor after changing its query.',
  'https://docs.x.com/x-api/fundamentals/pagination',
  '## Recover Without Losing the Cursor',
  '| `429` | A request bucket or cooldown was exceeded | Wait for `Retry-After`. Retry the same cursor. |',
  '## Control Credits, Requests & Memory',
  '## Twitter API Pagination Questions',
  '### How Do I Paginate Twitter API Tweets?',
  '### How Do I Get Tweets by One User Efficiently?',
  '### How Do I Prevent Duplicate Tweets Across Pages?',
  '## Efficient Twitter API Usage Checklist',
] as const;

const FORBIDDEN_REQUEST_EFFICIENT_API_USAGE_SNIPPETS = [
  'title: "Request-efficient API Usage | X API Tutorial"',
  'A short page means pagination finished.',
  'Decode the cursor',
  'Use `limit` for every endpoint',
  'Retry every error unchanged',
] as const;

const REQUIRED_KEYWORD_MONITOR_API_HANDOFF_SNIPPETS = [
  'monitor tweets',
  'signed webhooks',
  'jq -c \'{',
  'keyword_monitor_id: .id',
  'verify_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'update_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'delete_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'events_endpoint: "/api/v1/events?keywordMonitorId=\\(.id)"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'const monitorState = {',
  'keyword_monitor_id: monitor.id',
  'query: monitor.query',
  'event_types: monitor.eventTypes',
  'verify_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'update_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'delete_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'events_endpoint: `/api/v1/events?keywordMonitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'monitor = response.json()',
  'monitor_state = {',
  '"keyword_monitor_id": monitor["id"]',
  '"verify_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"update_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"delete_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?keywordMonitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'The cURL, Node.js, and Python examples convert the created or reactivated',
  'keyword monitor into one state row.',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before routing alerts.',
  '## Keyword monitor handoff',
  '`POST /monitors/keywords`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '<Card title="Monitor ID" icon="fingerprint">',
  'Store `id` as `keyword_monitor_id`.',
  '[Get Keyword Monitor](/api-reference/monitors/get-keyword)',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  '<Card title="Normalized Query" icon="search">',
  'webhook payloads.',
  '<Card title="Event Filter" icon="funnel">',
  '[List Webhooks](/api-reference/webhooks/list)',
  '<Card title="Active State" icon="clock">',
  'Read `isActive` and `nextBillingAt`',
  '<Card title="Stored Event Join" icon="link">',
  '`monitorType: "keyword"`, `keywordMonitorId`, and `query`',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Webhook Delivery Join" icon="webhook">',
  'Use `deliveryId` for receiver idempotency',
  'Join delivery `streamEventId` to event IDs.',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'Do not use `x_event_id` as',
  'Active keyword monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Creation or reactivation requires 22 available credits.',
  '<Card title="tweet.new" icon="bell">',
  'retweet signal is present.',
  '<Card title="tweet.quote" icon="quote">',
  'keyword monitor events and webhook deliveries.',
  '<Card title="tweet.reply" icon="message-circle">',
  'conversation tracking, or alerting needs replies.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'create keyword monitor events and webhook deliveries.',
  '"message": "Monitor already exists."',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_CREATE_RAW_OUTPUT_SNIPPETS = [
  "'}' | jq",
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_INLINE_WEBHOOK_SNIPPETS = [
  'X-Xquik-Signature',
  'X-Xquik-Timestamp',
  'X-Xquik-Nonce',
  'one-time webhook `secret`',
  'Store the one-time webhook',
  'raw body',
] as const;

const FORBIDDEN_NESTED_QUOTED_KEYWORD_QUERY_SNIPPETS = [
  'xquik OR \\"x api\\"',
  'xquik OR "x api"',
] as const;

const REQUIRED_KEYWORD_MONITOR_LIST_API_HANDOFF_SNIPPETS = [
  'jq -c \'.monitors[] | {',
  'keyword_monitor_id: .id',
  'events_endpoint: "/api/v1/events?keywordMonitorId=\\(.id)"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'verify_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'update_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'delete_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const payload = await response.json();',
  'const monitorRow = {',
  'keyword_monitor_id: monitor.id',
  'query: monitor.query',
  'event_types: monitor.eventTypes',
  'events_endpoint: `/api/v1/events?keywordMonitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'verify_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'update_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'delete_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorRow)}\\n`);',
  'payload = response.json()',
  'monitor_row = {',
  '"keyword_monitor_id": monitor["id"]',
  '"query": monitor["query"]',
  '"event_types": monitor["eventTypes"]',
  '"events_endpoint": f"/api/v1/events?keywordMonitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"verify_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"update_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"delete_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_row))',
  'type KeywordMonitorListResponse struct',
  'type KeywordMonitorRow struct',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'VerifyEndpoint             string   `json:"verify_endpoint"`',
  'UpdateEndpoint             string   `json:"update_endpoint"`',
  'DeleteEndpoint             string   `json:"delete_endpoint"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'encoder := json.NewEncoder(os.Stdout)',
  'EventsEndpoint:             "/api/v1/events?keywordMonitorId=" + monitor.ID',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'VerifyEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'UpdateEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'DeleteEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'if err := encoder.Encode(row); err != nil',
  'The cURL, Node.js, Python, and Go examples convert each keyword monitor into one',
  'inventory row.',
  '`keyword_monitor_id`, `query`, `event_types`, `is_active`,',
  '`next_billing_at`, `events_endpoint`, `event_detail_endpoint_pattern`,',
  '`verify_endpoint`, `update_endpoint`, `delete_endpoint`, `webhooks_endpoint`,',
  'and `deliveries_endpoint_pattern`',
  '## Inventory handoff',
  'Use `GET /monitors/keywords` after create, update, pause, or delete operations',
  'up to 200',
  'keyword monitors ordered by creation time',
  '`total` count for the returned',
  '<Card title="Active Burn" icon="activity">',
  'Filter monitors where `isActive` is `true`.',
  'Each active keyword monitor',
  'bills 21 credits per active monitor-hour',
  '`nextBillingAt` to schedule',
  'credit checks or pause stale alerts.',
  '<Card title="Webhook Alignment" icon="webhook">',
  "Compare each monitor's `eventTypes` with",
  '[List Webhooks](/api-reference/webhooks/list)',
  'before relying on signed',
  '<Card title="Event Backfill" icon="database">',
  'Use `id` as `keywordMonitorId` with',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event',
  'Do not use `x_event_id` as',
  '<Card title="Detail Check" icon="search-check">',
  '[Get Keyword Monitor](/api-reference/monitors/get-keyword)',
  'Store the returned `query`, `eventTypes`, `isActive`, and',
  '<Card title="State Repair" icon="sliders-horizontal">',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
  'replace `eventTypes` or toggle `isActive`.',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  'the query should stop permanently.',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_LIST_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
] as const;

const REQUIRED_KEYWORD_MONITOR_GET_API_HANDOFF_SNIPPETS = [
  'jq -c \'{',
  'keyword_monitor_id: .id',
  'update_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'delete_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'events_endpoint: "/api/v1/events?keywordMonitorId=\\(.id)"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'const monitorState = {',
  'keyword_monitor_id: monitor.id',
  'query: monitor.query',
  'event_types: monitor.eventTypes',
  'update_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'delete_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'events_endpoint: `/api/v1/events?keywordMonitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'monitor = response.json()',
  'monitor_state = {',
  '"keyword_monitor_id": monitor["id"]',
  '"query": monitor["query"]',
  '"event_types": monitor["eventTypes"]',
  '"update_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"delete_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?keywordMonitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'type KeywordMonitorState struct',
  'UpdateEndpoint             string   `json:"update_endpoint"`',
  'DeleteEndpoint             string   `json:"delete_endpoint"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'UpdateEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'DeleteEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'EventsEndpoint:             "/api/v1/events?keywordMonitorId=" + monitor.ID',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'json.NewEncoder(os.Stdout).Encode(state)',
  'The cURL, Node.js, Python, and Go examples convert the fetched keyword monitor',
  'one state snapshot row.',
  '`keyword_monitor_id`, `query`, `event_types`,',
  '`next_billing_at`, `update_endpoint`, `delete_endpoint`,',
  '`events_endpoint`, `event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern`',
  '## State handoff',
  'Use `GET /monitors/keywords/{id}` before changing routing, billing checks, or',
  'alert state for one keyword monitor.',
  'current stored',
  'monitor for your account only',
  'deleted or cross-account IDs return `404`.',
  '<Card title="Current Filter" icon="funnel">',
  'Treat `query` and `eventTypes` as the active matching contract.',
  '[List Webhooks](/api-reference/webhooks/list)',
  '<Card title="Active State" icon="power">',
  'Use `isActive` to decide whether the monitor should poll and bill.',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
  '<Card title="Billing Check" icon="coins">',
  'Read `nextBillingAt` before credit alerts, budget checks, or account',
  'Paused monitors stay visible but do not add hourly monitor burn.',
  '<Card title="Event Join" icon="link">',
  'Use `id` as `keywordMonitorId` with',
  '[List Events](/api-reference/events/list)',
  'reconcile stored events and',
  'webhook deliveries for this query.',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event',
  'Do not use `x_event_id` as',
  '<Card title="Delete Path" icon="trash-2">',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  'Export event and delivery evidence',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_GET_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
] as const;

const REQUIRED_KEYWORD_MONITOR_UPDATE_API_HANDOFF_SNIPPETS = [
  'jq -c \'{',
  'keyword_monitor_id: .id',
  'verify_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'delete_endpoint: "/api/v1/monitors/keywords/\\(.id)"',
  'events_endpoint: "/api/v1/events?keywordMonitorId=\\(.id)"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'const monitorState = {',
  'keyword_monitor_id: monitor.id',
  'query: monitor.query',
  'event_types: monitor.eventTypes',
  'verify_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'delete_endpoint: `/api/v1/monitors/keywords/${monitor.id}`',
  'events_endpoint: `/api/v1/events?keywordMonitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'monitor = response.json()',
  'monitor_state = {',
  '"keyword_monitor_id": monitor["id"]',
  '"verify_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"delete_endpoint": f"/api/v1/monitors/keywords/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?keywordMonitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'type KeywordMonitorState struct',
  'KeywordMonitorID           string   `json:"keyword_monitor_id"`',
  'VerifyEndpoint             string   `json:"verify_endpoint"`',
  'DeleteEndpoint             string   `json:"delete_endpoint"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'VerifyEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'DeleteEndpoint:             "/api/v1/monitors/keywords/" + monitor.ID',
  'EventsEndpoint:             "/api/v1/events?keywordMonitorId=" + monitor.ID',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'json.NewEncoder(os.Stdout).Encode(state)',
  'The cURL, Node.js, Python, and Go examples convert the updated keyword monitor',
  'one state row.',
  'Store `keyword_monitor_id`, `query`, `event_types`,',
  '`next_billing_at`, `verify_endpoint`, `delete_endpoint`,',
  '`events_endpoint`, `event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern`',
  '## Update handoff',
  'Use this endpoint when a keyword alert changes scope',
  'Store returned `id`, `query`, `eventTypes`, `isActive`, `createdAt`, and',
  '`nextBillingAt` as the current keyword monitor configuration.',
  '`eventTypes` replaces the current filter.',
  '[List Webhooks](/api-reference/webhooks/list)',
  '<Card title="Pause Monitoring" icon="circle-pause">',
  '`isActive: false` pauses keyword polling',
  'deliveries, and hourly monitor billing',
  '<Card title="Resume Monitoring" icon="circle-play">',
  '`isActive: true` resumes polling for matching future tweets.',
  '`nextBillingAt`, then run [Test Webhook](/api-reference/webhooks/test)',
  'PATCH cannot change `query`.',
  'Delete this monitor and create a new keyword',
  'monitor when the X search query changes.',
  '`keywordMonitorId` and `query` from',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event',
  'Do not use `x_event_id` as',
  '<Card title="Delete Path" icon="trash-2">',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  'Export event and delivery evidence',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_UPDATE_RAW_OUTPUT_SNIPPETS = [
  "'}' | jq",
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
  'fmt.Println(data)',
] as const;

const REQUIRED_KEYWORD_MONITOR_DELETE_API_HANDOFF_SNIPPETS = [
  'const result = await response.json();',
  'const deletionReceipt = {',
  'keyword_monitor_id: monitorId',
  'success: result.success === true',
  'verify_endpoint: `/api/v1/monitors/keywords/${monitorId}`',
  'list_endpoint: "/api/v1/monitors/keywords"',
  'process.stdout.write(`${JSON.stringify(deletionReceipt)}\\n`);',
  'result = response.json()',
  'deletion_receipt = {',
  '"keyword_monitor_id": monitor_id',
  '"success": result["success"] is True',
  'print(json.dumps(deletion_receipt))',
  'type KeywordMonitorDeletion struct',
  'KeywordMonitorID string `json:"keyword_monitor_id"`',
  'VerifyEndpoint   string `json:"verify_endpoint"`',
  'json.NewEncoder(os.Stdout).Encode(receipt)',
  'one receipt row.',
  'Store `keyword_monitor_id`, `success`, `verify_endpoint`, and',
  '`list_endpoint`, then verify',
  '## Deletion handoff',
  'Use this endpoint when a keyword query should stop permanently.',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
  '`isActive: false` when you only need to pause alerts',
  '<Card title="Permanent Remove" icon="trash-2">',
  'Delete removes the keyword monitor. Store returned `success` before treating',
  'the deleted ID as permanently removed.',
  'The deleted ID cannot be fetched,',
  'updated, resumed, or billed again.',
  '<Card title="Stored History" icon="database">',
  'Stored events and webhook delivery records tied to this keyword monitor',
  '<Card title="Pause Instead" icon="circle-pause">',
  'Use `PATCH /monitors/keywords/{id}` with `isActive: false`',
  'while preserving the monitor record.',
  '<Card title="Verify Removal" icon="list-checks">',
  '[List Keyword Monitors](/api-reference/monitors/list-keywords)',
  '[Get Keyword Monitor](/api-reference/monitors/get-keyword)',
  'return `404` for the deleted ID.',
  '<Card title="Track New Query" icon="search">',
  'Store the new',
  '`id`, `query`, `eventTypes`, `isActive`, and `nextBillingAt`.',
  '<Card title="Webhook Reuse" icon="webhook">',
  'Existing webhook endpoints remain configured.',
  '[Test Webhook](/api-reference/webhooks/test)',
] as const;

const FORBIDDEN_KEYWORD_MONITOR_DELETE_RAW_OUTPUT_SNIPPETS = [
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
  'fmt.Println(data)',
] as const;

const REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS = [
  'title: "Twitter Account Monitor API & Real-Time Webhooks"',
  'keywords: ["Twitter monitor", "monitor Twitter account", "tweet monitor", "Twitter account monitor API", "Twitter webhook", "Twitter webhook alerts", "real-time Twitter alerts", "monitor tweets", "profile change alerts"]',
  'monitor tweets',
  'signed webhooks',
  'curl --fail-with-body -X POST https://xquik.com/api/v1/monitors',
  'jq -c \'{',
  'monitor_id: .id',
  'x_user_id: .xUserId',
  'verify_endpoint: "/api/v1/monitors/\\(.id)"',
  'update_endpoint: "/api/v1/monitors/\\(.id)"',
  'delete_endpoint: "/api/v1/monitors/\\(.id)"',
  'events_endpoint: "/api/v1/events?monitorId=\\(.id)"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'throw new Error(monitor.message || "Twitter monitor creation failed.");',
  'const monitorState = {',
  'monitor_id: monitor.id',
  'x_user_id: monitor.xUserId',
  'event_types: monitor.eventTypes',
  'verify_endpoint: `/api/v1/monitors/${monitor.id}`',
  'update_endpoint: `/api/v1/monitors/${monitor.id}`',
  'delete_endpoint: `/api/v1/monitors/${monitor.id}`',
  'events_endpoint: `/api/v1/events?monitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'import json',
  'monitor = response.json()',
  'raise RuntimeError(monitor.get("message", "Twitter monitor creation failed."))',
  'monitor_state = {',
  '"monitor_id": monitor["id"]',
  '"x_user_id": monitor["xUserId"]',
  '"verify_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"update_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"delete_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?monitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'type Monitor struct',
  'type MonitorState struct',
  'MonitorID                  string   `json:"monitor_id"`',
  'XUserID                    string   `json:"x_user_id"`',
  'VerifyEndpoint             string   `json:"verify_endpoint"`',
  'UpdateEndpoint             string   `json:"update_endpoint"`',
  'DeleteEndpoint             string   `json:"delete_endpoint"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'json.NewEncoder(os.Stdout).Encode(state)',
  'log.Fatalf("Twitter monitor creation failed with %d: %s", resp.StatusCode, string(problem))',
  'Each code example maps the response to one monitor row.',
  'Save the account IDs,',
  'event filter, active state, next charge time, and monitor routes.',
  'The routes',
  'cover updates, events, webhooks, and delivery checks.',
  '## Account Monitor Handoff',
  '`POST /monitors`',
  'Send alerts to a queue, CRM,',
  'warehouse, Slack, or an agent.',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '<Card title="Monitor ID" icon="fingerprint">',
  'Store `id` as `monitor_id`.',
  '[Get Monitor](/api-reference/monitors/twitter-account-monitor-status)',
  '[Update Monitor](/api-reference/monitors/update)',
  '[Delete Monitor](/api-reference/monitors/delete-twitter-account-monitor)',
  '<Card title="Stored Account" icon="user">',
  'Store `username` after trimming the `@` prefix.',
  'Store `xUserId` for stable',
  '<Card title="Event Filter" icon="funnel">',
  '[List Webhooks](/api-reference/webhooks/list)',
  '<Card title="Active State" icon="clock">',
  'Read `isActive` and `nextBillingAt`',
  '<Card title="Stored Event Join" icon="link">',
  '`monitorType: "account"`, `monitorId`, and `username`',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Webhook Delivery Join" icon="webhook">',
  'Use `deliveryId` for receiver idempotency',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'Join `streamEventId` to event IDs',
  'do not use `x_event_id` as',
  'Store `eventType`, `occurredAt`,',
  'Use this Twitter monitor API for continuous checks on one known profile.',
  'This API endpoint gives you one stable monitor ID.',
  'Use it to join events and',
  'webhook deliveries.',
  'Use `POST /monitors` for Twitter API monitoring from one username.',
  'Active account monitors check every 1 second.',
  'Each active hour costs 21 credits.',
  '### What Should a Webhook Receiver Save?',
  'Use the delivery ID to stop',
  'the same job twice.',
  'You need 22 available credits to create or restore a monitor.',
  'That total includes a 1-credit username lookup and the first active hour.',
  '<Card title="tweet.new" icon="bell">',
  'retweet signal is present.',
  '<Card title="tweet.quote" icon="quote">',
  'should create stored events and webhook deliveries.',
  '<Card title="tweet.reply" icon="message-circle">',
  'conversation tracking, or alerting needs replies.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'create stored events and webhook deliveries.',
  '`PATCH /monitors/{id}`',
  '<ParamField header="Authorization" type="string">',
  'Send `Bearer <token>` instead of `x-api-key` when using OAuth 2.1.',
  '"message": "Invalid input. Check the request body."',
  '"message": "Authentication required. Provide a valid API key or bearer token."',
  '"message": "Insufficient credits. Top up or subscribe to continue."',
  '"message": "X user not found. Check the username."',
  '"message": "Monitor already exists."',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_CREATE_SNIPPETS = [
  "'}' | jq",
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
  'fmt.Println(data)',
  'authenticate with a session cookie',
  '`no_credits` or `insufficient_credits`',
  '"message": "Invalid username format or event types"',
  '"message": "Missing or invalid API key"',
] as const;

const REQUIRED_ACCOUNT_MONITOR_GET_API_HANDOFF_SNIPPETS = [
  "jq '{",
  'monitor_id: .id',
  'events_endpoint: ("/api/v1/events?monitorId=" + .id)',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'const monitorState = {',
  'monitor_id: monitor.id',
  'x_user_id: monitor.xUserId',
  'event_types: monitor.eventTypes',
  'update_endpoint: `/api/v1/monitors/${monitor.id}`',
  'events_endpoint: `/api/v1/events?monitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'monitor = response.json()',
  'monitor_state = {',
  '"monitor_id": monitor["id"]',
  '"x_user_id": monitor["xUserId"]',
  '"event_types": monitor["eventTypes"]',
  '"update_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?monitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'type MonitorState struct',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'EventsEndpoint:             "/api/v1/events?monitorId=" + monitor.ID',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'json.NewEncoder(os.Stdout).Encode(state)',
  'The Node.js, Python, and Go examples produce one normalized monitor snapshot.',
  '`monitor_id`, `event_types`, `is_active`,',
  '`next_billing_at`, `update_endpoint`, `events_endpoint`,',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before changing filters',
  '## State Handoff',
  'Use `GET /monitors/{id}` before changing routing, billing checks, or alert',
  'state for one account monitor.',
  'current stored monitor',
  'for your account only',
  'deleted or cross-account IDs return `404`.',
  '<Card title="Tracked Account" icon="user-check">',
  'Treat `username` and `xUserId` as the resolved X account identity.',
  'downstream CRM, warehouse, or queue records.',
  '<Card title="Current Filter" icon="funnel">',
  'Treat `eventTypes` as the active matching contract.',
  'webhook subscriptions before relying on signed alerts.',
  '<Card title="Active State" icon="power">',
  'Use `isActive` to decide whether the monitor should poll and bill.',
  '[Update Monitor](/api-reference/monitors/update)',
  '<Card title="Event Join" icon="link">',
  'Use `id` as `monitorId` with [List Events](/api-reference/events/list)',
  'reconcile stored events and webhook deliveries for this account.',
  '<Card title="Event Detail" icon="file-search">',
  '[Get Event](/api-reference/events/get)',
  'workflow needs the full tweet payload.',
  '<Card title="Webhook Alignment" icon="webhook">',
  '[List Webhooks](/api-reference/webhooks/list)',
  '`eventTypes` with this monitor',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event IDs.',
  'Do not use `x_event_id` as',
  '[List Events](/api-reference/events/list) to audit stored events',
  '## What Does Twitter Account Activity Tracker Status Prove?',
  'Followers and following are not monitor event types.',
  'Account relationship',
  'changes are not monitor events either.',
  '## How Do I Check Whether Twitter Account Activity Alerts Are Active?',
  'A healthy account alert',
  'requires four aligned layers.',
  '| Tracked profile | `username` and `xUserId` |',
  '| Event filter | `eventTypes` |',
  '| Polling | `isActive` |',
  '| Delivery | Events and webhook deliveries |',
  '## How Do I Track Mentions and Replies for One Account?',
  '`tweet.mention` for mentions.',
  'require the `tweet.reply` event type.',
  '## Does This Endpoint Return Account Analytics or Historical Reports?',
  'It does not calculate',
  'engagement rate, follower growth, posting frequency, reach, impressions, or',
  'sentiment.',
  '## How Do Twitter Analytics Tools Differ From Monitor Status?',
  'Those values are engagement metrics.',
  'This endpoint reports the saved',
  'profile, filters, and polling status.',
  'Check monitor status before investigating account activity.',
  'Paused monitors do',
  'not capture additional account events.',
  'This workflow separates monitor configuration from analytics',
  '## What Should a Twitter Account Activity Audit Store?',
  'This chain distinguishes a',
  'missing event from a failed receiver.',
  'Read the response `Retry-After`',
  'header and pause for the supplied duration before retrying.',
  'Preserve both snapshots',
  'with the approved change ticket.',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_GET_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'const data = await response.json();',
  'data = response.json()',
  'fmt.Println(data)',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_GET_EVENT_TYPE_CLAIMS = [
  'follower event types',
  'following event types',
  'relationship event types',
] as const;

const REQUIRED_ACCOUNT_MONITOR_LIST_API_HANDOFF_SNIPPETS = [
  "jq -c '.monitors[] | {",
  'monitor_id: .id',
  'monitor_detail_endpoint: ("/api/v1/monitors/" + .id)',
  'events_endpoint: ("/api/v1/events?monitorId=" + .id)',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const payload = await response.json();',
  'const monitorRow = {',
  'monitor_id: monitor.id',
  'x_user_id: monitor.xUserId',
  'event_types: monitor.eventTypes',
  'monitor_detail_endpoint: `/api/v1/monitors/${monitor.id}`',
  'events_endpoint: `/api/v1/events?monitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorRow)}\\n`);',
  'payload = response.json()',
  'monitor_row = {',
  '"monitor_id": monitor["id"]',
  '"x_user_id": monitor["xUserId"]',
  '"event_types": monitor["eventTypes"]',
  '"monitor_detail_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"events_endpoint": f"/api/v1/events?monitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_row))',
  'type MonitorListResponse struct',
  'type MonitorRow struct',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'MonitorDetailEndpoint      string   `json:"monitor_detail_endpoint"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'encoder := json.NewEncoder(os.Stdout)',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'EventsEndpoint:             "/api/v1/events?monitorId=" + monitor.ID',
  'MonitorDetailEndpoint:      "/api/v1/monitors/" + monitor.ID',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'if err := encoder.Encode(row); err != nil',
  'The Node.js, Python, and Go examples emit one structured monitor record.',
  'Save each record with its support, event, and webhook audit history.',
  'monitor multiple Twitter accounts.',
  'This route lists monitor settings, not stored events.',
  '## Inventory Handoff',
  'Use `GET /monitors` after create, update, pause, or delete operations',
  'your account monitor inventory.',
  'up to 200 monitors ordered',
  '`total` count for the returned set.',
  '<Card title="Tracked Accounts" icon="users">',
  "Store each monitor's `id`, `username`, and `xUserId`",
  'warehouse, or queue records.',
  '<Card title="Detail Handoff" icon="file-search">',
  '[Get Monitor](/api-reference/monitors/twitter-account-monitor-status)',
  'latest event filter, active state, or billing',
  '<Card title="Active Billing" icon="activity">',
  'Filter monitors where `isActive` is `true`.',
  'Each active account monitor',
  'bills 21 credits per active monitor-hour',
  '`nextBillingAt` to schedule',
  'credit checks or pause stale alerts.',
  '<Card title="Webhook Alignment" icon="webhook">',
  "Compare each monitor's `eventTypes` with [List Webhooks](/api-reference/webhooks/list)",
  'relying on signed alerts.',
  '<Card title="Event Backfill" icon="database">',
  'Use `id` as `monitorId` with [List Events](/api-reference/events/list)',
  'audit stored account monitor events.',
  '[Get Event](/api-reference/events/get)',
  'to inspect the complete stored event.',
  '<Card title="Delivery Audit" icon="link">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event IDs.',
  'Do not use `x_event_id` as',
  '<Card title="State Repair" icon="sliders-horizontal">',
  '[Update Monitor](/api-reference/monitors/update)',
  'replace `eventTypes`',
  'toggle `isActive`.',
  '[Delete Monitor](/api-reference/monitors/delete-twitter-account-monitor)',
  'tracked account should stop permanently.',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_LIST_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq\n',
  'const data = await response.json();',
  'data = response.json()',
  'fmt.Println(data)',
] as const;

const REQUIRED_ACCOUNT_MONITOR_UPDATE_API_HANDOFF_SNIPPETS = [
  "}\' | jq -c '{",
  'monitor_id: .id',
  'verify_endpoint: ("/api/v1/monitors/" + .id)',
  'list_endpoint: "/api/v1/monitors"',
  'events_endpoint: ("/api/v1/events?monitorId=" + .id)',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const monitor = await response.json();',
  'const monitorState = {',
  'monitor_id: monitor.id',
  'x_user_id: monitor.xUserId',
  'event_types: monitor.eventTypes',
  'verify_endpoint: `/api/v1/monitors/${monitor.id}`',
  'list_endpoint: "/api/v1/monitors"',
  'events_endpoint: `/api/v1/events?monitorId=${monitor.id}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(monitorState)}\\n`);',
  'monitor = response.json()',
  'monitor_state = {',
  '"monitor_id": monitor["id"]',
  '"x_user_id": monitor["xUserId"]',
  '"event_types": monitor["eventTypes"]',
  '"verify_endpoint": f"/api/v1/monitors/{monitor[\'id\']}"',
  '"list_endpoint": "/api/v1/monitors"',
  '"events_endpoint": f"/api/v1/events?monitorId={monitor[\'id\']}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(monitor_state))',
  'type MonitorState struct',
  'DeliveriesEndpointPattern  string   `json:"deliveries_endpoint_pattern"`',
  'EventDetailEndpointPattern string   `json:"event_detail_endpoint_pattern"`',
  'EventsEndpoint             string   `json:"events_endpoint"`',
  'ListEndpoint               string   `json:"list_endpoint"`',
  'VerifyEndpoint             string   `json:"verify_endpoint"`',
  'WebhooksEndpoint           string   `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern:  "/api/v1/webhooks/{webhook_id}/deliveries"',
  'EventDetailEndpointPattern: "/api/v1/events/{event_id}"',
  'EventsEndpoint:             "/api/v1/events?monitorId=" + monitor.ID',
  'ListEndpoint:               "/api/v1/monitors"',
  'VerifyEndpoint:             "/api/v1/monitors/" + monitor.ID',
  'WebhooksEndpoint:           "/api/v1/webhooks"',
  'json.NewEncoder(os.Stdout).Encode(state)',
  'The Node.js, Python, and Go examples print one reusable monitor record.',
  '`monitor_id`, `event_types`, `is_active`,',
  '`next_billing_at`, `verify_endpoint`, `list_endpoint`, `events_endpoint`,',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before resuming alerts',
  'monitors do not consume hourly monitor credits.',
  '## Update handoff',
  'Use this endpoint to change event scope.',
  'Store returned `id`, `username`, `xUserId`, `eventTypes`, `isActive`,',
  '`createdAt`, and `nextBillingAt` as the current account monitor',
  'configuration.',
  '<Card title="Inventory Sync" icon="list-checks">',
  '[List Monitors](/api-reference/monitors/list)',
  '[Get Monitor](/api-reference/monitors/twitter-account-monitor-status)',
  'queues, CRM records, or support notes.',
  '`eventTypes` replaces the current filter.',
  'Keep [List Webhooks](/api-reference/webhooks/list)',
  '<Card title="Pause Monitoring" icon="circle-pause">',
  '`isActive: false` pauses future account checks',
  'deliveries, and hourly monitor billing',
  '<Card title="Resume Monitoring" icon="circle-play">',
  '`isActive: true` resumes checks for matching future account activity.',
  '`nextBillingAt`, then run [Test Webhook](/api-reference/webhooks/test)',
  'PATCH cannot change `username` or `xUserId`.',
  'Delete this monitor and create',
  'a new account monitor when the tracked account changes.',
  '`monitorId` and `username` from',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  'workflow needs the full tweet payload.',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event IDs.',
  'Do not use `x_event_id` as',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_UPDATE_RAW_OUTPUT_SNIPPETS = [
  '}\' | jq\n',
  'const data = await response.json();',
  'data = response.json()',
  'fmt.Println(data)',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_UPDATE_FULL_EVENT_TYPE_EXAMPLES = [
  '["tweet.new", "tweet.quote", "tweet.reply", "tweet.retweet"]',
  '[]string{"tweet.new", "tweet.quote", "tweet.reply", "tweet.retweet"}',
] as const;

const FORBIDDEN_MONITOR_DELETE_INLINE_SUCCESS_JSON_SNIPPETS = [
  'Delete removes the account monitor and returns `{ "success": true }`.',
  'Delete removes the keyword monitor and returns `{ "success": true }`.',
] as const;

const REQUIRED_ACCOUNT_MONITOR_DELETE_API_HANDOFF_SNIPPETS = [
  'jq -c \'{',
  'monitor_id: "7"',
  'events_endpoint: "/api/v1/events?monitorId=7"',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'const result = await response.json();',
  'const deletionReceipt = {',
  'monitor_id: monitorId',
  'success: result.success === true',
  'verify_endpoint: `/api/v1/monitors/${monitorId}`',
  'list_endpoint: "/api/v1/monitors"',
  'events_endpoint: `/api/v1/events?monitorId=${monitorId}`',
  'event_detail_endpoint_pattern: "/api/v1/events/{event_id}"',
  'webhooks_endpoint: "/api/v1/webhooks"',
  'deliveries_endpoint_pattern: "/api/v1/webhooks/{webhook_id}/deliveries"',
  'process.stdout.write(`${JSON.stringify(deletionReceipt)}\\n`);',
  'result = response.json()',
  'deletion_receipt = {',
  '"monitor_id": monitor_id',
  '"success": result["success"] is True',
  '"events_endpoint": f"/api/v1/events?monitorId={monitor_id}"',
  '"event_detail_endpoint_pattern": "/api/v1/events/{event_id}"',
  '"webhooks_endpoint": "/api/v1/webhooks"',
  '"deliveries_endpoint_pattern": "/api/v1/webhooks/{webhook_id}/deliveries"',
  'print(json.dumps(deletion_receipt))',
  'type AccountMonitorDeletion struct',
  'MonitorID                 string `json:"monitor_id"`',
  'EventsEndpoint            string `json:"events_endpoint"`',
  'EventDetailEndpointPattern string `json:"event_detail_endpoint_pattern"`',
  'WebhooksEndpoint          string `json:"webhooks_endpoint"`',
  'DeliveriesEndpointPattern string `json:"deliveries_endpoint_pattern"`',
  'json.NewEncoder(os.Stdout).Encode(receipt)',
  'receipt row. Store `monitor_id`',
  '`events_endpoint`, `event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern`, then',
  '## Deletion handoff',
  'Use this endpoint when a tracked account should stop permanently.',
  '[Update Monitor](/api-reference/monitors/update)',
  '`isActive: false` when',
  'you only need to pause alerts',
  '## Plan Retention Before Monitor Deletion',
  'Deletion cascades through stored events and linked delivery records.',
  'Never place API keys in exports.',
  '## Select the Exact Twitter Account Monitor',
  'Delete account monitors and keyword monitors through their matching routes.',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  '## Preserve Tweet and Profile Events',
  'Follow every cursor until `hasMore` becomes `false`.',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '## Preserve Webhook Delivery Evidence',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  "Join each delivery's `streamEventId` to the exported event `id`.",
  'Do not use `x_event_id` as',
  '## Handle Every Delete Response',
  'A `200` response confirms the deletion.',
  'A `400` response means the ID format is invalid.',
  'A `401` response means authentication failed.',
  'Treat a `404` response as an unavailable monitor.',
  'A `429` response means the rate limit blocked the request.',
  '## Resolve an Unknown Delete Result',
  'Repeated deletion leaves the final state unchanged.',
  '[List Monitors](/api-reference/monitors/list)',
  '## Recreate Monitoring After Deletion',
  'The replacement receives a different monitor ID.',
  'Existing webhook endpoints remain available.',
  '[List Webhooks](/api-reference/webhooks/list)',
  '[Test Webhook](/api-reference/webhooks/test)',
  '## Account Monitor Deletion Checklist',
  'List monitors and confirm that the ID is absent.',
  '## Related Account Monitor Operations',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_DELETE_RAW_OUTPUT_SNIPPETS = [
  'const data = await response.json();',
  'data = response.json()',
  'fmt.Println(data)',
] as const;

const REQUIRED_ZAPIER_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Zapier scope',
  'API by Zapier',
  'Webhooks by Zapier',
  'Zaps, Agents, and Zapier MCP',
  'OAuth2, static headers, or no authentication',
  'New Item from API, API Request, exact request passthrough, JQ extraction',
  'Zapier Platform CLI',
  'REST Hooks',
  'bundle.targetUrl',
  '`performSubscribe`',
  '`performUnsubscribe`',
  '20,000 requests every 5 minutes',
  '1,000 requests every 5 minutes',
  'task tiers from 100 tasks/month through custom task limits',
  'MCP tool calls that use two tasks from the plan quota',
  '## Monitor webhook receiver handoff',
  'When a Zapier REST Hook, Catch Hook, or Catch Raw Hook receives Xquik monitor events, verify `X-Xquik-Signature` before field mapping.',
  'Store `deliveryId` and `streamEventId` as separate Zap storage keys:',
  'Return `2xx` after accepting a duplicate `deliveryId` or `streamEventId`;',
  'Do not store endpoint signing values, raw request body, raw signature, or full headers in Zap history, tables, Slack messages, CRM rows, or retry queues.',
  '/guides/zapier',
] as const;

const REQUIRED_ZAPIER_GUIDE_SNIPPETS = [
  'title: "Zapier Twitter Automation with Webhooks & X API"',
  'Build Zapier Twitter automation through Xquik',
  'Twitter automation tools',
  '## Replace the Retired Zapier Twitter Integration',
  '<Card title="API by Zapier" icon="braces">',
  'Use one reusable API-key connection for a small number of actions.',
  'Xquik key in the app connection instead of a Zap field.',
  '<Card title="Private Platform integration" icon="blocks">',
  '<Card title="Webhooks by Zapier" icon="webhook">',
  'Webhooks step fields. People with Zap access can read them.',
  '<Card title="Search versus monitor" icon="scan-search">',
  '## Integration Shape',
  '<Card title="Auth" icon="key-round">',
  'API key field named `apiKey`, injected as `x-api-key`.',
  '<Card title="Base URL" icon="link">',
  '`https://xquik.com/api/v1`',
  '<Card title="Request Helper" icon="workflow">',
  'JSON requests, structured Xquik errors, and `Retry-After` handling.',
  '<Card title="Actions" icon="play">',
  'Search Tweets, Get User, Read Followers, Create Extraction, and Create',
  'Monitor. Add Create Webhook, Create Tweet, and Create Reply.',
  '<Card title="Triggers" icon="radio">',
  'New Matching Tweet polling and Monitor Event instant trigger.',
  'Add Extraction',
  'Completed and Webhook Delivery Failure polling.',
  '## Starter Actions',
  '<Card title="Search Tweets" icon="search">',
  'Call `GET /x/tweets/search` with `q`. Use `cursor` for page loops.',
  'Keep `limit` on bounded resumes.',
  '<Card title="Get Tweet" icon="message-square">',
  'Call `GET /x/tweets/{id}` with a tweet ID.',
  '<Card title="Get User" icon="user">',
  'Call `GET /x/users/{id}` with a username or numeric user ID.',
  '<Card title="Read Followers" icon="user-plus">',
  'Call `GET /x/users/{id}/followers`. Preserve `next_cursor` between pages.',
  '<Card title="Read Following" icon="user-check">',
  'Call `GET /x/users/{id}/following`. Keep following rows separate.',
  '<Card title="Read Tweet Replies" icon="messages-square">',
  'Call `GET /x/tweets/{id}/replies`. Preserve parent and reply tweet IDs.',
  '<Card title="Get Trends" icon="trending-up">',
  'Call `GET /x/trends` with optional `woeid` and `count`.',
  '<Card title="Create Tweet" icon="send">',
  'Call `POST /x/tweets` with account, text, and optional public media URLs.',
  '<Card title="Create Reply" icon="reply">',
  'Call `POST /x/tweets` with account, text, and `reply_to_tweet_id`.',
  '<Card title="Create Extraction" icon="database">',
  'Call `POST /extractions` with `toolType`, query fields, and result limit.',
  '<Card title="Create Monitor" icon="radio">',
  'Call `POST /monitors` with username and event types.',
  '<Card title="Create Webhook" icon="webhook">',
  'Call `POST /webhooks` with callback URL and event types.',
  '## Result Handoff',
  'Use Zapier samples and `outputFields` so later Zap steps map stable values.',
  'Use snake_case storage keys when direct API responses use camelCase.',
  '<Card title="Search Tweets action" icon="search">',
  'Return `id`, `tweet_id`, `text`, `author_username`, `created_at`, and `url`.',
  'Keep `has_next_page` and `next_cursor` when a Zap loops pages.',
  '<Card title="User profile rows" icon="users">',
  'Return source `id` as `user_id`.',
  'Keep `username`, `name`, `followers`, `verified`, and `profile_picture`.',
  'Store the input, `has_next_page`, and `next_cursor` separately.',
  '<Card title="Follower and following rows" icon="user-check">',
  'Store `user_id`, `username`, `name`, `followers`, `following`, `verified`, and `profile_picture`.',
  '<Card title="Trend rows" icon="trending-up">',
  'Return each trend `name`, `rank`, `query`, and `description`. Keep response `count`, `woeid`, and the selected region with the Zap run.',
  '<Card title="Tweet or Reply write" icon="send">',
  'Send a unique `Idempotency-Key`. Store `id`, `status`, `billing`, `result`, and `statusUrl`.',
  'Poll while `terminal` is false. Retry only when `safeToRetry` is true, using a new key.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media`. Do not send `media_ids`.',
  'For DMs, upload first. Pass 1 `media_id` in `media_ids`.',
  'Store `message_id` and leave `reply_to_message_id` unset.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Return monitor `id`, `username`, `xUserId`, `eventTypes`, `isActive`, and `nextBillingAt`.',
  'Return webhook `id`, `url`, `eventTypes`, and one-time `secret`.',
  'Map production `deliveryId` to `delivery_id` for receiver retry deduplication.',
  'Map `streamEventId` to `stream_event_id` for event deduplication across webhook changes.',
  '<Card title="REST Hook trigger" icon="fingerprint">',
  'Return `id`, `delivery_id`, and `stream_event_id`.',
  'Use delivery IDs for endpoint retries. Use event IDs across webhook changes.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /events` with `after` when a Zap needs replay.',
  'Map event and monitor IDs first.',
  'Then map `occurredAt`, `hasMore`, and `nextCursor` to snake_case fields.',
  '<Card title="Receiver acceptance" icon="copy-check">',
  'Zapier controls responses from its generated hook URL.',
  'need custom acceptance or replay rules.',
  '<Card title="Extraction polling trigger" icon="database">',
  'Return completed job `id`, `toolType`, and `status`.',
  'Store normalized IDs, status, `has_more`, and `next_cursor`.',
  '## Test Coverage',
  '<Card title="Auth Header Injection" icon="shield-check">',
  'Every request includes `x-api-key` from `bundle.authData.apiKey`.',
  '<Card title="Invalid Key" icon="key-round">',
  '`401` returns "Authentication failed. Check the Xquik API key."',
  '<Card title="Invalid Input" icon="circle-x">',
  '`400` returns the safe Xquik detail or an input-field remediation.',
  '<Card title="Billing Required" icon="credit-card">',
  '`402` tells the user to update subscription or credits.',
  '<Card title="Missing Resource" icon="search-x">',
  '`404` identifies a bad tweet, user, monitor, webhook, or extraction ID.',
  '<Card title="Dependency Failure" icon="unplug">',
  '`424` stops unsafe automatic retries and preserves a safe explanation.',
  '<Card title="Rate Limit" icon="timer">',
  '`429` creates `ThrottledError` with `Retry-After` when present.',
  '<Card title="Retrieval Failure" icon="triangle-alert">',
  '`502` uses a bounded retry policy outside unsafe write actions.',
  '<Card title="REST Hook Subscribe" icon="webhook">',
  'The relay stores `bundle.targetUrl`, selected event types, and the secret.',
  '<Card title="REST Hook Unsubscribe" icon="radio">',
  '`DELETE /webhooks/{id}` uses `bundle.subscribeData.id`.',
  '<Card title="Sample Output" icon="database">',
  '`performList` and live `perform` return identical snake_case fields.',
  '<Card title="Search Action" icon="search">',
  'Search returns stable tweet IDs, authors, timestamps, URLs, and cursors.',
  '<Card title="Raw-Body Signature" icon="shield-check">',
  'Changing one raw body byte makes HMAC verification fail.',
  '<Card title="Stale Timestamp" icon="clock-alert">',
  'A timestamp outside 5 minutes is rejected before JSON parsing.',
  '<Card title="Secret Hygiene" icon="vault">',
  'Production Zapier output and logs never receive the Xquik signing secret.',
  '<Card title="Relay Replay Store" icon="database-zap">',
  'The relay rejects reused nonces and deduplicates delivery and event IDs.',
  '<Card title="Acknowledgement Ownership" icon="network">',
  'Relay tests cover custom `2xx` rules. Zapier owns its hook URL response.',
  'const rawBody = bundle.rawRequest?.content;',
  'const secret = bundle.subscribeData?.secret;',
  'createHmac("sha256", secret).update(signingString).digest("hex")',
  'skipThrowForStatus: true',
  'throwForThrottlingEarly: false',
  'Zapier prefixes most inbound raw headers with `Http-`;',
  'does not provide a durable 5-minute nonce',
  'Place a durable verification relay before Zapier in production.',
  'Testing a REST Hook calls `performList`, not the live `perform` handler.',
  '## Build Useful Zapier Twitter Automation',
  '## Zapier Twitter Automation Questions',
  '### Can Zapier Export Twitter Followers?',
  '### Why Does the Native Zapier Twitter Integration Not Work?',
  '### How Does Zapier Verify an Xquik Webhook?',
  '## Zapier and Xquik Sources',
] as const;

const FORBIDDEN_ZAPIER_GUIDE_SNIPPETS = [
  '128 REST operations',
  'Node.js 18+',
  'const payload = bundle.cleanedRequest;',
  'return { id: response.data.id };',
  '`429` includes `Retry-After` in the user-facing message when present.',
  'author__username',
  'title: "Zapier X Automation Guide | X API Tutorial"',
] as const;

const REQUIRED_PIPEDREAM_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Pipedream scope',
  'Pipedream Workflows',
  'one credit per 30 seconds',
  'does not charge by number of steps',
  'development and testing in the workflow builder are free',
  'HTTP trigger',
  'steps.trigger.event',
  'method, payload, headers, path, query, URL',
  '`413 Payload Too Large`',
  'Pipedream CLI',
  'pd publish',
  'use npm packages without a package file',
  'add app props for managed auth',
  '## Monitor webhook receiver handoff',
  'When a Pipedream HTTP trigger or source receives Xquik monitor events, verify `X-Xquik-Signature` before exporting data to later steps.',
  'Store `deliveryId` and `streamEventId` as separate workflow keys:',
  'Return `2xx` after accepting a duplicate `deliveryId` or `streamEventId`;',
  'Do not store endpoint signing values, raw request body, raw signature, or full headers in logs, data stores, Slack messages, CRM rows, or retry queues.',
  '/guides/pipedream',
] as const;

const REQUIRED_PIPEDREAM_GUIDE_SNIPPETS = [
  '## Component Shape',
  '<Card title="App" icon="app-window">',
  '`components/xquik/app/xquik.app.ts`',
  '<Card title="Auth" icon="key-round">',
  'API key prop injected as `x-api-key`.',
  '<Card title="Base URL" icon="link">',
  '`https://xquik.com/api/v1`',
  '<Card title="Actions" icon="play">',
  'Get Tweet, Search Tweets, Get User, Get Trends, Create Tweet, Create Extraction, Create Monitor, and Create Webhook.',
  '<Card title="Sources" icon="radio">',
  'Monitor Event Webhook and Extraction Completed Polling.',
  '<Card title="Shared helper" icon="workflow">',
  'JSON requests, structured Xquik errors, and `Retry-After` handling.',
  '## Starter Actions',
  '<Card title="Get Tweet" icon="message-square">',
  'Call `GET /x/tweets/{id}` and return one tweet.',
  '<Card title="Search Tweets" icon="search">',
  'Call `GET /x/tweets/search` and return an array of tweets.',
  '<Card title="Get User" icon="user">',
  'Call `GET /x/users/{id}` and return one user.',
  '<Card title="Get Trends" icon="trending-up">',
  'Call `GET /x/trends` and return a trend list.',
  '<Card title="Create Tweet" icon="send">',
  'Call `POST /x/tweets` and return created tweet metadata.',
  '<Card title="Create Extraction" icon="database">',
  'Call `POST /extractions` and return the job ID and status.',
  '<Card title="Create Monitor" icon="radio">',
  'Call `POST /monitors` and return the monitor ID and status.',
  '<Card title="Create Webhook" icon="webhook">',
  'Call `POST /webhooks` and return the webhook ID and signing secret.',
  '## Result Handoff',
  'Use Pipedream exports and source event metadata to pass stable fields between workflow steps.',
  'Keep raw API pages out of Slack messages, CRM rows, warehouse loads, and retry queues.',
  '<Card title="Search Tweets action" icon="search">',
  'Export `tweet_count`, `has_more`, and `next_cursor`; return tweet rows with `tweet_id`, `text`, `author_username`, `created_at`, and optional `url`.',
  '<Card title="User profile action" icon="users">',
  'Export `user_id`, `username`, `name`, `followers`, `verified`, and `profile_picture`; return one profile row for `GET /x/users/{id}`.',
  '<Card title="Trend rows" icon="trending-up">',
  'Export `trend_count` and `woeid`; return trend rows with `name`, `rank`, `query`, and `description`, then keep the selected region with workflow event metadata.',
  '<Card title="Tweet or reply write" icon="send">',
  'Send a unique `Idempotency-Key`. Export `id`, `status`, `billing`, `result`, and `statusUrl`.',
  'Poll while `terminal` is false. Retry only when `safeToRetry` is true, using a new key.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media` and export `tweet_id` or `write_action_id`.',
  'For DMs, upload first, pass one `media_id` in `media_ids`, export `message_id`, and leave `reply_to_message_id` unset.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Export monitor `id`, `username`, `xUserId`, `eventTypes`, `isActive`, and `nextBillingAt`; export webhook `id`, `url`, `eventTypes`, and one-time `secret`.',
  'For Pipedream data stores, map production `deliveryId` to `delivery_id` for receiver retry de-dupe and `streamEventId` to `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="Monitor event source" icon="fingerprint">',
  'Emit `deliveryId` for endpoint-level retry de-dupe, `streamEventId` for event-level de-dupe across endpoint changes, and `occurredAt` as `ts`.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /api/v1/events` with `after` when a workflow needs replay.',
  'Export `event_id`, `type`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`.',
  '<Card title="Receiver acceptance" icon="copy-check">',
  'Return `2xx` after accepting duplicate `deliveryId` or `streamEventId`;',
  'keep endpoint signing values, raw request body, raw signature, and full headers out of step exports, logs, data stores, Slack messages, CRM rows, and retry queues.',
  '<Card title="Extraction polling source" icon="database">',
  'Emit completed job `id`, `tool_type`, and `status`; fetch detail rows and carry `has_more` plus `next_cursor` into warehouse batches.',
  '## Source 1: Monitor Event Webhook',
  '<Card title="Event ID" icon="fingerprint">',
  'Map Pipedream `id` to `streamEventId` for event-level de-dupe, or `deliveryId` for endpoint-level de-dupe.',
  '<Card title="Event Type" icon="bell">',
  'Map `eventType` to route `tweet.new`, `tweet.reply`, `tweet.quote`, and `tweet.retweet` events.',
  '<Card title="Occurred At" icon="calendar-clock">',
  'Map `occurredAt` as the event timestamp.',
  '<Card title="Username" icon="at-sign">',
  'Map `username` for account monitor events.',
  '<Card title="Tweet ID" icon="hash">',
  'Map `data.id` as the tweet identifier.',
  '<Card title="Text" icon="type">',
  'Map `data.text` as the tweet body.',
  '<Card title="Author Username" icon="user-round">',
  'Map `data.author.userName` when present. Use `username` as the monitored-account fallback.',
  '## Recipes',
  '<Card title="Schedule Trigger" icon="calendar-clock">',
  'Run the workflow on the reporting cadence.',
  '<Card title="Xquik Search Tweets" icon="search">',
  'Call the Search Tweets action and return recent matching posts.',
  '<Card title="Engagement Filter" icon="funnel">',
  'Keep only tweets that meet the minimum engagement threshold.',
  '<Card title="Slack Send Message" icon="message-square">',
  'Send the selected tweet text, author, and link to the channel.',
  '<Card title="Monitor Event Source" icon="radio">',
  'Receive Xquik monitor events from the webhook source.',
  '<Card title="Event Type Filter" icon="funnel">',
  'Route `tweet.new`, `tweet.reply`, `tweet.quote`, and `tweet.retweet` events separately.',
  '<Card title="Get User Enrichment" icon="user">',
  'Enrich the event with the Get User action before CRM routing.',
  '<Card title="CRM Upsert" icon="database">',
  'Upsert by user ID to avoid duplicate account records.',
  '<Card title="Create Extraction" icon="database">',
  'Start the extraction job with `POST /extractions`.',
  '<Card title="Extraction Completed Source" icon="radio">',
  'Poll for completed jobs before loading rows downstream.',
  '<Card title="Fetch Extraction Detail" icon="file-text">',
  'Fetch the completed extraction detail and result rows.',
  '<Card title="Warehouse Destination" icon="database">',
  'Send normalized rows to the warehouse destination.',
  '## Test Coverage',
  '<Card title="Auth Injection" icon="shield-check">',
  'Every request includes `x-api-key` and never logs the key.',
  '<Card title="Invalid Key" icon="key-round">',
  '`401` produces "Authentication failed. Check the Xquik API key."',
  '<Card title="Rate Limit" icon="timer">',
  '`429` includes `Retry-After` when present.',
  '<Card title="Search Action" icon="search">',
  'Returns an array with stable tweet IDs.',
  '<Card title="Create Webhook" icon="webhook">',
  'Sends callback URL and selected event types.',
  '<Card title="Webhook Source" icon="radio">',
  'Emits one event per payload with a stable ID.',
  '<Card title="Polling Source" icon="database">',
  'Emits only completed extraction jobs.',
] as const;

const REQUIRED_PREFECT_GUIDE_SNIPPETS = [
  'title: "Twitter Search Pipeline with Python & Prefect"',
  'scheduled Twitter API reads in Python',
  'This Prefect Python tutorial schedules Twitter API Python reads through Xquik.',
  'This Prefect Python library gives you typed credentials and six read-only tasks.',
  'You can track Python functions as data pipelines with Prefect.',
  'The Prefect UI shows every created task and flow state in real time.',
  'The collection is read-only.',
  'provides six asynchronous Prefect tasks',
  '"prefect==3.4.25"',
  '"importlib-metadata==8.7.0"',
  'refs/tags/v0.1.7.tar.gz',
  'You can install `prefect-xquik` 0.1.8 or earlier releases from PyPI.',
  'Tag `v0.1.8` only changes package maintenance.',
  'prefect block register -m prefect_xquik',
  'prefect config set PREFECT_API_URL="http://127.0.0.1:4200/api"',
  'credentials = XquikCredentials(',
  'base_url="https://xquik.com/api/v1"',
  '## Understand the Prefect Python Runtime',
  'The `@task` decorator creates task state with optional retries.',
  'Prefect does not require YAML files for Python flows.',
  'Store the local profile name or server URL in environment variables.',
  '## Choose the Right Prefect Task',
  '<Card title="search_tweets" icon="search">',
  '<Card title="get_tweet" icon="message-square">',
  '<Card title="search_users" icon="users">',
  '<Card title="get_user" icon="user-round">',
  '<Card title="get_user_tweets" icon="list">',
  '<Card title="get_trends" icon="trending-up">',
  '## Build a Twitter Automation Flow in Python',
  'async def normalize_tweet_page(',
  '"tweet_id": tweet.get("id")',
  '"author": author if isinstance(author, dict) else {}',
  '@flow(name="Xquik Twitter Search")',
  '## Write Focused Tweet Search Queries',
  'Use `query_type="Latest"` for chronological monitoring.',
  'Use `query_type="Top"` for engagement-ranked discovery.',
  '## Schedule the Twitter Search Pipeline',
  'schedule=Cron("0 * * * *", timezone="UTC")',
  '## Paginate Tweet and Profile Results',
  'Do not decode cursors. Treat them as opaque strings.',
  'Keep `query`, `query_type`, `limit`, replies, and timestamps unchanged.',
  '## Make Scheduled Runs Idempotent',
  'Upsert tweet rows by `id`.',
  '## Retry Only Transient Failures',
  'search_recent_tweets = search_tweets.with_options(',
  'error.status_code in {424, 429, 502}',
  '## Route Every Documented Error',
  'Do not persist the raw response.',
  '<Card title="400 Invalid Request" icon="circle-x">',
  '<Card title="401 Authentication" icon="key-round">',
  '<Card title="402 Account Action" icon="credit-card">',
  '<Card title="404 Not Found" icon="search-x">',
  '<Card title="424 Dependency Failure" icon="unplug">',
  '<Card title="429 Rate Limit" icon="timer">',
  '<Card title="502 Retrieval Failure" icon="triangle-alert">',
  '## Control Concurrency and Rate Limits',
  'prefect gcl create xquik-read-rate --limit 300 --slot-decay-per-second 300',
  'await rate_limit("xquik-read-rate", occupy=1, strict=True)',
  'Await this helper before `search_tweets`, `get_tweet`, and `search_users`.',
  'Also await it before `get_user`, `get_user_tweets`, and `get_trends`.',
  'Read endpoints share a 300 per 1s user bucket.',
  'Concurrency limits only cap active work.',
  'They do not set request frequency.',
  '## Build Profile and Timeline Workflows',
  '## Build Regional Trend Alerts',
  '## Result Handoff',
  '<Card title="Tweet Pages" icon="message-square">',
  '<Card title="User Pages" icon="users">',
  '<Card title="Trend Batches" icon="trending-up">',
  '<Card title="Failure Records" icon="route">',
  '## Prefect Collection or Direct Xquik API',
  '## Common Prefect Twitter API Questions',
  '### What Is Prefect Python?',
  '### What Does This Python Prefect Tutorial Cover?',
  '### How Does a Twitter Search API Python Flow Work?',
  '### Is This Twitter Automation Python Workflow Read-Only?',
  '### Is `prefect-xquik` a Prefect Python SDK?',
  '### Which Prefect Python Version Should I Install?',
  '### Where Is the Prefect Python GitHub Collection?',
  '### Python Prefect vs Airflow: Which Fits Twitter Search?',
  'Pick Prefect when Python control flow and task retries matter.',
  '### How Do I Automate Twitter Search With Python?',
  '### How Do I Handle Twitter API Rate Limits in Prefect?',
  'Enforce a unique tweet ID constraint.',
] as const;

const FORBIDDEN_PREFECT_GUIDE_SNIPPETS = [
  'The current `0.1.5` release is read-focused.',
  'releases/download/v0.1.5/prefect_xquik-0.1.5-py3-none-any.whl',
  'https://api.xquik.com',
  'Store `response_text` with the failed run',
  'Respect `Retry-After` for repeated `429` responses.',
  '`500`',
  '`503`',
  'You get typed credentials and six read-only Prefect tasks.',
  'Use environment variables for a local Prefect profile or server.',
  'Concurrency limits cap active work, not request frequency.',
  'Choose Prefect for dynamic Python control flow and task retries.',
] as const;

const REQUIRED_HAYSTACK_GUIDE_SNIPPETS = [
  'title: "Haystack Twitter Search API & RAG Python Guide"',
  'Haystack is an open source framework for Python AI applications.',
  'Compare frameworks for building RAG and agent pipelines.',
  'This Haystack AI framework gives you typed tweet `Document` objects.',
  'Each includes text, authors, metrics, and URLs.',
  'This Haystack AI API integration supports RAG pipelines and agent workflows.',
  'They can retrieve relevant tweets for Haystack AI agents and Haystack AI RAG pipelines.',
  'These components are building blocks for pipelines and agents.',
  'a search tool called `search_current_tweets`',
  'python -m pip install "xquik-haystack==0.1.3" "haystack-ai==3.0.0"',
  'Release `0.1.3` is published on PyPI.',
  'The `pip install` command pins both packages for repeatable builds.',
  '`XquikTweetSearch` calls the `GET /x/tweets/search` search endpoint.',
  'Save every search query beside its tweet IDs.',
  'cap the number of tweets in each run.',
  'Use `XquikUserTweetsFetcher` for `GET /x/users/{id}/tweets`.',
  '## Build Reliable RAG Citations',
  '### Treat Tweet Text as Untrusted Context',
  'Never treat tweet text as a system instruction.',
  'Treat outputs from large language models (LLMs) as proposals, not evidence.',
  '## Index Tweets or Retrieve Them Live',
  '## Paginate Without Duplicate Tweets',
  'Deduplicate on `Document.meta["id"]`.',
  '## Run Haystack Pipelines Asynchronously',
  '## Handle Every Documented Error',
  'X retrieval dependency failed',
  'Retry with bounded backoff.',
  'X retrieval error',
  'Retry up to the configured limit.',
  '## Pipeline Handoff',
  'Use this shape when Haystack hands results to a vector store, evaluation job, queue, CSV export, or dashboard.',
  '<Card title="Document Rows" icon="file-text">',
  'Store content, tweet IDs, URLs, timestamps, authors, and public metrics.',
  'Author ID, username, name, and verified flag',
  '<Card title="Citation Links" icon="link">',
  'Join each canonical URL to `meta.id`.',
  '<Card title="Pagination Checkpoint" icon="list-tree">',
  'Store the request, options, `has_more`, and `next_cursor`.',
  '<Card title="Failure Branch" icon="route">',
  'Store each HTTP status with its pipeline run ID.',
  'Keep handoff records separate from embeddings.',
  'Later runs can refresh tweets without rebuilding the pipeline.',
  '## Haystack Component or Direct REST API',
  '## Migrate to Haystack 3',
  '## Common Haystack Twitter API Questions',
  '### What Is Haystack AI?',
  '### How Does the Twitter API Search Tweets?',
  '### What Is a Twitter Search API Python Workflow?',
  '### Haystack AI vs LangChain: Which Fits Twitter RAG?',
  '### Where Is the Haystack AI GitHub Integration?',
  '### Can a Haystack AI Agent Publish Tweets?',
  '### Does This Require a Haystack Enterprise Platform?',
  'Expect current results, not guaranteed real time delivery.',
  'Does your pipeline already return `Document` objects? Add these components directly.',
] as const;

const FORBIDDEN_HAYSTACK_GUIDE_SNIPPETS = [
  'pip install git+https://github.com/Xquik-dev/xquik-haystack.git',
  'The package is not published on PyPI yet',
  'Install the current GitHub build',
  'Use components when your pipeline already returns `Document` objects.',
  'title: "Haystack X API Guide for Tweet Search & RAG"',
  'Store the raw Xquik response',
  'Store the entire MCP result',
  'Run the open-source components inside your existing Haystack environment.',
  'Pin `haystack-ai==3.0.0` while testing existing components.',
  'Choose components when the workflow already uses `Document` objects.',
  'This Haystack AI framework returns typed `Document` objects with text, authors, metrics, and URLs.',
] as const;

const REQUIRED_COMPOSIO_MIGRATION_SNIPPETS = [
  'title: "Composio Twitter MCP Alternative & Migration Guide"',
  'sidebarTitle: "Composio Migration"',
  '## Evaluate Composio Alternatives for Twitter MCP',
  'Composio AI connects users to pre-built tools, handles OAuth, and exposes AI tools through MCP.',
  'The question "what is Composio AI?" needs three checks: authorization, transport, and execution.',
  'This guide compares AI workflow tools, not enterprise AI automation.',
  'Platforms for building custom AI agents still need X authorization, tweet fields, and retries.',
  'AI-powered workflow builders change only orchestration.',
  'Open-source AI agent development does too.',
  'Need a Composio open source alternative? Compare broader platforms.',
  'Xquik is a Twitter API alternative and X API alternative.',
  'Compare Composio MCP alternatives and Composio dev alternatives with these checks:',
  'Record OAuth ownership. Map each application user to one X profile.',
  'Record tool calls, API endpoints, and side effects.',
  'Choose unified APIs or a direct REST API.',
  'Test developer experience through SDK typing, logs, documentation, and rollbacks.',
  'Validate API calls and user profile scope in every AI assisted social media workflow.',
  'Can developers find the integration platform\'s API documentation?',
  'Can operators run production-ready rollback steps?',
  'Compare pricing, features, free tier, and white-label consent.',
  'Never choose an automation tool by its free tier alone.',
  'Measure real time claims.',
  'Name every data sync: tweets, profiles, followers, or events.',
  'Compare Twitter automation tools by reads, exports, monitors, webhooks, and approved writes.',
  '<a href="/mcp/overview">Xquik API MCP server</a>',
  'Do not compare volatile tool counts.',
  'python -m pip install "composio==0.15.0"',
  'npm install "@composio/core@0.14.1"',
  'session = composio_client.create(',
  'COMPOSIO_MCP_URL = session.mcp.url',
  'COMPOSIO_MCP_HEADERS = session.mcp.headers',
  'Do not pass `mcp=True` to this Python version.',
  'const session = await composio.sessions.create(process.env.USER_ID!',
  'mcp: true,',
  'const composioMcpUrl = session.mcp.url;',
  'const composioMcpHeaders = session.mcp.headers;',
  '## Configure the Xquik Twitter MCP Server',
  'https://xquik.com/mcp',
  '## Map Composio Twitter Tools to Xquik Routes',
  'GET /api/v1/x/tweets/search',
  'GET /api/v1/x/users/{id}/followers',
  '## Discover Routes Before Execution',
  'The `explore` tool finds authenticated routes without running them.',
  'return xquik.request("/api/v1/x/tweets/search"',
  '## Replace Provider-Specific Cursors',
  'Never pass a Composio cursor into Xquik.',
  'Xquik MCP list and search results use `has_more` and `next_cursor`.',
  '## Normalize Results Before Cutover',
  '### Tweet Search Rows',
  '### Profile and Follower Rows',
  '### Reply Rows',
  '### Trend Rows',
  '### Monitor and Webhook Rows',
  '### Stored Event Replay',
  'Store event ID, type, monitor ID, time, `has_more`, and `next_cursor`.',
  '## Preserve Tenant and Account Boundaries',
  '## Migrate Reads Before Writes',
  '## Cut Over Writes Safely',
  '## Preserve Media Workflows',
  '## Handle Xquik Errors',
  '400 Invalid Request',
  '401 Authentication',
  '402 Account Action',
  '404 Not Found',
  '424 Dependency Failure',
  '429 Rate Limit',
  '502 Retrieval Failure',
  '## Test, Cut Over, and Roll Back',
  '## Common Composio Twitter MCP Migration Questions',
] as const;

const FORBIDDEN_COMPOSIO_MIGRATION_SNIPPETS = [
  'Composio offers session-based MCP URLs and a 79-tool Twitter toolkit.',
  '119 JSON or text operations',
  '    mcp=True,',
  'const session = await composio.create(process.env.USER_ID!',
  'const mcpUrl = session.mcp.url;',
  'title: "Migrate from Composio Integration for X API"',
  'Pass the raw response to',
  'Store the entire MCP result',
  "Composio's deprecated Twitter MCP",
  'was decommissioned',
  'Use version-specific code when documenting the system being replaced.',
  'The `explore` tool searches the authenticated Xquik catalog without executing a request.',
  'Record each Composio tool slug, input, output, connection, and side effect.',
  'Use <code>session.mcp.url</code> and <code>session.mcp.headers</code>.',
  "Execute against the session's connected account.",
  'Confirm the path, method, parameters, response shape, and account permission.',
  "Run approved actions for the session's connected account.",
  'Xquik is not a Composio open source alternative for every integration.',
  'It is a focused Twitter API alternative and X API alternative.',
  'Its current session MCP endpoints are not decommissioned.',
  'Compare alternatives to Composio using the exact Twitter workflow being replaced.',
  'No X developer credentials are required.',
  'Ask, "what is Composio AI?"',
  'Keep API documentation and production ready rollback steps.',
  'Can your integration platform support clear API documentation and production ready rollback steps?',
] as const;

const REQUIRED_HERMES_TWEET_GUIDE_SNIPPETS = [
  'Hermes Tweet is the native Hermes Agent plugin for using Xquik as a structured X automation toolset.',
  'hermes plugins install Xquik-dev/hermes-tweet --enable',
  'uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet',
  'The current package version is `0.1.12`.',
  'The plugin name is `hermes-tweet`, and the Python entry point is `hermes-tweet = hermes_tweet`.',
  '<Card title="tweet_explore" icon="search">',
  'Search the bundled Xquik endpoint catalog without making an API call.',
  '<Card title="tweet_read" icon="book-open">',
  'Call catalog-listed read-only endpoints after `XQUIK_API_KEY` is configured.',
  '<Card title="tweet_action" icon="shield-check">',
  'Call write-like or private endpoints only when `HERMES_TWEET_ENABLE_ACTIONS=true`.',
  '## Workflow Handoffs',
  '<Card title="Tweet Search Read" icon="search">',
  'Use `tweet_read` with `GET /api/v1/x/tweets/search`, a concrete `q`, and a',
  '<Card title="Follower Export Action" icon="users">',
  'Use `tweet_action` to estimate and create `follower_explorer`, then use',
  '<Card title="Monitor Webhook Action" icon="radio">',
  'Use `tweet_explore` with `include_actions true` to find monitor and webhook',
  '`POST /api/v1/monitors/keywords` and `POST /api/v1/webhooks` only after',
  'Store the webhook `secret` in a secret manager.',
  'verify `X-Xquik-Signature`, store `deliveryId` and `streamEventId`, return',
  '`2xx` for accepted duplicates',
  'Keep endpoint signing values, raw request body, raw signature, and full headers out of Hermes transcripts and shared workflow outputs.',
  '<Card title="Media Tweet or DM Action" icon="image">',
  'Use public media URLs in `media` for tweet or reply actions. Store the',
  'durable action `id`, `status`, `billing`, `result`, and `statusUrl`.',
  'with `tweet_read` while `terminal` is false.',
  'For a tweet or reply, call tweet_action for POST /api/v1/x/tweets with media set to public HTTPS image or MP4 URLs. Do not send media_ids.',
  'For tweet_action, send a unique Idempotency-Key. Store id, status, billing, result, and statusUrl. Poll with tweet_read while terminal is false. Retry only when safeToRetry is true, using a new key.',
  'Use tweet_explore with include_actions true to find monitor and webhook endpoints.',
  'Create an account monitor or keyword monitor with tweet_action only after approval.',
  'Register the receiver URL with tweet_action for POST /api/v1/webhooks.',
  'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
  'For a DM attachment, call tweet_action for POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value.',
  'action. Keep full DM bodies out of shared outputs and leave',
  '`reply_to_message_id` unset.',
  'For a DM attachment, call tweet_action for POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value. Leave reply_to_message_id unset.',
  'Return the complete action record. Read the confirmed resource ID from result.id.',
  'Keep full DM bodies out of shared outputs.',
  '`tweet_action` stays hidden or disabled unless `HERMES_TWEET_ENABLE_ACTIONS=true`.',
  'Hermes Tweet includes 102 agent-callable Xquik endpoints.',
  'OpenAPI generates the catalog.',
  'The catalog includes 7 MPP-tagged read endpoints at fixed prices.',
] as const;

const REQUIRED_TWEETCLAW_GUIDE_SNIPPETS = [
  'TweetClaw is the official OpenClaw plugin for using Xquik from an OpenClaw agent.',
  'openclaw plugins install @xquik/tweetclaw',
  'openclaw plugins install @xquik/tweetclaw@1.6.41 --pin',
  '`@xquik/tweetclaw` is the official package. The plugin id is `tweetclaw`.',
  'The current published npm version and source-truth version are both `1.6.41`.',
  'MPP lets TweetClaw call 7 read-only X API endpoints at fixed prices without an Xquik account or API key.',
  'Use a guest `paid_reads` key when the workflow needs the broader 33-route prepaid catalog.',
  '<Card title="explore" icon="search">',
  'Search the bundled Xquik endpoint catalog and inspect parameters.',
  '<Card title="tweetclaw" icon="terminal">',
  'Call catalog-listed Xquik endpoints with structured method, path, query, and',
  'The `explore` tool is the safe first step.',
  'openclaw config set tools.alsoAllow \'["explore", "tweetclaw"]\'',
  '## Workflow Handoffs',
  '<Card title="Tweet Replies Export" icon="message-circle">',
  'Estimate `reply_extractor` with `targetTweetId`, create the extraction, poll',
  '<Card title="Follower Export" icon="users">',
  'Estimate `follower_explorer` with `targetUsername`, create the extraction,',
  '<Card title="Monitor Webhook Handoff" icon="radio">',
  'Use `explore` to find monitor and webhook endpoints, then call `tweetclaw`',
  'for `POST /api/v1/monitors` or `POST /api/v1/monitors/keywords` and',
  '`POST /api/v1/webhooks` only after approval.',
  'Store the webhook `secret` in a secret manager.',
  'verify `X-Xquik-Signature`, store',
  '`deliveryId` and `streamEventId`, return `2xx` for accepted duplicates',
  'Keep endpoint signing values, raw request body, raw signature, and full headers out of chat logs and shared workflow outputs.',
  '<Card title="Media Tweets and DM Attachments" icon="image">',
  'For tweets or replies, call `POST /api/v1/x/tweets` with public media URLs',
  'in `media`. Store the durable action `id`, `status`, `billing`, `result`,',
  'and `statusUrl`. Poll while `terminal` is false.',
  'media first, pass the returned `mediaId` as the one-item `media_ids` value,',
  'then store the DM action. Keep full DM bodies out of shared outputs and',
  'leave `reply_to_message_id` unset.',
  'For a tweet or reply, call POST /api/v1/x/tweets with media set to public HTTPS image or MP4 URLs. Do not send media_ids.',
  'Send a unique Idempotency-Key. Store id, status, billing, result, and statusUrl. Poll while terminal is false. Retry only when safeToRetry is true, using a new key.',
  'Use explore to find monitor and webhook endpoints.',
  'Create an account monitor or keyword monitor only after approval.',
  'Register the receiver URL with POST /api/v1/webhooks.',
  'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
  'For a DM attachment, call POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value. Leave reply_to_message_id unset.',
  'Return the complete action record. Read the confirmed resource ID from result.id.',
  'Keep full DM bodies out of shared outputs.',
  'Only change `baseUrl` for a self-hosted Xquik-compatible API.',
  'TweetClaw exposes 102 agent-callable endpoints across 9 categories.',
  '<Card title="account" icon="user">',
  '1 endpoint for account status and usage.',
  '<Card title="composition" icon="pen-line">',
  '13 endpoints for compose, drafts, writing styles, and radar.',
  '<Card title="extraction" icon="file-spreadsheet">',
  '9 endpoints for extraction jobs, giveaway draws, and exports.',
  '<Card title="monitoring" icon="radio">',
  '19 endpoints for account monitors, keyword monitors, events, and webhooks.',
  '<Card title="twitter" icon="search">',
  '38 endpoints for search, lookups, timelines, articles, trends, bookmarks,',
  '<Card title="x-write" icon="send">',
  '19 endpoints for post, reply, like, retweet, follow, remove follower, DM,',
  'TweetClaw keeps credentials in plugin config and injects auth at request time.',
  'OpenClaw approval prompts apply before write-like `tweetclaw` calls.',
  'Dashboard-only account-admin, billing, support-ticket, and raw credential flows are excluded',
] as const;

const REQUIRED_MICROSOFT_AGENT_FRAMEWORK_GUIDE_SNIPPETS = [
  'title: "Microsoft Agent Framework Twitter MCP Python Guide"',
  'Use this Microsoft Agent Framework tutorial to build a production-ready Twitter',
  'This Microsoft Agent Framework Python example connects to Xquik\'s',
  'The Microsoft Agent Framework MCP server connection uses Streamable HTTP.',
  'The Microsoft open-source agent framework provides agents',
  'Use this Microsoft AI',
  '## Microsoft Agent Framework Getting Started',
  'python -m pip install "agent-framework==1.13.0"',
  '## Microsoft Agent Framework Python Example for Tweet Search',
  'Model Context Protocol (MCP) tool calls',
  'class TweetSearchHandoff(BaseModel):',
  'route_used: Literal["GET /api/v1/x/tweets/search"]',
  'created: int | None',
  'allowed_tools=["explore", "xquik"]',
  'options={"response_format": TweetSearchHandoff}',
  'if not isinstance(result.value, TweetSearchHandoff):',
  'result.value.model_dump_json(indent=2)',
  '`createdAt` to the Unix-second field',
  '"never_require_approval": ["explore"]',
  '"always_require_approval": ["xquik"]',
  'request.to_function_approval_response(',
  'Message(role="user", contents=responses)',
  'function_invocation_kwargs=run_context',
  '## Scope Microsoft Agent Framework Tools for Discovery',
  '## Authenticate the Microsoft Agent Framework MCP Client',
  '## Build Microsoft Multi-Agent Framework Workflows',
  'A human in the loop must inspect every write-capable tool call.',
  '## Handle Tweet Search Errors and Rate Limits',
  '| `400` | The search query is missing or invalid',
  '| `401` | Authentication cannot complete this request',
  '| `402` | The account lacks credits',
  '| `424` | The upstream X dependency failed',
  '| `429` | The Twitter API rate limit applies',
  '| `502` | The X dependency returned an invalid response',
  '## Preserve Microsoft Agent Framework Workflows and Handoffs',
  '<Card title="Tweet Search Rows" icon="search">',
  '<Card title="Profile and Follower Rows" icon="users">',
  '<Card title="Follower Export Jobs" icon="file-spreadsheet">',
  '## Choose MCP or the Direct REST API',
  '## Migrate Older Microsoft Agent Framework Code',
  '| `agent-framework` | 1.13.0 | `==1.13.0` |',
  '## Microsoft Agent Framework Twitter API Questions',
  '### How Do I Handle Twitter API Rate Limits in Python?',
  '### Can a Microsoft Agent Export Twitter Followers?',
  '### Is Microsoft Agent Framework an Alternative to MCP?',
  '### How Does Microsoft Agent Framework MCP Authentication Work?',
  '### Does the Xquik MCP Server Require OAuth?',
  '### Where Is the Microsoft Agent Framework Documentation?',
  '### What Does the Microsoft Agent Framework SDK Provide?',
  '### Can the Agent Triage Customer Support Mentions?',
] as const;

const FORBIDDEN_MICROSOFT_AGENT_FRAMEWORK_GUIDE_SNIPPETS = [
  'created_at',
  '119 MCP-compatible',
  'Path("xquik-agent-handoff.json").write_text(response.text',
  'Prompt-only compact JSON',
  '| `agent-framework` | 1.11.0+',
  '| `mcp` | 1.24.0+ |',
  'title: "Microsoft Agent Framework for Twitter API Workflows"',
  'Separate Tweet Research From Analysis',
  'analyst = Agent(',
  'analysis = await analyst.run(',
  ')\n                )\n                )\n                continue',
] as const;

const REQUIRED_GOOGLE_ADK_GUIDE_SNIPPETS = [
  'Build a Google ADK Twitter API agent through Xquik',
  '"google-adk[mcp]>=2.6,<2.7"',
  'from google.adk import Agent',
  'from google.adk.tools.mcp_tool.mcp_toolset import McpToolset',
  'output_schema=TweetSearchHandoff',
  'event.is_final_response()',
  'TweetSearchHandoff.model_validate_json(final_text)',
  'created: int | None = None',
  'require_confirmation=True',
  '## Separate Tweet Research From X Actions',
  '## Handle Tweet Search Errors and Rate Limits',
  '## Choose Google ADK MCP or the REST API',
  '### How Do I Handle Twitter API Rate Limits in Python?',
  '### Can a Google ADK Agent Export Twitter Followers?',
  '## Discovery-Only Tool Filtering',
  'cannot distinguish GET, POST, and DELETE requests',
  'from pathlib import Path',
  'class TweetSearchHandoff(BaseModel):',
  'types.Part(',
  'Path("xquik-adk-handoff.json").write_text(',
  'It normalizes `createdAt` to the Unix-second field',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created`, `url`, `has_more`, `next_cursor`, and the original `q`.',
  '<Card title="User profile rows" icon="users">',
  'Store source `id` as `user_id`, plus `username`, `name`, `followers`, `verified`, `profile_picture`, `has_more`, `next_cursor`, and the source lookup or search query.',
  '<Card title="Trend rows" icon="trending-up">',
  'Store each trend `name`, `rank`, `query`, and `description`. Keep response `count`, `woeid`, and the requested region with the run checkpoint.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Store the returned monitor `id` as `monitor_id`, `event_types`, `next_billing_at`, the returned webhook `id` as `webhook_id`, `url`, and the one-time `secret` in a secret manager.',
  'On production deliveries, store `delivery_id` for receiver retry de-dupe and `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="Stored event replay" icon="activity">',
  'Store `event_id`, `type`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, `next_cursor`, and the `after` query for the next page.',
  '<Card title="Extraction jobs" icon="database">',
  'Store `extraction_id`, `status`, `poll`, and `export_after_complete`',
  '<Card title="Writes" icon="send">',
  'Store `tweet_id` or `write_action_id`, `reply_to_tweet_id`, `status`, `charged_credits`, and `poll`; do not resend pending writes.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media` and store `tweet_id` or `write_action_id`.',
  'For DMs, upload first, pass one `media_id` in `media_ids`, store `message_id`, and leave `reply_to_message_id` unset.',
  'Preserve exact tweet IDs, created timestamps, and cursors.',
] as const;

const REQUIRED_CREWAI_GUIDE_SNIPPETS = [
  'title: "CrewAI Twitter MCP Multi-Agent Guide for Python"',
  'Build a CrewAI MCP integration through Xquik\'s remote Twitter MCP server.',
  '## Why Use CrewAI With MCP for a Twitter API?',
  'CrewAI offers an agent framework for complex tasks.',
  'This CrewAI multi agent pattern fits research, verification, and reporting.',
  'python -m pip install "crewai>=1.15,<1.16"',
  'from pathlib import Path',
  'from crewai.mcp import MCPServerHTTP',
  'class TweetSearchHandoff(BaseModel):',
  'route_used: Literal["GET /api/v1/x/tweets/search"]',
  'created: int | None',
  'output_pydantic=TweetSearchHandoff',
  'if result.has_tool_failures:',
  'TweetSearchHandoff.model_validate(result.to_dict())',
  'handoff.model_dump_json(indent=2)',
  'The MCP runtime returns normalized snake_case fields through',
  '`xquik.request()`.',
  '`createdAt` to the Unix-second field',
  '## Build a Role-Based Tweet Research Crew',
  'context=[search_task]',
  '## Keep Twitter Actions Outside the Research Crew',
  '`human_input=True` reviews the result, while `tools=[]` blocks execution.',
  'tools=[]',
  'allowed_tool_names=["explore"]',
  '## Apply CrewAI MCP Integration Patterns',
  'Each CrewAI agent with MCP server access gets one permission boundary.',
  'Teams of AI agents must not share write-capable keys.',
  'This CrewAI MCP integration connects external APIs through synchronized schemas.',
  'Prefer CrewAI tools before building a CrewAI custom tool.',
  'The `tools` tool list shows permitted agent actions.',
  'Review agent tools before each tool integration.',
  '`import tool` shortcuts and `def run` wrappers duplicate native MCP behavior.',
  'Avoid broad web searches when tweet IDs matter.',
  'Real world AI applications need safe multi agent systems.',
  '<Card title="Tweet Search Rows" icon="search">',
  'Store `q`, `tweet_id`, `created`, `has_more`, and `next_cursor`.',
  '<Card title="Follower Exports" icon="users">',
  '<Card title="Monitor Events" icon="radio">',
  '<Card title="Extraction Jobs" icon="database">',
  '<Card title="Approved X Actions" icon="send">',
  '| `400` | Missing or invalid query |',
  '| `401` | Guest authentication failed |',
  '| `402` | Credits are unavailable |',
  '| `424` | X dependency failed |',
  '| `429` | Twitter rate limit applies |',
  '| `502` | Invalid X response |',
  '| `crewai` | 1.15.10 | `>=1.15,<1.16` |',
  '| `mcp` | 1.28.1 | `>=1.28.1,<1.29` through CrewAI |',
  '### How Do I Search Tweets With Python and CrewAI?',
  '### Can CrewAI Export Twitter Followers?',
  '### How Should CrewAI Handle Twitter API Rate Limits?',
  '### Why Are CrewAI MCP Tools Missing?',
  '[CrewAI GitHub issues](https://github.com/crewAIInc/crewAI/issues)',
] as const;

const FORBIDDEN_CREWAI_GUIDE_SNIPPETS = [
  'title: "CrewAI Twitter Agent Guide | X API Tutorial"',
  'created_at',
  'tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-crewai-handoff.json").write_text(str(result)',
  '119 MCP-compatible',
  '| `crewai` | 1.15.2 |',
  '| `mcp` | 1.26.0 |',
  'Stop incomplete research before downstream analysis',
  'Choose CrewAI when separate roles own research, analysis, and reporting.',
  'CrewAI offers an agent framework for complex tasks with distinct agent roles.',
  'These controls support real-world AI applications and multi agent systems.',
  'A CrewAI agent with MCP server access should own one permission boundary.',
  'Use hierarchical delegation for independent specialists.',
  'Create each `MCPServerHTTP` configuration after resolving its tenant.',
  'See [guest wallets](/guides/guest-wallets).',
  'That makes agent tools and tool integration boundaries clear.',
] as const;

const REQUIRED_PYDANTIC_AI_GUIDE_SNIPPETS = [
  'title: "Pydantic AI MCP Twitter API Agent Guide for Python"',
  'Build a Pydantic AI Twitter API agent through Xquik',
  '## Why Use Pydantic AI With a Twitter API?',
  'Public X reads do not require X Developer credentials.',
  'Do not send bearer tokens or access tokens.',
  '"pydantic-ai-slim[anthropic,mcp]>=2.22,<2.23"',
  '"fastmcp-slim>=3.3,<4"',
  'This Pydantic AI MCP Streamable HTTP setup',
  'This Pydantic AI MCP server connection uses the Xquik endpoint.',
  'Keep the MCP URL HTTPS-only.',
  'After setup is complete, it can be run inside a local Python process.',
  '## Build a Pydantic AI MCP Example for Tweet Search',
  'Use type hints for every durable handoff field.',
  'Start the async example with `import asyncio`.',
  'The `typing` import supplies `Literal` for finite stop reasons.',
  'from pydantic_ai.capabilities import MCP',
  'allowed_tools=["explore", "xquik"]',
  'capabilities=[xquik_mcp]',
  'from pathlib import Path',
  'output_type=TweetSearchHandoff',
  'Path("xquik-pydantic-ai-handoff.json").write_text(',
  'result.output.model_dump_json(indent=2)',
  'Model Context Protocol (MCP) turns Xquik routes into model-callable tools.',
  'Pydantic builds JSON schemas from `output_type`.',
  'Use explicit keyword arguments',
  'Map REST `createdAt` to `created`, never `created_at`.',
  'MCP output has a 24,000-character limit.',
  '## Build a Typed Twitter Agent Handoff',
  '<Card title="Follower Export" icon="download">',
  '<Card title="Monitor Replay" icon="radio">',
  'async with agent:',
  'if not first_page.output.has_more or cursor is None:',
  'second_page.output.model_dump_json(indent=2)',
  'reviewed_xquik = xquik.approval_required(',
  'output_type=[ActionReceipt, DeferredToolRequests]',
  'DeferredToolResults(approvals=approvals)',
  'Do not use `approve_all=True` when the agent can write to X.',
  'Xquik exposes only two aggregate tools.',
  '## Build Twitter API Error Handling',
  'Treat error messages as typed error handling inputs.',
  '| `402` | Subscription or credit action required |',
  '| `424` | Dependency failure or incomplete replies |',
  '| `429` | Twitter API rate limit reached |',
  'toolsets=[xquik.defer_loading()]',
  ').prefixed("twitter")',
  '## Choose Pydantic AI MCP or the REST API',
  'Xquik validates the sandbox route, method, query, and body.',
  '| `pydantic-ai-slim` | 2.22.0 | `>=2.22,<2.23` |',
  '| `fastmcp-slim` | 3.4.5 | `>=3.3,<4` through the `mcp` extra |',
  '### Does Pydantic AI Support MCP?',
  '### What Is the Difference Between Pydantic AI Tools and MCP?',
  '### How Can I Use Pydantic With AI Model Validation Effectively?',
  '### How Do I Validate Twitter API JSON With Pydantic?',
  'Never print `result.output` into logs or files.',
  '### Why Avoid a str Return?',
  'A structured result preserves tweet IDs, cursors, stop reasons, and errors.',
  '### How Do I Import Agent From Pydantic AI?',
  'Validate and approve each requested X write operation.',
  'delivery is asynchronous and cannot guarantee real-time events.',
  '### How Do I Handle Twitter API Rate Limits in Python?',
] as const;

const FORBIDDEN_PYDANTIC_AI_GUIDE_SNIPPETS = [
  'pydantic-ai[mcp]',
  'MCPServerStreamableHTTP',
  'load_mcp_servers',
  'tool_prefix=',
  '"transport": "streamable-http"',
  'title: "Pydantic AI X API Guide for Tweet Search & Agents"',
  'tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-pydantic-ai-handoff.json").write_text(\n        result.output,',
  '| `pydantic-ai-slim` | 2.11.0 |',
  '| `fastmcp-slim` | 3.4.4 |',
  'MCP tool schemas validate the selected route, method, query, and body.',
] as const;

const REQUIRED_LANGCHAIN_GUIDE_SNIPPETS = [
  'title: "LangChain Twitter API Agent with MCP & LangGraph"',
  'Build a LangChain Twitter API agent through Xquik',
  'This LangChain Twitter API integration helps when building agents for Twitter.',
  'It preserves tweet IDs, timestamps, cursors, and route errors as typed values.',
  '## Why Use LangChain With a Twitter API?',
  'Public X reads do not require X Developer credentials.',
  'Authenticate this MCP server with an Xquik API key.',
  'Do not send OAuth 2.0 or an OAuth token.',
  '"langchain>=1.3,<1.4"',
  '"langchain-mcp-adapters>=0.3,<0.4"',
  'LangChain MCP support comes from `langchain-mcp-adapters`.',
  'configured MCP server connections',
  'authenticated HTTP requests',
  '"transport": "http"',
  'anthropic:claude-sonnet-4-6',
  'from pathlib import Path',
  'response_format=TweetSearchHandoff',
  'result = await agent.ainvoke(',
  'result["structured_response"]',
  'Wait for `result = await`, then read `structured_response`.',
  'Path("xquik-langchain-handoff.json").write_text(',
  'handoff.model_dump_json(indent=2)',
  '## How to Use the Twitter API in Python With LangChain',
  'stateless by default.',
  '`createdAt` field becomes `created`, not `created_at`.',
  'MCP tool output has a 24,000-character limit.',
  'Each call uses the documented Xquik route and response fields.',
  '## Keep a Resumable Twitter Agent Handoff',
  '<Card title="Follower Exports" icon="download">',
  '<Card title="Monitor Events" icon="radio">',
  '## Build Twitter API Error Handling',
  'Match every HTTP status code before choosing the next action.',
  'A 400 Bad Request indicates invalid route parameters or unsupported fields.',
  'Preserve exact error messages for operators.',
  'Test edge cases such as repeated cursors,',
  '| `402` | Subscription or credit action required |',
  '| `424` | Upstream dependency failure or incomplete replies |',
  '| `429` | Rate limit reached |',
  'from langchain.agents.middleware import HumanInTheLoopMiddleware',
  'interrupt_on={',
  '`InMemorySaver` suits local development only.',
  'A LangChain MCP server entry defines its transport, URL, and headers.',
  '### Separate MCP Clients, Servers, and Model Credentials',
  'Model Context Protocol (MCP) powers LangChain MCP support.',
  'Use an OpenAI API key only with a compatible model provider.',
  '| `langchain` | 1.3.14 | `>=1.3,<1.4` |',
  '| `langgraph` | 1.2.10 | Installed through LangChain constraints |',
  '### Can LangChain call the Twitter API?',
  '### Can LangChain scrape tweets with Python?',
  '### What Does “Python API Twitter” Mean?',
  '### How do I authenticate with the Twitter API using Python?',
  '### How do I prevent an agent from posting automatically?',
  '### How do I post a tweet using Python with LangChain?',
  'They are not guaranteed real time.',
  '### How do I handle Twitter API rate limits in Python?',
] as const;

const FORBIDDEN_LANGCHAIN_GUIDE_SNIPPETS = [
  'title: "LangChain X API Guide for Tweet Search & Agents"',
  'tweets[{tweet_id,text,author_username,created_at}]',
  'str(response["messages"][-1].content)',
  'str(result["messages"][-1].content)',
  '| `langchain` | 1.3.13 |',
  '| `mcp` | 1.28.1 |',
] as const;

const REQUIRED_MASTRA_GUIDE_SNIPPETS = [
  'title: "Mastra Twitter MCP Agent Guide for TypeScript"',
  'Build a Mastra Twitter MCP agent through Xquik\'s remote MCP server.',
  'Node.js 22.13 or later',
  'npm install "@mastra/core@^1.55" "@mastra/mcp@^1.15" zod',
  'import { writeFile } from "node:fs/promises";',
  'import { z } from "zod";',
  'route_used: z.literal("GET /api/v1/x/tweets/search")',
  'created: z.number().int().nullable()',
  '{ structuredOutput: { schema: handoffSchema } }',
  'JSON.stringify(result.object, null, 2)',
  '`listTools()` suits',
  '`listToolsets()` groups tools by server for each call.',
  'The client tries Streamable HTTP for URL servers.',
  'The MCP runtime returns normalized snake_case fields through',
  '`xquik.request()`.',
  'It normalizes `createdAt` to the Unix-second field',
  'requireToolApproval: ({ toolName }) => toolName === "xquik"',
  '`agent.approveToolCallGenerate()`',
  'Never treat MCP annotations as an authorization boundary.',
  '<Card title="Tweet Search Rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created`, `url`, `has_more`, `next_cursor`, and the original `q`.',
  '<Card title="Follower Exports" icon="users">',
  '<Card title="Monitor Events" icon="radio">',
  '<Card title="Extraction Jobs" icon="database">',
  '<Card title="Approved X Actions" icon="send">',
  '| `400` | The search query is missing or invalid |',
  '| `401` | Guest authentication cannot complete this request |',
  '| `402` | The account lacks credits |',
  '| `424` | The upstream X dependency failed |',
  '| `429` | The Twitter API rate limit applies |',
  '| `502` | The X dependency returned an invalid response |',
  '| `@mastra/core` | 1.55.0 | `>=1.55,<2` |',
  '| `@mastra/mcp` | 1.15.0 | `>=1.15,<2` |',
  '### How Do I Search Tweets With TypeScript?',
  '### Can a Mastra Agent Export Twitter Followers?',
  '### How Should a Mastra Agent Handle Twitter Rate Limits?',
] as const;

const FORBIDDEN_MASTRA_GUIDE_SNIPPETS = [
  'title: "Mastra Twitter Agent Guide | X API Tutorial"',
  'created_at',
  'tweets[{tweet_id,text,author_username,created_at}]',
  'await writeFile("xquik-mastra-handoff.json", result.text, "utf8");',
  '119 MCP-compatible',
  '| `@mastra/mcp` | 1.14.0 |',
  '| `@mastra/core` | 1.51.0 |',
  '| `@modelcontextprotocol/sdk` | 1.29.0 |',
] as const;

const REQUIRED_N8N_ALTERNATIVE_SNIPPETS = [
  '## Source-backed n8n scope',
  "n8n's official X node docs list built-in operations for direct messages",
  'creating or replying to tweets, deleting tweets, searching tweets, liking tweets, retweeting tweets',
  "n8n's official HTTP Request node docs describe REST calls to any app or service with a REST API",
  'query parameters, headers, form, form-data, JSON, binary-file, and raw request bodies',
  'production executions started automatically by triggers, schedules, or polling',
  'projects, sharing, external credential storage, log streaming, multi-main mode, SSO, and Git version control',
  'n8n HTTP Request node',
  'n8n executions',
  'n8n Community Edition',
  '/guides/n8n',
] as const;

const REQUIRED_N8N_GUIDE_SNIPPETS = [
  'Create a reusable n8n credential for Xquik:',
  '<Card title="Authentication" icon="key-round">',
  'Select Header Auth for the HTTP Request credential.',
  '<Card title="Header name" icon="braces">',
  'Set the header name to `x-api-key`.',
  '<Card title="Header value" icon="shield-check">',
  'Paste your Xquik API key as the credential value.',
  'Set Server Transport to `HTTP Streamable`.',
  'Set MCP Endpoint URL to `https://xquik.com/mcp`.',
  'Set Authentication to `Header Auth`.',
  'Set Name to `x-api-key` and Value to your Xquik API key.',
  'The MCP Client Tool also supports `MCP OAuth2`.',
  'Use that credential in every HTTP Request node that calls `https://xquik.com/api/v1`.',
  'If you package Xquik as a community node, keep the first release narrow and reliable.',
  '<Card title="Credential" icon="key-round">',
  'Create an `Xquik API Key` credential and inject it as `x-api-key`.',
  '<Card title="Base URL" icon="link">',
  'Point every REST action at `https://xquik.com/api/v1`.',
  '<Card title="Request helper" icon="workflow">',
  'Support `GET`, `POST`, `PATCH`, `DELETE`, JSON bodies, structured errors, and `Retry-After` backoff.',
  '<Card title="Resources" icon="boxes">',
  'Start with Tweet, User, Trends, Extraction, Monitor, and Webhook resources.',
  '<Card title="Actions" icon="play">',
  'Ship Get Tweet, Search Tweets, Get User, Get Trends, Create Tweet, Create Extraction, Create Monitor, and Create Webhook first.',
  '<Card title="Sources" icon="radio">',
  'Add Monitor Event Webhook and Extraction Completed Polling sources.',
  'Handle these response classes explicitly:',
  '<Card title="400 invalid input" icon="circle-alert">',
  'Surface the Xquik `error` and `message` fields in the failed item.',
  '<Card title="401 authentication" icon="key-round">',
  'Ask the user to check the Header Auth credential and `x-api-key` value.',
  '<Card title="402 billing state" icon="credit-card">',
  'Route to subscription or credit setup before retrying the node.',
  '<Card title="429 rate limit" icon="timer">',
  'Read `Retry-After` from response headers and wait before retrying.',
  '<Card title="5xx transient" icon="refresh-cw">',
  'Enable n8n Retry on Fail with exponential backoff, then fail the item.',
  '## Result Handoff',
  'Use an Edit Fields node after each HTTP Request node when the next node only',
  'needs stable handoff fields. Keep raw responses out of Slack messages, Sheets',
  'Use snake_case storage keys for handoff rows even when',
  'direct API responses use camelCase.',
  '<Card title="Tweet search page" icon="search">',
  'Store request `q`; map each tweet `id`, `text`, `author.username`, and `createdAt` to `tweet_id`, `text`, `author_username`, and `created_at`; keep `has_next_page` and `next_cursor` for page loops.',
  '<Card title="User profile rows" icon="users">',
  'Store source `id` as `user_id`, plus `username`, `name`, `followers`, `verified`, `profile_picture`, `has_next_page`, `next_cursor`, and the lookup or search input.',
  '<Card title="Trend rows" icon="trending-up">',
  'Store each trend `name`, `rank`, `query`, and `description`. Keep response `count`, `woeid`, and the requested region with the workflow run.',
  '<Card title="Tweet or reply write" icon="send">',
  'Send a unique `Idempotency-Key`. Store `id`, `status`, `billing`, `result`, and `statusUrl`.',
  'Poll while `terminal` is false. Retry only when `safeToRetry` is true, using a new key.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media`; do not send `media_ids`.',
  'For DMs, upload first, pass 1 `media_id` in `media_ids`, store `message_id`, and leave `reply_to_message_id` unset.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Store monitor `id`, `username`, `xUserId`, `eventTypes`, `isActive`, and `nextBillingAt`; store webhook `id`, `url`, `eventTypes`, and one-time `secret`.',
  'For storage rows, map production `deliveryId` to `delivery_id` for receiver retry de-dupe and `streamEventId` to `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="Webhook event de-dupe" icon="fingerprint">',
  'Store `deliveryId` for receiver retry de-dupe and `streamEventId` when one monitor event should process once across endpoint changes.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /events` with `after` when a workflow needs replay.',
  'Map `id`, `monitorId`, `monitorType`, `occurredAt`, `hasMore`, and `nextCursor` to `event_id`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`.',
  '<Card title="Receiver acceptance" icon="copy-check">',
  'Return `2xx` after accepting duplicate `deliveryId` or `streamEventId`;',
  'keep endpoint signing values, raw request body, raw signature, and full headers out of n8n executions, data stores, Slack messages, Sheets rows, and retry queues.',
  '<Card title="Extraction job" icon="database">',
  'Store `id` as `extraction_id`, `toolType` as `tool_type`, plus `status`, `has_more`, and `next_cursor` before batch loops fetch detail rows.',
  'Use this when a Slack channel should receive new tweets, replies, quotes, or retweets from monitored accounts.',
  '<Card title="Webhook Trigger" icon="webhook">',
  'Receive Xquik monitor events on the production Webhook URL.',
  '<Card title="Create webhook" icon="send">',
  'Use HTTP Request to call `POST /webhooks` with the Webhook Trigger URL.',
  '<Card title="Create monitor" icon="radio">',
  'Use HTTP Request to call `POST /monitors` for the username and event types.',
  '<Card title="Format alert" icon="type">',
  'Use Set to build Slack text from `data`, with `username` as fallback.',
  '<Card title="Post alert" icon="message-square">',
  'Send the formatted message to Slack after the webhook and monitor exist.',
  'Use this when a team needs bulk follower, reply, quote, media, list, community, or search results in a spreadsheet.',
  '<Card title="Schedule Trigger" icon="calendar-clock">',
  'Run daily or hourly exports; execute manually while testing.',
  '<Card title="Create extraction" icon="send">',
  'Use HTTP Request to call `POST /extractions` and store the returned `id`.',
  '<Card title="Wait before polling" icon="timer">',
  'Pause before the first status check so the extraction can start.',
  '<Card title="Fetch results" icon="list-checks">',
  'Use HTTP Request to call `GET /extractions/{id}` and read `job.status`.',
  '<Card title="Gate completed jobs" icon="circle-check">',
  'Use IF to continue only when `job.status` is `completed`.',
  '<Card title="Append rows" icon="file-spreadsheet">',
  'Use Google Sheets Append Row with the mapped result fields below.',
  '<Card title="Tweet ID" icon="hash">',
  'Map to `id`.',
  '<Card title="Author" icon="at-sign">',
  'Map to `author.username`.',
  '<Card title="Text" icon="type">',
  'Map to `text`.',
  '<Card title="Created At" icon="calendar">',
  'Map to `createdAt`.',
  '<Card title="Likes" icon="heart">',
  'Map to `likeCount`.',
  '<Card title="Reposts" icon="repeat-2">',
  'Map to `retweetCount`.',
  '<Card title="URL" icon="link">',
  'Build from `https://x.com/{author.username}/status/{id}`.',
  '<Card title="Get tweet" icon="message-circle">',
  'Read one or more posts with `GET /x/tweets?ids=<id>`.',
  '<Card title="Search tweets" icon="search">',
  'Run X query searches with `GET /x/tweets/search?q=<query>`.',
  '<Card title="Get user" icon="user-round">',
  'Fetch an X profile with `GET /x/users/{id}`.',
  '<Card title="Get trends" icon="trending-up">',
  'Read regional X trends with `GET /x/trends`.',
  '<Card title="Create tweet" icon="send">',
  'Publish text or media posts with `POST /x/tweets`.',
  '<Card title="Create extraction" icon="boxes">',
  'Start bulk export jobs with `POST /extractions`.',
  '<Card title="Create monitor" icon="radio">',
  'Watch accounts or keywords with `POST /monitors`.',
  '<Card title="Create webhook" icon="webhook">',
  'Register signed delivery URLs with `POST /webhooks`.',
] as const;

const REQUIRED_MAKE_GUIDE_SNIPPETS = [
  '## App Shape',
  '<Card title="Connection" icon="key-round">',
  'Use an API key parameter named `apiKey` and inject it as `x-api-key`.',
  '<Card title="Base URL" icon="link">',
  'Call Xquik REST modules from `https://xquik.com/api/v1`.',
  '<Card title="Modules" icon="boxes">',
  'Start with Search Tweets, Get Tweet, Get User, Get Trends, Create Tweet, Create Extraction, Create Monitor, Create Webhook, and Make an API Call.',
  '<Card title="Triggers" icon="radio">',
  'Support Monitor Event instant webhooks and Extraction Completed polling.',
  '<Card title="Error handling" icon="circle-alert">',
  'Map `401`, `402`, `429`, and `5xx` to short scenario messages.',
  "Use Xquik's `/account` endpoint as the connection test because it validates the API key without mutating data.",
  'Handle status codes consistently:',
  '<Card title="401 authentication" icon="key-round">',
  'Authentication failed. Check the Xquik API key.',
  '<Card title="402 billing state" icon="credit-card">',
  'Subscription or credits required. Update billing in Xquik.',
  '<Card title="429 rate limit" icon="timer">',
  'Rate limited. Respect the `Retry-After` header before retrying.',
  '<Card title="5xx transient" icon="refresh-cw">',
  'Xquik service unavailable. Retry with exponential backoff.',
  '## Starter Modules',
  '<Card title="Search Tweets" icon="search">',
  'Search module. Call `GET /x/tweets/search` with `q`; use `cursor` for page loops and keep `limit` on bounded resumes.',
  '<Card title="Get Tweet" icon="message-circle">',
  'Action module. Call `GET /x/tweets/{id}` with a tweet ID.',
  '<Card title="Get User" icon="user-round">',
  'Action module. Call `GET /x/users/{id}` with a user ID or username.',
  '<Card title="Get Trends" icon="trending-up">',
  'Search module. Call `GET /x/trends` with optional `woeid` and `count`.',
  '<Card title="Create Tweet" icon="send">',
  'Action module. Call `POST /x/tweets` with account, text, and optional public media URLs.',
  '<Card title="Create Extraction" icon="boxes">',
  'Action module. Call `POST /extractions` with `toolType`, query fields, and result limit.',
  '<Card title="Create Monitor" icon="radio">',
  'Action module. Call `POST /monitors` with username and event types.',
  '<Card title="Create Webhook" icon="webhook">',
  'Action module. Call `POST /webhooks` with callback URL and event types.',
  '<Card title="Make an API Call" icon="terminal">',
  'Universal module. Accept any `/api/v1` path as an escape hatch for endpoints not yet modeled.',
  'Add a bounded-pull variant that sends `limit`.',
  'If `body.has_next_page` is `true`, send `body.next_cursor` as `cursor` with the same `q`, filters, and `limit`.',
  '## Output Handoff',
  'Make response handling lets search modules `iterate` over `body.tweets` while `body` stays available for output, wrapper, and pagination fields.',
  'Use snake_case keys for data-store rows even when the API response uses camelCase.',
  '<Card title="Tweet search page" icon="search">',
  'Store `q`, each `tweet_id`, `text`, `author_username`, `created_at`, `has_next_page`, and `next_cursor`.',
  '<Card title="User profile rows" icon="users">',
  'Store source `id` as `user_id`, plus `username`, `name`, `followers`, `verified`, and `profile_picture`.',
  'For user-list modules, carry `has_next_page` and `next_cursor`.',
  '<Card title="Trend rows" icon="trending-up">',
  'Store each trend `name`, `rank`, `query`, and `description`; keep `body.count`, `body.woeid`, and the selected region in scenario state.',
  '<Card title="Tweet or reply write" icon="send">',
  'Send a unique `Idempotency-Key`. Store the returned action.',
  'Poll `status_url` while `terminal` is false. Retry only when `safe_to_retry` is true, using a new key.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media` and store `tweet_id` or `write_action_id`.',
  'For DMs, upload first, pass one `media_id` in `media_ids`, store `message_id`, and leave `reply_to_message_id` unset.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Store monitor `id`, `username`, `xUserId`, `eventTypes`, `isActive`, `nextBillingAt`, webhook `id`, `url`, `eventTypes`, and the one-time `secret`.',
  'For Make storage rows, map production `deliveryId` to `delivery_id` for receiver retry de-dupe and `streamEventId` to `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="Extraction jobs" icon="database">',
  'Store `id`, `tool_type`, and `status` from `POST /extractions`; poll `GET /extractions/{id}`, then carry `has_more` and `next_cursor`.',
  '<Card title="Webhook event dedupe" icon="fingerprint">',
  'Store `deliveryId` for endpoint-level retry dedupe and `streamEventId` when one monitor event must process once across receiver changes.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /api/v1/events` with `after` when a scenario needs replay.',
  'Map `id`, `monitorId`, `monitorType`, `occurredAt`, `hasMore`, and `nextCursor` to `event_id`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`.',
  '<Card title="Receiver acceptance" icon="copy-check">',
  'Return `2xx` after accepting duplicate `deliveryId` or `streamEventId`;',
  'keep endpoint signing values, raw request body, raw signature, and full headers out of scenario logs, data stores, Slack messages, CRM rows, and retry queues.',
  'Map webhook output fields for downstream modules:',
  '<Card title="Event type" icon="bell">',
  'Map `eventType` to route `tweet.new`, `tweet.reply`, `tweet.quote`, and `tweet.retweet` events.',
  '<Card title="Delivery ID" icon="fingerprint">',
  'Map `deliveryId` as the per-endpoint idempotency key for retries.',
  '<Card title="Stream event ID" icon="link">',
  'Map `streamEventId` when one monitor event should process once across endpoint changes.',
  '<Card title="Occurred at" icon="calendar-clock">',
  'Map `occurredAt` as the event timestamp.',
  '<Card title="Username" icon="at-sign">',
  'Map `username` for account monitor events.',
  '<Card title="Tweet ID" icon="hash">',
  'Map `data.id` as the tweet identifier.',
  '<Card title="Text" icon="type">',
  'Map `data.text` as the tweet body.',
  '<Card title="Author username" icon="user-round">',
  'Map `data.author.userName` when present. Use `username` as the monitored-account fallback.',
  '## Recipes',
  '<Card title="Monitor Event Trigger" icon="radio">',
  'Start from the Xquik Monitor Event instant trigger for `tweet.new`, `tweet.reply`, `tweet.quote`, and `tweet.retweet`.',
  '<Card title="Topic Filter" icon="funnel">',
  'Filter on `eventType`, `username`, and `data.text` before routing alerts.',
  '<Card title="Slack Message" icon="message-square">',
  'Create a Slack message from `data.text`, `data.id`, `data.author.userName`, and `occurredAt`.',
  '<Card title="Dedupe Store" icon="database">',
  'Upsert by `deliveryId` per endpoint. Use `streamEventId` when one monitor event should fan out once across endpoint changes.',
  '<Card title="Schedule Trigger" icon="calendar-clock">',
  'Run the scenario on a daily schedule for repeatable topic research.',
  '<Card title="Search Tweets" icon="search">',
  'Call Xquik Search Tweets with `q`; use `cursor` for page loops and keep `limit` on bounded resumes.',
  '<Card title="Iterator" icon="list">',
  'Iterate over `tweets` and pass one tweet bundle to each downstream module.',
  '<Card title="Sheet Row" icon="table">',
  'Append `id`, `author.username`, `text`, `createdAt`, `likeCount`, and `retweetCount`.',
  '<Card title="Start Run" icon="play">',
  'Use a scheduler or manual trigger to start the bulk extraction.',
  '<Card title="Create Extraction" icon="boxes">',
  'Call Xquik Create Extraction with `toolType` and the required target fields.',
  '<Card title="Wait or Poll" icon="timer">',
  'Wait before polling, or reuse the Extraction Completed polling trigger.',
  '<Card title="Get Extraction" icon="search">',
  'Call `GET /extractions/{id}` until `job.status` is `completed` or `failed`.',
  '<Card title="CRM Upsert" icon="database">',
  'Upsert by user `id`, then follow `hasMore` and `nextCursor` for additional result pages.',
  '`GET /x/tweets/search`',
  '`POST /x/tweets`',
  '`POST /extractions`',
  '`POST /monitors`',
  '`POST /webhooks`',
] as const;

const REQUIRED_MAKE_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Make scope',
  "Make's official pricing page says each module action in a scenario counts as one credit, Free includes 1,000 credits/month",
  "Make's official HTTP app documentation says the HTTP app can call services without a native Make integration",
  'offset, page, URL/link, or cursor-style pagination',
  'instant webhooks, custom webhooks, webhook queues, response handling',
  'action, search, polling trigger, instant trigger, universal, and responder module types',
  '## Monitor webhook receiver handoff',
  'When a Make webhook receives Xquik monitor events, verify `X-Xquik-Signature` before routing bundles to routers, Slack, Sheets, queues, or CRMs.',
  'Store `deliveryId` and `streamEventId` as separate Make data-store keys:',
  'Return `2xx` after accepting a duplicate `deliveryId` or `streamEventId`;',
  'Do not store endpoint signing values, raw request body, raw signature, or full headers in scenario logs, data stores, Slack messages, CRM rows, or retry queues.',
  'Make webhooks',
  'Make custom app modules',
  '/guides/make',
] as const;

const REQUIRED_WORKFLOW_SHORTLIST_SNIPPETS = [
  '## Workflow Automation Shortlist',
  '<Card title="n8n" icon="workflow" href="/alternatives/n8n">',
  '<Card title="Make" icon="route" href="/alternatives/make">',
  '<Card title="Pipedream" icon="code" href="/alternatives/pipedream">',
  '<Card title="Zapier" icon="zap" href="/alternatives/zapier">',
  '<Card title="PhantomBuster" icon="timer" href="/alternatives/phantombuster">',
  'tweet search',
  'signed monitor webhooks',
  'CSV/JSON/XLSX exports',
] as const;

const REQUIRED_PHANTOMBUSTER_ALTERNATIVE_SNIPPETS = [
  'collect profiles, send outreach, export followers, search tweets, monitor accounts, trigger webhooks, or hand data to an app or AI agent',
  'No-code cloud automation platform with Phantoms, Flows, execution time, and automation slots.',
  '## Source-backed PhantomBuster scope',
  'Trial, Start, Grow, and Scale plans with automation slots, monthly execution time, email credits, AI credits, URL finder credits, integrations',
  'data extraction across 15+ platforms, 100+ automations and workflows, scheduled auto-refresh, and export limits',
  'CSV combines results from all runs so far, JSON covers the most recent run, Free plan and Free Trial exports are limited to 10 rows',
  'paid plans unlock full CSV files, JSON files, and CSV URLs for Google Sheets or integrations',
  'successful launches return status `200` with a Container ID, and Workflows cannot be launched through the API',
  'Twitter Follower Collector, Twitter Following Collector, Twitter Hashtag Collector, Twitter Auto Unfollow, and Twitter Search Export',
  "PhantomBuster's official API help describes launching an individual Phantom through `POST /agents/launch` with an Agent ID.",
  'PhantomBuster export help',
  'PhantomBuster API launch help',
  'PhantomBuster rate limits',
] as const;

const REQUIRED_ALTERNATIVES_SECTOR_SNIPPETS = [
  '## Twitter API Alternative Questions for 2026',
  '### Which Twitter API Alternative Is Easiest to Use?',
  '### Is Xquik Better Than the Official Twitter API for Scraping?',
  '### Xquik vs Apify Twitter Scraper',
  '### Xquik vs Twitter API v2',
  '### What Makes a Strong Twitter API Comparison?',
  '## Sector Decision Matrix',
  '<Card title="Developer API teams" icon="code">',
  '<Card title="Scraping and dataset teams" icon="database">',
  '<Card title="Creator publishing teams" icon="pen-line">',
  '<Card title="Social listening and enterprise teams" icon="building-2">',
  '<Card title="Workflow automation teams" icon="workflow">',
  '<Card title="AI agent teams" icon="bot">',
  '[X API](/alternatives/x-api)',
  '[Apify](/alternatives/apify)',
  'Xquik on Apify',
  '[Brandwatch](/alternatives/brandwatch)',
  '[Meltwater](/alternatives/meltwater)',
  '[Talkwalker](/alternatives/talkwalker)',
  'signed webhooks',
  'CSV/JSON/XLSX exports',
  'Test MCP tool result, tweet search records, user profile fields, and compose score.',
] as const;

const REQUIRED_BRANDWATCH_ALTERNATIVE_SNIPPETS = [
  'social listening, consumer intelligence, or social media management workflow',
  'search tweets, export followers, monitor accounts or keywords, send webhooks',
  '## Source-backed Brandwatch scope',
  'official firehose access to Twitter, Tumblr, and Reddit',
  'dashboards, audience demographics, influencers, image analysis, Signals alerts, Excel/PPT/PDF exports, and Brandwatch API access',
  'content calendar, publishing workflows, approval flows, an Engage inbox, sentiment and spam detection, helpdesk integration',
  'Consumer intelligence and social media management suite.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one social listening job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Brandwatch site',
  'Brandwatch Consumer Intelligence',
  'Brandwatch Consumer Research features',
  'Brandwatch Social Media Management',
] as const;

const REQUIRED_MELTWATER_ALTERNATIVE_SNIPPETS = [
  'media monitoring, social listening, or social media management workflow',
  'search tweets, export followers, monitor accounts or keywords, send webhooks',
  '## Source-backed Meltwater scope',
  'coverage across major social networks, blogs, forums, podcasts, online news, reviews, owned channels, and public social content',
  'Boolean-style searches, sentiment views, share-of-voice and benchmarking metrics, dashboards, reports, real-time alerts, exportable charts, visual enrichments, influencer discovery',
  'Export API for exporting media articles and social mentions from existing searches',
  'demo-led suite motion instead of published self-serve prices',
  'Instagram, TikTok, X, Facebook, Bluesky, LinkedIn, YouTube, and Reddit among covered channels',
  '400,000+ traditional media sources, 200M+ online publications',
  'workflow integrations with Slack, Microsoft Teams, business intelligence platforms, APIs, and custom integrations',
  '## Current access checkpoint',
  'Confirm X/Twitter coverage, alert channels, export fields, package access, and freshness needs.',
  'Confirm Slack, Microsoft Teams, BI, Export API, Data Streams, and custom integration access.',
  'Media intelligence, social listening, and social media management suite.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one monitoring job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Meltwater site',
  'Meltwater media monitoring',
  'Meltwater social management',
  'Meltwater Export API',
] as const;

const REQUIRED_TALKWALKER_ALTERNATIVE_SNIPPETS = [
  'social listening, consumer intelligence, or social media analytics workflow',
  'search tweets, export followers, monitor accounts or keywords, send webhooks',
  '## Source-backed Talkwalker scope',
  'tracking keywords and mentions across 30 social networks, 150+ million websites, videos, images, podcasts, reviews, surveys, and support interactions',
  'visual listening, customizable dashboards, real-time alerts, conversation clusters, sentiment analysis, AI summaries, virality maps',
  'Social Listening, Social Benchmarking, Media Monitoring, Customer Feedback Analytics',
  'Consumer intelligence, social listening, and social media analytics platform.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one listening job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Talkwalker site',
  'Talkwalker Social Listening',
  'Talkwalker products',
  'Talkwalker data coverage',
] as const;

const REQUIRED_TWEETDECK_ALTERNATIVE_SNIPPETS = [
  '## Source-backed TweetDeck/X Pro scope',
  "X's official X Pro help describes X Pro as the global replacement for TweetDeck",
  'multi-column workspace that incorporates more of X.com',
  'full post composer, scheduled posts, advanced search, top/latest post order, Decks',
  'column types for home, notifications, search, lists, communities, explore, bookmarks, profiles, messages, and scheduled posts',
  'X Premium as an optional paid subscription with Basic, Premium, and Premium+ tiers',
  'Premium features are subject to change',
  'delegate account access without sharing sign-in credentials',
  'does not support scheduled Direct Messages',
  'TweetDeck/X Pro is a live X workspace for columns, search, scheduled posts, and manual monitoring.',
  'X Pro help lists a full post composer, scheduled posts, advanced search, top/latest post order, Decks, a column creator, video docking, and account switching.',
  'search tweets, fetch users, export followers, post tweets, upload media, send DMs, monitor keywords, and receive webhook events',
  'Compare columns, saved searches, tweet IDs, author IDs, timestamps, post results, export formats, webhook payloads, and the handoff to your production system.',
  'Active Xquik monitors cost 21 credits per hour while enabled, and webhook plus stored-event delivery is included.',
  'Official X Pro help',
  'Official X Premium terms',
] as const;

const REQUIRED_ZERNIO_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Zernio scope',
  "Zernio's official rebrand page says Late is now Zernio",
  'same API, team, webhooks, `/api/v1` endpoints, route parameters, and response schemas',
  '`getlate.dev` redirects to `zernio.com`',
  'Bearer authentication, profile creation, scheduled posts, immediate posts, and cross-posting to multiple accounts',
  'first 2 connected accounts are free, accounts 3-10 cost USD 6/account/month, accounts 11-100 cost USD 3/account/month, accounts 101-2,000 cost USD 1/account/month',
  'analytics, comments, DMs, ads, webhooks, MCP server, CLI, SDKs, dashboard, and team members are included per connected account',
  'X/Twitter usage is passed through separately at USD 0.005/read, USD 0.010/write, and USD 0.015/DM',
  'Twitter/X limitations for DMs and cached reply search',
  'account connection, post scheduling, media upload, analytics, ads, messages, comments, reviews, webhooks, and account settings',
] as const;

const REQUIRED_TWSCRAPE_ALTERNATIVE_SNIPPETS = [
  '## Source-backed twscrape scope',
  "twscrape's official GitHub README describes it as a Twitter GraphQL API implementation with SNScrape data models",
  'Installation uses `pip install twscrape`',
  'Search and GraphQL Twitter APIs, async/await functions that can run multiple scrapers in parallel',
  'login flow with email verification, saved account sessions, raw Twitter API responses, SNScrape models',
  'requires authorized X/Twitter accounts to work with the API',
  'adding accounts with cookies or login credentials, login and relogin CLI commands, account status inspection',
  'search tabs for Top, Latest, and Media; tweet details; retweeters; tweet replies; user lookup by login or ID',
  'followers; verified followers; subscriptions; user tweets; user replies; user media; list timelines; trends; raw responses',
  'one-document-per-line stdout output, raw output, desired `limit`, and per-endpoint pagination behavior',
  'request limits reset every 15 minutes per endpoint',
  '`user_tweets` and `user_tweets_and_replies` can return about 3,200 tweets maximum',
] as const;

const REQUIRED_POSTPROXY_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Postproxy scope',
  'one API for creating social posts across Facebook, Instagram, TikTok, LinkedIn, YouTube, X, Threads, and Pinterest',
  'MCP, skills, n8n, Zapier, Make, Needle, and other workflow tools as publishing integrations',
  'built-in scheduling, error handling, retry management, authentication, and a connected social account requirement',
  'Free includes 2 profile groups and 10 posts/month',
  'Build lists 10 profile groups, 120 posts/month, comments, analytics, 30-day publish logs, and webhooks at USD 17/month',
  'Scale lists 50 profile groups, no listed monthly post-count cap, 180-day publish logs, webhooks, and priority support at USD 99/month',
  'Enterprise starts at USD 699/month',
  'one published post counts as one post even when cross-posted to multiple platforms',
  '`post.processed`, `platform_post.published`, `platform_post.failed`, `platform_post.failed_waiting_for_retry`, `platform_post.insights`, `profile.disconnected`, `profile.connected`, and `media.failed`',
  'BYO developer credentials guide says connecting X profiles with your own X developer credentials exempts those profiles from the shared 24-hour posting quota',
] as const;

const REQUIRED_POST_BRIDGE_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Post Bridge scope',
  'API access requires an active Post Bridge subscription and the API add-on',
  'USD 5/month in addition to the plan subscription',
  'dashboard page for API credentials, API documentation, and Discord support through a dedicated API channel',
  'upload video content once, connect each social media account, and Post Bridge distributes the content to connected platforms',
  'content must be uploaded directly through Post Bridge',
  'does not support reposting Instagram collaborative reels, already-live social posts, or videos from other platforms or channels',
  'does not currently support Twitter/X threads, Instagram Threads threaded posts, or split tweets',
  'schedule individual posts to X and Instagram Threads',
  '100 scheduled posts/hour per user',
  'MP4 or MOV video uploads, 9:16, 16:9, 1:1, and 4:3 video ratios',
  '3-second minimum and 300-second maximum videos',
  '8MB maximum per image, and 35 total images',
] as const;

const REQUIRED_OUTSTAND_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Outstand scope',
  'unified social media API for builders with 10 platforms, 1 API, and pay-per-post pricing',
  'one API call can post to X, LinkedIn, Instagram, and 7 other platforms',
  'X, LinkedIn, Instagram, TikTok, Facebook, Threads, Bluesky, YouTube, Pinterest, and Google Business',
  'USD 5/month with 1,000 included posts and USD 0.01 per post over 1,000',
  'connected accounts without a visible account cap, all 10 platforms, webhooks, MCP, and BYO credentials',
  'social accounts, posts, scheduling, first comment scheduling, and media attachment as core features',
  '`GET /v1/social-accounts` for connected accounts and `POST /v1/posts` with `containers`, `socialAccountIds`, and optional `scheduledAt`',
  'supports one authentication method, passes a Bearer credential in the `Authorization` header',
  'allows multiple named credentials per organization',
  '25 tools for posting, scheduling, analytics, media management, account management, and social network configuration',
  '`create_post`, `list_posts`, `get_post`, `get_post_analytics`, `delete_post`, `create_reply`, and `get_replies`',
  '`scheduled_at` up to 30 days ahead',
  'uses `upload_media`, HTTP PUT to the upload URL, `confirm_media_upload`, then `create_post` with the media ID',
  'Confirmed media files are retained for 60 days',
  'per-account `status`, `error`, `platformPostId`, and `publishedAt`',
  'scheduled publishing starts at the scheduled time with a 30-second tolerance',
  '`post.published` and `post.error` events plus an account re-authentication event',
  '`X-Outstand-Signature: sha256=<signature>`',
  'HMAC-SHA256 over the raw request body',
] as const;

const REQUIRED_SOCIALCRAWL_ALTERNATIVE_SNIPPETS = [
  '## Source-backed SocialCrawl scope',
  'unified social media data API for developers and AI agents',
  'the docs introduction says 21 platforms and 108 endpoints, while the pricing page says 27 platforms and 133 APIs',
  '`engagement_rate`, `language`, `content_category`, and `estimated_reach`',
  'requests use the `x-api-key` header',
  '`401 MISSING_API_KEY` or `401 INVALID_API_KEY`',
  'accounts can keep up to 5 active keys',
  'credit-based pay-as-you-go billing with a 50 concurrent request ceiling per credential',
  'Standard requests cost 1 credit across 84 endpoints, Advanced requests cost 5 credits across 18 endpoints, and Premium requests cost 10 credits across 6 endpoints',
  '`success`, `platform`, `endpoint`, `data`, `credits_used`, `credits_remaining`, `request_id`, and `cached`',
  'List endpoints return `items`, optional `next_cursor`, and optional `total`',
  'cache hits cost 0 credits',
  '`GET /v1/credits/balance` costs 0 credits',
  'idempotent replays deduct 0 new credits within a 24-hour TTL',
  'Free with 400 one-time credits, Starter with 2,500 credits for GBP 15, Growth with 20,000 credits for GBP 49, Pro with 150,000 credits for GBP 299',
  'publish `/llms.txt`, `/llms-full.txt`, OpenAPI JSON and YAML, plus per-platform llms files',
  'profile, user tweets, tweet detail, community detail, community tweets, video transcript, and AI-powered X search endpoints',
  '`socialcrawl_list_platforms`, `socialcrawl_list_endpoints`, `socialcrawl_request`, and `socialcrawl_get_docs`',
] as const;

const REQUIRED_HYPEFURY_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Hypefury scope',
  'Starter is USD 29/month and includes scheduling up to 1 month, 6 social accounts with 1 X account',
  '1 Auto-DM tweet per week with a 100 DMs/day limit',
  'Creator is USD 65/month and includes scheduling up to 3 months, 30 social accounts with 5 X accounts',
  'Business is USD 97/month with 60 social accounts, 10 X accounts, 300 Auto-DMs/day',
  'Agency is USD 199/month with 90 social accounts, 15 X accounts, 400 Auto-DMs/day',
  'Hypefury no longer offers a free plan, but offers a 7-day trial on Starter',
  'Instagram, Facebook Pages, LinkedIn, Threads, and TikTok',
  'creating content once, scheduling it, and distributing it to other social channels',
  'inspiration from 15+ hand-curated niches, 30+ tweet templates, and recurrent posting plans',
  'DMs run in batches every 30 minutes, campaigns last 3 days',
  'edited tweets can break Auto DM because the tweet ID changes, and DM recipients must follow the account',
  'Validate REST, SDK, webhook, and MCP handoff needs before buying.',
] as const;

const REQUIRED_ANTWORK_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Antwork scope',
  'social media infrastructure that connects AI agents and workflows to social platforms for scheduling, publishing, and analytics',
  'LinkedIn, X, Instagram, Facebook, YouTube, TikTok, Threads, and Pinterest',
  'Claude Code, Claude Desktop, Cursor, ChatGPT, VS Code, Windsurf, Gemini CLI, OpenClaw, and JetBrains',
  '`https://api.antwork.io/mcp`',
  'setup uses OAuth in the browser',
  'connecting at least one social account',
  'letting Antwork learn brand voice from existing content',
  '`create_post`, `get_performance`, `get_brand_dna`, `list_social_accounts`, `schedule_post`, and `get_optimal_posting_times`',
  'brand DNA extraction, AI content generation, 30+ post campaign generation, smart scheduling, media library, team collaboration, and analytics',
  'Free plan at USD 0/month with 2 social accounts, 20 posts/month, 5 AI images/month, brand DNA and voice, and all MCP tools',
  'Solo is USD 19/month with 5 social accounts, 100 posts/month, 50 AI images/month, 5 AI videos/month, brand DNA and voice, and all MCP tools',
  'Grow is USD 49/month with 15 social accounts, no listed post-count cap, 200 AI images/month, 20 AI videos/month, brand DNA and voice, and all MCP tools',
  'Scale is USD 99/month with 50 social accounts, no listed post-count cap, 500 AI images/month, 50 AI videos/month, brand DNA and voice, all MCP tools, and priority support',
  'Price by plan, social-account count, monthly post allowance, AI image allowance, and AI video allowance',
  'Antwork exposes MCP tools through `https://api.antwork.io/mcp` with OAuth setup',
  'Search tweets and follower exports cost 1 credit/result, with CSV, JSON, XLSX, Markdown, API, SDK, and MCP handoff options.',
] as const;

const REQUIRED_CHIRRAPP_ALTERNATIVE_SNIPPETS = [
  '## Source-backed ChirrApp scope',
  'write and schedule Twitter threads in a distraction-free editor',
  'drafts, schedule, history, analytics, reply to a tweet, numbering, media upload, split text, tips, and focus controls',
  'repurpose blog content with auto-split, save and share drafts of tweets and threads, add images, videos, and GIFs',
  'cross-post to LinkedIn and Mastodon',
  'connect multiple accounts',
  'split it into 280-character tweets',
  'preview the thread before publishing',
  'import article text with the browser extension',
  'autosave drafts',
  'schedule at a specific date and time, add content to a fixed queue, share next, or pick a scheduled slot',
  'queues default to 9 am, noon, and 4 pm and can be adjusted by day',
  'add up to 4 images to each tweet',
  'add a GIF or video, quote tweets, add emojis, and automatically number new tweets in a thread',
  'published threads can be cross-posted to LinkedIn, but LinkedIn scheduling is not currently supported there',
  'offers LinkedIn cross-posts but not Instagram or Facebook cross-posts',
  'analytics can show a heatmap of when content gets engagement',
  'show scheduled content in queue/week/month views',
  'organize drafts with stars and folders',
  'loop saved tweets or threads through an evergreen content pool',
  'does not expose stable plan prices in public text',
  'Validate ChirrApp paid scheduling, team, account, analytics, and API availability at checkout before buying.',
  'Price by scheduling access, thread length, media limits, draft workflow, and connected accounts.',
  'Search tweets and follower exports cost 1 credit/result, with CSV, JSON, XLSX, Markdown, API, SDK, and MCP handoff options.',
] as const;

const REQUIRED_BLACK_MAGIC_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Black Magic scope',
  'Twitter analytics, engagement growth, Twitter CRM, and scheduling plus publishing',
  'browser extensions for Chrome, Firefox, and Safari plus iOS and Android apps',
  'tracks tweet performance over time',
  'compares tweets against account averages',
  'tracks consistency, followers, engagements, and reports why a tweet takes off',
  'sync Twitter Lists',
  'track whether a person liked, retweeted, or replied to previous tweets',
  'write private notes, set reminders for DMs or follow-up, see past interactions',
  'schedule tweets and threads',
  'daily or weekly email reports, tweet performance reports, record-breaking tweets, new notable followers, and account summaries',
  'prices are in USD, subscriptions are tied to one Twitter account',
  'Personal at USD 16.25/month with USD 195 billed annually',
  'Professional at USD 32.41/month with USD 389 billed annually',
  'Business at USD 124.91/month with USD 1499 billed annually',
  'Professional includes engagement tracking, active followers tracking, real-time tweet metrics, engagement heatmap, tweet replies search, quick reply, schedule tweets, schedule threads',
  'Business adds priority support, data export, and custom setup plus reports',
  'extra Twitter accounts are not included in Personal',
  'Professional lists additional accounts at USD 19.99/month per account or USD 179.91 annually',
  'Business lists additional accounts at USD 69.99/month per account or USD 629.91 annually',
  'Personal does not list schedule tweets or schedule threads; Professional and Business include them.',
  'Search tweets and follower exports cost 1 credit/result, with CSV, JSON, XLSX, Markdown, API, SDK, and MCP handoff options.',
] as const;

const REQUIRED_TWEETSTREAM_ALTERNATIVE_SNIPPETS = [
  '## Source-backed TweetStream scope',
  'Twitter WebSocket API for crypto traders that streams structured JSON for tracked accounts',
  'track accounts with keyword filters',
  'OCR text, detected crypto assets, live prices, and Polymarket detection',
  'Basic annual plan at USD 139/month billed annually with 3 WebSocket connections and 50 monitored X/Twitter accounts',
  'Elite annual plan at USD 349/month billed annually with 10 WebSocket connections and 250 monitored accounts',
  'monthly Basic pricing from USD 199/month and Elite pricing at USD 499/month',
  '`wss://ws.tweetstream.io/ws`, protocol `tweetstream.v1`, and an auth subprotocol',
  'Bearer auth headers and query parameters are accepted',
  '`v`, `t`, `op`, `ts`, and `d`',
  '`tweet`, `account`, or `control`',
  '`content`, `meta`, `update`, `delete`, `profile_update`, `follow`, `auth_ping`, `auth_pong`, and `twitter_handles_result`',
  'tweet events send a `content` message first, optional `update` messages, and a `meta` message when enrichment is ready',
  '`tweetId`, `text`, `createdAt`, `author`, optional `link`, optional `media`, and optional `ref`',
  'profile updates and follow notifications',
  'avatar, banner, bio, handle, location, and name',
  'OCR text and detected crypto assets, centralized-exchange markets, and prediction markets',
  '`tweetId`, `body`, `time`, `receivedTime`, `link`, `messageType`, `twitterHandle`, `twitterId`, `content`, and optional `meta`',
] as const;

const REQUIRED_TWEET_HUNTER_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Tweet Hunter scope',
  'all-in-one AI X tool for growing an audience and brand on X',
  'Discover is listed at USD 29/month under the visible offer and includes 1 X account, an over 12M viral tweets library',
  '3,000 Auto-DMs/month, auto-plug, auto-retweet, and complete X analytics',
  'Grow is listed at USD 49/month under the visible offer and includes 5 X accounts',
  '7,500 Auto-DMs/month, paid partnership labels on posts, daily AI-written tweets',
  'Enterprise is displayed at roughly USD 199/month in the visible offer',
  '15,000 Auto-DMs/month, ghostwriting mode, priority support, custom trained AI, smart AI reply generation',
  'Auto-DM can send a Direct Message based on likes, replies, or retweets',
  'Auto-DM works for the first 72 hours of a tweet',
  'checks new engagements every minute during the first 24 hours',
  'has a 500 DMs/tweet cap',
  'requires transparent wording that tells people they will receive a DM when they interact',
  'Search tweets and follower exports cost 1 credit/result, with CSV, JSON, XLSX, Markdown, API, SDK, and MCP handoff options.',
] as const;

const REQUIRED_TAPLIO_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Taplio scope',
  'all-in-one AI-powered tool to grow a brand on LinkedIn',
  'Starter is listed at USD 39/month or USD 32/month when billed yearly',
  '0 AI credits, 0 comment credits, 1-click post scheduling, 5M+ post ideas',
  'Growth is listed at USD 69/month or USD 49/month when billed yearly',
  '250 AI credits, 500 comment credits',
  'hook and post generation, repurposing viral posts or content, AI copilot writing',
  'Pro is listed at USD 199/month or USD 149/month when billed yearly',
  'no AI credit cap, no comment credit cap, no AI or comment cap',
  'dynamic 3M+ lead database, Auto-DM for likers and commenters, mass DMs to an audience, and automated connection requests',
  'saved posts, draft Kanban, post scheduling, monthly and daily schedules, analytics, writer collaboration, organization management, Zapier integration',
  '7-day free trial gives Pro access during the trial and then switches to the originally selected plan',
  'Taplio X Chrome extension brings Taplio into LinkedIn with instant stats, high-performing posts, trending content, and quick saves',
  'Use current Taplio plan limits when the job is LinkedIn content or lead engagement.',
] as const;

const REQUIRED_POSTWISE_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Postwise scope',
  'integrations for Twitter, LinkedIn, and Meta Threads',
  'Basic is listed at USD 37/month',
  '3 social accounts, 500 AI-generated posts/month, 3 months scheduling, 3 custom AI voices',
  'Boss is listed at USD 59/month',
  '5 social accounts, 1,000 AI-generated posts/month, 12 months scheduling',
  'The top visible plan is listed at USD 97/month',
  'no social-account cap, no AI-generated-post cap, no scheduling cap',
  'GhostWriter AI on all plans, Basic, Advanced, and Enterprise-grade analytics tiers',
  'annual subscriptions receive a 20% discount',
  'the 7-day trial converts to the selected plan',
  'AI content creation, scheduling across platforms, viral post repurposing, engagement tracking, and a multi-platform dashboard',
  'smart scheduling, analytics and insights, team collaboration, multi-account management, tweet threading, and retweet scheduling',
  'Confirm current limits at checkout because official pages expose more than one plan grid.',
] as const;

const REQUIRED_TRYPOST_ALTERNATIVE_SNIPPETS = [
  '## Source-backed TryPost scope',
  'one workspace includes all features and connects to all 10 social networks',
  'USD 16/month per workspace when billed annually, or USD 192/year',
  '20% yearly saving and a 7-day free trial',
  'all social networks, no listed scheduled-post cap, a visual content calendar, media library',
  'post preview for all networks, no listed team-member cap, and chat support',
  'Instagram, Facebook, LinkedIn personal and company pages, X (Twitter), TikTok, YouTube Shorts, Pinterest, Threads, Bluesky, and Mastodon',
  'each additional workspace is billed separately and gives 3 workspaces as USD 48/month',
  'cloud-hosted SaaS and self-hosted open-source software',
  'FSL-1.1-MIT, self-hosting is available at no cost',
  'scheduling and auto-publishing across multiple platforms, a drag-and-drop visual calendar',
  'REST API. They also list Build with AI for connecting AI assistants through MCP.',
  '## Connect a TryPost Schedule to Xquik Reads',
  'Do not treat a scheduler success state as engagement evidence.',
  '## Verify a Cloud or Self-Hosted TryPost Trial',
  'TryPost owns the editorial',
  'calendar and cross-network schedule.',
] as const;

const REQUIRED_XANGUARD_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Xanguard scope',
  'sub-second Twitter/X alerts for crypto',
  'Telegram, REST API, HMAC-signed webhooks, and WebSocket streaming on B2B plans',
  '14 REST API endpoints, 4 delivery channels, HMAC-SHA256 webhook signatures',
  'plans from USD 19/month paid in SOL',
  'keyword filters, mute rules, reply and repost exclusions, contract detection',
  '4 real-time modules in one connection: tweets, follows, profile changes, and community monitoring',
  'full untruncated text, media URLs, quoted tweet content, and contract address extraction',
  'wss://api.xanguard.tech/v1/dt/realtime/ws',
  'RT 25 at USD 49/month for 25 tracked accounts',
  'RT 100 at USD 149/month for 100 tracked accounts',
  'RT 500 at USD 499/month for 500 tracked accounts',
  'plans are payable with SOL and Telegram Stars',
] as const;

const REQUIRED_HOOTSUITE_ALTERNATIVE_SNIPPETS = [
  'schedule posts, review inboxes, analyze campaigns, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media management, publishing, engagement, listening, analytics, ads, and enterprise collaboration suite.',
  '## Source-backed Hootsuite scope',
  'Standard with up to 10 social accounts, unlimited post scheduling, recommended posting times, AI image and caption generation',
  'bulk scheduling for up to 350 posts, automatic message routing and tagging, 20 competitor benchmarks, report export, email, and scheduling',
  'analytics report exports as PDF, PPT, CSV, XLSX, and scheduled email',
  'custom approval workflows; task assignment; posting-time recommendations based on audience data',
  'Standard at USD 99 per user/month billed annually with 10 social accounts',
  'Advanced at USD 249 per user/month billed annually with no listed social-account cap',
  'Enterprise as contact pricing with a customized plan',
  '## Current cost checkpoint',
  'Standard starts at USD 99 per user/month billed annually with 10 social accounts.',
  'Advanced starts at USD 249 per user/month billed annually and has no listed social-account cap.',
  'Enterprise uses contact pricing with a customized plan, custom user access permissions, support, and services.',
  "Hootsuite's official pages describe social scheduling, AI content help, recommended posting times, bulk scheduling, calendar and list views, approval workflows, inboxes, saved replies, automated responses, automated routing, analytics exports, competitor benchmarks, listening, SSO, advanced inbox, compliance integration, chatbot, and Salesforce integration.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Hootsuite seats, social accounts, analytics, approvals, listening, and Enterprise add-ons',
  'Official Hootsuite platform',
  'Official Hootsuite plans',
  'Hootsuite publishing',
  'Hootsuite Enterprise',
] as const;

const REQUIRED_SPRINKLR_ALTERNATIVE_SNIPPETS = [
  'search tweets, export followers, monitor accounts or keywords, publish actions, send webhooks, and connect apps or agents',
  'Enterprise social media management, listening, publishing, engagement, analytics, advertising, care, and compliance suite.',
  '## Source-backed Sprinklr scope',
  "Sprinklr's official Social page describes publishing, engagement, listening, paid media, compliance, and analytics across 30+ channels",
  'content planning, a digital asset manager, an editorial calendar, an omnichannel publisher, an engagement dashboard, reporting and analytics, UGC management, granular access controls, custom approval workflows',
  'real-time listening across 30+ social and digital channels, visual brand mentions, sentiment analysis, emotion analysis, entity identification, text classification, competitor benchmarking, crisis alerts, report scheduling, and report exports',
  'REST JSON APIs, OAuth 2.0, a developer portal, Enterprise license requirements, pre-approved use cases, and extra enablement for Twitter Syndication, Case Compliance API, or Listening API',
  'request-demo motion for enterprise social management',
  'pre-approved use cases in the License Order Form',
  'OAuth authorization through the Sprinklr UI',
  '## Current access checkpoint',
  'Confirm Enterprise license scope, LOF use cases, developer portal setup, OAuth authorization, and approved data sets.',
  'Verify whether Twitter Syndication, Case Compliance API, or Listening API enablement is required.',
  'Sprinklr official pages describe publishing, engagement, listening, paid media, compliance, analytics, integrations, approval workflows, crisis workflows, reports, exports, and Enterprise API access.',
  'Official Sprinklr Social',
  'Sprinklr publishing',
  'Sprinklr social listening',
  'Sprinklr APIs',
] as const;

const REQUIRED_SPROUT_SOCIAL_ALTERNATIVE_SNIPPETS = [
  'plan posts, manage a Smart Inbox, analyze reports, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media management, publishing, engagement, analytics, listening, advocacy, influencer, and customer-care suite.',
  '## Source-backed Sprout Social scope',
  'Brand Keywords with keyword, hashtag, and location searches across X',
  'Optimal Send Times based on 16 weeks of audience data',
  'network, cross-network, paid, competitive, and internal reports',
  'Premium Analytics, Listening, Advocacy, Influencer Marketing, and Enterprise options',
  'Standard at USD 199 per seat/month with 5 social profiles',
  'Professional at USD 299 per seat/month with no listed social-profile cap',
  'Advanced at USD 399 per seat/month with the Sprout API and Helpdesk integrations',
  'Premium Analytics and Listening as individual add-ons on Standard and up',
  '## Current cost checkpoint',
  'Standard starts at USD 199 per seat/month with 5 social profiles.',
  'Professional starts at USD 299 per seat/month and has no listed social-profile cap.',
  'Advanced starts at USD 399 per seat/month and lists the Sprout API plus Helpdesk integrations.',
  "Sprout's official pages describe Smart Inbox, Brand Keywords for X, multi-profile publishing, approval workflows, analytics reports, listening, Premium Analytics, Advocacy, Influencer Marketing, Enterprise options, CRM integrations, and chatbots.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Sprout seats, social profiles, Premium Analytics, Listening, Advocacy, Influencer Marketing, and Enterprise scope',
  'Official Sprout Social features',
  'Official Sprout Social pricing',
  'Sprout Social publishing',
  'Sprout Social analytics',
] as const;

const REQUIRED_BUFFER_ALTERNATIVE_SNIPPETS = [
  'plan posts, schedule threads, manage comments, analyze posts, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media scheduling, publishing, analytics, community, and collaboration platform.',
  '## Source-backed Buffer scope',
  'Free plan for up to 3 channels with 10 scheduled posts per channel',
  '5,000-post fair-use cap per channel',
  'supported channels for Bluesky, Facebook, Google Business Profile, Instagram, LinkedIn, Mastodon, Pinterest, Threads, TikTok, X, and YouTube',
  'Community pages describe comment management across Instagram, Facebook, LinkedIn, Threads, Bluesky, X, TikTok, Google Business Profile, YouTube, and Mastodon',
  "Buffer's official pages describe supported channels, queues, calendars, channel-specific posts, threaded posts, AI Assistant, first-comment scheduling, hashtag manager, Community replies, notifications, filters, comment score, saved replies, AI replies, and approval workflows.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Buffer channels, scheduled-post volume, Community replies, analytics reports, approval workflows, and integrations',
  'Official Buffer publish',
  'Official Buffer community',
  'Buffer scheduling limits',
  'Buffer Community help',
] as const;

const REQUIRED_TYPEFULLY_ALTERNATIVE_SNIPPETS = [
  'write X threads, schedule posts, cross-post content, use AI writing help, inspect analytics, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Creator publishing, X thread scheduling, social scheduling, analytics, API, and MCP platform.',
  '## Source-backed Typefully scope',
  "Typefully's official X scheduling page describes AI writing help, X post and thread scheduling, natural-language scheduling, predefined time slots, content calendar, cross-posting to LinkedIn, Threads, Bluesky, and other platforms",
  'posting to X, LinkedIn, Threads, Bluesky, and Mastodon; media uploads for images, videos, GIFs, and PDFs; tags; social sets; draft comments; webhooks for draft created, published, scheduled, status changed, tags changed, and deleted events',
  'Natural Posting Times with up to 4 minutes of variation',
  'Auto-DM triggers for replies, retweets, or follows, 3 simultaneous Auto-DM campaigns, 30 DMs/minute, 100 DMs/hour, 500 DMs/day, 4-day Auto-DM duration',
  "Typefully's official pages describe AI writing, X thread scheduling, content calendars, saved slots, suggested times, cross-posting, X analytics, Auto-DMs, draft comments, social sets, media uploads, REST API, webhooks, MCP, and agent skills.",
  'draft IDs, social sets, media IDs, queue state, analytics fields, tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports',
  'Typefully connected accounts, collaboration, analytics, API access, MCP access, Auto-DMs, and cross-posting',
  'Official Typefully X scheduling',
  'Official Typefully API',
  'Official Typefully MCP',
  'Typefully scheduling help',
  'Typefully analytics help',
  'Typefully Auto-DM help',
] as const;

const REQUIRED_APIFY_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Apify scope',
  "Apify's official docs define Actors as serverless automation programs.",
  'structured JSON input',
  'Export table-like dataset',
  'rows as `json`, `jsonl`, `csv`, `html`, `xlsx`, `xml`, or `rss`.',
  '`/v2/store` lists public Actors',
  'Actor run events include created, succeeded, failed, aborted, timed out, and resurrected states.',
  'The public Xquik profile currently shows 2 Actors.',
  '`xquik/x-tweet-scraper`',
  '`xquik/x-follower-scraper`',
  '## Apify Actor Handoff',
  'Tweet rows with text, IDs, engagement metrics, author profiles, and media',
  '`GET /x/tweets/search`, `tweet_search_extractor`, pagination, 1-second monitors, signed webhooks, SDKs, or MCP',
  'User rows with profile fields and filter-ready metadata',
  '### Actor output contract to compare',
  '`xquik/x-tweet-scraper` can write tweet rows, engagement user rows,',
  '`resultType`, `sourceTweetId`,',
  '`xquik/x-follower-scraper` writes compact user rows by default.',
  'raw output modes for optional profile metadata',
  'Use Apify\'s max cost per run or API `maxTotalChargeUsd`',
  '`maxItems` only when you want a smaller row cap',
  '`resultType: "diagnostic"`',
  '`no-input`,',
  '`invalid-input`,',
  '`zero-output`',
  'https://api.apify.com/v2/store?username=xquik&limit=20&responseFormat=agent',
  'Store badges, ranking positions, user counts, and run totals change.',
  'Verify the current Xquik Apify profile or Store API before citing marketplace placement.',
  'account date window',
  '### Date-window tweet scraping on Apify',
  '`from:username since:2026-05-01 until:2026-05-02`',
  '`from`, `since`, `until`, `since_time`, and `until_time`',
  '`maxItems` still caps the run or each `searchTerms` entry.',
] as const;

const REQUIRED_X_API_ALTERNATIVE_SNIPPETS = [
  'Twitter API alternative',
  '## Source-backed X API scope',
  "X's official overview describes the X API as programmatic access to public conversation",
  'Bearer Token authentication tied to the developer App for reading public information',
  '`GET /2/tweets/search/recent`',
  '`GET /2/tweets/search/all`',
  'Recent search is available to all developers and supports up to 100 posts per request',
  '`GET /2/users/:id/followers`',
  '`POST /2/users/:id/following`',
  'read the next-page cursor from `meta`, send it on the following request',
  '24-hour UTC deduplication for billable resources',
  'post tweets',
  'send direct messages',
  'Owned Reads',
  'USD 0.001 per resource',
  'posts, bookmarks, followers, likes, lists',
  'Developer Console',
  '## Official X API Migration Map',
  'Use this map to move one API-backed workflow at a time.',
  '<Card title="Auth & Base URL" icon="key-round">',
  '`https://api.x.com/2`',
  '`https://xquik.com/api/v1`',
  'the `x-api-key` header',
  '<Card title="Search Posts" icon="search">',
  '`GET /2/tweets/search/recent` or `GET /2/tweets/search/all`',
  '`GET /api/v1/x/tweets/search?q={query}`',
  '<Card title="Tweet Lookup" icon="message-square">',
  '`GET /api/v1/x/tweets/{id}`',
  '`GET /api/v1/x/tweets?ids=...`',
  '<Card title="User Lookup" icon="user">',
  '`GET /api/v1/x/users/{id}`',
  'accepts a username or numeric user ID',
  '`GET /api/v1/x/users/batch?ids=...`',
  '<Card title="Timelines & Mentions" icon="list-tree">',
  '`GET /api/v1/x/users/{id}/tweets`',
  '`GET /api/v1/x/users/{id}/mentions`',
  '<Card title="Followers & Following" icon="users">',
  '`GET /api/v1/x/users/{id}/followers`',
  '`GET /api/v1/x/users/{id}/following`',
  '<Card title="Engagement Rows" icon="activity">',
  '`GET /api/v1/x/tweets/{id}/quotes`',
  '`GET /api/v1/x/tweets/{id}/retweeters`',
  '`GET /api/v1/x/tweets/{id}/favoriters`',
  '`GET /api/v1/x/tweets/{id}/replies`',
  '<Card title="Pagination & Exports" icon="shuffle">',
  '`meta.next_token`',
  '`pagination_token`',
  '`next_cursor`',
  '`cursor`',
  '`GET /api/v1/extractions/{id}/export`',
  '## Migration Checkpoint',
  '"migration": "official_x_api_to_xquik"',
  '"old_endpoint": "GET /2/users/:id/followers"',
  '"new_endpoint": "GET /api/v1/x/users/{id}/followers"',
  '"export_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=csv"',
] as const;

const REQUIRED_TWITTER_API_PRO_ALTERNATIVE_SNIPPETS = [
  'Twitter API Pro alternative',
  '## Source-backed Twitter API Pro scope',
  'X API v2 as the recommended API version for new projects',
  'Treat "Twitter API Pro" as a legacy comparison term',
  'programmatic access for reading posts, publishing content, managing users',
  'Bearer Token access for reading public data',
  'OAuth user-context access for posting, liking, following, and accessing DMs',
  '`GET /2/tweets/search/recent`',
  '`GET /2/tweets/search/all`',
  'Recent search supports up to 100 posts per request',
  'Owned Reads at USD 0.001 per resource',
  '24-hour UTC deduplication for billable resources',
  'read the next-page cursor from response metadata',
] as const;

const REQUIRED_AUDIENSE_ALTERNATIVE_SNIPPETS = [
  'audience intelligence, influencer discovery, tweet search, follower export, account or keyword monitoring, signed webhooks, API access, and agent handoff',
  '## Source-backed Audiense scope',
  "Audiense's official Insights page describes audience intelligence for customer insights, creative decisions, influencer discovery, consumer segments, cultural insights, affinities, demographics, interests, personas, advertising targeting, SEO and keyword research, content ideation, and influencer outreach.",
  'Its current public pricing page lists a Social Intelligence Insights monthly plan with 5 reports per month, an annual plan with 60 reports per year, onboarding, a dedicated account manager, and refresher trainings.',
  'Audiense official pages describe audience segments, cultural insights, affinities, demographics, interests, personas, influencer discovery, report exports, audience member XLS exports, influencer XLS exports, and targeting-pack downloads.',
  '## Audience & influencer handoff',
  'Use this section when the search intent is "Audiense alternative for influencer discovery", "X audience intelligence", "export X followers", or "turn X audiences into CRM data".',
  'Use Audiense influencer views, filters, affinity sorting, uniqueness sorting, and paid-plan XLS export.',
  'Use follower exports, tweet search, verified follower exports, and engagement fields to build your own scoring model.',
  'Audiense prioritizes influencer discovery. Xquik prioritizes data ownership and downstream automation.',
  'Use 1-second keyword monitors, tweet search exports, signed webhooks, and `GET /events` for stored records.',
  'Audiense pricing',
  'Audiense data sources',
  'Audiense report exports',
] as const;

const FORBIDDEN_APIFY_ALTERNATIVE_SNIPPETS = [
  ['During', 'this', 'update'].join(' '),
  ['Rising', 'star'].join(' '),
  ['rising', 'Star'].join(''),
  ['rank', '5'].join(' '),
  ['rank', '7'].join(' '),
  ['ranked', '5'].join(' '),
  ['ranked', '7'].join(' '),
  ['top', '20'].join(' '),
  ['top', '20'].join('-'),
] as const;

const FORBIDDEN_PUBLIC_APIFY_MARKETPLACE_SNIPPETS = [
  ['During', 'this', 'update'].join(' '),
  ['Rising', 'star'].join(' '),
  ['rising', 'Star'].join(''),
  ['Apify', 'Store', 'API', 'relevance', 'search'].join(' '),
  ['Store', 'rankings', 'change'].join(' '),
] as const;

const FORBIDDEN_STALE_CREDIT_COST_SNIPPETS = [
  [
    'Credits',
    'are',
    'deducted',
    'per',
    'API',
    'call',
    '(1-10',
    'credits',
  ].join(' '),
  ['Each', 'operation', 'costs', '1-10', 'credits'].join(' '),
  [
    'The',
    'API',
    'uses',
    'credit-based',
    'billing',
    '(1-10',
    'credits',
  ].join(' '),
  ['Extractions', 'consume', '1-10', 'credits', 'per', 'result'].join(' '),
] as const;

const FORBIDDEN_PUBLIC_CONFIDENTIALITY_WORDING = [
  ['GitHub', 'Trending'].join(' '),
  ['Google', 'Trends'].join(' '),
  ['Hacker', 'News'].join(' '),
  ['Trending', 'topics', 'and', 'news', 'aggregated', 'from', '7', 'sources'].join(' '),
  ['Trending', 'topics', 'and', 'news', 'from', '7', 'sources'].join(' '),
  'TrustMRR',
  [['browser', 'service'].join('-'), 'capacity'].join(' '),
  ['declared', 'proxy', 'region', 'was', 'unavailable'].join(' '),
  ['login', 'fell', 'back', 'to', 'a', 'single', 'US', 'consumer', 'device'].join(' '),
  ['one-time', 'US', 'browser', 'session'].join(' '),
  [['one', 'time'].join('-'), 'US', 'fallback'].join(' '),
  ['proxy', 'service'].join(' '),
  ['participant', 'session'].join(' '),
  ['session', 'reads', 'the', 'conversation'].join(' '),
  ['shared', 'read', 'pool'].join(' '),
  ['whose', 'session', 'reads'].join(' '),
] as const;

const EXPECTED_OPENAPI_OPERATION_COUNT = 128;

const FORBIDDEN_STALE_OPERATION_COUNT_SNIPPETS = [
  ['100+', 'REST', 'API', 'endpoints'].join(' '),
  ['100+', 'API', 'endpoints'].join(' '),
  ['100+', 'endpoints'].join(' '),
  ['118', 'REST', 'operations'].join(' '),
  ['118', 'REST', 'API', 'operations'].join(' '),
  ['118', 'REST', 'endpoints'].join(' '),
  ['118', 'API', 'endpoints'].join(' '),
  ['118', 'documented', 'operations'].join(' '),
  ['118', 'documented', 'REST', 'API', 'operations'].join(' '),
  ['118', 'endpoint', 'pages'].join(' '),
  ['123', 'REST', 'operations'].join(' '),
  ['123', 'REST', 'API', 'operations'].join(' '),
  ['123', 'REST', 'endpoints'].join(' '),
  ['123', 'documented', 'operations'].join(' '),
  ['123', 'documented', 'REST', 'operations'].join(' '),
  ['31', 'pay-per-use'].join(' '),
  ['31', 'read-only', 'endpoints'].join(' '),
  ['31', 'X-API', 'endpoints'].join(' '),
  ['31', 'MPP-eligible'].join(' '),
  ['31', 'pay-per-call'].join(' '),
  'full list of 31 endpoints',
  ['32', 'pay-per-use'].join(' '),
  ['32', 'read-only', 'endpoints'].join(' '),
  ['32', 'X-API', 'endpoints'].join(' '),
  ['32', 'MPP-eligible'].join(' '),
  ['32', 'pay-per-call'].join(' '),
  'full list of 32 endpoints',
] as const;

const MAX_LLMS_TXT_CHARS = 48_000;
// Keep the overview from absorbing another deep tutorial body; link to focused
// workflow and API pages for expanded examples instead.
const MAX_WORKFLOWS_OVERVIEW_CHARS = 20_000;

const REQUIRED_AGENT_DOCS_MARKDOWN_FALLBACK_CHECKS = [
  '  - llms-txt-size',
  '  - llms-txt-links-markdown',
  '  - llms-txt-directive-md',
  '  - llms-txt-directive-html',
  '  - markdown-url-support',
  '  - content-negotiation',
  '  - page-size-markdown',
  '  - markdown-content-parity',
] as const;

const REQUIRED_AGENT_DOCS_PAGE_SIZE_CHECKS = [
  '  - rendering-strategy',
  '  - page-size-html',
  '  - page-size-markdown',
  'content-start-position stays disabled until the bounded afdocs sample starts',
  'Keep the live CI crawl deterministic and bounded',
  '  maxConcurrency: 2',
  '  maxLinksToTest: 30',
  '  requestDelay: 100',
  '  requestTimeout: 10000',
  'llms-txt-directive-html stays enabled even when it warns on buried positions',
  'Treat that warning as generated HTML',
] as const;

const VAGUE_PUBLIC_POSITIONING = [
  ['X-specific', 'workflows'].join(' '),
  ['workflow', 'surface'].join(' '),
  ['operational', 'layer'].join(' '),
  ['high', 'tech'].join('-'),
] as const;

const FORBIDDEN_COMPARISON_POSITIONING = [
  ['Xquik is', 'strongest'].join(' '),
  ['Xquik is', 'stronger'].join(' '),
  ['Xquik is the', 'better fit'].join(' '),
  ['best', 'fit'].join(' '),
  ['X-specific', 'workflows'].join(' '),
  ['workflow', 'surface'].join(' '),
  ['operational', 'layer'].join(' '),
  ['high', 'tech'].join('-'),
] as const;

const CHICAGO_TITLE_LOWERCASE_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'nor',
  'of',
  'on',
  'or',
  'per',
  'the',
  'to',
  'via',
  'with',
]);

const FORBIDDEN_GENERIC_TITLE_PHRASES = [
  'api documentation',
  'api reference',
  'integration guide',
  'rest api reference',
] as const;

const FOCUSED_API_ROUTE_MIGRATIONS = [
  {
    source: '/api-reference/account/subscribe',
    destination: '/api-reference/account/subscription-checkout',
  },
  {
    source: '/api-reference/draws/list',
    destination: '/api-reference/draws/twitter-giveaway-history',
  },
  {
    source: '/api-reference/extractions/estimate',
    destination: '/api-reference/extractions/twitter-scraping-cost-estimator',
  },
  {
    source: '/api-reference/extractions/get',
    destination: '/api-reference/extractions/twitter-extraction-results',
  },
  {
    source: '/api-reference/extractions/list',
    destination: '/api-reference/extractions/twitter-scraping-job-history',
  },
  {
    source: '/api-reference/monitors/delete',
    destination: '/api-reference/monitors/delete-twitter-account-monitor',
  },
  {
    source: '/api-reference/monitors/get',
    destination: '/api-reference/monitors/twitter-account-monitor-status',
  },
] as const;

function listAlternativeFiles(): readonly string[] {
  return [
    'twitter-api-alternatives.mdx',
    ...readdirSync('alternatives')
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => `alternatives/${file}`),
  ].sort();
}

function listPublicMarkdownFiles(root = '.'): readonly string[] {
  const files: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'DOCS_QUALITY_POLL.md') {
      continue;
    }

    const path = root === '.' ? entry.name : join(root, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_PUBLIC_SCAN_DIRS.has(entry.name)) {
        files.push(...listPublicMarkdownFiles(path));
      }
      continue;
    }

    if (entry.isFile() && /\.(?:md|mdx)$/u.test(entry.name)) {
      files.push(path);
    }
  }

  return files.sort();
}

function collectReadmeDiscoveryFindings(): readonly DiscoveryFinding[] {
  const source = readFileSync('README.md', 'utf8');
  const findings: DiscoveryFinding[] = [];

  for (const snippet of REQUIRED_README_SNIPPETS) {
    if (!source.includes(snippet)) {
      findings.push({ issue: `README is missing "${snippet}".` });
    }
  }

  for (const phrase of VAGUE_PUBLIC_POSITIONING) {
    if (source.includes(phrase)) {
      findings.push({
        issue: `README contains vague positioning phrase "${phrase}".`,
      });
    }
  }

  for (const snippet of FORBIDDEN_README_SNIPPETS) {
    if (source.includes(snippet)) {
      findings.push({ issue: `README contains retired badge snippet "${snippet}".` });
    }
  }

  return findings;
}

function collectPublicApifyMarketplaceFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_PUBLIC_APIFY_MARKETPLACE_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown freezes volatile Apify marketplace claim "${snippet}".`,
        });
      }
    }
  }

  return findings;
}

function collectStaleCreditCostFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_STALE_CREDIT_COST_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown contains stale credit cost wording "${snippet}".`,
        });
      }
    }
  }

  return findings;
}

function sha256File(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function collectPublicConfidentialityWordingFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of [...listPublicMarkdownFiles(), 'openapi.yaml']) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_PUBLIC_CONFIDENTIALITY_WORDING) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public file contains deprecated confidentiality wording "${snippet}".`,
        });
      }
    }
  }

  return findings;
}

function collectStaleSearchTweetsQueryParamFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of [...listPublicMarkdownFiles(), 'openapi.yaml']) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_SEARCH_TWEETS_QUERY_PARAM_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public docs use stale Search Tweets query parameter "${snippet}". Use q for GET /x/tweets/search.`,
        });
      }
    }
  }

  return findings;
}

function getOpenApiOperationCount(): number {
  const openApi = readFileSync('openapi.yaml', 'utf8');
  return openApi.match(/^\s+operationId:/gmu)?.length ?? 0;
}

function collectStaleOperationCountFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_STALE_OPERATION_COUNT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown contains stale operation count "${snippet}".`,
        });
      }
    }
  }

  return findings;
}

function collectUnsupportedDmHistorySdkExampleFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_DM_HISTORY_SDK_EXAMPLE_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown contains unsupported DM history SDK/CLI example "${snippet}". Use raw REST until generated clients expose the required account query.`,
        });
      }
    }
  }

  return findings;
}

function collectPublicTweetMediaIdBoundaryFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_PUBLIC_TWEET_MEDIA_ID_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown tells tweet callers to use uploaded media IDs with POST /x/tweets: "${snippet}". Use public media URLs in media and reserve media_ids for one-item DMs.`,
        });
      }
    }
  }

  return findings;
}

function collectPublicDmReplyFieldExampleFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_PUBLIC_DM_REPLY_FIELD_EXAMPLES) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown shows an unsupported DM reply field example with "${snippet}". Leave reply_to_message_id unset for POST /x/dm/{userId}.`,
        });
      }
    }
  }

  return findings;
}

function collectStaleXAccountPublicContractFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of X_ACCOUNT_PUBLIC_CONTRACT_FILES) {
    const source = readFileSync(file, 'utf8');

    for (const snippet of FORBIDDEN_X_ACCOUNT_PUBLIC_CONTRACT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `X account public docs contain stale connection contract snippet "${snippet}".`,
        });
      }
    }
  }

  return findings;
}

function collectSnippetFindings(
  source: string,
  label: string,
  snippets: readonly string[],
): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const snippet of snippets) {
    if (!source.includes(snippet)) {
      findings.push({ issue: `${label} is missing "${snippet}".` });
    }
  }

  return findings;
}

function hasPaymentRequiredSection(source: string): boolean {
  return /^(?:### 402 Payment required|<Tab title="402 Payment required">)/imu.test(
    source,
  );
}

function collectComparisonPositioningFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listAlternativeFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const phrase of FORBIDDEN_COMPARISON_POSITIONING) {
      if (source.includes(phrase)) {
        findings.push({
          file,
          issue: `Comparison guide contains vague positioning phrase "${phrase}".`,
        });
      }
    }
  }

  return findings;
}

function collectAlternativesOverviewCardParagraphFindings(): readonly DiscoveryFinding[] {
  const source = readFileSync('twitter-api-alternatives.mdx', 'utf8');
  const findings: DiscoveryFinding[] = [];
  const cardPattern = /<Card title="([^"]+)"[^>]*>([\s\S]*?)<\/Card>/gu;

  for (const match of source.matchAll(cardPattern)) {
    const title = match[1] ?? 'untitled card';
    const body = match[2] ?? '';

    if (/\n\s*\n/u.test(body.trim())) {
      findings.push({
        issue: `Alternatives card "${title}" uses multiple paragraphs; keep card body text in one paragraph for Markdown/HTML parity.`,
      });
    }
  }

  return findings;
}

function collectRedundantApiTitleSuffixFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles('api-reference')) {
    const source = readFileSync(file, 'utf8');

    if (!source.includes('\napi:')) {
      continue;
    }

    const title = source.match(/^title:\s*"?(.*?)"?\s*$/mu)?.[1];

    if (title?.includes('REST API reference') === true) {
      findings.push({
        file,
        issue: `Endpoint title "${title}" uses a generic REST API reference suffix.`,
      });
    }

    if (/\s\|\s[^|]+ API$/u.test(title ?? '')) {
      findings.push({
        file,
        issue: `Endpoint title "${title}" adds a generic API keyword suffix.`,
      });
    }
  }

  return findings;
}

function collectGenericPublicTitleFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');
    const title = source.match(/^title:\s*"?(.*?)"?\s*$/mu)?.[1];

    if (title === undefined) {
      continue;
    }

    const normalizedTitle = title.toLocaleLowerCase('en');

    if (
      file.startsWith('alternatives/') &&
      normalizedTitle.endsWith(' alternative')
    ) {
      findings.push({
        file,
        issue: `Public title "${title}" needs a focused alternative intent.`,
      });
    }

    for (const phrase of FORBIDDEN_GENERIC_TITLE_PHRASES) {
      if (normalizedTitle.includes(phrase)) {
        findings.push({
          file,
          issue: `Public title "${title}" uses generic phrase "${phrase}".`,
        });
      }
    }
  }

  return findings;
}

function collectNonDescriptiveInternalAnchorFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(
      /\[(?:click here|go|here|learn more|read more)\]\(\/[^)]+\)/giu,
    )) {
      findings.push({
        file,
        issue: `Internal link "${match[0]}" needs descriptive anchor text.`,
      });
    }
  }

  return findings;
}

function collectFocusedApiRouteFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];
  const docsConfigSource = readFileSync('docs.json', 'utf8');
  const docsConfig = JSON.parse(docsConfigSource) as DocsConfig;
  const navigationSource = docsConfigSource.slice(
    docsConfigSource.indexOf('"navigation"'),
  );

  for (const route of FOCUSED_API_ROUTE_MIGRATIONS) {
    const sourcePath = route.source.slice(1);
    const destinationPath = route.destination.slice(1);

    if (existsSync(`${sourcePath}.mdx`)) {
      findings.push({
        file: `${sourcePath}.mdx`,
        issue: `Generic audited route "${route.source}" still has a public page.`,
      });
    }

    if (!existsSync(`${destinationPath}.mdx`)) {
      findings.push({
        file: `${destinationPath}.mdx`,
        issue: `Focused audited route "${route.destination}" needs a public page.`,
      });
    }

    if (navigationSource.includes(`"${sourcePath}"`)) {
      findings.push({
        file: 'docs.json',
        issue: `Navigation still publishes generic audited route "${route.source}".`,
      });
    }

    if (!navigationSource.includes(`"${destinationPath}"`)) {
      findings.push({
        file: 'docs.json',
        issue: `Navigation is missing focused audited route "${route.destination}".`,
      });
    }

    if (
      !docsConfig.redirects.some(
        (redirect) =>
          redirect.source === route.source &&
          redirect.destination === route.destination,
      )
    ) {
      findings.push({
        file: 'docs.json',
        issue: `Redirect "${route.source}" must preserve links to "${route.destination}".`,
      });
    }
  }

  return findings;
}

function collectEndpointChicagoTitleCaseFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles('api-reference')) {
    const source = readFileSync(file, 'utf8');

    if (!source.includes('\napi:')) {
      continue;
    }

    const title = source.match(/^title:\s*"?(.*?)"?\s*$/mu)?.[1];
    if (title === undefined) {
      continue;
    }

    const tokens = title.split(/\s+/u);
    for (const [index, token] of tokens.entries()) {
      const normalized = token.replace(/^[^A-Za-z0-9#]+|[^A-Za-z0-9#]+$/gu, '');
      if (
        normalized !== '' &&
        /^[a-z]/u.test(normalized) &&
        (index === 0 || !CHICAGO_TITLE_LOWERCASE_WORDS.has(normalized))
      ) {
        findings.push({
          file,
          issue: `Endpoint title "${title}" keeps significant word "${normalized}" lowercase. Use Chicago Title Case for page headings.`,
        });
      }
    }
  }

  return findings;
}

describe('repository discovery', (): void => {
  it('keeps the public README concrete and easy to find from GitHub search', (): void => {
    expect.assertions(1);

    expect(collectReadmeDiscoveryFindings()).toStrictEqual([]);
  });

  it('keeps public REST operation counts aligned with OpenAPI', (): void => {
    expect.assertions(2);

    expect(getOpenApiOperationCount()).toBe(EXPECTED_OPENAPI_OPERATION_COUNT);
    expect(collectStaleOperationCountFindings()).toStrictEqual([]);
  });

  it('keeps endpoint titles free of redundant API suffixes', (): void => {
    expect.assertions(1);

    expect(collectRedundantApiTitleSuffixFindings()).toStrictEqual([]);
  });

  it('keeps public titles focused instead of generic', (): void => {
    expect.assertions(1);

    expect(collectGenericPublicTitleFindings()).toStrictEqual([]);
  });

  it('keeps internal anchor text descriptive', (): void => {
    expect.assertions(1);

    expect(collectNonDescriptiveInternalAnchorFindings()).toStrictEqual([]);
  });

  it('uses download commands instead of page links for OpenAPI JSON', (): void => {
    expect.assertions(1);

    expect(
      ['sdks/typescript.mdx', 'sdks/python.mdx', 'sdks/go.mdx'].flatMap(
        (file): readonly DiscoveryFinding[] => {
          const source = readFileSync(file, 'utf8');

          return source.includes(
            'Download the OpenAPI schema: `curl -o openapi.json https://xquik.com/openapi.json`',
          ) &&
            !source.includes(
              '[OpenAPI JSON](https://xquik.com/openapi.json)',
            )
            ? []
            : [
                {
                  file,
                  issue: 'OpenAPI JSON needs an explicit download command.',
                },
              ];
        },
      ),
    ).toStrictEqual([]);
  });

  it('keeps audited API routes focused and preserves old links', (): void => {
    expect.assertions(1);

    expect(collectFocusedApiRouteFindings()).toStrictEqual([]);
  });

  it('keeps endpoint titles in Chicago Title Case', (): void => {
    expect.assertions(1);

    expect(collectEndpointChicagoTitleCaseFindings()).toStrictEqual([]);
  });

  it('keeps public confidentiality wording generic and product-approved', (): void => {
    expect.assertions(1);

    expect(collectPublicConfidentialityWordingFindings()).toStrictEqual([]);
  });

  it('keeps public agent entry points visible to docs crawlers', (): void => {
    expect.assertions(1);

    const introduction = readFileSync('index.mdx', 'utf8');
    const llms = readFileSync('llms.txt', 'utf8');

    expect([
      ...collectSnippetFindings(
        introduction,
        'Introduction',
        REQUIRED_INTRODUCTION_SNIPPETS,
      ),
      ...collectSnippetFindings(llms, 'llms.txt', REQUIRED_LLMS_SNIPPETS),
    ]).toStrictEqual([]);
  });

  it('keeps introduction radar copy public-safe', (): void => {
    expect.assertions(1);

    const introduction = readFileSync('index.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          introduction,
          'Introduction public radar copy',
          ["Free trending topics and news from Xquik's own infrastructure."],
        ),
        ...FORBIDDEN_INTRODUCTION_CONFIDENTIALITY_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            introduction.includes(snippet)
              ? [
                  {
                    issue: `Introduction contains private radar source wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps agent-docs checks covering generated HTML size and markdown fallbacks', (): void => {
    expect.assertions(2);

    const config = readFileSync('agent-docs.config.yml', 'utf8');

    expect(
      collectSnippetFindings(
        config,
        'Agent docs markdown fallback checks',
        REQUIRED_AGENT_DOCS_MARKDOWN_FALLBACK_CHECKS,
      ),
    ).toStrictEqual([]);
    expect(
      collectSnippetFindings(
        config,
        'Agent docs page-size checks',
        REQUIRED_AGENT_DOCS_PAGE_SIZE_CHECKS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the public skill rate limits scan-friendly and source-backed', (): void => {
    expect.assertions(1);

    const skill = readFileSync('skill.md', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          skill,
          'Public skill rate limits',
          REQUIRED_SKILL_RATE_LIMIT_SNIPPETS,
        ),
        ...FORBIDDEN_SKILL_RATE_LIMIT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            skill.includes(snippet)
              ? [
                  {
                    issue: `Public skill rate limits contain table snippet "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps public read rate limits aligned with product source truth', (): void => {
    expect.assertions(1);

    const findings = PUBLIC_READ_RATE_LIMIT_EXPECTATIONS.flatMap(
      ({ file, forbidden, required }): readonly DiscoveryFinding[] => {
        const source = readFileSync(file, 'utf8');

        return [
          ...collectSnippetFindings(source, file, required),
          ...forbidden.flatMap(
            (snippet): readonly DiscoveryFinding[] =>
              source.includes(snippet)
                ? [
                    {
                      file,
                      issue: `Public read rate limits contain stale snippet "${snippet}".`,
                    },
                  ]
                : [],
          ),
        ];
      },
    );

    expect(findings).toStrictEqual([]);
  });

  it('keeps the public skill decision guidance scan-friendly', (): void => {
    expect.assertions(1);

    const skill = readFileSync('skill.md', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          skill,
          'Public skill decision guidance',
          REQUIRED_SKILL_DECISION_GUIDANCE_SNIPPETS,
        ),
        ...FORBIDDEN_SKILL_DECISION_GUIDANCE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            skill.includes(snippet)
              ? [
                  {
                    issue: `Public skill decision guidance contains table snippet "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the public skill clear about direct message handoffs', (): void => {
    expect.assertions(1);

    const skill = readFileSync('skill.md', 'utf8');

    expect(
      collectSnippetFindings(
        skill,
        'Public skill direct message handoff',
        REQUIRED_SKILL_DIRECT_MESSAGE_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the public skill clear about Docs MCP vs API MCP', (): void => {
    expect.assertions(1);

    const skill = readFileSync('skill.md', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          skill,
          'Public skill MCP handoff',
          REQUIRED_SKILL_MCP_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_SKILL_MCP_HANDOFF_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            skill.includes(snippet)
              ? [
                  {
                    issue: `Public skill MCP handoff contains stale single-server wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the public skill clear of private radar source names', (): void => {
    expect.assertions(1);

    const skill = readFileSync('skill.md', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          skill,
          'Public skill confidentiality wording',
          REQUIRED_SKILL_CONFIDENTIALITY_SNIPPETS,
        ),
        ...(FORBIDDEN_SKILL_CONFIDENTIALITY_PATTERN.test(skill)
          ? [
              {
                issue:
                  'Public skill confidentiality wording contains a private radar source list.',
              },
            ]
          : []),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the quickstart concrete and aligned with monitor response fields', (): void => {
    expect.assertions(2);

    const quickstart = readFileSync('x-api-quickstart.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        quickstart,
        'Quickstart',
        REQUIRED_QUICKSTART_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_QUICKSTART_SECRET_LOG_SNIPPETS.filter((snippet) =>
        quickstart.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the SDK overview useful for choosing SDK, CLI, and MCP handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'SDK overview docs',
          REQUIRED_SDK_OVERVIEW_SNIPPETS,
        ),
        ...FORBIDDEN_SDK_OVERVIEW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    label: 'SDK overview docs',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the TypeScript SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/typescript.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(19_050);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'TypeScript SDK workflow docs',
          REQUIRED_TYPESCRIPT_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_TYPESCRIPT_SDK_RAW_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    label: 'TypeScript SDK workflow docs',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Go SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/go.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(20_100);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Go SDK workflow docs',
          REQUIRED_GO_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_GO_SDK_WEAK_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Go SDK workflow docs contain weak search output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Python SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/python.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(20_400);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Python SDK workflow docs',
          REQUIRED_PYTHON_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_PYTHON_SDK_RAW_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    label: 'Python SDK workflow docs',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Ruby SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/ruby.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(17_950);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Ruby SDK workflow docs',
          REQUIRED_RUBY_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_RUBY_SDK_WEAK_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    label: 'Ruby SDK workflow docs',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the CLI SDK page useful for tweet search, follower export, and replies handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/cli.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(18_950);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'CLI SDK workflow docs',
          REQUIRED_CLI_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_CLI_SDK_WORKFLOW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `CLI SDK workflow docs contain unsupported generated CLI flag "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the C# SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/csharp-x-api-sdk.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(23_100);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'C# SDK workflow docs',
          REQUIRED_CSHARP_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_CSHARP_SDK_WEAK_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `C# SDK workflow docs contain weak search output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the PHP SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/php.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(20_150);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'PHP SDK workflow docs',
          REQUIRED_PHP_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_PHP_SDK_WEAK_SEARCH_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    label: 'PHP SDK workflow docs',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Java SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/java.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(27_500);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Java SDK workflow docs',
          REQUIRED_JAVA_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_JAVA_SDK_WEAK_SEARCH_SNIPPETS.flatMap((snippet) =>
          source.includes(snippet)
            ? [`Java SDK workflow docs still contains weak snippet: ${snippet}`]
            : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Kotlin SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('sdks/kotlin.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(25_800);

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Kotlin SDK workflow docs',
          REQUIRED_KOTLIN_SDK_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_KOTLIN_SDK_WEAK_SEARCH_SNIPPETS.flatMap((snippet) =>
          source.includes(snippet)
            ? [
                `Kotlin SDK workflow docs still contains weak snippet: ${snippet}`,
              ]
            : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps tweet search cursor loops separate from bounded limit pulls', (): void => {
    expect.assertions(1);

    const findings = listPublicMarkdownFiles().flatMap((file): readonly DiscoveryFinding[] => {
      const source = readFileSync(file, 'utf8');

      return FORBIDDEN_TWEET_SEARCH_CURSOR_LIMIT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  file,
                  issue: `Public Markdown contains stale tweet search pagination wording "${snippet}". Keep simple cursor loops separate from bounded limit resumes.`,
                },
              ]
            : [],
      );
    });

    expect(findings).toStrictEqual([]);
  });

  it('keeps authored tweet search date-window docs aligned with route behavior', (): void => {
    expect.assertions(1);

    const findings = listPublicMarkdownFiles().flatMap((file): readonly DiscoveryFinding[] => {
      const source = readFileSync(file, 'utf8');

      return FORBIDDEN_TWEET_SEARCH_DATE_WINDOW_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  file,
                  issue: `Public Markdown contains stale tweet search date-window wording "${snippet}". Date params stay on search as operators until product OpenAPI says otherwise.`,
                },
              ]
            : [],
      );
    });

    expect(findings).toStrictEqual([]);
  });

  it('keeps public tweet media docs on public URLs, not uploaded IDs', (): void => {
    expect.assertions(1);

    expect(collectPublicTweetMediaIdBoundaryFindings()).toStrictEqual([]);
  });

  it('keeps public DM docs from showing unsupported reply field examples', (): void => {
    expect.assertions(1);

    expect(collectPublicDmReplyFieldExampleFindings()).toStrictEqual([]);
  });

  it('keeps the Terraform provider page useful for monitor webhook handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/terraform.mdx', 'utf8');
    const forbiddenFindings =
      FORBIDDEN_TERRAFORM_PROVIDER_WORKFLOW_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Terraform provider workflow docs contains unsupported state handoff "${snippet}".`,
                },
              ]
            : [],
      );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Terraform provider workflow docs',
          REQUIRED_TERRAFORM_PROVIDER_WORKFLOW_SNIPPETS,
        ),
        ...forbiddenFindings,
      ],
    ).toStrictEqual([]);
  });

  it('keeps llms.txt below the agent score size threshold with headroom', (): void => {
    expect.assertions(1);

    const llms = readFileSync('llms.txt', 'utf8');

    expect(llms.length).toBeLessThanOrEqual(MAX_LLMS_TXT_CHARS);
  });

  it('keeps llms.txt runtime contracts current', (): void => {
    expect.assertions(1);

    const llms = readFileSync('llms.txt', 'utf8');
    const findings = collectSnippetFindings(
      llms,
      'llms.txt runtime contracts',
      REQUIRED_LLMS_RUNTIME_CONTRACT_SNIPPETS,
    );

    for (const snippet of FORBIDDEN_LLMS_RUNTIME_CONTRACT_SNIPPETS) {
      if (llms.includes(snippet)) {
        findings.push({
          issue: `llms.txt contains stale runtime wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps MCP response-contract docs aligned with product behavior', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('mcp/overview.mdx', 'utf8'),
      readFileSync('mcp/tools.mdx', 'utf8'),
      readFileSync('guides/x-api-typescript-types.mdx', 'utf8'),
    ].join('\n');
    const findings: DiscoveryFinding[] = [];

    for (const snippet of REQUIRED_MCP_CONTRACT_SNIPPETS) {
      if (!source.includes(snippet)) {
        findings.push({ issue: `MCP contract docs are missing "${snippet}".` });
      }
    }

    for (const snippet of FORBIDDEN_MCP_CONTRACT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `MCP contract docs contain stale wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps OAuth agent discovery docs aligned with product metadata', (): void => {
    expect.assertions(1);

    const source = readFileSync('oauth/overview.mdx', 'utf8');
    const findings = collectSnippetFindings(
      source,
      'OAuth agent discovery docs',
      REQUIRED_OAUTH_AGENT_DISCOVERY_SNIPPETS,
    );

    for (const snippet of FORBIDDEN_OAUTH_AGENT_DISCOVERY_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `OAuth agent discovery docs contain stale wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps MCP client setup aligned with current vendor flows', (): void => {
    expect.assertions(1);

    const source = readFileSync('mcp/overview.mdx', 'utf8');
    const findings = collectSnippetFindings(
      source,
      'MCP client setup',
      REQUIRED_CURRENT_MCP_CLIENT_SETUP_SNIPPETS,
    );
    const geminiStart = source.indexOf('<Tab title="Gemini CLI">');
    const geminiEnd = source.indexOf('<Tab title="Cline">', geminiStart);
    const geminiSource = source.slice(geminiStart, geminiEnd);

    if (geminiStart < 0 || geminiEnd < 0) {
      findings.push({ issue: 'MCP client setup is missing the Gemini CLI tab.' });
    } else if (
      !geminiSource.includes('"httpUrl": "https://xquik.com/mcp"') ||
      geminiSource.includes('"type": "http"') ||
      geminiSource.includes('"url": "https://xquik.com/mcp"')
    ) {
      findings.push({
        issue: 'Gemini CLI setup must use httpUrl for Streamable HTTP.',
      });
    }

    for (const snippet of FORBIDDEN_CURRENT_MCP_CLIENT_SETUP_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `MCP client setup contains stale or nonportable wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps the Codex and Goose OAuth issuer regressions discoverable before API MCP authentication', (): void => {
    expect.assertions(1);

    const findings = CODEX_OAUTH_GUIDANCE_FILES.flatMap(
      (file): readonly DiscoveryFinding[] => {
        const source = readFileSync(file, 'utf8');
        const required: string[] = [
          CODEX_OAUTH_ISSUER_ERROR,
          CODEX_OAUTH_UPSTREAM_ISSUE,
        ];

        if (file !== 'guides/troubleshooting.mdx') {
          required.push(CODEX_OAUTH_TROUBLESHOOTING_ANCHOR);
        }

        return collectSnippetFindings(source, file, required);
      },
    );

    for (const file of GOOSE_OAUTH_GUIDANCE_FILES) {
      const source = readFileSync(file, 'utf8');
      const required = ['Goose', CODEX_OAUTH_ISSUER_ERROR];

      if (file !== 'guides/troubleshooting.mdx') {
        required.push(CODEX_OAUTH_TROUBLESHOOTING_ANCHOR);
      }

      findings.push(
        ...collectSnippetFindings(source, file, required),
      );
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps MCP example prompts scan-friendly and stable for hydration', (): void => {
    expect.assertions(1);

    const overview = readFileSync('mcp/overview.mdx', 'utf8');
    const examplePromptsStart = overview.indexOf('## Example prompts');
    const frameworkGuidesStart = overview.indexOf('## Framework guides');
    const source = overview.slice(examplePromptsStart, frameworkGuidesStart);
    const findings: DiscoveryFinding[] = [
      ...collectSnippetFindings(
        source,
        'MCP example prompts',
        REQUIRED_MCP_EXAMPLE_PROMPT_SNIPPETS,
      ),
    ];

    for (const match of source.matchAll(/(?<!`)https:\/\/[^\s`]+/g)) {
      findings.push({
        issue: `MCP example prompt URL is not inline code: "${match[0]}".`,
      });
    }

    for (const snippet of FORBIDDEN_MCP_EXAMPLE_PROMPT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `MCP example prompts contain hydration-risk wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps the MCP setup callout simple for stable hydration', (): void => {
    expect.assertions(1);

    const overview = readFileSync('mcp/overview.mdx', 'utf8');
    const mcpVsRestStart = overview.indexOf('## MCP vs REST API');
    const setupStart = overview.indexOf('## Setup');
    const source = overview.slice(mcpVsRestStart, setupStart);
    const findings: DiscoveryFinding[] = [
      ...collectSnippetFindings(
        source,
        'MCP setup callout',
        REQUIRED_MCP_SETUP_CALLOUT_SNIPPETS,
      ),
    ];

    for (const snippet of FORBIDDEN_MCP_SETUP_CALLOUT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `MCP setup callout contains hydration-risk wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps MCP setup tab groups small for stable hydration', (): void => {
    expect.assertions(1);

    const overview = readFileSync('mcp/overview.mdx', 'utf8');
    const setupStart = overview.indexOf('## Setup');
    const chatGptStart = overview.indexOf('### ChatGPT');
    const source = overview.slice(setupStart, chatGptStart);
    const findings: DiscoveryFinding[] = [
      ...collectSnippetFindings(
        source,
        'MCP setup tabs',
        REQUIRED_MCP_SETUP_TAB_SNIPPETS,
      ),
    ];
    const tabGroups = source.split('<Tabs>').slice(1);

    for (const group of tabGroups) {
      const beforeEnd = group.slice(0, group.indexOf('</Tabs>'));
      const tabCount = beforeEnd.match(/<Tab title=/g)?.length ?? 0;

      if (tabCount > 4) {
        findings.push({
          issue: `MCP setup tab group has ${tabCount} tabs; split it into smaller groups.`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps the Docs MCP page scoped to read-only documentation search', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('mcp/docs-mcp.mdx', 'utf8'),
      readFileSync('docs.json', 'utf8'),
    ].join('\n');
    const findings: DiscoveryFinding[] = [
      ...collectSnippetFindings(
        source,
        'Docs MCP server page',
        REQUIRED_DOCS_MCP_SERVER_SNIPPETS,
      ),
    ];

    for (const snippet of FORBIDDEN_DOCS_MCP_SERVER_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `Docs MCP server page contains stale scope wording "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps the Agent MCP handoff page route-specific and source-backed', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('mcp/agent-handoff.mdx', 'utf8'),
      readFileSync('docs.json', 'utf8'),
      readFileSync('llms.txt', 'utf8'),
    ].join('\n');

    expect(
      collectSnippetFindings(
        source,
        'Agent MCP handoff page',
        REQUIRED_AGENT_MCP_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps troubleshooting clear about Docs MCP vs API MCP', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/troubleshooting.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Troubleshooting MCP handoff',
          REQUIRED_TROUBLESHOOTING_MCP_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_TROUBLESHOOTING_MCP_HANDOFF_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Troubleshooting MCP handoff contains stale single-server wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps billing recovery steps concrete for 402 failures', (): void => {
    expect.assertions(2);

    const billing = readFileSync('guides/billing.mdx', 'utf8');

    expect(billing.length).toBeLessThanOrEqual(18_950);

    expect(
      [
        ...collectSnippetFindings(
          billing,
          'Billing guide',
          REQUIRED_BILLING_RECOVERY_SNIPPETS,
        ),
        ...collectSnippetFindings(
          billing,
          'Billing guide',
          REQUIRED_BILLING_MONITOR_SNIPPETS,
        ),
        ...collectSnippetFindings(
          billing,
          'Billing guide',
          REQUIRED_BILLING_CARRYOVER_SNIPPETS,
        ),
        ...collectSnippetFindings(
          billing,
          'Billing guide',
          REQUIRED_BILLING_MPP_SNIPPETS,
        ),
        ...FORBIDDEN_BILLING_CARRYOVER_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            billing.includes(snippet)
              ? [
                  {
                    issue: `Billing guide contains stale carry-over wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the guest wallet boundary and settlement invariant explicit', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/guest-wallets.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Guest wallet guide',
        REQUIRED_GUEST_WALLET_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps guest wallet creation secrets out of example output', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/guest-wallets/create.mdx',
      'utf8',
    );

    expect([
      ...collectSnippetFindings(
        source,
        'Create guest wallet docs',
        REQUIRED_GUEST_WALLET_CREATE_SECURITY_SNIPPETS,
      ),
      ...FORBIDDEN_GUEST_WALLET_CREATE_LOG_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Create guest wallet docs can print the guest key with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps guest paid reads separate from direct MPP operations', (): void => {
    expect.assertions(1);

    expect(
      PAID_READ_REFERENCE_PAGES.flatMap((file): readonly DiscoveryFinding[] => {
        const source = readFileSync(file, 'utf8');
        return [
          ...collectSnippetFindings(
            source,
            file,
            REQUIRED_PAID_READ_REFERENCE_SNIPPETS,
          ),
          ...(!hasPaymentRequiredSection(source)
            ? [{ issue: `${file} is missing its 402 response section.` }]
            : []),
          ...collectSnippetFindings(
            source,
            file,
            DIRECT_MPP_REFERENCE_PAGES.has(file)
              ? REQUIRED_DIRECT_MPP_REFERENCE_SNIPPETS
              : REQUIRED_GUEST_ONLY_REFERENCE_SNIPPETS,
          ),
        ];
      }),
    ).toStrictEqual([]);
  });

  it('keeps glossary credit carry-over aligned with billing behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/glossary.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Glossary credit carry-over',
          REQUIRED_GLOSSARY_CREDIT_CARRYOVER_SNIPPETS,
        ),
        ...FORBIDDEN_GLOSSARY_CREDIT_CARRYOVER_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Glossary credit carry-over contains stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps glossary API key links aligned with dashboard routing', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/glossary.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Glossary API key dashboard link',
        REQUIRED_GLOSSARY_API_KEY_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the X API glossary concrete and source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/glossary.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'X API glossary',
          REQUIRED_X_API_GLOSSARY_SNIPPETS,
        ),
        ...FORBIDDEN_X_API_GLOSSARY_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `X API glossary contains stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps account usage fields aligned with monitor billing behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/account/get.mdx', 'utf8');

    expect(
      collectSnippetFindings(source, 'Account API docs', REQUIRED_ACCOUNT_API_SNIPPETS),
    ).toStrictEqual([]);
  });

  it('keeps authentication account checks aligned with monitor billing behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/authentication.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Authentication account check docs',
          REQUIRED_AUTHENTICATION_ACCOUNT_SNIPPETS,
        ),
        ...FORBIDDEN_AUTHENTICATION_ACCOUNT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Authentication docs contain stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps quick top-up examples aligned with PAYG credit conversion', (): void => {
    expect.assertions(1);

    const quickTopupPage = stripGeneratedResponseExamples(
      readFileSync(CREDITS_QUICK_TOPUP_PAGE, 'utf8'),
    );
    const billing = readFileSync('guides/billing.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          quickTopupPage,
          'Quick top-up API docs',
          REQUIRED_QUICK_TOPUP_PAGE_SNIPPETS,
        ),
        ...FORBIDDEN_TOPUP_EXAMPLE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            quickTopupPage.includes(snippet) || billing.includes(snippet)
              ? [
                  {
                    issue: `Credit top-up docs contain stale example value ${snippet}.`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_QUICK_TOPUP_CLIENT_SECRET_LOG_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            quickTopupPage.includes(snippet)
              ? [
                  {
                    issue: `Quick top-up API docs can print a payment client secret with "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps create API key examples from logging the one-time full key', (): void => {
    expect.assertions(1);

    const createApiKeyPage = readFileSync(API_KEYS_CREATE_PAGE, 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          createApiKeyPage,
          'Create API key docs',
          REQUIRED_API_KEYS_CREATE_PAGE_SNIPPETS,
        ),
        ...FORBIDDEN_API_KEYS_CREATE_LOG_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            createApiKeyPage.includes(snippet)
              ? [
                  {
                    issue: `Create API key docs can print the one-time fullKey with "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the X API integration checklist concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'guides/x-api-integration-checklist.mdx',
      'utf8',
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'X API integration checklist',
          REQUIRED_X_API_INTEGRATION_CHECKLIST_SNIPPETS,
        ),
        ...FORBIDDEN_API_OVERVIEW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `X API integration checklist contains stale read-service wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps public Search Tweets links on the q query parameter', (): void => {
    expect.assertions(1);

    expect(collectStaleSearchTweetsQueryParamFindings()).toStrictEqual([]);
  });

  it('keeps rate-limit troubleshooting aligned with fixed-window behavior', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('guides/troubleshooting.mdx', 'utf8'),
      readFileSync('guides/rate-limits.mdx', 'utf8'),
    ].join('\n');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Rate-limit troubleshooting docs',
          REQUIRED_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS,
        ),
        ...FORBIDDEN_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Rate-limit troubleshooting docs contain stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Twitter API rate-limit guide source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/rate-limits.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Twitter API rate-limit guide',
          REQUIRED_TWITTER_RATE_LIMIT_GUIDE_SNIPPETS,
        ),
        ...FORBIDDEN_TWITTER_RATE_LIMIT_GUIDE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Twitter API rate-limit guide contains stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps troubleshooting recovery handoffs source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/troubleshooting.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Troubleshooting recovery handoffs',
        REQUIRED_TROUBLESHOOTING_RECOVERY_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps mobile guide content constrained to the viewport', (): void => {
    expect.assertions(1);

    const source = readFileSync('custom.css', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Custom CSS mobile viewport guard',
        REQUIRED_CUSTOM_CSS_MOBILE_VIEWPORT_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps write confirmation recovery current in error handling', (): void => {
    expect.assertions(2);

    const errorHandlingSource = readFileSync('guides/error-handling.mdx', 'utf8');
    const source = [
      errorHandlingSource,
      readFileSync('guides/troubleshooting.mdx', 'utf8'),
    ].join('\n');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Error handling guide',
          REQUIRED_ERROR_HANDLING_WRITE_STATUS_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Service error guide wording',
          REQUIRED_SERVICE_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Validation error guide wording',
          REQUIRED_VALIDATION_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Authentication error guide wording',
          REQUIRED_AUTHENTICATION_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Billing error guide wording',
          REQUIRED_BILLING_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Permission error guide wording',
          REQUIRED_PERMISSION_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Not found error guide wording',
          REQUIRED_NOT_FOUND_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Conflict error guide wording',
          REQUIRED_CONFLICT_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Rate limit error guide wording',
          REQUIRED_RATE_LIMIT_ERROR_GUIDE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          source,
          'Write validation error guide wording',
          REQUIRED_WRITE_VALIDATION_ERROR_GUIDE_SNIPPETS,
        ),
        ...FORBIDDEN_ERROR_HANDLING_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Error handling guide contains stale recovery wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
    expect(errorHandlingSource.length).toBeLessThanOrEqual(23_000);
  });

  it('keeps follower export CRM handoff steps concrete', (): void => {
    expect.assertions(4);

    const source = readFileSync('guides/follower-export-crm.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Follower export CRM guide',
        REQUIRED_CRM_EXPORT_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('console.log(job.id, job.status);');
    expect(source).not.toContain('console.log(JSON.stringify(row));');
    expect(source).not.toContain('const followers = await response.json();');
  });

  it('keeps tweet replies export workflow steps concrete', (): void => {
    expect.assertions(4);

    const source = readFileSync('guides/tweet-replies-export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet replies export guide',
        REQUIRED_TWEET_REPLIES_EXPORT_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('console.log(data);');
    expect(source).not.toContain('print(data)');
    expect(source).not.toContain('console.log(JSON.stringify(row));');
  });

  it('keeps the tweet replies API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/tweet-replies.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet replies endpoint page',
        REQUIRED_TWEET_REPLIES_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_TWEET_REPLIES_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Tweet replies API page prints raw reply data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the tweet quotes API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/tweet-quotes.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet quotes endpoint page',
        REQUIRED_TWEET_QUOTES_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_TWEET_QUOTES_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Tweet quotes API page prints raw quote data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the get tweet API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/get-tweet.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Get tweet endpoint page',
        REQUIRED_GET_TWEET_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_GET_TWEET_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Get tweet API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the get user API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/twitter-profile-lookup.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Get user endpoint page',
        REQUIRED_GET_USER_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_GET_USER_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Get user API page prints raw profile data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the notifications API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/notifications.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Notifications endpoint page',
        REQUIRED_NOTIFICATIONS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_NOTIFICATIONS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Notifications API page prints raw notification data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the X trends API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/trends.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'X trends endpoint page',
        REQUIRED_X_TRENDS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_X_TRENDS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `X trends API page prints raw trend data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the trends API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/trends/list.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Trends API page',
        REQUIRED_TRENDS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_TRENDS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Trends API page prints raw trend data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the get article API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/get-article.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Get article endpoint page',
        REQUIRED_GET_ARTICLE_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_GET_ARTICLE_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Get article API page prints raw article data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the tweet thread API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/tweet-thread.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet thread endpoint page',
        REQUIRED_TWEET_THREAD_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_TWEET_THREAD_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Tweet thread API page prints raw thread data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the retweeters API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/retweeters.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Retweeters endpoint page',
        REQUIRED_RETWEETERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_RETWEETERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Retweeters API page prints raw retweeter data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the favoriters API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/favoriters.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Favoriters endpoint page',
        REQUIRED_FAVORITERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_FAVORITERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Favoriters API page prints raw liker data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the community info API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/community-info.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Community info endpoint page',
        REQUIRED_COMMUNITY_INFO_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_INFO_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community info API page prints raw community data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the community members API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x/community-members.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Community members endpoint page',
        REQUIRED_COMMUNITY_MEMBERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_MEMBERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community members API page prints raw member data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the community moderators API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x/community-moderators.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Community moderators endpoint page',
        REQUIRED_COMMUNITY_MODERATORS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_MODERATORS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community moderators API page prints raw moderator data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the community tweets API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x/community-tweets.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Community tweets endpoint page',
        REQUIRED_COMMUNITY_TWEETS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_TWEETS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community tweets API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the community search API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/community-search.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Community search API page',
        REQUIRED_COMMUNITY_SEARCH_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_SEARCH_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community search API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the followers API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/followers.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Followers API page',
        REQUIRED_FOLLOWERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Followers API page prints raw follower data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the following API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/following.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Following API page',
        REQUIRED_FOLLOWING_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_FOLLOWING_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Following API page prints raw following data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Check Follower page off the reverted relationship-row pattern', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/check-follower.mdx', 'utf8');

    expect(
      FORBIDDEN_CHECK_FOLLOWER_RENDER_RISK_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: [
                    `Check Follower API page reintroduces the reverted relationship-row snippet "${snippet}".`,
                    'Keep it raw until a render-safe pattern is proven.',
                  ].join(' '),
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Check Follower page campaign-audit focused', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/x/check-follower.mdx', 'utf8');

    expect(
      REQUIRED_CHECK_FOLLOWER_API_HANDOFF_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? []
            : [
                {
                  issue: `Check Follower API page is missing campaign-audit snippet "${snippet}".`,
                },
              ],
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_CHECK_FOLLOWER_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Check Follower API page prints raw follow-check data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the list followers API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/list-followers.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'List followers API page',
        REQUIRED_LIST_FOLLOWERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_LIST_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `List followers API page prints raw follower data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps the list members API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/list-members.mdx', 'utf8');
    const forbiddenRawOutputFindings =
      FORBIDDEN_LIST_MEMBERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `List members API page prints raw member data with "${snippet}".`,
                },
              ]
            : [],
      );

    expect([
      ...collectSnippetFindings(
        source,
        'List members API page',
        REQUIRED_LIST_MEMBERS_API_HANDOFF_SNIPPETS,
      ),
      ...forbiddenRawOutputFindings,
    ]).toStrictEqual([]);
  });

  it('keeps the list tweets API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/list-tweets.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'List tweets API page',
        REQUIRED_LIST_TWEETS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_LIST_TWEETS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `List tweets API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the batch users API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/batch-users.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Batch users API page',
        REQUIRED_BATCH_USERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_BATCH_USERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Batch users API page prints raw profile data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the batch tweets API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/batch-tweets.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Batch tweets API page',
        REQUIRED_BATCH_TWEETS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_BATCH_TWEETS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Batch tweets API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the bookmark folders API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/bookmark-folders.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Bookmark folders API page',
        REQUIRED_BOOKMARK_FOLDERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_BOOKMARK_FOLDERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Bookmark folders API page prints raw folder data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the search users API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/search-users.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Search users API page',
        REQUIRED_SEARCH_USERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_SEARCH_USERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Search users API page prints raw profile data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the user mentions API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/user-mentions.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'User mentions API page',
        REQUIRED_USER_MENTIONS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_USER_MENTIONS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `User mentions API page prints raw mention data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the verified followers API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/verified-followers.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Verified followers API page',
        REQUIRED_VERIFIED_FOLLOWERS_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_VERIFIED_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Verified followers API page prints raw follower data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the followers you know API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/followers-you-know.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Followers you know API page',
        REQUIRED_FOLLOWERS_YOU_KNOW_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_FOLLOWERS_YOU_KNOW_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Followers you know API page prints raw mutual follower data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps tweet search export workflow steps concrete', (): void => {
    expect.assertions(3);

    const source = readFileSync('guides/tweet-scraper-csv-export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet search export guide',
        REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain(
      'Omit `limit` for a\nsimple cursor-driven page loop.',
    );
    expect(sha256File('guides/tweet-scraper-csv-export.mdx')).toBe(
      TWEET_SEARCH_EXPORT_SEMRUSH_SHA256,
    );
  });

  it('keeps the search tweets API handoff concrete', (): void => {
    expect.assertions(2);

    const source = stripGeneratedResponseExamples(
      readFileSync('api-reference/x/search-tweets.mdx', 'utf8'),
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Search tweets endpoint page',
          REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_SEARCH_TWEETS_DIRECT_FILE_EXPORT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Search tweets endpoint page should distinguish direct JSON pages from saved file exports: "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
    expect(source.length).toBeLessThanOrEqual(19_000);
  });

  it('keeps tweet-list API result filters visible', (): void => {
    expect.assertions(1);

    const findings = TWEET_LIST_FILTER_API_PAGES.flatMap((file) =>
      collectSnippetFindings(
        readFileSync(file, 'utf8'),
        file,
        REQUIRED_TWEET_LIST_FILTER_SNIPPETS,
      ),
    );

    expect(findings).toStrictEqual([]);
  });

  it('keeps high-value API examples from dumping raw responses', (): void => {
    expect.assertions(1);

    const findings = HIGH_VALUE_ROW_HANDOFF_API_PAGES.flatMap(
      ({ file, label }) => {
        const source = readFileSync(file, 'utf8');

        return FORBIDDEN_HIGH_VALUE_ROW_HANDOFF_RAW_RESPONSE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    file,
                    issue: `${label} should map durable handoff rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        );
      },
    );

    expect(findings).toStrictEqual([]);
  });

  it('keeps the bookmarks API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/bookmarks.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Bookmarks endpoint page',
          REQUIRED_BOOKMARKS_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_BOOKMARKS_API_RAW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Bookmarks endpoint page should map bookmark rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the timeline API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/timeline.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Timeline endpoint page',
          REQUIRED_TIMELINE_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_TIMELINE_API_RAW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Timeline endpoint page should map timeline rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the user tweets API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/user-tweets.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'User tweets endpoint page',
          REQUIRED_USER_TWEETS_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_USER_TWEETS_API_RAW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `User tweets endpoint page should map timeline rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the user likes API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/user-likes.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'User likes endpoint page',
          REQUIRED_USER_LIKES_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_USER_LIKES_API_RAW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `User likes endpoint page should map liked tweet rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the user media API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/user-media.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'User media endpoint page',
          REQUIRED_USER_MEDIA_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_USER_MEDIA_API_RAW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `User media endpoint page should map media tweet rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the extraction workflow concrete for credits, JSON, and file handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync('guides/extraction-workflow.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Extraction workflow guide',
          REQUIRED_EXTRACTION_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_WORKFLOW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Extraction workflow guide contains stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
    expect(source.length).toBeLessThanOrEqual(27_500);
  });

  it('keeps response formats and exports source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/response-formats-exports.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Response formats and exports guide',
        REQUIRED_RESPONSE_FORMATS_EXPORTS_SNIPPETS,
      ),
      ...FORBIDDEN_RESPONSE_FORMATS_EXPORTS_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Response formats and exports guide contains stale or unsafe wording "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the get extraction page cursor-safe for JSON handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/extractions/twitter-extraction-results.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Get extraction cursor handoff',
          REQUIRED_EXTRACTION_GET_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_GET_HANDOFF_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Get extraction page contains stale single-page accumulation "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the list extractions page cursor-safe for job inventory handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/extractions/twitter-scraping-job-history.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'List extractions job inventory handoff',
          REQUIRED_EXTRACTION_LIST_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_LIST_HANDOFF_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `List extractions page contains stale single-page accumulation "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps trends WOEID regions mobile friendly', (): void => {
    expect.assertions(4);

    const trendPages = [
      {
        label: 'Trends guide',
        source: readFileSync('guides/trends.mdx', 'utf8'),
      },
      {
        label: 'Trends API page',
        source: readFileSync('api-reference/trends/list.mdx', 'utf8'),
      },
    ] as const;

    expect(
      trendPages.flatMap(
        ({ label, source }): readonly DiscoveryFinding[] => [
          ...collectSnippetFindings(
            source,
            label,
            REQUIRED_TRENDS_REGION_SNIPPETS,
          ),
          ...FORBIDDEN_TRENDS_REGION_SNIPPETS.flatMap(
            (snippet): readonly DiscoveryFinding[] =>
              source.includes(snippet)
                ? [
                    {
                      issue: `${label} contains stale regions table or cache wording "${snippet}".`,
                    },
                  ]
                : [],
          ),
        ],
      ),
    ).toStrictEqual([]);
    expect(
      collectSnippetFindings(
        trendPages[0].source,
        'Trends guide first viewport',
        REQUIRED_TRENDS_GUIDE_COPY_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(trendPages[0].source).toContain(
      'Results are cached briefly to keep responses fast.',
    );
    expect(trendPages[1].source).toContain('See supported regions below.');
  });

  it('keeps extraction export response formats mobile friendly', (): void => {
    expect.assertions(3);

    const source = readFileSync('api-reference/extractions/export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Extraction export API response',
        REQUIRED_EXTRACTION_EXPORT_RESPONSE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('| Format | Content-Type | Filename Example |');
    expect(source).not.toContain('const blob = await response.blob();');
  });

  it('keeps extraction create tool types grouped by required field', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/extractions/create.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Extraction create tool types',
          REQUIRED_EXTRACTION_CREATE_TOOL_TYPE_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_CREATE_TOOL_TYPE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Extraction create tool types contain stale table copy "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
    expect(source).not.toContain('|-----------|---------------|-------------|');
  });

  it('keeps extraction create response framed as a run receipt', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/extractions/create.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Extraction create run receipt',
          REQUIRED_EXTRACTION_CREATE_RECEIPT_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_CREATE_RECEIPT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Extraction create response should stay a receipt and not include result data "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps extraction estimate framed as a decision checkpoint', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/extractions/twitter-scraping-cost-estimator.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Extraction estimate decision handoff',
          REQUIRED_EXTRACTION_ESTIMATE_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_ESTIMATE_HANDOFF_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Extraction estimate should stay a decision checkpoint and not include job output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps draw export response formats mobile friendly', (): void => {
    expect.assertions(3);

    const source = readFileSync('api-reference/draws/export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Draw export API response',
        REQUIRED_DRAW_EXPORT_RESPONSE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_DRAW_EXPORT_RESPONSE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('| Format | Content-Type | Filename |');
  });

  it('keeps draw history distinct from winner detail and exports', (): void => {
    expect.assertions(2);

    const source = readFileSync(
      'api-reference/draws/twitter-giveaway-history.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Twitter giveaway history API',
        REQUIRED_DRAW_HISTORY_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_DRAW_HISTORY_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps draw detail focused on winner verification', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/draws/get.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Twitter giveaway winner API',
        REQUIRED_DRAW_DETAIL_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_DRAW_DETAIL_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps extraction export columns source-backed and mobile friendly', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/extractions/export.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Extraction export columns',
          REQUIRED_EXTRACTION_EXPORT_COLUMNS_SNIPPETS,
        ),
        ...FORBIDDEN_EXTRACTION_EXPORT_COLUMNS_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Extraction export columns contain stale table or column copy "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
    expect(source).not.toContain('|--------|-------------|');
  });

  it('keeps the media upload handoff clear for tweets and DMs', (): void => {
    expect.assertions(2);

    const source = readFileSync('guides/media-upload-workflow.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Media upload workflow guide',
        REQUIRED_MEDIA_UPLOAD_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_MEDIA_UPLOAD_WORKFLOW_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the upload media API handoff concrete', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/x-write/upload-media.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Upload media endpoint page',
        REQUIRED_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the download media API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/download-media.mdx', 'utf8');

    expect([
      ...collectSnippetFindings(
        source,
        'Download media API page',
        REQUIRED_DOWNLOAD_MEDIA_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_DOWNLOAD_MEDIA_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Download media API page prints raw media download data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
  });

  it('keeps the direct message workflow aligned with DM API behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/direct-message-workflow.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Direct message workflow guide',
          REQUIRED_DIRECT_MESSAGE_WORKFLOW_SNIPPETS,
        ),
        ...FORBIDDEN_DIRECT_MESSAGE_WORKFLOW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Direct message workflow guide contains unsupported text limit "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps DM history examples on raw REST until generated clients expose account query support', (): void => {
    expect.assertions(1);

    expect(collectUnsupportedDmHistorySdkExampleFindings()).toStrictEqual([]);
  });

  it('keeps the DM history API page aligned with participant-scoped reads', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/dm-history.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'DM history API docs',
          REQUIRED_DM_HISTORY_API_SNIPPETS,
        ),
        ...FORBIDDEN_DM_HISTORY_LOG_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `DM history API docs log private message bodies with "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps shared monitor types aligned with account and keyword monitor APIs', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/x-api-typescript-types.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Types guide monitor objects',
        REQUIRED_MONITOR_TYPES_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps shared event types aligned with account and keyword monitor events', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/x-api-typescript-types.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Types guide event object',
        REQUIRED_EVENT_TYPES_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the list events API page useful for event row handoff', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/events/list.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'List events API docs',
          REQUIRED_EVENT_LIST_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_EVENT_LIST_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `List events API docs print raw event responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the get event API page useful for detail row handoff', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/events/get.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Get event API docs',
          REQUIRED_EVENT_GET_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_EVENT_GET_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Get event API docs print raw event responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps shared draft types aligned with draft API formatting', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/x-api-typescript-types.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Types guide draft object',
        REQUIRED_DRAFT_TYPES_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the types guide from claiming complete schema coverage', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/x-api-typescript-types.mdx', 'utf8');

    expect(
      FORBIDDEN_TYPES_GUIDE_COMPLETENESS_OVERCLAIMS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Types guide overclaims schema coverage with "${snippet}".`,
                },
              ]
            : [],
      ),
    ).toStrictEqual([]);
  });

  it('keeps compose style response fields visible to API users', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('api-reference/compose/create.mdx', 'utf8'),
      readFileSync('guides/x-api-typescript-types.mdx', 'utf8'),
    ].join('\n');

    expect(
      collectSnippetFindings(
        source,
        'Compose API docs',
        REQUIRED_COMPOSE_STYLE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps webhook testing and verification examples runnable', (): void => {
    expect.assertions(1);

    const testing = readFileSync('guides/twitter-webhook-testing.mdx', 'utf8');
    const types = readFileSync('guides/x-api-typescript-types.mdx', 'utf8');
    const overview = readFileSync('webhooks/overview.mdx', 'utf8');
    const verification = readFileSync('webhooks/verification.mdx', 'utf8');
    const architecture = readFileSync('guides/architecture.mdx', 'utf8');
    const createWebhookApi = readFileSync(
      'api-reference/webhooks/create.mdx',
      'utf8',
    );
    const listWebhookApi = readFileSync(
      'api-reference/webhooks/list.mdx',
      'utf8',
    );
    const updateWebhookApi = readFileSync(
      'api-reference/webhooks/update.mdx',
      'utf8',
    );
    const deleteWebhookApi = readFileSync(
      'api-reference/webhooks/delete.mdx',
      'utf8',
    );
    const testWebhookApi = readFileSync(
      'api-reference/webhooks/test.mdx',
      'utf8',
    );
    const resumeWebhookApi = readFileSync(
      'api-reference/webhooks/resume.mdx',
      'utf8',
    );
    const deliveriesApi = readFileSync(
      'api-reference/webhooks/deliveries.mdx',
      'utf8',
    );

    expect(
      [
        ...collectSnippetFindings(
          createWebhookApi,
          'Create webhook API docs',
          REQUIRED_WEBHOOK_CREATE_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_CREATE_SECRET_LOG_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            createWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `Create webhook API docs can print the one-time webhook secret with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          listWebhookApi,
          'List webhook API docs',
          REQUIRED_WEBHOOK_LIST_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_LIST_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            listWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `List webhook API docs print raw webhook responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          updateWebhookApi,
          'Update webhook API docs',
          REQUIRED_WEBHOOK_UPDATE_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_UPDATE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            updateWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `Update webhook API docs print raw webhook responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          deleteWebhookApi,
          'Delete webhook API docs',
          REQUIRED_WEBHOOK_DELETE_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_DELETE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            deleteWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `Delete webhook API docs print raw delete responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          testWebhookApi,
          'Test webhook API docs',
          REQUIRED_WEBHOOK_TEST_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_TEST_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            testWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `Test webhook API docs print raw test responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          resumeWebhookApi,
          'Resume webhook API docs',
          REQUIRED_WEBHOOK_RESUME_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_RESUME_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            resumeWebhookApi.includes(snippet)
              ? [
                  {
                    issue: `Resume webhook API docs print raw resume responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          deliveriesApi,
          'Webhook deliveries API docs',
          REQUIRED_WEBHOOK_DELIVERIES_API_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_DELIVERIES_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            deliveriesApi.includes(snippet)
              ? [
                  {
                    issue: `Webhook deliveries API docs print raw delivery responses with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          overview,
          'Webhook overview',
          REQUIRED_WEBHOOK_OVERVIEW_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide webhook retries',
          REQUIRED_WEBHOOK_ARCHITECTURE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide components',
          REQUIRED_ARCHITECTURE_COMPONENT_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide authentication',
          REQUIRED_ARCHITECTURE_AUTHENTICATION_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide data isolation',
          REQUIRED_ARCHITECTURE_DATA_ISOLATION_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide rate limits',
          REQUIRED_ARCHITECTURE_RATE_LIMIT_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide usage billing',
          REQUIRED_ARCHITECTURE_BILLING_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide usage categories',
          REQUIRED_ARCHITECTURE_USAGE_SNIPPETS,
        ),
        ...collectSnippetFindings(
          architecture,
          'Architecture guide platform limitations',
          REQUIRED_ARCHITECTURE_LIMITATION_SNIPPETS,
        ),
        ...FORBIDDEN_ARCHITECTURE_COMPONENT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide components',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_AUTHENTICATION_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide authentication',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_DATA_ISOLATION_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide data isolation',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_RATE_LIMIT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide rate limits',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_BILLING_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide usage billing',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_USAGE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide usage categories',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WEBHOOK_ARCHITECTURE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    issue: `Architecture guide contains stale webhook architecture table wording "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ARCHITECTURE_LIMITATION_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide platform limitations',
                    snippet,
                  },
                ]
              : [],
        ),
        ...collectSnippetFindings(
          types,
          'Types guide webhook payload',
          REQUIRED_WEBHOOK_TYPES_SNIPPETS,
        ),
        ...collectSnippetFindings(
          testing,
          'Webhook testing guide',
          REQUIRED_WEBHOOK_TESTING_SNIPPETS,
        ),
        ...collectSnippetFindings(
          verification,
          'Webhook verification guide',
          REQUIRED_WEBHOOK_VERIFICATION_SNIPPETS,
        ),
        ...FORBIDDEN_WEBHOOK_VERIFICATION_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            verification.includes(snippet)
              ? [
                  {
                    issue: `Webhook verification guide references undefined helper "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WEBHOOK_ARCHITECTURE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            architecture.includes(snippet)
              ? [
                  {
                    label: 'Architecture guide webhook retries',
                    snippet,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WEBHOOK_OVERVIEW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            overview.includes(snippet)
              ? [
                  {
                    label: 'Webhook overview',
                    snippet,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the Send DM endpoint page clear about media attachments', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/x-write/send-dm.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Send DM endpoint docs',
        REQUIRED_SEND_DM_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_SEND_DM_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the create tweet API page useful for post and reply handoffs', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/create-tweet.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Create tweet API docs',
        REQUIRED_CREATE_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_CREATE_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the delete tweet API page safe for owned-post cleanup', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/delete-tweet.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Delete tweet API docs',
        REQUIRED_DELETE_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_DELETE_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the like tweet API page user-initiated and auditable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/like.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Like tweet API docs',
        REQUIRED_LIKE_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_LIKE_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the unlike tweet API page scoped and auditable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/unlike.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Unlike tweet API docs',
        REQUIRED_UNLIKE_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_UNLIKE_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the retweet API page focused and recoverable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/retweet.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Retweet API docs',
        REQUIRED_RETWEET_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_RETWEET_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the unretweet API page focused and recoverable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/unretweet.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Unretweet API docs',
        REQUIRED_UNRETWEET_TWEET_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_UNRETWEET_TWEET_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the follow API page focused and recoverable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/follow.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Follow API docs',
        REQUIRED_FOLLOW_TWITTER_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_FOLLOW_TWITTER_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the unfollow API page focused and recoverable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/unfollow.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Unfollow API docs',
        REQUIRED_UNFOLLOW_TWITTER_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_UNFOLLOW_TWITTER_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the remove follower API page specific and recoverable', (): void => {
    expect.assertions(2);

    const source = `${readFileSync(
      'api-reference/x-write/remove-follower.mdx',
      'utf8',
    )}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, 'utf8')}`;

    expect(
      collectSnippetFindings(
        source,
        'Remove Follower API docs',
        REQUIRED_REMOVE_FOLLOWER_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_REMOVE_FOLLOWER_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the write action status API page useful for queue handoffs', (): void => {
    expect.assertions(2);

    const source = readFileSync(
      'api-reference/x-write/get-write-action-status.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Get write action status API docs',
        REQUIRED_WRITE_ACTION_STATUS_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_WRITE_ACTION_STATUS_API_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the X accounts list API page clear about health states', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-accounts/list.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'List X accounts API docs',
        REQUIRED_X_ACCOUNTS_LIST_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps X account public docs aligned with the current connection contract', (): void => {
    expect.assertions(1);

    expect(collectStaleXAccountPublicContractFindings()).toStrictEqual([]);
  });

  it('keeps the connect X account API page clear about TOTP setup', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-accounts/connect.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Connect X account TOTP docs',
        REQUIRED_X_ACCOUNTS_CONNECT_TOTP_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the re-authenticate X account API page clear about TOTP setup', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-accounts/reauth.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Re-authenticate X account TOTP docs',
        REQUIRED_X_ACCOUNTS_REAUTH_TOTP_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the submit X account email code API page clear about the pending login handoff', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x-accounts/submit-challenge.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Submit X account email code pending login handoff',
        REQUIRED_X_ACCOUNTS_SUBMIT_CHALLENGE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the bulk retry X accounts API page clear about retry boundaries', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x-accounts/bulk-retry.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Bulk retry X accounts retry boundaries',
        REQUIRED_X_ACCOUNTS_BULK_RETRY_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the get X account API page clear about account state recovery', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-accounts/get.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Get X account state recovery',
        REQUIRED_X_ACCOUNTS_GET_STATE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the disconnect X account API page clear about removal effects', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x-accounts/disconnect.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Disconnect X account removal effects',
        REQUIRED_X_ACCOUNTS_DISCONNECT_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the workflows overview handoff matrix concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/workflows.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Workflows overview',
          REQUIRED_WORKFLOW_OVERVIEW_SNIPPETS,
        ),
        ...FORBIDDEN_WORKFLOW_SECRET_LOG_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Workflows guide logs the one-time webhook secret with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WORKFLOW_OVERVIEW_BLOAT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Workflows guide reintroduced duplicate deep tutorial content with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WORKFLOW_OVERVIEW_STALE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Workflows guide reintroduced stale pagination copy with "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_WORKFLOW_ENDPOINT_FINDER_TABLE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Workflows endpoint finder reintroduced a mobile-clipping table with "${snippet}". Use the bullet finder format instead.`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the campaign verification workflow source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'guides/campaign-verification-workflow.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Campaign verification workflow',
        REQUIRED_CAMPAIGN_VERIFICATION_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the target audience discovery workflow source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'guides/target-audience-discovery-workflow.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Target audience discovery workflow',
        REQUIRED_TARGET_AUDIENCE_DISCOVERY_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the brand monitoring workflow source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/brand-monitoring-workflow.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Brand monitoring workflow',
        REQUIRED_BRAND_MONITORING_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the no-code workflow handoff source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/no-code-workflow-handoff.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'No-code workflow handoff',
        REQUIRED_NO_CODE_WORKFLOW_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the tweet metadata field guide source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'guides/tweet-profile-api-fields.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Tweet metadata field guide',
        REQUIRED_TWEET_PROFILE_API_FIELDS_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the workflows overview within the generated HTML weight budget', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/workflows.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(MAX_WORKFLOWS_OVERVIEW_CHARS);
  });

  it('keeps request-efficient API usage source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/request-efficient-api-usage.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Request-efficient API usage guide',
          REQUIRED_REQUEST_EFFICIENT_API_USAGE_SNIPPETS,
        ),
        ...FORBIDDEN_REQUEST_EFFICIENT_API_USAGE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Request-efficient API usage guide contains stale wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor API handoff concrete', (): void => {
    expect.assertions(1);

    const source = stripGeneratedResponseExamples(
      readFileSync('api-reference/monitors/create-keyword.mdx', 'utf8'),
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Create keyword monitor endpoint page',
          REQUIRED_KEYWORD_MONITOR_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_INLINE_WEBHOOK_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Create keyword monitor endpoint page should link to webhook-specific signature docs instead of inlining "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_NESTED_QUOTED_KEYWORD_QUERY_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Create keyword monitor endpoint page should use a plain query example instead of nested quoted query "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_CREATE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Create keyword monitor endpoint page should map state rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor list API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/monitors/list-keywords.mdx',
      'utf8',
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'List keyword monitor API page',
          REQUIRED_KEYWORD_MONITOR_LIST_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_LIST_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `List keyword monitor API page should map inventory rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor get API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/monitors/get-keyword.mdx',
      'utf8',
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Get keyword monitor API page',
          REQUIRED_KEYWORD_MONITOR_GET_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_GET_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Get keyword monitor API page should map state snapshots instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor update API handoff concrete', (): void => {
    expect.assertions(1);

    const source = stripGeneratedResponseExamples(
      readFileSync('api-reference/monitors/update-keyword.mdx', 'utf8'),
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Update keyword monitor API page',
          REQUIRED_KEYWORD_MONITOR_UPDATE_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_NESTED_QUOTED_KEYWORD_QUERY_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Update keyword monitor API page should use a plain query example instead of nested quoted query "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_UPDATE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Update keyword monitor API page should map state rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor delete API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/monitors/delete-keyword.mdx',
      'utf8',
    );

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Delete keyword monitor API page',
          REQUIRED_KEYWORD_MONITOR_DELETE_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_MONITOR_DELETE_INLINE_SUCCESS_JSON_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Delete keyword monitor API page should keep inline card prose out of JSON shape "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_KEYWORD_MONITOR_DELETE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Delete keyword monitor API page should map deletion receipts instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_DELETE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Delete account monitor API page should map deletion receipts instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/create.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Create account monitor endpoint page',
          REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_CREATE_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Create account monitor API page should map state rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor get API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/twitter-account-monitor-status.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Get account monitor API page',
          REQUIRED_ACCOUNT_MONITOR_GET_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_GET_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Get account monitor API page should map state snapshots instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_GET_EVENT_TYPE_CLAIMS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Get account monitor API page must not claim unsupported ${snippet}.`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor list API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/list.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'List account monitor API page',
          REQUIRED_ACCOUNT_MONITOR_LIST_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_LIST_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `List account monitor API page should map inventory rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor update API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/update.mdx', 'utf8');
    const legacyImplementationWording = ['real-time', 'stream'].join(' ');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Update account monitor API page',
          REQUIRED_ACCOUNT_MONITOR_UPDATE_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_UPDATE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Update account monitor API page should map state rows instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...FORBIDDEN_ACCOUNT_MONITOR_UPDATE_FULL_EVENT_TYPE_EXAMPLES.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Update account monitor API page should keep examples short instead of repeating the full event type list "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...(source.includes(legacyImplementationWording)
          ? [
              {
                issue:
                  'Update account monitor API page should avoid legacy implementation wording.',
              },
            ]
          : []),
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor delete API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/delete-twitter-account-monitor.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Delete account monitor API page',
          REQUIRED_ACCOUNT_MONITOR_DELETE_API_HANDOFF_SNIPPETS,
        ),
        ...FORBIDDEN_MONITOR_DELETE_INLINE_SUCCESS_JSON_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Delete account monitor API page should keep inline card prose out of JSON shape "${snippet}".`,
                  },
                ]
              : [],
        ),
        ...(source.includes('-H "x-api-key: xq_YOUR_KEY_HERE" | jq\n')
          ? [
              {
                issue:
                  'Delete account monitor API page should map cURL output into a deletion receipt.',
              },
            ]
          : []),
        ...FORBIDDEN_ACCOUNT_MONITOR_DELETE_RAW_OUTPUT_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `Delete account monitor API page should map deletion receipts instead of raw response output "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
  });

  it('keeps Zapier comparison workflow details source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/zapier.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Zapier alternative',
        REQUIRED_ZAPIER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Zapier guide setup cards source-backed', (): void => {
    expect.assertions(6);

    const source = readFileSync('guides/zapier.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Zapier guide',
        REQUIRED_ZAPIER_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('| Surface | Initial scope |');
    expect(source).not.toContain('| Action | Method and path | Notes |');
    expect(source).not.toContain('| Test | Expected assertion |');
    expect(source).not.toContain(
      'Call `GET /x/tweets/search` with `q`; use `cursor` for page loops or `limit` for bounded pulls.',
    );
    expect(
      FORBIDDEN_ZAPIER_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps Pipedream comparison workflow details source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/pipedream.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Pipedream alternative',
        REQUIRED_PIPEDREAM_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Pipedream guide setup cards source-backed', (): void => {
    expect.assertions(6);

    const source = readFileSync('guides/pipedream.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Pipedream guide',
        REQUIRED_PIPEDREAM_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('| Surface | Initial scope |');
    expect(source).not.toContain('| Action | Method and path | Output |');
    expect(source).not.toContain('| Pipedream field | Xquik payload field |');
    expect(source).not.toContain('| Step | Pipedream component |');
    expect(source).not.toContain('| Test | Expected assertion |');
  });

  it('keeps the Prefect guide aligned with the current collection scope', (): void => {
    expect.assertions(6);

    const source = readFileSync('guides/prefect.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Prefect guide',
        REQUIRED_PREFECT_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('|');
    expect(source).not.toContain('https://api.xquik.com');
    expect(source).not.toContain('0.1.4');
    expect(source).not.toContain('Omit `limit` when passing a cursor.');
    expect(
      FORBIDDEN_PREFECT_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Haystack guide handoff concrete', (): void => {
    expect.assertions(5);

    const source = readFileSync('guides/haystack.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Haystack guide',
        REQUIRED_HAYSTACK_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('print(result["documents"])');
    expect(source).not.toContain('Store the raw Xquik response');
    expect(source).not.toContain('Store the entire MCP result');
    expect(
      FORBIDDEN_HAYSTACK_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Composio migration guide handoff concrete', (): void => {
    expect.assertions(6);

    const source = readFileSync('guides/composio-migration.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Composio migration guide',
        REQUIRED_COMPOSIO_MIGRATION_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('Pass the raw response to');
    expect(source).not.toContain('Store the entire MCP result');
    expect(source).not.toContain("Composio's deprecated Twitter MCP");
    expect(source).not.toContain('was decommissioned');
    expect(
      FORBIDDEN_COMPOSIO_MIGRATION_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Hermes Tweet guide aligned with the current plugin scope', (): void => {
    expect.assertions(5);

    const source = readFileSync('guides/hermes-tweet.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Hermes Tweet guide',
        REQUIRED_HERMES_TWEET_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('The current package version is `0.1.5`');
    expect(source).not.toContain('The current package version is `0.1.8`');
    expect(source).not.toContain('Hermes Tweet includes 100');
    expect(source).not.toContain('tweet_action` stays enabled');
  });

  it('keeps the TweetClaw guide aligned with the current plugin scope', (): void => {
    expect.assertions(4);

    const source = readFileSync('guides/tweetclaw.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'TweetClaw guide',
        REQUIRED_TWEETCLAW_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('@xquik/tweetclaw@1.6.37');
    expect(source).not.toContain('TweetClaw exposes 99 agent-callable');
    expect(source).not.toContain(
      'For tweets or replies, call `POST /api/v1/x/tweets` with uploaded media IDs',
    );
  });

  it('keeps the Microsoft Agent Framework guide handoff concrete', (): void => {
    expect.assertions(6);

    const source = readFileSync('guides/microsoft-agent-framework.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Microsoft Agent Framework guide',
        REQUIRED_MICROSOFT_AGENT_FRAMEWORK_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('Return raw data.');
    expect(source).not.toContain('print(response)');
    expect(source).not.toContain('print(result)');
    expect(source).not.toMatch(
      /\bChatAgent\b|model_id=|chat_client=|run_stream\(|tool_resources=|AzureOpenAIChatClient/u,
    );
    expect(
      FORBIDDEN_MICROSOFT_AGENT_FRAMEWORK_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Google ADK guide handoff concrete', (): void => {
    expect.assertions(3);

    const source = readFileSync('guides/google-adk.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Google ADK guide',
        REQUIRED_GOOGLE_ADK_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('Return raw data.');
    expect(source).not.toContain('print(part.text)');
  });

  it('keeps the CrewAI guide handoff concrete', (): void => {
    expect.assertions(5);

    const source = readFileSync('guides/crewai.mdx', 'utf8');

    expect(
      collectSnippetFindings(source, 'CrewAI guide', REQUIRED_CREWAI_GUIDE_SNIPPETS),
    ).toStrictEqual([]);
    expect(source).not.toContain('raw data');
    expect(source).not.toContain('Raw tweet data');
    expect(source).not.toContain('print(result)');
    expect(
      FORBIDDEN_CREWAI_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Pydantic AI guide handoff concrete', (): void => {
    expect.assertions(5);

    const source = readFileSync('guides/pydantic-ai.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Pydantic AI guide',
        REQUIRED_PYDANTIC_AI_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('print(result.output)');
    expect(source).not.toContain('print(result1.output)');
    expect(source).not.toContain('print(result2.output)');
    expect(
      FORBIDDEN_PYDANTIC_AI_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the LangChain guide handoff concrete', (): void => {
    expect.assertions(3);

    const source = readFileSync('guides/langchain.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'LangChain guide',
        REQUIRED_LANGCHAIN_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(
      FORBIDDEN_LANGCHAIN_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('print(');
  });

  it('keeps the Mastra guide handoff concrete', (): void => {
    expect.assertions(5);

    const source = readFileSync('guides/mastra.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Mastra guide',
        REQUIRED_MASTRA_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('console.log(result.text);');
    expect(source).not.toContain('process.stdout.write(chunk);');
    expect(source).not.toContain('Return raw data.');
    expect(
      FORBIDDEN_MASTRA_GUIDE_SNIPPETS.filter((snippet) =>
        source.includes(snippet),
      ),
    ).toStrictEqual([]);
  });

  it('keeps the alternatives workflow shortlist concrete', (): void => {
    expect.assertions(2);

    const source = readFileSync('twitter-api-alternatives.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Alternatives workflow shortlist',
        REQUIRED_WORKFLOW_SHORTLIST_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain(
      '| Tool | Use it for | Put Xquik behind it when |',
    );
  });

  it('keeps the n8n alternative focused on source-backed workflow handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/n8n.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'n8n alternative',
        REQUIRED_N8N_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the n8n guide response handling concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/n8n.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'n8n guide',
        REQUIRED_N8N_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Make guide app shape concrete', (): void => {
    expect.assertions(2);

    const source = readFileSync('guides/make.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Make guide',
        REQUIRED_MAKE_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain(
      'Add a separate bounded-pull variant that sends `limit` and omits `cursor`.',
    );
  });

  it('keeps the Make alternative focused on source-backed workflow handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/make.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Make alternative',
        REQUIRED_MAKE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the PhantomBuster alternative focused on no-code automation handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/phantombuster.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'PhantomBuster alternative',
        REQUIRED_PHANTOMBUSTER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the alternatives sector matrix concrete', (): void => {
    expect.assertions(3);

    const source = readFileSync('twitter-api-alternatives.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Alternatives sector matrix',
        REQUIRED_ALTERNATIVES_SECTOR_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain(
      '| Sector | Start with | Choose Xquik when | Output to test |',
    );
    expect(collectAlternativesOverviewCardParagraphFindings()).toStrictEqual([]);
  });

  it('keeps the Brandwatch alternative focused on concrete social listening handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/brandwatch.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Brandwatch alternative',
        REQUIRED_BRANDWATCH_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Meltwater alternative focused on concrete media monitoring handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/meltwater.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Meltwater alternative',
        REQUIRED_MELTWATER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Talkwalker alternative focused on concrete consumer intelligence handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/talkwalker.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Talkwalker alternative',
        REQUIRED_TALKWALKER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the TweetDeck alternative current for X Pro and monitor handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/tweetdeck.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'TweetDeck alternative',
        REQUIRED_TWEETDECK_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Zernio alternative current for social API handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/late.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Zernio alternative',
        REQUIRED_ZERNIO_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the twscrape alternative current for library handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/twscrape.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'twscrape alternative',
        REQUIRED_TWSCRAPE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Postproxy alternative current for publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/postproxy.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Postproxy alternative',
        REQUIRED_POSTPROXY_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Post Bridge alternative current for scheduler API handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/post-bridge.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Post Bridge alternative',
        REQUIRED_POST_BRIDGE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the SocialCrawl alternative current for social data API handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/socialcrawl.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'SocialCrawl alternative',
        REQUIRED_SOCIALCRAWL_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Outstand alternative current for social publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/outstand.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Outstand alternative',
        REQUIRED_OUTSTAND_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Hypefury alternative current for creator-publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/hypefury.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Hypefury alternative',
        REQUIRED_HYPEFURY_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Antwork alternative current for AI-agent publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/antwork.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Antwork alternative',
        REQUIRED_ANTWORK_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the ChirrApp alternative current for thread-publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/chirrapp.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'ChirrApp alternative',
        REQUIRED_CHIRRAPP_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Black Magic alternative current for creator CRM handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/black-magic.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Black Magic alternative',
        REQUIRED_BLACK_MAGIC_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the TweetStream alternative current for WebSocket alert handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/tweetstream.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'TweetStream alternative',
        REQUIRED_TWEETSTREAM_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Tweet Hunter alternative current for creator-growth handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/tweet-hunter.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet Hunter alternative',
        REQUIRED_TWEET_HUNTER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Taplio alternative current for LinkedIn handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/taplio.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Taplio alternative',
        REQUIRED_TAPLIO_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Postwise alternative current for creator-scheduling handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/postwise.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Postwise alternative',
        REQUIRED_POSTWISE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the TryPost alternative current for open-source scheduler handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/trypost.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'TryPost alternative',
        REQUIRED_TRYPOST_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Xanguard alternative current for crypto-alert handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/xanguard.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Xanguard alternative',
        REQUIRED_XANGUARD_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Hootsuite alternative focused on social-suite handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/hootsuite.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Hootsuite alternative',
        REQUIRED_HOOTSUITE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Sprinklr alternative focused on enterprise social handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/sprinklr.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Sprinklr alternative',
        REQUIRED_SPRINKLR_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Sprout Social alternative focused on social-care handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/sprout-social.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Sprout Social alternative',
        REQUIRED_SPROUT_SOCIAL_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Buffer alternative focused on social-scheduling handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/buffer.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Buffer alternative',
        REQUIRED_BUFFER_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Typefully alternative focused on creator-publishing handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/typefully.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Typefully alternative',
        REQUIRED_TYPEFULLY_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps Apify marketplace claims current without freezing rank signals', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/apify.mdx', 'utf8');
    const findings = [
      ...collectSnippetFindings(
        source,
        'Apify alternative',
        REQUIRED_APIFY_ALTERNATIVE_SNIPPETS,
      ),
    ];

    for (const snippet of FORBIDDEN_APIFY_ALTERNATIVE_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          issue: `Apify alternative freezes volatile marketplace claim "${snippet}".`,
        });
      }
    }

    expect(findings).toStrictEqual([]);
  });

  it('keeps the X API alternative aligned with current official pricing signals', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/x-api.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'X API alternative',
        REQUIRED_X_API_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Twitter API Pro alternative aligned with current official X API scope', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/twitter-api-pro.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Twitter API Pro alternative',
        REQUIRED_TWITTER_API_PRO_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Audiense alternative focused on audience intelligence handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/audiense.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Audiense alternative',
        REQUIRED_AUDIENSE_ALTERNATIVE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps volatile Apify marketplace claims out of public Markdown', (): void => {
    expect.assertions(1);

    expect(collectPublicApifyMarketplaceFindings()).toStrictEqual([]);
  });

  it('keeps public credit cost wording aligned with billing model', (): void => {
    expect.assertions(1);

    expect(collectStaleCreditCostFindings()).toStrictEqual([]);
  });

  it('keeps Xquik docs icon sources aligned with product icon policy', (): void => {
    expect.assertions(3);

    expect(sha256File('logo/x-only.svg')).toBe(DOCS_X_ONLY_ICON_SHA256);
    expect(sha256File('favicon.svg')).toBe(
      existsSync(PRODUCT_APP_ICON_FILE)
        ? sha256File(PRODUCT_APP_ICON_FILE)
        : '7b22cb7c5f5f9f154e1327210b7878e03e1028ef33857282701feb5fd5e96960',
    );
    expect(readFileSync('docs.json', 'utf8')).toContain(
      '"favicon": "/favicon.svg"',
    );
  });

  it('keeps comparison guides direct and value focused', (): void => {
    expect.assertions(1);

    expect(collectComparisonPositioningFindings()).toStrictEqual([]);
  });
});
