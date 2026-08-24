# Xquik docs for X API, 1-second monitors & automation

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

Documentation for [Xquik](https://xquik.com), an X data and automation
platform. Published at **[docs.xquik.com](https://docs.xquik.com)**.

This repository contains the Xquik REST API, webhook, MCP, OAuth 2.1, and SDK docs. Find request and response details for tweet search, user lookup, follower exports, media uploads, direct messages, 1-second tweet monitors, signed webhooks, SDK clients, and X automation.

## Choose this repository

Use the hosted site for current guidance. Review this repository when proposing
fixes or validating contracts. Generated client APIs live in the SDK repositories.

## Start here

- [Quickstart](https://docs.xquik.com/x-api-quickstart). Make the first authenticated API call.
- [API reference](https://docs.xquik.com/api-reference). Browse 129 OpenAPI-backed operations.
- [Guest wallets](https://docs.xquik.com/guides/guest-wallets). Fund 33 accountless GET routes through a confirmed hosted checkout.
- [Direct MPP](https://docs.xquik.com/mpp/machine-payments-protocol). Pay per request on 7 fixed-price GET operations.
- [SDKs](https://docs.xquik.com/sdks). Use TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI, and Terraform clients.
- [Tweet search export](https://docs.xquik.com/guides/tweet-scraper-csv-export). Export tweets by keyword to CSV, JSON, or XLSX.
- [Tweet replies export](https://docs.xquik.com/guides/tweet-replies-export). Export replies to CSV, JSON, or XLSX.
- [Follower export](https://docs.xquik.com/guides/follower-export-crm). Export X followers to CRM or warehouse.
- [Direct message workflow](https://docs.xquik.com/guides/direct-message-workflow). Send DMs and store returned message IDs.
- [Prefect](https://docs.xquik.com/guides/prefect). Schedule tweet, user, timeline, and trend reads in Prefect flows.
- [Webhooks](https://docs.xquik.com/webhooks/overview). Verify HMAC signatures and receive monitor events.
- [Open source assurance](https://docs.xquik.com/guides/open-source-assurance). Review OpenSSF project mapping and controls.
- [Apify Actors](https://docs.xquik.com/alternatives/apify). Run focused X data jobs on Apify.

## Use with AI coding agents

- [Context7 library](https://context7.com/xquik-dev/xquik-docs). Load indexed Xquik docs in supported coding agents.
- [llms.txt](https://docs.xquik.com/llms.txt). Discover every docs page before reading deeper.
- [MCP server v2.6.40](https://docs.xquik.com/mcp). Connect Xquik tools through OAuth-first Streamable HTTP.
- [MCP 2026-07-28](https://docs.xquik.com/mcp/overview#mcp-2026-07-28). Understand `server/discover`, request-scoped calls, and private cache hints.
- [Codex OAuth troubleshooting](https://docs.xquik.com/guides/troubleshooting#codex-oauth-issuer-validation-error). Codex CLI 0.147.0 and newer support Xquik OAuth. Upgrade if an older release reports `Authorization server response missing required issuer: expected https://xquik.com`. Use `bearer_token_env_var = "XQUIK_API_KEY"` only when upgrading is unavailable. [Issue #31573](https://github.com/openai/codex/issues/31573) records the fix.
- [Agent index](https://xquik.com/.well-known/agent-index.json). Discover the API MCP endpoint, manifest, OAuth metadata, and auth.md.
- [Agent Skills index](https://xquik.com/.well-known/agent-skills/index.json). Discover and verify Xquik's hosted `SKILL.md`.
- [auth.md](https://xquik.com/auth.md). Read CIMD, DCR, PKCE, and MCP authorization instructions.
- [OpenAPI spec](https://docs.xquik.com/openapi.yaml). Generate clients or inspect request and response shapes.

## Common questions

| Customer question | Documentation |
| --- | --- |
| How do I search tweets through an API? | [Search Tweets API](https://docs.xquik.com/api-reference/x/search-tweets) |
| How do I export tweet search results? | [Tweet Search Export](https://docs.xquik.com/guides/tweet-scraper-csv-export) |
| How do I read an account timeline? | [User Tweets API](https://docs.xquik.com/api-reference/x/user-tweets) |
| How do I export followers? | [Follower Export Guide](https://docs.xquik.com/guides/follower-export-crm) |
| How do I scrape following accounts? | [Following API](https://docs.xquik.com/api-reference/x/following) |
| How do I read my home timeline? | [Home Timeline API](https://docs.xquik.com/api-reference/x/timeline) |
| How do I monitor accounts or keywords? | [Brand Monitoring Guide](https://docs.xquik.com/guides/brand-monitoring-workflow) |
| How do I verify signed webhooks? | [Webhook Guide](https://docs.xquik.com/webhooks/overview) |
| How do I post or reply? | [Create Tweet API](https://docs.xquik.com/api-reference/x-write/create-tweet) |
| How do I send DMs with returned message IDs? | [Direct Message Workflow](https://docs.xquik.com/guides/direct-message-workflow) |
| How do I run Apify dataset workflows? | [Xquik on Apify](https://apify.com/xquik) |
| How does Xquik compare with the X API? | [X API Alternative Guide](https://docs.xquik.com/alternatives/x-api) |
| How can an AI agent use Xquik? | [MCP Server Guide](https://docs.xquik.com/mcp) |

Search tweets with `from:`, `since:`, `until:`, filters, and cursor pagination.

## What's covered

- **REST API.** 129 operations span account, guest wallets, API keys, monitors, events, webhooks, draws, extractions, X data, trends, radar, styles, drafts, compose, X accounts, writes, support, and integrations.
- **Webhooks.** HMAC SHA-256 signature verification, retry semantics, and payload schemas.
- **MCP server.** 118 full-scope routes or 33 guest `paid_reads` GET routes through 2 code-mode tools. Binary downloads use REST.
- **OAuth 2.1.** Automatic discovery, CIMD, DCR fallback, Authorization Code + PKCE, and token refresh.
- **Guides.** Workflows, error handling, rate limits, billing, trends, extractions, architecture, troubleshooting, types, webhook testing, and framework integrations.
- **SDKs.** 10 generated clients support TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI, and Terraform.
- **Comparisons.** Alternatives for X APIs, tweet scrapers, follower exporters, creator tools, and social suites.
- **Apify Actors.** Actors cover tweets, replies, followers, trends, profiles, communities, lists, and user search.
- **OpenAPI 3.1.** Machine-readable contract for endpoint pages and SDK generation.

## Repository layout

```
api-reference/      129 OpenAPI operations, grouped by resource
guides/             Workflow, operations, and framework guides
webhooks/           Overview + signature verification
mcp/                MCP server overview + tool reference
oauth/              OAuth 2.1 setup + flow
sdks/               Per-language SDK landing pages
alternatives/       Comparison and migration guides
x-api-quickstart.mdx      2-minute quickstart
docs.json           Navigation + theme config
custom.css          Custom styling
llms.txt            AI-readable site index
openapi.yaml        OpenAPI 3.1 source of truth
```

## Local development

Install Node.js 22, Bun 1.3.14, and REUSE 6.2.0.

```bash
npm ci --ignore-scripts
npm run check:dependencies
npm run test:agent-docs
npm run docs:validate
npm run docs:links
npm audit --audit-level=low
reuse lint
```

Run `npm exec -- mint dev` when visual previewing is necessary.

## Deployment

`main` auto-deploys to [docs.xquik.com](https://docs.xquik.com).

Deployment status appears in commit check runs.

GitHub Actions runs documentation, contract, security, and licensing checks.

Run every static check before pushing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for style rules, content conventions, and the workflow for opening a PR.

## Security

To report a vulnerability in the docs site or in any documented endpoint behaviour, see [SECURITY.md](SECURITY.md). Do not file public issues for security findings.

## Related repositories

- **[Xquik](https://xquik.com).** Main app and dashboard.
- **[Xquik-dev/x-twitter-scraper-python](https://github.com/Xquik-dev/x-twitter-scraper-python).** Python SDK.
- **[Xquik-dev/x-twitter-scraper-typescript](https://github.com/Xquik-dev/x-twitter-scraper-typescript).** TypeScript SDK.
- Other generated SDKs are listed under the [Xquik-dev](https://github.com/Xquik-dev) org.

## License

The documentation source uses the [MIT License](LICENSE).

The license does not cover the Xquik product, brand, or platform.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
