import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface OpenApiSchema {
  readonly $ref?: string;
  readonly allOf?: readonly OpenApiSchema[];
  readonly maximum?: number;
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface OpenApiParameter {
  readonly $ref?: string;
  readonly name?: string;
  readonly schema?: OpenApiSchema;
}

interface OpenApiDocument {
  readonly components?: Readonly<{
    readonly parameters?: Readonly<Record<string, OpenApiParameter>>;
    readonly schemas?: Readonly<Record<string, OpenApiSchema>>;
  }>;
  readonly paths?: Readonly<
    Record<
      string,
      Readonly<{
        readonly get?: Readonly<{
          readonly description?: string;
          readonly parameters?: readonly OpenApiParameter[];
        }>;
      }>
    >
  >;
}

const PROJECT_ROOT = process.cwd();
const GUIDE = readFileSync(
  join(PROJECT_ROOT, 'guides/tweet-profile-api-fields.mdx'),
  'utf8',
);
const OPENAPI = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const MCP_TOOLS = readFileSync(join(PROJECT_ROOT, 'mcp/tools.mdx'), 'utf8');
const TWEET_REPLIES = readFileSync(
  join(PROJECT_ROOT, 'api-reference/x/tweet-replies.mdx'),
  'utf8',
);
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
  'communityId',
  'conversationControl',
  'grokShareAttachment',
  'jetfuelAttachment',
  'article',
  'card',
  'communityNote',
  'edit',
  'isTranslatable',
  'noteTweet',
  'place',
  'limitedActions',
  'postCta',
  'possiblySensitive',
  'previousCounts',
  'viewState',
  'scopes',
  'entities',
  'quoted_tweet',
  'quotedTweetId',
  'retweeted_tweet',
  'tombstone',
  'unmentionedUserIds',
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
  'accountBasedIn',
  'id',
  'username',
  'name',
  'description',
  'followers',
  'following',
  'grokTranslatedBio',
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
  'withheldScope',
  'possiblySensitive',
  'professional',
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
  'superFollowsUserProfileActive',
  'tipJar',
  'communityRole',
  'profile_bio',
] as const;

const MEDIA_FIELDS = [
  'adultContent',
  'mediaUrl',
  'type',
  'url',
  'allowDownload',
  'altText',
  'aspectRatio',
  'availabilityStatus',
  'availabilityReason',
  'description',
  'displayUrl',
  'durationMillis',
  'expandedUrl',
  'embeddable',
  'faceRects',
  'focusRects',
  'graphicViolence',
  'height',
  'id',
  'indices',
  'mediaKey',
  'grokPostId',
  'monetizable',
  'otherSensitiveContent',
  'sizes',
  'sourceStatusId',
  'sourceUserId',
  'tags',
  'title',
  'videoVariants',
  'visitSiteUrl',
  'watchNowUrl',
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

const PARSED_OPENAPI = parseOpenApi(OPENAPI);

function schemaFields(
  openApi: Readonly<OpenApiDocument>,
  name: string,
): readonly string[] {
  const schema = openApi.components?.schemas?.[name];
  if (schema === undefined) {
    throw new Error(`OpenAPI is missing schema ${name}.`);
  }
  return schemaFieldNames(openApi, schema);
}

function schemaFieldNames(
  openApi: Readonly<OpenApiDocument>,
  schema: Readonly<OpenApiSchema>,
): readonly string[] {
  const referencedName = schema.$ref?.split('/').at(-1);
  const resolved =
    referencedName === undefined
      ? schema
      : openApi.components?.schemas?.[referencedName];
  if (resolved === undefined) {
    throw new Error(`OpenAPI is missing schema ${referencedName}.`);
  }
  return [
    ...new Set([
      ...Object.keys(resolved.properties ?? {}),
      ...(resolved.allOf ?? []).flatMap((item) =>
        schemaFieldNames(openApi, item),
      ),
    ]),
  ].toSorted((left, right) => left.localeCompare(right));
}

function sortedFields(fields: readonly string[]): readonly string[] {
  return [...fields].toSorted((left, right) => left.localeCompare(right));
}

function parameterName(
  openApi: Readonly<OpenApiDocument>,
  parameter: Readonly<OpenApiParameter>,
): string | undefined {
  if (parameter.name !== undefined) return parameter.name;
  const componentName = parameter.$ref?.split('/').at(-1);
  return componentName === undefined
    ? undefined
    : openApi.components?.parameters?.[componentName]?.name;
}

describe('read data richness documentation', (): void => {
  it('documents every normalized field from the OpenAPI contract', (): void => {
    const fields = [...TWEET_FIELDS, ...PROFILE_FIELDS, ...MEDIA_FIELDS];
    expect.assertions(fields.length + 5);

    for (const field of fields) {
      expect(GUIDE, `guide omits ${field}`).toContain(`\`${field}\``);
    }
    expect(schemaFields(PARSED_OPENAPI, 'EmbeddedTweet')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(PARSED_OPENAPI, 'TweetDetail')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(PARSED_OPENAPI, 'SearchTweet')).toStrictEqual(
      sortedFields(TWEET_FIELDS),
    );
    expect(schemaFields(PARSED_OPENAPI, 'UserProfile')).toStrictEqual(
      sortedFields(PROFILE_FIELDS),
    );
    expect(schemaFields(PARSED_OPENAPI, 'TweetMedia')).toStrictEqual(
      sortedFields(MEDIA_FIELDS),
    );
  });

  it('keeps agent guidance and discovery links public', (): void => {
    expect.assertions(9);

    expect(MCP_TOOLS).toContain('preserves every safe field');
    expect(MCP_TOOLS).toContain('replies_incomplete');
    expect(MCP_TOOLS).toContain('mode=complete&limit=25000');
    expect(MCP_TOOLS).toContain('/guides/tweet-profile-api-fields');
    expect(GUIDE).toContain('Xquik omits unavailable optional fields');
    expect(GUIDE).toContain('coverage depends on X');
    expect(GUIDE).toContain(
      'Xquik removes account-specific actions, permissions, and relationships',
    );
    expect(DOCS_CONFIG).toContain('"guides/tweet-profile-api-fields"');
    expect(LLMS_INDEX).toContain(
      '/guides/tweet-profile-api-fields',
    );
  });

  it('documents visible reply coverage for every public interface', (): void => {
    expect.assertions(10);
    const operation = PARSED_OPENAPI.paths?.['/x/tweets/{id}/replies']?.get;
    const parameterNames = operation?.parameters?.flatMap((parameter) => {
      const name = parameterName(PARSED_OPENAPI, parameter);
      return name === undefined ? [] : [name];
    });
    const parameterRefs = operation?.parameters?.flatMap((parameter) =>
      parameter.$ref === undefined ? [] : [parameter.$ref],
    );

    expect(operation?.description).toContain('Complete mode');
    expect(operation?.description).toContain('80%');
    expect(parameterNames).toContain('cursor');
    expect(parameterNames).toEqual(expect.arrayContaining(['mode', 'limit']));
    expect(parameterRefs).toContain(
      '#/components/parameters/AutomaticTweetPageSize',
    );
    expect(GUIDE).toContain('mode=complete&limit=25000');
    expect(GUIDE).toContain('coveragePercentage');
    expect(MCP_TOOLS).toContain('mode=complete&limit=25000');
    expect(MCP_TOOLS).toContain('recommendedFallback');
    expect(TWEET_REPLIES).toContain('Trust `diagnostic.complete`');
  });
});
