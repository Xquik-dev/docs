# Xquik docs

This repository is the public documentation site. Treat every committed file as
public-facing unless it is explicitly a standard open-source project file.

## Confidentiality

- Do not commit local automation handoffs, private research notes, prompt
  transcripts, internal audit logs, or scratch files.
- Keep `DOCS_QUALITY_POLL.md` local only. It is ignored by Git and must never
  be force-added.
- Do not publish private implementation details, infrastructure vendor names,
  private service names, proxy/provider identities, internal route names,
  internal cost units, or deployment-only operational details.
- Use generic public wording when implementation context is useful: "own
  infrastructure", "read service", "write service", "browser service", or
  "network egress service".
- Before staging or committing, inspect the staged diff for confidential
  implementation details. If a detail is not meant for customers, remove it or
  replace it with generic public wording before committing.

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
