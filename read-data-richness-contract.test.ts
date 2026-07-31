import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

interface OpenApiSchema {
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface OpenApiDocument {
  readonly components?: Readonly<{
    readonly schemas?: Readonly<Record<string, OpenApiSchema>>;
  }>;
}

const PROJECT_ROOT = process.cwd();
const GUIDE = readFileSync(
  join(PROJECT_ROOT, 'guides/tweet-profile-api-fields.mdx'),
  'utf8',
);
const OPENAPI = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const MCP_TOOLS = readFileSync(join(PROJECT_ROOT, 'mcp/tools.mdx'), 'utf8');
const DOCS_CONFIG = readFileSync(join(PROJECT_ROOT, 'docs.json'), 'utf8');
const LLMS_INDEX = readFileSync(join(PROJECT_ROOT, 'llms.txt'), 'utf8');

const TWEET_FIELDS = [
  'id',
  'text',
  'createdAt',
  'isNoteTweet',
  'isReply',
  'isLimitedReply',
  'isQuoteStatus',
  'conversationId',
  'source',
  'type',
  'url',
  'lang',
  'inReplyToId',
  'inReplyToUserId',
  'inReplyToUsername',
  'displayTextRange',
  'contentDisclosure',
  'article',
  'card',
  'communityNote',
  'edit',
  'isTranslatable',
  'noteTweet',
  'place',
  'possiblySensitive',
  'previousCounts',
  'viewState',
  'entities',
  'quoted_tweet',
  'retweeted_tweet',
  'author',
  'media',
  'retweetCount',
  'replyCount',
  'likeCount',
  'quoteCount',
  'viewCount',
  'bookmarkCount',
] as const;

const PROFILE_FIELDS = [
  'id',
  'username',
  'name',
  'description',
  'followers',
  'following',
  'verified',
  'isBlueVerified',
  'isVerified',
  'profilePicture',
  'coverPicture',
  'profileBannerUrl',
  'location',
  'createdAt',
  'statusesCount',
  'mediaCount',
  'protected',
  'url',
  'favouritesCount',
  'hasCustomTimelines',
  'isTranslator',
  'withheldInCountries',
  'possiblySensitive',
  'pinnedTweetIds',
  'isAutomated',
  'automatedBy',
  'unavailable',
  'unavailableReason',
  'verifiedType',
  'affiliatesHighlightedLabel',
  'businessAccountAffiliatesCount',
  'creatorSubscriptionsCount',
  'hasGraduatedAccess',
  'hasHiddenSubscriptionsOnProfile',
  'highlightsInfo',
  'identityVerification',
  'isProfileTranslatable',
  'parodyCommentaryFanLabel',
  'profileDescriptionLanguage',
  'profileImageShape',
  'profileInterstitialType',
  'profileSortEnabled',
  'profileTranslatorType',
  'superFollowEligible',
  'communityRole',
  'profile_bio',
] as const;

const MEDIA_FIELDS = [
  'mediaUrl',
  'type',
  'url',
  'allowDownload',
  'altText',
  'aspectRatio',
  'availabilityStatus',
  'displayUrl',
  'durationMillis',
  'expandedUrl',
  'faceRects',
  'focusRects',
  'height',
  'id',
  'indices',
  'mediaKey',
  'monetizable',
  'sizes',
  'videoVariants',
  'width',
] as const;

function parseOpenApi(source: string): OpenApiDocument {
  const bun = globalThis as {
    readonly Bun?: { readonly YAML?: { parse: (yaml: string) => unknown } };
  };
  const parse = bun.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error('Bun.YAML.parse is required for OpenAPI docs tests.');
  }
  return parse(source) as OpenApiDocument;
}

function schemaFields(
  openApi: Readonly<OpenApiDocument>,
  name: string,
): readonly string[] {
  const schema = openApi.components?.schemas?.[name];
  if (schema === undefined) {
    throw new Error(`OpenAPI is missing schema ${name}.`);
  }
  return Object.keys(schema.properties ?? {}).toSorted((left, right) =>
    left.localeCompare(right),
  );
}

function sortedFields(fields: readonly string[]): readonly string[] {
  return [...fields].toSorted((left, right) => left.localeCompare(right));
}

describe('read data richness documentation', (): void => {
  it('documents every normalized field from the OpenAPI contract', (): void => {
    const fields = [...TWEET_FIELDS, ...PROFILE_FIELDS, ...MEDIA_FIELDS];
    const openApi = parseOpenApi(OPENAPI);
    expect.assertions(fields.length + 5);

    for (const field of fields) {
      expect(GUIDE, `guide omits ${field}`).toContain(`\`${field}\``);
    }
    expect(schemaFields(openApi, 'EmbeddedTweet')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(openApi, 'TweetDetail')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(openApi, 'SearchTweet')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(openApi, 'UserProfile')).toStrictEqual(
      sortedFields(PROFILE_FIELDS),
    );
    expect(schemaFields(openApi, 'TweetMedia')).toStrictEqual(
      sortedFields(MEDIA_FIELDS),
    );
  });

  it('keeps agent guidance and discovery links public', (): void => {
    expect.assertions(9);

    expect(MCP_TOOLS).toContain('preserves every safe field');
    expect(MCP_TOOLS).toContain('replies_incomplete');
    expect(MCP_TOOLS).toContain('conversation_id:<tweet_id>');
    expect(MCP_TOOLS).toContain('/guides/tweet-profile-api-fields');
    expect(GUIDE).toContain('Xquik omits unavailable optional fields');
    expect(GUIDE).toContain('coverage depends on X');
    expect(GUIDE).toContain("omit the fetching account's private action");
    expect(DOCS_CONFIG).toContain('"guides/tweet-profile-api-fields"');
    expect(LLMS_INDEX).toContain(
      'https://docs.xquik.com/guides/tweet-profile-api-fields',
    );
  });
});
