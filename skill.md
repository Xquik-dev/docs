---
name: Xquik
description: Use when building integrations with X (Twitter) data, monitoring accounts for real-time events, running extractions or giveaway draws, composing algorithm-optimized tweets, or connecting AI agents to X data via REST API, webhooks, or MCP server.
metadata:
  mintlify-proj: xquik
  version: "1.0"
---

# Xquik Skill

## Product summary

Xquik is a real-time X (Twitter) data platform with 120 documented REST API operations, webhooks, and an MCP server for AI agent integration. Use it to extract followers, replies, retweets, and other X data; monitor accounts and keywords for real-time events; run transparent giveaway draws; compose algorithm-optimized tweets; and build X integrations. The REST API base URL is `https://xquik.com/api/v1`. Authenticate with the `x-api-key` header. Primary docs: https://docs.xquik.com

## When to use

Reach for Xquik when:

- **Extracting X data**: Pull followers, replies, retweets, likes, community members, list data, or search results from public accounts, tweets, lists, communities, or Spaces.
- **Monitoring accounts**: Track tweets, replies, quotes, and retweets from specific X accounts in real time.
- **Setting up webhooks**: Receive real-time event notifications at your HTTPS endpoint with HMAC-signed payloads.
- **Running giveaway draws**: Execute transparent, auditable random draws on tweets with public result pages.
- **Composing tweets**: Generate algorithm-optimized tweet drafts with scoring against X ranking factors.
- **Connecting AI agents**: Use the MCP server to let Claude, ChatGPT, Cursor, VS Code, Codex, or other agents interact with X data.
- **Analyzing styles**: Analyze tweet styles, compare accounts, track engagement performance, or save drafts.
- **Writing to X**: Post tweets, like, retweet, follow, send DMs, upload media, or manage community membership from connected accounts.
- **Trending data**: Access real-time trends across 12 regions plus radar topics from GitHub, Google Trends, Hacker News, Polymarket, Reddit, TrustMRR, and Wikipedia.

## Quick reference

### Authentication

- **Header**: `x-api-key: xq_YOUR_KEY_HERE`
- **Key format**: `xq_` prefix plus 64 hex characters
- **Generation**: Dashboard > API Keys > Create new key
- **Revocation**: Dashboard or `DELETE /api/v1/api-keys/{id}`
- **OAuth 2.1**: MCP server also supports Bearer tokens for browser-based MCP clients.

### Rate limits

| Tier | Methods | Limit |
|------|---------|-------|
| Read | GET, HEAD, OPTIONS | 10 per 1s |
| Write | POST, PUT, PATCH | 30 per 60s |
| Delete | DELETE | 15 per 60s |

Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header. Retry only on `429` and `5xx` responses.

### API endpoints (120 documented operations)

- **Monitors and Events**: Create account and keyword monitors, retrieve events, and manage webhooks.
- **Extractions**: 23 tools for bulk data extraction.
- **Draws**: Run giveaway draws with transparent results.
- **X Data**: User lookups, tweet search, trends, media downloads, threads, replies, quotes, and relationships.
- **X Write**: Post tweets, like, retweet, follow, DM, update profiles, upload media, and manage communities.
- **Account and Billing**: Account info, credits, API keys, drafts, styles, and subscriptions.
- **Compose**: Algorithm-optimized tweet composition.
- **Styles**: Analyze tweet styles, compare accounts, and track performance.
- **Radar**: Trending topics and news from 7 sources.

### Extraction tool types (23 total)

**Tweet-based**: `reply_extractor`, `repost_extractor`, `quote_extractor`, `favoriters`, `thread_extractor`, `article_extractor`

**User-based**: `follower_explorer`, `following_explorer`, `verified_follower_explorer`, `mention_extractor`, `post_extractor`, `user_likes`, `user_media`

**Community**: `community_extractor`, `community_moderator_explorer`, `community_post_extractor`, `community_search`

**List**: `list_member_extractor`, `list_post_extractor`, `list_follower_explorer`

**Other**: `people_search`, `space_explorer`, `tweet_search_extractor`

### Event types

- `tweet.new`: Original tweet from a monitored account.
- `tweet.quote`: Quote tweet from a monitored account.
- `tweet.reply`: Reply from a monitored account.
- `tweet.retweet`: Retweet from a monitored account.

### Pagination

- **Platform endpoints**: Events, draws, extractions, drafts, monitors, webhooks, and API keys use cursor pagination with `hasMore` and `nextCursor`.
- **X endpoints**: X data endpoints use endpoint-specific cursor fields such as `has_next_page` and `next_cursor`.
- Do not decode or construct cursors manually. Pass returned cursors back unchanged.

## Decision guidance

| Scenario | Use REST API | Use MCP Server | Use Webhooks |
|----------|--------------|----------------|--------------|
| Backend service or automation script | Yes | No | Optional |
| AI agent in Claude, ChatGPT, Cursor, VS Code, or Codex | Optional | Yes | Optional |
| Real-time event delivery | No | No | Yes |
| Polling for events on interval | Yes | Yes | No |
| File export as CSV, XLSX, JSON, Markdown, PDF, or text | Yes | Optional | No |
| Natural language queries | No | Yes | No |
| Fine-grained pagination and request control | Yes | Optional | No |

## Workflows

### Monitor and poll

1. Create a monitor with `POST /api/v1/monitors`.
2. Poll events with `GET /api/v1/events?monitorId=...&limit=50`.
3. Use `nextCursor` from the response to fetch additional pages.
4. Process each event by checking the event type and data payload.

### Real-time webhooks

1. Create a monitor before creating a webhook.
2. Create a webhook with `POST /api/v1/webhooks` using an HTTPS URL and event types.
3. Save the webhook secret when it is returned.
4. Verify incoming signatures with HMAC-SHA256.
5. Respond quickly with a `2xx` status and process longer work asynchronously.

### Extract data

1. Check account status with `GET /api/v1/account`.
2. Estimate cost with `POST /api/v1/extractions/estimate`.
3. Run the extraction with `POST /api/v1/extractions`.
4. Retrieve results with `GET /api/v1/extractions/{id}` or export a file with `GET /api/v1/extractions/{id}/export?format=csv`.

### Compose a tweet

1. Call `POST /api/v1/compose` with `step: "compose"`.
2. Refine with `step: "refine"` and the selected goal, tone, topic, and media strategy.
3. Score a draft with `step: "score"`.
4. Iterate until the checklist passes.

### Connect an AI agent through MCP

1. Configure the MCP endpoint `https://xquik.com/mcp`.
2. Authenticate with an `x-api-key` header or OAuth Bearer token.
3. Use `explore` to search the in-memory API catalog.
4. Use `xquik` to run authenticated requests with short async JavaScript functions.

## Common gotchas

- API keys are shown once. Store them securely immediately after creation.
- Use the lowercase `x-api-key` header.
- Webhook secrets are returned once. Save the secret before leaving the creation response.
- Webhook endpoints must be HTTPS.
- Treat IDs as opaque strings. Do not parse X IDs as numbers.
- Timestamps are ISO 8601 UTC unless an endpoint explicitly documents a different contract.
- Cursor values are opaque.
- Retry only `429` and `5xx` responses. Fix other `4xx` responses before retrying.
- Monitor events require an active monitor before webhook delivery can occur.
- Write actions require connected X accounts.
- The REST API and MCP server connect to the same backend and share the same account state.

## Resources

- Comprehensive navigation: https://docs.xquik.com/llms.txt
- Quickstart: https://docs.xquik.com/quickstart
- API overview: https://docs.xquik.com/api-reference/overview
- MCP server: https://docs.xquik.com/mcp/overview
- MCP tools reference: https://docs.xquik.com/mcp/tools
- Error handling: https://docs.xquik.com/guides/error-handling
- Extraction workflow: https://docs.xquik.com/guides/extraction-workflow
- Webhook verification: https://docs.xquik.com/webhooks/verification

> For additional documentation and navigation, see: https://docs.xquik.com/llms.txt
