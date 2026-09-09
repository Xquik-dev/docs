# Xquik docs

This repository is the public documentation site. Treat every committed file as
public-facing unless it is explicitly a standard open-source project file.

Every commit reduces combined handwritten source & test LOC against its parent.
Use Git's native additions minus deletions, matching GitHub's diff statistics.
Count all languages, including infrastructure, shell scripts & development tooling.
Consistently exclude generated & non-code files. Never build custom LOC counters.
Formatting, minification, moves, reclassification & deleted valuable tests never qualify.
Preserve docs, assertions, coverage, guards, diagnostics & behavior.

Each commit gains 0.1 percentage points across all four TS/JS coverage metrics.
Include untested code & compare the full suite against its parent consistently.
Metrics reaching 100% may gain less; metrics already there stay there.
Check other languages behaviorally & track measurement gaps separately.
Coverage below 100% alone never blocks delivery.

Run all applicable local checks through `bun run check:all` within 30 seconds.
Include tests, coverage, LOC, types, lint, formatting, security, contracts & docs.
Report p99 measurement coverage honestly, including gaps.
Failed, incomplete or unavailable checks block delivery.
Build timing, p99 coverage, performance, costs & discovery scores remain improvement targets.
Server deployments must finish within 90 seconds, including setup & verification.
Overruns block unrelated delivery until corrective work meets the timing gate.
Corrective commits must still pass every other delivery gate.
Fix security, correctness, billing, deployment-safety & contract defects before shipping.
Publish required docs before the affected application deployment.
Verify production before declaring deployment complete.

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

## Archive dependency repair

- Use `bun run install:frozen` for reproducible installations without dependency lifecycle scripts.
- The npm override replaces the archive extractor with `@xhmikosr/decompress`.
- `patches/mintlify-archives.patch` migrates its callers and uses `zip-a-folder` for exports.
- Preserve upstream licensing and run `check:patches` through `check:all`.
- Remove the patch only after upstream callers use verified safe archive implementations.
