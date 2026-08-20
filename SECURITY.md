# Security policy

Thank you for taking the time to report a vulnerability responsibly.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting][private-report].

Email [security@xquik.com](mailto:security@xquik.com) if GitHub is unavailable.

Do **not** open a public GitHub issue, discussion, or pull request for security findings. Public disclosure before a fix is in place puts every Xquik user at risk.

When reporting, include as much of the following as you can:

- A clear description of the issue.
- Reproduction steps, including request/response samples or proof-of-concept code where relevant.
- The affected endpoint, SDK version, or page on docs.xquik.com.
- Impact assessment (data exposure, account takeover, billing bypass, etc.).
- Any suggested mitigation.

## Response targets

- **Acknowledgement.** We respond within 24 hours.
- **Initial triage and severity assignment.** We complete both within 72 hours.
- **Fix or mitigation timeline.** We share it after triage. Critical issues take priority.
- **Progress updates.** We send one at least every 14 days during remediation.

## Scope

In scope:

- The `docs.xquik.com` Mintlify site.
- The OpenAPI spec (`openapi.yaml`) when its description contradicts actual API behaviour in a way that creates a vulnerability for integrators.
- Documentation that incorrectly describes authentication, signature verification, or scope semantics in a way that would lead a developer to build an insecure integration.

Out of scope (handle through the main repo or normal channels):

- Bugs in the Xquik product itself - report via [security@xquik.com](mailto:security@xquik.com); the team routes them to the right repository internally.
- Typos, broken links, or content suggestions - open a normal GitHub issue or PR on this repository.
- Findings that affect only the documentation hosting platform.

## Threat model

Protected assets include public contract integrity and release metadata.

Repository changes, build inputs, external links, and deployment cross trust boundaries.

Pull requests must not expose credentials or private implementation details.

Pinned workflows and lockfile integrity protect documentation builds.

Contract tests detect drift from the public OpenAPI specification.

Validated fixes require tests, independent review, and coordinated disclosure.

## Safe harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to comply with this policy.
- Avoid privacy violations, destruction of data, or interruption of service.
- Give us reasonable time to investigate and remediate before any public disclosure.

## Credit

With your permission, we acknowledge reporters in the changelog or in a dedicated security advisory once a fix is shipped. If you prefer to remain anonymous, say so in your initial report.

[private-report]: https://github.com/Xquik-dev/xquik-docs/security/advisories/new

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
