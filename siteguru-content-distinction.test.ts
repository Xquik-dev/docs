import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface ContentRequirement {
  readonly file: string;
  readonly phrases: readonly string[];
}

const CONTENT_REQUIREMENTS: readonly ContentRequirement[] = [
  {
    file: 'api-reference/styles/analyze.mdx',
    phrases: ['Build a reusable tweet writing profile', 'cache creation and refreshes'],
  },
  {
    file: 'api-reference/styles/performance.mdx',
    phrases: [
      'Refresh tweet engagement for a cached style',
      'measurement time together',
    ],
  },
  {
    file: 'api-reference/monitors/get-keyword.mdx',
    phrases: [
      'Inspect one Twitter keyword monitor',
      'Single-monitor question',
      'tracked search',
      'Verify one alert before incident review',
      'Diagnose one keyword monitor',
      'Prove a keyword alert with stored evidence',
      'Distinguish configuration drift from missing tweets',
    ],
  },
  {
    file: 'api-reference/monitors/list-keywords.mdx',
    phrases: [
      'Reconcile the entire keyword monitor portfolio',
      'Portfolio check',
      'Review a portfolio of tracked search rules',
      'Prepare a keyword monitor budget report',
    ],
  },
  {
    file: 'api-reference/drafts/create.mdx',
    phrases: [
      'Save a tweet draft before publishing',
      'public tweet ID',
    ],
  },
  {
    file: 'api-reference/x/community-info.mdx',
    phrases: [
      'Validate an X community before extraction',
      'wrong X community',
      'Qualify a community before collecting profiles or tweets',
      'Create a community qualification manifest',
      'Use community metadata to choose the next route',
      'Detect community metadata drift',
    ],
  },
  {
    file: 'api-reference/monitors/list.mdx',
    phrases: [
      'Inventory every Twitter account monitor',
      'complete account-monitor inventory',
      'Reconcile an account monitor inventory',
      'Assign account monitor ownership',
      'Prepare safe bulk account monitor cleanup',
    ],
  },
  {
    file: 'api-reference/monitors/twitter-account-monitor-status.mdx',
    phrases: [
      'Check one Twitter account activity tracker',
      'A healthy account alert',
      'requires four aligned layers.',
      'Followers and following are not monitor event types.',
      'How do Twitter analytics tools differ from monitor status?',
      'What should a Twitter account activity audit store?',
      'Approve one account monitor change',
      'Trace one missing profile alert',
    ],
  },
  {
    file: 'api-reference/x-write/unretweet.mdx',
    phrases: [
      'Remove one repost by tweet ID',
      'quote tweets',
      'Verify repost removal and timeline state',
    ],
  },
  {
    file: 'api-reference/x-write/create-community.mdx',
    phrases: [
      'Build a reviewable community brief',
      'Validate the new community',
      'Handle creation failures safely',
    ],
  },
  {
    file: 'api-reference/x-write/join-community.mdx',
    phrases: [
      'Resolve membership intent',
      'Join communities in controlled batches',
      'Verify visible membership',
      'Recover from join failures',
      'Find Twitter communities before joining',
      'Explain community post visibility',
      'How to join a Twitter community with Xquik?',
    ],
  },
  {
    file: 'api-reference/x/community-tweets.mdx',
    phrases: [
      'Archive the unfiltered community feed',
      'Feed decision',
      'Are Twitter community posts public or private?',
      'Where can I find analytics for X community posts?',
      'Can this API schedule or moderate community posts?',
      'Audit a cursor-based community feed',
      'Preserve community tweet authors and media',
      'Compare community timeline snapshots',
      'Direct community tweet handoff',
      'Which community endpoint?',
    ],
  },
  {
    file: 'api-reference/credits/get.mdx',
    phrases: [
      'Check credits before tweets, followers, or monitors',
      'never charges a payment method',
    ],
  },
  {
    file: 'api-reference/credits/quick-topup.mdx',
    phrases: ['Add API credits with a saved payment method', 'Read `outcome`'],
  },
  {
    file: 'api-reference/x/community-search.mdx',
    phrases: [
      'Filter one community by query',
      'Search decision',
      'Compare latest and top results without mixing datasets',
      'Build a live community review queue',
      'Preserve decisions across a live moderation queue',
      'Build a query-specific community review batch',
      'Separate search matches from community feed coverage',
    ],
  },
  {
    file: 'api-reference/monitors/update.mdx',
    phrases: [
      'Change one account monitor safely',
      'Prepare a reversible account monitor change',
      'Separate pausing, filtering, and deletion',
      'Verify the first event after resuming',
    ],
  },
  {
    file: 'api-reference/x-write/unfollow.mdx',
    phrases: ['Verify the Twitter unfollow API result'],
  },
  {
    file: 'api-reference/x-write/delete-community.mdx',
    phrases: [
      'How to delete a Twitter community through REST',
      'route removes the community, not the connected X account.',
      'Use [Leave Community](/api-reference/x-write/leave-community) to remove one',
    ],
  },
  {
    file: 'api-reference/x-write/leave-community.mdx',
    phrases: [
      'Archive community posts before leaving',
      'Verify the Twitter community departure',
      'Leave a Twitter community on PC or phone',
      'Recover from leave community failures',
    ],
  },
  {
    file: 'api-reference/support/reply.mdx',
    phrases: ['Send a durable support reply'],
  },
  {
    file: 'api-reference/credits/topup-status.mdx',
    phrases: ['Gate queued API work on the checkout result'],
  },
  {
    file: 'api-reference/x-write/follow.mdx',
    phrases: ['Verify the Twitter follow API result'],
  },
  {
    file: 'api-reference/x/followers-you-know.mdx',
    phrases: [
      'Build a mutual connection brief',
      'Prepare a warm-introduction review',
      'Compare mutual follower graph snapshots',
    ],
  },
  {
    file: 'api-reference/x/verified-followers.mdx',
    phrases: [
      'Build a verified follower directory',
      'Validate verified follower export completeness',
    ],
  },
  {
    file: 'api-reference/x-write/unlike.mdx',
    phrases: ['Confirm like removal'],
  },
  {
    file: 'alternatives/antwork.mdx',
    phrases: ['Antwork trial evidence'],
  },
  {
    file: 'alternatives/black-magic.mdx',
    phrases: ['Black Magic trial evidence'],
  },
  {
    file: 'alternatives/hypefury.mdx',
    phrases: ['Hypefury trial evidence'],
  },
  {
    file: 'alternatives/postwise.mdx',
    phrases: [
      'Postwise creator calendar trial',
      'Test the Postwise-to-Xquik handoff',
    ],
  },
  {
    file: 'alternatives/postproxy.mdx',
    phrases: ['Postproxy webhook & quota trial'],
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
