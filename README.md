# Xquik Docs - X API, Real-Time X Data & Automation Reference

Public documentation for [Xquik](https://xquik.com), the X (Twitter) real-time data and automation platform. Built on [Mintlify](https://mintlify.com), deployed at **[docs.xquik.com](https://docs.xquik.com)**.

This repository powers the developer reference for the Xquik REST API, webhooks, MCP server, OAuth 2.1, SDKs, glossary, comparison guides, and how-to guides. Use it to find request and response details for tweet search, user lookup, follower exports, media uploads, direct messages, 1-second tweet monitors, signed webhooks, SDK clients, and X automation tasks.

## Start here

- [Quickstart](https://docs.xquik.com/quickstart) - make the first authenticated API call.
- [API Reference](https://docs.xquik.com/api-reference) - browse 120 OpenAPI-backed operations.
- [SDKs](https://docs.xquik.com/sdks) - use TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI, and Terraform clients.
- [Tweet search export](https://docs.xquik.com/guides/tweet-search-export) - export tweets by keyword to CSV, JSON, or XLSX.
- [Tweet replies export](https://docs.xquik.com/guides/tweet-replies-export) - export replies to CSV, JSON, or XLSX.
- [Follower export](https://docs.xquik.com/guides/follower-export-crm) - export X followers to CRM or warehouse.
- [Direct message workflow](https://docs.xquik.com/guides/direct-message-workflow) - send DMs and store returned message IDs.
- [Prefect](https://docs.xquik.com/guides/prefect) - schedule tweet, user, timeline, and trend reads in Prefect flows.
- [MCP Server](https://docs.xquik.com/mcp) - connect Claude, ChatGPT, Cursor, and other AI agents.
- [Webhooks](https://docs.xquik.com/webhooks/overview) - verify HMAC signatures and receive real-time X events.
- [Apify Actors](https://docs.xquik.com/alternatives/apify) - run X tweet and follower export jobs on Apify.
- [llms.txt](https://docs.xquik.com/llms.txt) - give AI coding agents the docs index.

## Use With AI Coding Agents

- [Context7 library](https://context7.com/xquik-dev/xquik-docs) - load indexed Xquik docs in supported coding agents.
- [llms.txt](https://docs.xquik.com/llms.txt) - discover every public docs page before reading deeper.
- [MCP Server](https://docs.xquik.com/mcp) - connect Xquik tools to Claude, ChatGPT, Cursor, and agent runtimes.
- [Agent index](https://xquik.com/.well-known/agent-index.json) - discover the API MCP endpoint, manifest, OAuth metadata, and auth.md.
- [auth.md](https://xquik.com/auth.md) - read the agent OAuth registration path for MCP access.
- [OpenAPI spec](https://docs.xquik.com/openapi.yaml) - generate clients or inspect request and response shapes.

## Common jobs

- Search tweets with `from:`, `since:`, `until:`, filters, and cursor pagination.
- Fetch tweet threads, read quotes, and inspect replies.
- Look up users, export followers, list following, and check relationships.
- Upload media, create tweets, send DMs with returned message IDs, and update profiles.
- Track new tweets with 1-second monitors and signed webhook delivery.
- Export results as JSON, CSV, XLSX, or Markdown.
- Run [X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper) and [X Follower Scraper](https://apify.com/xquik/x-follower-scraper) Actors for Apify dataset workflows.
- Compare Xquik with X API, social schedulers, data tools, and automation platforms.

## What's covered

- **REST API** - 120 operations spanning account, api-keys, monitors, events, webhooks, draws, extractions, x, trends, radar, styles, drafts, compose, x-accounts, x-write, support, and integrations.
- **Webhooks** - HMAC SHA-256 signature verification, retry semantics, payload schemas.
- **MCP server** - Model Context Protocol integration for Claude, ChatGPT, Cursor, and other AI agents. Tool reference + setup.
- **OAuth 2.1** - Authorization Code + PKCE flow, scopes, token refresh.
- **Guides** - Workflows, error handling, rate limits, billing, trends, extraction workflow, architecture, troubleshooting, types, webhook testing, and framework integrations.
- **SDKs** - 10 generated client libraries (TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI as Go binary, Terraform provider) with auto-pagination, retry, and typed responses.
- **Comparisons** - Factual alternatives and migration guides for X API, creator tools, social suites, data tools, and workflow platforms.
- **Apify Actors** - Public Apify Actors for tweet and follower dataset workflows before moving deeper workflows to REST, webhooks, SDKs, or MCP.
- **OpenAPI 3.1** - Machine-readable spec at `openapi.yaml`, used by Mintlify for endpoint pages and by Stainless for SDK generation.

## Repository layout

```
api-reference/      120 OpenAPI operations, grouped by resource
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

## Local development

Prerequisites: [Node.js 20+](https://nodejs.org) and the [Mintlify CLI](https://www.npmjs.com/package/mint).

```bash
npm install -g mint
mint dev          # local preview at http://localhost:3000
mint broken-links # check for broken internal links
mint validate     # validate the documentation build
mint a11y         # check accessibility issues
mint openapi-check openapi.yaml  # validate the OpenAPI spec
```

Edit any `.mdx` file and the preview reloads automatically.

## Deployment

`main` auto-deploys to [docs.xquik.com](https://docs.xquik.com) via Mintlify. Deployment status is visible in commit check runs. GitHub Actions also runs the Agent-Friendly Docs test suite and refreshes the Context7 library after docs changes. Run broken-link, OpenAPI, and agent-docs checks locally before pushing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for style rules, content conventions, and the workflow for opening a PR.

## Security

To report a vulnerability in the docs site or in any documented endpoint behaviour, see [SECURITY.md](SECURITY.md). Do not file public issues for security findings.

## Related repositories

- **[Xquik-dev/xquik](https://github.com/Xquik-dev/xquik)** - Main app (closed-source).
- **[Xquik-dev/x-twitter-scraper-python](https://github.com/Xquik-dev/x-twitter-scraper-python)** - Python SDK.
- **[Xquik-dev/x-twitter-scraper-typescript](https://github.com/Xquik-dev/x-twitter-scraper-typescript)** - TypeScript SDK.
- Other generated SDKs are listed under the [Xquik-dev](https://github.com/Xquik-dev) org.

## License

The docs source is published under the MIT License. See [LICENSE](LICENSE) if present, or treat the repository contents as MIT-licensed for the purpose of citing or quoting documentation in third-party material. The Xquik product, brand, and platform are not covered by this license.
