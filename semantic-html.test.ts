import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const SEMANTIC_HTML_PAGES = [
  'api-reference/api-keys/create.mdx',
  'api-reference/credits/quick-topup.mdx',
  'api-reference/draws/create.mdx',
  'api-reference/events/get.mdx',
  'api-reference/events/list.mdx',
  'api-reference/extractions/twitter-extraction-results.mdx',
  'api-reference/extractions/twitter-scraping-job-history.mdx',
  'api-reference/monitors/create.mdx',
  'api-reference/monitors/get-keyword.mdx',
  'api-reference/monitors/list.mdx',
  'api-reference/monitors/list-keywords.mdx',
  'api-reference/monitors/twitter-account-monitor-status.mdx',
  'api-reference/monitors/update.mdx',
  'api-reference/monitors/update-keyword.mdx',
  'api-reference/styles/save.mdx',
  'api-reference/webhooks/deliveries.mdx',
  'api-reference/webhooks/list.mdx',
  'api-reference/webhooks/resume.mdx',
  'api-reference/webhooks/update.mdx',
  'api-reference/x-write/create-community.mdx',
  'api-reference/x-write/create-tweet.mdx',
  'api-reference/x-write/delete-community.mdx',
  'api-reference/x-write/delete-tweet.mdx',
  'api-reference/x-write/follow.mdx',
  'api-reference/x-write/join-community.mdx',
  'api-reference/x-write/leave-community.mdx',
  'api-reference/x-write/like.mdx',
  'api-reference/x-write/remove-follower.mdx',
  'api-reference/x-write/retweet.mdx',
  'api-reference/x-write/send-dm.mdx',
  'api-reference/x-write/unfollow.mdx',
  'api-reference/x-write/unlike.mdx',
  'api-reference/x-write/unretweet.mdx',
  'api-reference/x-write/update-avatar.mdx',
  'api-reference/x-write/update-banner.mdx',
  'api-reference/x-write/update-profile.mdx',
  'api-reference/x-write/upload-media.mdx',
  'api-reference/x/bookmarks.mdx',
  'api-reference/x/download-media.mdx',
  'api-reference/x/get-user.mdx',
  'api-reference/x/timeline.mdx',
  'api-reference/x/tweet-replies.mdx',
  'api-reference/x/user-tweets.mdx',
  'guides/extraction-workflow.mdx',
  'guides/rate-limits.mdx',
  'guides/x-api-typescript-types.mdx',
  'mcp/tools.mdx',
  'sdks/csharp-x-api-sdk.mdx',
  'sdks/go.mdx',
  'sdks/java.mdx',
  'sdks/kotlin.mdx',
  'sdks/php.mdx',
  'sdks/python.mdx',
  'sdks/ruby.mdx',
  'sdks/typescript.mdx',
  'webhooks/verification.mdx',
  'x-api-quickstart.mdx',
] as const;

function countDocumentHeadings(source: string): number {
  let fence: '`' | '~' | undefined;
  let headingCount = 0;

  for (const line of source.split('\n')) {
    const fenceMatch = line.match(/^\s*([`~]{3,})/);

    if (fenceMatch) {
      const marker = fenceMatch[1][0] as '`' | '~';

      if (!fence) fence = marker;
      else if (fence === marker) fence = undefined;
      continue;
    }

    if (!fence && line.startsWith('## ')) headingCount++;
  }

  return headingCount;
}

describe('semantic documentation landmarks', (): void => {
  it('wraps every Semrush-flagged page in meaningful sections', (): void => {
    expect.assertions(1);

    const findings: string[] = [];

    for (const file of SEMANTIC_HTML_PAGES) {
      const source = readFileSync(file, 'utf8');
      const articleCount = source.match(/^<article>$/gm)?.length ?? 0;
      const sectionCount = source.match(/^<section(?:\s|>)/gm)?.length ?? 0;
      const expectedSections = countDocumentHeadings(source) + 1;

      if (articleCount !== 1) {
        findings.push(`${file} has ${articleCount} article landmarks`);
      }

      if (sectionCount !== expectedSections) {
        findings.push(
          `${file} has ${sectionCount} sections, expected ${expectedSections}`,
        );
      }
    }

    expect(findings).toStrictEqual([]);
  });
});
