# Contributing

Thanks for helping improve the Xquik docs. This file covers how to set up your environment, the conventions we follow, and how to get a change merged.

## Quick start

1. Fork the repository or create a branch if you have write access.
2. Install Node.js 22, Bun 1.3.14, and REUSE 6.2.0.
3. Run `npm ci --ignore-scripts`.
4. Edit the relevant `.mdx`, `.md`, `openapi.yaml`, or `docs.json`.
5. Run every static check listed below.
6. Sign off your commit.
7. Push and open a pull request against `main`.

Run these checks:

```sh
npm run check:dependencies
npm run test:agent-docs
npm run docs:validate
npm run docs:links
npm audit --audit-level=low
reuse lint
```

Use `mint dev` only when visual previewing is necessary.

## First contributions

Browse issues labeled [`good first issue`][good-first-issues].

Comment before starting substantial work.

Ask for acceptance criteria when the scope is unclear.

## What kinds of contributions are welcome

- Typo and clarity fixes on any page.
- New or improved code samples (curl, Python, TypeScript, etc.) on endpoint pages.
- New guides for common integration patterns. Open an issue first so we can agree on scope.
- New factual comparison and migration guides that help users evaluate X workflow options.
- OpenAPI spec corrections when documented behaviour does not match the live API. Verify against the live API before submitting.
- SDK landing-page updates when an SDK adds a feature or changes auth semantics.

## What we do not accept here

- Changes to internal product behaviour. The Xquik app is closed-source and lives in a separate repository; documentation must follow real behaviour, not propose new behaviour.
- Promotional or search-only content. Keep comparison pages factual, technical, and useful.
- Auto-generated SDK code. Each SDK has its own repository under the [Xquik-dev](https://github.com/Xquik-dev) org.

## Style rules

These are non-negotiable for merged PRs.

### Wording

- Active voice, imperative mood, no hedging. Under 15 words per sentence where possible.
- Numerals over words ("3 retries", not "three retries"). Use `&` over "and" only inside titles or short labels; prose uses "and".
- Use sentence case for page titles and section headings.
- Errors should describe the problem and fix: "Insufficient credits. Top up or subscribe to continue."

### Punctuation

- Do not use U+2014 em dashes, U+2013 en dashes, or spaced double hyphens. Use a period or comma.
- Use a real ellipsis character (`…`) for loading or "more" indicators rather than `...`.
- Avoid emojis unless the page already uses them consistently.

### Code samples

- Show the smallest example that demonstrates the feature.
- Default to `curl` for HTTP examples on REST endpoint pages, and at least one SDK example (Python or TypeScript) for any non-trivial flow.
- Always include realistic placeholder values, never real account IDs or live API keys.
- Show both the request and response payload.

### MDX components

- Prefer Mintlify built-ins (`<CodeGroup>`, `<Tabs>`, `<Steps>`, `<Tip>`, `<Warning>`) over custom HTML.
- Keep front-matter minimal: `title`, `description`, and where relevant `api` and `openapi`.

## OpenAPI changes

`openapi.yaml` is the source of truth that drives the rendered REST reference and the generated SDKs. Treat it carefully.

- Run `npm run docs:validate` locally before pushing.
- Do not introduce new endpoints here speculatively. Endpoints are added only after they ship in the live API.
- Breaking changes require coordination with the SDK release process; flag them in the PR description.

## Dependency changes

Keep direct dependencies exactly pinned.

Inspect lifecycle scripts before adding a package.

Regenerate `package-lock.json` with scripts disabled.

Run the audit and dependency policy before requesting review.

## Commit and PR conventions

- Use Conventional Commits prefixes: `docs:`, `fix:`, `feat:`, `chore:`. Most contributions here are `docs:` or `fix:`.
- Keep commit messages descriptive but tight. Reference any related GitHub issue using `Closes #123` or `Refs #123` in the PR body.
- One logical change per PR. Combining a typo fix with a new guide makes review harder.
- The PR description should answer: what changed, why it matters, how it was verified.
- Sign every commit under the [Developer Certificate of Origin][dco].

Use:

```sh
git commit --signoff
```

## Reviews and merging

- Maintainers review on a best-effort basis. Expect a first response within 3 business days.
- Another human must review maintainer-authored, nontrivial changes.
- Reviewers follow the shared [review policy][review-policy].
- Address every review comment before merging.
- Once approved, a maintainer merges and publishes the documentation.

## Code of conduct

Be civil. Personal attacks, harassment, and discriminatory language are not tolerated and will result in immediate removal. Disagreements about technical content should stay technical.

## Questions

- General product questions: [support@xquik.com](mailto:support@xquik.com).
- Security findings: [security@xquik.com](mailto:security@xquik.com) (see [SECURITY.md](SECURITY.md)).
- Anything else about this repository: open an issue.

[dco]: https://developercertificate.org/
[good-first-issues]: https://github.com/Xquik-dev/xquik-docs/labels/good%20first%20issue
[review-policy]: https://github.com/Xquik-dev/.github/blob/main/REVIEWING.md

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
