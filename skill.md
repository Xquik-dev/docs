---
name: Xquik
description: Build Xquik tweet, profile, follower, monitor, webhook, export, Docs MCP, and API MCP integrations.
metadata:
  mintlify-proj: xquik
  version: "1.0"
---

# Xquik skill

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

## Product summary

Xquik is an X data platform with 129 documented REST operations, webhooks, Docs MCP, and API MCP. Full account credentials cover account workflows. Accountless guest keys cover 33 prepaid GET reads. Seven fixed-price operations also accept direct MPP. The REST base URL is `https://xquik.com/api/v1`. Primary docs: https://docs.xquik.com

## When to use

Reach for Xquik when:

- **Extracting X data.** Pull followers, replies, retweets, likes, community members, list data, or search results from public accounts, tweets, lists, communities, or Spaces.
- **Monitoring accounts.** Check specific X accounts every second for supported events.
- **Setting up webhooks.** Receive monitor events through HMAC-signed HTTPS payloads.
- **Running giveaway draws.** Run random tweet draws with public result pages.
- **Composing posts.** Get editorial guidance, Radar research suggestions, and deterministic draft checks.
- **Connecting AI agents.** Use Docs MCP for no-auth docs search and page retrieval, and API MCP for authenticated account actions.
- **Running accountless reads.** Use a prepaid guest `paid_reads` key on 33 GET routes or direct MPP on 7 fixed-price operations.
- **Analyzing styles.** Analyze tweet styles, compare accounts, track engagement performance, or save drafts.
- **Writing to X.** Post tweets, like, retweet, follow, send DMs, upload media, or manage community membership from connected accounts.
- **Trending data.** Access current X trends across 12 regions plus Radar topics.

## Quick reference

### Authentication

- **OAuth 2.1.** Browser-based MCP clients keep account access granted by OAuth scopes. Agents can use claimed `service_auth` registration. Both paths require user approval.
- **Full account key.** Send `x-api-key: xq_your_api_key_here` or `Authorization: Bearer xq_your_api_key_here`.
- **Guest key.** Send `Authorization: Bearer xq_your_guest_key_here`. Scope is fixed to `paid_reads`.
- **Key format.** `xq_` prefix plus 64 hex characters
- **Generation.** Dashboard > API Keys > Create new key
- **Revocation.** Dashboard. The API route requires a same-origin dashboard session
- **OAuth discovery.** Read protected-resource metadata, authorization-server metadata, or `https://xquik.com/auth.md`.

### Rate limits

- **Read.** `GET`, `HEAD`, and `OPTIONS` share a 300 per 1s user bucket.
- **Write.** `POST`, `PUT`, and `PATCH` share a 120 per 60s user bucket.
- **Delete.** `DELETE` requests use a 60 per 60s user bucket.

Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header.
Retry safe reads only on `429` and temporary `5xx` responses. For writes, poll
the returned action. Never resubmit an ambiguous write. Start a new attempt only
when `safeToRetry` is true.

### API endpoints (130 documented operations)

- **Monitors and Events.** Create account and keyword monitors, retrieve events, and manage webhooks.
- **Extractions.** 23 tools for bulk data extraction.
- **Draws.** Run giveaway draws with transparent results.
- **X Data.** User lookups, tweet search, trends, media downloads, threads, replies, quotes, and relationships.
- **X Write.** Post tweets, like, retweet, follow, DM, update profiles, upload media, and manage communities.
- **Account and Billing.** Account info, credits, API keys, drafts, styles, and subscriptions.
- **Compose.** Editorial guidance, source-specific Radar suggestions, and deterministic draft checks.
- **Styles.** Analyze tweet styles, compare accounts, and track performance.
- **Radar.** Trending topics and news from Xquik's own infrastructure.

### Extraction tool types (23 total)

**Tweet-based.** `reply_extractor`, `repost_extractor`, `quote_extractor`, `favoriters`, `thread_extractor`, `article_extractor`

**User-based.** `follower_explorer`, `following_explorer`, `verified_follower_explorer`, `mention_extractor`, `post_extractor`, `user_likes`, `user_media`

**Community target** (`targetCommunityId`): `community_extractor`, `community_moderator_explorer`, `community_post_extractor`, `community_search`

`community_search` also requires `searchQuery`. It searches matching posts within the selected community.

**List.** `list_member_extractor`, `list_post_extractor`, `list_follower_explorer`

**Other.** `people_search`, `space_explorer`, `tweet_search_extractor`

### Event types

- `tweet.new`: Original tweet from a monitored account.
- `tweet.quote`: Quote tweet from a monitored account.
- `tweet.reply`: Reply from a monitored account.
- `tweet.retweet`: Retweet from a monitored account.

### Pagination

- **Platform pages.** Events, draws, and extractions use `cursor`. Radar uses `after`. Drafts use `afterCursor`. Responses include `hasMore` and `nextCursor`.
- **Unpaginated lists.** Monitors, webhooks, and API keys return up to 200 items.
- **X endpoints.** X data endpoints use endpoint-specific cursor fields such as `has_next_page` and `next_cursor`.
- Do not decode or construct cursors manually. Pass returned cursors back unchanged.

## Decision guidance

- **Use the REST API** for backend services, automation scripts, interval polling, file exports, and fine-grained pagination or request control.
- **Use Docs MCP** for AI agents that need read-only docs search and page retrieval for API parameters, examples, error codes, billing rules, webhook setup, or SDK guidance.
- **Use API MCP** for AI agents that need authenticated Xquik account actions in Claude, ChatGPT, Cursor, VS Code, Codex, and similar clients.
- **Use a guest wallet** for prepaid GET reads without an account. Require explicit confirmation before creating a $10-$250 USD hosted checkout.
- **Use direct MPP** for anonymous per-request payment on 7 fixed-price reads.
- **Use webhooks** when monitor events must reach an HTTPS endpoint. Add them when pushed events fit better than polling.

## Workflows

### Monitor and poll

1. Create a monitor with `POST /api/v1/monitors`.
2. Poll events with `GET /api/v1/events?monitorId=...&limit=50`.
3. Use `nextCursor` from the response to fetch additional pages.
4. Process each event by checking the event type and data payload.

### Signed monitor webhooks

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

### Build a post draft

1. Call `POST /api/v1/compose` with `step: "compose"`.
2. If fresh context helps, call one returned `radarRecommendations` endpoint.
3. Call `refine` with goal, tone, topic, and selected `additionalContext`.
4. Score a draft with `step: "score"`.
5. Revise only the failed editorial checks.

### Direct message handoff

1. Send text DMs with `POST /api/v1/x/dm/{userId}` and store `messageId`.
2. For media DMs, call `POST /api/v1/x/media` first, then pass exactly 1 returned `mediaId` in `media_ids`.
3. Keep DM body text in private systems. Shared outputs should store IDs, status, timestamps, and media references instead of full DM bodies.
4. Leave `reply_to_message_id` unset because the REST endpoint rejects DM reply threading.

### Connect an AI agent through MCP

1. Add Docs MCP at `https://docs.xquik.com/mcp` for read-only docs search and page retrieval.
2. Configure API MCP at `https://xquik.com/mcp` for live authenticated calls.
3. Use full credentials for 118 JSON or text routes. Use REST for excluded downloads. Guest keys expose 33 GET routes.
4. Use `docs` for guidance, `search` for contracts, and `execute` for allowed requests.
   Inspect `spec.paths`; follow response references into `spec.components.schemas`.
5. Add `?codemode=false` only when the client needs OpenAPI-native tools.

API MCP supports MCP `2026-07-28` over Streamable HTTP.
Current SDKs negotiate with `server/discover`. They attach request metadata
and transport headers automatically. Hosted MCP injects required write
idempotency headers. Do not call `initialize` or manage sessions for modern
connections. Stateless 2025-era clients remain compatible.

MCP returns normalized snake_case fields, Unix timestamps, structured errors,
`has_more`, and `next_cursor`. Continue through empty pages while the cursor
advances. Stop and report partial progress when a cursor is missing or repeats.

API-key lifecycle, saved-payment quick top-up, the account top-up redirect, and all 3 guest wallet credential routes are unavailable through MCP. Private support downloads are discoverable, but their binary responses require REST. Never start checkout or top-up after `401` or `402`. Ask the user to choose an amount. Wait for confirmation.

### Recover from the Codex OAuth issuer error

Codex CLI 0.147.0 and newer preserve the RFC 9207 `iss` value. Upgrade first. Older releases may report `Authorization server response missing required issuer: expected https://xquik.com`. Xquik already returns the value. Issue https://github.com/openai/codex/issues/31573 records the defect and fix.

Set the API key in the environment:

```bash
export XQUIK_API_KEY="xq_your_api_key_here"
```

Configure Codex without placing the key value in `config.toml`:

```toml
[mcp_servers.xquik]
url = "https://xquik.com/mcp"
bearer_token_env_var = "XQUIK_API_KEY"
```

Restart Codex and run `codex mcp list`. Do not run `codex mcp login xquik` while the fallback is active. Docs MCP at `https://docs.xquik.com/mcp` needs no authentication, so it can retrieve the full troubleshooting guide at https://docs.xquik.com/guides/troubleshooting#codex-oauth-issuer-validation-error while API MCP OAuth is blocked.

### Create an accountless guest wallet

1. Ask the user to choose and confirm $10-$250 USD.
2. Call `POST /api/v1/guest-wallets` through direct REST with the confirmed amount and a random UUID v4 `Idempotency-Key`.
3. Store `api_key` and the idempotency key before sharing `checkout_url`.
4. The user completes the hosted checkout. Poll status every `poll_after_seconds` until `latest_purchase.status` is no longer `pending`.
5. Use the key only when `usable` is `true`. It can call exactly the 33 eligible paid-read GET routes.

The creation request does not charge the user. The key stays inactive until payment is verified. Use `POST /api/v1/guest-wallets/topups` only after another explicit confirmation. Never execute guest credential routes through MCP.

Refunds and disputes reconcile affected-purchase credits only. Unrelated credits remain usable. Access pauses only during unresolved settlement risk or unrecovered liability, then resumes.

## Common gotchas

- Keep only filters the user states. Never infer language or post type.
- A like minimum does not request `Top`. Use `Top` only when the user asks for
  best, most-liked, or highest-engagement results.
- API keys are shown once. Store them securely immediately after creation.
- Guest wallet `Idempotency-Key` values can recover the initial key. Store them as secrets.
- Use the lowercase `x-api-key` header.
- Webhook secrets are returned once. Save the secret before leaving the creation response.
- Webhook endpoints must be HTTPS.
- Treat IDs as opaque strings. Do not parse X IDs as numbers.
- Timestamps are ISO 8601 UTC unless an endpoint explicitly documents a different contract.
- Cursor values are opaque.
- Retry safe reads only after `429` or temporary `5xx` responses.
- Never resubmit an ambiguous write. Verify state first.
- Start a new write attempt only when `safeToRetry` is true.
- Monitor events require an active monitor before webhook delivery can occur.
- Write actions require connected X accounts.
- Full account REST and API MCP share account state. Guest keys remain limited to wallet-backed paid reads.

## Resources

- Docs index: https://docs.xquik.com/llms.txt
- Quickstart: https://docs.xquik.com/x-api-quickstart
- API overview: https://docs.xquik.com/api-reference/overview
- Docs MCP server: https://docs.xquik.com/mcp
- API MCP server: https://docs.xquik.com/mcp/overview
- MCP tools reference: https://docs.xquik.com/mcp/tools
- Agent Skills index: https://xquik.com/.well-known/agent-skills/index.json
- Agent catalog: https://xquik.com/.well-known/agents.json
- OAuth instructions: https://xquik.com/auth.md
- Codex OAuth troubleshooting: https://docs.xquik.com/guides/troubleshooting#codex-oauth-issuer-validation-error
- Guest wallets: https://docs.xquik.com/guides/guest-wallets
- Direct MPP: https://docs.xquik.com/mpp/machine-payments-protocol
- Error handling: https://docs.xquik.com/guides/error-handling
- Extraction workflow: https://docs.xquik.com/guides/extraction-workflow
- Webhook verification: https://docs.xquik.com/webhooks/verification

> For additional documentation and navigation, see: https://docs.xquik.com/llms.txt
