# Xquik Docs

[![Ask DeepWiki](https://deepwiki.com/badge.svg?url=https%3A%2F%2Fgithub.com%2FXquik-dev%2Fxquik-docs)](https://deepwiki.com/Xquik-dev/xquik-docs)

Public documentation for [Xquik](https://xquik.com), the X (Twitter) real-time data and automation platform. Built on [Mintlify](https://mintlify.com), deployed at **[docs.xquik.com](https://docs.xquik.com)**.

This repository powers the developer reference: REST API, webhooks, MCP server, OAuth 2.1, SDKs, glossary, comparison guides, and how-to guides. Main-domain pages should link or redirect here when the content is technical reference, implementation guidance, comparison guidance, or API documentation.

## What's covered

- **REST API** - 118 endpoint pages spanning account, api-keys, monitors, events, webhooks, draws, extractions, x, trends, radar, styles, drafts, compose, x-accounts, x-write, support, and integrations.
- **Webhooks** - HMAC SHA-256 signature verification, retry semantics, payload schemas.
- **MCP server** - Model Context Protocol integration for Claude, ChatGPT, Cursor, and other AI agents. Tool reference + setup.
- **OAuth 2.1** - Authorization Code + PKCE flow, scopes, token refresh.
- **Guides** - Workflows, error handling, rate limits, billing, trends, extraction workflow, architecture, troubleshooting, types, webhook testing, and framework integrations.
- **SDKs** - 10 generated client libraries (TypeScript, Python, Go, Java, Kotlin, C#, Ruby, PHP, CLI as Go binary, Terraform provider) with auto-pagination, retry, and typed responses.
- **Comparisons** - Factual alternatives and migration guides for X API, creator tools, social suites, data tools, and workflow platforms.
- **OpenAPI 3.1** - Machine-readable spec at `openapi.yaml`, used by Mintlify for endpoint pages and by Stainless for SDK generation.

## Repository layout

```
api-reference/      118 endpoint pages, grouped by resource
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

`main` auto-deploys to [docs.xquik.com](https://docs.xquik.com) via Mintlify. Deployment status is visible in commit check runs. There is no separate build or test pipeline; broken-link and OpenAPI checks should be run locally before pushing.

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
