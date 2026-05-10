import { readdirSync, readFileSync } from 'node:fs';
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

const REQUIRED_README_SNIPPETS = [
  'tweet search',
  'user lookup',
  'follower exports',
  'media uploads',
  'direct messages',
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
  '## Use Xquik with AI agents',
  '[llms.txt](/llms.txt)',
  '[Context7 library](https://context7.com/xquik-dev/xquik-docs)',
  '[Xquik Skill](https://github.com/Xquik-dev/x-twitter-scraper)',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
] as const;

const REQUIRED_QUICKSTART_SNIPPETS = [
  'X API quickstart',
  '`GET /account`',
  'monitor tweets every 1 second',
  '`POST /monitors`',
  '`POST /webhooks`',
  '"isActive": true',
  '"nextBillingAt": "2026-02-24T10:30:00.000Z"',
] as const;

const REQUIRED_SDK_OVERVIEW_SNIPPETS = [
  'tweet search exports',
  'JSON Lines, CSV, or XLSX',
  '`xquik-tweet-search.jsonl`',
  '[TypeScript](/sdks/typescript)',
  '[Python](/sdks/python)',
  '[Go](/sdks/go)',
  '[CLI](/sdks/cli)',
  '[Search Tweets](/api-reference/x/search-tweets)',
  '[Create Tweet](/api-reference/x-write/create-tweet)',
  '[Upload Media](/api-reference/x-write/upload-media)',
  '[Send Direct Message](/api-reference/x-write/send-dm)',
  'public image URLs',
  'one-item `media_ids`',
  'Tweet search costs 1 credit per tweet returned.',
  'Each tweet or reply write costs 10 credits.',
  'Media upload and DM send calls each cost 10 credits.',
  'Active instant monitors cost 21 credits per active monitor-hour.',
  '[MCP Server](/mcp/overview)',
] as const;

const REQUIRED_TYPESCRIPT_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`sinceTime`',
  '`untilTime`',
  '`queryType`',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public image URLs',
  '`client.x.media.upload`',
  '`media.mediaId`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.messageId`',
  'Do not pass uploaded `media.mediaId` values to `client.x.tweets.create`',
] as const;

const REQUIRED_GO_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.X.Tweets.Search`',
  '`GET /x/tweets/search`',
  '`XTweetSearchParams`',
  '`Q`',
  '`Limit`',
  '`Cursor`',
  '`SinceTime`',
  '`UntilTime`',
  '`QueryType`',
  '`PaginatedTweets`',
  '`Tweets`',
  '`HasNextPage`',
  '`NextCursor`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '`client.X.Tweets.New`',
  '`ReplyToTweetID`',
  '`Media` with public image URLs',
  '`client.X.Media.Upload`',
  '`media.MediaID`',
  '`client.X.Dm.Send`',
  '`MediaIDs`',
  '`dm.MessageID`',
  'Do not pass uploaded `MediaID` values to `client.X.Tweets.New`',
] as const;

const REQUIRED_PYTHON_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to CSV, JSON Lines, or XLSX',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`since_time`',
  '`until_time`',
  '`query_type`',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` to CSV for analysts',
  'JSON Lines for queues and data lakes',
  '`tweet.to_json(indent=None)`',
  'Load the projected rows into pandas or openpyxl when account teams need an XLSX workbook.',
  '`xquik-tweet-search.jsonl`',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public image URLs',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.message_id`',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
] as const;

const REQUIRED_RUBY_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to CSV, JSON Lines, or XLSX',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`XTwitterScraper::X::TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`since_time`',
  '`until_time`',
  '`query_type`',
  '`XTwitterScraper::PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` to CSV for analysts',
  'JSON Lines for queues and data lakes',
  '`xquik-tweet-search.jsonl`',
  '`tweet.to_json`',
  '`tweet.deep_to_h`',
  'XLSX writer',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public image URLs',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send_`',
  '`media_ids`',
  '`dm.message_id`',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
] as const;

const REQUIRED_CLI_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
  '## Workflow: Post Image Tweets, Replies, and DM Attachments',
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
  'Write one JSON object per line for downstream jobs',
  '`xquik-tweet-search.jsonl`',
  'projected records to CSV for analysts',
  'produce XLSX from those rows',
  '`--format-error json`',
  '`x-twitter-scraper x:tweets create`',
  '`--media`',
  '`--reply-to-tweet-id`',
  'store `writeActionId` and poll `GET /x/write-actions/{id}`',
  '`x-twitter-scraper x:users retrieve-followers`',
  '`x-twitter-scraper x:media upload`',
  '`--file`',
  '`--transform mediaId`',
  '`x-twitter-scraper x:dm send`',
  '`--media-id`',
  'DMs accept exactly 1 uploaded media ID.',
  'Do not pass uploaded `mediaId` values to `x:tweets create`',
] as const;

const REQUIRED_CSHARP_SDK_WORKFLOW_SNIPPETS = [
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
  '`PaginatedTweets`',
  '`page.Tweets`',
  '`page.HasNextPage`',
  '`page.NextCursor`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected rows into CSV for analysts',
  'write XLSX from those rows',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.X.Tweets.Create`',
  '`POST /x/tweets`',
  '`Media`',
  '`ReplyToTweetID`',
  '`tweet.TweetID`',
  '`reply.TweetID`',
  '`client.X.Media.Upload`',
  '`POST /x/media`',
  '`media.MediaID`',
  '`MediaIds`',
  '`client.X.Dm.Send`',
  '`dm.MessageID`',
  'Each tweet or reply write costs 10 credits.',
  'Do not pass uploaded `media.MediaID` values to `client.X.Tweets.Create`',
] as const;

const REQUIRED_PHP_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
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
  '`PaginatedTweets`',
  '`$page->tweets`',
  '`$page->hasNextPage`',
  '`$page->nextCursor`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `$page->tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected rows into CSV for analysts',
  'generate XLSX from those rows',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`$client->x->tweets->create()`',
  '`POST /x/tweets`',
  '`media`',
  '`replyToTweetID`',
  '`$tweet->tweetID`',
  '`$reply->tweetID`',
  '`$client->x->media->upload()`',
  '`POST /x/media`',
  '`$media->mediaID`',
  '`mediaIDs`',
  '`$client->x->dm->send()`',
  '`$dm->messageID`',
  'Each tweet or reply write costs 10 credits.',
  'Do not pass uploaded `$media->mediaID` values to `$client->x->tweets->create()`',
] as const;

const REQUIRED_JAVA_SDK_WORKFLOW_SNIPPETS = [
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
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.x().tweets().create`',
  '`POST /x/tweets`',
  '`.addMedia()`',
  '`.replyToTweetId()`',
  '`tweet.tweetId()`',
  '`reply.tweetId()`',
  '`client.x().media().upload`',
  '`POST /x/media`',
  '.file(Paths.get("handoff.png"))',
  '`media.mediaId()`',
  '`.addMediaId()`',
  '`dm.messageId()`',
  'Each tweet or reply write costs 10 credits.',
  'Do not pass uploaded `media.mediaId()` values to `client.x().tweets().create`',
] as const;

const REQUIRED_KOTLIN_SDK_WORKFLOW_SNIPPETS = [
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
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '## Workflow: Post Image Tweets and DM Attachments',
  '`client.x().tweets().create`',
  '`POST /x/tweets`',
  '`.addMedia()`',
  '`.replyToTweetId()`',
  '`tweet.tweetId()`',
  '`reply.tweetId()`',
  '`client.x().media().upload`',
  '`POST /x/media`',
  '.file(Paths.get("handoff.png"))',
  '`media.mediaId()`',
  '`.addMediaId()`',
  '`dm.messageId()`',
  'Each tweet or reply write costs 10 credits.',
  'Do not pass uploaded `media.mediaId()` values to `client.x().tweets().create`',
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
  '`tweet.new`',
  '`tweet.reply`',
  'Webhook operations are free.',
  'Active instant monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Terraform state can contain the webhook `secret` returned at creation time.',
  '`sensitive = true`',
] as const;

const REQUIRED_LLMS_SNIPPETS = [
  '## Agent Entry Points',
  'https://context7.com/xquik-dev/xquik-docs',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
  'https://docs.xquik.com/openapi.yaml',
  '"status": "pending_confirmation"',
  '"writeActionId": "42"',
  '`GET /x/write-actions/{id}`',
  'opt in to the normalized v1 response contract',
] as const;

const REQUIRED_MCP_CONTRACT_SNIPPETS = [
  '`xquik.request()` uses the normalized v1 contract automatically.',
  'has_more',
  'next_cursor',
  'Pass `next_cursor` back as the `cursor` query parameter',
  'MCP server\'s `xquik.request()` tool sends that normalized contract automatically',
  '## Agent handoff patterns',
  'MCP returns JSON.',
  'Use extraction export endpoints when you need Xquik to generate CSV, JSON, XLSX, Markdown, or PDF files.',
  '| Scrape tweets or search tweets to JSON | `GET /api/v1/x/tweets/search` | `tweets[].id`, `tweets[].text`, `tweets[].author`, `tweets[].created`, `has_more`, `next_cursor`, and original `q` | 1 credit per tweet returned |',
  '| Export followers to CRM | `GET /api/v1/x/users/{id}/followers` or `POST /api/v1/extractions` with `follower_explorer` |',
  '> Post a tweet or reply with public image URLs (subscription required)',
  "media: ['https://example.com/image.png']",
  "> Upload media for a DM (subscription required)",
  'media_ids: [media.media_id]',
  '| Post tweets and replies with image URLs | `POST /api/v1/x/tweets` with `media: ["https://..."]` | `tweet_id` or `write_action_id`, `reply_to_tweet_id`, `account`, and original `media` URLs | 10 credits per write call |',
  '| Upload media for DMs | `POST /api/v1/x/media`, then `POST /api/v1/x/dm/{userId}` with one `media_ids` value | `media_id`, `media_url`, `message_id`, `user_id`, `account`, and source URL or filename | 10 credits per media upload call plus 10 credits per DM send |',
  'Do not upload media before posting tweets or replies.',
  '`POST /api/v1/x/tweets` rejects `media_ids` with `400 unsupported_field`',
  'Reserve uploaded `media_id` values for direct messages.',
  '| Post tweets and replies | `POST /api/v1/x/tweets`, then `GET /api/v1/x/write-actions/{id}` when pending | `tweet_id`, `reply_to_tweet_id`, `write_action_id`, `status`, and `charged` | 10 credits per write call |',
  '| Monitor tweets to signed webhooks | `POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`, then `POST /api/v1/webhooks` |',
  "source: 'xquik_mcp'",
  "job: 'tweet_search'",
  'The server covers 120 operations across 10 categories:',
  '| **twitter** | 38 |',
  '| **x-accounts** | 7 |',
] as const;

const FORBIDDEN_MCP_CONTRACT_SNIPPETS = [
  'returns the same response shapes documented here. No field name mapping is needed.',
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
  '### Pick a billing path by job',
  'Search tweets or scrape tweets to CSV',
  'Export followers or follower export',
  'Post tweets or post tweet replies',
  'Upload media for tweets or DMs',
  'Monitor tweets or send tweet alerts',
  '1 credit per tweet returned or extracted',
  '1 credit per follower returned',
  '10 credits per post tweet call',
  '10 credits per media upload call',
  'Checkout top-ups start at USD 10; quick top-up charges a saved payment method for USD 10-500',
  '### Monitor pricing',
  '21 credits per active monitor-hour',
  'Creating or reactivating an account monitor requires at least 22 available credits',
  '1 credit for the username lookup',
  'Creating or reactivating a keyword monitor also requires at least 22 available credits',
  'New active monitors are due for billing immediately',
  '`nextBillingAt`',
  '`monitorsUsed`, `monitorBilling.activeHourlyBurn`, and `monitorBilling.activeDailyEstimate` include active account monitors and active keyword monitors.',
  '### Plan monitor credits before you monitor tweets',
  'Use `GET /account` before creating more tweet monitors or tweet alerts.',
  'Each active account monitor or keyword monitor adds `21` credits to `monitorBilling.activeHourlyBurn` and `500` credits to `monitorBilling.activeDailyEstimate`.',
  '| 5 | 105 credits/hour | 2,500 credits/day | 22 |',
  'If `creditInfo.balance` is below the next hourly burn, top up before enabling more monitors.',
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

const FORBIDDEN_BILLING_CARRYOVER_SNIPPETS = [
  'Every subscription includes a monthly credit allowance that resets each billing period.',
  'Unused credits **do not carry over**',
  'No. Credits reset to zero each billing period.',
] as const;

const REQUIRED_QUICK_TOPUP_PAGE_SNIPPETS = [
  'At USD 0.00015 per credit, a USD 25 quick top-up adds 166,666 credits',
  'Only the `charged` outcome grants credits and updates `balance`.',
  'If the endpoint returns `requires_action`, complete payment authentication with `clientSecret` before retrying the metered API call.',
  'If it returns `no_payment_method`, create a checkout top-up instead.',
  '"balance": "466666"',
  '"credits": "166666"',
] as const;

const FORBIDDEN_TOPUP_EXAMPLE_SNIPPETS = [
  '"balance": "1450"',
  '"credits": "1000"',
] as const;

const REQUIRED_ACCOUNT_API_SNIPPETS = [
  'Number of currently active account monitors and keyword monitors.',
  '`monitorsUsed`, `monitorBilling.activeHourlyBurn`, and `monitorBilling.activeDailyEstimate` include active account monitors and active keyword monitors.',
] as const;

const REQUIRED_API_OVERVIEW_CHECKLIST_SNIPPETS = [
  '## Integration readiness checklist',
  '`x-api-key`',
  '`xquik-api-contract: 2026-04-29`',
  '`has_more`',
  '`next_cursor`',
  '`after` with `nextCursor`',
  '`cursor` with `next_cursor`',
  '`402 no_credits`',
  '`402 insufficient_credits`',
  '`Retry-After`',
  '`202 x_write_unconfirmed`',
  '`GET /x/write-actions/{id}`',
  '`writeActionId`',
  '`pending_confirmation`',
  'opt in to the normalized v1 response contract',
  '| 502 | `x_api_unavailable` | Read service temporarily unavailable - retry |',
  '"message": "Read service temporarily unavailable. Retry shortly."',
] as const;

const FORBIDDEN_API_OVERVIEW_SNIPPETS = [
  'best-practice response contract',
  '| 502 | `x_api_unavailable` | X data source temporarily unavailable - retry |',
  '"message": "X data source temporarily unavailable. Retry shortly."',
] as const;

const REQUIRED_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'Respect `Retry-After`; otherwise start at 1 second, add jitter, and stop after 3 retries.',
  'Requests sent before the fixed window resets keep returning `429` until `Retry-After` elapses.',
] as const;

const FORBIDDEN_RATE_LIMIT_TROUBLESHOOTING_SNIPPETS = [
  'max 5 retries',
  'Sending requests before the window resets may extend your cooldown.',
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

const REQUIRED_DRAFT_TYPES_GUIDE_SNIPPETS = [
  'interface Draft',
  'updatedAt: string;',
  'List, create, and get responses include `id`, `text`, `createdAt`, and `updatedAt`.',
  'Optional `topic` and `goal` fields are omitted (not null) when not set.',
  'Use `nextCursor` with the `afterCursor` query parameter to fetch subsequent pages.',
] as const;

const REQUIRED_ERROR_HANDLING_WRITE_STATUS_SNIPPETS = [
  'post tweet status',
  '`x_write_unconfirmed` | 202 | No | Poll `GET /x/write-actions/{id}` with `writeActionId` before retrying.',
  'The write action was dispatched, but final confirmation is still pending.',
  'The response includes `status: "pending_confirmation"`, `writeActionId`, `charged: false`, and `retryable: false`.',
  'Store `writeActionId`, call [Get Write Action Status](/api-reference/x-write/get-write-action-status), and do not retry-send while status is `pending_confirmation`.',
  '`x_dm_not_allowed` | 422 | No | The recipient may not accept DMs from this account. Use another permitted account or ask the recipient to allow messages.',
  '`no_addon` | 402 | No | Check billing status. Current plans include unlimited monitor slots.',
  '`monitor_limit_reached` | 403 | No | Check billing status. Current plans include unlimited monitor slots.',
] as const;

const REQUIRED_CREATE_TWEET_API_SNIPPETS = [
  'Post tweets and replies from a connected X account with media URLs, write-status polling, and audit handoff',
  '"post tweet replies"',
  '`reply_to_tweet_id`',
  '`media`',
  '## Store the post handoff',
  '"status": "posted"',
  '"tweet_id": "1895432178065391234"',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"cost_credits": 10',
  '"status": "pending_confirmation"',
  '"write_action_id": "42"',
  '"charged": false',
  '"retryable": false',
  '"poll": "GET /x/write-actions/{id}"',
  'Store `writeActionId` as `write_action_id`',
  'do not retry-send the same body while status is `pending_confirmation`',
  'If polling later returns `status: "success"` with `tweetId`, update the same record to `posted`.',
] as const;

const REQUIRED_WRITE_ACTION_STATUS_API_SNIPPETS = [
  'Poll post tweet, tweet reply, and DM write actions after pending confirmation responses',
  '"tweet reply status"',
  '`GET /x/write-actions/{id}`',
  '## Resolve the write queue',
  '`202 x_write_unconfirmed`',
  '| `success` | `writeActionId`, `action`, `charged`, and returned `tweetId`, `messageId`, or `resultId` | Mark the original job as complete. |',
  '| `pending_confirmation` | `writeActionId`, `sendDispatched`, `confirmationAttempts`, `confirmationCheckedAt`, `targetId`, and `message` when present | Keep the job pending and poll again with backoff. Do not retry-send the same body. |',
  '| `failed` | `writeActionId`, `action`, `sendDispatched`, `targetId`, `message`, and `charged` | Mark the job failed. Fix the account, target, content, or billing state before sending a new request. |',
  'For tweet replies, `targetId` is the parent tweet ID when available.',
  'For DMs, `targetId` is the recipient user ID when available.',
  '`retryable` is always `false` on this status response',
  '"job_id": "reply-queue-184"',
  '"published_tweet_id": "2052816150136832166"',
  '"reply_to_tweet_id": "1893456789012345678"',
] as const;

const REQUIRED_SERVICE_ERROR_GUIDE_SNIPPETS = [
  '<Accordion title="Server & service errors (500/502)">',
  '`x_api_rate_limited` | Read service rate limited | Retry in a few minutes. The read service is temporarily throttled. |',
  '`x_api_unavailable` | Read service temporarily unavailable | Retry with backoff. |',
  '`x_api_unauthorized` | Read service authentication failed | Retry later. [Contact support](mailto:support@xquik.com) if persistent. |',
  '`x_transient_error` | Write service timeout or temporary failure | Retry with backoff. The write service is experiencing intermittent issues. |',
  'The read service is temporarily unavailable. This is usually transient.',
  'the read service may be experiencing an outage',
] as const;

const FORBIDDEN_ERROR_HANDLING_SNIPPETS = [
  'Add a monitor addon from the dashboard.',
  'Delete a monitor or add capacity ($5/month).',
  'add capacity ($5/month per extra monitor)',
  'X data source',
  'Server & upstream errors',
  'Upstream timeout or temporary failure',
  '`x_transient_error` | Read service timeout or temporary failure',
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
  'GET /extractions/{id}/export?format=csv',
  '### Paginated JSON handoff',
  'Only `id` and `xUserId` are guaranteed on every result',
  '"toolType": "follower_explorer"',
  '"hasMore": true',
  '"nextCursor": "1001"',
  'Use `limit` up to `1000` and pass `nextCursor` as `after`',
  '`xUserId` to `x_user_id`',
  '"job": "follower_export"',
  '"source_username": "elonmusk"',
  '`xquik-follower-export.jsonl`',
  'title="Followers API"',
  'href="/api-reference/x/followers"',
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
  '### Saved export JSON Lines handoff',
  '`tweet-replies.jsonl`',
  'job: "reply_export"',
  'extraction_id: $extraction_id',
  'reply_author_id: .xUserId',
  'handoff_format: "jsonl"',
  '## Copy-ready workflow: replies to moderation queue',
  '`reply_tweet_id`',
  '`reply_author_username`',
  '`conversation_id`',
  '`next_cursor`',
  '`resultsLimit`',
  'Estimate is free.',
  'Exports are free after the extraction job exists.',
  '1 credit per tweet returned',
  '`400` | `invalid_tweet_id`',
  '`402` | `no_subscription`, `subscription_inactive`, `no_credits`, or `insufficient_credits`',
  '`429` | `rate_limit_exceeded`',
  '`424` or `502` | `x_api_unavailable`',
] as const;

const REQUIRED_TWEET_REPLIES_API_HANDOFF_SNIPPETS = [
  '## Direct replies handoff',
  '`GET /x/tweets/{id}/replies`',
  'support, community, moderation, giveaway, or agent workflow',
  '`reply_extractor`',
  '`tweets[]`',
  '`tweets[].id`',
  '`tweets[].author.id` and `tweets[].author.username`',
  '`tweets[].inReplyToId` and `conversationId`',
  '`has_next_page` and `next_cursor`',
  '`sinceTime` and `untilTime` are Unix timestamps in seconds',
  'Direct replies calls use the default paid page size',
  '`resultsLimit`',
  '1 credit per tweet returned',
  '`402 insufficient_credits`',
  '`Retry-After`',
] as const;

const REQUIRED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  '## Direct follower handoff',
  '`GET /x/users/{id}/followers`',
  'CRM, warehouse, audience, or agent workflow',
  '`follower_explorer`',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`has_next_page` and `next_cursor`',
  '`pageSize` from 20 to 200',
  '1 credit per result returned',
  '`402 insufficient_credits`',
  'USD 0.00015 per user returned',
] as const;

const REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS = [
  'scrape tweets',
  '## Choose the right path',
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
  '`job`, `results`, `hasMore`, and `nextCursor`',
  '`tweets[].id`, `tweets[].text`, `tweets[].createdAt`, `tweets[].author.id`, `tweets[].author.username`, `has_next_page`, and `next_cursor`',
  '`xquik-tweet-search.jsonl`',
  '`next_cursor`',
  '`resultsLimit`',
  '1 credit per tweet returned',
] as const;

const REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS = [
  '## Direct API handoff',
  '`GET /x/tweets/search`',
  'app, queue worker, CRM enrichment job, or agent',
  '`tweet_search_extractor`',
  '`tweets[]`',
  '`tweets[].id`',
  '`tweets[].author.id` and `tweets[].author.username`',
  '`has_next_page` and `next_cursor`',
  '`limit` is an upper bound from 1 to 200',
  '1 credit per tweet returned',
  '`402 insufficient_credits`',
  '`Retry-After`',
] as const;

const REQUIRED_EXTRACTION_WORKFLOW_SNIPPETS = [
  'Scrape tweets, export followers, estimate credits, start extraction jobs, paginate JSON results, and export CSV, JSON, or XLSX files',
  'Use this workflow to scrape tweets, export followers, pull tweet replies, save CSV/JSON/XLSX files, or hand paginated JSON to a CRM, warehouse, queue, or AI agent.',
  '## Data handoff',
  '`job`, `results`, `hasMore`, `nextCursor`',
  'Use `limit` up to 1,000 and pass `nextCursor` as `after`',
  '`xUserId`, `xUsername`, `tweetId`, `tweetText`, `createdAt`',
  'Paginated JSON is not row-capped by the export limit.',
  'File exports are capped at 100,000 rows, and PDF exports are capped at 10,000 rows.',
  'Use structured fields first for common jobs such as search tweets from a user, search tweet replies, scrape tweets with images, or export posts in a date range.',
  'Use `advancedQuery` only when you already know the X search operator string you want to append.',
  '| `502 x_api_unavailable` | Read service temporarily unavailable | Retry with exponential backoff |',
] as const;

const FORBIDDEN_EXTRACTION_WORKFLOW_SNIPPETS = [
  'quota',
  '| `502 x_api_unavailable` | X data source temporarily down | Retry with exponential backoff |',
] as const;

const REQUIRED_MEDIA_UPLOAD_WORKFLOW_SNIPPETS = [
  'media upload',
  'POST /x/media',
  'multipart/form-data',
  'application/json',
  '`mediaUrl`',
  '`mediaId`',
  'POST /x/tweets',
  'If you already have public image URLs for a tweet or reply, skip `POST /x/media` and pass those URLs directly in the `media` array on `POST /x/tweets`.',
  'Use `POST /x/media` when you need Xquik to host a local file, validate a generated media URL, or produce a `mediaId` for a DM attachment.',
  'Post tweets with public image URLs',
  'Post tweets with media uploaded through Xquik',
  'Post tweet replies with uploaded media',
  '`reply_to_tweet_id`',
  '`tweetId`',
  '`x_write_unconfirmed`',
  '`writeActionId`',
  'POST /x/dm/{userId}',
  '`media_ids`',
  'For tweet-only workflows with an already public image URL, call `POST /x/tweets` directly with `media`.',
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
  '"record_type":"media_upload"',
  '"record_type":"tweet_media_post"',
  '"record_type":"dm_media_send"',
  '"tweet_media_field":"media"',
  '"dm_media_field":"media_ids[0]"',
  '"handoff_format":"jsonl"',
  'Use `media_url` for tweet and reply `media` arrays. Use `media_id` for the single DM `media_ids` item.',
  'Store upload, tweet/reply, or DM handoff rows in `xquik-media-handoff.jsonl` with `media_id` and `media_url`.',
] as const;

const REQUIRED_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS = [
  'Upload media API',
  'post tweet with media',
  'post tweet replies with media',
  'send DM with media',
  '## Media upload handoff',
  '`POST /x/media`',
  'local file or hosted HTTPS media URL',
  '`mediaUrl` | Tweet and reply attachments. Pass it in the `media` array on `POST /x/tweets`. |',
  '`mediaId` | Direct message attachments. Pass it as the only item in `media_ids` on `POST /x/dm/{userId}`. |',
  'For tweets and replies, call [`POST /x/tweets`](/api-reference/x-write/create-tweet) after upload and pass `media: ["<mediaUrl>"]`.',
  'To post a media reply, also pass `reply_to_tweet_id`.',
  'Do not send `media_ids` to `POST /x/tweets`; that endpoint returns `400 unsupported_field`',
  'For DMs, call [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm) after upload and pass `media_ids: ["<mediaId>"]`.',
  'DMs accept exactly 1 uploaded media ID.',
  'resolve to a public address',
  '15,728,640 bytes',
  '422 media_download_failed',
  'Posting the tweet, posting the reply, or sending the DM is a separate 10-credit write call.',
] as const;

const REQUIRED_DIRECT_MESSAGE_WORKFLOW_SNIPPETS = [
  'send direct messages',
  'GET /x/users/{id}',
  'GET /x/dm/{userId}/history',
  'POST /x/dm/{userId}',
  'POST /x/media',
  '`messages`, `has_next_page`, and `next_cursor`',
  'pass the previous `next_cursor` as `cursor`',
  'Treat `next_cursor` as opaque',
  'Do not decode it or build your own cursor.',
  'Use a participant account',
  'do not retry `403 dm_not_permitted` with the same non-participant account.',
  'Use `cursor`; keep `maxId` only for older integrations that already depend on it.',
  '1 credit per message returned',
  '`400 account_required`',
  '`403 dm_not_permitted`',
  '`422 x_dm_not_allowed`',
  'The recipient may not accept DMs from this connected account. Do not retry unchanged',
  '`messageId`',
  '`success`',
  '### Store the outbound handoff',
  '"recipient_user_id": "987654321"',
  '"message_id": "1893726451029384192"',
  'use your own job timestamp if the downstream system needs `sent_at`',
  '`message_id`, `sender_id`, `receiver_id`, `created_at`, optional `media_url`, and `conversation_user_id`',
  '### JSON Lines handoff',
  '`xquik-dm-handoff.jsonl`',
  '"record_type": "dm_history"',
  '"record_type": "dm_send"',
  '"conversation_user_id": "987654321"',
  '"page_next_cursor": "1893726451029384190"',
  '"handoff_format": "jsonl"',
  'for queues, warehouse loads, CRM syncs, or agent memory',
  '`media_ids`',
  'exactly one uploaded media ID',
  '10 credits per call',
  '1 credit per call',
  'Do not pass multiple IDs, an empty array, or `reply_to_message_id`',
] as const;

const REQUIRED_WEBHOOK_TESTING_SNIPPETS = [
  'Test with Xquik first',
  'POST /webhooks/{id}/test',
  '`webhook.test` delivery',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and `X-Xquik-Nonce`',
  '"success": true',
  '"statusCode": 200',
  'For end-to-end verification of the configured webhook URL, prefer `POST /webhooks/{id}/test`.',
] as const;

const REQUIRED_WEBHOOK_CREATE_API_SNIPPETS = [
  '## Integration handoff',
  'Use this endpoint after creating an account monitor with [`POST /monitors`](/api-reference/monitors/create) or a keyword monitor with [`POST /monitors/keywords`](/api-reference/monitors/create-keyword).',
  'Active monitors produce the events; webhook delivery is included with monitor billing.',
  '| `id` | Testing with `POST /webhooks/{id}/test`, updating, deleting, and listing deliveries |',
  '| `secret` | Verifying `X-Xquik-Signature`; returned only once |',
  '| `createdAt` | Audit logs and configuration drift checks |',
  '`X-Xquik-Signature`, `X-Xquik-Timestamp`, and `X-Xquik-Nonce` headers',
  '`eventType`, `schemaVersion`, `deliveryId`, `streamEventId`, `occurredAt`, `data`',
  '`username` for account monitors or `query` for keyword monitors',
  'Use `deliveryId` as the per-endpoint idempotency key',
  '`streamEventId` when one monitor event must be processed once across retries or endpoints.',
  'Return a `2xx` response within 10 seconds',
  '[Signature Verification](/webhooks/verification)',
] as const;

const REQUIRED_WEBHOOK_DELIVERIES_API_SNIPPETS = [
  '## Operational handoff',
  'It returns the 100 most recent delivery records for one webhook, newest first.',
  '| `id` | Delivery-level idempotency and support lookup |',
  '| `streamEventId` | Joining back to the stored monitor event with `GET /events/{id}` |',
  '| `status` | Routing `pending`, `failed`, and `exhausted` deliveries to the right queue |',
  '| `attempts` | Deciding whether a failed delivery is early, repeated, or at the retry cap |',
  '| `lastStatusCode` | Separating receiver errors such as `500` from unreachable endpoints with status `0` |',
  '| `lastError` | Showing the most recent failure reason to an operator |',
  '| `createdAt` and `deliveredAt` | Measuring delivery latency and recovery time |',
  'Failures retry up to 10 attempts with exponential backoff, starting at 1 second and capped at 60 seconds.',
  'A `410 Gone` response marks the delivery `exhausted` immediately.',
  'Other non-`2xx` responses and network failures stay `failed` until they are delivered or exhaust all attempts.',
  'page on `exhausted`, warn on repeated `failed`, and ignore `delivered`.',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
] as const;

const REQUIRED_WEBHOOK_VERIFICATION_SNIPPETS = [
  'if (!verifyWebhook(req, WEBHOOK_SECRET))',
  'if not verify_webhook(request, WEBHOOK_SECRET):',
  'Use `deliveryId` as the webhook delivery idempotency key.',
  'Use `streamEventId` when your system should process one monitor event only once across webhook retries or endpoint changes.',
  'Do not hash the raw request body when `deliveryId` is available.',
  'processedDeliveries.add(event.deliveryId)',
  'processed_events.add(event["streamEventId"])',
] as const;

const REQUIRED_WEBHOOK_OVERVIEW_SNIPPETS = [
  'base 1 second, multiplier 2x, max 60 seconds',
  '| 10 | Final attempt |',
  'After the 10th failed attempt, the delivery is marked as `exhausted`.',
  'A `410 Gone` response exhausts the delivery immediately.',
  'Other non-`2xx` responses and network failures retry until the delivery is exhausted.',
  '`deliveryId` | string | Webhook delivery attempt ID.',
  '`streamEventId` | string | Stored event ID.',
  '`schemaVersion` | number | Webhook payload schema version.',
  '`query` | string | Keyword query that matched the event.',
  'Omitted for keyword-only monitor events and `webhook.test`.',
] as const;

const REQUIRED_WEBHOOK_ARCHITECTURE_SNIPPETS = [
  '| **Retries** | 10 attempts with exponential backoff: base 1 second, multiplier 2x, max 60 seconds. `410 Gone` exhausts immediately. |',
  '| **Webhook retries** | 10 attempts maximum. After exhaustion, the delivery is marked as `exhausted`. `410 Gone` marks a delivery exhausted immediately. |',
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

const REQUIRED_DM_HISTORY_API_SNIPPETS = [
  'Get DM history',
  'GET /x/dm/{userId}/history',
  'Requires a connected X account passed via the `account` query parameter.',
  'DM history is participant-scoped',
  'params={"account": "your_handle"}',
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
] as const;

const REQUIRED_SEND_DM_API_SNIPPETS = [
  'Send DM API',
  'Twitter DM API',
  'X direct message API',
  'send DM with media',
  'messageId',
  '## Send with media',
  'Upload media first with [Upload Media](/api-reference/x-write/upload-media)',
  '`media_ids` must contain exactly one uploaded media ID.',
  'Empty arrays, multiple IDs, and `reply_to_message_id` return `400 invalid_input`.',
  '## Direct message handoff',
  'support, sales, community, CRM, or agent workflow',
  '[`GET /x/users/{id}`](/api-reference/x/get-user)',
  '[`GET /x/dm/{userId}/history`](/api-reference/x/dm-history)',
  '`messageId` | Outbound DM ID. Store it as the external message ID for support logs, CRM records, queues, or agent memory. |',
  '`success` | Mark the send job complete after a `200 OK` response. |',
  '`userId` | Recipient X user ID from the path. |',
  '`account` | Connected X account that sent the DM. |',
  '`text` | Exact message text sent. Store your own timestamp if downstream systems need `sent_at`. |',
  '`media_ids[0]` | Uploaded media ID when the DM includes one attachment from [`POST /x/media`](/api-reference/x-write/upload-media). |',
  'This endpoint costs 10 credits per send.',
  'Uploading media first with `POST /x/media` is a separate 10-credit call.',
  '`x_dm_not_allowed`',
  'the recipient may not accept messages from this connected account; do not retry unchanged.',
  'Do not retry `422 x_dm_not_allowed` unchanged',
  'Empty arrays and multiple IDs are rejected.',
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
  '## Integration Handoff Matrix',
  '## High-Value Workflows First',
  'rows for analysts, IDs for systems of record, events for queues, and published action IDs for audit trails',
  '### 1. Scrape tweets to CSV, JSON, or XLSX',
  '`tweet_search_extractor`',
  '`GET /x/tweets/search`',
  '`tweets`, `has_next_page`, and `next_cursor`',
  '`reply_extractor` with `targetTweetId`',
  '1 credit per tweet returned or extracted',
  '### 2. Export followers to CRM or warehouse',
  '`follower_explorer`',
  '`x_user_id`',
  '1 credit per follower returned',
  '### 3. Monitor tweets to signed webhooks',
  '`deliveryId`, `streamEventId`, `eventType`, and tweet data',
  '21 credits per active monitor-hour; webhook delivery is included',
  '### 4. Post image tweets or replies',
  '`POST /x/tweets` with `media`',
  'Do not call `POST /x/media` first for tweet posts',
  '`POST /x/tweets` rejects `media_ids` with `400 unsupported_field`',
  '"media": ["https://example.com/product-screenshot.png"]',
  '`202 x_write_unconfirmed` with `writeActionId`',
  'Use `POST /x/media` only when you need a one-item `media_ids` array for [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm).',
  '10 credits per post tweet call',
  '### 5. Send direct messages with returned IDs',
  '`GET /x/dm/{userId}/history`, then `POST /x/dm/{userId}`',
  '`messageId` and `success`',
  '1 credit per message returned; 10 credits per DM send',
  '`POST /monitors`, then `GET /events`',
  '`POST /webhooks`, then `POST /webhooks/{id}/test`',
  "`xquik.request('/api/v1/x/tweets/search')`",
  '`POST /extractions/estimate`, then `POST /extractions`',
  '`POST /x/tweets`',
  'Post tweets or replies',
  'post tweet replies',
  '`reply_to_tweet_id`',
  '`tweetId` and `success`',
  '10 credits per write',
  '"nextBillingAt": "2026-02-24T10:30:00.000Z"',
  '`POST /compose` with `step`',
  'CSV, JSON, XLSX, or paginated JSON',
  '21 credits per hour',
  'Compose, refine, and score are free',
  '### Step 4: Queue the handoff',
  'persist `deliveryId` as the idempotency key',
  '`streamEventId`, `eventType`, `occurredAt`, `schemaVersion`',
  '`username` for account monitor events',
  '`query` for keyword monitor events',
  '`xquik-monitor-events.jsonl`',
  '"handoff_format": "jsonl"',
  '"delivery_id": "502"',
  '"stream_event_id": "9001"',
  '"source_username": "xquikcom"',
  '"source_query": null',
  '"idempotency_key": "delivery:502"',
  '"event_dedupe_key": "stream_event:9001"',
  'Return `2xx` before slow CRM, warehouse, Slack, or queue work starts.',
  'retries network failures and non-`2xx` responses up to 10 attempts',
  'Return `410 Gone` only when Xquik should stop retrying that delivery immediately.',
] as const;

const REQUIRED_KEYWORD_MONITOR_API_HANDOFF_SNIPPETS = [
  'monitor tweets',
  'signed webhooks',
  '## Keyword monitor handoff',
  '`POST /monitors/keywords`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '`id` | Keyword monitor ID. Use it as `monitorId` for `GET /events`, updates, pauses, and deletes. |',
  '`query` | Normalized X search query. It is also included on keyword monitor events and webhook payloads. |',
  '`eventTypes` | Event filter to match against webhook subscriptions. |',
  '`deliveryId`, `streamEventId`, `eventType`, `occurredAt`, `query`, and `data`',
  'Use `deliveryId` for receiver idempotency and `streamEventId` to join back to `GET /events/{id}`.',
  'Active keyword monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Creation or reactivation requires 22 available credits.',
  '`PATCH /monitors/keywords/{id}`',
  '"message": "Monitor already exists."',
] as const;

const REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS = [
  'monitor tweets',
  'signed webhooks',
  '## Account monitor handoff',
  '`POST /monitors`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '`id` | Account monitor ID. Use it as `monitorId` for `GET /events`, updates, pauses, and deletes. |',
  '`username` | Stored X username after trimming and removing the `@` prefix. |',
  '`xUserId` | Resolved X user ID. Use it for joins, dedupe, and downstream identity mapping. |',
  '`eventTypes` | Event filter to match against webhook subscriptions. |',
  '`deliveryId`, `streamEventId`, `eventType`, `occurredAt`, `username`, and `data`',
  'Use `deliveryId` for receiver idempotency and `streamEventId` to join back to `GET /events/{id}`.',
  'Active account monitors check every 1 second and cost 21 credits per active monitor-hour.',
  'Creation or reactivation requires 22 available credits: 1 credit for the username lookup plus 21 credits for the first active monitor hour.',
  '`PATCH /monitors/{id}`',
  '"message": "Monitor already exists."',
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
  '/guides/zapier',
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
  '/guides/pipedream',
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

const REQUIRED_MAKE_ALTERNATIVE_SNIPPETS = [
  '## Source-backed Make scope',
  "Make's official pricing page says each module action in a scenario counts as one credit, Free includes 1,000 credits/month",
  "Make's official HTTP app documentation says the HTTP app can call services without a native Make integration",
  'offset, page, URL/link, or cursor-style pagination',
  'instant webhooks, custom webhooks, webhook queues, response handling',
  'action, search, polling trigger, instant trigger, universal, and responder module types',
  'Make webhooks',
  'Make custom app modules',
  '/guides/make',
] as const;

const REQUIRED_WORKFLOW_SHORTLIST_SNIPPETS = [
  '## Workflow Automation Shortlist',
  '[n8n](/alternatives/n8n)',
  '[Make](/alternatives/make)',
  '[Pipedream](/alternatives/pipedream)',
  '[Zapier](/alternatives/zapier)',
  '[PhantomBuster](/alternatives/phantombuster)',
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
  'Developer API teams',
  '[X API](/alternatives/x-api)',
  '[Apify](/alternatives/apify)',
  'Xquik on Apify',
  'Creator publishing teams',
  'Social listening and enterprise teams',
  '[Brandwatch](/alternatives/brandwatch)',
  '[Meltwater](/alternatives/meltwater)',
  '[Talkwalker](/alternatives/talkwalker)',
  'Workflow automation teams',
  'AI agent teams',
  'signed webhooks',
  'CSV/JSON/XLSX exports',
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
  'Credits are deducted per API call (1-10 credits depending on the operation).',
  'Each operation costs 1-10 credits depending on the endpoint.',
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

  it('keeps the quickstart concrete and aligned with monitor response fields', (): void => {
    expect.assertions(1);

    const quickstart = readFileSync('quickstart.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        quickstart,
        'Quickstart',
        REQUIRED_QUICKSTART_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the SDK overview useful for choosing SDK, CLI, and MCP handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'SDK overview docs',
        REQUIRED_SDK_OVERVIEW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the TypeScript SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/typescript.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'TypeScript SDK workflow docs',
        REQUIRED_TYPESCRIPT_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Go SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/go.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Go SDK workflow docs',
        REQUIRED_GO_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Python SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/python.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Python SDK workflow docs',
        REQUIRED_PYTHON_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Ruby SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/ruby.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Ruby SDK workflow docs',
        REQUIRED_RUBY_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the CLI SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/cli.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'CLI SDK workflow docs',
        REQUIRED_CLI_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the C# SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/csharp.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'C# SDK workflow docs',
        REQUIRED_CSHARP_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the PHP SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/php.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'PHP SDK workflow docs',
        REQUIRED_PHP_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Java SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/java.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Java SDK workflow docs',
        REQUIRED_JAVA_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Kotlin SDK page useful for tweet search handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/kotlin.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Kotlin SDK workflow docs',
        REQUIRED_KOTLIN_SDK_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the Terraform provider page useful for monitor webhook handoffs', (): void => {
    expect.assertions(1);

    const source = readFileSync('sdks/terraform.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Terraform provider workflow docs',
        REQUIRED_TERRAFORM_PROVIDER_WORKFLOW_SNIPPETS,
      ),
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

  it('keeps billing recovery steps concrete for 402 failures', (): void => {
    expect.assertions(1);

    const billing = readFileSync('guides/billing.mdx', 'utf8');

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

  it('keeps write confirmation recovery current in error handling', (): void => {
    expect.assertions(1);

    const source = [
      readFileSync('guides/error-handling.mdx', 'utf8'),
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
  });

  it('keeps follower export CRM handoff steps concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/follower-export-crm.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Follower export CRM guide',
        REQUIRED_CRM_EXPORT_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps tweet replies export workflow steps concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/tweet-replies-export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet replies export guide',
        REQUIRED_TWEET_REPLIES_EXPORT_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the tweet replies API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/tweet-replies.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet replies API page',
        REQUIRED_TWEET_REPLIES_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
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
    ).toStrictEqual([]);
  });

  it('keeps tweet search export workflow steps concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/tweet-search-export.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Tweet search export guide',
        REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the search tweets API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/search-tweets.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Search tweets API page',
        REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the extraction workflow concrete for credits, JSON, and file handoffs', (): void => {
    expect.assertions(1);

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
  });

  it('keeps the media upload handoff clear for tweets and DMs', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/media-upload-workflow.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Media upload workflow guide',
        REQUIRED_MEDIA_UPLOAD_WORKFLOW_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the upload media API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-write/upload-media.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Upload media API page',
        REQUIRED_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the direct message workflow aligned with DM API behavior', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/direct-message-workflow.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Direct message workflow guide',
        REQUIRED_DIRECT_MESSAGE_WORKFLOW_SNIPPETS,
      ),
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
      collectSnippetFindings(
        source,
        'DM history API docs',
        REQUIRED_DM_HISTORY_API_SNIPPETS,
      ),
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
        ...collectSnippetFindings(
          deliveriesApi,
          'Webhook deliveries API docs',
          REQUIRED_WEBHOOK_DELIVERIES_API_SNIPPETS,
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

  it('keeps the Send DM API page clear about media attachments', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x-write/send-dm.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Send DM API docs',
        REQUIRED_SEND_DM_API_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the create tweet API page useful for post and reply handoffs', (): void => {
    expect.assertions(1);

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
  });

  it('keeps the write action status API page useful for queue handoffs', (): void => {
    expect.assertions(1);

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
  });

  it('keeps the workflows overview handoff matrix concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/workflows.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Workflows overview',
        REQUIRED_WORKFLOW_OVERVIEW_SNIPPETS,
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
      collectSnippetFindings(
        source,
        'Create keyword monitor API page',
        REQUIRED_KEYWORD_MONITOR_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the account monitor API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/create.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Create account monitor API page',
        REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS,
      ),
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

  it('keeps the alternatives workflow shortlist concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Alternatives workflow shortlist',
        REQUIRED_WORKFLOW_SHORTLIST_SNIPPETS,
      ),
    ).toStrictEqual([]);
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
    expect.assertions(1);

    const source = readFileSync('alternatives.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Alternatives sector matrix',
        REQUIRED_ALTERNATIVES_SECTOR_SNIPPETS,
      ),
    ).toStrictEqual([]);
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

  it('keeps comparison guides direct and value focused', (): void => {
    expect.assertions(1);

    expect(collectComparisonPositioningFindings()).toStrictEqual([]);
  });
});
