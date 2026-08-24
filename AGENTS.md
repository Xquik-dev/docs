# Xquik docs

This repository is the public documentation site. Treat every committed file as
public-facing unless it is explicitly a standard open-source project file.

Every commit must reduce net handwritten source LOC. No exceptions. No one may waive this rule.
Additions require larger, useful simplifications elsewhere in this repository.
Formatting, minification, generated files, and deleted valuable tests or docs do not count.

## Confidentiality

- Do not commit private handoffs, research, prompts, audit logs, or scratch files.
- Keep `DOCS_QUALITY_POLL.md` local only. It is ignored by Git and must never
  be force-added.
- Do not publish private implementation, infrastructure, routing, cost, or
  deployment details.
- Use generic terms such as "own infrastructure", "read service", "write
  service", "browser service", or "network egress service".
- Remove confidential details from the staged diff before committing.

## Docs workflow

- Pull latest changes and inspect `git status` before edits.
- Preserve unrelated user changes.
- Keep docs `openapi.yaml` aligned with `/Users/burak/Developer/xquik/openapi.yaml`
  unless a documented reason requires them to differ.
- Run static docs checks only unless the user explicitly asks for local servers
  or browser checks.
- Prefer `bun run test:agent-docs`, `bunx --bun mint validate`, and
  `bunx --bun mint broken-links`.
- If adding a root Markdown support file, either keep it ignored or make it an
  intentional public docs page with frontmatter and navigation.
