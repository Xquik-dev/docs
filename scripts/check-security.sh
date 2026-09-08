#!/usr/bin/env bash
set -euo pipefail

bun run check:loc
bunx --bun npm@12.0.1 audit --audit-level=low
options=(--config .gitleaks.toml --redact=100 --no-banner --ignore-gitleaks-allow --gitleaks-ignore-path /dev/null)
if [[ -n $(git status --porcelain) ]]; then
	gitleaks git --pre-commit "${options[@]}"
	gitleaks git --pre-commit --staged "${options[@]}"
else
	gitleaks git --log-opts HEAD^..HEAD "${options[@]}"
fi
