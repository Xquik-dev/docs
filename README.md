# Xquik Docs

Documentation for [Xquik](https://xquik.com) - X (Twitter) real-time data platform.

**Live:** [docs.xquik.com](https://docs.xquik.com)

## Stack

- [Mintlify](https://mintlify.com) (Maple theme)
- Custom CSS (Instrument Serif headings, Outfit body)
- AI-ready: [llms.txt](https://docs.xquik.com/llms.txt) + auto-generated [llms-full.txt](https://docs.xquik.com/llms-full.txt)

## Structure

```
api-reference/     16 endpoint pages (account, api-keys, monitors, events, webhooks)
guides/            7 guides (workflows, error-handling, rate-limits, billing, etc.)
webhooks/          Overview + signature verification
mcp/               MCP server overview + 9 tools reference
introduction.mdx   Platform overview
quickstart.mdx     2-minute quickstart
docs.json          Navigation, theme, API playground config
custom.css         Heading font + sidebar title sizing
llms.txt           AI-readable site index (llmstxt.org spec)
```

## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) for local preview:

```bash
npx mintlify dev
```

## Deployment

Pushes to `main` auto-deploy via Mintlify GitHub integration. Deployment status is visible in commit check runs.
