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

const REQUIRED_LLMS_SNIPPETS = [
  '## Agent Entry Points',
  'https://context7.com/xquik-dev/xquik-docs',
  'https://xquik.com/mcp',
  'npx skills add Xquik-dev/x-twitter-scraper',
  'https://docs.xquik.com/openapi.yaml',
  '"status": "pending_confirmation"',
  '"writeActionId": "42"',
  '`GET /x/write-actions/{id}`',
] as const;

const REQUIRED_MCP_CONTRACT_SNIPPETS = [
  '`xquik.request()` uses the normalized v1 contract automatically.',
  'has_more',
  'next_cursor',
  'Pass `next_cursor` back as the `cursor` query parameter',
  'MCP server\'s `xquik.request()` tool sends that normalized contract automatically',
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
  'If quick top-up returns `no_payment_method`, create a checkout top-up instead.',
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
  '`no_addon` | 402 | No | Check billing status. Current plans include unlimited monitor slots.',
  '`monitor_limit_reached` | 403 | No | Check billing status. Current plans include unlimited monitor slots.',
] as const;

const FORBIDDEN_ERROR_HANDLING_SNIPPETS = [
  'Add a monitor addon from the dashboard.',
  'Delete a monitor or add capacity ($5/month).',
  'add capacity ($5/month per extra monitor)',
] as const;

const REQUIRED_CRM_EXPORT_WORKFLOW_SNIPPETS = [
  'follower_explorer',
  'resultsLimit',
  'GET /extractions/{id}/export?format=csv',
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
  'format=csv',
  'format=xlsx',
  'CSV, JSON, or XLSX',
  '`next_cursor`',
  '`resultsLimit`',
  '1 credit per tweet returned',
] as const;

const REQUIRED_TWEET_SEARCH_EXPORT_SNIPPETS = [
  'scrape tweets',
  '`tweet_search_extractor`',
  'POST /extractions/estimate',
  'POST /extractions',
  'GET /extractions/{id}',
  'GET /x/tweets/search',
  'format=csv',
  'format=xlsx',
  'CSV, JSON, or XLSX',
  '`next_cursor`',
  '`resultsLimit`',
  '1 credit per tweet returned',
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
] as const;

const FORBIDDEN_EXTRACTION_WORKFLOW_SNIPPETS = [
  'quota',
] as const;

const REQUIRED_MEDIA_UPLOAD_WORKFLOW_SNIPPETS = [
  'media upload',
  'POST /x/media',
  'multipart/form-data',
  'application/json',
  '`mediaUrl`',
  '`mediaId`',
  'POST /x/tweets',
  'POST /x/dm/{userId}',
  '`media_ids`',
  'Do not send `media_ids` to `POST /x/tweets`',
  '10 credits per upload call',
  'AVIF, GIF, JPEG, PNG, WebP, and MP4',
  'Media IDs are valid for 24 hours',
  'The URL must use HTTPS, resolve to a public address, return a supported media content type, finish within 30 seconds, and stay under the 15,728,640-byte URL download cap.',
  '### URL upload checklist',
  'Non-HTTPS URLs return `422 media_download_failed`.',
  'Private or reserved IP targets are rejected.',
  'Slow origins can time out before upload starts.',
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
  '`messageId`',
  '`success`',
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

const REQUIRED_WEBHOOK_VERIFICATION_SNIPPETS = [
  'if (!verifyWebhook(req, WEBHOOK_SECRET))',
  'if not verify_webhook(request, WEBHOOK_SECRET):',
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

const FORBIDDEN_WEBHOOK_VERIFICATION_SNIPPETS = [
  'verifyWebhookSignature(',
  'verify_webhook_signature(',
] as const;

const REQUIRED_SEND_DM_API_SNIPPETS = [
  'Twitter DM API',
  'X direct message API',
  'send DM with media',
  '## Send with media',
  'Upload media first with [Upload Media](/api-reference/x-write/upload-media)',
  '`media_ids` must contain exactly one uploaded media ID.',
  'Empty arrays, multiple IDs, and `reply_to_message_id` return `400 invalid_input`.',
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

const REQUIRED_WORKFLOW_OVERVIEW_SNIPPETS = [
  '## Integration Handoff Matrix',
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
] as const;

const REQUIRED_ZAPIER_ALTERNATIVE_SNIPPETS = [
  'API by Zapier',
  'Webhooks by Zapier',
  'Zapier Platform CLI',
  'REST Hooks',
  'bundle.targetUrl',
  '20,000 requests every 5 minutes',
  '/guides/zapier',
] as const;

const REQUIRED_PIPEDREAM_ALTERNATIVE_SNIPPETS = [
  'Pipedream Workflows',
  'one credit per 30 seconds',
  'HTTP trigger',
  'steps.trigger.event',
  'Pipedream CLI',
  'pd publish',
  '/guides/pipedream',
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
  'Consumer intelligence and social media management suite.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one social listening job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Brandwatch site',
] as const;

const REQUIRED_MELTWATER_ALTERNATIVE_SNIPPETS = [
  'media monitoring, social listening, or social media management workflow',
  'search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Media intelligence, social listening, and social media management suite.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one monitoring job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Meltwater site',
] as const;

const REQUIRED_TALKWALKER_ALTERNATIVE_SNIPPETS = [
  'social listening, consumer intelligence, or social media analytics workflow',
  'search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Consumer intelligence, social listening, and social media analytics platform.',
  'tweet search, follower exports, monitor events, signed webhook payloads, CSV/JSON/XLSX exports',
  'Run one listening job',
  'Compare tweet IDs, author IDs, timestamps, text, metrics, media links, pagination, export fields, webhook signatures, and error handling.',
  'Official Talkwalker site',
] as const;

const REQUIRED_TWEETDECK_ALTERNATIVE_SNIPPETS = [
  'TweetDeck/X Pro is a live X workspace for columns, search, scheduled posts, and manual monitoring.',
  'X Pro help lists a full post composer, scheduled posts, advanced search, top/latest post order, Decks, a column creator, video docking, and account switching.',
  'search tweets, fetch users, export followers, post tweets, upload media, send DMs, monitor keywords, and receive webhook events',
  'Compare columns, saved searches, tweet IDs, author IDs, timestamps, post results, export formats, webhook payloads, and the handoff to your production system.',
  'Active Xquik monitors cost 21 credits per hour while enabled, and webhook plus stored-event delivery is included.',
  'Official X Pro help',
  'Official X Premium terms',
] as const;

const REQUIRED_HOOTSUITE_ALTERNATIVE_SNIPPETS = [
  'schedule posts, review inboxes, analyze campaigns, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media management, publishing, engagement, listening, analytics, ads, and enterprise collaboration suite.',
  "Hootsuite's platform page lists social scheduling, AI writing, recommended posting times, bulk scheduling, private/public messaging inboxes, saved replies, automated tagging, assignments, listening streams, sentiment, reports, ads, and marketing integrations.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Hootsuite seats, social accounts, analytics, approvals, listening, and Enterprise add-ons',
  'Official Hootsuite platform',
  'Official Hootsuite plans',
] as const;

const REQUIRED_SPROUT_SOCIAL_ALTERNATIVE_SNIPPETS = [
  'plan posts, manage a Smart Inbox, analyze reports, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media management, publishing, engagement, analytics, listening, advocacy, influencer, and customer-care suite.',
  "Sprout's features page lists unified social inbox, multi-profile publishing, multimedia publishing, ViralPost send-time optimization, message approval workflow, bulk scheduling, PDF/CSV reporting, X competitor reports, X keyword reports, CRM integrations, and chatbots.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Sprout seats, social profiles, Premium Analytics, Listening, Advocacy, Influencer Marketing, and Enterprise scope',
  'Official Sprout Social features',
  'Official Sprout Social pricing',
] as const;

const REQUIRED_BUFFER_ALTERNATIVE_SNIPPETS = [
  'plan posts, schedule threads, manage comments, analyze posts, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Social media scheduling, publishing, analytics, community, and collaboration platform.',
  "Buffer's official pages list supported channels for Bluesky, Facebook, Google Business Profile, Instagram, LinkedIn, Mastodon, Pinterest, Threads, TikTok, X, and YouTube; publishing features for queues, visual calendars, threaded posts, AI Assistant, first-comment scheduling, channel groups, and hashtag manager; Community features for cross-platform comment replies, notifications, filters, comment score, saved replies, AI replies, and turning comments into posts.",
  'tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports, webhook signatures, and error handling.',
  'Buffer channels, scheduled-post volume, Community replies, analytics reports, approval workflows, and integrations',
  'Official Buffer publish',
  'Official Buffer community',
] as const;

const REQUIRED_TYPEFULLY_ALTERNATIVE_SNIPPETS = [
  'write X threads, schedule posts, cross-post content, use AI writing help, inspect analytics, search tweets, export followers, monitor accounts or keywords, send webhooks',
  'Creator publishing, X thread scheduling, social scheduling, analytics, API, and MCP platform.',
  "Typefully's official pages list AI writing, X thread scheduling, natural-language scheduling, content queues, realistic previews, cross-posting to LinkedIn, Threads, Bluesky, and Mastodon, detailed X analytics, draft comments, Auto-DMs, image cropping, auto-splitting, multiple connected accounts, REST API, webhooks, and MCP.",
  'draft IDs, social sets, media IDs, queue state, analytics fields, tweet IDs, author IDs, timestamps, post results, CSV/JSON/XLSX exports',
  'Typefully connected accounts, collaboration, analytics, API access, MCP access, Auto-DMs, and cross-posting',
  'Official Typefully X scheduling',
  'Official Typefully API',
  'Official Typefully MCP',
] as const;

const REQUIRED_APIFY_ALTERNATIVE_SNIPPETS = [
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
  'post tweets',
  'send direct messages',
  'Owned Reads',
  'USD 0.001 per resource',
  'posts, bookmarks, followers, likes, lists',
  'Developer Console',
] as const;

const REQUIRED_AUDIENSE_ALTERNATIVE_SNIPPETS = [
  'audience intelligence, influencer discovery, tweet search, follower export, account or keyword monitoring, signed webhooks, API access, and agent handoff',
  'Audiense public pages describe consumer segmentation, cultural insights, X community management, follower analytics, hashtag analytics, and influencer discovery.',
  '## Audience & influencer handoff',
  'Use this section when the search intent is "Audiense alternative for influencer discovery", "X audience intelligence", "export X followers", or "turn X audiences into CRM data".',
  'Use Audiense influencer views, filters, affinity sorting, uniqueness sorting, and paid-plan XLS export.',
  'Use follower exports, tweet search, verified follower exports, and engagement fields to build your own scoring model.',
  'Audiense prioritizes influencer discovery. Xquik prioritizes data ownership and downstream automation.',
  'Use keyword monitors, tweet search exports, signed webhooks, and `GET /events` for real-time records.',
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
      collectSnippetFindings(
        source,
        'API overview',
        REQUIRED_API_OVERVIEW_CHECKLIST_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps write confirmation recovery current in error handling', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/error-handling.mdx', 'utf8');

    expect(
      [
        ...collectSnippetFindings(
          source,
          'Error handling guide',
          REQUIRED_ERROR_HANDLING_WRITE_STATUS_SNIPPETS,
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

    expect(
      [
        ...collectSnippetFindings(
          overview,
          'Webhook overview',
          REQUIRED_WEBHOOK_OVERVIEW_SNIPPETS,
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
