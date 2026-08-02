import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.txt']);
const EXCLUDED_DIRS = new Set(['.git', 'node_modules']);
const EXCLUDED_FILES = new Set(['DOCS_QUALITY_POLL.md']);
const EVENT_TYPE_TOKEN_PATTERN =
  /\b(?:follower\.(?:gained|lost)|tweet\.(?:created|deleted|hashtag|link|longform|media|mention|new|poll|quote|reply|retweet)|profile\.(?:avatar|banner|bio|location|name|pinned_tweet|protected|unavailable|url|username|verified)\.changed|webhook\.test)\b/gu;
const RETIRED_EVENT_PHRASE_PATTERN = /\bfollower (?:changes|events?)\b/giu;
const EXPECTED_SUBSCRIBABLE_EVENT_TYPES = [
  'tweet.new',
  'tweet.quote',
  'tweet.reply',
  'tweet.retweet',
  'tweet.media',
  'tweet.link',
  'tweet.poll',
  'tweet.mention',
  'tweet.hashtag',
  'tweet.longform',
  'profile.avatar.changed',
  'profile.banner.changed',
  'profile.name.changed',
  'profile.username.changed',
  'profile.bio.changed',
  'profile.location.changed',
  'profile.url.changed',
  'profile.verified.changed',
  'profile.protected.changed',
  'profile.pinned_tweet.changed',
  'profile.unavailable.changed',
] as const;
const EXPECTED_KEYWORD_EVENT_TYPES = [
  'tweet.new',
  'tweet.quote',
  'tweet.reply',
  'tweet.retweet',
  'tweet.media',
  'tweet.link',
  'tweet.poll',
  'tweet.mention',
  'tweet.hashtag',
  'tweet.longform',
] as const;
const NON_SUBSCRIBABLE_EVENT_TYPES = new Set(['webhook.test']);
const REQUIRED_SUBSCRIBABLE_EVENT_DOCS = [
  'api-reference/events/list.mdx',
  'api-reference/monitors/create.mdx',
  'api-reference/monitors/update.mdx',
  'guides/x-api-integration-checklist.mdx',
  'api-reference/webhooks/create.mdx',
  'api-reference/webhooks/update.mdx',
  'guides/x-api-typescript-types.mdx',
  'llms.txt',
  'webhooks/overview.mdx',
] as const;
const REQUIRED_KEYWORD_EVENT_DOCS = [
  'api-reference/monitors/create-keyword.mdx',
  'api-reference/monitors/update-keyword.mdx',
] as const;
const REQUIRED_TEST_EVENT_DOCS = [
  'api-reference/webhooks/test.mdx',
  'webhooks/overview.mdx',
] as const;
const HISTORICAL_EVENT_TYPE_FILES = new Set(['changelog.mdx']);

interface Finding {
  readonly eventType: string;
  readonly file: string;
  readonly issue: string;
  readonly line: number;
}

function hasDocExtension(filePath: string): boolean {
  return [...DOC_EXTENSIONS].some((extension): boolean =>
    filePath.endsWith(extension),
  );
}

function listDocFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...listDocFiles(fullPath));
      }
      continue;
    }

    const relativePath = relative(PROJECT_ROOT, fullPath);
    if (hasDocExtension(relativePath) && !EXCLUDED_FILES.has(relativePath)) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

function lineNumberForIndex(source: string, index: number): number {
  return source.slice(0, index).split(/\r?\n/u).length;
}

function extractOpenApiEventTypes(source: string): readonly string[] {
  const eventTypes: string[] = [];
  let inEventTypeSchema = false;
  let inEnum = false;

  for (const line of source.split(/\r?\n/u)) {
    if (line === '    EventType:') {
      inEventTypeSchema = true;
      continue;
    }

    if (!inEventTypeSchema) {
      continue;
    }

    if (/^    [A-Za-z][A-Za-z0-9]+:/u.test(line)) {
      break;
    }

    if (line === '      enum:') {
      inEnum = true;
      continue;
    }

    if (!inEnum) {
      continue;
    }

    const eventTypeMatch = /^        - ([a-z][a-z0-9_.-]+)\s*$/u.exec(line);
    if (eventTypeMatch?.[1] !== undefined) {
      eventTypes.push(eventTypeMatch[1]);
      continue;
    }

    if (!line.startsWith('        - ')) {
      inEnum = false;
    }
  }

  return eventTypes;
}

function eventTypesInSource(source: string): readonly string[] {
  return [...new Set(source.match(EVENT_TYPE_TOKEN_PATTERN) ?? [])].sort();
}

function collectUnsupportedEventTypeFindings(
  allowedEventTypes: ReadonlySet<string>,
): readonly Finding[] {
  const findings: Finding[] = [];

  for (const file of listDocFiles(PROJECT_ROOT)) {
    if (HISTORICAL_EVENT_TYPE_FILES.has(file)) {
      continue;
    }

    const source = readFileSync(join(PROJECT_ROOT, file), 'utf8');
    for (const match of source.matchAll(EVENT_TYPE_TOKEN_PATTERN)) {
      const eventType = match[0];
      if (!allowedEventTypes.has(eventType)) {
        findings.push({
          eventType,
          file,
          issue: 'Documented event type is not in the public event contract.',
          line: lineNumberForIndex(source, match.index ?? 0),
        });
      }
    }
  }

  return findings;
}

function collectRetiredEventPhraseFindings(): readonly Finding[] {
  const findings: Finding[] = [];

  for (const file of listDocFiles(PROJECT_ROOT)) {
    if (HISTORICAL_EVENT_TYPE_FILES.has(file)) {
      continue;
    }

    const source = readFileSync(join(PROJECT_ROOT, file), 'utf8');
    for (const match of source.matchAll(RETIRED_EVENT_PHRASE_PATTERN)) {
      findings.push({
        eventType: match[0],
        file,
        issue: 'Current docs should not describe retired follower event support.',
        line: lineNumberForIndex(source, match.index ?? 0),
      });
    }
  }

  return findings;
}

function missingEventTypeMentions(
  file: string,
  requiredEventTypes: readonly string[],
): readonly string[] {
  const source = readFileSync(join(PROJECT_ROOT, file), 'utf8');
  const documentedEventTypes = new Set(eventTypesInSource(source));
  return requiredEventTypes.filter(
    (eventType): boolean => !documentedEventTypes.has(eventType),
  );
}

describe('documented event types', (): void => {
  it('keeps account monitor docs within supported event scope', (): void => {
    expect.assertions(1);

    const createFile = 'api-reference/monitors/create.mdx';
    const createSource = readFileSync(join(PROJECT_ROOT, createFile), 'utf8');
    const createDescription =
      /^description:\s*"([^"]+)"$/mu.exec(createSource)?.[1] ?? '';
    const listFile = 'api-reference/monitors/list.mdx';
    const listSource = readFileSync(join(PROJECT_ROOT, listFile), 'utf8');
    const updateFile = 'api-reference/monitors/update.mdx';
    const updateSource = readFileSync(join(PROJECT_ROOT, updateFile), 'utf8');
    const updateDescription =
      /^description:\s*"([^"]+)"$/mu.exec(updateSource)?.[1] ?? '';

    const findings = [
      { file: createFile, source: createDescription },
      { file: listFile, source: listSource },
      { file: updateFile, source: updateDescription },
    ].flatMap(({ file, source }): readonly Finding[] => {
      return Array.from(
        source.matchAll(
          /\b(?:followers?|following|relationship (?:changes?|events?))\b/giu,
        ),
        (match): Finding => ({
          eventType: match[0],
          file,
          issue: 'Account monitor docs describe an unsupported event scope.',
          line: lineNumberForIndex(source, match.index ?? 0),
        }),
      );
    });

    expect({
      createDescriptionPresent: createDescription.length > 0,
      findings,
      updateDescriptionPresent: updateDescription.length > 0,
    }).toStrictEqual({
      createDescriptionPresent: true,
      findings: [],
      updateDescriptionPresent: true,
    });
  });

  it('keeps the OpenAPI subscribable event enum explicit', (): void => {
    expect.assertions(1);

    const eventTypes = extractOpenApiEventTypes(
      readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'),
    );
    expect([...eventTypes].sort()).toStrictEqual([
      ...EXPECTED_SUBSCRIBABLE_EVENT_TYPES,
    ].sort());
  });

  it('does not mention unsupported public event type tokens', (): void => {
    expect.assertions(1);

    const subscribableEventTypes = extractOpenApiEventTypes(
      readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8'),
    );
    const allowedEventTypes = new Set([
      ...subscribableEventTypes,
      ...NON_SUBSCRIBABLE_EVENT_TYPES,
    ]);
    expect(collectUnsupportedEventTypeFindings(allowedEventTypes)).toStrictEqual(
      [],
    );
  });

  it('does not describe retired follower event support in current docs', (): void => {
    expect.assertions(1);

    expect(collectRetiredEventPhraseFindings()).toStrictEqual([]);
  });

  it('lists every subscribable event type in core event docs', (): void => {
    expect.assertions(1);

    const missingByFile = REQUIRED_SUBSCRIBABLE_EVENT_DOCS.map((file) => ({
      file,
      missing: missingEventTypeMentions(
        file,
        EXPECTED_SUBSCRIBABLE_EVENT_TYPES,
      ),
    })).filter((entry): boolean => entry.missing.length > 0);

    expect(missingByFile).toStrictEqual([]);
  });

  it('lists every keyword-monitor event type in keyword monitor docs', (): void => {
    expect.assertions(1);

    const missingByFile = REQUIRED_KEYWORD_EVENT_DOCS.map((file) => ({
      file,
      missing: missingEventTypeMentions(file, EXPECTED_KEYWORD_EVENT_TYPES),
    })).filter((entry): boolean => entry.missing.length > 0);

    expect(missingByFile).toStrictEqual([]);
  });

  it('documents the non-subscribable webhook test event only in test docs', (): void => {
    expect.assertions(1);

    const missingByFile = REQUIRED_TEST_EVENT_DOCS.map((file) => ({
      file,
      missing: missingEventTypeMentions(file, [...NON_SUBSCRIBABLE_EVENT_TYPES]),
    })).filter((entry): boolean => entry.missing.length > 0);

    expect(missingByFile).toStrictEqual([]);
  });
});
