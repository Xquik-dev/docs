# Xquik Docs - X API, 1-Second Monitors & Automation Reference

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

Public documentation for [Xquik](https://xquik.com), an X data and automation
platform. Published at **[docs.xquik.com](https://docs.xquik.com)**.

This repository powers the developer reference for the Xquik REST API, webhooks, MCP server, OAuth 2.1, SDKs, glossary, comparison guides, and how-to guides. Use it to find request and response details for tweet search, user lookup, follower exports, media uploads, direct messages, 1-second tweet monitors, signed webhooks, SDK clients, and X automation tasks.

## Choose This Repository

Use hosted docs for current task guidance.
Use this repository to review source, propose fixes, or validate public contracts.
Use SDK repositories for generated client APIs.

## Start Here

- [Quickstart](https://docs.xquik.com/quickstart) - make the first authenticated API call.
- [API Reference](https://docs.xquik.com/api-reference) - browse 128 OpenAPI-backed operations.
- [Guest wallets](https://docs.xquik.com/guides/guest-wallets) - fund 33 accountless GET routes through a confirmed Stripe Payment Link.
- [Direct MPP](https://docs.xquik.com/mpp/overview) - pay per request on 7 fixed-price GET operations.
- [SDKs](https://docs.xquik.com/sdks) - use TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI, and Terraform clients.
- [Tweet search export](https://docs.xquik.com/guides/tweet-search-export) - export tweets by keyword to CSV, JSON, or XLSX.
- [Tweet replies export](https://docs.xquik.com/guides/tweet-replies-export) - export replies to CSV, JSON, or XLSX.
- [Follower export](https://docs.xquik.com/guides/follower-export-crm) - export X followers to CRM or warehouse.
- [Direct message workflow](https://docs.xquik.com/guides/direct-message-workflow) - send DMs and store returned message IDs.
- [Prefect](https://docs.xquik.com/guides/prefect) - schedule tweet, user, timeline, and trend reads in Prefect flows.
- [MCP Server](https://docs.xquik.com/mcp) - connect AI clients through their current OAuth or secure API-key path.
- [Webhooks](https://docs.xquik.com/webhooks/overview) - verify HMAC signatures and receive monitor events.
- [Open Source Assurance](https://docs.xquik.com/guides/open-source-assurance) - review OpenSSF project mapping and public controls.
- [Apify Actors](https://docs.xquik.com/alternatives/apify) - run X tweet and follower export jobs on Apify.
- [llms.txt](https://docs.xquik.com/llms.txt) - give AI coding agents the docs index.

## Use With AI Coding Agents

- [Context7 library](https://context7.com/xquik-dev/xquik-docs) - load indexed Xquik docs in supported coding agents.
- [llms.txt](https://docs.xquik.com/llms.txt) - discover every public docs page before reading deeper.
- [MCP Server](https://docs.xquik.com/mcp) - connect Xquik tools through OAuth-first Streamable HTTP.
- [Codex OAuth troubleshooting](https://docs.xquik.com/guides/troubleshooting#codex-oauth-issuer-validation-error) - if Codex reports `Authorization server response missing required issuer: expected https://xquik.com`, use `bearer_token_env_var = "XQUIK_API_KEY"` until the [upstream Codex issue](https://github.com/openai/codex/issues/31573) identifies a fixed release. Xquik already returns the required RFC 9207 `iss` value.
- [Agent index](https://xquik.com/.well-known/agent-index.json) - discover the API MCP endpoint, manifest, OAuth metadata, and auth.md.
- [Agent Skills index](https://xquik.com/.well-known/agent-skills/index.json) - discover and verify Xquik's hosted `SKILL.md`.
- [auth.md](https://xquik.com/auth.md) - read CIMD, DCR, PKCE, and MCP authorization instructions.
- [OpenAPI spec](https://docs.xquik.com/openapi.yaml) - generate clients or inspect request and response shapes.

## Common Questions

| Customer Question | Documentation |
| --- | --- |
| How do I search tweets through an API? | [Search Tweets API](https://docs.xquik.com/api-reference/x/search-tweets) |
| How do I export tweet search results? | [Tweet Search Export](https://docs.xquik.com/guides/tweet-search-export) |
| How do I read an account timeline? | [User Tweets API](https://docs.xquik.com/api-reference/x/user-tweets) |
| How do I export followers? | [Follower Export Guide](https://docs.xquik.com/guides/follower-export-crm) |
| How do I scrape following accounts? | [Following API](https://docs.xquik.com/api-reference/x/following) |
| How do I read my home timeline? | [Home Timeline API](https://docs.xquik.com/api-reference/x/timeline) |
| How do I monitor accounts or keywords? | [Brand Monitoring Guide](https://docs.xquik.com/guides/brand-monitoring-workflow) |
| How do I verify signed webhooks? | [Webhook Guide](https://docs.xquik.com/webhooks/overview) |
| How do I post or reply? | [Create Tweet API](https://docs.xquik.com/api-reference/x-write/create-tweet) |
| How do I send DMs with returned message IDs? | [Direct Message Workflow](https://docs.xquik.com/guides/direct-message-workflow) |
| How do I run Apify dataset workflows? | [X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper) or [X Follower Scraper](https://apify.com/xquik/x-follower-scraper) |
| How does Xquik compare with the X API? | [X API Alternative Guide](https://docs.xquik.com/alternatives/x-api) |
| How can an AI agent use Xquik? | [MCP Server Guide](https://docs.xquik.com/mcp) |

Search tweets with `from:`, `since:`, `until:`, filters, and cursor pagination.

## What's Covered

- **REST API** - 128 operations spanning account, guest wallets, API keys, monitors, events, webhooks, draws, extractions, X data, trends, radar, styles, drafts, compose, X accounts, writes, support, and integrations.
- **Webhooks** - HMAC SHA-256 signature verification, retry semantics, payload schemas.
- **MCP server** - 120 full-scope catalog routes or 33 guest `paid_reads` GET routes through 2 code-mode tools. Binary support downloads use REST.
- **OAuth 2.1** - Automatic discovery, CIMD, DCR fallback, Authorization Code + PKCE, and token refresh.
- **Guides** - Workflows, error handling, rate limits, billing, trends, extraction workflow, architecture, troubleshooting, types, webhook testing, and framework integrations.
- **SDKs** - 10 generated client libraries (TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI as Go binary, Terraform provider) with auto-pagination, retry, and typed responses.
- **Comparisons** - Factual alternatives and migration guides for X API, creator tools, social suites, data tools, and workflow platforms.
- **Apify Actors** - Public Apify Actors for tweet and follower dataset workflows before moving deeper workflows to REST, webhooks, SDKs, or MCP.
- **OpenAPI 3.1** - Machine-readable contract for endpoint pages and SDK generation.

## Repository Layout

```
api-reference/      128 OpenAPI operations, grouped by resource
guides/             Workflow, operations, and framework guides
webhooks/           Overview + signature verification
mcp/                MCP server overview + tool reference
oauth/              OAuth 2.1 setup + flow
sdks/               Per-language SDK landing pages
alternatives/       Comparison and migration guides
introduction.mdx    Platform overview
quickstart.mdx      2-minute quickstart
docs.json           Navigation + theme config
custom.css          Custom styling
llms.txt            AI-readable site index
openapi.yaml        OpenAPI 3.1 source of truth
```

## Local Development

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

## Related Repositories

- **[Xquik](https://xquik.com)** - Main app and dashboard.
- **[Xquik-dev/x-twitter-scraper-python](https://github.com/Xquik-dev/x-twitter-scraper-python)** - Python SDK.
- **[Xquik-dev/x-twitter-scraper-typescript](https://github.com/Xquik-dev/x-twitter-scraper-typescript)** - TypeScript SDK.
- Other generated SDKs are listed under the [Xquik-dev](https://github.com/Xquik-dev) org.

## License

The documentation source uses the [MIT License](LICENSE).

The license does not cover the Xquik product, brand, or platform.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
