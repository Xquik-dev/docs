import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const DOCS_OPENAPI_PATH = join(PROJECT_ROOT, 'openapi.yaml');
const PRODUCT_ROUTE_HELPERS_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/route-helpers.ts',
);
const PRODUCT_NOTIFICATIONS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/notifications/route.ts',
);
const PRODUCT_BOOKMARK_FOLDERS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/bookmarks/folders/route.ts',
);
const PRODUCT_X_TRENDS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/trends/route.ts',
);
const PRODUCT_DM_HISTORY_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/dm/[userId]/history/route.ts',
);
const PRODUCT_FOLLOW_CHECK_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/followers/check/route.ts',
);
const PRODUCT_TRENDS_API_PATH = join(PRODUCT_ROOT, 'lib/api/trends.ts');
const PRODUCT_ARTICLE_FORMAT_PATH = join(
  PRODUCT_ROOT,
  'lib/x-api/article-format.ts',
);
const PRODUCT_MEDIA_HANDLER_PATH = join(PRODUCT_ROOT, 'lib/media/handler.ts');
const PRODUCT_X_API_TYPES_PATH = join(PRODUCT_ROOT, 'lib/x-api/types.ts');

interface OpenApiSpec {
  readonly components?: {
    readonly schemas?: Record<string, OpenApiSchema>;
  };
  readonly paths?: Record<string, Record<string, OpenApiOperation>>;
}

interface OpenApiMediaType {
  readonly schema?: OpenApiSchema;
}

interface OpenApiOperation {
  readonly responses?: Record<string, OpenApiResponse>;
}

interface OpenApiResponse {
  readonly content?: Record<string, OpenApiMediaType>;
}

interface OpenApiSchema {
  readonly $ref?: string;
  readonly items?: OpenApiSchema;
  readonly properties?: Record<string, OpenApiSchema>;
}

interface PageContract {
  readonly allowedFields: readonly string[];
  readonly page: string;
  readonly requiredFields: readonly string[];
}

const PAGINATED_TWEET_PAGES = [
  'api-reference/x/batch-tweets.mdx',
  'api-reference/x/search-tweets.mdx',
  'api-reference/x/user-tweets.mdx',
  'api-reference/x/user-likes.mdx',
  'api-reference/x/user-media.mdx',
  'api-reference/x/bookmarks.mdx',
  'api-reference/x/timeline.mdx',
  'api-reference/x/tweet-quotes.mdx',
  'api-reference/x/tweet-replies.mdx',
  'api-reference/x/tweet-thread.mdx',
  'api-reference/x/list-tweets.mdx',
  'api-reference/x/community-tweets.mdx',
  'api-reference/x/community-search.mdx',
  'api-reference/x/search-community-tweets.mdx',
  'api-reference/x/user-mentions.mdx',
] as const;

const PAGINATED_USER_PAGES = [
  'api-reference/x/followers.mdx',
  'api-reference/x/following.mdx',
  'api-reference/x/followers-you-know.mdx',
  'api-reference/x/verified-followers.mdx',
  'api-reference/x/list-followers.mdx',
  'api-reference/x/list-members.mdx',
  'api-reference/x/community-members.mdx',
  'api-reference/x/community-moderators.mdx',
  'api-reference/x/retweeters.mdx',
  'api-reference/x/favoriters.mdx',
  'api-reference/x/search-users.mdx',
  'api-reference/x/batch-users.mdx',
] as const;

const NOTIFICATION_PAGE = 'api-reference/x/notifications.mdx';
const COMMUNITY_INFO_PAGE = 'api-reference/x/community-info.mdx';
const MEDIA_DOWNLOAD_PAGE = 'api-reference/x/download-media.mdx';
const BOOKMARK_FOLDERS_PAGE = 'api-reference/x/bookmark-folders.mdx';
const X_TRENDS_PAGE = 'api-reference/x/trends.mdx';
const FOLLOW_CHECK_PAGE = 'api-reference/x/check-follower.mdx';
const ARTICLE_PAGE = 'api-reference/x/get-article.mdx';
const DM_HISTORY_PAGE = 'api-reference/x/dm-history.mdx';

function parseYaml(source: string): OpenApiSpec {
  const bun = globalThis as {
    readonly Bun?: { readonly YAML?: { parse: (yaml: string) => unknown } };
  };
  const parse = bun.Bun?.YAML?.parse;
  if (parse === undefined) {
    throw new Error('Bun.YAML.parse is required for OpenAPI docs tests.');
  }
  return parse(source) as OpenApiSpec;
}

function readOpenApi(): OpenApiSpec {
  return parseYaml(readFileSync(DOCS_OPENAPI_PATH, 'utf8'));
}

function schemaByName(spec: OpenApiSpec, name: string): OpenApiSchema {
  const schema = spec.components?.schemas?.[name];
  if (schema === undefined) {
    throw new Error(`Missing OpenAPI schema: ${name}`);
  }
  return schema;
}

function resolveSchema(spec: OpenApiSpec, schema: OpenApiSchema): OpenApiSchema {
  if (schema.$ref === undefined) {
    return schema;
  }
  const name = schema.$ref.replace('#/components/schemas/', '');
  return schemaByName(spec, name);
}

function schemaPropertyNames(spec: OpenApiSpec, name: string): readonly string[] {
  const schema = resolveSchema(spec, schemaByName(spec, name));
  return Object.keys(schema.properties ?? {}).sort((left, right): number =>
    left.localeCompare(right),
  );
}

function propertyNames(schema: OpenApiSchema | undefined): readonly string[] {
  return Object.keys(schema?.properties ?? {}).sort((left, right): number =>
    left.localeCompare(right),
  );
}

function schemaProperty(
  spec: OpenApiSpec,
  schemaName: string,
  property: string,
): OpenApiSchema | undefined {
  return resolveSchema(spec, schemaByName(spec, schemaName)).properties?.[
    property
  ];
}

function itemPropertyNames(
  spec: OpenApiSpec,
  schemaName: string,
  property: string,
): readonly string[] {
  const schema = schemaProperty(spec, schemaName, property);
  return propertyNames(resolveSchema(spec, schema?.items ?? {}));
}

function responseSchema(
  spec: OpenApiSpec,
  path: string,
  method: string,
): OpenApiSchema {
  const schema =
    spec.paths?.[path]?.[method]?.responses?.['200']?.content?.[
      'application/json'
    ]?.schema;
  if (schema === undefined) {
    throw new Error(`Missing 200 JSON response schema: ${method} ${path}`);
  }
  return resolveSchema(spec, schema);
}

function itemPropertyNamesFromProperty(
  spec: OpenApiSpec,
  schema: OpenApiSchema,
  property: string,
): readonly string[] {
  const itemSchema = schema.properties?.[property]?.items ?? {};
  return propertyNames(resolveSchema(spec, itemSchema));
}

function uniqueSorted(fields: readonly string[]): readonly string[] {
  return [...new Set(fields)].sort((left, right): number =>
    left.localeCompare(right),
  );
}

function responseFields(page: string): readonly string[] {
  const source = readFileSync(join(PROJECT_ROOT, page), 'utf8');
  return uniqueSorted(
    [...source.matchAll(/<ResponseField\s+name="(?<field>[^"]+)"/gu)].map(
      (match): string => match.groups?.['field'] ?? '',
    ),
  ).filter((field): boolean => field.length > 0);
}

function setDifference(
  actual: readonly string[],
  expected: readonly string[],
): readonly string[] {
  const expectedSet = new Set(expected);
  return actual.filter((field): boolean => !expectedSet.has(field));
}

function mapFunctionBody(source: string, functionName: string): string {
  const start = source.indexOf(`function ${functionName}`);
  if (start < 0) {
    throw new Error(`Missing product mapper: ${functionName}`);
  }
  const end = source.indexOf('\n}\n\n', start);
  if (end < 0) {
    throw new Error(`Could not locate product mapper end: ${functionName}`);
  }
  return source.slice(start, end);
}

function productMapperFields(functionName: string): readonly string[] {
  const source = readFileSync(PRODUCT_ROUTE_HELPERS_PATH, 'utf8');
  const body = mapFunctionBody(source, functionName);
  const directFields = [...body.matchAll(/^\s{4}(?<field>[A-Za-z_]\w*):/gmu)]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  const optionalFields = [
    ...body.matchAll(/optionalField\(\s*'(?<field>[^']+)'/gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  return uniqueSorted([...directFields, ...optionalFields]);
}

function objectLiteralPropertyFields(source: string): readonly string[] {
  return uniqueSorted(
    [...source.matchAll(/[{,]\s*(?<field>[A-Za-z_]\w*)\s*:/gu)]
      .map((match): string => match.groups?.['field'] ?? '')
      .filter((field): boolean => field.length > 0),
  );
}

function productReturnFieldsFromPath(
  path: string,
  functionName: string,
): readonly string[] {
  const source = readFileSync(path, 'utf8');
  const body = mapFunctionBody(source, functionName);
  const start = body.indexOf('return {');
  const end = body.indexOf('};', start);
  if (start < 0 || end < 0) {
    throw new Error(`Could not locate return object: ${functionName}`);
  }
  return objectLiteralPropertyFields(body.slice(start, end + 1));
}

function productNotificationFields(): readonly string[] {
  const source = readFileSync(PRODUCT_NOTIFICATIONS_ROUTE_PATH, 'utf8');
  const start = source.indexOf('notifications: result.items.map');
  const end = source.indexOf('has_next_page:', start);
  if (start < 0 || end < 0) {
    throw new Error('Could not locate notification response mapper.');
  }
  const body = source.slice(start, end);
  const directFields = [...body.matchAll(/^\s{10}(?<field>[A-Za-z_]\w*):/gmu)]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  const optionalFields = [
    ...body.matchAll(/\{\s*(?<field>[A-Za-z_]\w*):\s*n\./gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  return uniqueSorted([...directFields, ...optionalFields]);
}

function productInterfaceFieldsFromPath(
  path: string,
  interfaceName: string,
): readonly string[] {
  const source = readFileSync(path, 'utf8');
  const start = source.indexOf(`interface ${interfaceName} {`);
  if (start < 0) {
    throw new Error(`Missing product interface: ${interfaceName}`);
  }
  const end = source.indexOf('\n}\n', start);
  if (end < 0) {
    throw new Error(`Could not locate product interface end: ${interfaceName}`);
  }
  const body = source.slice(start, end);
  return uniqueSorted(
    [...body.matchAll(/^\s{2}readonly (?<field>[A-Za-z_]\w*)\??:/gmu)].map(
      (match): string => match.groups?.['field'] ?? '',
    ),
  );
}

function productInterfaceFields(interfaceName: string): readonly string[] {
  return productInterfaceFieldsFromPath(PRODUCT_X_API_TYPES_PATH, interfaceName);
}

function objectLiteralFields(source: string): readonly string[] {
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0) {
    return [];
  }
  const bodyEnd = end < 0 ? source.length : end;
  return uniqueSorted(
    [
      ...source
        .slice(start + 1, bodyEnd)
        .matchAll(/(?:^|,)\s*(?<field>[A-Za-z_]\w*)\s*(?=[:},]|$)/gu),
    ]
      .map((match): string => match.groups?.['field'] ?? '')
      .filter((field): boolean => field.length > 0),
  );
}

function productMediaDownloadFields(): readonly string[] {
  const source = readFileSync(PRODUCT_MEDIA_HANDLER_PATH, 'utf8');
  const singleStart = source.indexOf(
    'return NextResponse.json({ cacheHit: !outcome.fresh, galleryUrl, tweetId });',
  );
  const bulkStart = source.indexOf('return NextResponse.json({\n    galleryUrl,');
  if (singleStart < 0 || bulkStart < 0) {
    throw new Error('Could not locate media download success responses.');
  }
  const singleEnd = source.indexOf(');', singleStart);
  const bulkEnd = source.indexOf('});', bulkStart);
  return uniqueSorted([
    ...objectLiteralFields(source.slice(singleStart, singleEnd)),
    ...objectLiteralFields(source.slice(bulkStart, bulkEnd)),
  ]);
}

function productBookmarkFolderFields(): readonly string[] {
  const source = readFileSync(PRODUCT_BOOKMARK_FOLDERS_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf('return NextResponse.json({');
  if (responseStart < 0) {
    throw new Error('Could not locate bookmark folder success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  const responseBody = source.slice(responseStart, responseEnd + 1);
  const folderStart = responseBody.indexOf('=> ({');
  const folderEnd = responseBody.indexOf('}))', folderStart);
  return uniqueSorted([
    ...objectLiteralFields(responseBody),
    ...objectLiteralFields(responseBody.slice(folderStart, folderEnd)),
  ]);
}

function productXTrendsFields(): readonly string[] {
  const source = readFileSync(PRODUCT_X_TRENDS_ROUTE_PATH, 'utf8');
  if (source.includes('function buildTrendsResponse')) {
    return uniqueSorted([
      'woeid',
      ...productReturnFieldsFromPath(
        PRODUCT_X_TRENDS_ROUTE_PATH,
        'buildTrendsResponse',
      ),
      ...productInterfaceFieldsFromPath(PRODUCT_TRENDS_API_PATH, 'TrendItem'),
    ]);
  }
  const responseStart = source.indexOf('return NextResponse.json({');
  if (responseStart < 0) {
    throw new Error('Could not locate X trends success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  return uniqueSorted([
    ...objectLiteralFields(source.slice(responseStart, responseEnd + 1)),
    ...productInterfaceFieldsFromPath(PRODUCT_TRENDS_API_PATH, 'TrendItem'),
  ]);
}

function productFollowCheckFields(): readonly string[] {
  const source = readFileSync(PRODUCT_FOLLOW_CHECK_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf(
    'return NextResponse.json({\n        isFollowing:',
  );
  if (responseStart < 0) {
    throw new Error('Could not locate follow check success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  return objectLiteralFields(source.slice(responseStart, responseEnd + 1));
}

function productDmHistoryFields(): readonly string[] {
  const source = readFileSync(PRODUCT_DM_HISTORY_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf('return NextResponse.json({');
  if (responseStart < 0) {
    throw new Error('Could not locate DM history success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  return uniqueSorted([
    ...objectLiteralFields(source.slice(responseStart, responseEnd + 1)),
    ...productReturnFieldsFromPath(PRODUCT_DM_HISTORY_ROUTE_PATH, 'mapMessage'),
  ]);
}

function pageContracts(spec: OpenApiSpec): readonly PageContract[] {
  const paginatedTweets = schemaPropertyNames(spec, 'PaginatedTweets');
  const paginatedUsers = schemaPropertyNames(spec, 'PaginatedUsers');
  const searchTweet = schemaPropertyNames(spec, 'SearchTweet');
  const userProfile = schemaPropertyNames(spec, 'UserProfile');
  const tweetDetail = schemaPropertyNames(spec, 'TweetDetail');
  const tweetAuthor = schemaPropertyNames(spec, 'TweetAuthor');
  const searchTweetMedia = itemPropertyNames(spec, 'SearchTweet', 'media');
  const tweetDetailMedia = itemPropertyNames(spec, 'TweetDetail', 'media');
  const notificationsResponse = responseSchema(spec, '/x/notifications', 'get');
  const notifications = propertyNames(notificationsResponse);
  const notification = itemPropertyNamesFromProperty(
    spec,
    notificationsResponse,
    'notifications',
  );
  const communityInfoResponse = responseSchema(
    spec,
    '/x/communities/{id}/info',
    'get',
  );
  const communityInfo = propertyNames(
    resolveSchema(spec, communityInfoResponse.properties?.['community'] ?? {}),
  );
  const mediaDownload = propertyNames(
    responseSchema(spec, '/x/media/download', 'post'),
  );
  const bookmarkFoldersResponse = responseSchema(
    spec,
    '/x/bookmarks/folders',
    'get',
  );
  const bookmarkFolders = propertyNames(bookmarkFoldersResponse);
  const bookmarkFolder = itemPropertyNamesFromProperty(
    spec,
    bookmarkFoldersResponse,
    'folders',
  );
  const xTrendsResponse = responseSchema(spec, '/x/trends', 'get');
  const xTrends = propertyNames(xTrendsResponse);
  const xTrend = itemPropertyNamesFromProperty(spec, xTrendsResponse, 'trends');
  const followCheck = propertyNames(
    responseSchema(spec, '/x/followers/check', 'get'),
  );
  const articleResponse = responseSchema(spec, '/x/articles/{tweetId}', 'get');
  const article = propertyNames(articleResponse);
  const articleBodySchema = resolveSchema(
    spec,
    articleResponse.properties?.['article'] ?? {},
  );
  const articleBody = propertyNames(articleBodySchema);
  const articleContentSchema = resolveSchema(
    spec,
    articleBodySchema.properties?.['contents']?.items ?? {},
  );
  const articleContent = propertyNames(articleContentSchema);
  const articleInlineStyle = itemPropertyNamesFromProperty(
    spec,
    articleContentSchema,
    'inlineStyleRanges',
  );
  const articleAuthor = propertyNames(
    resolveSchema(spec, articleResponse.properties?.['author'] ?? {}),
  );
  const dmHistoryResponse = responseSchema(spec, '/x/dm/{userId}/history', 'get');
  const dmHistory = propertyNames(dmHistoryResponse);
  const dmMessage = itemPropertyNamesFromProperty(
    spec,
    dmHistoryResponse,
    'messages',
  );

  const paginatedTweetContracts = PAGINATED_TWEET_PAGES.map(
    (page): PageContract => ({
      allowedFields: uniqueSorted([
        ...paginatedTweets,
        ...searchTweet,
        ...userProfile,
        ...searchTweetMedia,
      ]),
      page,
      requiredFields: uniqueSorted([
        ...paginatedTweets,
        ...searchTweet,
        ...searchTweetMedia,
      ]),
    }),
  );
  const paginatedUserContracts = PAGINATED_USER_PAGES.map(
    (page): PageContract => ({
      allowedFields: uniqueSorted([...paginatedUsers, ...userProfile]),
      page,
      requiredFields: uniqueSorted([...paginatedUsers, ...userProfile]),
    }),
  );

  return [
    ...paginatedTweetContracts,
    ...paginatedUserContracts,
    {
      allowedFields: uniqueSorted([
        'author',
        'tweet',
        ...tweetDetail,
        ...tweetAuthor,
        ...tweetDetailMedia,
      ]),
      page: 'api-reference/x/get-tweet.mdx',
      requiredFields: uniqueSorted([
        'author',
        'tweet',
        ...tweetDetail,
        ...tweetAuthor,
        ...tweetDetailMedia,
      ]),
    },
    {
      allowedFields: userProfile,
      page: 'api-reference/x/get-user.mdx',
      requiredFields: userProfile,
    },
    {
      allowedFields: uniqueSorted([...notifications, ...notification]),
      page: NOTIFICATION_PAGE,
      requiredFields: uniqueSorted([...notifications, ...notification]),
    },
    {
      allowedFields: uniqueSorted(['community', ...communityInfo]),
      page: COMMUNITY_INFO_PAGE,
      requiredFields: uniqueSorted(['community', ...communityInfo]),
    },
    {
      allowedFields: mediaDownload,
      page: MEDIA_DOWNLOAD_PAGE,
      requiredFields: mediaDownload,
    },
    {
      allowedFields: uniqueSorted([...bookmarkFolders, ...bookmarkFolder]),
      page: BOOKMARK_FOLDERS_PAGE,
      requiredFields: uniqueSorted([...bookmarkFolders, ...bookmarkFolder]),
    },
    {
      allowedFields: uniqueSorted([...xTrends, ...xTrend]),
      page: X_TRENDS_PAGE,
      requiredFields: uniqueSorted([...xTrends, ...xTrend]),
    },
    {
      allowedFields: followCheck,
      page: FOLLOW_CHECK_PAGE,
      requiredFields: followCheck,
    },
    {
      allowedFields: uniqueSorted([
        ...article,
        ...articleBody,
        ...articleContent,
        ...articleInlineStyle,
        ...articleAuthor,
      ]),
      page: ARTICLE_PAGE,
      requiredFields: uniqueSorted([
        ...article,
        ...articleBody,
        ...articleContent,
        ...articleInlineStyle,
        ...articleAuthor,
      ]),
    },
    {
      allowedFields: uniqueSorted([...dmHistory, ...dmMessage]),
      page: DM_HISTORY_PAGE,
      requiredFields: uniqueSorted([...dmHistory, ...dmMessage]),
    },
  ];
}

describe('API response field docs', (): void => {
  it('keeps selected X read endpoint fields aligned with OpenAPI schemas', (): void => {
    expect.assertions(1);

    const spec = readOpenApi();
    const findings = pageContracts(spec).flatMap(
      (contract): readonly string[] => {
        const documented = responseFields(contract.page);
        return [
          ...setDifference(contract.requiredFields, documented).map(
            (field): string => `${contract.page} is missing ${field}.`,
          ),
          ...setDifference(documented, contract.allowedFields).map(
            (field): string => `${contract.page} documents unknown ${field}.`,
          ),
        ];
      },
    );

    expect(findings).toStrictEqual([]);
  });

  it('keeps selected X read OpenAPI schemas aligned with product mappers', (): void => {
    expect.assertions(1);

    const productSourceExists =
      existsSync(PRODUCT_ROUTE_HELPERS_PATH) &&
      existsSync(PRODUCT_NOTIFICATIONS_ROUTE_PATH) &&
      existsSync(PRODUCT_BOOKMARK_FOLDERS_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TRENDS_ROUTE_PATH) &&
      existsSync(PRODUCT_DM_HISTORY_ROUTE_PATH) &&
      existsSync(PRODUCT_FOLLOW_CHECK_ROUTE_PATH) &&
      existsSync(PRODUCT_TRENDS_API_PATH) &&
      existsSync(PRODUCT_ARTICLE_FORMAT_PATH) &&
      existsSync(PRODUCT_MEDIA_HANDLER_PATH) &&
      existsSync(PRODUCT_X_API_TYPES_PATH);
    if (!productSourceExists) {
      expect(productSourceExists).toBe(false);
      return;
    }

    const spec = readOpenApi();
    const articleResponseSchema = responseSchema(
      spec,
      '/x/articles/{tweetId}',
      'get',
    );
    const articleSchema = resolveSchema(
      spec,
      articleResponseSchema.properties?.['article'] ?? {},
    );
    const articleContentSchema = resolveSchema(
      spec,
      articleSchema.properties?.['contents']?.items ?? {},
    );
    const articleAuthorSchema = resolveSchema(
      spec,
      articleResponseSchema.properties?.['author'] ?? {},
    );
    const openApiArticleResponseFields = propertyNames(articleResponseSchema);
    const openApiArticleFields = propertyNames(articleSchema);
    const openApiArticleContentFields = itemPropertyNamesFromProperty(
      spec,
      articleSchema,
      'contents',
    );
    const openApiArticleInlineStyleFields = itemPropertyNamesFromProperty(
      spec,
      articleContentSchema,
      'inlineStyleRanges',
    );
    const openApiArticleAuthorFields = propertyNames(articleAuthorSchema);
    const productArticleResponseFields = productReturnFieldsFromPath(
      PRODUCT_ARTICLE_FORMAT_PATH,
      'formatArticleResponse',
    );
    const productArticleFields = productReturnFieldsFromPath(
      PRODUCT_ARTICLE_FORMAT_PATH,
      'formatArticle',
    );
    const productArticleAuthorFields = productReturnFieldsFromPath(
      PRODUCT_ARTICLE_FORMAT_PATH,
      'formatAuthor',
    );
    const dmHistoryResponseSchema = responseSchema(
      spec,
      '/x/dm/{userId}/history',
      'get',
    );
    const openApiDmHistoryFields = uniqueSorted([
      ...propertyNames(dmHistoryResponseSchema),
      ...itemPropertyNamesFromProperty(spec, dmHistoryResponseSchema, 'messages'),
    ]);
    const productDmHistoryResponseFields = productDmHistoryFields();
    const findings = [
      ...setDifference(
        schemaPropertyNames(spec, 'SearchTweet'),
        productMapperFields('mapTweet'),
      ).map((field): string => `SearchTweet has no product field ${field}.`),
      ...setDifference(
        productMapperFields('mapTweet'),
        schemaPropertyNames(spec, 'SearchTweet'),
      ).map((field): string => `SearchTweet is missing ${field}.`),
      ...setDifference(
        schemaPropertyNames(spec, 'UserProfile'),
        productMapperFields('mapUser'),
      ).map((field): string => `UserProfile has no product field ${field}.`),
      ...setDifference(
        productMapperFields('mapUser'),
        schemaPropertyNames(spec, 'UserProfile'),
      ).map((field): string => `UserProfile is missing ${field}.`),
      ...setDifference(
        itemPropertyNamesFromProperty(
          spec,
          responseSchema(spec, '/x/notifications', 'get'),
          'notifications',
        ),
        productNotificationFields(),
      ).map((field): string => `Notification has no product field ${field}.`),
      ...setDifference(
        productNotificationFields(),
        itemPropertyNamesFromProperty(
          spec,
          responseSchema(spec, '/x/notifications', 'get'),
          'notifications',
        ),
      ).map((field): string => `Notification is missing ${field}.`),
      ...setDifference(
        propertyNames(
          responseSchema(
            spec,
            '/x/communities/{id}/info',
            'get',
          ).properties?.['community'],
        ),
        productInterfaceFields('TwitterApiCommunityInfo'),
      ).map(
        (field): string => `Community info has no product field ${field}.`,
      ),
      ...setDifference(
        productInterfaceFields('TwitterApiCommunityInfo'),
        propertyNames(
          responseSchema(
            spec,
            '/x/communities/{id}/info',
            'get',
          ).properties?.['community'],
        ),
      ).map((field): string => `Community info is missing ${field}.`),
      ...setDifference(
        propertyNames(responseSchema(spec, '/x/media/download', 'post')),
        productMediaDownloadFields(),
      ).map(
        (field): string => `Media download has no product field ${field}.`,
      ),
      ...setDifference(
        productMediaDownloadFields(),
        propertyNames(responseSchema(spec, '/x/media/download', 'post')),
      ).map((field): string => `Media download is missing ${field}.`),
      ...setDifference(
        uniqueSorted([
          ...propertyNames(responseSchema(spec, '/x/bookmarks/folders', 'get')),
          ...itemPropertyNamesFromProperty(
            spec,
            responseSchema(spec, '/x/bookmarks/folders', 'get'),
            'folders',
          ),
        ]),
        productBookmarkFolderFields(),
      ).map(
        (field): string => `Bookmark folders has no product field ${field}.`,
      ),
      ...setDifference(
        productBookmarkFolderFields(),
        uniqueSorted([
          ...propertyNames(responseSchema(spec, '/x/bookmarks/folders', 'get')),
          ...itemPropertyNamesFromProperty(
            spec,
            responseSchema(spec, '/x/bookmarks/folders', 'get'),
            'folders',
          ),
        ]),
      ).map((field): string => `Bookmark folders is missing ${field}.`),
      ...setDifference(
        uniqueSorted([
          ...propertyNames(responseSchema(spec, '/x/trends', 'get')),
          ...itemPropertyNamesFromProperty(
            spec,
            responseSchema(spec, '/x/trends', 'get'),
            'trends',
          ),
        ]),
        productXTrendsFields(),
      ).map((field): string => `X trends has no product field ${field}.`),
      ...setDifference(
        productXTrendsFields(),
        uniqueSorted([
          ...propertyNames(responseSchema(spec, '/x/trends', 'get')),
          ...itemPropertyNamesFromProperty(
            spec,
            responseSchema(spec, '/x/trends', 'get'),
            'trends',
          ),
        ]),
      ).map((field): string => `X trends is missing ${field}.`),
      ...setDifference(
        propertyNames(responseSchema(spec, '/x/followers/check', 'get')),
        productFollowCheckFields(),
      ).map((field): string => `Follow check has no product field ${field}.`),
      ...setDifference(
        productFollowCheckFields(),
        propertyNames(responseSchema(spec, '/x/followers/check', 'get')),
      ).map((field): string => `Follow check is missing ${field}.`),
      ...setDifference(
        openApiDmHistoryFields,
        productDmHistoryResponseFields,
      ).map((field): string => `DM history has no product field ${field}.`),
      ...setDifference(
        productDmHistoryResponseFields,
        openApiDmHistoryFields,
      ).map((field): string => `DM history is missing ${field}.`),
      ...setDifference(
        openApiArticleResponseFields,
        productArticleResponseFields,
      ).map((field): string => `Article response has no product field ${field}.`),
      ...setDifference(
        productArticleResponseFields,
        openApiArticleResponseFields,
      ).map((field): string => `Article response is missing ${field}.`),
      ...setDifference(
        openApiArticleFields,
        productArticleFields,
      ).map((field): string => `Article has no product field ${field}.`),
      ...setDifference(
        productArticleFields,
        openApiArticleFields,
      ).map((field): string => `Article is missing ${field}.`),
      ...setDifference(
        openApiArticleContentFields,
        productInterfaceFields('TwitterApiArticleContent'),
      ).map((field): string => `Article content has no product field ${field}.`),
      ...setDifference(
        productInterfaceFields('TwitterApiArticleContent'),
        openApiArticleContentFields,
      ).map((field): string => `Article content is missing ${field}.`),
      ...setDifference(
        openApiArticleInlineStyleFields,
        productInterfaceFields('TwitterApiArticleInlineStyle'),
      ).map(
        (field): string => `Article inline style has no product field ${field}.`,
      ),
      ...setDifference(
        productInterfaceFields('TwitterApiArticleInlineStyle'),
        openApiArticleInlineStyleFields,
      ).map((field): string => `Article inline style is missing ${field}.`),
      ...setDifference(
        openApiArticleAuthorFields,
        productArticleAuthorFields,
      ).map((field): string => `Article author has no product field ${field}.`),
      ...setDifference(
        productArticleAuthorFields,
        openApiArticleAuthorFields,
      ).map((field): string => `Article author is missing ${field}.`),
    ];

    expect(findings).toStrictEqual([]);
  });
});
