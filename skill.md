---
name: Xquik
description: Use when building integrations with X (Twitter) data, monitoring accounts for real-time events, running extractions or giveaway draws, composing algorithm-optimized tweets, or connecting AI agents via REST API, webhooks, Docs MCP, or API MCP.
metadata:
  mintlify-proj: xquik
  version: "1.0"
---

# Xquik Skill

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

## Product summary

Xquik is a real-time X (Twitter) data platform with 123 documented REST API operations, webhooks, a Docs MCP server for read-only docs search and page retrieval, and an API MCP server for authenticated AI agent integration. Use it to extract followers, replies, retweets, and other X data; monitor accounts and keywords for real-time events; run transparent giveaway draws; compose algorithm-optimized tweets; and build X integrations. The REST API base URL is `https://xquik.com/api/v1`. Authenticate with the `x-api-key` header. Primary docs: https://docs.xquik.com

## When to use

Reach for Xquik when:

- **Extracting X data**: Pull followers, replies, retweets, likes, community members, list data, or search results from public accounts, tweets, lists, communities, or Spaces.
- **Monitoring accounts**: Track tweets, replies, quotes, and retweets from specific X accounts in real time.
- **Setting up webhooks**: Receive real-time event notifications at your HTTPS endpoint with HMAC-signed payloads.
- **Running giveaway draws**: Execute transparent, auditable random draws on tweets with public result pages.
- **Composing tweets**: Generate algorithm-optimized tweet drafts with scoring against X ranking factors.
- **Connecting AI agents**: Use Docs MCP for no-auth docs search and page retrieval, and API MCP for authenticated account actions.
- **Analyzing styles**: Analyze tweet styles, compare accounts, track engagement performance, or save drafts.
- **Writing to X**: Post tweets, like, retweet, follow, send DMs, upload media, or manage community membership from connected accounts.
- **Trending data**: Access real-time trends across 12 regions plus radar topics from Xquik's own infrastructure.

## Quick reference

### Authentication

- **Header**: `x-api-key: xq_YOUR_KEY_HERE`
- **Key format**: `xq_` prefix plus 64 hex characters
- **Generation**: Dashboard > API Keys > Create new key
- **Revocation**: Dashboard or `DELETE /api/v1/api-keys/{id}`
- **OAuth 2.1**: API MCP server also supports Bearer tokens for browser-based MCP clients.

### Rate limits

- **Read**: `GET`, `HEAD`, and `OPTIONS` share a 60 per 1s user bucket.
- **Write**: `POST`, `PUT`, and `PATCH` share a 30 per 60s user bucket.
- **Delete**: `DELETE` requests use a 15 per 60s user bucket.

Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header. Retry only on `429` and `5xx` responses.

### API endpoints (123 documented operations)

- **Monitors and Events**: Create account and keyword monitors, retrieve events, and manage webhooks.
- **Extractions**: 23 tools for bulk data extraction.
- **Draws**: Run giveaway draws with transparent results.
- **X Data**: User lookups, tweet search, trends, media downloads, threads, replies, quotes, and relationships.
- **X Write**: Post tweets, like, retweet, follow, DM, update profiles, upload media, and manage communities.
- **Account and Billing**: Account info, credits, API keys, drafts, styles, and subscriptions.
- **Compose**: Algorithm-optimized tweet composition.
- **Styles**: Analyze tweet styles, compare accounts, and track performance.
- **Radar**: Trending topics and news from Xquik's own infrastructure.

### Extraction tool types (23 total)

**Tweet-based**: `reply_extractor`, `repost_extractor`, `quote_extractor`, `favoriters`, `thread_extractor`, `article_extractor`

**User-based**: `follower_explorer`, `following_explorer`, `verified_follower_explorer`, `mention_extractor`, `post_extractor`, `user_likes`, `user_media`

**Community target** (`targetCommunityId`): `community_extractor`, `community_moderator_explorer`, `community_post_extractor`, `community_search`

`community_search` also requires `searchQuery`. It searches matching posts within the selected community.

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

- **Use the REST API** for backend services, automation scripts, interval polling, file exports, and fine-grained pagination or request control.
- **Use Docs MCP** for AI agents that need read-only docs search and page retrieval for API parameters, examples, error codes, billing rules, webhook setup, or SDK guidance.
- **Use API MCP** for AI agents that need authenticated Xquik account actions in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients.
- **Use webhooks** when monitor events must reach an HTTPS endpoint in real time. Add them to REST or MCP workflows when pushed events are better than polling.

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

### Direct message handoff

1. Send text DMs with `POST /api/v1/x/dm/{userId}` and store `messageId`.
2. For media DMs, call `POST /api/v1/x/media` first, then pass exactly 1 returned `mediaId` in `media_ids`.
3. Keep DM body text in private systems. Shared outputs should store IDs, status, timestamps, and media references instead of full DM bodies.
4. Leave `reply_to_message_id` unset because the REST endpoint rejects DM reply threading.

### Connect an AI agent through MCP

1. Add Docs MCP at `https://docs.xquik.com/mcp` for read-only docs search and page retrieval.
2. Configure API MCP at `https://xquik.com/mcp` for authenticated account actions.
3. Authenticate API MCP with an `x-api-key` header or OAuth Bearer token.
4. Use `explore` to search 118 MCP operations and `xquik` to run authenticated requests.

API MCP v2.5.1 uses Streamable HTTP. It returns normalized snake_case fields, date-time fields as Unix seconds, structured errors, `has_more`, and `next_cursor`. Continue through empty pages while the cursor advances. Stop and report partial progress when a cursor is missing or repeats.

API-key lifecycle, direct saved-payment quick top-up, and the session top-up redirect are unavailable through MCP. Manage keys in the dashboard. Call `POST /api/v1/credits/topup` only after the user explicitly requests a checkout URL.

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
- The REST API and API MCP server connect to the same backend and share the same account state.

## Resources

- Comprehensive navigation: https://docs.xquik.com/llms.txt
- Quickstart: https://docs.xquik.com/quickstart
- API overview: https://docs.xquik.com/api-reference/overview
- Docs MCP server: https://docs.xquik.com/mcp
- API MCP server: https://docs.xquik.com/mcp/overview
- MCP tools reference: https://docs.xquik.com/mcp/tools
- Error handling: https://docs.xquik.com/guides/error-handling
- Extraction workflow: https://docs.xquik.com/guides/extraction-workflow
- Webhook verification: https://docs.xquik.com/webhooks/verification

> For additional documentation and navigation, see: https://docs.xquik.com/llms.txt
