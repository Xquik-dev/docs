#!/usr/bin/env bash
set -euo pipefail

[[ -z $(git rev-parse --show-prefix) ]] || {
	echo 'Run from the repository root.' >&2
	exit 1
}
[[ -z $(git ls-files --others --exclude-standard) ]] || {
	echo 'Stage intended new files before checking LOC.' >&2
	exit 1
}
parent=HEAD
[[ -n $(git status --porcelain) ]] || parent=HEAD^
git rev-parse --verify "$parent" >/dev/null

protected=$(git diff --name-only "$parent" -- '.env*' '**/.env*' '*.env' '**/*.env')
[[ -z "$protected" ]] || {
	echo 'Protected environment paths prevent LOC inspection.' >&2
	exit 1
}

git diff --no-ext-diff --no-textconv --no-renames --numstat "$parent" -- . \
	':(exclude)*.md' ':(exclude)*.mdx' ':(exclude)*.txt' \
	':(exclude)bun.lock' ':(exclude)package-lock.json' ':(exclude)openapi.yaml' |
	awk '{ additions += $1; deletions += $2 }
    END {
      printf "Git LOC: %d additions, %d deletions, delta %+d\n", additions, deletions, additions - deletions
      exit additions >= deletions
    }'
