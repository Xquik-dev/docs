import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const REQUIRED_OPERATIONAL_CONTENT = [
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
      '- Store `result.result?.id` or `tweetId` for the published Tweet ID.',
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
      '| Incomplete complete-mode run | `424 replies_incomplete` plus `diagnostic` |',
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
    file: 'api-reference/x/twitter-profile-lookup.mdx',
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
  {
    file: 'api-reference/x/bookmarks.mdx',
    snippets: [
      '### How Do I Export Twitter Bookmarks?',
      'Keep private folder names out of public logs.',
    ],
  },
  {
    file: 'api-reference/x/batch-tweets.mdx',
    snippets: [
      '| Batch lookup column | Response source | Reconciliation rule |',
      '| Zero affordable results | Stop on `402 insufficient_credits`',
    ],
  },
  {
    file: 'api-reference/x/download-media.mdx',
    snippets: [
      '| Manifest column | Response or request source | Reconciliation rule |',
      '- If `totalTweets` is below the valid input count, review skipped Tweet IDs.',
    ],
  },
  {
    file: 'api-reference/x/get-article.mdx',
    snippets: [
      '| Article archive column | Response source | Archive rule |',
      '| Article block | Text projection | Structured value to preserve |',
      '| Code | Code text | Language and formatting metadata |',
    ],
  },
  {
    file: 'api-reference/x-write/send-dm.mdx',
    snippets: [
      'Store `writeActionId`, recipient ID, account, request hash, and `messageId`.',
      '`422 x_dm_not_allowed` means this sender cannot message that person.',
      'Try another approved sender or ask the person to allow DMs.',
    ],
  },
  {
    file: 'api-reference/x-write/upload-media.mdx',
    snippets: [
      '| Upload receipt column | Request or response source | Handoff rule |',
      '| Media DM | `mediaId` | Exactly one item in `media_ids`',
    ],
  },
  {
    file: 'api-reference/x-write/follow.mdx',
    snippets: [
      'Store the target ID, acting account, action ID, and request hash.',
      'Close already-followed results without another request.',
    ],
  },
  {
    file: 'api-reference/x-write/unfollow.mdx',
    snippets: [
      'Store the returned action ID, request hash, and `statusUrl` immediately.',
      '[Remove Follower](/api-reference/x-write/remove-follower) ends one inbound relationship.',
    ],
  },
  {
    file: 'api-reference/x-write/like.mdx',
    snippets: [
      '| Like action column | Source | Engagement rule |',
      '| Already liked | Converged terminal result |',
    ],
  },
  {
    file: 'api-reference/x-write/unlike.mdx',
    snippets: [
      '| Unlike action column | Source | Removal rule |',
      'Close already-unliked actions without another request.',
    ],
  },
  {
    file: 'api-reference/x-write/retweet.mdx',
    snippets: [
      '| Repost action column | Source | Distribution rule |',
      '| Already reposted | Converged terminal result |',
      '| Publishing intent | API route | Required content |',
      'Use [Unretweet](/api-reference/x-write/unretweet) for an approved rollback.',
    ],
  },
  {
    file: 'api-reference/x-write/unretweet.mdx',
    snippets: [
      'Store the account, source Tweet ID, request hash, billing, and both action IDs.',
      'Close already-removed actions without another request.',
    ],
  },
  {
    file: 'api-reference/events/get.mdx',
    snippets: [
      '| Event detail column | Response source | Handoff rule |',
      '| Tweet ID | `xEventId` | Store the X tweet identifier separately. |',
    ],
  },
  {
    file: 'api-reference/events/list.mdx',
    snippets: [
      '| Event inventory column | Response source | Pagination rule |',
      '| Next page | `nextCursor` | Pass this value as the next `after` parameter. |',
    ],
  },
  {
    file: 'api-reference/monitors/create.mdx',
    snippets: [
      '| Created monitor column | Response source | Setup rule |',
      '| X user ID | `xUserId` | Use this stable ID for account joins. |',
    ],
  },
  {
    file: 'api-reference/monitors/delete-twitter-account-monitor.mdx',
    snippets: [
      '| Account monitor deletion check | Source | Completion rule |',
      '| Detail lookup | `GET /monitors/{id}` | Expect `404 not_found` after deletion. |',
    ],
  },
  {
    file: 'api-reference/monitors/get-keyword.mdx',
    snippets: [
      '| Keyword monitor column | Response source | Decision rule |',
      '| X search query | `query` | Compare the stored query with the intended search. |',
    ],
  },
  {
    file: 'api-reference/monitors/list.mdx',
    snippets: [
      '| Account monitor inventory column | Response source | Reconciliation rule |',
      '| X user ID | `monitors[].xUserId` | Use this stable ID for account joins. |',
    ],
  },
  {
    file: 'api-reference/monitors/list-keywords.mdx',
    snippets: [
      '| Keyword monitor inventory column | Response source | Reconciliation rule |',
      '| X search query | `monitors[].query` | Preserve the exact stored keyword expression. |',
    ],
  },
  {
    file: 'api-reference/monitors/twitter-account-monitor-status.mdx',
    snippets: [
      '| Account monitor status column | Response source | Decision rule |',
      '| X username | `username` | Confirm the intended tracked profile. |',
    ],
  },
  {
    file: 'api-reference/monitors/update.mdx',
    snippets: [
      '| Account monitor update column | Request or response source | Verification rule |',
      '| Webhook alignment | `GET /webhooks` | Match subscriptions before trusting alerts. |',
    ],
  },
  {
    file: 'api-reference/monitors/update-keyword.mdx',
    snippets: [
      '| Keyword monitor update column | Request or response source | Verification rule |',
      '| X search query | Response `query` | Confirm the immutable query stayed unchanged. |',
    ],
  },
  {
    file: 'api-reference/webhooks/deliveries.mdx',
    snippets: [
      '| Webhook delivery incident column | Response source | Triage rule |',
      '| Monitor event ID | `deliveries[].streamEventId` | Join the delivery to `GET /events/{id}`. |',
    ],
  },
  {
    file: 'api-reference/webhooks/list.mdx',
    snippets: [
      '| Webhook inventory column | Response source | Reconciliation rule |',
      '| Receiver URL | `webhooks[].url` | Confirm the intended HTTPS destination. |',
    ],
  },
  {
    file: 'api-reference/api-keys/create.mdx',
    snippets: [
      '| API key receipt column | Response source | Storage rule |',
      '| Full API key | `fullKey` | Store it once in an approved secret manager. |',
    ],
  },
  {
    file: 'api-reference/credits/quick-topup.mdx',
    snippets: [
      '| Credit top-up outcome | Response fields | Next action |',
      '| Immediate charge | `outcome: "charged"` | Store `credits` and the updated `balance`. |',
    ],
  },
  {
    file: 'api-reference/drafts/create.mdx',
    snippets: [
      '| Tweet draft column | Request or response source | Publishing rule |',
      '| Published tweet ID | None | Create a tweet separately after approval. |',
    ],
  },
  {
    file: 'api-reference/draws/create.mdx',
    snippets: [
      '| Giveaway draw column | Request or response source | Audit rule |',
      '| Backup state | `winners[].isBackup` | Separate primary and backup winners. |',
    ],
  },
  {
    file: 'api-reference/extractions/twitter-extraction-results.mdx',
    snippets: [
      '| Extraction result page column | Response source | Export rule |',
      '| X user ID | `results[].xUserId` | Preserve the stable profile join. |',
    ],
  },
  {
    file: 'api-reference/extractions/twitter-scraping-job-history.mdx',
    snippets: [
      '| Scraping job inventory column | Response source | Reconciliation rule |',
      '| Extracted rows | `extractions[].totalResults` | Compare this count with saved result pages. |',
    ],
  },
  {
    file: 'api-reference/styles/save.mdx',
    snippets: [
      '| Tweet style profile column | Request or response source | Reuse rule |',
      '| Source tweets | Request `tweets[].text` | Review every supplied post before saving. |',
    ],
  },
  {
    file: 'api-reference/support/create.mdx',
    snippets: [
      '| Support ticket receipt column | Request or response source | Handoff rule |',
      '| Ticket ID | Response `publicId` | Use this ID for status and reply requests. |',
    ],
  },
  {
    file: 'api-reference/support/get.mdx',
    snippets: [
      '| Support ticket history column | Response source | Review rule |',
      '| Message author | `messages[].sender` | Separate user and support replies. |',
    ],
  },
  {
    file: 'api-reference/trends/list.mdx',
    snippets: [
      '| Regional trend column | Response source | Monitoring rule |',
      '| Search query | `trends[].query` | Pass this value to tweet search. |',
    ],
  },
  {
    file: 'api-reference/webhooks/resume.mdx',
    snippets: [
      '| Webhook resume check | Response source | Recovery rule |',
      '| Delivery state | `webhook.deliveryStatus` | Expect `active` after recovery. |',
    ],
  },
  {
    file: 'api-reference/webhooks/update.mdx',
    snippets: [
      '| Webhook update column | Request or response source | Verification rule |',
      '| Receiver URL | Request and response `url` | Confirm the intended HTTPS endpoint. |',
    ],
  },
  {
    file: 'api-reference/radar/list.mdx',
    snippets: [
      '| Radar monitoring column | Response source | Queue rule |',
      '| Trend score | `items[].score` | Sort higher-scoring items first. |',
    ],
  },
  {
    file: 'api-reference/x-accounts/connect.mdx',
    snippets: [
      '| X account connection result | Response source | Next step |',
      '| Email challenge | `id` from `202 requires_email_code` | Submit the matching email code before expiry. |',
    ],
  },
  {
    file: 'api-reference/x-accounts/reauth.mdx',
    snippets: [
      '| X account recovery column | Request or response source | Recovery rule |',
      '| Replacement TOTP key | Request `totp_secret` | Send the base32 key, never a 6-digit code. |',
    ],
  },
  {
    file: 'api-reference/x-write/create-community.mdx',
    snippets: [
      '| Community creation record | Request or response source | Completion rule |',
      '| Community ID | Response `communityId` | Store the confirmed new community ID. |',
    ],
  },
  {
    file: 'api-reference/x-write/delete-community.mdx',
    snippets: [
      '| Community deletion record | Request or response source | Completion rule |',
      '| Community name | Request `community_name` | Require the confirmation safeguard. |',
      '| Community archive | API route | Required checkpoint |',
      '## Verify Permanent Community Deletion',
    ],
  },
  {
    file: 'api-reference/x-write/delete-tweet.mdx',
    snippets: [
      '## Save Tweet Deletion Evidence',
      '- Store `targetId` for the confirmed Tweet ID.',
      '| Cleanup intent | API route | What changes |',
      '## Run Bulk or Scheduled Tweet Cleanup',
      '## Verify Tweet Deletion',
    ],
  },
  {
    file: 'api-reference/x-write/join-community.mdx',
    snippets: [
      '| Community join record | Request or response source | Membership rule |',
      '| Posting permission | Separate approval | Never infer permission from membership. |',
    ],
  },
  {
    file: 'api-reference/x-write/leave-community.mdx',
    snippets: [
      '| Community departure record | Request or response source | Membership rule |',
      '| Idempotency key | Request header | Never reuse the earlier join key. |',
      '## How to Leave a Twitter Community Through the API',
      '| Membership task | Correct route | Expected result |',
    ],
  },
  {
    file: 'api-reference/x-write/remove-follower.mdx',
    snippets: [
      'Store each returned action ID beside its target follower ID.',
      'This endpoint lets you remove a follower without blocking them.',
    ],
  },
  {
    file: 'api-reference/x-write/update-avatar.mdx',
    snippets: [
      '| Profile avatar update column | Request or response source | Review rule |',
      '| Uploaded file | Request `file` | Accept JPEG or PNG up to 700 KB. |',
    ],
  },
  {
    file: 'api-reference/x-write/update-banner.mdx',
    snippets: [
      '| Profile banner update column | Request or response source | Review rule |',
      '| Uploaded file | Request `file` | Accept JPEG or PNG up to 2 MB. |',
    ],
  },
  {
    file: 'api-reference/x-write/update-profile.mdx',
    snippets: [
      '| X profile text update column | Request or response source | Review rule |',
      '| Changed fields | Exact request keys | Leave unrelated profile fields absent. |',
    ],
  },
  {
    file: 'guides/extraction-workflow.mdx',
    snippets: [
      '| Extraction stage | Exact API call | Durable checkpoint |',
      '| Retrieve rows | `GET /extractions/{id}` | `nextCursor` while `hasMore` is true |',
    ],
  },
  {
    file: 'guides/rate-limits.mdx',
    snippets: [
      '| Rate-limit signal | Meaning | Client action |',
      '| `Retry-After` header | The account hit a server-enforced limit. | Pause for the supplied duration before retrying. |',
    ],
  },
  {
    file: 'guides/x-api-typescript-types.mdx',
    snippets: [
      '| Contract area | Curated types | Route use |',
      '| Extractions | `Extraction`, `ExtractionResultPage` | Run follower or reply exports and retrieve saved rows. |',
    ],
  },
  {
    file: 'mcp/tools.mdx',
    snippets: [
      '| Agent task | MCP call | Durable output |',
      "| Search tweets | `xquik.request('/api/v1/x/tweets/search')` | Preserve tweet IDs, authors, timestamps, and `next_cursor`. |",
    ],
  },
  {
    file: 'sdks/csharp-x-api-sdk.mdx',
    snippets: [
      '| C# worker task | SDK call | Durable checkpoint |',
      '| Start an extraction | `client.Extractions.Run` | Save `job.ID` immediately. |',
    ],
  },
  {
    file: 'sdks/go.mdx',
    snippets: [
      '| Go task | SDK call | Save |',
      '| Export followers | `client.Extractions.Run` | `job.ID` |',
    ],
  },
  {
    file: 'sdks/java.mdx',
    snippets: [
      '| Java worker task | SDK call | Durable checkpoint |',
      '| Start an extraction | `client.extractions().run` | Save `job.id()` immediately. |',
    ],
  },
  {
    file: 'sdks/kotlin.mdx',
    snippets: [
      '| Kotlin task | SDK call | Save |',
      '| Retrieve saved rows | `client.extractions().retrieve` | Keep `nextCursor()` while `hasMore()` is true. |',
    ],
  },
  {
    file: 'sdks/php.mdx',
    snippets: [
      '| PHP task | SDK call | Save |',
      '| Export followers | `$client->extractions->run()` | `$job->id` |',
    ],
  },
  {
    file: 'sdks/python.mdx',
    snippets: [
      '| Python task | SDK call | Save |',
      '| Export followers | `client.extractions.run` | `job.id` |',
    ],
  },
  {
    file: 'sdks/ruby.mdx',
    snippets: [
      '| Ruby task | SDK call | Save |',
      '| Export followers | `client.extractions.run` | `job.id` |',
    ],
  },
  {
    file: 'sdks/typescript.mdx',
    snippets: [
      '| TypeScript task | SDK call | Save |',
      '| Export followers | `client.extractions.run` | `job.id` |',
    ],
  },
  {
    file: 'webhooks/verification.mdx',
    snippets: [
      '| Verification checkpoint | Exact source | Reject when |',
      '| Monitor event | `streamEventId` | The receiver already processed this monitor event. |',
    ],
  },
  {
    file: 'x-api-quickstart.mdx',
    snippets: [
      '| Integration step | Exact API call | Save for the next step |',
      '| Monitor tweets and replies | `POST /monitors` | Monitor `id`, `username`, `eventTypes`, and `enabled` |',
    ],
  },
] as const;

const REQUIRED_OVERVIEW_KEYWORDS = [
  'tweet scraping API',
  'follower scraping API',
  'tweet reply scraping',
  'Twitter webhook API',
] as const;

const REQUIRED_CHANGELOG_CONTENT = [
  'title: "Xquik Changelog: Twitter API & Scraper Updates"',
  'Xquik documentation updates',
  'Xquik changelog',
  'API keys',
  'signed webhook',
  'Search tweets',
  'user profile',
] as const;

const REQUIRED_COMMUNITY_TIMELINE_CONTENT = [
  'community timeline export',
  'Twitter community scraping guide',
] as const;

const REQUIRED_QUICK_TOPUP_CONTENT = [
  'title: "Twitter API Billing: Instant X API Credit Top-up"',
  'X API credits',
  'Twitter API billing',
] as const;

const REQUIRED_APIFY_COMPARISON_CONTENT = [
  'Xquik vs Apify Twitter scraper',
  'Apify alternative',
  'Use this guide to compare Apify, Xquik, and Xquik\'s Apify Actors.',
  'Export table-like dataset',
  'Each Actor accepts structured JSON input.',
  'The running docs describe this Apify flow.',
  'The dataset docs define each run\'s default dataset as append-only storage.',
  'Apify\'s Store API docs say `/v2/store` lists public Actors.',
  'Match reply rows against',
  'Use full or raw output modes for optional profile metadata',
  'The row uses `resultType: "diagnostic"`.',
  'For account backfills, pass a Search Terms value.',
  'Before production use, open the current Actor page.',
] as const;

describe('operational content structure', (): void => {
  it('keeps audited API pages specific and structurally useful', (): void => {
    expect.assertions(1);

    const findings: string[] = [];

    for (const requirement of REQUIRED_OPERATIONAL_CONTENT) {
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

describe('API overview search intent', (): void => {
  it('keeps the broad scraper and webhook workflows explicit', (): void => {
    expect.assertions(1);

    const source = readFileSync('api-reference/overview.mdx', 'utf8').replace(
      /\s+/g,
      ' ',
    );
    const missing = REQUIRED_OVERVIEW_KEYWORDS.filter(
      (keyword) => !source.includes(keyword),
    );

    expect(missing).toStrictEqual([]);
  });
});

describe('changelog search intent', (): void => {
  it('keeps the release history specific to Xquik API changes', (): void => {
    expect.assertions(1);

    const source = readFileSync('changelog.mdx', 'utf8').replace(/\s+/g, ' ');
    const missing = REQUIRED_CHANGELOG_CONTENT.filter(
      (requirement) => !source.includes(requirement),
    );

    expect(missing).toStrictEqual([]);
  });
});

describe('community timeline search intent', (): void => {
  it('keeps community tweet exports distinct from keyword search', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/x/community-tweets.mdx',
      'utf8',
    ).replace(/\s+/g, ' ');
    const missing = REQUIRED_COMMUNITY_TIMELINE_CONTENT.filter(
      (requirement) => !source.includes(requirement),
    );

    expect(missing).toStrictEqual([]);
  });
});

describe('quick top-up search intent', (): void => {
  it('keeps API credit funding distinct from hosted checkout', (): void => {
    expect.assertions(1);

    const source = readFileSync(
      'api-reference/credits/quick-topup.mdx',
      'utf8',
    ).replace(/\s+/g, ' ');
    const missing = REQUIRED_QUICK_TOPUP_CONTENT.filter(
      (requirement) => !source.includes(requirement),
    );

    expect(missing).toStrictEqual([]);
  });
});

describe('Apify comparison search intent', (): void => {
  it('keeps the comparison focused on tweet and follower jobs', (): void => {
    expect.assertions(1);

    const source = readFileSync('alternatives/apify.mdx', 'utf8').replace(
      /\s+/g,
      ' ',
    );
    const missing = REQUIRED_APIFY_COMPARISON_CONTENT.filter(
      (requirement) => !source.includes(requirement),
    );

    expect(missing).toStrictEqual([]);
  });
});
