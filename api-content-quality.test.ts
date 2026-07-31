import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const API_REFERENCE_DIR = join(PROJECT_ROOT, 'api-reference');
const WRITE_ACTION_LIFECYCLE_SNIPPET = readFileSync(
  join(PROJECT_ROOT, 'snippets/write-action-lifecycle-response.mdx'),
  'utf8',
);
const FRONTMATTER_API_PATTERN = /^api:\s*"([A-Z]+) ([^"]+)"/mu;
const UNIX_TIMESTAMP_FILTER_ENDPOINTS: ReadonlySet<string> = new Set([
  'GET /x/lists/{id}/tweets',
  'GET /x/tweets/{id}/quotes',
  'GET /x/tweets/{id}/replies',
  'GET /x/users/{id}/mentions',
] as const);
const FORBIDDEN_PUBLIC_ENDPOINT_SNIPPETS = [
  ['shared', 'read', 'pool'].join(' '),
  ['read', 'pool'].join(' '),
  ['participant', 'session'].join(' '),
  ['session', 'reads', 'the', 'conversation'].join(' '),
  ['whose', 'session', 'reads'].join(' '),
  'A transient upstream issue occurred. Safe to retry with exponential backoff.',
  'The X data source returned an error. Retry after a short delay.',
  'The best-practice response contract can return 424 when the upstream X data source fails.',
  'Returned when you opt into the normalized v1 response contract and the upstream dependency fails.',
  'The X data source is temporarily unavailable. Retry with exponential backoff.',
] as const;

interface ContentFinding {
  readonly file: string;
  readonly issue: string;
}

function listApiReferenceFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listApiReferenceFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.mdx')) {
      files.push(relative(PROJECT_ROOT, fullPath));
    }
  }
  return files.sort();
}

function isApiEndpointPage(source: string): boolean {
  return FRONTMATTER_API_PATTERN.test(source);
}

function operationKey(source: string): string | undefined {
  const match = FRONTMATTER_API_PATTERN.exec(source);
  if (match?.[1] === undefined || match[2] === undefined) {
    return undefined;
  }
  return `${match[1]} ${match[2]}`;
}

function collectContentFindings(): readonly ContentFinding[] {
  const findings: ContentFinding[] = [];

  for (const file of listApiReferenceFiles(API_REFERENCE_DIR)) {
    const pageSource = readFileSync(join(PROJECT_ROOT, file), 'utf8');
    const source = pageSource.includes('<WriteActionLifecycleResponse />')
      ? `${pageSource}\n${WRITE_ACTION_LIFECYCLE_SNIPPET}`
      : pageSource;
    if (!isApiEndpointPage(source)) {
      continue;
    }

    if (!source.includes('<CodeGroup>')) {
      findings.push({ file, issue: 'Missing copy-ready code examples.' });
    }

    if (!/^## Headers\b/mu.test(source)) {
      findings.push({ file, issue: 'Missing headers section.' });
    }

    if (!/^## Response\b/mu.test(source)) {
      findings.push({ file, issue: 'Missing response section.' });
    }

    if (!/(?:<Tab title="|^### )2\d\d\b/mu.test(source)) {
      findings.push({ file, issue: 'Missing successful response section.' });
    }

    const key = operationKey(source);
    for (const snippet of FORBIDDEN_PUBLIC_ENDPOINT_SNIPPETS) {
      if (source.includes(snippet)) {
        findings.push({
          file,
          issue: `Public endpoint page exposes internal wording "${snippet}".`,
        });
      }
    }

    if (
      key !== undefined &&
      UNIX_TIMESTAMP_FILTER_ENDPOINTS.has(key) &&
      source.includes('ISO 8601 timestamp')
    ) {
      findings.push({
        file,
        issue: 'sinceTime/untilTime must document Unix timestamp filters.',
      });
    }
  }

  return findings;
}

describe('API endpoint content quality', (): void => {
  it('keeps endpoint pages useful beyond generated signatures', (): void => {
    expect.assertions(1);

    expect(collectContentFindings()).toStrictEqual([]);
  });
});
