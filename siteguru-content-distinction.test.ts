import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface ContentRequirement {
  readonly file: string;
  readonly phrases: readonly string[];
}

const CONTENT_REQUIREMENTS: readonly ContentRequirement[] = [
  {
    file: 'api-reference/styles/analyze.mdx',
    phrases: ['Build a Reusable Tweet Writing Profile', 'cache creation and refreshes'],
  },
  {
    file: 'api-reference/styles/performance.mdx',
    phrases: [
      'Refresh Tweet Engagement for a Cached Style',
      'measurement time together',
    ],
  },
  {
    file: 'api-reference/monitors/get-keyword.mdx',
    phrases: [
      'Inspect One Twitter Keyword Monitor',
      'tracked search',
      'Verify One Alert Before Incident Review',
    ],
  },
  {
    file: 'api-reference/drafts/create.mdx',
    phrases: [
      'Save a Tweet Draft Before Publishing',
      'public tweet ID',
    ],
  },
  {
    file: 'api-reference/x/community-info.mdx',
    phrases: [
      'Validate an X Community Before Extraction',
      'wrong X community',
      'Qualify a Community Before Collecting Profiles or Tweets',
    ],
  },
  {
    file: 'api-reference/monitors/list.mdx',
    phrases: [
      'Inventory Every Twitter Account Monitor',
      'complete account-monitor inventory',
    ],
  },
  {
    file: 'api-reference/x-write/unretweet.mdx',
    phrases: ['Remove One Repost Without Changing Follows', 'quote tweets'],
  },
  {
    file: 'api-reference/x/community-tweets.mdx',
    phrases: ['Export a Community Timeline Without a Search Query', 'timeline order'],
  },
  {
    file: 'api-reference/credits/get.mdx',
    phrases: [
      'Check Credits Before Tweets, Followers, or Monitors',
      'never charges a payment method',
    ],
  },
  {
    file: 'api-reference/credits/quick-topup.mdx',
    phrases: ['Add API Credits With a Saved Payment Method', 'Read `outcome`'],
  },
  {
    file: 'api-reference/x/search-community-tweets.mdx',
    phrases: ['Preserve Decisions Across a Live Moderation Queue'],
  },
  {
    file: 'api-reference/x/community-search.mdx',
    phrases: ['Compare Latest and Top Results Without Mixing Datasets'],
  },
  {
    file: 'api-reference/monitors/update.mdx',
    phrases: ['Change One Account Monitor Safely'],
  },
  {
    file: 'api-reference/x-write/unfollow.mdx',
    phrases: ['Review a Following-Cleanup Batch'],
  },
  {
    file: 'api-reference/support/reply.mdx',
    phrases: ['Send a Durable Support Reply'],
  },
  {
    file: 'api-reference/credits/topup-status.mdx',
    phrases: ['Gate Queued API Work on the Checkout Result'],
  },
] as const;

describe('SiteGuru content distinction', (): void => {
  it('keeps flagged API pages focused on their own workflows', (): void => {
    expect.assertions(1);

    const missingPhrases = CONTENT_REQUIREMENTS.flatMap((requirement) => {
      const source = readFileSync(requirement.file, 'utf8');

      return requirement.phrases
        .filter((phrase): boolean => !source.includes(phrase))
        .map((phrase): string => `${requirement.file}: ${phrase}`);
    });

    expect(missingPhrases).toStrictEqual([]);
  });
});
