import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const REQUIRED_OPERATIONAL_TABLES = [
  {
    file: 'api-reference/account/get.mdx',
    snippets: [
      '| Preflight question | Response field | Integration decision |',
      '| Credit balance | `creditInfo.balance` |',
    ],
  },
  {
    file: 'api-reference/x-write/create-tweet.mdx',
    snippets: [
      '| Post intent | Required fields | Validation before sending |',
      '| `result.id` or `tweetId` | Published Tweet ID |',
    ],
  },
  {
    file: 'api-reference/x/followers.mdx',
    snippets: [
      '| Follower tracker column | Source | Comparison rule |',
      '| Removed follower | Present only in the earlier complete snapshot |',
    ],
  },
  {
    file: 'api-reference/x/tweet-replies.mdx',
    snippets: [
      '| Reply column | Response source | Review use |',
      '| Partial coverage | `diagnostic` from `424 replies_incomplete` |',
    ],
  },
  {
    file: 'api-reference/x/timeline.mdx',
    snippets: [
      '| Home timeline column | Response source | Feed use |',
      '| No rule match | No approved condition matches |',
    ],
  },
  {
    file: 'api-reference/x/user-tweets.mdx',
    snippets: [
      '| Profile timeline column | Response source | Archive rule |',
      '| Profile posts and replies | `/x/users/{id}/tweets?includeReplies=true` |',
    ],
  },
  {
    file: 'api-reference/x/user-replies.mdx',
    snippets: [
      '| Profile reply column | Response source | Archive rule |',
      '| Replies under one tweet | `/x/tweets/{id}/replies` |',
    ],
  },
  {
    file: 'api-reference/x/user-mentions.mdx',
    snippets: [
      '| Mention queue column | Response source | Triage use |',
      '| No approved rule | No explicit rule matches |',
    ],
  },
  {
    file: 'api-reference/x/user-likes.mdx',
    snippets: [
      '| Liked-tweet library column | Response source | Library rule |',
      '| No longer observed | Present only in the earlier complete snapshot |',
    ],
  },
  {
    file: 'api-reference/x/user-media.mdx',
    snippets: [
      '| Media inventory column | Response source | Asset rule |',
      '| Failed selected download | Tweet ID, media URL, and failure state |',
    ],
  },
  {
    file: 'api-reference/x/get-user.mdx',
    snippets: [
      '| Profile column | Response field | CRM or warehouse rule |',
      '| Follower export | `id` | `/x/users/{id}/followers` |',
    ],
  },
  {
    file: 'api-reference/x/get-tweet.mdx',
    snippets: [
      '| Tweet record column | Response source | Handoff rule |',
      '| `content_disclosure` | `tweet.contentDisclosure` |',
    ],
  },
] as const;

describe('operational content tables', (): void => {
  it('keeps audited API pages specific and structurally useful', (): void => {
    expect.assertions(1);

    const findings: string[] = [];

    for (const requirement of REQUIRED_OPERATIONAL_TABLES) {
      const source = readFileSync(requirement.file, 'utf8');

      for (const snippet of requirement.snippets) {
        if (!source.includes(snippet)) {
          findings.push(`${requirement.file} is missing ${snippet}`);
        }
      }
    }

    expect(findings).toStrictEqual([]);
  });
});
