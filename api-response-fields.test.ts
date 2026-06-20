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
const PRODUCT_ACCOUNT_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/account/route.ts',
);
const PRODUCT_ACCOUNT_QUERY_PATH = join(PRODUCT_ROOT, 'lib/account/query.ts');
const PRODUCT_ACCOUNT_X_IDENTITY_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/account/x-identity/route.ts',
);
const PRODUCT_SUBSCRIBE_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/subscribe/route.ts',
);
const PRODUCT_SUBSCRIBE_TOOL_PATH = join(
  PRODUCT_ROOT,
  'lib/mcp/subscribe-tool.ts',
);
const PRODUCT_CREDITS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/credits/route.ts',
);
const PRODUCT_CREDITS_TOPUP_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/credits/topup/route.ts',
);
const PRODUCT_CREDITS_TOPUP_STATUS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/credits/topup/status/route.ts',
);
const PRODUCT_CREDITS_QUICK_TOPUP_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/credits/quick-topup/route.ts',
);
const PRODUCT_CREDITS_ROUTE_HELPER_PATH = join(
  PRODUCT_ROOT,
  'lib/credits/credits-route.ts',
);
const PRODUCT_CREDITS_TOPUP_STATUS_HELPER_PATH = join(
  PRODUCT_ROOT,
  'lib/credits/topup-status.ts',
);
const PRODUCT_API_KEYS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/api-keys/route.ts',
);
const PRODUCT_API_KEY_ID_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/api-keys/[id]/route.ts',
);
const PRODUCT_DRAFT_FORMAT_PATH = join(PRODUCT_ROOT, 'lib/api/draft-format.ts');
const PRODUCT_STYLE_COLUMNS_PATH = join(PRODUCT_ROOT, 'lib/styles/columns.ts');
const PRODUCT_STYLE_PERFORMANCE_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/styles/[id]/performance/route.ts',
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
const PRODUCT_SEND_DM_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/dm/[userId]/route.ts',
);
const PRODUCT_X_MEDIA_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/media/route.ts',
);
const PRODUCT_X_PROFILE_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/profile/route.ts',
);
const PRODUCT_X_PROFILE_AVATAR_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/profile/avatar/route.ts',
);
const PRODUCT_X_PROFILE_BANNER_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/profile/banner/route.ts',
);
const PRODUCT_X_COMMUNITIES_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/communities/route.ts',
);
const PRODUCT_X_COMMUNITY_ID_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/communities/[id]/route.ts',
);
const PRODUCT_X_COMMUNITY_JOIN_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/communities/[id]/join/route.ts',
);
const PRODUCT_X_TWEET_ID_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/tweets/[id]/route.ts',
);
const PRODUCT_X_TWEETS_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/tweets/route.ts',
);
const PRODUCT_X_TWEET_LIKE_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/tweets/[id]/like/route.ts',
);
const PRODUCT_X_TWEET_RETWEET_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/tweets/[id]/retweet/route.ts',
);
const PRODUCT_X_USER_FOLLOW_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/users/[id]/follow/route.ts',
);
const PRODUCT_X_USER_REMOVE_FOLLOWER_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/users/[id]/remove-follower/route.ts',
);
const PRODUCT_FOLLOW_CHECK_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/followers/check/route.ts',
);
const PRODUCT_WRITE_ACTION_HANDLER_PATH = join(
  PRODUCT_ROOT,
  'lib/x-accounts/write-action-handler.ts',
);
const PRODUCT_X_ACCOUNTS_ROUTE_HELPERS_PATH = join(
  PRODUCT_ROOT,
  'lib/x-accounts/accounts-route.ts',
);
const PRODUCT_X_ACCOUNTS_ID_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/accounts/[id]/route.ts',
);
const PRODUCT_X_ACCOUNTS_BULK_RETRY_ROUTE_PATH = join(
  PRODUCT_ROOT,
  'app/api/v1/x/accounts/bulk-retry/route.ts',
);
const PRODUCT_V1_CRUD_PATH = join(PRODUCT_ROOT, 'lib/api/v1-crud.ts');
const PRODUCT_TRENDS_API_PATH = join(PRODUCT_ROOT, 'lib/api/trends.ts');
const PRODUCT_ARTICLE_FORMAT_PATH = join(
  PRODUCT_ROOT,
  'lib/x-api/article-format.ts',
);
const PRODUCT_MEDIA_HANDLER_PATH = join(PRODUCT_ROOT, 'lib/media/handler.ts');
const PRODUCT_X_API_TYPES_PATH = join(PRODUCT_ROOT, 'lib/x-api/types.ts');
const PRODUCT_X_WRITE_TWIKIT_PATH = join(
  PRODUCT_ROOT,
  'lib/x-api/write-client-twikit.ts',
);

interface OpenApiSpec {
  readonly components?: {
    readonly responses?: Record<string, OpenApiResponse>;
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
  readonly $ref?: string;
  readonly content?: Record<string, OpenApiMediaType>;
}

interface OpenApiSchema {
  readonly $ref?: string;
  readonly anyOf?: readonly OpenApiSchema[];
  readonly items?: OpenApiSchema;
  readonly oneOf?: readonly OpenApiSchema[];
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
  'api-reference/x/user-replies.mdx',
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
const ACCOUNT_GET_PAGE = 'api-reference/account/get.mdx';
const ACCOUNT_UPDATE_PAGE = 'api-reference/account/update.mdx';
const ACCOUNT_X_IDENTITY_PAGE = 'api-reference/account/x-identity.mdx';
const SUBSCRIBE_PAGE = 'api-reference/account/subscribe.mdx';
const CREDITS_PAGE = 'api-reference/credits/get.mdx';
const CREDITS_TOPUP_PAGE = 'api-reference/credits/topup.mdx';
const CREDITS_TOPUP_STATUS_PAGE = 'api-reference/credits/topup-status.mdx';
const CREDITS_QUICK_TOPUP_PAGE = 'api-reference/credits/quick-topup.mdx';
const API_KEYS_LIST_PAGE = 'api-reference/api-keys/list.mdx';
const API_KEYS_CREATE_PAGE = 'api-reference/api-keys/create.mdx';
const API_KEYS_REVOKE_PAGE = 'api-reference/api-keys/revoke.mdx';
const DRAFTS_LIST_PAGE = 'api-reference/drafts/list.mdx';
const DRAFTS_CREATE_PAGE = 'api-reference/drafts/create.mdx';
const DRAFTS_GET_PAGE = 'api-reference/drafts/get.mdx';
const STYLES_ANALYZE_PAGE = 'api-reference/styles/analyze.mdx';
const STYLES_SAVE_PAGE = 'api-reference/styles/save.mdx';
const STYLES_GET_PAGE = 'api-reference/styles/get.mdx';
const STYLES_LIST_PAGE = 'api-reference/styles/list.mdx';
const STYLES_COMPARE_PAGE = 'api-reference/styles/compare.mdx';
const STYLES_PERFORMANCE_PAGE = 'api-reference/styles/performance.mdx';
const ARTICLE_PAGE = 'api-reference/x/get-article.mdx';
const DM_HISTORY_PAGE = 'api-reference/x/dm-history.mdx';
const SEND_DM_PAGE = 'api-reference/x-write/send-dm.mdx';
const UPLOAD_MEDIA_PAGE = 'api-reference/x-write/upload-media.mdx';
const UPDATE_PROFILE_PAGE = 'api-reference/x-write/update-profile.mdx';
const UPDATE_AVATAR_PAGE = 'api-reference/x-write/update-avatar.mdx';
const UPDATE_BANNER_PAGE = 'api-reference/x-write/update-banner.mdx';
const CREATE_COMMUNITY_PAGE = 'api-reference/x-write/create-community.mdx';
const DELETE_COMMUNITY_PAGE = 'api-reference/x-write/delete-community.mdx';
const JOIN_COMMUNITY_PAGE = 'api-reference/x-write/join-community.mdx';
const LEAVE_COMMUNITY_PAGE = 'api-reference/x-write/leave-community.mdx';
const CREATE_TWEET_PAGE = 'api-reference/x-write/create-tweet.mdx';
const DELETE_TWEET_PAGE = 'api-reference/x-write/delete-tweet.mdx';
const LIKE_TWEET_PAGE = 'api-reference/x-write/like.mdx';
const UNLIKE_TWEET_PAGE = 'api-reference/x-write/unlike.mdx';
const RETWEET_PAGE = 'api-reference/x-write/retweet.mdx';
const UNRETWEET_PAGE = 'api-reference/x-write/unretweet.mdx';
const FOLLOW_USER_PAGE = 'api-reference/x-write/follow.mdx';
const UNFOLLOW_USER_PAGE = 'api-reference/x-write/unfollow.mdx';
const REMOVE_FOLLOWER_PAGE = 'api-reference/x-write/remove-follower.mdx';
const X_ACCOUNT_LIST_PAGE = 'api-reference/x-accounts/list.mdx';
const X_ACCOUNT_DETAIL_PAGE = 'api-reference/x-accounts/get.mdx';
const X_ACCOUNT_CONNECT_PAGE = 'api-reference/x-accounts/connect.mdx';
const X_ACCOUNT_CHALLENGE_SUBMIT_PAGE =
  'api-reference/x-accounts/submit-challenge.mdx';
const X_ACCOUNT_REAUTH_PAGE = 'api-reference/x-accounts/reauth.mdx';
const X_ACCOUNT_BULK_RETRY_PAGE = 'api-reference/x-accounts/bulk-retry.mdx';
const X_ACCOUNT_DISCONNECT_PAGE = 'api-reference/x-accounts/disconnect.mdx';

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

function responseByName(spec: OpenApiSpec, name: string): OpenApiResponse {
  const response = spec.components?.responses?.[name];
  if (response === undefined) {
    throw new Error(`Missing OpenAPI response: ${name}`);
  }
  return response;
}

function resolveResponse(
  spec: OpenApiSpec,
  response: OpenApiResponse,
): OpenApiResponse {
  if (response.$ref === undefined) {
    return response;
  }
  const name = response.$ref.replace('#/components/responses/', '');
  return responseByName(spec, name);
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

function responseFieldNamesFromSchema(
  spec: OpenApiSpec,
  schema: OpenApiSchema,
): readonly string[] {
  const resolved = resolveSchema(spec, schema);
  return uniqueSorted([
    ...propertyNames(resolved),
    ...(resolved.oneOf ?? []).flatMap((nested): readonly string[] =>
      responseFieldNamesFromSchema(spec, nested),
    ),
    ...(resolved.anyOf ?? []).flatMap((nested): readonly string[] =>
      responseFieldNamesFromSchema(spec, nested),
    ),
  ]);
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
  status = '200',
): OpenApiSchema {
  const schema =
    resolveResponse(
      spec,
      spec.paths?.[path]?.[method]?.responses?.[status] ?? {},
    ).content?.['application/json']?.schema;
  if (schema === undefined) {
    throw new Error(
      `Missing ${status} JSON response schema: ${method} ${path}`,
    );
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
  const appendStart = body.indexOf('appendOptionalFields({');
  const groupedAppendStart = body.indexOf(
    'appendOptionalFields(\n',
    appendStart,
  );
  const appendSearchStart = appendStart < 0 ? groupedAppendStart : appendStart;
  const appendObjectStart =
    appendSearchStart < 0 ? -1 : body.indexOf('{', appendSearchStart);
  const appendObjectEnd = body.indexOf('}', appendObjectStart);
  const appendDirectFields =
    appendObjectStart < 0 || appendObjectEnd < 0
      ? []
      : objectLiteralPropertyFields(
          body.slice(appendObjectStart, appendObjectEnd + 1),
        );
  const appendOptionalFields = [
    ...body.matchAll(/\[\s*'(?<field>[^']+)'\s*,/gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  return uniqueSorted([
    ...directFields,
    ...optionalFields,
    ...appendDirectFields,
    ...appendOptionalFields,
  ]);
}

function objectLiteralPropertyFields(source: string): readonly string[] {
  return uniqueSorted(
    [...source.matchAll(/[{,]\s*(?<field>[A-Za-z_]\w*)\s*:/gu)]
      .map((match): string => match.groups?.['field'] ?? '')
      .filter((field): boolean => field.length > 0),
  );
}

function assignDefinedPropertyFields(source: string): readonly string[] {
  return uniqueSorted(
    [
      ...source.matchAll(
        /assignDefined\(\s*response\s*,\s*'(?<field>[^']+)'\s*,/gu,
      ),
    ]
      .map((match): string => match.groups?.['field'] ?? '')
      .filter((field): boolean => field.length > 0 && field !== 'bodyText'),
  );
}

function returnedResponseFields(body: string): readonly string[] {
  const literalStart = body.indexOf('const response:');
  if (literalStart < 0 || !body.includes('return response;')) return [];
  const objectStart = body.indexOf('{', literalStart);
  const objectEnd = body.indexOf('};', objectStart);
  if (objectStart < 0 || objectEnd < 0) return [];
  const literalFields = objectLiteralPropertyFields(
    body.slice(objectStart, objectEnd + 1),
  );
  if (literalFields.length > 0) {
    return uniqueSorted([
      ...literalFields,
      ...assignDefinedPropertyFields(body).filter(
        (field): boolean => field === 'profilePicture',
      ),
    ]);
  }
  return assignDefinedPropertyFields(body);
}

function productReturnFieldsFromPath(
  path: string,
  functionName: string,
): readonly string[] {
  const source = readFileSync(path, 'utf8');
  const body = mapFunctionBody(source, functionName);
  const responseFields = returnedResponseFields(body);
  if (responseFields.length > 0) return responseFields;
  const start = body.indexOf('return {');
  const end = body.indexOf('};', start);
  if (start < 0 || end < 0) {
    throw new Error(`Could not locate return object: ${functionName}`);
  }
  return objectLiteralPropertyFields(body.slice(start, end + 1));
}

function productDmMessageFields(): readonly string[] {
  const source = readFileSync(PRODUCT_DM_HISTORY_ROUTE_PATH, 'utf8');
  const body = mapFunctionBody(source, 'mapMessage');
  const literalStart = body.indexOf(
    'const message: Record<string, unknown> = {',
  );
  const literalEnd = body.indexOf('};', literalStart);
  if (literalStart < 0 || literalEnd < 0) {
    throw new Error('Could not locate DM history message object.');
  }
  const initialFields = objectLiteralPropertyFields(
    body.slice(literalStart, literalEnd + 1),
  );
  const assignedFields = [
    ...body.matchAll(/message\[['"](?<field>[^'"]+)['"]\]\s*=/gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  const optionalFields = [
    ...body.matchAll(/\[\s*'(?<field>[^']+)'\s*,/gu),
  ]
    .map((match): string => match.groups?.['field'] ?? '')
    .filter((field): boolean => field.length > 0);
  return uniqueSorted([...initialFields, ...assignedFields, ...optionalFields]);
}

function productNotificationFields(): readonly string[] {
  const source = readFileSync(PRODUCT_NOTIFICATIONS_ROUTE_PATH, 'utf8');
  const body = mapFunctionBody(source, 'mapNotification');
  const inlineStart = body.indexOf('appendOptionalFields({');
  const inlineEnd = body.indexOf('}, [', inlineStart);
  if (inlineStart < 0 || inlineEnd < 0) {
    throw new Error('Could not locate notification response mapper.');
  }
  const directFields = objectLiteralPropertyFields(
    body.slice(inlineStart, inlineEnd + 1),
  );
  const optionalFields = [
    ...body.matchAll(/\[\s*'(?<field>[^']+)'\s*,/gu),
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
  return productReturnFieldsFromPath(
    PRODUCT_BOOKMARK_FOLDERS_ROUTE_PATH,
    'buildBookmarkFoldersResponse',
  );
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
  return productReturnFieldsFromPath(
    PRODUCT_FOLLOW_CHECK_ROUTE_PATH,
    'buildFollowCheckResponse',
  );
}

function productAccountMonitorBillingFields(): readonly string[] {
  const source = readFileSync(PRODUCT_ACCOUNT_QUERY_PATH, 'utf8');
  const start = source.indexOf('readonly monitorBilling: {');
  if (start < 0) {
    throw new Error('Could not locate account monitor billing fields.');
  }
  const end = source.indexOf('\n  };', start);
  if (end < 0) {
    throw new Error('Could not locate account monitor billing field end.');
  }
  const body = source.slice(start, end);
  return uniqueSorted(
    [...body.matchAll(/^\s{4}readonly (?<field>[A-Za-z_]\w*):/gmu)].map(
      (match): string => match.groups?.['field'] ?? '',
    ),
  );
}

function productAccountInfoFields(): readonly string[] {
  return uniqueSorted([
    ...productInterfaceFieldsFromPath(
      PRODUCT_ACCOUNT_QUERY_PATH,
      'AccountInfoResult',
    ),
    ...productInterfaceFieldsFromPath(PRODUCT_ACCOUNT_QUERY_PATH, 'CreditInfo'),
    ...productAccountMonitorBillingFields(),
  ]);
}

function productAccountUpdateFields(): readonly string[] {
  const source = readFileSync(PRODUCT_ACCOUNT_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf(
    'return NextResponse.json({ success: true });',
  );
  if (responseStart < 0) {
    throw new Error('Could not locate account update success response.');
  }
  const responseEnd = source.indexOf(');', responseStart);
  return objectLiteralFields(source.slice(responseStart, responseEnd));
}

function productAccountXIdentityFields(): readonly string[] {
  const source = readFileSync(PRODUCT_ACCOUNT_X_IDENTITY_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf(
    'return NextResponse.json({ success: true, xUsername });',
  );
  if (responseStart < 0) {
    throw new Error('Could not locate X identity success response.');
  }
  const responseEnd = source.indexOf(');', responseStart);
  return objectLiteralFields(source.slice(responseStart, responseEnd));
}

function productSubscribeFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_SUBSCRIBE_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes('const result = await handleSubscribe(') ||
    !routeSource.includes('return NextResponse.json(result);')
  ) {
    throw new Error('Could not verify subscribe route response wiring.');
  }
  return productInterfaceFieldsFromPath(
    PRODUCT_SUBSCRIBE_TOOL_PATH,
    'SubscribeMcpResult',
  );
}

function productCreditsFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_CREDITS_ROUTE_PATH, 'utf8');
  const responseStart = routeSource.indexOf(
    'return NextResponse.json({\n      auto_topup_amount_dollars:',
  );
  const responseEnd = routeSource.indexOf('});', responseStart);
  const helperSource = readFileSync(PRODUCT_CREDITS_ROUTE_HELPER_PATH, 'utf8');
  const emptyStart = helperSource.indexOf('const EMPTY_CREDITS_BALANCE = {');
  const emptyEnd = helperSource.indexOf('} as const;', emptyStart);
  if (
    responseStart < 0 ||
    responseEnd < 0 ||
    emptyStart < 0 ||
    emptyEnd < 0 ||
    !routeSource.includes('return NextResponse.json(EMPTY_CREDITS_BALANCE);')
  ) {
    throw new Error('Could not locate credits balance success responses.');
  }
  return uniqueSorted([
    ...objectLiteralFields(routeSource.slice(responseStart, responseEnd + 1)),
    ...objectLiteralFields(helperSource.slice(emptyStart, emptyEnd + 1)),
  ]);
}

function productCreditsTopupFields(): readonly string[] {
  const source = readFileSync(PRODUCT_CREDITS_TOPUP_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf(
    'return NextResponse.json({ url: result.url });',
  );
  if (
    responseStart < 0 ||
    !source.includes('const result = await handlePostTopup(')
  ) {
    throw new Error('Could not locate credits top-up success response.');
  }
  const responseEnd = source.indexOf(');', responseStart);
  return objectLiteralFields(source.slice(responseStart, responseEnd));
}

function productCreditsTopupStatusFields(): readonly string[] {
  const source = readFileSync(PRODUCT_CREDITS_TOPUP_STATUS_ROUTE_PATH, 'utf8');
  if (!source.includes('return NextResponse.json(statusResult.payload);')) {
    throw new Error('Could not verify credits top-up status response wiring.');
  }
  return productInterfaceFieldsFromPath(
    PRODUCT_CREDITS_TOPUP_STATUS_HELPER_PATH,
    'PublicTopupStatusPayload',
  );
}

function productCreditsQuickTopupFields(): readonly string[] {
  const source = readFileSync(PRODUCT_CREDITS_QUICK_TOPUP_ROUTE_PATH, 'utf8');
  const responseStarts = [
    source.indexOf("return NextResponse.json({ outcome: 'no_payment_method' });"),
    source.indexOf('return NextResponse.json({\n            clientSecret:'),
    source.indexOf('return NextResponse.json({\n          balance:'),
  ];
  if (
    responseStarts.some((start): boolean => start < 0) ||
    !source.includes('const result = await handleQuickTopup(')
  ) {
    throw new Error('Could not locate credits quick top-up success responses.');
  }
  return uniqueSorted(
    responseStarts.flatMap((start): readonly string[] => {
      const end = source.indexOf(');', start);
      return objectLiteralFields(source.slice(start, end));
    }),
  );
}

function productApiKeyListFields(): readonly string[] {
  const source = readFileSync(PRODUCT_API_KEYS_ROUTE_PATH, 'utf8');
  const start = source.indexOf('const key: {');
  const end = source.indexOf('\n      } = {', start);
  if (start < 0 || end < 0) {
    throw new Error('Could not locate API key list item fields.');
  }
  const itemFields = uniqueSorted(
    [
      ...source
        .slice(start, end)
        .matchAll(/^\s{8}(?<field>[A-Za-z_]\w*)\??:/gmu),
    ]
      .map((match): string => match.groups?.['field'] ?? '')
      .filter((field): boolean => field.length > 0),
  );
  if (!source.includes('return NextResponse.json({ keys });')) {
    throw new Error('Could not locate API key list success response.');
  }
  return uniqueSorted(['keys', ...itemFields]);
}

function productApiKeyCreateFields(): readonly string[] {
  const source = readFileSync(PRODUCT_API_KEYS_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf('return NextResponse.json(\n      {');
  const responseEnd = source.indexOf(
    '\n      },\n      { status: 201 }',
    responseStart,
  );
  if (responseStart < 0 || responseEnd < 0) {
    throw new Error('Could not locate API key create success response.');
  }
  return objectLiteralFields(source.slice(responseStart, responseEnd));
}

function productApiKeyRevokeFields(): readonly string[] {
  const source = readFileSync(PRODUCT_API_KEY_ID_ROUTE_PATH, 'utf8');
  if (!source.includes('return successResponse();')) {
    throw new Error('API key revoke route no longer uses successResponse.');
  }
  return productSuccessResponseFields();
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
    ...productDmMessageFields(),
  ]);
}

function productSendDmFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_SEND_DM_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'send_dm'") ||
    !routeSource.includes("apiPath: '/twitter/send_dm_to_user'") ||
    !routeSource.includes('return executeWithRetry(')
  ) {
    throw new Error('Could not verify send DM route write-action wiring.');
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes("path: '/twitter/send_dm_to_user'") &&
    !writeSource.includes("['/twitter/send_dm_to_user', buildSendDmOperation]")
  ) {
    throw new Error('Could not verify send DM write-client operation.');
  }
  if (
    !writeSource.includes(
      "return { attempts: 0, status: 'success', messageId: result.messageId };",
    )
  ) {
    throw new Error('Could not verify send DM messageId response field.');
  }
  return ['messageId', 'success'];
}

function productUploadMediaFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_X_MEDIA_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'upload_media'") ||
    !routeSource.includes("apiPath: '/twitter/upload_media_v2'") ||
    !routeSource.includes('includePublicMediaUrl: true') ||
    !routeSource.includes('createImageUploadHandler({')
  ) {
    throw new Error('Could not verify upload media route wiring.');
  }
  const helperSource = readFileSync(PRODUCT_ROUTE_HELPERS_PATH, 'utf8');
  if (
    !helperSource.includes('return { mediaUrl: uploaded.url };') ||
    !helperSource.includes(
      'const responseFields = await buildPublicMediaResponseFields(',
    ) ||
    !helperSource.includes('withImageUploadResponseFields(')
  ) {
    throw new Error('Could not verify upload media public URL response field.');
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('mediaId: result.mediaId') ||
    !writeActionSource.includes('...responseFields')
  ) {
    throw new Error('Could not verify upload media success response fields.');
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(
      "['/twitter/upload_media_v2', buildUploadMediaOperation]",
    ) ||
    !writeSource.includes(
      "return { attempts: 0, status: 'success', mediaId: result.mediaId };",
    )
  ) {
    throw new Error('Could not verify upload media write-client operation.');
  }
  return ['mediaId', 'mediaUrl', 'success'];
}

function productUpdateProfileFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_X_PROFILE_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'update_profile'") ||
    !routeSource.includes("apiPath: '/twitter/update_profile_v2'") ||
    !routeSource.includes('return handleWriteAction(') ||
    !routeSource.includes('parseUpdateProfileBody')
  ) {
    throw new Error('Could not verify update profile route wiring.');
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('tweetId: result.tweetId') ||
    writeActionSource.includes('userId: result.userId')
  ) {
    throw new Error('Could not verify update profile success response fields.');
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(
      "['/twitter/update_profile_v2', buildUpdateProfileOperation]",
    ) ||
    !writeSource.includes(
      "return { attempts: 0, status: 'success', message: result.userId };",
    )
  ) {
    throw new Error('Could not verify update profile write-client operation.');
  }
  return ['success'];
}

function productProfileImageFields(
  routePath: string,
  actionType: string,
  apiPath: string,
  maxSizeBytes: string,
  operationBuilder: string,
  operationReturn: string,
): readonly string[] {
  const routeSource = readFileSync(routePath, 'utf8');
  if (
    !routeSource.includes(`actionType: '${actionType}'`) ||
    !routeSource.includes(`apiPath: '${apiPath}'`) ||
    !routeSource.includes('createProfileImageHandler(') ||
    !routeSource.includes(maxSizeBytes)
  ) {
    throw new Error(`Could not verify ${actionType} route wiring.`);
  }
  const helperSource = readFileSync(PRODUCT_ROUTE_HELPERS_PATH, 'utf8');
  if (
    !helperSource.includes('function createProfileImageHandler(') ||
    !helperSource.includes('allowedTypes: PROFILE_IMAGE_TYPES') ||
    !helperSource.includes("'image/jpeg'") ||
    !helperSource.includes("'image/png'")
  ) {
    throw new Error(`Could not verify ${actionType} upload helper wiring.`);
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('tweetId: result.tweetId') ||
    writeActionSource.includes('userId: result.userId')
  ) {
    throw new Error(`Could not verify ${actionType} success response fields.`);
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(`['${apiPath}', ${operationBuilder}]`) ||
    !writeSource.includes(operationReturn)
  ) {
    throw new Error(`Could not verify ${actionType} write-client operation.`);
  }
  return ['success'];
}

function productUpdateAvatarFields(): readonly string[] {
  return productProfileImageFields(
    PRODUCT_X_PROFILE_AVATAR_ROUTE_PATH,
    'update_avatar',
    '/twitter/update_avatar_v2',
    '716_800',
    'buildUpdateAvatarOperation',
    "return { attempts: 0, status: 'success', message: result.userId };",
  );
}

function productUpdateBannerFields(): readonly string[] {
  return productProfileImageFields(
    PRODUCT_X_PROFILE_BANNER_ROUTE_PATH,
    'update_banner',
    '/twitter/update_banner_v2',
    '2_097_152',
    'buildUpdateBannerOperation',
    "return { attempts: 0, status: 'success' };",
  );
}

function productCreateCommunityFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_X_COMMUNITIES_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'create_community'") ||
    !routeSource.includes("apiPath: '/twitter/create_community_v2'") ||
    !routeSource.includes('return handleWriteAction(') ||
    !routeSource.includes('parseCreateCommunityBody')
  ) {
    throw new Error('Could not verify create community route wiring.');
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('communityId: result.communityId') ||
    !writeActionSource.includes('communityName: result.communityName')
  ) {
    throw new Error('Could not verify create community success response.');
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(
      "['/twitter/create_community_v2', buildCreateCommunityOperation]",
    ) ||
    !writeSource.includes(
      "return { attempts: 0, status: 'success', communityId: result.communityId };",
    )
  ) {
    throw new Error('Could not verify create community write-client operation.');
  }
  return ['communityId', 'communityName', 'success'];
}

function productDeleteCommunityFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_X_COMMUNITY_ID_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'delete_community'") ||
    !routeSource.includes("apiPath: '/twitter/delete_community_v2'") ||
    !routeSource.includes('createToggleHandler({') ||
    !routeSource.includes('community_id: id') ||
    !routeSource.includes("community_name: extra['community_name']")
  ) {
    throw new Error('Could not verify delete community route wiring.');
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('communityId: result.communityId')
  ) {
    throw new Error('Could not verify delete community success response.');
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(
      "['/twitter/delete_community_v2', buildDeleteCommunityOperation]",
    ) ||
    !writeSource.includes("return { attempts: 0, status: 'success' };")
  ) {
    throw new Error('Could not verify delete community write-client operation.');
  }
  return ['success'];
}

function productCreateTweetFields(): readonly string[] {
  const routeSource = readFileSync(PRODUCT_X_TWEETS_ROUTE_PATH, 'utf8');
  if (
    !routeSource.includes("actionType: 'create_tweet'") ||
    !routeSource.includes('apiPath:') ||
    !routeSource.includes('return handleWriteAction(') ||
    !routeSource.includes('parseCreateTweetBody')
  ) {
    throw new Error('Could not verify create tweet route wiring.');
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes('tweetId: result.tweetId') ||
    !writeActionSource.includes('charged: chargeResult.charged') ||
    !writeActionSource.includes('chargedCredits: chargeResult.chargedCredits')
  ) {
    throw new Error('Could not verify create tweet success response fields.');
  }
  return ['charged', 'chargedCredits', 'success', 'tweetId', 'writeActionId'];
}

function productSimpleWriteFields(
  routePath: string,
  actionType: string,
  apiPath: string,
  operationName: string,
  bodyKey: string,
): readonly string[] {
  const routeSource = readFileSync(routePath, 'utf8');
  if (
    !routeSource.includes(`actionType: '${actionType}'`) ||
    !routeSource.includes(`apiPath: '${apiPath}'`) ||
    !routeSource.includes('createToggleHandler({') ||
    !routeSource.includes(`${bodyKey}: id`)
  ) {
    throw new Error(`Could not verify ${actionType} route wiring.`);
  }
  const writeActionSource = readFileSync(
    PRODUCT_WRITE_ACTION_HANDLER_PATH,
    'utf8',
  );
  if (
    !writeActionSource.includes('success: true') ||
    !writeActionSource.includes(
      'return buildSuccessResponse(result, context.responseFields, chargeResult);',
    )
  ) {
    throw new Error(`Could not verify ${actionType} success response.`);
  }
  const writeSource = readFileSync(PRODUCT_X_WRITE_TWIKIT_PATH, 'utf8');
  if (
    !writeSource.includes(`'${apiPath}'`) ||
    !writeSource.includes(`simpleIdBuilder(${operationName}, '${bodyKey}')`) ||
    !writeSource.includes('function buildSimpleIdOperation(') ||
    !writeSource.includes("return { attempts: 0, status: 'success' };")
  ) {
    throw new Error(`Could not verify ${actionType} write-client operation.`);
  }
  return ['success'];
}

function productLikeTweetFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_TWEET_LIKE_ROUTE_PATH,
    'like',
    '/twitter/like_tweet_v2',
    'likeTweet',
    'tweet_id',
  );
}

function productUnlikeTweetFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_TWEET_LIKE_ROUTE_PATH,
    'unlike',
    '/twitter/unlike_tweet_v2',
    'unlikeTweet',
    'tweet_id',
  );
}

function productRetweetFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_TWEET_RETWEET_ROUTE_PATH,
    'retweet',
    '/twitter/retweet_tweet_v2',
    'retweet',
    'tweet_id',
  );
}

function productUnretweetFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_TWEET_RETWEET_ROUTE_PATH,
    'unretweet',
    '/twitter/unretweet_tweet_v2',
    'unretweet',
    'tweet_id',
  );
}

function productDeleteTweetFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_TWEET_ID_ROUTE_PATH,
    'delete_tweet',
    '/twitter/delete_tweet_v2',
    'deleteTweet',
    'tweet_id',
  );
}

function productFollowUserFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_USER_FOLLOW_ROUTE_PATH,
    'follow',
    '/twitter/follow_user_v2',
    'followUser',
    'user_id',
  );
}

function productUnfollowUserFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_USER_FOLLOW_ROUTE_PATH,
    'unfollow',
    '/twitter/unfollow_user_v2',
    'unfollowUser',
    'user_id',
  );
}

function productRemoveFollowerFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_USER_REMOVE_FOLLOWER_ROUTE_PATH,
    'remove_follower',
    '/twitter/remove_follower_v2',
    'removeFollower',
    'user_id',
  );
}

function productJoinCommunityFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_COMMUNITY_JOIN_ROUTE_PATH,
    'join_community',
    '/twitter/join_community_v2',
    'joinCommunity',
    'community_id',
  );
}

function productLeaveCommunityFields(): readonly string[] {
  return productSimpleWriteFields(
    PRODUCT_X_COMMUNITY_JOIN_ROUTE_PATH,
    'leave_community',
    '/twitter/leave_community_v2',
    'leaveCommunity',
    'community_id',
  );
}

function productBulkRetryFields(): readonly string[] {
  const source = readFileSync(PRODUCT_X_ACCOUNTS_BULK_RETRY_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf('return NextResponse.json({');
  if (responseStart < 0) {
    throw new Error('Could not locate bulk retry success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  return objectLiteralFields(source.slice(responseStart, responseEnd + 1));
}

function productStylePerformanceFields(): readonly string[] {
  const source = readFileSync(PRODUCT_STYLE_PERFORMANCE_ROUTE_PATH, 'utf8');
  const responseStart = source.indexOf('return NextResponse.json({\n        tweets,');
  if (responseStart < 0) {
    throw new Error('Could not locate style performance success response.');
  }
  const responseEnd = source.indexOf('});', responseStart);
  const tweetTypeStart = source.indexOf('const tweets: Array<{');
  if (tweetTypeStart < 0) {
    throw new Error('Could not locate style performance tweet fields.');
  }
  const tweetTypeEnd = source.indexOf('}> = [];', tweetTypeStart);
  if (tweetTypeEnd < 0) {
    throw new Error('Could not locate style performance tweet field end.');
  }
  const tweetFields = [
    ...source
      .slice(tweetTypeStart, tweetTypeEnd)
      .matchAll(/readonly (?<field>[A-Za-z_]\w*):/gu),
  ].map((match): string => match.groups?.['field'] ?? '');

  return uniqueSorted([
    ...objectLiteralFields(source.slice(responseStart, responseEnd + 1)),
    ...tweetFields,
  ]);
}

function productSuccessResponseFields(): readonly string[] {
  const source = readFileSync(PRODUCT_V1_CRUD_PATH, 'utf8');
  const body = mapFunctionBody(source, 'successResponse');
  const responseStart = body.indexOf('return NextResponse.json(');
  if (responseStart < 0) {
    throw new Error('Could not locate success response.');
  }
  const responseEnd = body.indexOf(');', responseStart);
  return objectLiteralFields(body.slice(responseStart, responseEnd));
}

function productXAccountDisconnectFields(): readonly string[] {
  const source = readFileSync(PRODUCT_X_ACCOUNTS_ID_ROUTE_PATH, 'utf8');
  if (!source.includes('return successResponse();')) {
    throw new Error('X account disconnect route no longer uses successResponse.');
  }
  return productSuccessResponseFields();
}

function prefixedFields(
  prefix: string,
  fields: readonly string[],
): readonly string[] {
  return fields.map((field): string => `${prefix}${field}`);
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
  const accountGetResponse = responseSchema(spec, '/account', 'get');
  const accountGet = uniqueSorted([
    ...propertyNames(accountGetResponse),
    ...propertyNames(accountGetResponse.properties?.['creditInfo']),
    ...propertyNames(accountGetResponse.properties?.['monitorBilling']),
  ]);
  const accountUpdate = propertyNames(responseSchema(spec, '/account', 'patch'));
  const accountXIdentity = propertyNames(
    responseSchema(spec, '/account/x-identity', 'put'),
  );
  const subscribe = propertyNames(responseSchema(spec, '/subscribe', 'post'));
  const credits = propertyNames(responseSchema(spec, '/credits', 'get'));
  const creditsTopup = propertyNames(
    responseSchema(spec, '/credits/topup', 'post'),
  );
  const creditsTopupStatus = propertyNames(
    responseSchema(spec, '/credits/topup/status', 'get'),
  );
  const creditsQuickTopup = responseFieldNamesFromSchema(
    spec,
    responseSchema(spec, '/credits/quick-topup', 'post'),
  );
  const apiKey = schemaPropertyNames(spec, 'ApiKey');
  const apiKeysListResponse = responseSchema(spec, '/api-keys', 'get');
  const apiKeysList = uniqueSorted([
    ...propertyNames(apiKeysListResponse),
    ...apiKey,
  ]);
  const apiKeysCreate = propertyNames(
    responseSchema(spec, '/api-keys', 'post', '201'),
  );
  const apiKeysRevoke = propertyNames(
    responseSchema(spec, '/api-keys/{id}', 'delete'),
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
  const sendDm = propertyNames(responseSchema(spec, '/x/dm/{userId}', 'post'));
  const uploadMedia = propertyNames(responseSchema(spec, '/x/media', 'post'));
  const updateProfile = propertyNames(
    responseSchema(spec, '/x/profile', 'patch'),
  );
  const updateAvatar = propertyNames(
    responseSchema(spec, '/x/profile/avatar', 'patch'),
  );
  const updateBanner = propertyNames(
    responseSchema(spec, '/x/profile/banner', 'patch'),
  );
  const createCommunity = propertyNames(
    responseSchema(spec, '/x/communities', 'post'),
  );
  const deleteCommunity = propertyNames(
    responseSchema(spec, '/x/communities/{id}', 'delete'),
  );
  const joinCommunity = propertyNames(
    responseSchema(spec, '/x/communities/{id}/join', 'post'),
  );
  const leaveCommunity = propertyNames(
    responseSchema(spec, '/x/communities/{id}/join', 'delete'),
  );
  const createTweet = propertyNames(responseSchema(spec, '/x/tweets', 'post'));
  const deleteTweet = propertyNames(
    responseSchema(spec, '/x/tweets/{id}', 'delete'),
  );
  const likeTweet = propertyNames(
    responseSchema(spec, '/x/tweets/{id}/like', 'post'),
  );
  const unlikeTweet = propertyNames(
    responseSchema(spec, '/x/tweets/{id}/like', 'delete'),
  );
  const retweet = propertyNames(
    responseSchema(spec, '/x/tweets/{id}/retweet', 'post'),
  );
  const unretweet = propertyNames(
    responseSchema(spec, '/x/tweets/{id}/retweet', 'delete'),
  );
  const followUser = propertyNames(
    responseSchema(spec, '/x/users/{id}/follow', 'post'),
  );
  const unfollowUser = propertyNames(
    responseSchema(spec, '/x/users/{id}/follow', 'delete'),
  );
  const removeFollower = propertyNames(
    responseSchema(spec, '/x/users/{id}/remove-follower', 'post'),
  );
  const xAccount = schemaPropertyNames(spec, 'XAccount');
  const xAccountDetail = schemaPropertyNames(spec, 'XAccountDetail');
  const sanitizedXAccount = schemaPropertyNames(spec, 'SanitizedXAccount');
  const xAccountConnectionChallenge = schemaPropertyNames(
    spec,
    'XAccountConnectionChallenge',
  );
  const bulkRetry = propertyNames(
    responseSchema(spec, '/x/accounts/bulk-retry', 'post'),
  );
  const xAccountDisconnect = propertyNames(
    responseSchema(spec, '/x/accounts/{id}', 'delete'),
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
      allowedFields: accountGet,
      page: ACCOUNT_GET_PAGE,
      requiredFields: accountGet,
    },
    {
      allowedFields: accountUpdate,
      page: ACCOUNT_UPDATE_PAGE,
      requiredFields: accountUpdate,
    },
    {
      allowedFields: accountXIdentity,
      page: ACCOUNT_X_IDENTITY_PAGE,
      requiredFields: accountXIdentity,
    },
    {
      allowedFields: subscribe,
      page: SUBSCRIBE_PAGE,
      requiredFields: subscribe,
    },
    {
      allowedFields: credits,
      page: CREDITS_PAGE,
      requiredFields: credits,
    },
    {
      allowedFields: creditsTopup,
      page: CREDITS_TOPUP_PAGE,
      requiredFields: creditsTopup,
    },
    {
      allowedFields: creditsTopupStatus,
      page: CREDITS_TOPUP_STATUS_PAGE,
      requiredFields: creditsTopupStatus,
    },
    {
      allowedFields: creditsQuickTopup,
      page: CREDITS_QUICK_TOPUP_PAGE,
      requiredFields: creditsQuickTopup,
    },
    {
      allowedFields: apiKeysList,
      page: API_KEYS_LIST_PAGE,
      requiredFields: apiKeysList,
    },
    {
      allowedFields: apiKeysCreate,
      page: API_KEYS_CREATE_PAGE,
      requiredFields: apiKeysCreate,
    },
    {
      allowedFields: apiKeysRevoke,
      page: API_KEYS_REVOKE_PAGE,
      requiredFields: apiKeysRevoke,
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
    {
      allowedFields: sendDm,
      page: SEND_DM_PAGE,
      requiredFields: sendDm,
    },
    {
      allowedFields: uploadMedia,
      page: UPLOAD_MEDIA_PAGE,
      requiredFields: uploadMedia,
    },
    {
      allowedFields: updateProfile,
      page: UPDATE_PROFILE_PAGE,
      requiredFields: updateProfile,
    },
    {
      allowedFields: updateAvatar,
      page: UPDATE_AVATAR_PAGE,
      requiredFields: updateAvatar,
    },
    {
      allowedFields: updateBanner,
      page: UPDATE_BANNER_PAGE,
      requiredFields: updateBanner,
    },
    {
      allowedFields: createCommunity,
      page: CREATE_COMMUNITY_PAGE,
      requiredFields: createCommunity,
    },
    {
      allowedFields: deleteCommunity,
      page: DELETE_COMMUNITY_PAGE,
      requiredFields: deleteCommunity,
    },
    {
      allowedFields: joinCommunity,
      page: JOIN_COMMUNITY_PAGE,
      requiredFields: joinCommunity,
    },
    {
      allowedFields: leaveCommunity,
      page: LEAVE_COMMUNITY_PAGE,
      requiredFields: leaveCommunity,
    },
    {
      allowedFields: createTweet,
      page: CREATE_TWEET_PAGE,
      requiredFields: createTweet,
    },
    {
      allowedFields: deleteTweet,
      page: DELETE_TWEET_PAGE,
      requiredFields: deleteTweet,
    },
    {
      allowedFields: likeTweet,
      page: LIKE_TWEET_PAGE,
      requiredFields: likeTweet,
    },
    {
      allowedFields: unlikeTweet,
      page: UNLIKE_TWEET_PAGE,
      requiredFields: unlikeTweet,
    },
    {
      allowedFields: retweet,
      page: RETWEET_PAGE,
      requiredFields: retweet,
    },
    {
      allowedFields: unretweet,
      page: UNRETWEET_PAGE,
      requiredFields: unretweet,
    },
    {
      allowedFields: followUser,
      page: FOLLOW_USER_PAGE,
      requiredFields: followUser,
    },
    {
      allowedFields: unfollowUser,
      page: UNFOLLOW_USER_PAGE,
      requiredFields: unfollowUser,
    },
    {
      allowedFields: removeFollower,
      page: REMOVE_FOLLOWER_PAGE,
      requiredFields: removeFollower,
    },
    {
      allowedFields: uniqueSorted([
        'accounts',
        ...prefixedFields('accounts[].', xAccount),
      ]),
      page: X_ACCOUNT_LIST_PAGE,
      requiredFields: uniqueSorted([
        'accounts',
        ...prefixedFields('accounts[].', xAccount),
      ]),
    },
    {
      allowedFields: xAccountDetail,
      page: X_ACCOUNT_DETAIL_PAGE,
      requiredFields: xAccountDetail,
    },
    {
      allowedFields: uniqueSorted([
        ...sanitizedXAccount,
        ...xAccountConnectionChallenge,
      ]),
      page: X_ACCOUNT_CONNECT_PAGE,
      requiredFields: uniqueSorted([
        ...sanitizedXAccount,
        ...xAccountConnectionChallenge,
      ]),
    },
    {
      allowedFields: uniqueSorted([
        ...sanitizedXAccount,
        ...xAccountConnectionChallenge,
      ]),
      page: X_ACCOUNT_CHALLENGE_SUBMIT_PAGE,
      requiredFields: uniqueSorted([
        ...sanitizedXAccount,
        ...xAccountConnectionChallenge,
      ]),
    },
    {
      allowedFields: sanitizedXAccount,
      page: X_ACCOUNT_REAUTH_PAGE,
      requiredFields: sanitizedXAccount,
    },
    {
      allowedFields: bulkRetry,
      page: X_ACCOUNT_BULK_RETRY_PAGE,
      requiredFields: bulkRetry,
    },
    {
      allowedFields: xAccountDisconnect,
      page: X_ACCOUNT_DISCONNECT_PAGE,
      requiredFields: xAccountDisconnect,
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

  it('keeps draft response fields aligned with product draft formatting', (): void => {
    expect.assertions(1);

    if (!existsSync(PRODUCT_DRAFT_FORMAT_PATH)) {
      expect(existsSync(PRODUCT_DRAFT_FORMAT_PATH)).toBe(false);
      return;
    }

    const draftFields = productInterfaceFieldsFromPath(
      PRODUCT_DRAFT_FORMAT_PATH,
      'FormattedDraft',
    );
    const listFields = responseFields(DRAFTS_LIST_PAGE);
    const createFields = responseFields(DRAFTS_CREATE_PAGE);
    const getFields = responseFields(DRAFTS_GET_PAGE);
    const listDraftFields = prefixedFields('drafts[].', draftFields);

    expect([
      ...setDifference(listDraftFields, listFields).map(
        (field): string => `${DRAFTS_LIST_PAGE} is missing ${field}.`,
      ),
      ...setDifference(draftFields, createFields).map(
        (field): string => `${DRAFTS_CREATE_PAGE} is missing ${field}.`,
      ),
      ...setDifference(draftFields, getFields).map(
        (field): string => `${DRAFTS_GET_PAGE} is missing ${field}.`,
      ),
    ]).toStrictEqual([]);
  });

  it('keeps style response fields aligned with product style formatting', (): void => {
    expect.assertions(1);

    const productSourceExists =
      existsSync(PRODUCT_STYLE_COLUMNS_PATH) &&
      existsSync(PRODUCT_STYLE_PERFORMANCE_ROUTE_PATH);
    if (!productSourceExists) {
      expect(productSourceExists).toBe(false);
      return;
    }

    const detailFields = productReturnFieldsFromPath(
      PRODUCT_STYLE_COLUMNS_PATH,
      'formatStyleCacheRow',
    );
    const summaryFields = detailFields.filter(
      (field): boolean => field !== 'tweets',
    );
    const performanceFields = productStylePerformanceFields();

    expect([
      ...setDifference(detailFields, responseFields(STYLES_ANALYZE_PAGE)).map(
        (field): string => `${STYLES_ANALYZE_PAGE} is missing ${field}.`,
      ),
      ...setDifference(detailFields, responseFields(STYLES_SAVE_PAGE)).map(
        (field): string => `${STYLES_SAVE_PAGE} is missing ${field}.`,
      ),
      ...setDifference(detailFields, responseFields(STYLES_GET_PAGE)).map(
        (field): string => `${STYLES_GET_PAGE} is missing ${field}.`,
      ),
      ...setDifference(
        ['styles', ...summaryFields],
        responseFields(STYLES_LIST_PAGE),
      ).map((field): string => `${STYLES_LIST_PAGE} is missing ${field}.`),
      ...setDifference(
        ['style1', 'style2', ...detailFields],
        responseFields(STYLES_COMPARE_PAGE),
      ).map((field): string => `${STYLES_COMPARE_PAGE} is missing ${field}.`),
      ...setDifference(
        performanceFields,
        responseFields(STYLES_PERFORMANCE_PAGE),
      ).map(
        (field): string => `${STYLES_PERFORMANCE_PAGE} is missing ${field}.`,
      ),
    ]).toStrictEqual([]);
  });

  it('keeps selected X read OpenAPI schemas aligned with product mappers', (): void => {
    expect.assertions(1);

    const productSourceExists =
      existsSync(PRODUCT_ROUTE_HELPERS_PATH) &&
      existsSync(PRODUCT_ACCOUNT_ROUTE_PATH) &&
      existsSync(PRODUCT_ACCOUNT_QUERY_PATH) &&
      existsSync(PRODUCT_ACCOUNT_X_IDENTITY_ROUTE_PATH) &&
      existsSync(PRODUCT_SUBSCRIBE_ROUTE_PATH) &&
      existsSync(PRODUCT_SUBSCRIBE_TOOL_PATH) &&
      existsSync(PRODUCT_CREDITS_ROUTE_PATH) &&
      existsSync(PRODUCT_CREDITS_TOPUP_ROUTE_PATH) &&
      existsSync(PRODUCT_CREDITS_TOPUP_STATUS_ROUTE_PATH) &&
      existsSync(PRODUCT_CREDITS_QUICK_TOPUP_ROUTE_PATH) &&
      existsSync(PRODUCT_CREDITS_ROUTE_HELPER_PATH) &&
      existsSync(PRODUCT_CREDITS_TOPUP_STATUS_HELPER_PATH) &&
      existsSync(PRODUCT_API_KEYS_ROUTE_PATH) &&
      existsSync(PRODUCT_API_KEY_ID_ROUTE_PATH) &&
      existsSync(PRODUCT_NOTIFICATIONS_ROUTE_PATH) &&
      existsSync(PRODUCT_BOOKMARK_FOLDERS_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TRENDS_ROUTE_PATH) &&
      existsSync(PRODUCT_DM_HISTORY_ROUTE_PATH) &&
      existsSync(PRODUCT_SEND_DM_ROUTE_PATH) &&
      existsSync(PRODUCT_X_MEDIA_ROUTE_PATH) &&
      existsSync(PRODUCT_X_PROFILE_ROUTE_PATH) &&
      existsSync(PRODUCT_X_PROFILE_AVATAR_ROUTE_PATH) &&
      existsSync(PRODUCT_X_PROFILE_BANNER_ROUTE_PATH) &&
      existsSync(PRODUCT_X_COMMUNITIES_ROUTE_PATH) &&
      existsSync(PRODUCT_X_COMMUNITY_ID_ROUTE_PATH) &&
      existsSync(PRODUCT_X_COMMUNITY_JOIN_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TWEET_ID_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TWEETS_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TWEET_LIKE_ROUTE_PATH) &&
      existsSync(PRODUCT_X_TWEET_RETWEET_ROUTE_PATH) &&
      existsSync(PRODUCT_X_USER_FOLLOW_ROUTE_PATH) &&
      existsSync(PRODUCT_X_USER_REMOVE_FOLLOWER_ROUTE_PATH) &&
      existsSync(PRODUCT_FOLLOW_CHECK_ROUTE_PATH) &&
      existsSync(PRODUCT_WRITE_ACTION_HANDLER_PATH) &&
      existsSync(PRODUCT_X_ACCOUNTS_ROUTE_HELPERS_PATH) &&
      existsSync(PRODUCT_X_ACCOUNTS_ID_ROUTE_PATH) &&
      existsSync(PRODUCT_X_ACCOUNTS_BULK_RETRY_ROUTE_PATH) &&
      existsSync(PRODUCT_V1_CRUD_PATH) &&
      existsSync(PRODUCT_TRENDS_API_PATH) &&
      existsSync(PRODUCT_ARTICLE_FORMAT_PATH) &&
      existsSync(PRODUCT_MEDIA_HANDLER_PATH) &&
      existsSync(PRODUCT_X_API_TYPES_PATH) &&
      existsSync(PRODUCT_X_WRITE_TWIKIT_PATH);
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
    const sendDmFields = propertyNames(
      responseSchema(spec, '/x/dm/{userId}', 'post'),
    );
    const productSendDmResponseFields = productSendDmFields();
    const uploadMediaFields = propertyNames(
      responseSchema(spec, '/x/media', 'post'),
    );
    const productUploadMediaResponseFields = productUploadMediaFields();
    const updateProfileFields = propertyNames(
      responseSchema(spec, '/x/profile', 'patch'),
    );
    const productUpdateProfileResponseFields = productUpdateProfileFields();
    const updateAvatarFields = propertyNames(
      responseSchema(spec, '/x/profile/avatar', 'patch'),
    );
    const productUpdateAvatarResponseFields = productUpdateAvatarFields();
    const updateBannerFields = propertyNames(
      responseSchema(spec, '/x/profile/banner', 'patch'),
    );
    const productUpdateBannerResponseFields = productUpdateBannerFields();
    const createCommunityFields = propertyNames(
      responseSchema(spec, '/x/communities', 'post'),
    );
    const productCreateCommunityResponseFields =
      productCreateCommunityFields();
    const deleteCommunityFields = propertyNames(
      responseSchema(spec, '/x/communities/{id}', 'delete'),
    );
    const productDeleteCommunityResponseFields =
      productDeleteCommunityFields();
    const joinCommunityFields = propertyNames(
      responseSchema(spec, '/x/communities/{id}/join', 'post'),
    );
    const productJoinCommunityResponseFields = productJoinCommunityFields();
    const leaveCommunityFields = propertyNames(
      responseSchema(spec, '/x/communities/{id}/join', 'delete'),
    );
    const productLeaveCommunityResponseFields = productLeaveCommunityFields();
    const createTweetFields = propertyNames(
      responseSchema(spec, '/x/tweets', 'post'),
    );
    const productCreateTweetResponseFields = productCreateTweetFields();
    const deleteTweetFields = propertyNames(
      responseSchema(spec, '/x/tweets/{id}', 'delete'),
    );
    const productDeleteTweetResponseFields = productDeleteTweetFields();
    const likeTweetFields = propertyNames(
      responseSchema(spec, '/x/tweets/{id}/like', 'post'),
    );
    const productLikeTweetResponseFields = productLikeTweetFields();
    const unlikeTweetFields = propertyNames(
      responseSchema(spec, '/x/tweets/{id}/like', 'delete'),
    );
    const productUnlikeTweetResponseFields = productUnlikeTweetFields();
    const retweetFields = propertyNames(
      responseSchema(spec, '/x/tweets/{id}/retweet', 'post'),
    );
    const productRetweetResponseFields = productRetweetFields();
    const unretweetFields = propertyNames(
      responseSchema(spec, '/x/tweets/{id}/retweet', 'delete'),
    );
    const productUnretweetResponseFields = productUnretweetFields();
    const followUserFields = propertyNames(
      responseSchema(spec, '/x/users/{id}/follow', 'post'),
    );
    const productFollowUserResponseFields = productFollowUserFields();
    const unfollowUserFields = propertyNames(
      responseSchema(spec, '/x/users/{id}/follow', 'delete'),
    );
    const productUnfollowUserResponseFields = productUnfollowUserFields();
    const removeFollowerFields = propertyNames(
      responseSchema(spec, '/x/users/{id}/remove-follower', 'post'),
    );
    const productRemoveFollowerResponseFields = productRemoveFollowerFields();
    const productXAccountFields = productReturnFieldsFromPath(
      PRODUCT_X_ACCOUNTS_ROUTE_HELPERS_PATH,
      'formatAccount',
    );
    const productSanitizedXAccountFields = productReturnFieldsFromPath(
      PRODUCT_X_ACCOUNTS_ROUTE_HELPERS_PATH,
      'formatSanitizedAccount',
    );
    const productXAccountConnectionChallengeFields = productReturnFieldsFromPath(
      PRODUCT_X_ACCOUNTS_ROUTE_HELPERS_PATH,
      'formatConnectionChallenge',
    );
    const bulkRetryFields = propertyNames(
      responseSchema(spec, '/x/accounts/bulk-retry', 'post'),
    );
    const productBulkRetryResponseFields = productBulkRetryFields();
    const xAccountDisconnectFields = propertyNames(
      responseSchema(spec, '/x/accounts/{id}', 'delete'),
    );
    const productXAccountDisconnectResponseFields =
      productXAccountDisconnectFields();
    const accountGetResponseSchema = responseSchema(spec, '/account', 'get');
    const accountGetFields = uniqueSorted([
      ...propertyNames(accountGetResponseSchema),
      ...propertyNames(accountGetResponseSchema.properties?.['creditInfo']),
      ...propertyNames(accountGetResponseSchema.properties?.['monitorBilling']),
    ]);
    const productAccountGetResponseFields = productAccountInfoFields();
    const accountUpdateFields = propertyNames(
      responseSchema(spec, '/account', 'patch'),
    );
    const productAccountUpdateResponseFields = productAccountUpdateFields();
    const accountXIdentityFields = propertyNames(
      responseSchema(spec, '/account/x-identity', 'put'),
    );
    const productAccountXIdentityResponseFields =
      productAccountXIdentityFields();
    const subscribeFields = propertyNames(
      responseSchema(spec, '/subscribe', 'post'),
    );
    const productSubscribeResponseFields = productSubscribeFields();
    const creditsFields = propertyNames(responseSchema(spec, '/credits', 'get'));
    const productCreditsResponseFields = productCreditsFields();
    const creditsTopupFields = propertyNames(
      responseSchema(spec, '/credits/topup', 'post'),
    );
    const productCreditsTopupResponseFields = productCreditsTopupFields();
    const creditsTopupStatusFields = propertyNames(
      responseSchema(spec, '/credits/topup/status', 'get'),
    );
    const productCreditsTopupStatusResponseFields =
      productCreditsTopupStatusFields();
    const creditsQuickTopupFields = responseFieldNamesFromSchema(
      spec,
      responseSchema(spec, '/credits/quick-topup', 'post'),
    );
    const productCreditsQuickTopupResponseFields =
      productCreditsQuickTopupFields();
    const apiKeyListFields = uniqueSorted([
      ...propertyNames(responseSchema(spec, '/api-keys', 'get')),
      ...schemaPropertyNames(spec, 'ApiKey'),
    ]);
    const productApiKeyListResponseFields = productApiKeyListFields();
    const apiKeyCreateFields = propertyNames(
      responseSchema(spec, '/api-keys', 'post', '201'),
    );
    const productApiKeyCreateResponseFields = productApiKeyCreateFields();
    const apiKeyRevokeFields = propertyNames(
      responseSchema(spec, '/api-keys/{id}', 'delete'),
    );
    const productApiKeyRevokeResponseFields = productApiKeyRevokeFields();
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
        accountGetFields,
        productAccountGetResponseFields,
      ).map((field): string => `Account info has no product field ${field}.`),
      ...setDifference(
        productAccountGetResponseFields,
        accountGetFields,
      ).map((field): string => `Account info is missing ${field}.`),
      ...setDifference(
        accountUpdateFields,
        productAccountUpdateResponseFields,
      ).map(
        (field): string => `Account update has no product field ${field}.`,
      ),
      ...setDifference(
        productAccountUpdateResponseFields,
        accountUpdateFields,
      ).map((field): string => `Account update is missing ${field}.`),
      ...setDifference(
        accountXIdentityFields,
        productAccountXIdentityResponseFields,
      ).map(
        (field): string => `Account X identity has no product field ${field}.`,
      ),
      ...setDifference(
        productAccountXIdentityResponseFields,
        accountXIdentityFields,
      ).map((field): string => `Account X identity is missing ${field}.`),
      ...setDifference(
        subscribeFields,
        productSubscribeResponseFields,
      ).map((field): string => `Subscribe has no product field ${field}.`),
      ...setDifference(
        productSubscribeResponseFields,
        subscribeFields,
      ).map((field): string => `Subscribe is missing ${field}.`),
      ...setDifference(
        creditsFields,
        productCreditsResponseFields,
      ).map((field): string => `Credits has no product field ${field}.`),
      ...setDifference(
        productCreditsResponseFields,
        creditsFields,
      ).map((field): string => `Credits is missing ${field}.`),
      ...setDifference(
        creditsTopupFields,
        productCreditsTopupResponseFields,
      ).map((field): string => `Credits top-up has no product field ${field}.`),
      ...setDifference(
        productCreditsTopupResponseFields,
        creditsTopupFields,
      ).map((field): string => `Credits top-up is missing ${field}.`),
      ...setDifference(
        creditsTopupStatusFields,
        productCreditsTopupStatusResponseFields,
      ).map(
        (field): string =>
          `Credits top-up status has no product field ${field}.`,
      ),
      ...setDifference(
        productCreditsTopupStatusResponseFields,
        creditsTopupStatusFields,
      ).map((field): string => `Credits top-up status is missing ${field}.`),
      ...setDifference(
        creditsQuickTopupFields,
        productCreditsQuickTopupResponseFields,
      ).map(
        (field): string =>
          `Credits quick top-up has no product field ${field}.`,
      ),
      ...setDifference(
        productCreditsQuickTopupResponseFields,
        creditsQuickTopupFields,
      ).map((field): string => `Credits quick top-up is missing ${field}.`),
      ...setDifference(
        apiKeyListFields,
        productApiKeyListResponseFields,
      ).map((field): string => `API key list has no product field ${field}.`),
      ...setDifference(
        productApiKeyListResponseFields,
        apiKeyListFields,
      ).map((field): string => `API key list is missing ${field}.`),
      ...setDifference(
        apiKeyCreateFields,
        productApiKeyCreateResponseFields,
      ).map((field): string => `API key create has no product field ${field}.`),
      ...setDifference(
        productApiKeyCreateResponseFields,
        apiKeyCreateFields,
      ).map((field): string => `API key create is missing ${field}.`),
      ...setDifference(
        apiKeyRevokeFields,
        productApiKeyRevokeResponseFields,
      ).map((field): string => `API key revoke has no product field ${field}.`),
      ...setDifference(
        productApiKeyRevokeResponseFields,
        apiKeyRevokeFields,
      ).map((field): string => `API key revoke is missing ${field}.`),
      ...setDifference(
        openApiDmHistoryFields,
        productDmHistoryResponseFields,
      ).map((field): string => `DM history has no product field ${field}.`),
      ...setDifference(
        productDmHistoryResponseFields,
        openApiDmHistoryFields,
      ).map((field): string => `DM history is missing ${field}.`),
      ...setDifference(
        sendDmFields,
        productSendDmResponseFields,
      ).map((field): string => `Send DM has no product field ${field}.`),
      ...setDifference(
        productSendDmResponseFields,
        sendDmFields,
      ).map((field): string => `Send DM is missing ${field}.`),
      ...setDifference(
        uploadMediaFields,
        productUploadMediaResponseFields,
      ).map((field): string => `Upload media has no product field ${field}.`),
      ...setDifference(
        productUploadMediaResponseFields,
        uploadMediaFields,
      ).map((field): string => `Upload media is missing ${field}.`),
      ...setDifference(
        updateProfileFields,
        productUpdateProfileResponseFields,
      ).map(
        (field): string => `Update profile has no product field ${field}.`,
      ),
      ...setDifference(
        productUpdateProfileResponseFields,
        updateProfileFields,
      ).map((field): string => `Update profile is missing ${field}.`),
      ...setDifference(
        updateAvatarFields,
        productUpdateAvatarResponseFields,
      ).map((field): string => `Update avatar has no product field ${field}.`),
      ...setDifference(
        productUpdateAvatarResponseFields,
        updateAvatarFields,
      ).map((field): string => `Update avatar is missing ${field}.`),
      ...setDifference(
        updateBannerFields,
        productUpdateBannerResponseFields,
      ).map((field): string => `Update banner has no product field ${field}.`),
      ...setDifference(
        productUpdateBannerResponseFields,
        updateBannerFields,
      ).map((field): string => `Update banner is missing ${field}.`),
      ...setDifference(
        createCommunityFields,
        productCreateCommunityResponseFields,
      ).map(
        (field): string => `Create community has no product field ${field}.`,
      ),
      ...setDifference(
        productCreateCommunityResponseFields,
        createCommunityFields,
      ).map((field): string => `Create community is missing ${field}.`),
      ...setDifference(
        deleteCommunityFields,
        productDeleteCommunityResponseFields,
      ).map(
        (field): string => `Delete community has no product field ${field}.`,
      ),
      ...setDifference(
        productDeleteCommunityResponseFields,
        deleteCommunityFields,
      ).map((field): string => `Delete community is missing ${field}.`),
      ...setDifference(
        joinCommunityFields,
        productJoinCommunityResponseFields,
      ).map((field): string => `Join community has no product field ${field}.`),
      ...setDifference(
        productJoinCommunityResponseFields,
        joinCommunityFields,
      ).map((field): string => `Join community is missing ${field}.`),
      ...setDifference(
        leaveCommunityFields,
        productLeaveCommunityResponseFields,
      ).map((field): string => `Leave community has no product field ${field}.`),
      ...setDifference(
        productLeaveCommunityResponseFields,
        leaveCommunityFields,
      ).map((field): string => `Leave community is missing ${field}.`),
      ...setDifference(
        createTweetFields,
        productCreateTweetResponseFields,
      ).map((field): string => `Create tweet has no product field ${field}.`),
      ...setDifference(
        productCreateTweetResponseFields,
        createTweetFields,
      ).map((field): string => `Create tweet is missing ${field}.`),
      ...setDifference(
        deleteTweetFields,
        productDeleteTweetResponseFields,
      ).map((field): string => `Delete tweet has no product field ${field}.`),
      ...setDifference(
        productDeleteTweetResponseFields,
        deleteTweetFields,
      ).map((field): string => `Delete tweet is missing ${field}.`),
      ...setDifference(
        likeTweetFields,
        productLikeTweetResponseFields,
      ).map((field): string => `Like tweet has no product field ${field}.`),
      ...setDifference(
        productLikeTweetResponseFields,
        likeTweetFields,
      ).map((field): string => `Like tweet is missing ${field}.`),
      ...setDifference(
        unlikeTweetFields,
        productUnlikeTweetResponseFields,
      ).map((field): string => `Unlike tweet has no product field ${field}.`),
      ...setDifference(
        productUnlikeTweetResponseFields,
        unlikeTweetFields,
      ).map((field): string => `Unlike tweet is missing ${field}.`),
      ...setDifference(
        retweetFields,
        productRetweetResponseFields,
      ).map((field): string => `Retweet has no product field ${field}.`),
      ...setDifference(
        productRetweetResponseFields,
        retweetFields,
      ).map((field): string => `Retweet is missing ${field}.`),
      ...setDifference(
        unretweetFields,
        productUnretweetResponseFields,
      ).map((field): string => `Unretweet has no product field ${field}.`),
      ...setDifference(
        productUnretweetResponseFields,
        unretweetFields,
      ).map((field): string => `Unretweet is missing ${field}.`),
      ...setDifference(
        followUserFields,
        productFollowUserResponseFields,
      ).map((field): string => `Follow user has no product field ${field}.`),
      ...setDifference(
        productFollowUserResponseFields,
        followUserFields,
      ).map((field): string => `Follow user is missing ${field}.`),
      ...setDifference(
        unfollowUserFields,
        productUnfollowUserResponseFields,
      ).map((field): string => `Unfollow user has no product field ${field}.`),
      ...setDifference(
        productUnfollowUserResponseFields,
        unfollowUserFields,
      ).map((field): string => `Unfollow user is missing ${field}.`),
      ...setDifference(
        removeFollowerFields,
        productRemoveFollowerResponseFields,
      ).map((field): string => `Remove follower has no product field ${field}.`),
      ...setDifference(
        productRemoveFollowerResponseFields,
        removeFollowerFields,
      ).map((field): string => `Remove follower is missing ${field}.`),
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
      ...setDifference(
        schemaPropertyNames(spec, 'XAccount'),
        productXAccountFields,
      ).map((field): string => `XAccount has no product field ${field}.`),
      ...setDifference(
        productXAccountFields,
        schemaPropertyNames(spec, 'XAccount'),
      ).map((field): string => `XAccount is missing ${field}.`),
      ...setDifference(
        schemaPropertyNames(spec, 'XAccountDetail'),
        productXAccountFields,
      ).map((field): string => `XAccountDetail has no product field ${field}.`),
      ...setDifference(
        productXAccountFields,
        schemaPropertyNames(spec, 'XAccountDetail'),
      ).map((field): string => `XAccountDetail is missing ${field}.`),
      ...setDifference(
        schemaPropertyNames(spec, 'SanitizedXAccount'),
        productSanitizedXAccountFields,
      ).map(
        (field): string => `SanitizedXAccount has no product field ${field}.`,
      ),
      ...setDifference(
        productSanitizedXAccountFields,
        schemaPropertyNames(spec, 'SanitizedXAccount'),
      ).map((field): string => `SanitizedXAccount is missing ${field}.`),
      ...setDifference(
        schemaPropertyNames(spec, 'XAccountConnectionChallenge'),
        productXAccountConnectionChallengeFields,
      ).map(
        (field): string =>
          `XAccountConnectionChallenge has no product field ${field}.`,
      ),
      ...setDifference(
        productXAccountConnectionChallengeFields,
        schemaPropertyNames(spec, 'XAccountConnectionChallenge'),
      ).map(
        (field): string => `XAccountConnectionChallenge is missing ${field}.`,
      ),
      ...setDifference(
        bulkRetryFields,
        productBulkRetryResponseFields,
      ).map((field): string => `Bulk retry has no product field ${field}.`),
      ...setDifference(
        productBulkRetryResponseFields,
        bulkRetryFields,
      ).map((field): string => `Bulk retry is missing ${field}.`),
      ...setDifference(
        xAccountDisconnectFields,
        productXAccountDisconnectResponseFields,
      ).map(
        (field): string => `X account disconnect has no product field ${field}.`,
      ),
      ...setDifference(
        productXAccountDisconnectResponseFields,
        xAccountDisconnectFields,
      ).map((field): string => `X account disconnect is missing ${field}.`),
    ];

    expect(findings).toStrictEqual([]);
  });
});
