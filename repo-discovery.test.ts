import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface DiscoveryFinding {
  readonly file?: string;
  readonly issue: string;
}

const SKIPPED_PUBLIC_SCAN_DIRS = new Set([
  '.git',
  'node_modules',
  '.github',
] as const);

const CREDITS_QUICK_TOPUP_PAGE = 'api-reference/credits/quick-topup.mdx';
const API_KEYS_CREATE_PAGE = 'api-reference/api-keys/create.mdx';
const PRODUCT_APP_ICON_FILE = '/Users/burak/Developer/xquik/app/icon.svg';
const DOCS_X_ONLY_ICON_SHA256 =
  '7002c1dd82b5b903d69777fa212f39b0e0410cb156e7bcb1b4426fcec3a7cdc5';

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
  '# Xquik Docs - X API, Tweet Scraper & Automation Reference',
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
  'https://nothumansearch.ai/site/xquik.com',
  'https://nothumansearch.ai/badge/xquik.com.svg',
  'NHS Agentic Readiness Score',
  '[Quickstart](https://docs.xquik.com/quickstart)',
  '[API Reference](https://docs.xquik.com/api-reference)',
  'browse 120 OpenAPI-backed operations',
  '**REST API** - 120 operations',
  '[SDKs](https://docs.xquik.com/sdks)',
  '[Tweet search export](https://docs.xquik.com/guides/tweet-search-export)',
  'scrape tweets by keyword to CSV, JSON, or XLSX',
  '[Tweet replies export](https://docs.xquik.com/guides/tweet-replies-export)',
  'scrape replies to CSV, JSON, or XLSX',
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
  'X tweet scraper',
  'follower scraper',
  '[llms.txt](https://docs.xquik.com/llms.txt)',
  '## Use With AI Coding Agents',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[OpenAPI spec](https://docs.xquik.com/openapi.yaml)',
] as const;

const REQUIRED_INTRODUCTION_SNIPPETS = [
  'search tweets',
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
  '<Card title="C# / .NET" icon="hash" href="/sdks/csharp">',
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
  '[Go](/sdks/go)',
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
  'Cost: 10 credits text-only, plus 2 credits per started MB across attached media.',
  'Cost: 10 credits per media upload plus 10 credits per',
  'instant monitors cost 21 credits per active monitor-hour.',
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
  'const query = "from:xquikcom webhook OR SDK";',
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
  'type TweetCreateResult =',
  '"x_write_unconfirmed"',
  '"pending_confirmation"',
  'write_action_id: result.writeActionId',
  'charged_credits: result.chargedCredits',
  'poll: "GET /x/write-actions/{id}"',
  'The generated TypeScript SDK models confirmed `tweetId`, `charged`, and `chargedCredits` responses.',
  'The REST API can also return `202 x_write_unconfirmed`',
  'store `writeActionId`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
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
  'Error          string `json:"error"`',
  'WriteActionID  string `json:"writeActionId"`',
  'ChargedCredits string `json:"chargedCredits"`',
  'func createTweetHandoff(payload tweetCreatePayload, base map[string]any) map[string]any {',
  'payload.Error == "x_write_unconfirmed"',
  'payload.Status == "pending_confirmation"',
  '"write_action_id": payload.WriteActionID',
  '"charged_credits": payload.ChargedCredits',
  '"poll":            "GET /x/write-actions/{id}"',
  'Use `option.WithResponseBodyInto` when a write worker must branch on the REST `202 x_write_unconfirmed` response',
  'store `writeActionId`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
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
  '`dm.MessageID`',
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
  'query = "from:xquikcom webhook OR SDK"',
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
  'target_username = "xquikcom"',
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
  'payload: dict[str, Any]',
  '"x_write_unconfirmed"',
  '"pending_confirmation"',
  '"write_action_id": payload["writeActionId"]',
  '"charged_credits": payload["chargedCredits"]',
  '"poll": "GET /x/write-actions/{id}"',
  'Use `with_raw_response.create` when a write worker must branch on the REST `202 x_write_unconfirmed` response',
  'store `writeActionId`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
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
  'query = "from:xquikcom webhook OR SDK"',
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
  'target_username = "xquikcom"',
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
  'Use `client.request` when a write worker must branch on the REST `202 x_write_unconfirmed` response',
  'def create_tweet_handoff(client, payload)',
  'response = client.request(',
  'path: "x/tweets"',
  'response.fetch(:error, nil) == "x_write_unconfirmed"',
  '"write_action_id" => response.fetch(:writeActionId)',
  '"charged_credits" => response.fetch(:chargedCredits)',
  '"poll" => "GET /x/write-actions/{id}"',
  'tweet_handoff = create_tweet_handoff(',
  'reply_handoff = create_tweet_handoff(',
  'puts(JSON.generate(tweet_handoff))',
  'puts(JSON.generate(reply_handoff))',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
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
  'account: "@xquikcom"',
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
  'store `writeActionId`, `chargedCredits`, and poll `GET /x/write-actions/{id}`',
  'write_handoff() {',
  'input_file="$1"',
  '.error == "x_write_unconfirmed"',
  'write_action_id: .writeActionId',
  'charged_credits: .chargedCredits',
  'poll: "GET /x/write-actions/{id}"',
  'tweet_id: .tweetId',
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
  'string targetUsername = "xquikcom";',
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
  'response.StatusCode == HttpStatusCode.Accepted',
  'error.GetString() == "x_write_unconfirmed"',
  'status.GetString() == "pending_confirmation"',
  'row["write_action_id"] = payload.GetProperty("writeActionId").GetString();',
  'row["charged_credits"] = payload.GetProperty("chargedCredits").GetString();',
  'row["poll"] = "GET /x/write-actions/{id}";',
  'Dictionary<string, object?> tweetHandoff = await CreateTweetHandoff(',
  'Dictionary<string, object?> replyHandoff = await CreateTweetHandoff(',
  '`client.X.Tweets.WithRawResponse.Create`',
  '`202 x_write_unconfirmed`',
  'Store `chargedCredits` as `charged_credits` for both confirmed and pending responses.',
  'store `writeActionId` as `write_action_id`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
  '`client.X.Media.Upload`',
  '`POST /x/media`',
  '`media.MediaID`',
  '`MediaIds`',
  '`client.X.Dm.Send`',
  '`dm.MessageID`',
  'Dictionary<string, object?> dmHandoff = new()',
  '["media_id"] = media.MediaID',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(tweetHandoff));',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(replyHandoff));',
  'await Console.Out.WriteLineAsync(JsonSerializer.Serialize(dmHandoff));',
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave the generated `ReplyToMessageID` property unset even if SDK params expose it; the REST endpoint rejects DM reply threading.',
  'Text-only tweet and reply writes cost 10 credits.',
  'Do not pass uploaded `media.MediaID` values to `client.X.Tweets.Create`',
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
  "$query = 'from:xquikcom webhook OR SDK';",
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
  'Use `$client->x->tweets->raw->create()` when a worker must branch on the REST `202 x_write_unconfirmed` response',
  'function createTweetHandoff(Client $client, array $payload): array',
  '$response = $client->x->tweets->raw->create(params: $payload);',
  '202 === $response->getStatusCode()',
  "'x_write_unconfirmed' === ($body['error'] ?? null)",
  "'write_action_id' => $body['writeActionId']",
  "'charged_credits' => $body['chargedCredits']",
  "'poll' => 'GET /x/write-actions/{id}'",
  '$tweet = $response->parse();',
  '$tweetHandoff = createTweetHandoff($client, [',
  '$replyHandoff = createTweetHandoff($client, [',
  "'tweet_handoff' => $tweetHandoff",
  "'reply_handoff' => $replyHandoff",
  "'dm_handoff' => $dmHandoff",
  'Store `write_action_id` and `charged_credits`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
  '`POST /x/tweets`',
  '`media`',
  '`replyToTweetID`',
  '`$tweet->tweetID`',
  '$replyHandoff',
  '`$client->x->media->upload()`',
  '`POST /x/media`',
  '`$media->mediaID`',
  '`mediaIDs`',
  '`$client->x->dm->send()`',
  '`$dm->messageID`',
  "'user_id' => '44196397'",
  "'account' => '@xquikcom'",
  "'status' => 'sent'",
  'Keep DM body text in private systems.',
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave generated `replyToMessageID` unset even if SDK params expose it; the REST endpoint rejects DM reply threading.',
  'Text-only tweet and reply writes cost 10 credits.',
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
  '"x_write_unconfirmed".equals(payload.get("error"))',
  '"pending_confirmation".equals(payload.get("status"))',
  'handoff.put("write_action_id", payload.get("writeActionId"));',
  'handoff.put("charged_credits", payload.get("chargedCredits"));',
  'handoff.put("poll", "GET /x/write-actions/{id}");',
  '`client.x().tweets().withRawResponse().create(...)`',
  '`202 x_write_unconfirmed`',
  'store `writeActionId`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
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
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave the generated `replyToMessageId` field unset even if SDK builders expose it; the REST endpoint rejects DM reply threading.',
  'Text-only tweet and reply writes cost 10 credits.',
  'Do not pass uploaded `media.mediaId()` values to `client.x().tweets().create`',
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
  'payload["error"] == "x_write_unconfirmed"',
  'payload["status"] == "pending_confirmation"',
  'handoff["write_action_id"] = payload["writeActionId"]',
  'handoff["charged_credits"] = payload["chargedCredits"]',
  'handoff["poll"] = "GET /x/write-actions/{id}"',
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
  'Shared logs, public artifacts, queue status, and agent handoffs should store `message_id`, optional `media_id`, `account`, `user_id`, and send status instead of full DM bodies.',
  'Leave the generated `replyToMessageId` field unset even if SDK builders expose it; the REST endpoint rejects DM reply threading.',
  '`client.x().tweets().withRawResponse().create(...)`',
  '`202 x_write_unconfirmed`',
  'store `writeActionId`',
  'poll [Get Write Action Status](/api-reference/x-write/get-write-action-status)',
  'Text-only tweet and reply writes cost 10 credits.',
  'Do not pass uploaded `media.mediaId()` values to `client.x().tweets().create`',
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
  'Active instant monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Terraform state can contain the webhook `secret` returned at creation time.',
  '`sensitive = true`',
  '## Workflow: Declare Media Tweets and Replies',
  '`x-twitter-scraper_x_tweet`',
  '`POST /x/tweets`',
  'media             = ["https://example.com/product-demo.mp4"]',
  'launch_reply_tweet_id',
  'Text-only tweets cost 10 credits, and attached media adds 2 credits per started MB.',
  'Do not pass uploaded media IDs to this resource',
  'Generated provider docs may list `media_ids` on `x-twitter-scraper_x_tweet`, but `POST /x/tweets` rejects `media_ids`.',
  'Use `media` with public image or MP4 URLs for tweets.',
  'Reserve uploaded media IDs for one-item DM `media_ids` through REST, MCP tools, or a generated SDK.',
  'Terraform state for `x-twitter-scraper_x_tweet` does not expose `write_action_id`, media upload resources, or direct-message send resources.',
  'store returned DM `message_id`, use the REST API, MCP tools, or a generated SDK instead of Terraform.',
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
  'Docs `https://docs.xquik.com/mcp` (docs, no auth)',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
  'https://docs.xquik.com/openapi.yaml',
  '"status": "pending_confirmation"',
  '"writeActionId": "42"',
  '`GET /x/write-actions/{id}`',
  'opt in to the normalized v1 response contract',
  '**Tweet Search Filters** (`tweet_search_extractor` and `GET /x/tweets/search`)',
  '`minQuotes`',
  '`anyWords`',
  '`quotesOfTweetId`',
  '**Tweet result filters**',
  '`GET /x/users/{id}/tweets`',
  '`GET /x/tweets/{id}/quotes`',
  'signed `webhook.test` payloads without `deliveryId`/`streamEventId`',
  'Search and read indexed public docs',
] as const;

const REQUIRED_SKILL_RATE_LIMIT_SNIPPETS = [
  '### Rate limits',
  '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 60 per 1s user bucket.',
  '- **Write**: `POST`, `PUT`, and `PATCH` share a 30 per 60s user bucket.',
  '- **Delete**: `DELETE` requests use a 15 per 60s user bucket.',
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
      '**Quick answer:** 60 GET/1s, 30 POST/60s, 15 DELETE/60s per account.',
      '`GET`, `HEAD`, and `OPTIONS` share a limit of 60 requests per 1 second.',
      'Read tier (60 per 1s):',
      'const readLimiter = new WindowRateLimiter(60, 1_000);',
      'read_limiter = WindowRateLimiter(60, 1)',
      'var readLimiter = NewWindowRateLimiter(60, time.Second)',
      'reservoir: 60,            // 60 requests per read window',
    ],
    forbidden: [
      '10 GET/1s',
      'limit of 10 requests per 1 second',
      'Read tier (10 per 1s)',
      'WindowRateLimiter(10',
      'NewWindowRateLimiter(10',
      'reservoir: 10',
      '10 requests per read window',
      '10 requests per 1s',
      '100ms',
      '120ms stays under 10',
    ],
  },
  {
    file: 'api-reference/overview.mdx',
    required: [
      'Read calls are 60 per 1s, write calls are 30 per 60s, and delete calls are 15 per 60s.',
      '`GET`, `HEAD`, and `OPTIONS` requests share a 60 per 1s user bucket.',
    ],
    forbidden: ['Read calls are 10 per 1s', 'share a 10 per 1s user bucket'],
  },
  {
    file: 'quickstart.mdx',
    required: ['60 reads/1s, 30 writes/60s, 15 deletes/60s'],
    forbidden: ['10 reads/1s, 30 writes/60s, 15 deletes/60s'],
  },
  {
    file: 'guides/prefect.mdx',
    required: ['Read endpoints share a 60 per 1s user bucket.'],
    forbidden: ['Read endpoints share a 10 per 1s user bucket.'],
  },
  {
    file: 'guides/troubleshooting.mdx',
    required: [
      '`GET`, `HEAD`, and `OPTIONS` share a limit of 60 requests per 1 second.',
    ],
    forbidden: [
      '`GET`, `HEAD`, and `OPTIONS` share a limit of 10 requests per 1 second.',
    ],
  },
  {
    file: 'skill.md',
    required: [
      '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 60 per 1s user bucket.',
    ],
    forbidden: [
      '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 10 per 1s user bucket.',
    ],
  },
  {
    file: 'llms.txt',
    required: ['- Read endpoints: 60 requests per 1s (fixed window)'],
    forbidden: ['- Read endpoints: 10 requests per 1s (fixed window)'],
  },
] as const;

const REQUIRED_SKILL_DECISION_GUIDANCE_SNIPPETS = [
  '## Decision guidance',
  '- **Use the REST API** for backend services, automation scripts, interval polling, file exports, and fine-grained pagination or request control.',
  '- **Use Docs MCP** for AI agents that need read-only docs search and page retrieval for API parameters, examples, error codes, billing rules, webhook setup, or SDK guidance.',
  '- **Use API MCP** for AI agents that need authenticated Xquik account actions in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients.',
  '- **Use webhooks** when monitor events must reach an HTTPS endpoint in real time. Add them to REST or MCP workflows when pushed events are better than polling.',
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
  '- **OAuth 2.1**: API MCP server also supports Bearer tokens for browser-based MCP clients.',
  '### Connect an AI agent through MCP',
  '1. Add Docs MCP at `https://docs.xquik.com/mcp` for read-only docs search and page retrieval.',
  '2. Configure API MCP at `https://xquik.com/mcp` for authenticated account actions.',
  '3. Authenticate API MCP with an `x-api-key` header or OAuth Bearer token.',
  '4. Use `explore` to search the in-memory API catalog and `xquik` to run authenticated requests.',
  '- The REST API and API MCP server connect to the same backend and share the same account state.',
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
  "- **Trending data**: Access real-time trends across 12 regions plus radar topics from Xquik's own infrastructure.",
] as const;

const FORBIDDEN_SKILL_CONFIDENTIALITY_PATTERN =
  /radar topics from (?!Xquik's own infrastructure\.)[^\n.]+(?:,| and )[^\n.]+/u;

const REQUIRED_MCP_CONTRACT_SNIPPETS = [
  'MCP server discovery metadata is available at:',
  'This page covers the API MCP server at `https://xquik.com/mcp` for',
  'authenticated account actions. For read-only documentation search, use the',
  '[Docs MCP server](/mcp/docs-mcp) at `https://docs.xquik.com/mcp`.',
  'https://xquik.com/.well-known/mcp.json',
  '`GET` and `POST` requests to `/.well-known/mcp.json` return the MCP registry',
  'server card JSON directly.',
  '`GET /.well-known/mcp/server-card.json` returns the',
  'same card for clients that read the nested server-card path.',
  'can also read `GET /.well-known/oauth-protected-resource/.well-known/mcp.json`',
  '`Authorization: Bearer {XQUIK_API_KEY}`',
  '`https://dashboard.xquik.com/en/account`',
  'direct client examples',
  'with `x-api-key` when the client supports',
  'Unauthenticated requests to `https://xquik.com/mcp` return `401` with a',
  '`WWW-Authenticate: Bearer` challenge.',
  'resource_metadata="https://xquik.com/.well-known/oauth-protected-resource/mcp"',
  '`scope="mcp:tools"`',
  '`error="invalid_token"`',
  '`error_description="Missing or invalid access token"`',
  'The JSON body is',
  '`{ "error": "Authentication required" }`',
  'API-key clients should send',
  '`x-api-key` on the first request.',
  'Connect to `https://xquik.com/mcp` with `x-api-key` or OAuth 2.1 Bearer auth.',
  '`xquik.request()` uses the normalized v1 contract automatically.',
  'Write and media responses also use the MCP-normalized snake_case contract.',
  'Read `tweet_id`, `write_action_id`, `charged_credits`, `media_id`, `media_url`, and `message_id` from `xquik.request()` results.',
  'REST and generated SDK pages may show camelCase fields such as `tweetId`, `writeActionId`, `chargedCredits`, `mediaId`, and `messageId`; keep MCP agents on snake_case when reading tool results.',
  'Search the API spec. Read-only, no network calls, no credits. Requires MCP authentication to execute.',
  'Free means no usage credits; the call still requires MCP authentication through an API key or OAuth Bearer token.',
  'Search the API endpoint catalog. Read-only, no network calls, and no credits required. The call still requires MCP authentication through an API key or OAuth Bearer token.',
  'has_more',
  'next_cursor',
  'Pass `next_cursor` back as the `cursor` query parameter',
  'MCP server\'s `xquik.request()` tool sends that normalized contract automatically',
  '## Agent handoff patterns',
  'MCP returns JSON.',
  'Use extraction export endpoints when you need Xquik to generate',
  'CSV, JSON, XLSX, Markdown, or PDF files.',
  'normalized rows or IDs to store',
  'Avoid returning raw `tweets` or `users` pages',
  '<Card title="Search tweets to JSON" icon="search">',
  'Call `GET /api/v1/x/tweets/search`. Store `tweets[].id`, `tweets[].text`, `tweets[].author`, `tweets[].created`, `has_more`, `next_cursor`, and the original `q`. Cost: 1 credit per tweet returned.',
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
  '> Scrape tweet replies to CSV, JSON, or XLSX (subscription required)',
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
  "sourceUser = 'xquikcom'",
  "job: 'follower_export'",
  'source_user: sourceUser',
  'user_id: user.id',
  'profile_picture: user.profile_picture ?? null',
  'rows,',
  'has_more: hasMore',
  'next_cursor: nextCursor',
  '> Post a tweet or reply with public media URLs (subscription required)',
  "media: ['https://example.com/product-demo.mp4']",
  "source: 'xquik_mcp'",
  "job: 'tweet_write'",
  "result.error === 'x_write_unconfirmed'",
  'write_action_id: result.write_action_id',
  'poll: `/api/v1/x/write-actions/${result.write_action_id}`',
  'tweet_id: result.tweet_id',
  "> Upload media for a DM (subscription required)",
  "source_url = 'https://example.com/image.png'",
  'media_ids: [media.media_id]',
  "job: 'dm_media'",
  'media_url: media.media_url',
  'message_id: dm.message_id',
  'Keep full DM bodies out of',
  'shared MCP outputs; return IDs, status, media references, and source filenames',
  'Leave `reply_to_message_id` unset because the DM send endpoint rejects',
  'reply threading.',
  '> Download media and get gallery link (subscription required)',
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
  'Call `POST /api/v1/x/tweets` with `media: ["https://..."]`. Store `tweet_id` or `write_action_id`, `reply_to_tweet_id`, `account`, `charged_credits`, and the original `media` URLs. Cost: 10 credits text-only, plus 2 credits per started MB across attached media.',
  '<Card title="Send DMs with media" icon="send">',
  'Call `POST /api/v1/x/media`, then `POST /api/v1/x/dm/{userId}` with one `media_ids` value. Store `media_id`, `media_url`, `message_id`, `user_id`, `account`, and source URL or filename. Keep full DM bodies out of shared outputs and leave `reply_to_message_id` unset. Cost: 10 credits per media upload plus 10 credits per DM send.',
  'Do not upload media before posting tweets or replies when the media is already public.',
  '`POST /api/v1/x/tweets` rejects `media_ids` with `400 unsupported_field`',
  'Reserve uploaded `media_id` values for direct messages.',
  '<Card title="Track tweet or reply writes" icon="activity">',
  'Call `POST /api/v1/x/tweets`, then `GET /api/v1/x/write-actions/{id}` when pending. Store `tweet_id`, `reply_to_tweet_id`, `write_action_id`, `status`, `charged`, `charged_credits`, and `media`. Cost: 10 credits text-only, plus 2 credits per started MB across attached media.',
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
  '> Run an extraction with a resumable handoff (subscription required)',
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
  'The sandbox attempts `POST /api/v1/subscribe`; when it returns a URL, the error includes it.',
  '**402 / `no_credits` / `insufficient_credits`**',
  'Call `POST /api/v1/credits/topup` or `POST /api/v1/credits/quick-topup`, then retry the failed metered call.',
  'The server covers 120 operations across 10 categories:',
  '<Card title="X data reads" icon="search">',
  '38 operations in `twitter`: tweet search, tweet and article lookup, user lookup, follow checks, trends, bookmarks, notifications, timeline, DM history, likes, media, followers, replies, communities, and lists.',
  '<Card title="X accounts and writes" icon="send">',
  '25 operations across `x-accounts` and `x-write`: connect accounts, retry connection issues, post tweets, like, retweet, follow, remove followers, send DMs, upload media, update profiles, and manage community membership.',
  '<Card title="Monitor billing" icon="radio">',
  'Active instant monitors cost 21 credits per active monitor-hour. Creating monitors requires a subscription and available credits.',
] as const;

const REQUIRED_MCP_EXAMPLE_PROMPT_SNIPPETS = [
  'Replay stored events for monitor mon_123 using the last next_cursor as after.',
  'Search recent X posts about TypeScript.',
  'Pull all replies to this tweet: https://x.com/elonmusk/status/1893456789012345678',
  'Set up a webhook at https://my-server.com/events for new tweets.',
  'Post a tweet saying: Just shipped v2.0!',
  'Post a tweet saying: New feature! Use public image URL https://example.com/launch.png.',
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

const REQUIRED_DOCS_MCP_SERVER_SNIPPETS = [
  'title: Docs MCP server',
  'Xquik documentation is available as an MCP server at `https://docs.xquik.com/mcp`.',
  'AI tools can search the full docs site and retrieve indexed public pages',
  'This is separate from the [Xquik API MCP server](/mcp/overview) at `xquik.com/mcp`',
  'The docs MCP server is read-only and requires no authentication.',
  '<Card title="Docs MCP Server" icon="book-open">',
  'Search docs and read indexed public pages at `https://docs.xquik.com/mcp`. No auth required. Free.',
  '<Card title="API MCP Server" icon="terminal">',
  'Interact with X data at `https://xquik.com/mcp`. Use an API key or OAuth 2.1.',
  'Includes `explore` and `xquik`; costs follow the endpoint.',
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
  '<Card title="Hand off results" icon="file-json">',
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
  '## Using both MCP servers',
  '**Docs MCP** (`docs.xquik.com/mcp`)',
  '**API MCP** (`xquik.com/mcp`)',
  'The AI decides which server to query based on context.',
  'A question about how draw filters work hits the docs server.',
  'A request to run a draw hits the API server.',
  '## What gets searched',
  'API reference (120 documented operations)',
  'Webhook documentation (overview, signature verification)',
  'MCP server setup and tools reference',
  'OAuth 2.1 documentation',
  '`llms.txt` (complete API technical reference)',
  '"mcp/docs-mcp"',
] as const;

const REQUIRED_AGENT_MCP_HANDOFF_SNIPPETS = [
  'title: Agent MCP Handoff',
  'Route AI agents across Xquik Docs MCP, API MCP, REST, SDKs, webhooks, event replay, and file exports.',
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
  '<Card title="File Exports" icon="file-json" href="/guides/response-formats-exports">',
  '<Card title="Webhook Receivers" icon="webhook" href="/guides/webhook-testing">',
  '<Card title="SDK Backends" icon="boxes" href="/sdks">',
  '"mcp/agent-handoff"',
  '[Agent MCP Handoff](https://docs.xquik.com/mcp/agent-handoff)',
] as const;

const REQUIRED_TROUBLESHOOTING_MCP_HANDOFF_SNIPPETS = [
  'Xquik has 2 MCP servers. Choose based on what the agent needs to do.',
  '<Card title="Search docs" icon="book-open">',
  'Connect `https://docs.xquik.com/mcp`. It is read-only and requires no auth.',
  '<Card title="Run API actions" icon="terminal">',
  'Connect `https://xquik.com/mcp`. It requires `x-api-key` or OAuth 2.1 and exposes `explore` plus `xquik`.',
  'For docs search, add `https://docs.xquik.com/mcp`.',
  'For account actions, get your API key from the dashboard.',
  'Configure `https://xquik.com/mcp` with an `x-api-key` header or OAuth login.',
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
] as const;

const REQUIRED_BILLING_RECOVERY_SNIPPETS = [
  '### Recover from 402',
  '402 no_credits',
  '402 insufficient_credits',
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
  'Cost: 10 credits text-only, plus 2 credits per started MB across attached media.',
  '<Card title="Upload media for DMs" icon="image">',
  'uploaded `media_id`',
  'Cost: 10 credits per media upload call.',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  'signed webhooks',
  'Cost: 21 credits per active monitor-hour, with a 500-credit daily estimate.',
  '<Card title="Recover from 402" icon="credit-card">',
  'Checkout top-ups start at USD 10; quick top-up charges a saved payment method for USD 10-500',
  '### Monitor pricing',
  '<Card title="Account monitor slots" icon="users">',
  'Account monitor slots are unlimited.',
  '<Card title="Keyword monitor slots" icon="search">',
  'Keyword monitor slots are unlimited.',
  '<Card title="Active monitor hour" icon="clock">',
  'Each active instant monitor costs 21 credits per active monitor-hour.',
  '<Card title="Check interval" icon="timer">',
  'Instant monitors check every 1 second while active.',
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
  'Eligible MPP read endpoints can also be paid per request without a subscription.',
] as const;

const REQUIRED_BILLING_CARRYOVER_SNIPPETS = [
  '## Monthly credits & carry-over',
  'Unused subscription credits carry over in the same balance',
  'Every paid subscription invoice adds the monthly credit grant to your account balance.',
  'Subscription credits, top-up credits, and automatic top-up credits stay in that balance until you spend them.',
  'Unused subscription credits **carry over** to the next billing period',
  'When the shared balance reaches 0, metered calls return `402 Payment Required`',
  'a monthly credit grant is added to your balance and unused credits carry over',
  'Yes. Subscription credits and top-up credits stay in the shared balance until you spend them.',
] as const;

const REQUIRED_BILLING_MPP_SNIPPETS = [
  '## Pay-per-use (MPP)',
  '31 X-API read-only endpoints accept [Machine Payments Protocol](/mpp/overview) payments.',
  'Use [MPP overview](/mpp/overview#eligible-endpoints) for the full 31-endpoint route list.',
  'This guide keeps price bands here so mobile readers can estimate before opening the full table.',
  '<Card title="USD 0.00015 units" icon="coins">',
  'Most reads cost USD 0.00015 per call, tweet, user, or community.',
  'Examples: `GET /x/tweets/{id}`, `GET /x/tweets/search`, `GET /x/users/{id}`, `GET /x/users/{id}/followers`, timelines, replies, quotes, communities, and lists.',
  '<Card title="USD 0.00105 calls" icon="badge-dollar-sign">',
  'Higher-cost flat charge intent calls: `GET /x/followers/check` and `GET /x/articles/{tweetId}`.',
  '<Card title="USD 0.00045 trends" icon="trending-up">',
  'Trend lookups use flat charge intent pricing: `GET /trends` and `GET /x/trends`.',
  '<Card title="Charge vs session" icon="receipt">',
  'Session intent endpoints deposit funds, then deduct by returned tweet, user, or community.',
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

const REQUIRED_API_OVERVIEW_CHECKLIST_SNIPPETS = [
  '## Integration readiness checklist',
  '<Card title="Authentication" icon="key">',
  '`x-api-key`',
  '<Card title="Response contract" icon="file-json">',
  '`xquik-api-contract: 2026-04-29`',
  '`has_more`',
  '`next_cursor`',
  '<Card title="Pagination" icon="list">',
  '`after` with `nextCursor`',
  '`cursor` with `next_cursor`',
  '<Card title="Billing" icon="credit-card">',
  '`402 no_credits`',
  '`402 insufficient_credits`',
  '<Card title="Rate limits" icon="timer">',
  '`Retry-After`',
  '<Card title="Ambiguous writes" icon="activity">',
  '`202 x_write_unconfirmed`',
  '`GET /x/write-actions/{id}`',
  '`writeActionId`',
  '`pending_confirmation`',
  'opt in to the normalized v1 response contract',
  '<Card title="400 validation" icon="circle-alert">',
  '`invalid_input` means the request body, query, or path failed',
  '<Card title="401 authentication" icon="key-round">',
  '`unauthenticated` means the API key or bearer token is missing',
  '<Card title="402 billing state" icon="credit-card">',
  '`no_subscription`, `no_credits`, and `insufficient_credits`',
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
  '| 502 | `x_api_unavailable` | X data source temporarily unavailable - retry |',
  '"message": "X data source temporarily unavailable. Retry shortly."',
] as const;

const REQUIRED_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'Respect `Retry-After`; otherwise start at 1 second, add jitter, and stop after 3 retries.',
  'Requests sent before the fixed window resets keep returning `429` until `Retry-After` elapses.',
  '<Card title="Retry-After header" icon="timer">',
  'Standard read throttles return `Retry-After: 1`. Write and delete throttles return `Retry-After: 60`. Account connection cooldowns return `Retry-After: 900`.',
  '<Card title="JSON retry field" icon="file-json">',
  '`error: "rate_limit_exceeded"`',
  '<Card title="Node.js libraries" icon="package">',
  '`npm install bottleneck`',
  '<Card title="Python library" icon="package">',
  '`pip install ratelimit`',
  '<Card title="Go library" icon="package">',
  '`go get golang.org/x/time/rate`',
  'GET /api/v1/events?limit=100',
  'If `hasMore` is `true`, store `nextCursor` and pass it as `after`',
  '1 read slot per page instead of 1 request per monitor',
  'GET /api/v1/events?limit=100&after={nextCursor}',
  'only for backfills and reconciliation',
] as const;

const FORBIDDEN_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'max 5 retries',
  'Sending requests before the window resets may extend your cooldown.',
] as const;

const REQUIRED_TROUBLESHOOTING_RECOVERY_SNIPPETS = [
  'GET /api/v1/events/{id}',
  'streamEventId',
  'GET /api/v1/events?monitorId={id}&limit=50',
  'If `hasMore` is `true`, store `nextCursor` and pass it as `after`',
  '202 x_write_unconfirmed',
  'Store `writeActionId`, `status`, `charged`, and `chargedCredits`',
  'Do not retry-send the same post while status is `pending_confirmation`',
  'Poll `GET /api/v1/x/write-actions/{id}` before scheduling follow-up work',
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
  'description: Recover from Xquik API error codes and rate limits',
  'Every error includes an `error` code.',
  'Use it to choose recovery.',
  'post tweet status',
  'Start with the HTTP family, then apply the recovery rule.',
  '<Card title="400 request validation" icon="circle-alert">',
  '`invalid_json`, `invalid_id`, `invalid_tweet_url`, `invalid_tweet_id`',
  '<Card title="402 billing and credits" icon="credit-card">',
  '`payment_failed`, `no_credits`, and `insufficient_credits`.',
  '<Card title="403 permissions and account health" icon="shield-alert">',
  '`api_key_limit_reached`, `monitor_limit_reached`,',
  '`dm_not_permitted`, `account_needs_reauth`, and `account_restricted`.',
  '<Card title="422 write validation" icon="message-circle-warning">',
  '`x_dm_not_allowed`, `x_target_not_found`, `x_content_too_long`',
  '<Card title="202 pending confirmation" icon="clock">',
  'Store `writeActionId`, poll',
  'and do not retry-send while status is `pending_confirmation`.',
  '<Card title="429 rate limit or cooldown" icon="timer">',
  '`Retry-After` or exponential backoff',
  '<Card title="500, 502, and 503 transient failures" icon="rotate-ccw">',
  'Stop after 3 attempts.',
  '<Card title="HTTP status" icon="gauge">',
  '`429 Too Many Requests` means the request is rate limited or waiting on an',
  '<Card title="Retry-After header" icon="timer">',
  'The `Retry-After` header gives seconds to wait before sending the same',
  'The write action was dispatched, but final confirmation is still pending.',
  '<Card title="x_write_unconfirmed" icon="clock">',
  'Action may have completed but could not be confirmed. The response',
  'includes `status: "pending_confirmation"`, `writeActionId`,',
  '`charged: false`, and `retryable: false`.',
  '<Card title="Recovery" icon="circle-check">',
  'Store `writeActionId`, call [Get Write Action Status](/api-reference/x-write/get-write-action-status), and do not retry-send while status is `pending_confirmation`.',
  '## Write confirmation recovery',
  'Because `202` is a successful HTTP status, check `response.status` before',
  'generic `response.ok` handling.',
  'If `response.status === 202` and `error === "x_write_unconfirmed"`, store `writeActionId`, `status`, `charged`, `chargedCredits`, and `retryable`.',
  'Poll `GET /api/v1/x/write-actions/{id}` until `status` is `success` or `failed`.',
  'Only persist `tweetId` or `messageId` after the status endpoint confirms success.',
  'Do not retry-send while the write action status is `pending_confirmation`.',
] as const;

const REQUIRED_CREATE_TWEET_API_SNIPPETS = [
  'Post tweets and replies from a connected X account with public image URLs or 1 MP4 video URL, write-status polling, and audit handoff',
  '"post tweet replies"',
  '`reply_to_tweet_id`',
  '`media`',
  'Create a tweet or reply from one connected X account.',
  'Put public HTTPS image URLs or one public MP4 URL in `media`; when `POST /x/media` hosts a local file, use the returned `mediaUrl` here, not `mediaId`.',
  'Do not send `media_ids` to this endpoint.',
  'Store `tweetId` on `200 Success`, or store `writeActionId` and poll when the response is `202 x_write_unconfirmed`.',
  'const result = await response.json();',
  'const postRecord =',
  'write_action_id: result.writeActionId',
  'tweet_id: result.tweetId',
  'process.stdout.write(`${JSON.stringify(postRecord)}\\n`);',
  'result = response.json()',
  'post_record = {',
  '"write_action_id": result["writeActionId"]',
  '"tweet_id": result["tweetId"]',
  'type CreateTweetResponse struct',
  'TweetID string `json:"tweetId"`',
  'WriteActionID string `json:"writeActionId"`',
  '"write_action_id": result.WriteActionID',
  'Array of public media URLs to attach directly.',
  'Send up to 4 JPEG, PNG, GIF, WebP, or AVIF image URLs, or exactly 1 MP4 video URL up to 100 MB.',
  'Do not mix video with other media.',
  'Use [Upload Media](/api-reference/x-write/upload-media) first if you need Xquik to host a local file',
  'Attached media adds 2 credits per started MB across all files.',
  '## Post with public media URLs',
  'Use `media` when your image or MP4 video is already a public HTTPS URL or when [Upload Media](/api-reference/x-write/upload-media) returned `mediaUrl`.',
  'Send up to 4 image URLs or exactly 1 MP4 video URL up to 100 MB.',
  'Do not send `media_ids`; that field is for DMs only.',
  '"account": "brand_account"',
  '"media": ["https://cdn.example.com/product-screenshot.png"]',
  '"media": ["https://cdn.example.com/product-demo.mp4"]',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"media": ["https://cdn.example.com/reply-chart.png"]',
  'Store `tweetId`, `charged`, and `chargedCredits` on a `200 Success` response.',
  'If the API returns `202 x_write_unconfirmed`, store `writeActionId`',
  'Keep `reply_to_tweet_id` and `media` in your downstream record.',
  '<ResponseField name="chargedCredits" type="string">Credits charged for this tweet.',
  'store the returned `mediaUrl`, not the upload `mediaId`.',
  '## Store the post handoff',
  '"status": "posted"',
  '"tweet_id": "1895432178065391234"',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"charged_credits": "12"',
  '"media_credits": "2"',
  '"status": "pending_confirmation"',
  '"write_action_id": "42"',
  '"charged": false',
  '"charged_credits": "0"',
  '"retryable": false',
  '"poll": "GET /x/write-actions/{id}"',
  'Store `writeActionId` as `write_action_id`',
  'do not retry-send the same body while status is `pending_confirmation`',
  'If polling later returns `status: "success"` with `tweetId`, update the same record to `posted`.',
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
  'Poll post tweet, tweet reply, and DM write actions after pending confirmation responses',
  '"tweet reply status"',
  '`GET /x/write-actions/{id}`',
  'While status is `pending_confirmation`, keep `charged` as `false`, `chargedCredits` as `"0"`, and poll again.',
  'Store the final `tweetId` or `messageId` only after the status response returns it.',
  'const queueState = {',
  'result_id: resultId',
  'poll_endpoint:',
  'process.stdout.write(`${JSON.stringify(queueState)}\\n`);',
  'queue_state = {',
  '"result_id": result_id',
  '"poll_endpoint": (',
  'print(json.dumps(queue_state))',
  'type WriteActionStatus struct {',
  'type QueueState struct {',
  'PollEndpoint          *string        `json:"poll_endpoint"`',
  'json.NewEncoder(os.Stdout).Encode(queueState)',
  'The Node.js, Python, and Go examples convert the status response into one',
  'queue-state row.',
  '`write_action_id`, `status`, `result_id`, `target_id`,',
  '`charged_credits`, `media`, `send_dispatched`, `confirmation_attempts`, and',
  '`poll_endpoint`',
  'keep polling only while `status` is `pending_confirmation`.',
  '## Resolve the write queue',
  '`202 x_write_unconfirmed`',
  '<Card title="success" icon="circle-check">',
  'Store `writeActionId`, `action`, `charged`, `chargedCredits`, `media`, and',
  'Mark the original job',
  'as complete.',
  '<Card title="pending_confirmation" icon="clock">',
  'Store `writeActionId`, `sendDispatched`, `confirmationAttempts`',
  'poll again with backoff, and do not retry-send the same body.',
  '<Card title="failed" icon="triangle-alert">',
  'Store `writeActionId`, `action`, `sendDispatched`, `targetId`, `message`',
  '`charged`, `chargedCredits`, and `media`',
  'account, target, content, or billing state',
  'For tweet replies, `targetId` is the parent tweet ID when available.',
  'For DMs, `targetId` is the recipient user ID when available.',
  '`retryable` is always `false` on this status response',
  '"job_id": "reply-queue-184"',
  '"published_tweet_id": "2052816150136832166"',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"charged_credits": "12"',
  '"media": { "count": 1, "credits": "2", "kind": "image", "totalBytes": "834921" }',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  'returns `messageId` after a confirmed direct message send.',
  'shows how to store DM `messageId` values.',
] as const;

const FORBIDDEN_WRITE_ACTION_STATUS_API_SNIPPETS = [
  'JSON.stringify(status, null, 2)',
  'console.log(status)',
  'print(status)',
  'fmt.Println(status)',
] as const;

const REQUIRED_X_ACCOUNTS_LIST_API_SNIPPETS = [
  'Use health before writes: healthy writes, recovering retries, temporaryIssue waits, needsReauth fixes TOTP or credentials, locked/suspended need X recovery',
  'Check `accounts[].health` before scheduling writes.',
  '`temporaryIssue` is still paused by a transient cooldown.',
  '`locked` and `suspended` stay blocked until the account is fixed on X.',
  'Derived login/cookie health. One of `healthy`, `locked`, `needsReauth`, `recovering`, `suspended`, `temporaryIssue`.',
  '## Account health',
  'Use it before writes so your workflow proceeds, waits, retries automatically, or asks the operator to fix the account first.',
  '<Card title="healthy" icon="circle-check">',
  'Cookies are valid. Writes can proceed.',
  '<Card title="needsReauth" icon="refresh-cw">',
  'Credentials, TOTP, email verification, passkey, or another security',
  '[reauth](/api-reference/x-accounts/reauth)',
  '<Card title="locked" icon="lock">',
  'requires account-side verification',
  '<Card title="suspended" icon="circle-x">',
  'writes and automatic retries stay',
  '<Card title="recovering" icon="activity">',
  'Xquik will retry automatically on the next',
  '<Card title="temporaryIssue" icon="triangle-alert">',
  '[bulk retry](/api-reference/x-accounts/bulk-retry)',
] as const;

const REQUIRED_X_ACCOUNTS_CONNECT_TOTP_SNIPPETS = [
  'description: "Connect an X account to Xquik and prepare the saved TOTP secret key when Authenticator App 2FA is enabled"',
  'If this X account uses 2FA, prepare `totp_secret` before sending the request.',
  'If 2FA is already enabled and you did not save the long secret key',
  'turn Authentication App off and on again in X to reveal a new text secret.',
  'add it to your authenticator app, finish the 6-digit confirmation on X',
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
  '{ "error": "login_failed", "message": "Login failed. Check credentials and try again." }',
  'X rejected the submitted username, email, password, or TOTP secret.',
  'Retry with the current password and the saved Authenticator App secret key, not a 6-digit code.',
] as const;

const REQUIRED_X_ACCOUNTS_REAUTH_TOTP_SNIPPETS = [
  'description: "Re-authenticate a connected X account and send the saved TOTP secret key when Authenticator App 2FA is enabled"',
  'If this account uses Authenticator App 2FA, send the saved long key in `totp_secret`.',
  'If you never saved it or X rejects it, turn Authentication App off and on again in X to reveal a new text secret.',
  'finish the 6-digit confirmation on X, then re-authenticate with that saved key.',
  '## 2FA re-authentication',
  'Use the long authenticator app secret key in `totp_secret`.',
  'Do not send the 6-digit authenticator code',
  'If you never saved the secret key, or X rejects the current one',
  '<CardGroup cols={1}>',
  '<Card title="Saved key still works" icon="clipboard-check">',
  '<Card title="Key is missing" icon="rotate-ccw">',
  'X shows the text secret only during Authentication App setup.',
  '<Card title="Key was rejected" icon="triangle-alert">',
  'Treat the old TOTP secret as stale.',
  'Turn Authentication App off, then turn it on again.',
  "choose **Can't scan the QR code?** to reveal the text secret.",
  'store it safely before leaving the setup screen.',
  'Add that key to your authenticator app if you are setting it up fresh.',
  'Finish enabling 2FA on X by entering the current 6-digit code',
  'Send the saved long key in `totp_secret` when you call Xquik.',
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
  'description: "Submit an email code for an active pending challenge; stale challenges need fresh connect or reauth"',
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
  'description: "Clear only temporary login failures; use re-authentication or X-side fixes for credentials, TOTP, passkeys, locked, or suspended accounts"',
  'Bulk retry only clears `transient` and `automated` login-failure states.',
  'It does not update passwords, TOTP secret keys, passkeys, email challenges, locked accounts, or suspended accounts.',
  'Use re-authentication or reconnect for credential and 2FA fixes',
  'resolve locks or suspensions on X first.',
  '## What gets retried',
  '<CardGroup cols={1}>',
  '<Card title="Temporary issues are cleared" icon="refresh-cw">',
  'stored failure reason is `transient` or `automated`',
  'eligible for the next automatic login attempt.',
  '<Card title="Credential fixes are skipped" icon="key-round">',
  'Accounts that need fresh credentials or a security challenge stay unchanged.',
  '[Re-authenticate](/api-reference/x-accounts/reauth)',
  '<Card title="X restrictions stay blocked" icon="shield-alert">',
  'Locked and suspended accounts stay unchanged.',
  '<Card title="Response is an aggregate" icon="list-checks">',
  'The API returns only `cleared`',
  'Call [List X Accounts](/api-reference/x-accounts/list) before and after',
  'The dashboard button follows the same model',
  'It does not perform the next login immediately.',
] as const;

const REQUIRED_X_ACCOUNTS_GET_STATE_SNIPPETS = [
  'Use X account health before writes: healthy writes, recovering retries, temporaryIssue waits, needsReauth fixes TOTP or credentials',
  'Read `health` first: write with `healthy`, let `recovering` retry on next use',
  'wait or bulk retry `temporaryIssue`, re-authenticate `needsReauth`',
  'fix `locked` or `suspended` on X before retrying writes.',
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
  '`health: "recovering"` means Xquik will retry automatically on the next account use.',
  '<Card title="X restriction" icon="shield-alert">',
  '`health: "locked"` or `health: "suspended"` means writes stay blocked until the account is fixed on X.',
  '<Card title="Region fields" icon="globe">',
  '`proxyCountry` is the selected login region stored on the account.',
  'The separate `loginCountry` field appears only in connect or re-authenticate responses',
] as const;

const REQUIRED_X_ACCOUNTS_DISCONNECT_SNIPPETS = [
  'description: "Delete the stored Xquik connection only; the X account stays unchanged, old IDs return 404, and reconnecting creates a new ID"',
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
  'Read service temporarily unavailable. Retry with backoff.',
  '<Card title="x_write_ambiguous" icon="activity">',
  'Verify the result',
  'manually before sending anything again.',
  '<Card title="x_transient_error" icon="rotate-ccw">',
  'Write service timeout or temporary failure. Retry with backoff.',
  'The read service is temporarily unavailable. This is usually transient.',
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
  '<Card title="webhook_inactive" icon="radio">',
  '[Update Webhook](/api-reference/webhooks/update)',
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
  '<Accordion title="Billing & subscription errors (402)">',
  '<Card title="no_subscription" icon="badge-x">',
  '[Subscribe](/api-reference/account/subscribe)',
  '<Card title="subscription_inactive" icon="badge-alert">',
  'Reactivate billing from the',
  '<Card title="no_addon" icon="archive">',
  'current plans include',
  'unlimited monitor slots.',
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
  '`dm_not_permitted`, `account_needs_reauth`, and `account_restricted`.',
  '<Card title="api_key_limit_reached" icon="key-round">',
  'The account already has 100 active API keys.',
  '<Card title="monitor_limit_reached" icon="users">',
  'current plans include',
  'unlimited monitor slots.',
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
  'Wait 2-3 minutes, avoid rapid consecutive',
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
  'wait 2-3 minutes after rapid attempts',
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
  'follower_explorer',
  '## Choose the right path',
  '`GET /x/users/{id}/followers?pageSize=200&cursor={next_cursor}`',
  '[CLI](/sdks/cli)',
  '[TypeScript](/sdks/typescript)',
  '[Python](/sdks/python)',
  '[Go](/sdks/go)',
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
  '"can_dm": true',
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
  'Only `id` and `xUserId` are guaranteed on every result',
  '"toolType": "follower_explorer"',
  '"hasMore": true',
  '"nextCursor": "1001"',
  'Use `limit` up to `1000` and pass `nextCursor` as `after`',
  'import { writeFile } from "node:fs/promises";',
  'const exportFilePath = "x-followers-elonmusk.json";',
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
  '`users[].canDm` to `can_dm`',
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
  '"reply_author_username": "xquikcom"',
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
  'Use the extraction workflow instead when the job needs a durable export file, a cost estimate before scraping, or a hard `resultsLimit`.',
  '`resultsLimit`',
  'Estimate is free.',
  'Exports are free after the extraction job exists.',
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
  'title: "Get tweet replies"',
  'Get tweet replies returns reply tweets for one X post by numeric tweet ID.',
  'conversation analysis, support queues, moderation review, giveaway',
  '`GET /api/v1/x/tweets/{id}/replies`',
  '# First page of replies',
  '# Resume with the previous next_cursor',
  '--data-urlencode "cursor=DAACCgACGE..."',
  '# Bound a campaign or moderation window',
  '--data-urlencode "sinceTime=1777392000"',
  '--data-urlencode "untilTime=1777478400"',
  '## Direct replies handoff',
  '`GET /x/tweets/{id}/replies`',
  'let pageCursor = "";',
  'for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {',
  'const replyRows = page.tweets.map((reply) => ({',
  'parent_tweet_id: tweetId',
  'reply_id: reply.id',
  'author_id: reply.author?.id ?? null',
  'author_username: reply.author?.username ?? null',
  'author_name: reply.author?.name ?? null',
  'author_followers: reply.author?.followers ?? null',
  'author_verified: reply.author?.verified ?? null',
  'author_profile_picture: reply.author?.profilePicture ?? null',
  'in_reply_to_id: reply.inReplyToId ?? null',
  'conversation_id: reply.conversationId ?? null',
  'media_urls: (reply.media ?? []).map((item) => item.mediaUrl).filter(Boolean)',
  'page_index: pageIndex',
  'page_cursor: pageCursor',
  'has_next_page: page.has_next_page',
  'for (const row of replyRows) process.stdout.write(`${JSON.stringify(row)}\\n`);',
  'page_cursor = ""',
  '"parent_tweet_id": tweet_id',
  '"reply_id": reply["id"]',
  '"author_id": (reply.get("author") or {}).get("id")',
  '"author_username": (reply.get("author") or {}).get("username")',
  '"author_name": (reply.get("author") or {}).get("name")',
  '"author_followers": (reply.get("author") or {}).get("followers")',
  '"author_verified": (reply.get("author") or {}).get("verified")',
  '"author_profile_picture": (reply.get("author") or {}).get("profilePicture")',
  '"in_reply_to_id": reply.get("inReplyToId")',
  '"conversation_id": reply.get("conversationId")',
  '"media_urls": [',
  '"page_index": page_index',
  '"page_cursor": page_cursor',
  '"has_next_page": page["has_next_page"]',
  'print(json.dumps(reply_row, separators=(",", ":")))',
  'support, community, moderation,',
  'The examples above write',
  'JSON Lines rows with `parent_tweet_id`, `reply_id`, `text`, author ID,',
  '`reply_extractor`',
  '`tweets[]`',
  '`tweets[].id`',
  '`tweets[].author.id`, `tweets[].author.username`, `tweets[].author.name`,',
  '`tweets[].author.followers`, `tweets[].author.verified`, and `tweets[].author.profilePicture`',
  'username, display name, follower count, verified state, profile image URL,',
  '`tweets[].inReplyToId` and `conversationId`',
  '`has_next_page` and `next_cursor`',
  'one reply for a single tweet',
  '`parent_tweet_id`, `reply_id`, `text`,',
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
  '<ResponseField name="followers" type="number">Follower count.',
  '<ResponseField name="verified" type="boolean">Whether the author is verified.',
  '<ResponseField name="profilePicture" type="string">Author profile image URL.',
  '`resultsLimit`',
  '[Tweet Replies Export Workflow](/guides/tweet-replies-export)',
  'saved CSV, JSON, or XLSX files',
  '1 credit per tweet returned',
  '`402 insufficient_credits`',
  '`Retry-After`',
  '## Which replies endpoint?',
  'Use `GET /api/v1/x/tweets/{id}/replies` for one tweet\'s replies as JSON rows.',
  'Use [`reply_extractor`](/guides/tweet-replies-export) when you need saved CSV, JSON, or XLSX exports.',
  'Use `GET /api/v1/x/tweets/search` when you need keyword, operator, structured-filter, or `queryType` search.',
  'Use `GET /api/v1/x/tweets/{id}/thread` when you need ordered thread context around a tweet.',
  'Opaque pagination cursor for older reply pages.',
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
  '## Direct quote tweet handoff',
  '`GET /x/tweets/{id}/quotes`',
  '`GET /api/v1/x/tweets/{id}/quotes`',
  'quote tweets API',
  'tweet quotes API',
  'quoted posts endpoint',
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
  'for a single source tweet',
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
  'Tweet author profile. Omitted if unavailable.',
  '<Expandable title="Author object fields">',
  '<ResponseField name="id" type="string">Author user ID.',
  '<ResponseField name="username" type="string">Author handle without `@`.',
  '<ResponseField name="name" type="string">Author display name.',
  '<ResponseField name="followers" type="number">Follower count.',
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
  'title: "Get tweet"',
  '`GET /x/tweets/{id}`',
  '`GET /api/v1/x/tweets/{id}`',
  'tweet lookup API',
  'single tweet API',
  'tweet info API',
  'Pass a 15 to 20 digit numeric tweet ID in the path.',
  'extract the final status ID first',
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
] as const;

const FORBIDDEN_GET_USER_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_X_TRENDS_API_HANDOFF_SNIPPETS = [
  '`GET /x/trends`',
  'const trendRows = data.trends.map((trend) => ({',
  'trend_name: trend.name',
  'search_query: trend.query ?? trend.name',
  'region_woeid: data.woeid',
  'returned_count: data.count',
  '"trend_name": trend["name"]',
  '"search_query": trend.get("query", trend["name"])',
  '"region_woeid": data["woeid"]',
  '"returned_count": data["count"]',
  'one JSON line per trend',
  '`trend_name`, `rank`, `description`,',
] as const;

const FORBIDDEN_X_TRENDS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_TRENDS_API_HANDOFF_SNIPPETS = [
  '## Direct trends handoff',
  '`GET /trends`',
  'dashboard, alerting job, content queue, warehouse, or',
  'const regionWoeid = "23424977";',
  'const requestedCount = "10";',
  'const trendRows = data.trends.map((trend) => ({',
  'trend_name: trend.name',
  'search_query: trend.query ?? trend.name',
  'region_woeid: data.woeid',
  'requested_count: Number(requestedCount)',
  'returned_total: data.total',
  'region_woeid = 23424977',
  'requested_count = 10',
  'trend_rows = [',
  '"trend_name": trend["name"]',
  '"search_query": trend.get("query", trend["name"])',
  '"region_woeid": data["woeid"]',
  '"requested_count": requested_count',
  '"returned_total": data["total"]',
  'type TrendsResponse struct {',
  'type TrendRow struct {',
  'RequestedCount int     `json:"requested_count"`',
  'ReturnedTotal  int     `json:"returned_total"`',
  'searchQuery := trend.Name',
  'encoder.Encode(TrendRow{',
  'one JSON line per trend',
  '`trend_name`, `rank`, `description`,',
  '`requested_count`, and `returned_total`',
  '`total` is the number of valid trends available before `count` slicing',
] as const;

const FORBIDDEN_TRENDS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_GET_ARTICLE_API_HANDOFF_SNIPPETS = [
  'title: "Get X article"',
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
  'author_id: author.id ?? null',
  'author_username: author.username ?? null',
  'author_name: author.name ?? null',
  'author_profile_picture: author.profilePicture ?? null',
  'cover_image_url: data.article.coverImageUrl ?? null',
  'body_text: bodyBlocks.map((block) => block.text).join("\\n\\n")',
  'block_count: contentBlocks.length',
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
] as const;

const FORBIDDEN_GET_ARTICLE_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
  'fmt.Println(string(body))',
  'print(response.json()["article"])',
] as const;

const REQUIRED_TWEET_THREAD_API_HANDOFF_SNIPPETS = [
  'title: "Get tweet thread"',
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
  'can_dm: user.canDm ?? null',
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
  '"can_dm": user.get("canDm")',
  '"follower_count": user.get("followers")',
  '"following_count": user.get("following")',
  '"verified_type": user.get("verifiedType")',
  '"profile_image_url": user.get("profilePicture")',
  'checkpoint = {"source_tweet_id": tweet_id, "next_cursor": next_cursor}',
  '## Direct retweeter handoff',
  'workflow needs one row per',
  '`source_tweet_id`, `retweeter_id`,',
  '`username`, `display_name`, `can_dm`,',
  '`verified`, `verified_type`, `profile_image_url`,',
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
  '`GET /x/tweets/{id}/favoriters`',
  '`GET /api/v1/x/tweets/{id}/favoriters`',
  'tweet likers API',
  'tweet likes API',
  'users who liked a tweet endpoint',
  '```bash First page',
  '```bash Next page',
  'source_tweet_id: tweetId',
  'liker_id: user.id',
  'username: user.username',
  'display_name: user.name',
  'can_dm: user.canDm ?? null',
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
  '"can_dm": user.get("canDm")',
  '"follower_count": user.get("followers")',
  '"following_count": user.get("following")',
  '"verified_type": user.get("verifiedType")',
  '"profile_image_url": user.get("profilePicture")',
  'checkpoint = {"source_tweet_id": tweet_id, "next_cursor": next_cursor}',
  '## Direct tweet liker handoff',
  'workflow needs one row per',
  '`source_tweet_id`, `liker_id`, `username`,',
  '`display_name`, `can_dm`, `follower_count`,',
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
  '"community_id": community_id',
  '"moderator_id": user["id"]',
  '"display_name": user["name"]',
  '"bio": user.get("description")',
  '"follower_count": user.get("followers")',
  '"profile_image_url": user.get("profilePicture")',
  'community moderator. Store',
  '`community_id`, `moderator_id`, `username`,',
] as const;

const FORBIDDEN_COMMUNITY_MODERATORS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_TWEETS_API_HANDOFF_SNIPPETS = [
  '`GET /x/communities/{id}/tweets`',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
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
  'one row per community tweet',
  '`community_id`, `tweet_id`, `text`,',
  '`author_id`, `author_username`,',
  '`author_name`, `author_followers`, `author_verified`,',
  '`author_profile_picture`,',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
] as const;

const FORBIDDEN_COMMUNITY_TWEETS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_TWEET_SEARCH_API_HANDOFF_SNIPPETS = [
  '## Direct community tweet search handoff',
  '`GET /x/communities/tweets`',
  'monitoring job, research queue,',
  'social listening workflow, or agent needs tweets across X',
  'const searchQuery = "machine learning";',
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
  'search_query = "machine learning"',
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
  'with the same `q` & `queryType`',
  '`search_query`, `query_type`, `tweet_id`,',
  '`author_followers`, `author_verified`,',
  '`author_profile_picture`, `created_at`, engagement counts, & `media_urls`',
  '<ResponseField name="profilePicture" type="string">',
  'Set `queryType=Latest` for recent queues or backfills',
  'Set `queryType=Top` for',
] as const;

const FORBIDDEN_COMMUNITY_TWEET_SEARCH_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_COMMUNITY_SEARCH_API_HANDOFF_SNIPPETS = [
  '## Direct community search handoff',
  '`GET /x/communities/search`',
  'monitoring job, research queue,',
  'social listening workflow, or agent needs tweets across X',
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
  'with the same `q` & `queryType`',
  '`search_query`, `query_type`, `tweet_id`,',
  '`author_followers`, `author_verified`,',
  '`author_profile_picture`, `created_at`, engagement counts, & `media_urls`',
  '<ResponseField name="profilePicture" type="string">',
  'Set `queryType=Latest` for recent queues or backfills',
  'Set `queryType=Top` for',
] as const;

const FORBIDDEN_COMMUNITY_SEARCH_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  'title: "Get followers"',
  'Get an X account\'s followers by username or user ID',
  'Follower Export API',
  'X followers API',
  'Twitter followers API',
  'canonical endpoint remains `GET /api/v1/x/users/{id}/followers`',
  'https://xquik.com/api/v1/x/users/xquikcom/followers?pageSize=200',
  'https://xquik.com/api/v1/x/users/44196397/followers?pageSize=200',
  'curl -G "https://xquik.com/api/v1/x/users/xquikcom/followers"',
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
  'const userIdOrUsername = "xquikcom";',
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
  'Username or numeric user ID. For example, use `xquikcom` or `44196397`.',
  'Use `users.length`, not the requested `pageSize`, for row counts and budget checks.',
  'Treat the returned `users.length` as the billable row count for that page.',
  'Use `GET /api/v1/x/users/{id}/following` for accounts the user follows.',
  'Use `GET /api/v1/x/users/{id}/verified-followers` when you only need verified followers.',
  '1 credit per result returned',
  '`402 insufficient_credits`',
  'USD 0.00015 per user returned',
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
  '/x/users/xquikcom/following?pageSize=100',
  '```bash Numeric user ID',
  '/x/users/44196397/following',
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
  'const audienceRows = data.users.map',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'audience_rows = [',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'shape durable audience rows instead of printing',
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
  'USD 0.00015 per user returned',
] as const;

const FORBIDDEN_FOLLOWING_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const FORBIDDEN_CHECK_FOLLOWER_RENDER_RISK_SNIPPETS = [
  '## Direct follow relationship handoff',
  'const source = "xquikcom";',
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

const REQUIRED_LIST_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  '## Direct list follower handoff',
  '`GET /x/lists/{id}/followers`',
  'CRM, warehouse, audience, enrichment,',
  '`list_follower_explorer`',
  'CSV/JSON/XLSX file export',
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
  'shape durable list-follower rows instead of',
  '`list_id`, `follower_id`, `username`,',
  '`has_next_page`, and `next_cursor`',
] as const;

const FORBIDDEN_LIST_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_LIST_MEMBERS_API_HANDOFF_SNIPPETS = [
  '## Direct list member handoff',
  '`GET /x/lists/{id}/members`',
  'CRM, warehouse, audience, enrichment,',
  '`list_member_extractor`',
  'CSV/JSON/XLSX file export',
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
  'shape durable list-member rows instead of',
  '`list_id`, `member_id`, `username`,',
  '`has_next_page`, and `next_cursor`',
  '`pageSize` from 20 to 200',
] as const;

const FORBIDDEN_LIST_MEMBERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_LIST_TWEETS_API_HANDOFF_SNIPPETS = [
  '## Direct list tweet handoff',
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
  '[Get User](/api-reference/x/get-user)',
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
] as const;

const FORBIDDEN_BATCH_USERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_BOOKMARK_FOLDERS_API_HANDOFF_SNIPPETS = [
  '## Direct bookmark folder handoff',
  '`GET /x/bookmarks/folders`',
  'saved-tweet workflow, CRM enrichment job,',
  'authenticated X account',
  'Store `folder_id` and `folder_name`',
  '`has_next_page: false`',
  '`next_cursor: ""`',
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
] as const;

const FORBIDDEN_BOOKMARK_FOLDERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_SEARCH_USERS_API_HANDOFF_SNIPPETS = [
  '## Direct user search handoff',
  '`GET /x/users/search`',
  'CRM, enrichment, creator discovery, support,',
  '[Get User](/api-reference/x/get-user)',
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
  'title: "Get user mentions timeline"',
  'Get user mentions timeline returns tweets that mention one X account.',
  'brand mentions, support inboxes, lead routing, and agent handoffs',
  '`GET /api/v1/x/users/{id}/mentions`',
  '# Username mentions timeline',
  'https://xquik.com/api/v1/x/users/xquikcom/mentions',
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
  '/x/users/xquikcom/verified-followers',
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
  'USD 0.00015 per user returned',
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
  'can_dm: user.canDm ?? null',
  'const checkpoint = { target_user_id: userId, next_cursor: nextCursor };',
  'import json',
  'mutual_rows = [',
  '"target_user_id": user_id',
  '"can_dm": user.get("canDm")',
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
  '<Card title="DM preflight"',
  '[Direct message workflow](/guides/direct-message-workflow)',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[DM history](/api-reference/x/dm-history)',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`users[].canDm`',
  '`messageId`',
  'participant-scoped context',
  '`has_next_page` and `next_cursor`',
  'Target X user ID as a numeric string.',
  '[Get user](/api-reference/x/get-user)',
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
  'USD 0.00015 per user returned',
] as const;

const FORBIDDEN_FOLLOWERS_YOU_KNOW_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data.users);',
  'console.log((await next.json()).users);',
  'print(data["users"])',
] as const;

const REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS = [
  'scrape tweets',
  '## End-to-end export handoff',
  'Store one checkpoint that carries the search request through estimate, job creation, JSON pagination, and file export:',
  '"workflow": "tweet_search_export"',
  '"toolType": "tweet_search_extractor"',
  '"searchQuery": "launch announcement"',
  '"estimatedResults": 500',
  '"creditsRequired": "500"',
  '"creditsAvailable": "77000"',
  '"allowed": true',
  '"source": "resultsLimit"',
  '"poll_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"json_pages": {',
  '"page_cursor": null',
  '"next_cursor": "990200"',
  '"has_more": true',
  '"export_paths": {',
  '"csv": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=csv"',
  '"json": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=json"',
  '"xlsx": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export?format=xlsx"',
  '"normalized_row": {',
  '"tweet_id": "1893710452812718080"',
  '"author_user_id": "44196397"',
  '"export_format": "csv"',
  '"handoff_state": "poll_until_completed_then_export"',
  '<Card title="Estimate checkpoint" icon="calculator">',
  'Keep `estimatedResults`, `creditsRequired`, `creditsAvailable`, `allowed`, and `source` with the original query and filters.',
  '<Card title="Job checkpoint" icon="clipboard-check">',
  'Store the returned job `id`, `status`, and `poll_path`',
  'do not expect result rows in the create response.',
  '<Card title="Cursor checkpoint" icon="shuffle">',
  'Store `page_cursor`, `next_cursor`, and `has_more` for JSON page loops',
  'pass `nextCursor` back as `after`',
  '<Card title="Export checkpoint" icon="download">',
  'Store the chosen CSV, JSON, or XLSX `export_paths`',
  '## Choose the right path',
  'Estimate before large jobs.',
  'The `202 Accepted` create response queues the job.',
  'It does not prove credits are reserved.',
  'Poll `GET /extractions/{id}` before fetching rows.',
  'lower `resultsLimit` to the affordable result count',
  'finish as `failed` with `insufficient_credits`.',
  '`tweet_search_extractor`',
  'POST /extractions/estimate',
  'POST /extractions',
  'GET /extractions/{id}',
  'GET /x/tweets/search',
  'format=csv',
  'format=json',
  'format=xlsx',
  'CSV, JSON, or XLSX',
  'CSV, JSON, and XLSX exports are capped at 100,000 rows.',
  '## Filter fields to operators',
  '`tweet_search_extractor` merges structured fields into `searchQuery` before the job runs.',
  '`fromUser` becomes `from:username`',
  '`toUser` becomes `to:username`',
  '`mentioning` becomes `@username`',
  '`language` becomes `lang:en`',
  '`sinceDate` becomes `since:YYYY-MM-DD`',
  '`untilDate` becomes `until:YYYY-MM-DD`',
  '`mediaType` accepts `images`, `videos`, `media`, or `gifs`',
  '`minFaves`, `minRetweets`, and `minReplies`',
  '`replies` and `retweets` accept `exclude`, `include`, or `only`',
  '`verifiedOnly` adds `filter:verified`',
  '`exactPhrase` quotes the value',
  '`excludeWords` turns comma-separated words into `-word` filters',
  '`advancedQuery` is appended to the final query',
  'For direct `GET /x/tweets/search`, put the same operators in `q`.',
  '`job`, `results`, `hasMore`, and `nextCursor`',
  '"job": "tweet_search_extraction"',
  '"tweet_search_extraction_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"',
  '"search_query": "launch announcement"',
  '"filters": {',
  '"media_type": "media"',
  '"results_limit": 500',
  '"handoff_created_at": "2026-05-16T03:25:00.000Z"',
  'Poll by `tweet_search_extraction_id`',
  'Do not wait for `totalResults` or `createdAt` in the create response',
  'those fields arrive from `GET /extractions/{id}`',
  '`tweets[].id`, `tweets[].text`, `tweets[].createdAt`, `tweets[].author.id`, `tweets[].author.username`, `has_next_page`, and `next_cursor`',
  '`xquik-tweet-search.jsonl`',
  'Leave `limit` unset for a simple cursor-driven page loop',
  'Set `limit` when you want Xquik to collect up',
  'if `has_next_page` is `true`, continue',
  'with the same query, filters, `queryType`, and `limit`, and set `cursor` to',
  '`next_cursor`. Cost is 1 credit per tweet returned.',
  'For bounded direct API requests with `limit`, a bare `q=from:username`',
  'is treated as a user timeline pull',
  'single page with `has_next_page: false`',
  'search pagination for that user',
  '`next_cursor`',
  '`resultsLimit`',
  'credit per tweet returned.',
  '## Failure handling',
  '400 missing query',
  'Send a non-empty `q` value for direct search, or `searchQuery` for `tweet_search_extractor`.',
  '402 credits',
  'Subscribe, add credits, lower direct `limit`, or lower extraction `resultsLimit`.',
  '429 rate limit',
  'Wait for `retryAfter` or the `Retry-After` header before retrying.',
  '424 or 502 unavailable',
  'Retry with exponential backoff and keep the same query, filters, cursor, or job ID.',
] as const;

const REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS = [
  'return paginated JSON tweet data for CRM, agents, or export handoff',
  'Use Search Tweets for keyword, hashtag, operator, and filtered discovery.',
  '[Get user timeline](/api-reference/x/user-tweets)',
  '`GET /x/users/{id}/tweets`',
  'When `limit` is present, a bare',
  '`q=from:username` with no `sinceTime` or `untilTime` is handled as a user',
  'timeline pull and returns one bounded page.',
  '## Direct API handoff',
  '`GET /x/tweets/search`',
  'app, queue worker, CRM enrichment job, or',
  'agent needs the latest matching tweets',
  'It returns paginated JSON for live search pages and app ingestion.',
  'The examples',
  'above write JSON Lines rows with tweet fields, author ID, username, display',
  'name, follower count, verified state, profile image URL, media, and cursor',
  'resume from the last saved `next_cursor`',
  'Use [`tweet_search_extractor`](/guides/tweet-search-export) instead when a team',
  'needs an estimate, extraction ID, saved result pages, or CSV, JSON, and XLSX',
  '<Card title="Live search page" icon="search">',
  'Call `GET /x/tweets/search` with `q`, filters, `queryType`, `limit`, and',
  '`cursor` for low-latency JSON rows.',
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
  '`limit` is an upper bound from 1 to 200',
  'For explicit `limit` pulls, treat `limit` as a batch-size upper bound.',
  'response returns fewer tweets than `limit` and `has_next_page` is `true`',
  'continue with the same `q`, structured filters, `queryType`,',
  'and `limit` plus `cursor`.',
  'For bounded `limit` requests, `q=from:username` with no `sinceTime` or',
  '`untilTime` is treated as a user timeline pull',
  '`has_next_page: false`',
  'use the `fromUser` structured',
  'search pagination for that user',
  'For bounded',
  '`limit` batches, keep the same query, filters, `queryType`, and `limit`',
  '`has_next_page: true`, continue',
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
  '[Tweet Search Export Workflow](/guides/tweet-search-export)',
  'saved CSV, JSON, or XLSX files',
  '1 credit per tweet returned',
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
  'api-reference/x/tweet-replies.mdx',
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
  'Tweet author profile. Omitted if unavailable.',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"followers": 150000000',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
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
  'Tweet author profile. Omitted if unavailable.',
  '<ResponseField name="profilePicture" type="string">Profile picture URL.',
  '"followers": 150000000',
  '"profilePicture": "https://pbs.twimg.com/profile_images/example.jpg"',
] as const;

const FORBIDDEN_TIMELINE_API_RAW_SNIPPETS = [
  'const data = await response.json();',
  'console.log(data.tweets);',
  'console.log((await next.json()).tweets);',
  'data = response.json()',
  'print(data["tweets"])',
] as const;

const REQUIRED_USER_TWEETS_API_HANDOFF_SNIPPETS = [
  'title: "Get user timeline"',
  'Get user timeline is the User Timeline API for a single public X profile.',
  '"user tweets," "profile',
  'timeline," or "X user timeline."',
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
  '<Expandable title="Author object fields">',
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
  '<Expandable title="Author object fields">',
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
  'Treat `202 Accepted` as a queued run receipt.',
  'Credits are reserved after the job starts.',
  'Poll `GET /extractions/{id}` before handoff',
  'The run can lower `resultsLimit` to the affordable count',
  'fail with `insufficient_credits`',
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
  'title: Response Formats & Exports',
  'Choose JSON pages, CSV, JSON, XLSX, Markdown, PDF, or TXT handoffs',
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
  '## Handoff Checkpoint',
  '"source": "xquik.response_formats"',
  '"detail_path": "/api/v1/extractions/a1b2c3d4-e5f6-7890-abcd-ef1234567890?limit=1000"',
  '"export_paths": {',
  '"draw_export_path": "/api/v1/draws/f4bd00a2-7b4e-4e59-8e1b-72e2c9f12345/export?format=csv&type=winners"',
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
  'description: "Find ranked X trends by WOEID region and search tweets from each topic"',
  'Xquik returns ranked X trends for 12 supported WOEID regions.',
  "Use each trend's",
  '`query` with [Search Tweets](/api-reference/x/search-tweets)',
  'Each trend includes a `name`, optional `description`, optional `rank`, and',
  'optional `query` string',
  'Defaults to',
  '`30`; valid values are `1` through `50`.',
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
  'Each extraction job needs one target field based on `toolType`.',
  '`resultsLimit`',
  '<Card title="Tweet target" icon="message-circle">',
  'Use `targetTweetId` for tweet-centered jobs:',
  '`article_extractor` extracts article content from a tweet.',
  '`favoriters` extracts users who liked a tweet.',
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
  '`community_search` searches posts within a community.',
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
  'Use [List Extractions](/api-reference/extractions/list) with `status` and',
  '<Card title="Export after completion" icon="download">',
  'Use [Export Extraction](/api-reference/extractions/export) after the detail',
] as const;

const FORBIDDEN_EXTRACTION_CREATE_RECEIPT_SNIPPETS = [
  '"results": [',
  '"hasMore": true',
  'const results = data.results',
] as const;

const REQUIRED_EXTRACTION_ESTIMATE_HANDOFF_SNIPPETS = [
  '## Decision handoff',
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

const REQUIRED_DRAW_EXPORT_RESPONSE_SNIPPETS = [
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
] as const;

const REQUIRED_EXTRACTION_EXPORT_COLUMNS_SNIPPETS = [
  'File format changes serialization only. The selected columns depend on the',
  'extraction tool type. Default exports include 28 columns; `article_extractor`',
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
  '`Tweet ID`, `Tweet Text`, and `Tweet Created At`.',
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
  'Use [Get Extraction](/api-reference/extractions/get)',
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
  'one media attachment in DMs',
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
  '`x_write_unconfirmed`',
  '`writeActionId`',
  'POST /x/dm/{userId}',
  '`media_ids`',
  'For tweet-only workflows with already public image URLs or exactly 1 public MP4 video URL up to 100 MB, call `POST /x/tweets` directly with `media`.',
  'Do not send `media_ids` to `POST /x/tweets`',
  '10 credits per upload call',
  'Posting the tweet, posting the reply, or sending the DM is a separate 10-credit write call.',
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
  'title: "Upload media"',
  'post tweet with media',
  'post tweet replies with media',
  'send DM with media',
  '## Media upload handoff',
  '`POST /x/media`',
  'local file or hosted HTTPS media URL',
  '<Card title="mediaUrl" icon="image">',
  'Store `mediaUrl` for tweet and reply attachments.',
  'Pass it in the `media`',
  '<Card title="mediaId" icon="paperclip">',
  'Store `mediaId` for direct message attachments.',
  'Pass it as the only item in',
  '<Card title="success" icon="circle-check">',
  'Store `success` to confirm the upload completed',
  '<Card title="account" icon="user">',
  'Store the `account` you submitted',
  '<Card title="Source input" icon="file-image">',
  'Store the source URL or filename',
  'Skip this endpoint when a tweet or reply already has public HTTPS image URLs or a public MP4 URL.',
  'Use `POST /x/media` only when Xquik must host a local file, validate a generated media URL, or return a `mediaId` for one-item DM `media_ids`.',
  'Tweets use the returned `mediaUrl`; DMs use the returned `mediaId`.',
  'The file and URL examples both build the same handoff shape.',
  'const result = await response.json();',
  'const handoff = {',
  'media_id: result.mediaId',
  'dm_media_ids: [result.mediaId]',
  'tweet_media_url: result.mediaUrl',
  'result = response.json()',
  '"media_id": result["mediaId"]',
  '"dm_media_ids": [result["mediaId"]]',
  'type UploadMediaResponse struct',
  'MediaID string `json:"mediaId"`',
  '"tweet_media_url": upload.MediaURL',
  'For tweets with already-public image URLs or exactly 1 public MP4 video URL up to 100 MB, skip this endpoint and call [`POST /x/tweets`](/api-reference/x-write/create-tweet) directly with `media`.',
  'After uploading through this endpoint, call `POST /x/tweets` and pass `media: ["<mediaUrl>"]`.',
  'To post a media reply, also pass `reply_to_tweet_id`.',
  'Do not send `media_ids` to `POST /x/tweets`; that endpoint returns `400 unsupported_field`',
  'For DMs, call [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm) after upload and pass `media_ids: ["<mediaId>"]`.',
  'DMs accept exactly 1 uploaded media ID.',
  'resolve to a public address',
  '15,728,640 bytes',
  '422 media_download_failed',
  'Posting the tweet, posting the reply, or sending the DM is a separate 10-credit write call.',
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
  'Download media',
  'Use this endpoint to turn one tweet, or up to 50 tweet URLs or IDs, into a',
  'saved media gallery.',
  'The response gives a `galleryUrl` plus cache or bulk',
  'it does not return per-file downloads, file metadata, or an uploaded',
  '`mediaId`.',
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
  '<Card title="JSON Lines" icon="file-json">',
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
  '<Card title="Test payload checkpoint" icon="file-json">',
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
  'update_endpoint: ("/api/v1/webhooks/" + .id)',
  'delete_endpoint: ("/api/v1/webhooks/" + .id)',
  'test_endpoint: ("/api/v1/webhooks/" + .id + "/test")',
  'deliveries_endpoint: ("/api/v1/webhooks/" + .id + "/deliveries")',
  'const webhookRows = data.webhooks.map((webhook) => ({',
  'webhook_id: webhook.id',
  'event_types: webhook.eventTypes',
  'update_endpoint: `/api/v1/webhooks/${webhook.id}`',
  'delete_endpoint: `/api/v1/webhooks/${webhook.id}`',
  'test_endpoint: `/api/v1/webhooks/${webhook.id}/test`',
  'deliveries_endpoint: `/api/v1/webhooks/${webhook.id}/deliveries`',
  'signing_secret_available: false',
  'webhook_rows = [',
  '"webhook_id": webhook["id"]',
  '"event_types": webhook["eventTypes"]',
  '"update_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}"',
  '"delete_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}"',
  '"test_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/test"',
  '"deliveries_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/deliveries"',
  '"signing_secret_available": False',
  'type WebhookRow struct',
  'UpdateEndpoint         string   `json:"update_endpoint"`',
  'DeleteEndpoint         string   `json:"delete_endpoint"`',
  'SigningSecretAvailable bool     `json:"signing_secret_available"`',
  'encoder.Encode(row)',
  'one inventory row per webhook',
  'Split the rows by `is_active`',
  'store update, delete, test,',
  'List responses never include the',
  'Store `webhooks[].id` for updates, deletes, test deliveries, and delivery',
  'Store `webhooks[].url` so configuration reviews can detect stale receiver',
  'Store `webhooks[].eventTypes` and compare it with monitor event types',
  'expecting `tweet.new`, `tweet.quote`, `tweet.reply`, or `tweet.retweet`.',
  'Store `webhooks[].isActive`; inactive webhooks do not receive monitor',
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
  '`webhook_inactive` means no test was sent.',
  '[Update Webhook](/api-reference/webhooks/update)',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and',
  '`X-Xquik-Nonce` on the raw request body',
  'The webhook must be active.',
  'Xquik returns',
  '`webhook_inactive` and sends no test request.',
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
] as const;

const FORBIDDEN_WEBHOOK_TEST_RAW_OUTPUT_SNIPPETS = [
  'console.log(result);',
  'print(result)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_UPDATE_API_SNIPPETS = [
  'webhook_id: .id',
  'test_endpoint: ("/api/v1/webhooks/" + .id + "/test")',
  'deliveries_endpoint: ("/api/v1/webhooks/" + .id + "/deliveries")',
  'const updateHandoff = {',
  'test_endpoint: `/api/v1/webhooks/${webhook.id}/test`',
  'deliveries_endpoint: `/api/v1/webhooks/${webhook.id}/deliveries`',
  'update_handoff = {',
  '"test_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/test"',
  '"deliveries_endpoint": f"/api/v1/webhooks/{webhook[\'id\']}/deliveries"',
  'type UpdateHandoff struct',
  'DeliveriesEndpoint string   `json:"deliveries_endpoint"`',
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
  'Store returned `id`, `url`, `eventTypes`, `isActive`, and `createdAt`',
  'After changing `url`, run [Test Webhook](/api-reference/webhooks/test)',
  '`eventTypes` replaces the previous list.',
  '`isActive: false` stops future deliveries.',
  '`isActive: true` resumes delivery for matching future monitor events.',
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
  'Webhooks deliver events from account or keyword monitors to your server in real time.',
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
  '"handoff_state": "receiver_fixed_page_events_join_deliveries"',
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
  '"handoff_state": "verify_signature_check_delivery_join_event"',
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
  '120 documented operations at `https://xquik.com/api/v1/*`',
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
  '<Card title="Stored hash" icon="shield-check">',
  'Xquik stores the SHA-256 key hash and display prefix',
  '<Card title="Revocation" icon="ban">',
  'Revoked or inactive keys stop authenticating immediately',
  '<Card title="Audit trail" icon="clock">',
  'Successful API-key checks update `lastUsedAt`',
  '<Card title="OAuth 2.1" icon="lock-keyhole">',
  '[OAuth 2.1 with S256 PKCE](/oauth/overview)',
  '<Card title="Session auth" icon="cookie">',
  'API-key creation and revocation',
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
  '`GET`, `HEAD`, and `OPTIONS` share a standard user limit of 10 requests per',
  '<Card title="Write bucket" icon="pen-line">',
  '`POST`, `PUT`, and `PATCH` share a standard user limit of 30 requests per',
  '<Card title="Delete bucket" icon="circle-x">',
  '`DELETE` requests are limited to 15 requests per 60 seconds.',
  '<Card title="Retry window" icon="timer">',
  'Throttled reads return `Retry-After: 1`; throttled writes and deletes',
] as const;

const REQUIRED_ARCHITECTURE_BILLING_SNIPPETS = [
  '<Card title="Subscriptions" icon="credit-card">',
  'Starter, Pro, and Business plans run from USD 20 to USD 199 per month',
  'include monthly credits.',
  '<Card title="Active monitors" icon="radio">',
  'Monitor slots are unlimited. Active instant monitors check every 1 second',
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
  '<Card title="Subscription-gated work" icon="lock-keyhole">',
  'Tweet search, user and follower lookup, article lookup, media download,',
  'trends, draw creation, and publish actions require an active subscription.',
  '<Card title="Free management paths" icon="list-check">',
  'List, read, update, delete, export, test, and delivery-history paths stay',
  'free for draws, extractions, monitors, events, and webhooks.',
  '<Card title="Free utilities" icon="sparkles">',
  'Compose, cached styles, drafts, radar, account, API keys, X accounts,',
  'support, credit balance, and credit top-up endpoints are free.',
] as const;

const REQUIRED_ARCHITECTURE_LIMITATION_SNIPPETS = [
  '<Card title="Single region" icon="map-pin">',
  'Do not assume',
  'multi-region',
  'replication.',
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
  'Active instant monitors check every 1 second',
  'cost 21 credits per active monitor-hour.',
] as const;

const FORBIDDEN_ARCHITECTURE_LIMITATION_SNIPPETS = [
  '| Limitation | Detail |',
  '|------------|--------|',
  '| **Bookmarked tweets** | Bookmarks require an authenticated X account connection |',
  '| **Export cap** | File exports are capped at 100,000 rows per extraction (10,000 for PDF). Formats: CSV, JSON, MD, MD Document, PDF, TXT, XLSX |',
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
  'Get DM history',
  'GET /x/dm/{userId}/history',
  'Read participant-scoped X direct message history with a connected account, store private rows, and resume older pages with next_cursor',
  'Twitter DM history API',
  'X DM history API',
  'Use this endpoint to sync participant-scoped DM pages before a support, CRM,',
  'Pass the connected participant account in',
  'store message IDs plus `next_cursor`',
  'keep full message text only',
  'Requires a connected X account passed via the `account` query parameter.',
  'DM history is participant-scoped',
  'DM history requires a connected participant account.',
  'DM history responses can contain private message text.',
  'Do not write full DM bodies to shared logs or public artifacts.',
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
  'The examples normalize each page into private `dm_history` rows. Store',
  '`message_id`, `sender_id`, `receiver_id`, `message_text`, `created_at`,',
  'optional `media_url`, `conversation_user_id`, `sender_account`, and',
  '`page_next_cursor`.',
  'Keep `message_text` only in private systems',
  '<ParamField query="account" type="string" required>',
  'Pass the `next_cursor` value from the previous response to fetch older messages.',
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
  '1 credit per result returned',
  '## History sync handoff',
  'Store `messages[].id` as the external DM ID',
  'Store `messages[].senderId` and `messages[].receiverId`',
  'Store `next_cursor` when `has_next_page` is true',
  'Store optional `messages[].mediaUrl` with `messages[].createdAt`',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  '[Get User](/api-reference/x/get-user)',
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
  'title: "Send DM"',
  'Twitter DM API',
  'X direct message API',
  'send DM with media',
  'messageId',
  'Send a text DM from one connected X account to the recipient `userId`.',
  'For media DMs, upload first with `POST /x/media`, pass the returned `mediaId` as the only `media_ids` item, and store the returned `messageId`.',
  'Use public media URLs with `POST /x/tweets`; this DM endpoint accepts one uploaded media ID instead.',
  'const uploadedMediaId = "1893726451023847424";',
  'const mediaIds = [uploadedMediaId];',
  'media_ids: mediaIds,',
  'const dmHandoff = {',
  'message_id: result.messageId',
  'media_ids: mediaIds,',
  'source_endpoint: `/api/v1/x/dm/${recipientUserId}`',
  'process.stdout.write(`${JSON.stringify(dmHandoff)}\\n`);',
  'uploaded_media_id = "1893726451023847424"',
  'media_ids = [uploaded_media_id]',
  '"media_ids": media_ids,',
  'dm_handoff = {',
  '"message_id": result["messageId"]',
  '"media_ids": media_ids,',
  '"source_endpoint": f"/api/v1/x/dm/{recipient_user_id}"',
  'print(json.dumps(dm_handoff))',
  'uploadedMediaID := "1893726451023847424"',
  'uploadedMediaIDs := []string{uploadedMediaID}',
  'MediaIDs []string `json:"media_ids,omitempty"`',
  'MediaIDs       []string `json:"media_ids"`',
  'MediaIDs: uploadedMediaIDs,',
  'type SendDmResult struct {',
  'type DmHandoff struct {',
  'SourceEndpoint string  `json:"source_endpoint"`',
  'json.NewEncoder(os.Stdout).Encode(handoff)',
  'The Node.js, Python, and Go examples convert the response into one DM send row.',
  'Store `message_id`, `user_id`, `account`, `send_status`, optional `media_id`,',
  '`media_ids`, and `source_endpoint`.',
  'For media DMs, keep `media_ids` as the',
  'one-item request array',
  'passed as that single item.',
  'Non-empty message text to send.',
  'returns `422 x_content_too_long`.',
  '## Send with media',
  'Upload media first with [Upload Media](/api-reference/x-write/upload-media)',
  '`media_ids` must contain exactly one uploaded media ID.',
  'Empty arrays, multiple IDs, and `reply_to_message_id` return `400 invalid_input`.',
  'Generated SDKs can expose `reply_to_message_id`',
  'Leave it unset.',
  'the returned `messageId` with that media ID.',
  '### Media DM result handoff',
  'After the media DM send returns `200 OK`',
  '"record_type": "dm_media_send"',
  '"message_id": "1893726451029384192"',
  '"media_id": "1893726451023847424"',
  'Keep `media_ids` as a one-item array in the request',
  'use `message_id` as the external DM identifier',
  '## Direct message handoff',
  'support, sales, community, CRM, or agent workflow',
  '[`GET /x/users/{id}`](/api-reference/x/get-user)',
  '[`GET /x/dm/{userId}/history`](/api-reference/x/dm-history)',
  'Store `messageId` as the external message ID for support logs, CRM records, queues, or agent memory.',
  'Mark the send job complete after a `200 OK` response.',
  'Keep the recipient X user ID from the path with the send job.',
  'Store the connected X account that sent the DM.',
  'Store the exact message text sent. Add your own `sent_at` timestamp when downstream systems need it.',
  'Store the uploaded media ID when the DM includes one attachment from [`POST /x/media`](/api-reference/x-write/upload-media).',
  'This endpoint costs 10 credits per send.',
  'Uploading media first with `POST /x/media` is a separate 10-credit call.',
  '`x_dm_not_allowed`',
  'the recipient may not accept messages from this connected account; do not retry unchanged.',
  'Do not retry `422 x_dm_not_allowed` unchanged',
  'Empty arrays and multiple IDs are rejected.',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  '[Get DM History](/api-reference/x/dm-history)',
  '[Upload Media](/api-reference/x-write/upload-media)',
  'to create the one `mediaId` allowed in `media_ids`.',
] as const;

const FORBIDDEN_SEND_DM_API_SNIPPETS = [
  'const data = await response.json();',
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
  '`compose` returns algorithm rules, follow-up questions, and an `intentUrl` built from the topic',
  'Compose responses can include `savedStyles`, `styleTweets`, or `styleNote` depending on the cached style state.',
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
  '- **Follower export:** `POST /extractions/estimate`.',
  '`follower_explorer` estimate',
  '- **Campaign verification:** `GET /x/followers/check`, retweeters, replies, quotes, or draws.',
  'Handoff: proof exports',
  '- **Direct messages:** `GET /x/dm/{userId}/history`.',
  'outbound `messageId`, and success',
  '- **Real-time monitoring:** `POST /monitors` or `POST /monitors/keywords`.',
  'Signed webhook payloads and delivery IDs',
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
  '### 3. Export followers to CRM or warehouse',
  '`follower_explorer`',
  '`x_user_id`',
  '1 credit per follower returned',
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
  '`202 x_write_unconfirmed` with `writeActionId`',
  'Use `POST /x/media` only when you need a one-item `media_ids` array for [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm).',
  '10 credits text-only, plus 2 credits per started MB across attached media',
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
  '10 credits text-only, plus 2 credits per started MB across attached media',
  '`POST /compose` with `step`',
  'CSV, JSON, XLSX, or paginated JSON',
  '21 credits per hour',
  'Compose, refine, and score are free',
  '## Focused Workflow Pages',
  'Use the overview to choose the path, then move to the focused page for copy-ready examples, SDK handoff, and endpoint-specific error recovery.',
  '<Card title="Tweet search exports" icon="search" href="/guides/tweet-search-export">',
  'Build CSV, JSON, or XLSX exports from `tweet_search_extractor`, or use direct `GET /x/tweets/search` pagination.',
  '<Card title="Tweet replies exports" icon="messages-square" href="/guides/tweet-replies-export">',
  '<Card title="Follower CRM export" icon="users" href="/guides/follower-export-crm">',
  '<Card title="Campaign verification" icon="badge-check" href="/guides/campaign-verification-workflow">',
  'Check social actions and draw exports.',
  '<Card title="Monitor webhooks" icon="webhook" href="/guides/webhook-testing">',
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
  'title: Campaign Verification Workflow',
  'Verify X campaign participation with follow checks, retweeters, replies, quotes, giveaway draws, and exportable audit rows.',
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
  '## Follow Check',
  'participant_handle',
  '## Tweet-Level Checks',
  'Pass `next_cursor` back',
  'as `cursor`',
  '## Giveaway Draw',
  '"tweetUrl": "https://x.com/xquikcom/status/1893704267862470862"',
  '"winnerCount": 3',
  '"uniqueAuthorsOnly": true',
  '"mustRetweet": true',
  '"mustFollowUsername": "xquikcom"',
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
  'title: Target Audience Discovery Workflow',
  'Find X audience segments with user search, follower exports, following pages, verified followers, batch enrichment, and CSV or JSON handoff.',
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
  '"targetUsername": "xquikcom"',
  '"resultsLimit": 5000',
  'target-audience.csv',
  '## Direct JSON Pages',
  '/api/v1/x/users/xquikcom/followers?pageSize=200',
  '/api/v1/x/users/xquikcom/following?pageSize=200',
  '/api/v1/x/users/44196397/verified-followers',
  'Store `has_next_page` and `next_cursor`',
  'as `cursor` only when `has_next_page` is true.',
  '## Score Rows',
  '"audience_id": "ai-founder-q2"',
  '"source_route": "GET /api/v1/x/users/{id}/followers"',
  '## Validate Active Conversation',
  '/api/v1/x/tweets/search?q=ai%20founder%20min_faves%3A10&verifiedOnly=true',
  '## Cost and Retry Notes',
  'Estimate extraction jobs before running large follower, following, verified',
  'Direct JSON pages are metered by returned user or tweet rows.',
  'Treat cursors as opaque route checkpoints.',
] as const;

const REQUIRED_BRAND_MONITORING_WORKFLOW_SNIPPETS = [
  'title: Brand Monitoring Workflow',
  'Monitor brand accounts, search queries, mentions, and campaign terms with 1-second X monitors, signed webhooks, stored events, and replay-safe rows.',
  '## Pick the Monitor Path',
  '<Card title="Account Monitor" icon="radio">',
  '`POST /api/v1/monitors`',
  '<Card title="Keyword Monitor" icon="search">',
  '`POST /api/v1/monitors/keywords`',
  '<Card title="Signed Webhook" icon="webhook">',
  '`POST /api/v1/webhooks`',
  '<Card title="Stored Event Replay" icon="database">',
  '`GET /api/v1/events`',
  '## Create an Account Monitor',
  '"username": "xquikcom"',
  '"eventTypes": ["tweet.new", "tweet.reply", "profile.bio.changed"]',
  'Store the returned `id`, `username`, `xUserId`, `eventTypes`, `isActive`,',
  '## Create a Keyword Monitor',
  'Keep the query under 160 characters',
  '"query": "\\"Xquik\\" OR @xquikcom"',
  '## Deliver Events to a Webhook',
  'Store the returned `secret` once',
  '`deliveryId`, `streamEventId`, `eventType`, `timestamp`,',
  '## Replay Stored Events',
  '/api/v1/events?monitorId=42&eventType=tweet.new&limit=50',
  '/api/v1/events?keywordMonitorId=21&eventType=tweet.new&limit=50',
  'Store `hasMore` and `nextCursor`.',
  '## Add Search Backfill',
  '/api/v1/x/tweets/search?q=%22Xquik%22%20OR%20%40xquikcom&limit=50',
  '/api/v1/x/users/xquikcom/mentions?limit=50',
  '## Receiver Row',
  '"brand_monitor_id": "brand-xquik-q2"',
  '"monitor_type": "keyword"',
  '"keyword_monitor_id": "21"',
  '"event_replay_route": "GET /api/v1/events?keywordMonitorId=21"',
  'endpoint signing values, raw request bodies, raw signatures, or full',
  '## Cost and Retry Notes',
  'Active account and keyword monitors check every 1 second and cost 21 credits',
  'Stored event listing is free.',
  'Pause inactive monitors with `PATCH /api/v1/monitors/{id}`',
] as const;

const REQUIRED_NO_CODE_WORKFLOW_HANDOFF_SNIPPETS = [
  'title: No-Code Workflow Handoff',
  'Connect Xquik monitor webhooks, extraction jobs, tweet search pages, and follower exports to Zapier, Make, Pipedream, n8n, Sheets, CRM, and queue workflows.',
  '## Pick the Handoff Lane',
  '<Card title="Instant Monitor Events" icon="radio">',
  '`POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`',
  '`POST /api/v1/webhooks`',
  '<Card title="Bulk Export Jobs" icon="database">',
  '`POST /api/v1/extractions`',
  'export CSV, JSON, or XLSX',
  '<Card title="Direct Read Pages" icon="search">',
  '`GET /api/v1/x/tweets/search`',
  '<Card title="Replay and Repair" icon="history">',
  '`GET /api/v1/events` and `GET /api/v1/webhooks/{id}/deliveries`',
  '## Instant Monitor Trigger',
  '/api/v1/webhooks/15/test',
  '`deliveryId` as the per-endpoint retry key',
  'and `streamEventId` when one',
  '## Bulk Export Trigger',
  '/api/v1/extractions?status=completed&limit=25',
  '/api/v1/extractions/77777/export?format=csv',
  'Store `job.id`, `job.toolType`, `job.status`, `hasMore`, and `nextCursor`',
  '## Direct Read Loop',
  '/api/v1/x/tweets/search?q=xquik%20min_faves%3A10&limit=50',
  '/api/v1/x/users/xquikcom/followers?pageSize=200',
  '## Shared Row Shape',
  '"handoff_lane": "instant_monitor"',
  '"retry_key": "delivery_id:502"',
  '"event_dedupe_key": "stream_event_id:9002"',
  '"replay_route": "GET /api/v1/events?after=9002"',
  'Keep API keys, endpoint signing values, raw request bodies, raw signatures, and',
  '## Platform Notes',
  '<Card title="Zapier" icon="zap" href="/guides/zapier">',
  '<Card title="Make" icon="route" href="/guides/make">',
  '<Card title="Pipedream" icon="code" href="/guides/pipedream">',
  '<Card title="n8n" icon="workflow" href="/guides/n8n">',
  '## Cost and Retry Notes',
  'Active account and keyword monitors check every 1 second and cost 21 credits',
  'Extraction jobs return `202` with `id`, `toolType`, and `status`.',
] as const;

const REQUIRED_REQUEST_EFFICIENT_API_USAGE_SNIPPETS = [
  'title: Request-efficient API usage',
  'Use this guide when you need fewer duplicate reads, cleaner checkpoints, and better downstream handoffs.',
  'Quick answer: batch known IDs, use profile timelines for one user, use tweet search for keywords, use home timeline for the connected account feed, and use extraction jobs for saved CSV/JSON/XLSX files.',
  'Use `GET /api/v1/x/tweets?ids=...` for up to 100 comma-separated tweet IDs in one request.',
  'Use `GET /api/v1/x/users/batch?ids=...` for up to 100 comma-separated user IDs in one request.',
  'Use `GET /api/v1/x/users/{id}/tweets` for one user\'s profile timeline.',
  'Use `GET /api/v1/x/tweets/search` for keywords, hashtags, operators, date filters, and advanced search pages.',
  'Use `GET /api/v1/x/timeline` for the connected account\'s home timeline.',
  'Use `/x/users/{id}/tweets` for one user\'s profile timeline.',
  'Use `/x/tweets/search` for keyword or advanced search.',
  'Use `/x/timeline` for the authenticated home timeline.',
  'Call `POST /api/v1/extractions/estimate` with the same target and `resultsLimit` you plan to run.',
  'Call `GET /api/v1/extractions/{id}/export?format=csv`, `format=json`, or `format=xlsx` for file handoff.',
  'For X data pages, pass `next_cursor` back as `cursor`.',
  'For stored extraction JSON pages, pass `nextCursor` as `after`.',
  'Do not decode or construct cursors manually.',
  'For tweet posts, pass public image URLs or one public MP4 URL in `media` on `POST /api/v1/x/tweets`.',
  'Use `POST /api/v1/x/media` when you need an uploaded `mediaId` for the one-item `media_ids` array on `POST /api/v1/x/dm/{userId}`.',
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
  'monitor tweets',
  'signed webhooks',
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
  'The cURL, Node.js, Python, and Go examples convert the created or reactivated',
  'account monitor into one state row.',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before routing alerts.',
  '## Account monitor handoff',
  '`POST /monitors`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '<Card title="Monitor ID" icon="fingerprint">',
  'Store `id` as `monitor_id`.',
  '[Get Monitor](/api-reference/monitors/get)',
  '[Update Monitor](/api-reference/monitors/update)',
  '[Delete Monitor](/api-reference/monitors/delete)',
  '<Card title="Stored Account" icon="user">',
  'Store `username` after trimming the `@` prefix and `xUserId`',
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
  'Active account monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Creation or reactivation requires 22 available credits: 1 credit for the username lookup plus 21 credits for the first active monitor hour.',
  '<Card title="tweet.new" icon="bell">',
  'retweet signal is present.',
  '<Card title="tweet.quote" icon="quote">',
  'should create stored events and webhook deliveries.',
  '<Card title="tweet.reply" icon="message-circle">',
  'conversation tracking, or alerting needs replies.',
  '<Card title="tweet.retweet" icon="repeat-2">',
  'create stored events and webhook deliveries.',
  '`PATCH /monitors/{id}`',
  '"message": "Monitor already exists."',
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_CREATE_RAW_OUTPUT_SNIPPETS = [
  "'}' | jq",
  'const data = await response.json();',
  'JSON.stringify(data, null, 2)',
  'data = response.json()',
  'print(data)',
  'fmt.Println(data)',
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
  'The Node.js, Python, and Go examples convert the fetched account monitor',
  'one state snapshot row.',
  '`monitor_id`, `event_types`, `is_active`,',
  '`next_billing_at`, `update_endpoint`, `events_endpoint`,',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before changing filters',
  '## State handoff',
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
] as const;

const FORBIDDEN_ACCOUNT_MONITOR_GET_RAW_OUTPUT_SNIPPETS = [
  '-H "x-api-key: xq_YOUR_KEY_HERE" | jq',
  'const data = await response.json();',
  'data = response.json()',
  'fmt.Println(data)',
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
  'The Node.js, Python, and Go examples convert each account monitor into one',
  'inventory row.',
  '`monitor_id`, `username`, `x_user_id`, `event_types`,',
  '`is_active`, `next_billing_at`, `monitor_detail_endpoint`, `events_endpoint`,',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` for backfills',
  '## Inventory handoff',
  'Use `GET /monitors` after create, update, pause, or delete operations',
  'your account monitor inventory.',
  'up to 200 monitors ordered',
  '`total` count for the returned set.',
  '<Card title="Tracked Accounts" icon="users">',
  "Store each monitor's `id`, `username`, and `xUserId`",
  'warehouse, or queue records.',
  '<Card title="Detail Handoff" icon="file-search">',
  '[Get Monitor](/api-reference/monitors/get)',
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
  'workflow needs the full tweet',
  '<Card title="Delivery Audit" icon="link">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'delivery `streamEventId` to event IDs.',
  'Do not use `x_event_id` as',
  '<Card title="State Repair" icon="sliders-horizontal">',
  '[Update Monitor](/api-reference/monitors/update)',
  'replace `eventTypes`',
  'toggle `isActive`.',
  '[Delete Monitor](/api-reference/monitors/delete)',
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
  'The Node.js, Python, and Go examples convert the updated account monitor into',
  'one state row.',
  '`monitor_id`, `event_types`, `is_active`,',
  '`next_billing_at`, `verify_endpoint`, `list_endpoint`, `events_endpoint`,',
  '`event_detail_endpoint_pattern`, `webhooks_endpoint`, and',
  '`deliveries_endpoint_pattern` before resuming alerts',
  'monitors do not consume hourly monitor credits.',
  '## Update handoff',
  'Use this endpoint when an account alert changes event scope',
  'Store returned `id`, `username`, `xUserId`, `eventTypes`, `isActive`,',
  '`createdAt`, and `nextBillingAt` as the current account monitor',
  'configuration.',
  '<Card title="Inventory Sync" icon="list-checks">',
  '[List Monitors](/api-reference/monitors/list)',
  '[Get Monitor](/api-reference/monitors/get)',
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
  '<Card title="Permanent Remove" icon="trash-2">',
  'Delete removes the account monitor. Store returned `success` before treating',
  'the deleted ID as permanently removed.',
  'The deleted ID cannot be fetched,',
  'updated, resumed, or billed again.',
  '<Card title="Stored History" icon="database">',
  'Stored events and webhook delivery records tied to this account monitor',
  'when support or',
  'audit workflows need history.',
  '<Card title="Event Audit" icon="list-tree">',
  '[List Events](/api-reference/events/list)',
  '[Get Event](/api-reference/events/get)',
  '<Card title="Delivery Audit" icon="activity">',
  '[List Deliveries](/api-reference/webhooks/deliveries)',
  'Join delivery',
  '`streamEventId` to event IDs.',
  'Do not use `x_event_id` as',
  '<Card title="Pause Instead" icon="circle-pause">',
  'Use `PATCH /monitors/{id}` with `isActive: false`',
  'while preserving the monitor record.',
  '<Card title="Verify Removal" icon="list-checks">',
  '[List Monitors](/api-reference/monitors/list)',
  '[Get',
  'Monitor](/api-reference/monitors/get)',
  'return `404` for the deleted',
  '<Card title="Track New Account" icon="user-plus">',
  'Store the new',
  '`id`, `username`, `xUserId`, `eventTypes`, `isActive`, and `nextBillingAt`.',
  '<Card title="Webhook Reuse" icon="webhook">',
  'Existing webhook endpoints remain configured.',
  '[List Webhooks](/api-reference/webhooks/list)',
  '[Test Webhook](/api-reference/webhooks/test)',
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
  '## Integration Shape',
  '<Card title="Auth" icon="key-round">',
  'API key field named `apiKey`, injected as `x-api-key`.',
  '<Card title="Base URL" icon="link">',
  '`https://xquik.com/api/v1`',
  '<Card title="Request Helper" icon="workflow">',
  'JSON requests, structured Xquik errors, and `Retry-After` handling.',
  '<Card title="Actions" icon="play">',
  'Search Tweets, Get Tweet, Get User, Get Trends, Create Tweet, Create Reply,',
  'Create Extraction, Create Monitor, and Create Webhook.',
  '<Card title="Triggers" icon="radio">',
  'New Matching Tweet polling, Monitor Event instant trigger, Extraction',
  'Completed polling, and Webhook Delivery Failure polling.',
  '## Starter Actions',
  '<Card title="Search Tweets" icon="search">',
  'Call `GET /x/tweets/search` with `q`; use `cursor` for page loops and keep `limit` on bounded resumes.',
  '<Card title="Get Tweet" icon="message-square">',
  'Call `GET /x/tweets/{id}` with a tweet ID.',
  '<Card title="Get User" icon="user">',
  'Call `GET /x/users/{id}` with a user ID.',
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
  'Use snake_case storage keys for handoff rows even when direct API responses use camelCase.',
  '<Card title="Search Tweets action" icon="search">',
  'Return tweet rows with `id`, `text`, `author__username`, `createdAt`, and optional `url`;',
  'store `tweet_id`, `author_username`, `created_at`, `has_next_page`, and `next_cursor` when a Zap loops pages.',
  '<Card title="User profile rows" icon="users">',
  'Return source `id` as `user_id`, plus `username`, `name`, `followers`, `verified`, `profile_picture`, `has_next_page`, `next_cursor`, and the lookup or search input.',
  '<Card title="Trend rows" icon="trending-up">',
  'Return each trend `name`, `rank`, `query`, and `description`. Keep response `count`, `woeid`, and the selected region with the Zap run.',
  '<Card title="Tweet or Reply write" icon="send">',
  'Return `tweetId`, `charged`, and `chargedCredits` on `200 Success`; store them as `tweet_id`, `charged`, and `charged_credits`.',
  'For `202 x_write_unconfirmed`, store `write_action_id`, `status`, `charged`, and `charged_credits`, then poll `GET /x/write-actions/{id}` before retrying.',
  '<Card title="Media attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media`; do not send `media_ids`.',
  'For DMs, upload first, pass 1 `media_id` in `media_ids`, store `message_id`, and leave `reply_to_message_id` unset.',
  '<Card title="Monitor and webhook setup" icon="radio">',
  'Return monitor `id`, `username`, `xUserId`, `eventTypes`, `isActive`, and `nextBillingAt`;',
  'return webhook `id`, `url`, `eventTypes`, and one-time `secret`.',
  'For Zap storage rows, map production `deliveryId` to `delivery_id` for receiver retry de-dupe and `streamEventId` to `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="REST Hook trigger" icon="fingerprint">',
  'Return `id`, `deliveryId`, and `streamEventId`;',
  'choose `deliveryId` for endpoint retry de-dupe or `streamEventId` when one monitor event should process once across webhook changes.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /events` with `after` when a Zap needs replay.',
  'Map `id`, `monitorId`, `monitorType`, `occurredAt`, `hasMore`, and `nextCursor` to `event_id`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`.',
  '<Card title="Receiver acceptance" icon="copy-check">',
  'Return `2xx` after accepting duplicate `deliveryId` or `streamEventId`;',
  'keep endpoint signing values, raw request body, raw signature, and full headers out of Zap history, tables, Slack messages, CRM rows, and retry queues.',
  '<Card title="Extraction polling trigger" icon="database">',
  'Return completed job `id`, `toolType`, and `status`; store `extraction_id`, `tool_type`, `status`, `has_more`, and `next_cursor` before batch Zaps fetch detail rows.',
  '## Test Coverage',
  '<Card title="Auth Header Injection" icon="shield-check">',
  'Every request includes `x-api-key` from `bundle.authData.apiKey`.',
  '<Card title="Invalid Key" icon="key-round">',
  '`401` returns "Authentication failed. Check the Xquik API key."',
  '<Card title="Rate Limit" icon="timer">',
  '`429` includes `Retry-After` in the user-facing message when present.',
  '<Card title="REST Hook Subscribe" icon="webhook">',
  '`POST /webhooks` sends `bundle.targetUrl` and selected event types.',
  '<Card title="REST Hook Unsubscribe" icon="radio">',
  '`DELETE /webhooks/{id}` uses `bundle.subscribeData.id`.',
  '<Card title="Sample Output" icon="database">',
  'Trigger samples include `id`, `eventType`, `occurredAt`, tweet text, and author username.',
  '<Card title="Search Action" icon="search">',
  'Search returns an array of tweets with stable IDs.',
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
  'Export `tweet_id`, `charged`, and `charged_credits` on `200 Success`.',
  'For `202 x_write_unconfirmed`, export `write_action_id`, `status`, `charged`, and `charged_credits`, then poll `GET /x/write-actions/{id}` before retrying.',
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
  'Use the [`prefect-xquik`](https://github.com/Xquik-dev/prefect-xquik) collection',
  'The current `0.1.5` release is read-focused.',
  'https://github.com/Xquik-dev/prefect-xquik/releases/download/v0.1.5/prefect_xquik-0.1.5-py3-none-any.whl',
  'prefect block register -m prefect_xquik',
  'credentials = XquikCredentials(',
  'base_url="https://xquik.com/api/v1"',
  '## Scheduled Workflows',
  '<Card title="Social Listening" icon="search">',
  'Schedule `search_tweets` to collect recent or top posts for a saved query',
  '<Card title="Profile Enrichment" icon="users">',
  'Use `search_users` and `get_user` to enrich customer, creator, or competitor records',
  '<Card title="Timeline Refresh" icon="list">',
  'Run `get_user_tweets` on a schedule to refresh public timelines with optional replies and parent-tweet context.',
  '<Card title="Trend Alerts" icon="trending-up">',
  'Call `get_trends` for worldwide or regional topics before downstream alert, dashboard, or warehouse steps.',
  '## Collection Shape',
  '<Card title="Credentials" icon="key-round">',
  '`XquikCredentials` stores the API key, base URL, contract header, and timeout.',
  '<Card title="Client" icon="terminal">',
  '`XquikClient` uses `httpx.AsyncClient`, sends `x-api-key`, and raises `XquikError` for request or response failures.',
  '<Card title="Tasks" icon="workflow">',
  '6 async Prefect tasks cover read workflows for tweets, users, user timelines, and trends.',
  '<Card title="Scope" icon="shield-check">',
  'Version `0.1.5` is read-only. Use REST, SDKs, or MCP for writes, monitors, webhooks, and extraction jobs.',
  '## Tasks',
  '<Card title="Search Tweets" icon="search">',
  '`search_tweets(credentials, query, limit=25, query_type="Latest")` calls `GET /x/tweets/search`.',
  '<Card title="Get Tweet" icon="message-square">',
  '`get_tweet(credentials, tweet_id)` calls `GET /x/tweets/{id}`.',
  '<Card title="Search Users" icon="users">',
  '`search_users(credentials, query, cursor=None)` calls `GET /x/users/search`.',
  '<Card title="Get User" icon="user-round">',
  '`get_user(credentials, user_id)` calls `GET /x/users/{id}`.',
  '<Card title="Get user timeline" icon="list">',
  '`get_user_tweets(credentials, user_id, include_replies=False)` calls `GET /x/users/{id}/tweets`.',
  '<Card title="Get Trends" icon="trending-up">',
  '`get_trends(credentials, woeid=1, count=30)` calls `GET /x/trends`.',
  '## Result Handoff',
  '<Card title="Tweet Pages" icon="message-square">',
  '`search_tweets` and `get_user_tweets` return `tweets`, `has_next_page`, and `next_cursor`.',
  '<Card title="User Pages" icon="users">',
  '`search_users` returns `users`, `has_next_page`, and `next_cursor`. `get_user` returns one public profile dictionary with fields such as `id`, `username`, `name`, `followers`, `verified`, and `profilePicture`.',
  '<Card title="Trend Pages" icon="trending-up">',
  '`get_trends` returns `trends`, `count`, and `woeid`.',
  '<Card title="Downstream Rows" icon="table">',
  'Normalize raw dictionaries in a follow-up task before writing to Slack, Sheets, a warehouse, or a dashboard.',
  'Keep `tweet_rows` with `id`, `text`, `author.username`, `createdAt`, and `url`; `user_rows` with `id`, `username`, `name`, `followers`, `verified`, and `profilePicture`; and `trend_rows` with `name`, `rank`, `query`, and `description`.',
  '## REST and MCP Handoff',
  'When a Prefect flow needs writes, monitors, webhooks, event replay, or extraction jobs, keep the `prefect-xquik` task scope focused on reads.',
  'normalize REST camelCase fields to compact snake_case handoff rows',
  '<Card title="Tweet or Reply Write" icon="send">',
  'Pass public image or MP4 URLs in `media`; do not send `media_ids`.',
  'Store confirmed `tweet_id` and `charged_credits`, or store `write_action_id` and poll `GET /x/write-actions/{id}` before retrying a pending write.',
  '<Card title="DM Media Handoff" icon="message-circle">',
  'pass exactly 1 returned `mediaId` as `media_ids` on `POST /x/dm/{userId}`',
  'Leave `reply_to_message_id` unset.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Call `GET /events` with `after` when a flow needs stored monitor replay.',
  'Store `event_id`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`, then pass `next_cursor` as the next `after` value.',
  '<Card title="Extraction Job" icon="boxes">',
  'Store `extraction_id`, `tool_type`, `status`, `has_more`, `next_cursor`, and the export path before loading CSV, JSON, or XLSX rows.',
  'search_recent_tweets = search_tweets.with_options(',
  'Respect `Retry-After` for repeated `429` responses.',
  'Keep `limit` at or below `200` for bounded tweet search pulls.',
  'Pass `next_cursor` with the same `query`, `query_type`, and `limit`.',
  'For bounded tweet search pulls, keep `query`, `query_type`, and `limit` unchanged.',
  'Only `cursor` changes.',
  '## Failure Routing',
  '`XquikError` exposes `status_code` and `response_text` when an HTTP response is available.',
  '<Card title="Inspect Status" icon="route">',
  'Catch `XquikError` and branch on `status_code`.',
  '<Card title="Fix Inputs" icon="circle-x">',
  'Treat `400` and `404` as non-retryable.',
  '<Card title="Pause Billing Stops" icon="credit-card">',
  'Treat `402` as an account action.',
  '<Card title="Back Off Reads" icon="timer">',
  'Treat `429`, `500`, `502`, and `503` as retryable with Prefect retry settings and slower schedules.',
  'Do not decode cursors. Treat them as opaque strings.',
  '<Card title="Version Pin" icon="tag">',
  'Pin the release wheel in production images until PyPI publication is available.',
] as const;

const REQUIRED_HAYSTACK_GUIDE_SNIPPETS = [
  '## Pipeline Handoff',
  'Use this shape when Haystack hands results to a vector store, evaluation job, queue, CSV export, or dashboard.',
  '<Card title="Document Rows" icon="file-text">',
  'Store each `Document.content`, `meta.endpoint`, `meta.id`, `meta.url`, `meta.created_at`, `meta.author.id`, `meta.author.username`, `meta.author.name`, `meta.author.verified`, and public metrics before embedding or export.',
  '| `meta.author` | Author `id`, `username`, `name`, and `verified` fields when present |',
  '<Card title="Citation Links" icon="link">',
  'Store `links` as the canonical tweet URLs returned by the component. Join them to `meta.id` when a citation, audit row, or UI card needs a source link.',
  '<Card title="Pagination Checkpoint" icon="list-tree">',
  'Store request `query` or `user_id`, component options, `has_more`, and `next_cursor`. Resume with `cursor=next_cursor`; do not decode cursors.',
  '<Card title="Failure Branch" icon="route">',
  'Catch `httpx.HTTPStatusError`, branch on `response.status_code`, and store the status with the pipeline run ID instead of retrying bad inputs unchanged.',
  'Keep `document_rows`, `citation_rows`, and `pagination_checkpoints` separate from embeddings so later reruns can refresh X context without rebuilding the whole pipeline.',
] as const;

const REQUIRED_COMPOSIO_MIGRATION_SNIPPETS = [
  '## Result Handoff',
  'When you replace Composio agent steps, map raw tool responses into stable rows before sending them to Slack, Sheets, queues, databases, or dashboards.',
  '<Card title="Tweet Search Page" icon="search">',
  'Store request `q`, each `tweet_id`, `text`, `author_username`, `created_at`, and `url`. Keep `has_more` and `next_cursor` for page loops.',
  '<Card title="User Page" icon="users">',
  'Store source `id` as `user_id`, plus `username`, `name`, `followers`, `verified`, and `profile_picture`. Keep `has_more` and `next_cursor` when present.',
  '<Card title="Trend Page" icon="trending-up">',
  'Store each trend `name`, `rank`, `query`, and `description`. Keep response `count` and `woeid` for regional audit trails.',
  '<Card title="Monitor Webhook" icon="radio">',
  'Store `delivery_id` for receiver retry de-dupe and `stream_event_id` when one monitor event should process once across endpoint changes.',
  '<Card title="Stored Event Replay" icon="activity">',
  'Use `GET /api/v1/events` with `after` to replay stored monitor events.',
  'Store `event_id`, `type`, `monitor_id`, `monitor_type`, `occurred_at`, `has_more`, and `next_cursor`.',
  '<Card title="Media Attachments" icon="image">',
  'For tweets or replies, pass public URLs in `media` and store `tweet_id` or `write_action_id`.',
  'For DMs, upload first, pass one `media_id` in `media_ids`, store `message_id`, and leave `reply_to_message_id` unset.',
  'For downstream tables, keep `tweet_rows`, `user_rows`, `trend_rows`, `webhook_event_rows`, `event_replay_rows`, and `media_write_rows` as separate shapes instead of passing the whole MCP result through the workflow.',
] as const;

const REQUIRED_HERMES_TWEET_GUIDE_SNIPPETS = [
  'Hermes Tweet is the native Hermes Agent plugin for using Xquik as a structured X automation toolset.',
  'hermes plugins install Xquik-dev/hermes-tweet --enable',
  'uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet',
  'The current package version is `0.1.6`.',
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
  'Use public media URLs in `media` for tweet or reply actions. Store',
  '`tweetId` when confirmed; if the response includes `writeActionId`, poll',
  '`GET /api/v1/x/write-actions/{id}` with `tweet_read` before retrying.',
  'For a tweet or reply, call tweet_action for POST /api/v1/x/tweets with media set to public HTTPS image or MP4 URLs. Do not send media_ids.',
  'If tweet_action for POST /api/v1/x/tweets returns writeActionId, store write_action_id, status, charged_credits, and poll GET /api/v1/x/write-actions/{id} with tweet_read before retrying.',
  'Use tweet_explore with include_actions true to find monitor and webhook endpoints.',
  'Create an account monitor or keyword monitor with tweet_action only after approval.',
  'Register the receiver URL with tweet_action for POST /api/v1/webhooks.',
  'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
  'For a DM attachment, call tweet_action for POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value.',
  'outputs and leave `reply_to_message_id` unset.',
  'For a DM attachment, call tweet_action for POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value. Leave reply_to_message_id unset.',
  'Return tweetId for confirmed posts, writeActionId for pending posts, and mediaId plus messageId for DMs.',
  'Keep full DM bodies out of shared outputs.',
  '`tweet_action` stays hidden or disabled unless `HERMES_TWEET_ENABLE_ACTIONS=true`.',
  'Hermes Tweet includes 101 agent-callable Xquik endpoints generated from the OpenAPI contract, plus 31 MPP-tagged read endpoints in the bundled catalog.',
] as const;

const REQUIRED_TWEETCLAW_GUIDE_SNIPPETS = [
  'TweetClaw is the official OpenClaw plugin for using Xquik from an OpenClaw agent.',
  'openclaw plugins install @xquik/tweetclaw',
  'openclaw plugins install @xquik/tweetclaw@1.6.31 --pin',
  '`@xquik/tweetclaw` is the official package. The plugin id is `tweetclaw`.',
  'The current source-truth version is `1.6.31`.',
  'MPP lets TweetClaw call 31 read-only X API endpoints without an Xquik account or API key.',
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
  'Store `tweetId` when confirmed; if the response includes',
  '`writeActionId`, poll `GET /api/v1/x/write-actions/{id}` before retrying.',
  'For DM attachments, upload media first, pass the returned `mediaId` as the',
  'one-item `media_ids` value, then store `messageId`.',
  'outputs and leave `reply_to_message_id` unset.',
  'For a tweet or reply, call POST /api/v1/x/tweets with media set to public HTTPS image or MP4 URLs. Do not send media_ids.',
  'If POST /api/v1/x/tweets returns writeActionId, store write_action_id, status, charged_credits, and poll GET /api/v1/x/write-actions/{id} before retrying.',
  'Use explore to find monitor and webhook endpoints.',
  'Create an account monitor or keyword monitor only after approval.',
  'Register the receiver URL with POST /api/v1/webhooks.',
  'Verify X-Xquik-Signature, store deliveryId and streamEventId, and return 2xx for accepted duplicates.',
  'For a DM attachment, call POST /api/v1/x/media first, then POST /api/v1/x/dm/{userId} with one media_ids value. Leave reply_to_message_id unset.',
  'Return tweetId for confirmed posts, writeActionId for pending posts, and mediaId plus messageId for DMs.',
  'Keep full DM bodies out of shared outputs.',
  'Only change `baseUrl` for a self-hosted Xquik-compatible API.',
  'TweetClaw exposes 99 agent-callable endpoints across 9 categories.',
  '<Card title="account" icon="user">',
  '1 endpoint for account status and usage.',
  '<Card title="composition" icon="pen-line">',
  '13 endpoints for compose, drafts, writing styles, and radar.',
  '<Card title="extraction" icon="file-spreadsheet">',
  '9 endpoints for extraction jobs, giveaway draws, and exports.',
  '<Card title="monitoring" icon="radio">',
  '18 endpoints for account monitors, keyword monitors, events, and webhooks.',
  '<Card title="twitter" icon="search">',
  '37 endpoints for search, lookups, timelines, articles, trends, bookmarks,',
  '<Card title="x-write" icon="send">',
  '18 endpoints for post, reply, like, retweet, follow, remove follower, DM,',
  'TweetClaw keeps credentials in plugin config and injects auth at request time.',
  'OpenClaw approval prompts apply before write-like `tweetclaw` calls.',
  'Dashboard-only account-admin, billing, support-ticket, and raw credential flows are excluded',
] as const;

const REQUIRED_MICROSOFT_AGENT_FRAMEWORK_GUIDE_SNIPPETS = [
  'Build a Microsoft Agent Framework agent that can search tweets, hand off IDs and cursors, post tweets, replay stored monitor events, and run extraction jobs',
  'from pathlib import Path',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-agent-handoff.json").write_text(response.text, encoding="utf-8")',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'tweet_id, author_username, text, created_at, has_more, next_cursor,',
  'Path("xquik-agent-workflow-handoff.json").write_text(',
] as const;

const REQUIRED_GOOGLE_ADK_GUIDE_SNIPPETS = [
  'Build a Google ADK agent that can search tweets, hand off IDs and cursors, post tweets, replay stored monitor events, and run extraction jobs',
  'from pathlib import Path',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'response_parts = []',
  'parts=[types.Part(text=handoff_prompt)]',
  'response_parts.append(part.text)',
  'Path("xquik-adk-handoff.json").write_text(',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'tweet_id, author_username, text, created_at, has_more, next_cursor,',
] as const;

const REQUIRED_CREWAI_GUIDE_SNIPPETS = [
  'Build a CrewAI crew that can search tweets, hand off IDs and cursors, monitor accounts, replay stored monitor events, and run extraction jobs',
  'from pathlib import Path',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-crewai-handoff.json").write_text(str(result), encoding="utf-8")',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'goal="Gather compact JSON handoff rows from X about a given topic"',
  'structured social data',
  'Compact JSON with tweet_id, author_username, text, created_at, has_more, next_cursor, and route_used',
  'Path("xquik-crewai-workflow-handoff.json").write_text(',
] as const;

const REQUIRED_PYDANTIC_AI_GUIDE_SNIPPETS = [
  'Build a Pydantic AI agent that can search tweets, hand off IDs and cursors, post tweets, replay stored monitor events, and run extraction jobs',
  'from pathlib import Path',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-pydantic-ai-handoff.json").write_text(',
  'Pydantic AI registers `MCPServerStreamableHTTP` as an agent `toolsets` entry.',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'Path("xquik-pydantic-ai-profile.json").write_text(',
  'Path("xquik-pydantic-ai-tweets.json").write_text(',
  '"mcpServers": {',
] as const;

const REQUIRED_LANGCHAIN_GUIDE_SNIPPETS = [
  'Build a LangChain agent that can search tweets, hand off IDs and cursors, post tweets, replay stored monitor events, and run extraction jobs',
  'from pathlib import Path',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'Path("xquik-langchain-handoff.json").write_text(',
  "LangChain's MCP adapter loads tools with `MultiServerMCPClient`.",
  'The client is stateless by default, so persist returned IDs, cursors, and write-action status in your job state',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'Path("xquik-langgraph-handoff.json").write_text(',
  'username, name, user_id, description, followers_count, and route_used',
] as const;

const REQUIRED_MASTRA_GUIDE_SNIPPETS = [
  'Build a Mastra agent in TypeScript that can search tweets, hand off IDs and cursors, post tweets, replay stored monitor events, and run extraction jobs',
  'import { writeFile } from "node:fs/promises";',
  'query, route_used, tweets[{tweet_id,text,author_username,created_at}]',
  'await writeFile("xquik-mastra-handoff.json", result.text, "utf8");',
  "Mastra's `MCPClient` loads tools with `listTools()` for agent setup and `listToolsets()` for per-call tools.",
  'tries Streamable HTTP from the URL',
  'The MCP runtime returns normalized snake_case fields through `xquik.request()`',
  '## Handoff Checklist',
  '<Card title="Tweet search rows" icon="search">',
  'Store `tweet_id`, `text`, `author_username`, `created_at`, `has_more`, `next_cursor`, and the original `q`.',
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
  'await writeFile("xquik-mastra-stream-handoff.json", handoff, "utf8");',
  'await writeFile("xquik-mastra-user-handoff.json", response.text, "utf8");',
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
  'Store `tweetId`, `charged`, and `chargedCredits` on `200 Success` as `tweet_id`, `charged`, and `charged_credits`.',
  'For `202 x_write_unconfirmed`, store `write_action_id`, `status`, `charged`, and `charged_credits`, then poll `GET /x/write-actions/{id}` before retrying.',
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
  'Store `tweet_id`, `charged`, and `charged_credits` on a `200` response.',
  'For `202 x_write_unconfirmed`, store `write_action_id`, `status`, `charged`, and `charged_credits`, then poll `GET /x/write-actions/{id}` before retrying.',
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
  "Apify's official Actors docs define Actors as serverless programs for workflow automation and data extraction.",
  'structured JSON input',
  'exported as `json`, `jsonl`, `csv`, `html`, `xlsx`, `xml`, or `rss`',
  '`/v2/store` lists public Actors',
  'Actor run events include created, succeeded, failed, aborted, timed out, and resurrected states.',
  'The public Xquik profile currently shows 2 public Actors',
  '`xquik/x-tweet-scraper`',
  '`xquik/x-follower-scraper`',
  '## Apify Actor Handoff',
  'Tweet rows with text, IDs, engagement metrics, author profiles, and media',
  '`GET /x/tweets/search`, `tweet_search_extractor`, pagination, 1-second monitors, signed webhooks, SDKs, or MCP',
  'User rows with profile fields and filter-ready metadata',
  'https://api.apify.com/v2/store?username=xquik&limit=20&responseFormat=agent',
  'Store badges, ranking positions, user counts, and run totals change.',
  'Verify the current Xquik Apify profile or Store API before citing marketplace placement.',
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
  'Use keyword monitors, tweet search exports, signed webhooks, and `GET /events` for real-time records.',
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

const FORBIDDEN_PUBLIC_CARD_ICON_SNIPPETS = [
  {
    reason: 'filter.svg returns 403 from the Mintlify Lucide asset CDN',
    replacement: 'icon="funnel"',
    snippet: 'icon="filter"',
  },
  {
    reason: 'circle-exclamation.svg returns 403 from the Mintlify Lucide asset CDN',
    replacement: 'icon="circle-alert"',
    snippet: 'icon="circle-exclamation"',
  },
  {
    reason: 'microsoft.svg returns 403 from the Mintlify Lucide asset CDN',
    replacement: 'icon="workflow"',
    snippet: 'icon="microsoft"',
  },
  {
    reason: 'pause-circle.svg returns 403 from the Mintlify Lucide asset CDN',
    replacement: 'icon="circle-pause"',
    snippet: 'icon="pause-circle"',
  },
  {
    reason: 'play-circle.svg returns 403 from the Mintlify Lucide asset CDN',
    replacement: 'icon="circle-play"',
    snippet: 'icon="play-circle"',
  },
] as const;

const EXPECTED_OPENAPI_OPERATION_COUNT = 120;

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
  ['32', 'pay-per-use'].join(' '),
  ['32', 'read-only', 'endpoints'].join(' '),
  ['32', 'X-API', 'endpoints'].join(' '),
  ['32', 'MPP'].join(' '),
  ['32', 'pay-per-call'].join(' '),
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
  '  maxLinksToTest: 30',
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

const ALLOWED_ENDPOINT_TITLE_UPPERCASE_TOKENS: ReadonlySet<string> = new Set([
  'API',
  'CLI',
  'DM',
  'HMAC',
  'ID',
  'IDs',
  'JSON',
  'MCP',
  'MPP',
  'OAuth',
  'REST',
  'SDK',
  'TOTP',
  'URL',
  'X',
  'XLSX',
]);

function listAlternativeFiles(): readonly string[] {
  return [
    'alternatives.mdx',
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

function collectForbiddenPublicCardIconFindings(): readonly DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];

  for (const file of listPublicMarkdownFiles()) {
    const source = readFileSync(file, 'utf8');

    for (const { reason, replacement, snippet } of FORBIDDEN_PUBLIC_CARD_ICON_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public Markdown uses ${snippet}; use ${replacement} because ${reason}.`,
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
  const source = readFileSync('alternatives.mdx', 'utf8');
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

    if (title?.endsWith(' API') === true) {
      findings.push({
        file,
        issue: `Endpoint title "${title}" adds redundant API text that appears in the sidebar.`,
      });
    }
  }

  return findings;
}

function collectEndpointTitleCaseFindings(): readonly DiscoveryFinding[] {
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

    const [, ...tokens] = title.split(/\s+/u);
    for (const token of tokens) {
      const normalized = token.replace(/^[^A-Za-z0-9#]+|[^A-Za-z0-9#]+$/gu, '');
      if (
        normalized !== '' &&
        !ALLOWED_ENDPOINT_TITLE_UPPERCASE_TOKENS.has(normalized) &&
        /^[A-Z][a-z]/u.test(normalized)
      ) {
        findings.push({
          file,
          issue: `Endpoint title "${title}" uses title case token "${normalized}". Use sentence case for endpoint labels and keep acronyms uppercase.`,
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

  it('keeps endpoint titles in sentence case', (): void => {
    expect.assertions(1);

    expect(collectEndpointTitleCaseFindings()).toStrictEqual([]);
  });

  it('keeps public confidentiality wording generic and product-approved', (): void => {
    expect.assertions(1);

    expect(collectPublicConfidentialityWordingFindings()).toStrictEqual([]);
  });

  it('keeps public agent entry points visible to docs crawlers', (): void => {
    expect.assertions(1);

    const introduction = readFileSync('introduction.mdx', 'utf8');
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

    const introduction = readFileSync('introduction.mdx', 'utf8');

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

    const quickstart = readFileSync('quickstart.mdx', 'utf8');

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

    const source = readFileSync('sdks/csharp.mdx', 'utf8');

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

  it('keeps MCP response-contract docs aligned with product behavior', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('mcp/overview.mdx', 'utf8'),
      readFileSync('mcp/tools.mdx', 'utf8'),
      readFileSync('guides/types.mdx', 'utf8'),
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

  it('keeps account usage fields aligned with monitor billing behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/account/get.mdx', 'utf8');

    expect(
      collectSnippetFindings(source, 'Account API docs', REQUIRED_ACCOUNT_API_SNIPPETS),
    ).toStrictEqual([]);
  });

  it('keeps quick top-up examples aligned with PAYG credit conversion', (): void => {
    expect.assertions(1);

    const quickTopupPage = readFileSync(CREDITS_QUICK_TOPUP_PAGE, 'utf8');
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

  it('keeps the API overview integration checklist concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/overview.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'API overview',
          REQUIRED_API_OVERVIEW_CHECKLIST_SNIPPETS,
        ),
        ...FORBIDDEN_API_OVERVIEW_SNIPPETS.flatMap(
          (snippet): readonly DiscoveryFinding[] =>
            source.includes(snippet)
              ? [
                  {
                    issue: `API overview contains stale read-service wording "${snippet}".`,
                  },
                ]
              : [],
        ),
      ],
    ).toStrictEqual([]);
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

    const source = readFileSync('api-reference/x/get-user.mdx', 'utf8');

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

  it('keeps the community tweet search API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x/search-community-tweets.mdx',
      'utf8',
    );

    expect([
      ...collectSnippetFindings(
        source,
        'Community tweet search API page',
        REQUIRED_COMMUNITY_TWEET_SEARCH_API_HANDOFF_SNIPPETS,
      ),
      ...FORBIDDEN_COMMUNITY_TWEET_SEARCH_API_RAW_OUTPUT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  issue: `Community tweet search API page prints raw tweet data with "${snippet}".`,
                },
              ]
            : [],
      ),
    ]).toStrictEqual([]);
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
    expect.assertions(2);

    const source = readFileSync('guides/tweet-search-export.mdx', 'utf8');

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
  });

  it('keeps the search tweets API handoff concrete', (): void => {
    expect.assertions(2);

    const source = readFileSync('api-reference/x/search-tweets.mdx', 'utf8');

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

    const source = readFileSync('api-reference/extractions/get.mdx', 'utf8');

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

    const source = readFileSync('api-reference/extractions/list.mdx', 'utf8');

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

    const source = readFileSync('api-reference/extractions/estimate.mdx', 'utf8');

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
    expect.assertions(2);

    const source = readFileSync('api-reference/draws/export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Draw export API response',
        REQUIRED_DRAW_EXPORT_RESPONSE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('| Format | Content-Type | Filename |');
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

    const source = readFileSync('guides/types.mdx', 'utf8');

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

    const source = readFileSync('guides/types.mdx', 'utf8');

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

    const source = readFileSync('guides/types.mdx', 'utf8');

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

    const source = readFileSync('guides/types.mdx', 'utf8');

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
      readFileSync('guides/types.mdx', 'utf8'),
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

    const testing = readFileSync('guides/webhook-testing.mdx', 'utf8');
    const types = readFileSync('guides/types.mdx', 'utf8');
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

    const source = readFileSync(
      'api-reference/x-write/create-tweet.mdx',
      'utf8',
    );

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

  it('keeps the workflows overview within the generated HTML weight budget', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/workflows.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(MAX_WORKFLOWS_OVERVIEW_CHARS);
  });

  it('keeps request-efficient API usage source-backed', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/request-efficient-api-usage.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Request-efficient API usage guide',
        REQUIRED_REQUEST_EFFICIENT_API_USAGE_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/monitors/create-keyword.mdx',
      'utf8',
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

    const source = readFileSync(
      'api-reference/monitors/update-keyword.mdx',
      'utf8',
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
        ...FORBIDDEN_ACCOUNT_MONITOR_CREATE_RAW_OUTPUT_SNIPPETS.flatMap(
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

    const source = readFileSync('api-reference/monitors/get.mdx', 'utf8');

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

    const source = readFileSync('api-reference/monitors/delete.mdx', 'utf8');

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
    expect.assertions(5);

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
    expect.assertions(5);

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
  });

  it('keeps the Haystack guide handoff concrete', (): void => {
    expect.assertions(4);

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
  });

  it('keeps the Composio migration guide handoff concrete', (): void => {
    expect.assertions(3);

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
  });

  it('keeps the Hermes Tweet guide aligned with the current plugin scope', (): void => {
    expect.assertions(4);

    const source = readFileSync('guides/hermes-tweet.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Hermes Tweet guide',
        REQUIRED_HERMES_TWEET_GUIDE_SNIPPETS,
      ),
    ).toStrictEqual([]);
    expect(source).not.toContain('The current package version is `0.1.5`');
    expect(source).not.toContain('Hermes Tweet includes 99');
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
    expect(source).not.toContain('@xquik/tweetclaw@1.6.30');
    expect(source).not.toContain('TweetClaw exposes 101 agent-callable');
    expect(source).not.toContain(
      'For tweets or replies, call `POST /api/v1/x/tweets` with uploaded media IDs',
    );
  });

  it('keeps the Microsoft Agent Framework guide handoff concrete', (): void => {
    expect.assertions(4);

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
    expect.assertions(4);

    const source = readFileSync('guides/crewai.mdx', 'utf8');

    expect(
      collectSnippetFindings(source, 'CrewAI guide', REQUIRED_CREWAI_GUIDE_SNIPPETS),
    ).toStrictEqual([]);
    expect(source).not.toContain('raw data');
    expect(source).not.toContain('Raw tweet data');
    expect(source).not.toContain('print(result)');
  });

  it('keeps the Pydantic AI guide handoff concrete', (): void => {
    expect.assertions(4);

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
    expect(source).not.toContain('print(response["messages"][-1].content)');
    expect(source).not.toContain('print(result["messages"][-1].content)');
  });

  it('keeps the Mastra guide handoff concrete', (): void => {
    expect.assertions(4);

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
  });

  it('keeps the alternatives workflow shortlist concrete', (): void => {
    expect.assertions(2);

    const source = readFileSync('alternatives.mdx', 'utf8');

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

    const source = readFileSync('alternatives.mdx', 'utf8');

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

  it('keeps public card icons on loadable Lucide assets', (): void => {
    expect.assertions(1);

    expect(collectForbiddenPublicCardIconFindings()).toStrictEqual([]);
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
