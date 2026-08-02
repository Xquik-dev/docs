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
      'Single-monitor question',
      'tracked search',
      'Verify One Alert Before Incident Review',
      'Diagnose One Keyword Monitor',
      'Prove a Keyword Alert With Stored Evidence',
      'Distinguish Configuration Drift From Missing Tweets',
    ],
  },
  {
    file: 'api-reference/monitors/list-keywords.mdx',
    phrases: [
      'Reconcile the Entire Keyword Monitor Portfolio',
      'Portfolio check',
      'Review a Portfolio of Tracked Search Rules',
      'Prepare a Keyword Monitor Budget Report',
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
      'Create a Community Qualification Manifest',
      'Use Community Metadata to Choose the Next Route',
      'Detect Community Metadata Drift',
    ],
  },
  {
    file: 'api-reference/monitors/list.mdx',
    phrases: [
      'Inventory Every Twitter Account Monitor',
      'complete account-monitor inventory',
      'Reconcile an Account Monitor Inventory',
      'Assign Account Monitor Ownership',
      'Prepare Safe Bulk Account Monitor Cleanup',
    ],
  },
  {
    file: 'api-reference/monitors/twitter-account-monitor-status.mdx',
    phrases: [
      'Approve One Account Monitor Change',
      'Trace One Missing Profile Alert',
    ],
  },
  {
    file: 'api-reference/x-write/unretweet.mdx',
    phrases: [
      'Remove One Repost by Tweet ID',
      'quote tweets',
      'Verify Repost Removal and Timeline State',
    ],
  },
  {
    file: 'api-reference/x-write/create-community.mdx',
    phrases: [
      'Build a Reviewable Community Brief',
      'Validate the New Community',
      'Handle Creation Failures Safely',
    ],
  },
  {
    file: 'api-reference/x-write/join-community.mdx',
    phrases: [
      'Resolve Membership Intent',
      'Join Communities in Controlled Batches',
      'Verify Visible Membership',
      'Recover From Join Failures',
    ],
  },
  {
    file: 'api-reference/x/community-tweets.mdx',
    phrases: [
      'Archive the Unfiltered Community Feed',
      'Feed decision',
      'Are Twitter Community Posts Public or Private?',
      'Where Can I Find Analytics for X Community Posts?',
      'Can This API Schedule or Moderate Community Posts?',
      'Audit a Cursor-Based Community Feed',
      'Preserve Community Tweet Authors and Media',
      'Compare Community Timeline Snapshots',
      'Direct Community Tweet Handoff',
      'Which Community Endpoint?',
    ],
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
    file: 'api-reference/x/community-search.mdx',
    phrases: [
      'Filter One Community by Query',
      'Search decision',
      'Compare Latest and Top Results Without Mixing Datasets',
      'Build a Live Community Review Queue',
      'Preserve Decisions Across a Live Moderation Queue',
      'Build a Query-Specific Community Review Batch',
      'Separate Search Matches From Community Feed Coverage',
    ],
  },
  {
    file: 'api-reference/monitors/update.mdx',
    phrases: [
      'Change One Account Monitor Safely',
      'Prepare a Reversible Account Monitor Change',
      'Separate Pausing, Filtering, and Deletion',
      'Verify the First Event After Resuming',
    ],
  },
  {
    file: 'api-reference/x-write/unfollow.mdx',
    phrases: ['Verify the Twitter Unfollow API Result'],
  },
  {
    file: 'api-reference/x-write/delete-community.mdx',
    phrases: [
      'How to Delete a Twitter Community Through REST',
      'route removes the community, not the connected X account.',
      'Use [Leave Community](/api-reference/x-write/leave-community) to remove one',
    ],
  },
  {
    file: 'api-reference/x-write/leave-community.mdx',
    phrases: [
      'Leave Membership Without Deleting the Community',
      'Departure check',
      'This route does not disband the group.',
    ],
  },
  {
    file: 'api-reference/support/reply.mdx',
    phrases: ['Send a Durable Support Reply'],
  },
  {
    file: 'api-reference/credits/topup-status.mdx',
    phrases: ['Gate Queued API Work on the Checkout Result'],
  },
  {
    file: 'api-reference/x-write/follow.mdx',
    phrases: ['Verify the Twitter Follow API Result'],
  },
  {
    file: 'api-reference/x/followers-you-know.mdx',
    phrases: [
      'Build a Mutual Connection Brief',
      'Prepare a Warm-Introduction Review',
      'Compare Mutual Follower Graph Snapshots',
    ],
  },
  {
    file: 'api-reference/x/verified-followers.mdx',
    phrases: [
      'Build a Verified Follower Directory',
      'Validate Verified Follower Export Completeness',
    ],
  },
  {
    file: 'api-reference/x-write/unlike.mdx',
    phrases: ['Confirm Like Removal'],
  },
  {
    file: 'alternatives/antwork.mdx',
    phrases: ['Antwork Trial Evidence'],
  },
  {
    file: 'alternatives/black-magic.mdx',
    phrases: ['Black Magic Trial Evidence'],
  },
  {
    file: 'alternatives/hypefury.mdx',
    phrases: ['Hypefury Trial Evidence'],
  },
  {
    file: 'alternatives/postwise.mdx',
    phrases: [
      'Postwise Creator Calendar Trial',
      'Test the Postwise-to-Xquik Handoff',
    ],
  },
  {
    file: 'alternatives/postproxy.mdx',
    phrases: ['Postproxy Webhook & Quota Trial'],
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
