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
] as const;

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
  '<Card title="Post media tweets or replies" icon="image">',
  '<Card title="Upload DM attachments" icon="message-circle">',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  '<Card title="Agent handoff" icon="bot">',
  '[TypeScript](/sdks/typescript)',
  '[Python](/sdks/python)',
  '[Go](/sdks/go)',
  '[CLI](/sdks/cli)',
  '[Search Tweets](/api-reference/x/search-tweets)',
  '[Create Tweet](/api-reference/x-write/create-tweet)',
  '[Upload Media](/api-reference/x-write/upload-media)',
  '[Send Direct Message](/api-reference/x-write/send-dm)',
  'public media URLs',
  'up to 4 image URLs or exactly 1 MP4 video URL up to 100 MB',
  '`mediaId` as the one-item `media_ids` value',
  'store `mediaUrl` and the',
  'one-item `media_ids`',
  'Cost: 1 credit per',
  'Cost: 10 credits per tweet or reply write.',
  'Cost: 10 credits per media upload plus 10 credits per',
  'instant monitors cost 21 credits per active monitor-hour.',
  '[MCP Server](/mcp/overview)',
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
  '`q`',
  '`limit`',
  '`cursor`',
  '`sinceTime`',
  '`untilTime`',
  '`queryType`',
  'Maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains tweet records with `id`, `text`, optional `author`, `createdAt`, `likeCount`, `replyCount`, `retweetCount`, `quoteCount`, `bookmarkCount`, `viewCount`, and `isNoteTweet` when available.',
  'JSON field `next_cursor`. Store it with the job checkpoint and pass it back as `cursor`.',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '`client.extractions.estimateCost`',
  '`client.extractions.run`',
  '`client.extractions.retrieve`',
  '`client.extractions.exportResults`',
  '`reply_extractor` requires `targetTweetId`.',
  '`client.extractions.retrieve` returns `results`, `hasMore`, and `nextCursor`',
  '`client.extractions.exportResults` supports `csv`, `json`, and `xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  '`client.x.media.upload`',
  '`media.mediaId`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.messageId`',
  'Do not pass uploaded `media.mediaId` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_TYPESCRIPT_SDK_RAW_SEARCH_SNIPPETS = [
  'process.stdout.write(JSON.stringify(tweets, null, 2));',
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
  'Go field `Limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Go field `Cursor` maps to REST `cursor`. Pass the opaque cursor from `NextCursor` to request the next page.',
  '`PaginatedTweets`',
  '`Tweets`',
  '`HasNextPage`',
  '`NextCursor`',
  'JSON field `tweets`. Contains tweet records with `ID`, `Text`, `Author`, `CreatedAt`, `LikeCount`, `ReplyCount`, `RetweetCount`, `QuoteCount`, `BookmarkCount`, `ViewCount`, and `IsNoteTweet` when available.',
  'JSON field `next_cursor`. Store it with the job checkpoint and pass it back as `Cursor`.',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
  '`client.Extractions.EstimateCost`',
  '`client.Extractions.Run`',
  '`client.Extractions.Get`',
  '`client.Extractions.ExportResults`',
  '`reply_extractor` requires `TargetTweetID`.',
  '`client.Extractions.Get` returns `Results`, `HasMore`, and `NextCursor`',
  '`client.Extractions.ExportResults` supports CSV, JSON, and XLSX',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.X.Tweets.New`',
  '`ReplyToTweetID`',
  '`Media` with public media URLs',
  '`client.X.Media.Upload`',
  '`media.MediaID`',
  '`client.X.Dm.Send`',
  '`MediaIDs`',
  '`dm.MessageID`',
  'Do not pass uploaded `MediaID` values to `client.X.Tweets.New`',
] as const;

const FORBIDDEN_GO_SDK_WEAK_SEARCH_SNIPPETS = [
  'fmt.Printf("%+v\\n", tweets.HasNextPage)',
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
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '## Workflow: Post Media Tweets and DM Attachments',
  '`client.x.tweets.search`',
  '`GET /x/tweets/search`',
  '`TweetSearchParams`',
  '`q`',
  '`limit`',
  '`cursor`',
  '`since_time`',
  '`until_time`',
  '`query_type`',
  'Python argument `q` maps to REST `q`. Use it for the required X search query with keywords, handles, hashtags, or operators.',
  'Python argument `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Python argument `cursor` maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains `SearchTweet` records with `id`, `text`, optional `author`, `created_at`, `like_count`, `reply_count`, `retweet_count`, `quote_count`, `bookmark_count`, `view_count`, and `is_note_tweet` when available.',
  'JSON field `next_cursor`. Store it with the job checkpoint and pass it back as `cursor`.',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` to CSV for analysts',
  'JSON Lines for queues and data lakes',
  '`tweet.to_json(indent=None)`',
  'Load the projected rows into pandas or openpyxl when account teams need an XLSX workbook.',
  '`xquik-tweet-search.jsonl`',
  '`client.extractions.estimate_cost`',
  '`client.extractions.run`',
  '`client.extractions.retrieve`',
  '`client.extractions.export_results`',
  '`reply_extractor` requires `target_tweet_id`.',
  '`client.extractions.retrieve` returns `results`, `has_more`, and `next_cursor`',
  '`client.extractions.export_results` supports `csv`, `json`, and `xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send`',
  '`media_ids`',
  '`dm.message_id`',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_PYTHON_SDK_RAW_SEARCH_SNIPPETS = [
  'print(tweets.to_json())',
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
  'Ruby keyword `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Ruby keyword `cursor` maps to REST `cursor`. Pass the opaque cursor from `page.next_cursor` to request the next page.',
  '`XTwitterScraper::PaginatedTweets`',
  '`page.tweets`',
  '`page.has_next_page`',
  '`page.next_cursor`',
  'JSON field `tweets`. Contains `SearchTweet` records with `id`, `text`, optional `author`, `created_at`, `like_count`, `reply_count`, `retweet_count`, `quote_count`, `bookmark_count`, `view_count`, and `is_note_tweet` when available.',
  'JSON field `next_cursor`. Store it with the job checkpoint and pass it back as `cursor`.',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets` to CSV for analysts',
  'JSON Lines for queues and data lakes',
  '`xquik-tweet-search.jsonl`',
  '`tweet.to_json`',
  '`tweet.deep_to_h`',
  'XLSX writer',
  '`client.extractions.estimate_cost`',
  '`client.extractions.run`',
  '`client.extractions.retrieve`',
  '`client.extractions.export_results`',
  '`reply_extractor` requires `target_tweet_id`.',
  '`client.extractions.retrieve` returns `results`, `has_more`, and `next_cursor`',
  '`client.extractions.export_results` supports `:csv`, `:json`, and `:xlsx`',
  'Cost: 1 credit per reply extracted or returned.',
  '`client.x.tweets.create`',
  '`reply_to_tweet_id`',
  '`media` with public media URLs',
  '`client.x.media.upload`',
  '`media.media_id`',
  '`client.x.dm.send_`',
  '`media_ids`',
  '`dm.message_id`',
  'Do not pass uploaded `media.media_id` values to `client.x.tweets.create`',
  'Throws `BadRequestError`.',
  'Throws `RateLimitError`.',
  'Throws `InternalServerError`.',
] as const;

const FORBIDDEN_RUBY_SDK_WEAK_SEARCH_SNIPPETS = [
  'puts(tweets.has_next_page)',
] as const;

const REQUIRED_CLI_SDK_WORKFLOW_SNIPPETS = [
  '## Workflow: Search Tweets to JSON Lines, CSV, or XLSX',
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
  'Use `--limit` for a bounded request from 1 to 200. Omit it when passing `--cursor` in page loops.',
  'Write one JSON object per line for downstream jobs',
  '`xquik-tweet-search.jsonl`',
  'projected records to CSV for analysts',
  'produce XLSX from those rows',
  '`--format-error json`',
  'x-twitter-scraper extractions estimate-cost',
  '`POST /extractions/estimate`',
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
  'store `writeActionId` and poll `GET /x/write-actions/{id}`',
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
  'DMs accept exactly 1 uploaded media ID.',
  'Do not pass uploaded `mediaId` values to `x:tweets create`',
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
  'C# property `Limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'C# property `Cursor` maps to REST `cursor`.',
  'C# property `QueryType` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.Tweets`',
  '`page.HasNextPage`',
  '`page.NextCursor`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.Tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected rows into CSV for analysts',
  'write XLSX from those rows',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`client.Extractions.EstimateCost`',
  '`client.Extractions.Run`',
  '`ExtractionEstimateCostParamsToolType.ReplyExtractor`',
  '`ExtractionRunParamsToolType.ReplyExtractor`',
  '`reply_extractor` requires `TargetTweetID`.',
  '`client.Extractions.Retrieve` returns `Results`, `HasMore`, and `NextCursor`',
  '`client.Extractions.ExportResults` returns an `HttpResponse`',
  'read CSV and JSON as strings, and copy XLSX from the response stream',
  'Cost: 1 credit per reply extracted or returned.',
  'Store `job.ID` on the queue job, ticket, or warehouse batch before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
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
  'Throws `XTwitterScraperBadRequestException`.',
  'Throws `XTwitterScraperRateLimitException`.',
  'Throws `XTwitterScraper5xxException`.',
] as const;

const FORBIDDEN_CSHARP_SDK_WEAK_SEARCH_SNIPPETS = [
  'var tweets = await client.X.Tweets.Search(parameters);',
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
  'PHP argument `limit` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'PHP argument `cursor` maps to REST `cursor`.',
  'PHP argument `queryType` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`$page->tweets`',
  '`$page->hasNextPage`',
  '`$page->nextCursor`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `$page->tweets` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected rows into CSV for analysts',
  'generate XLSX from those rows',
  '## Workflow: Tweet Replies to CSV, JSON, or XLSX',
  '`$client->extractions->estimateCost()`',
  '`$client->extractions->run()`',
  '`ToolType::REPLY_EXTRACTOR`',
  '`reply_extractor` requires `targetTweetID`.',
  '`$client->extractions->retrieve()` returns `results`, `hasMore`, and `nextCursor`',
  '`$client->extractions->exportResults()`',
  '`CSV`, `JSON`, and `XLSX` export formats',
  'Cost: 1 credit per reply extracted or returned.',
  'Store `$job->id` on the queue job, ticket, or warehouse batch before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
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
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_PHP_SDK_WEAK_SEARCH_SNIPPETS = [
  'var_export($tweets->hasNextPage)',
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
  'Java builder method `.limit()` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Java builder method `.cursor()` maps to REST `cursor`.',
  'Java builder method `.queryType()` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
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
  'ExtractionEstimateCostParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionRunParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionExportResultsParams.Format.CSV',
  '`ExtractionExportResultsParams.Format.JSON`',
  '`ExtractionExportResultsParams.Format.XLSX`',
  'HttpResponse export',
  'export.body()',
  'Persist `job.id()` before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
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
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_JAVA_SDK_WEAK_SEARCH_SNIPPETS = [
  'PaginatedTweets tweets = client.x().tweets().search(params);',
] as const;

const REQUIRED_KOTLIN_SDK_WORKFLOW_SNIPPETS = [
  'Search tweets and write durable JSON Lines handoff rows:',
  'val page: PaginatedTweets = client.x().tweets().search(params)',
  'for (tweet: SearchTweet in page.tweets()) {',
  '"tweet_id" to tweet.id(),',
  '"author_username" to tweet.author()?.username(),',
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
  'Kotlin builder method `.limit()` maps to REST `limit`. Use it for a bounded request from 1 to 200. Omit it for cursor loops.',
  'Kotlin builder method `.cursor()` maps to REST `cursor`.',
  'Kotlin builder method `.queryType()` maps to REST `queryType`.',
  '`PaginatedTweets`',
  '`page.tweets()`',
  '`page.hasNextPage()`',
  '`page.nextCursor()`',
  '`SearchTweet`',
  'Tweet search costs 1 credit per tweet returned.',
  'Write `page.tweets()` as JSON Lines to `xquik-tweet-search.jsonl`',
  'projected records into CSV for analysts',
  'produce XLSX from those rows',
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
  'ExtractionEstimateCostParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionRunParams.ToolType.REPLY_EXTRACTOR',
  'ExtractionExportResultsParams.Format.CSV',
  '`ExtractionExportResultsParams.Format.JSON`',
  '`ExtractionExportResultsParams.Format.XLSX`',
  'export.body()',
  'Persist `job.id()` before polling',
  '## Workflow: Post Media Tweets and DM Attachments',
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
  'Throws `BadRequestException`.',
  'Throws `RateLimitException`.',
  'Throws `InternalServerException`.',
] as const;

const FORBIDDEN_KOTLIN_SDK_WEAK_SEARCH_SNIPPETS = [
  'val tweets: PaginatedTweets = client.x().tweets().search(params)',
] as const;

const FORBIDDEN_TWEET_SEARCH_CURSOR_LIMIT_SNIPPETS = [
  'Use it for the page size from 1 to 200',
  'Use it for the maximum tweets to return for the page',
  '`q`, `limit`, and optional `cursor`',
  'with `q`, `limit`, and optional `cursor`',
  '--cursor "$cursor" \\\n    --limit 100',
  'limit: 100,\n    queryType: "Latest",\n    cursor,',
  'limit=100,\n            query_type="Latest",\n            cursor=cursor,',
  'Limit:     xtwitterscraper.Int(100),\n\t\t\tQueryType:',
  'limit: 100,\n        query_type: :Latest,\n        cursor: cursor',
  'Limit = 100,\n            Cursor = cursor,',
  'limit: 100,\n      cursor: $cursor,',
  '"limit": "{{parameters.limit || 25}}",\n    "cursor": "{{parameters.cursor}}"',
  'cursor=str(next_cursor),\n        limit=100,',
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
  '**Tweet Search Filters** (`tweet_search_extractor` and `GET /x/tweets/search`)',
  '`minQuotes`',
  '`anyWords`',
  '`quotesOfTweetId`',
  '**Tweet result filters**',
  '`GET /x/users/{id}/tweets`',
  '`GET /x/tweets/{id}/quotes`',
] as const;

const REQUIRED_SKILL_RATE_LIMIT_SNIPPETS = [
  '### Rate limits',
  '- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 10 per 1s user bucket.',
  '- **Write**: `POST`, `PUT`, and `PATCH` share a 30 per 60s user bucket.',
  '- **Delete**: `DELETE` requests use a 15 per 60s user bucket.',
  'Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header.',
] as const;

const FORBIDDEN_SKILL_RATE_LIMIT_SNIPPETS = [
  '| Tier | Methods | Limit |',
  '| Read | GET, HEAD, OPTIONS | 10 per 1s |',
  '| Write | POST, PUT, PATCH | 30 per 60s |',
  '| Delete | DELETE | 15 per 60s |',
] as const;

const REQUIRED_SKILL_DECISION_GUIDANCE_SNIPPETS = [
  '## Decision guidance',
  '- **Use the REST API** for backend services, automation scripts, interval polling, file exports, and fine-grained pagination or request control.',
  '- **Use the MCP server** for AI agents in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients, especially natural language queries.',
  '- **Use webhooks** when monitor events must reach an HTTPS endpoint in real time. Add them to REST or MCP workflows when pushed events are better than polling.',
] as const;

const FORBIDDEN_SKILL_DECISION_GUIDANCE_SNIPPETS = [
  '| Scenario | Use REST API | Use MCP Server | Use Webhooks |',
  '| Backend service or automation script | Yes | No | Optional |',
  '| AI agent in Claude, ChatGPT, Cursor, VS Code, or Codex | Optional | Yes | Optional |',
  '| Real-time event delivery | No | No | Yes |',
  '| Polling for events on interval | Yes | Yes | No |',
  '| File export as CSV, XLSX, JSON, Markdown, PDF, or text | Yes | Optional | No |',
  '| Natural language queries | No | Yes | No |',
  '| Fine-grained pagination and request control | Yes | Optional | No |',
] as const;

const REQUIRED_MCP_CONTRACT_SNIPPETS = [
  'MCP server discovery metadata is available at:',
  'https://xquik.com/.well-known/mcp.json',
  '`GET` and `POST` requests to `/.well-known/mcp.json` return the MCP registry',
  'server card JSON directly.',
  '`GET /.well-known/mcp/server-card.json` returns the',
  'same card for clients that read the nested server-card path.',
  'can also read `GET /.well-known/oauth-protected-resource/.well-known/mcp.json`',
  'Unauthenticated requests to `https://xquik.com/mcp` return `401`',
  '`WWW-Authenticate: Bearer`',
  'resource_metadata="https://xquik.com/.well-known/oauth-protected-resource/mcp"',
  'The JSON body is `{ "error": "Authentication required" }`.',
  'send `x-api-key` on the first request.',
  '`xquik.request()` uses the normalized v1 contract automatically.',
  'Search the API spec. Read-only, no network calls, no credits. Requires MCP authentication to execute.',
  'Free means no usage credits; the call still requires MCP authentication through an API key or OAuth Bearer token.',
  'Search the API endpoint catalog. Read-only, no network calls, and no credits required. The call still requires MCP authentication through an API key or OAuth Bearer token.',
  'has_more',
  'next_cursor',
  'Pass `next_cursor` back as the `cursor` query parameter',
  'MCP server\'s `xquik.request()` tool sends that normalized contract automatically',
  '## Agent handoff patterns',
  'MCP returns JSON.',
  'Use extraction export endpoints when you need Xquik to generate CSV, JSON, XLSX, Markdown, or PDF files.',
  '<Card title="Search tweets to JSON" icon="search">',
  'Call `GET /api/v1/x/tweets/search`. Store `tweets[].id`, `tweets[].text`, `tweets[].author`, `tweets[].created`, `has_more`, `next_cursor`, and the original `q`. Cost: 1 credit per tweet returned.',
  '<Card title="Scrape tweet replies to files" icon="messages-square">',
  'Call `POST /api/v1/extractions/estimate`, then `POST /api/v1/extractions` with `reply_extractor` and `targetTweetId`.',
  'Poll `GET /api/v1/extractions/{id}`, export CSV/JSON/XLSX with `GET /api/v1/extractions/{id}/export`, and store reply rows plus `has_more` and `next_cursor`.',
  'Cost: 1 credit per reply extracted or returned.',
  '<Card title="Export followers to CRM" icon="users">',
  'Call `GET /api/v1/x/users/{id}/followers` or `POST /api/v1/extractions` with `follower_explorer`.',
  '> Post a tweet or reply with public media URLs (subscription required)',
  "media: ['https://example.com/product-demo.mp4']",
  "> Upload media for a DM (subscription required)",
  'media_ids: [media.media_id]',
  '<Card title="Post media tweets or replies" icon="image">',
  'Call `POST /api/v1/x/tweets` with `media: ["https://..."]`. Store `tweet_id` or `write_action_id`, `reply_to_tweet_id`, `account`, and the original `media` URLs. Cost: 10 credits per write call.',
  '<Card title="Send DMs with media" icon="send">',
  'Call `POST /api/v1/x/media`, then `POST /api/v1/x/dm/{userId}` with one `media_ids` value. Store `media_id`, `media_url`, `message_id`, `user_id`, `account`, and source URL or filename. Cost: 10 credits per media upload plus 10 credits per DM send.',
  'Do not upload media before posting tweets or replies when the media is already public.',
  '`POST /api/v1/x/tweets` rejects `media_ids` with `400 unsupported_field`',
  'Reserve uploaded `media_id` values for direct messages.',
  '<Card title="Track tweet or reply writes" icon="activity">',
  'Call `POST /api/v1/x/tweets`, then `GET /api/v1/x/write-actions/{id}` when pending. Store `tweet_id`, `reply_to_tweet_id`, `write_action_id`, `status`, and `charged`. Cost: 10 credits per write call.',
  '<Card title="Monitor tweets to webhooks" icon="radio">',
  'Call `POST /api/v1/monitors` or `POST /api/v1/monitors/keywords`, then `POST /api/v1/webhooks`.',
  "save_secret_once: 'Store webhook.secret for X-Xquik-Signature verification; do not print it in logs.'",
  'run `POST /api/v1/webhooks/{id}/test` before routing production events',
  "source: 'xquik_mcp'",
  "job: 'tweet_search'",
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

const FORBIDDEN_MCP_CONTRACT_SNIPPETS = [
  'returns the same response shapes documented here. No field name mapping is needed.',
  'The sandbox automatically calls `POST /api/v1/subscribe` and includes a checkout URL in the error message.',
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
  'Cost: 10 credits per post tweet call.',
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
] as const;

const REQUIRED_CREATE_TWEET_API_SNIPPETS = [
  'Post tweets and replies from a connected X account with public image URLs or 1 MP4 video URL, write-status polling, and audit handoff',
  '"post tweet replies"',
  '`reply_to_tweet_id`',
  '`media`',
  'Array of public media URLs to attach directly.',
  'Send up to 4 JPEG, PNG, GIF, WebP, or AVIF image URLs, or exactly 1 MP4 video URL up to 100 MB.',
  'Do not mix video with other media.',
  'Use [Upload Media](/api-reference/x-write/upload-media) first if you need Xquik to host a local file',
  '## Post with public media URLs',
  'Use `media` when your image or MP4 video is already a public HTTPS URL or when [Upload Media](/api-reference/x-write/upload-media) returned `mediaUrl`.',
  'Send up to 4 image URLs or exactly 1 MP4 video URL up to 100 MB.',
  'Do not send `media_ids`; that field is for DMs only.',
  '"account": "brand_account"',
  '"media": ["https://cdn.example.com/product-screenshot.png"]',
  '"media": ["https://cdn.example.com/product-demo.mp4"]',
  '"reply_to_tweet_id": "1893456789012345678"',
  '"media": ["https://cdn.example.com/reply-chart.png"]',
  'Store `tweetId` on a `200 Success` response.',
  'If the API returns `202 x_write_unconfirmed`, store `writeActionId`',
  'Keep `reply_to_tweet_id` and `media` in your downstream record.',
  'store the returned `mediaUrl`, not the upload `mediaId`.',
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
  '<Card title="success" icon="circle-check">',
  'Store `writeActionId`, `action`, `charged`, and the returned `tweetId`',
  'Mark the original job as complete.',
  '<Card title="pending_confirmation" icon="clock">',
  'Store `writeActionId`, `sendDispatched`, `confirmationAttempts`',
  'poll again with backoff, and do not retry-send the same body.',
  '<Card title="failed" icon="triangle-alert">',
  'Store `writeActionId`, `action`, `sendDispatched`, `targetId`, `message`',
  'fix the account, target, content',
  'For tweet replies, `targetId` is the parent tweet ID when available.',
  'For DMs, `targetId` is the recipient user ID when available.',
  '`retryable` is always `false` on this status response',
  '"job_id": "reply-queue-184"',
  '"published_tweet_id": "2052816150136832166"',
  '"reply_to_tweet_id": "1893456789012345678"',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  'returns `messageId` after a confirmed direct message send.',
  'shows how to store DM `messageId` values.',
] as const;

const REQUIRED_X_ACCOUNTS_LIST_API_SNIPPETS = [
  'Retrieve all connected X accounts for your Xquik account',
  'Derived login/cookie health. One of `healthy`, `locked`, `needsReauth`, `recovering`, `suspended`, `temporaryIssue`.',
  '## Account health',
  '<Card title="healthy" icon="circle-check">',
  'Cookies are valid. Writes can proceed.',
  '<Card title="needsReauth" icon="refresh-cw">',
  '[reauth](/api-reference/x-accounts/reauth)',
  '<Card title="locked" icon="lock">',
  '`x.com/account/access`',
  '<Card title="suspended" icon="circle-x">',
  'writes will not recover automatically',
  '<Card title="recovering" icon="activity">',
  'Xquik will auto-retry on next use.',
  '<Card title="temporaryIssue" icon="triangle-alert">',
  'Transient service problem. Retry shortly.',
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
  'The account already has 100 API keys.',
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
  '### Paginated JSON handoff',
  'Only `id` and `xUserId` are guaranteed on every result',
  '"toolType": "follower_explorer"',
  '"hasMore": true',
  '"nextCursor": "1001"',
  'Use `limit` up to `1000` and pass `nextCursor` as `after`',
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
  '`statusesCount`',
  '`pageSize` accepts `20` to `200`',
  'paid calls can return fewer users',
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
  'Use `sinceTime` and `untilTime` as Unix timestamps in seconds',
  '--data-urlencode "sinceTime=1777392000"',
  '--data-urlencode "untilTime=1777478400"',
  '`resultsLimit`',
  'Estimate is free.',
  'Exports are free after the extraction job exists.',
  '1 credit per tweet returned',
  'Status `400`. Error `invalid_tweet_id`.',
  'Status `402`. Errors `no_subscription`, `subscription_inactive`, `no_credits`, or `insufficient_credits`.',
  'Status `429`. Error `rate_limit_exceeded`.',
  'Status `424` or `502`. Error `x_api_unavailable`.',
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
  '[Tweet Replies Export Workflow](/guides/tweet-replies-export)',
  'saved CSV, JSON, or XLSX files',
  '1 credit per tweet returned',
  '`402 insufficient_credits`',
  '`Retry-After`',
] as const;

const REQUIRED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  '## Direct follower handoff',
  '<CardGroup cols={2}>',
  '<Card title="Follower rows"',
  '<Card title="Next page"',
  '`GET /x/users/{id}/followers`',
  'CRM, warehouse, audience, or agent workflow',
  '`follower_explorer`',
  '[Follower Export CRM Workflow](/guides/follower-export-crm)',
  'saved CSV, JSON, or XLSX files',
  'imports or upserts',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`has_next_page` and `next_cursor`',
  'const importRows = data.users.map',
  'const nextCursor = data.has_next_page ? data.next_cursor : null;',
  'import_rows = [',
  'next_cursor = data["next_cursor"] if data["has_next_page"] else None',
  'shape CRM-safe import rows instead of printing',
  '`pageSize` from 20 to 200',
  '1 credit per result returned',
  '`402 insufficient_credits`',
  'USD 0.00015 per user returned',
] as const;

const FORBIDDEN_FOLLOWERS_API_RAW_OUTPUT_SNIPPETS = [
  'console.log(data);',
  'print(data)',
] as const;

const REQUIRED_FOLLOWING_API_HANDOFF_SNIPPETS = [
  '## Direct following handoff',
  '<CardGroup cols={2}>',
  '<Card title="Following rows"',
  '<Card title="Next page"',
  '`GET /x/users/{id}/following`',
  'CRM, warehouse, audience, or agent workflow',
  '`following_explorer`',
  'CSV/JSON/XLSX file export',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`has_next_page` and `next_cursor`',
  '`pageSize` from 20 to 200',
  '1 credit per user returned',
  '`402 insufficient_credits`',
  'USD 0.00015 per user returned',
] as const;

const REQUIRED_VERIFIED_FOLLOWERS_API_HANDOFF_SNIPPETS = [
  '## Direct verified followers handoff',
  '`GET /x/users/{id}/verified-followers`',
  'CRM, warehouse, scoring, enrichment, or agent workflow',
  '`verified_follower_explorer`',
  '[Create Extraction](/api-reference/extractions/create)',
  '[Export Extraction](/api-reference/extractions/export)',
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
  '1 credit per user returned',
  '`402 insufficient_credits`',
  'USD 0.00015 per user returned',
] as const;

const REQUIRED_FOLLOWERS_YOU_KNOW_API_HANDOFF_SNIPPETS = [
  '## Direct mutual followers handoff',
  '`GET /x/users/{id}/followers-you-know`',
  'sales, community, recruiting, support, CRM, or agent workflow',
  'people who follow both the authenticated context and the target user',
  '<CardGroup cols={2}>',
  '<Card title="Mutual rows"',
  '<Card title="Warm-intro labels"',
  '<Card title="DM preflight"',
  '[Direct Message Workflow](/guides/direct-message-workflow)',
  '[Send DM](/api-reference/x-write/send-dm)',
  '[DM History](/api-reference/x/dm-history)',
  '`users[]`',
  '`users[].id`',
  '`x_user_id`',
  '`users[].username` and `users[].name`',
  '`users[].canDm`',
  '`messageId`',
  'participant-scoped context',
  '`has_next_page` and `next_cursor`',
  '1 credit per user returned',
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
  '`tweets[].id`, `tweets[].text`, `tweets[].createdAt`, `tweets[].author.id`, `tweets[].author.username`, `has_next_page`, and `next_cursor`',
  '`xquik-tweet-search.jsonl`',
  'Omit `limit` for',
  'cursor-driven page loops.',
  'Pass `limit` only when you want Xquik to collect up to',
  'that count in one bounded request with no cursor handoff.',
  '`next_cursor`',
  '`resultsLimit`',
  'Cost is 1 credit per tweet returned.',
] as const;

const REQUIRED_SEARCH_TWEETS_API_HANDOFF_SNIPPETS = [
  'return paginated JSON tweet data for CRM, agents, or export handoff',
  '## Direct API handoff',
  '`GET /x/tweets/search`',
  'app, queue worker, CRM enrichment job, or',
  'agent needs the latest matching tweets',
  'It returns paginated JSON for live search pages and app ingestion.',
  'For CSV or',
  'XLSX output, project the returned `tweets[]` rows locally',
  '`tweet_search_extractor`',
  '`tweets[]`',
  '`tweets[].id`',
  '`tweets[].author.id` and `tweets[].author.username`',
  '`has_next_page` and `next_cursor`',
  '<Card title="File exports" icon="file-spreadsheet">',
  'Use `tweet_search_extractor` when the output must be saved CSV, JSON, or XLSX.',
  '`limit` is an upper bound from 1 to 200',
  'Do not combine `limit` with `cursor` for page-by-page loops.',
  'Omit it for cursor-based pagination.',
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
  '`502 x_api_unavailable` means the read service is temporarily unavailable.',
  'Retry with exponential backoff, then contact support if the error persists.',
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
  'one media attachment in DMs',
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
  '"record_type":"media_upload"',
  '"record_type":"tweet_media_post"',
  '"record_type":"dm_media_send"',
  '"tweet_media_field":"media"',
  '"dm_media_field":"media_ids[0]"',
  '"handoff_format":"jsonl"',
  'Use `media_url` for tweet and reply `media` arrays. Use `media_id` for the single DM `media_ids` item.',
  'Store upload, tweet/reply, or DM handoff rows in `xquik-media-handoff.jsonl` with `media_id` and `media_url`.',
] as const;

const FORBIDDEN_MEDIA_UPLOAD_WORKFLOW_SNIPPETS = [
  'one-image direct messages',
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

const REQUIRED_DOWNLOAD_MEDIA_API_HANDOFF_SNIPPETS = [
  'Download media',
  '## Media download handoff',
  'Use this endpoint when your agent needs a saved gallery for tweet images, videos, or GIFs.',
  '<Card title="Gallery URL" icon="images">',
  'Store `galleryUrl` as the durable link for downloaded media.',
  '<Card title="Single tweet" icon="message-square">',
  'Store `tweetId` and `cacheHit`.',
  '`cacheHit: true` means the single-tweet request used cached media and is free.',
  '<Card title="Bulk result" icon="list-checks">',
  'Store `totalTweets` and `totalMedia`.',
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

const REQUIRED_DIRECT_MESSAGE_WORKFLOW_SNIPPETS = [
  'send direct messages',
  'GET /x/users/{id}',
  'GET /x/dm/{userId}/history',
  'POST /x/dm/{userId}',
  'POST /x/media',
  '`messages`, `has_next_page`, and `next_cursor`',
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
  'Store the numeric user ID from `POST /x/dm/{userId}`.',
  '<Card title="History" icon="history">',
  'For DM history exports, store `messages`, `has_next_page`, and',
  '<Card title="Text" icon="message-square">',
  'It can contain up to 10,000 characters.',
  '<Card title="Media" icon="image">',
  'Store the optional one-item `media_ids` array containing a `mediaId` from',
  '<Card title="Response" icon="circle-check">',
  'Store `messageId`, `recipient_user_id`, `sender_account`, `message_text`,',
  '<Card title="JSON Lines" icon="file-json">',
  'Store history and send records in `xquik-dm-handoff.jsonl`',
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
  'Store `webhooks[].id` for updates, deletes, test deliveries, and delivery',
  'Store `webhooks[].url` so configuration reviews can detect stale receiver',
  'Store `webhooks[].eventTypes` and compare it with monitor event types',
  'expecting `tweet.new`, `tweet.quote`, `tweet.reply`, or `tweet.retweet`.',
  'Store `webhooks[].isActive`; inactive webhooks do not receive monitor',
  'Store `webhooks[].createdAt` for audit logs and configuration drift checks.',
  'The signing `secret` is not listed.',
  '[Create Webhook](/api-reference/webhooks/create)',
  '[Signature Verification](/webhooks/verification)',
] as const;

const REQUIRED_WEBHOOK_TEST_API_SNIPPETS = [
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
  'Validate `X-Xquik-Signature` on the raw request body',
] as const;

const FORBIDDEN_WEBHOOK_TEST_RAW_OUTPUT_SNIPPETS = [
  'console.log(result);',
  'print(result)',
  'fmt.Println(string(body))',
] as const;

const REQUIRED_WEBHOOK_UPDATE_API_SNIPPETS = [
  'Updated event types to subscribe to. Replaces the existing list. At least 1 required when provided.',
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
  '[Create Webhook](/api-reference/webhooks/create)',
] as const;

const REQUIRED_WEBHOOK_DELETE_API_SNIPPETS = [
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
  'Remove queue, CRM, alerting, or warehouse routing',
  '[Update Webhook](/api-reference/webhooks/update)',
  '`isActive: true`',
  '[Test Webhook](/api-reference/webhooks/test)',
  'Delete returns no `secret`.',
] as const;

const REQUIRED_WEBHOOK_DELIVERIES_API_SNIPPETS = [
  '## Operational handoff',
  'It returns the 100 most recent delivery records for one webhook, newest first.',
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
  'Failures retry up to 10 attempts with exponential backoff, starting at 1 second and capped at 60 seconds.',
  'A `410 Gone` response marks the delivery `exhausted` immediately.',
  'Other non-`2xx` responses and network failures stay `failed` until they are delivered or exhaust all attempts.',
  'page on `exhausted`, warn on repeated `failed`, and ignore `delivered`.',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
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
  'Final attempt. If it fails, the delivery is marked as `exhausted`.',
  'After the 10th failed attempt, the delivery is marked as `exhausted`.',
  'A `410 Gone` response exhausts the delivery immediately.',
  'Other non-`2xx` responses and network failures retry until the delivery is exhausted.',
  'Type `string`. Webhook delivery attempt ID.',
  'Type `string`. Stored event ID.',
  'Type `number`. Webhook payload schema version.',
  'Type `string`. Keyword query that matched the event.',
  'Omitted for keyword-only monitor events and `webhook.test`.',
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
  '| **Read** | `GET`, `HEAD`, `OPTIONS` | 10 per 1s |',
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

const REQUIRED_DM_HISTORY_API_SNIPPETS = [
  'Get DM history',
  'GET /x/dm/{userId}/history',
  'Requires a connected X account passed via the `account` query parameter.',
  'DM history is participant-scoped',
  'DM history requires a connected participant account.',
  'DM history responses can contain private message text.',
  'Do not write full DM bodies to shared logs or public artifacts.',
  'params={"account": "your_handle"}',
  'const messages = data.messages;',
  'Store messages in a private system; avoid logging DM text.',
  'const nextMessages = nextData.messages;',
  'messages = data["messages"]',
  'Store nextMessages in the same private system before requesting more pages.',
  'next_messages = data["messages"]',
  'Store next_messages in the same private system before requesting more pages.',
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
  'print(data["messages"])',
] as const;

const REQUIRED_SEND_DM_API_SNIPPETS = [
  'title: "Send DM"',
  'Twitter DM API',
  'X direct message API',
  'send DM with media',
  'messageId',
  '## Send with media',
  'Upload media first with [Upload Media](/api-reference/x-write/upload-media)',
  '`media_ids` must contain exactly one uploaded media ID.',
  'Empty arrays, multiple IDs, and `reply_to_message_id` return `400 invalid_input`.',
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
  '## Integration Handoff Matrix',
  '## High-Value Workflows First',
  'rows for analysts, IDs for systems of record, events for queues, and published action IDs for audit trails',
  '### 1. Scrape tweets to CSV, JSON, or XLSX',
  '`tweet_search_extractor`',
  '`GET /x/tweets/search`',
  'use `limit` only for bounded pulls',
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
  '`deliveryId`, `streamEventId`, `eventType`, and tweet data',
  '21 credits per active monitor-hour; webhook delivery is included',
  '### 5. Post media tweets or replies',
  '`POST /x/tweets` with `media`',
  'Do not call `POST /x/media` first for tweet posts when the media is already public',
  '`POST /x/tweets` rejects `media_ids` with `400 unsupported_field`',
  '"media": ["https://example.com/product-screenshot.png"]',
  '`202 x_write_unconfirmed` with `writeActionId`',
  'Use `POST /x/media` only when you need a one-item `media_ids` array for [`POST /x/dm/{userId}`](/api-reference/x-write/send-dm).',
  '10 credits per post tweet call',
  '### 6. Send direct messages with returned IDs',
  '`GET /x/users/{id}` if needed; use `GET /x/dm/{userId}/history?account=...`, then `POST /x/dm/{userId}`.',
  'Handoff: `account`, `messages`, `has_next_page`, `next_cursor`, `messageId`, and `success`.',
  '1 credit per user lookup or history message; 10 credits per DM send',
  'pass the same connected sender as `account` for history reads and DM writes',
  '--data-urlencode "account=brand_account"',
  'Missing `account` returns `400 account_required`; a non-participant account returns `403 dm_not_permitted`.',
  '`messageId` and `success`',
  '`POST /monitors`, then `GET /events`',
  '`POST /webhooks`, then `POST /webhooks/{id}/test`',
  '`POST /extractions/estimate`, then `POST /extractions`',
  '`POST /x/tweets`',
  'Post tweets or replies',
  'post tweet replies',
  '`reply_to_tweet_id`',
  '`tweetId` and `success`',
  '10 credits per write',
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
  '<Card title="Monitor webhooks" icon="webhook" href="/guides/webhook-testing">',
  'Test signed deliveries, verify `X-Xquik-Signature`, store `deliveryId`, and return `2xx` before slow work.',
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

const REQUIRED_KEYWORD_MONITOR_API_HANDOFF_SNIPPETS = [
  'monitor tweets',
  'signed webhooks',
  '## Keyword monitor handoff',
  '`POST /monitors/keywords`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '<Card title="Monitor ID" icon="fingerprint">',
  'Store `id` as `monitorId` for `GET /events`, updates, pauses, and deletes.',
  '<Card title="Normalized Query" icon="search">',
  'webhook payloads.',
  '<Card title="Event Filter" icon="funnel">',
  'subscribe webhooks to matching event types',
  '<Card title="Active State" icon="clock">',
  'Read `isActive` and `nextBillingAt`',
  '<Card title="Stored Event Join" icon="link">',
  '`monitorType: "keyword"`, `keywordMonitorId`, and `query`',
  '<Card title="Webhook Delivery Join" icon="webhook">',
  'Use `deliveryId` for receiver idempotency and `streamEventId`',
  'Store `eventType`, `occurredAt`,',
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
  '`PATCH /monitors/keywords/{id}`',
  '"message": "Monitor already exists."',
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
  "Compare each monitor's `eventTypes` with webhook subscriptions",
  'relying on signed alerts.',
  '<Card title="Event Backfill" icon="database">',
  'Use `id` as `keywordMonitorId` with',
  '[List Events](/api-reference/events/list)',
  '<Card title="State Repair" icon="sliders-horizontal">',
  '[Update Keyword Monitor](/api-reference/monitors/update-keyword)',
  'replace `eventTypes` or toggle `isActive`.',
  '[Delete Keyword Monitor](/api-reference/monitors/delete-keyword)',
  'the query should stop permanently.',
] as const;

const REQUIRED_KEYWORD_MONITOR_GET_API_HANDOFF_SNIPPETS = [
  '## State handoff',
  'Use `GET /monitors/keywords/{id}` before changing routing, billing checks, or',
  'alert state for one keyword monitor.',
  'current stored',
  'monitor for your account only',
  'deleted or cross-account IDs return `404`.',
  '<Card title="Current Filter" icon="funnel">',
  'Treat `query` and `eventTypes` as the active matching contract.',
  'Mirror',
  '`eventTypes` into webhook subscriptions',
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
] as const;

const REQUIRED_KEYWORD_MONITOR_UPDATE_API_HANDOFF_SNIPPETS = [
  '## Update handoff',
  'Use this endpoint when a keyword alert changes scope',
  'Store returned `id`, `query`, `eventTypes`, `isActive`, `createdAt`, and',
  '`nextBillingAt` as the current keyword monitor configuration.',
  '`eventTypes` replaces the current filter.',
  'Keep webhook subscriptions aligned',
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
] as const;

const REQUIRED_KEYWORD_MONITOR_DELETE_API_HANDOFF_SNIPPETS = [
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

const REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS = [
  'monitor tweets',
  'signed webhooks',
  '## Account monitor handoff',
  '`POST /monitors`',
  'queue, CRM, warehouse, Slack alert, or agent',
  '[`POST /webhooks`](/api-reference/webhooks/create)',
  '[`POST /webhooks/{id}/test`](/api-reference/webhooks/test)',
  '<Card title="Monitor ID" icon="fingerprint">',
  'Store `id` as `monitorId` for `GET /events`, updates, pauses, and deletes.',
  '<Card title="Stored Account" icon="user">',
  'Store `username` after trimming the `@` prefix and `xUserId`',
  '<Card title="Event Filter" icon="funnel">',
  'subscribe webhooks to matching event types',
  '<Card title="Active State" icon="clock">',
  'Read `isActive` and `nextBillingAt`',
  '<Card title="Stored Event Join" icon="link">',
  '`monitorType: "account"`, `monitorId`, and `username`',
  '<Card title="Webhook Delivery Join" icon="webhook">',
  'Use `deliveryId` for receiver idempotency and `streamEventId`',
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

const REQUIRED_ACCOUNT_MONITOR_GET_API_HANDOFF_SNIPPETS = [
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
] as const;

const REQUIRED_ACCOUNT_MONITOR_LIST_API_HANDOFF_SNIPPETS = [
  '## Inventory handoff',
  'Use `GET /monitors` after create, update, pause, or delete operations',
  'your account monitor inventory.',
  'up to 200 monitors ordered',
  '`total` count for the returned set.',
  '<Card title="Tracked Accounts" icon="users">',
  "Store each monitor's `id`, `username`, and `xUserId`",
  'warehouse, or queue records.',
  '<Card title="Active Billing" icon="activity">',
  'Filter monitors where `isActive` is `true`.',
  'Each active account monitor',
  'bills 21 credits per active monitor-hour',
  '`nextBillingAt` to schedule',
  'credit checks or pause stale alerts.',
  '<Card title="Webhook Alignment" icon="webhook">',
  "Compare each monitor's `eventTypes` with webhook subscriptions",
  'relying on signed alerts.',
  '<Card title="Event Backfill" icon="database">',
  'Use `id` as `monitorId` with [List Events](/api-reference/events/list)',
  'audit stored account monitor events.',
  '<Card title="State Repair" icon="sliders-horizontal">',
  '[Update Monitor](/api-reference/monitors/update)',
  'replace `eventTypes`',
  'toggle `isActive`.',
  '[Delete Monitor](/api-reference/monitors/delete)',
  'tracked account should stop permanently.',
] as const;

const REQUIRED_ACCOUNT_MONITOR_UPDATE_API_HANDOFF_SNIPPETS = [
  'monitors do not consume hourly monitor credits.',
  '## Update handoff',
  'Use this endpoint when an account alert changes event scope',
  'Store returned `id`, `username`, `xUserId`, `eventTypes`, `isActive`,',
  '`createdAt`, and `nextBillingAt` as the current account monitor',
  'configuration.',
  '`eventTypes` replaces the current filter.',
  'Keep webhook subscriptions aligned',
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
  'signed webhook payloads after the update.',
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
  '[Test Webhook](/api-reference/webhooks/test)',
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
  'Call `GET /x/tweets/search` with `q`; use `cursor` for page loops or `limit` for bounded pulls.',
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
  'The current `0.1.4` release is read-focused.',
  'https://github.com/Xquik-dev/prefect-xquik/releases/download/v0.1.4/prefect_xquik-0.1.4-py3-none-any.whl',
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
  'Version `0.1.4` is read-only. Use REST, SDKs, or MCP for writes, monitors, webhooks, and extraction jobs.',
  '## Tasks',
  '<Card title="Search Tweets" icon="search">',
  '`search_tweets(credentials, query, limit=25, query_type="Latest")` calls `GET /x/tweets/search`.',
  '<Card title="Get Tweet" icon="message-square">',
  '`get_tweet(credentials, tweet_id)` calls `GET /x/tweets/{id}`.',
  '<Card title="Search Users" icon="users">',
  '`search_users(credentials, query, cursor=None)` calls `GET /x/users/search`.',
  '<Card title="Get User" icon="user-round">',
  '`get_user(credentials, user_id)` calls `GET /x/users/{id}`.',
  '<Card title="Get User Tweets" icon="list">',
  '`get_user_tweets(credentials, user_id, include_replies=False)` calls `GET /x/users/{id}/tweets`.',
  '<Card title="Get Trends" icon="trending-up">',
  '`get_trends(credentials, woeid=1, count=30)` calls `GET /x/trends`.',
  '## Result Handoff',
  '<Card title="Tweet Pages" icon="message-square">',
  '`search_tweets` and `get_user_tweets` return `tweets`, `has_next_page`, and `next_cursor`.',
  '<Card title="User Pages" icon="users">',
  '`search_users` returns `users`, `has_next_page`, and `next_cursor`. `get_user` returns one public profile dictionary.',
  '<Card title="Trend Pages" icon="trending-up">',
  '`get_trends` returns `trends`, `count`, and `woeid`.',
  '<Card title="Downstream Rows" icon="table">',
  'Normalize raw dictionaries in a follow-up task before writing to Slack, Sheets, a warehouse, or a dashboard.',
  'search_recent_tweets = search_tweets.with_options(',
  'Respect `Retry-After` for repeated `429` responses, and keep `limit` at or below `200` for bounded tweet search pulls.',
  'Omit `limit` when passing a cursor.',
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
  'Search module. Call `GET /x/tweets/search` with `q`; use `cursor` for page loops or `limit` for bounded pulls.',
  '<Card title="Get Tweet" icon="message-circle">',
  'Action module. Call `GET /x/tweets/{id}` with a tweet ID.',
  '<Card title="Get User" icon="user-round">',
  'Action module. Call `GET /x/users/{id}` with a user ID or username.',
  '<Card title="Get Trends" icon="trending-up">',
  'Search module. Call `GET /x/trends` with optional `woeid` and `count`.',
  '<Card title="Create Tweet" icon="send">',
  'Action module. Call `POST /x/tweets` with account, text, and optional media URLs.',
  '<Card title="Create Extraction" icon="boxes">',
  'Action module. Call `POST /extractions` with `toolType`, query fields, and result limit.',
  '<Card title="Create Monitor" icon="radio">',
  'Action module. Call `POST /monitors` with username and event types.',
  '<Card title="Create Webhook" icon="webhook">',
  'Action module. Call `POST /webhooks` with callback URL and event types.',
  '<Card title="Make an API Call" icon="terminal">',
  'Universal module. Accept any `/api/v1` path as an escape hatch for endpoints not yet modeled.',
  'Add a separate bounded-pull variant that sends `limit` and omits `cursor`.',
  'Map webhook output fields for downstream modules:',
  '<Card title="Event type" icon="bell">',
  'Map `eventType` to route `tweet.new`, `tweet.reply`, `tweet.quote`, and `tweet.retweet` events.',
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
  'Upsert by `data.id` or `deliveryId` to avoid duplicate alerts.',
  '<Card title="Schedule Trigger" icon="calendar-clock">',
  'Run the scenario on a daily schedule for repeatable topic research.',
  '<Card title="Search Tweets" icon="search">',
  'Call Xquik Search Tweets with `q`; use `cursor` for page loops or `limit` for bounded pulls.',
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
    expect.assertions(1);

    const source = readFileSync('sdks/typescript.mdx', 'utf8');

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
    expect.assertions(1);

    const source = readFileSync('sdks/go.mdx', 'utf8');

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
    expect.assertions(1);

    const source = readFileSync('sdks/python.mdx', 'utf8');

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
    expect.assertions(1);

    const source = readFileSync('sdks/ruby.mdx', 'utf8');

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

  it('keeps the CLI SDK page useful for tweet search and replies handoffs', (): void => {
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
    expect.assertions(1);

    const source = readFileSync('sdks/php.mdx', 'utf8');

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
    expect.assertions(1);

    const source = readFileSync('sdks/java.mdx', 'utf8');

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
    expect.assertions(1);

    const source = readFileSync('sdks/kotlin.mdx', 'utf8');

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

    const files = [
      'sdks/typescript.mdx',
      'sdks/python.mdx',
      'sdks/go.mdx',
      'sdks/ruby.mdx',
      'sdks/cli.mdx',
      'sdks/csharp.mdx',
      'sdks/php.mdx',
      'sdks/java.mdx',
      'sdks/kotlin.mdx',
      'guides/zapier.mdx',
      'guides/make.mdx',
      'guides/prefect.mdx',
      'guides/workflows.mdx',
    ] as const;

    const findings = files.flatMap((file): readonly DiscoveryFinding[] => {
      const source = readFileSync(file, 'utf8');

      return FORBIDDEN_TWEET_SEARCH_CURSOR_LIMIT_SNIPPETS.flatMap(
        (snippet): readonly DiscoveryFinding[] =>
          source.includes(snippet)
            ? [
                {
                  label: file,
                  snippet,
                },
              ]
            : [],
      );
    });

    expect(findings).toStrictEqual([]);
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
        'Tweet replies endpoint page',
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
    ).toStrictEqual([]);
  });

  it('keeps the verified followers API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/verified-followers.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Verified followers API page',
        REQUIRED_VERIFIED_FOLLOWERS_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the followers you know API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/followers-you-know.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Followers you know API page',
        REQUIRED_FOLLOWERS_YOU_KNOW_API_HANDOFF_SNIPPETS,
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
    expect.assertions(1);

    const source = readFileSync('api-reference/x-write/upload-media.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Upload media endpoint page',
        REQUIRED_UPLOAD_MEDIA_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the download media API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/x/download-media.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Download media API page',
        REQUIRED_DOWNLOAD_MEDIA_API_HANDOFF_SNIPPETS,
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
        ...collectSnippetFindings(
          updateWebhookApi,
          'Update webhook API docs',
          REQUIRED_WEBHOOK_UPDATE_API_SNIPPETS,
        ),
        ...collectSnippetFindings(
          deleteWebhookApi,
          'Delete webhook API docs',
          REQUIRED_WEBHOOK_DELETE_API_SNIPPETS,
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
    expect.assertions(1);

    const source = readFileSync('api-reference/x-write/send-dm.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Send DM endpoint docs',
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
      ],
    ).toStrictEqual([]);
  });

  it('keeps the workflows overview within the generated HTML weight budget', (): void => {
    expect.assertions(1);

    const source = readFileSync('guides/workflows.mdx', 'utf8');

    expect(source.length).toBeLessThanOrEqual(MAX_WORKFLOWS_OVERVIEW_CHARS);
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
      collectSnippetFindings(
        source,
        'List keyword monitor API page',
        REQUIRED_KEYWORD_MONITOR_LIST_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the keyword monitor get API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/monitors/get-keyword.mdx',
      'utf8',
    );

    expect(
      collectSnippetFindings(
        source,
        'Get keyword monitor API page',
        REQUIRED_KEYWORD_MONITOR_GET_API_HANDOFF_SNIPPETS,
      ),
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
      ],
    ).toStrictEqual([]);
  });

  it('keeps the account monitor API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/create.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Create account monitor endpoint page',
        REQUIRED_ACCOUNT_MONITOR_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the account monitor get API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/get.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Get account monitor API page',
        REQUIRED_ACCOUNT_MONITOR_GET_API_HANDOFF_SNIPPETS,
      ),
    ).toStrictEqual([]);
  });

  it('keeps the account monitor list API handoff concrete', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/monitors/list.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'List account monitor API page',
        REQUIRED_ACCOUNT_MONITOR_LIST_API_HANDOFF_SNIPPETS,
      ),
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
    expect.assertions(4);

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
    expect.assertions(4);

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
    expect(source).not.toContain('0.1.2');
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
    expect.assertions(1);

    const source = readFileSync('guides/make.mdx', 'utf8');

    expect(
      collectSnippetFindings(
        source,
        'Make guide',
        REQUIRED_MAKE_GUIDE_SNIPPETS,
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
