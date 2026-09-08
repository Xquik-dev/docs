import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const productRoot = process.env["XQUIK_PRODUCT_ROOT"] ?? process.env["XQUIK_ROOT"];
const source = readFileSync(new URL("api-reference/x-accounts/list.mdx", import.meta.url), "utf8");

function readProductFile(path: string): string | undefined {
  if (productRoot === undefined) return undefined;
  return readFileSync(`${productRoot}/${path}`, "utf8");
}

describe("connected X accounts list documentation", (): void => {
  it("documents every status and supported authentication method", (): void => {
    expect.assertions(1);

    expect({
      apiKeyDocumented: source.includes('<ParamField header="x-api-key" type="string">'),
      bearerDocumented: source.includes('<ParamField header="Authorization" type="string">'),
      responseTabs: [...source.matchAll(/<Tab title="(\d{3})"/gu)].map(([, status]) => status),
      sessionCookieClaim: source.toLowerCase().includes("session cookie authentication"),
    }).toStrictEqual({
      apiKeyDocumented: true,
      bearerDocumented: true,
      responseTabs: ["200", "400", "401", "429"],
      sessionCookieClaim: false,
    });
  });

  it("uses focused account-management phrases without broad search intent", (): void => {
    expect.assertions(1);

    const frontmatter = source.slice(0, source.indexOf("---", 4) + 3);

    expect({
      focusedTitle: frontmatter.includes("Connected X accounts API, health & write readiness"),
      keywordsPresent: [
        "Twitter account API",
        "Twitter API account",
        "X account health",
        "X account status",
        "multiple Twitter accounts",
      ].every((keyword) => frontmatter.includes(keyword)),
      publicSearchBoundary: source.includes("It does not search public Twitter\naccounts."),
      vagueDescription: /data|details|information/iu.test(frontmatter),
    }).toStrictEqual({
      focusedTitle: true,
      keywordsPresent: true,
      publicSearchBoundary: true,
      vagueDescription: false,
    });
  });

  it("explains scope, ordering, pagination, and account identifiers", (): void => {
    expect.assertions(1);

    expect({
      accountScoped: source.includes(
        "The response contains only connections owned by the authenticated Xquik",
      ),
      earliestFirst: source.includes(
        "Accounts are ordered by `createdAt` from earliest to latest.",
      ),
      emptyList: source.includes('receives `{"accounts": [], "hasMore": false}`'),
      pagination: source.includes(
        "Pass `nextCursor` unchanged as `cursor` while `hasMore` is true.",
      ),
      legacyCompatible: source.includes(
        "Legacy calls without `limit` or `cursor` return up to 10,000 connections.",
      ),
      xUserIdBoundary: source.includes(
        "Do not send `xUserId` where a write endpoint requires `accountId`.",
      ),
    }).toStrictEqual({
      accountScoped: true,
      earliestFirst: true,
      emptyList: true,
      legacyCompatible: true,
      pagination: true,
      xUserIdBoundary: true,
    });
  });

  it("maps every health value to a concrete write decision", (): void => {
    expect.assertions(1);

    expect({
      healthRows: [
        "healthy",
        "recovering",
        "temporaryIssue",
        "needsReauth",
        "locked",
        "suspended",
      ].every((health) => source.replaceAll(/[ \t]+/gu, " ").includes(`| \`${health}\` |`)),
      statusIsInsufficient: source.includes("The `status` field alone is insufficient."),
      retryBoundary: source.includes(
        "Use [Bulk Retry](/api-reference/x-accounts/bulk-retry) only for eligible temporary\nfailures.",
      ),
    }).toStrictEqual({
      healthRows: true,
      retryBoundary: true,
      statusIsInsufficient: true,
    });
  });

  it("remains synchronized with the optional product implementation", (): void => {
    expect.assertions(1);

    const handler = readProductFile("lib/x-accounts/accounts-route.ts");
    const route = readProductFile("app/api/v1/x/accounts/route.ts");

    expect({
      accountScopedQuery:
        route === undefined ||
        (route.includes("eq(connectedXAccounts.userId, userId)") &&
          route.includes(".where(and(...conditions))")),
      createdAscending:
        route === undefined ||
        (route.includes("connectedXAccounts.createdAt} ASC") &&
          route.includes("connectedXAccounts.id} ASC")),
      cursorBounded:
        route === undefined ||
        (route.includes("'asc'") && route.includes("rows.limit(query.fetchCount)")),
      listUsesV1Auth:
        route === undefined || route.includes("withV1Auth(request, 'Failed to list X accounts'"),
      optionalCookieTimestamp:
        handler === undefined || handler.includes("row.cookiesObtainedAt?.toISOString()"),
      resultMapsPage:
        handler === undefined ||
        handler.includes("accounts: page.items.map((row) => formatAccount(row))"),
    }).toStrictEqual({
      accountScopedQuery: true,
      createdAscending: true,
      cursorBounded: true,
      listUsesV1Auth: true,
      optionalCookieTimestamp: true,
      resultMapsPage: true,
    });
  });
});
