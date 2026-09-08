import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface NavigationNode {
  readonly expanded?: boolean;
  readonly group?: string;
  readonly groups?: readonly NavigationNode[];
  readonly pages?: readonly NavigationItem[];
  readonly tab?: string;
  readonly tabs?: readonly NavigationNode[];
}

type NavigationItem = string | NavigationNode;

interface ApiMdxConfig {
  readonly auth?: {
    readonly method?: string;
    readonly name?: string;
  };
  readonly server?: string;
}

interface DocsRedirect {
  readonly destination: string;
  readonly source: string;
}

interface DocsConfig {
  readonly api: {
    readonly examples?: {
      readonly languages?: readonly string[];
    };
    readonly mdx?: ApiMdxConfig;
  };
  readonly banner?: {
    readonly content?: string;
  };
  readonly navigation: NavigationNode;
  readonly redirects: readonly DocsRedirect[];
}

const X_API_GROUPS = [
  "Users",
  "Tweets",
  "Relationships",
  "Engagement",
  "Timeline & DMs",
  "Communities",
  "Lists",
] as const;

const PRIORITY_API_ROUTES = [
  "/api-reference/account/subscription-checkout",
  "/api-reference/draws/twitter-giveaway-history",
  "/api-reference/extractions/twitter-scraping-cost-estimator",
  "/api-reference/extractions/twitter-scraping-job-history",
  "/api-reference/monitors/delete-twitter-account-monitor",
  "/api-reference/monitors/twitter-account-monitor-status",
  "/api-reference/x/community-info",
  "/api-reference/x/community-members",
  "/api-reference/x/community-moderators",
  "/api-reference/x/community-search",
  "/api-reference/x/community-tweets",
  "/api-reference/x/following",
  "/api-reference/x/retweeters",
] as const;

function docsConfig(): DocsConfig {
  return JSON.parse(readFileSync("docs.json", "utf8")) as DocsConfig;
}

function objectItems(items: readonly NavigationItem[] | undefined): readonly NavigationNode[] {
  return (items ?? []).filter((item): item is NavigationNode => typeof item !== "string");
}

function findTab(config: DocsConfig, tabName: string): NavigationNode {
  const tab = (config.navigation.tabs ?? []).find((item): boolean => item.tab === tabName);

  if (tab === undefined) {
    throw new Error(`Missing navigation tab: ${tabName}`);
  }

  return tab;
}

function findGroup(parent: NavigationNode, groupName: string): NavigationNode {
  const group = (parent.groups ?? []).find((item): boolean => item.group === groupName);

  if (group === undefined) {
    throw new Error(`Missing navigation group: ${groupName}`);
  }

  return group;
}

describe("navigation default state", (): void => {
  it("uses theme fonts without loading an external Google font", (): void => {
    expect.assertions(1);

    expect(Object.hasOwn(docsConfig(), "fonts")).toBe(false);
  });

  it("keeps the sticky affiliation banner concise", (): void => {
    expect.assertions(2);

    const bannerContent = docsConfig().banner?.content;

    expect(bannerContent).toBe("**Xquik is not affiliated with or endorsed by X Corp.**");
    expect(bannerContent).not.toContain("trademarks of X Corp.");
  });

  it("keeps every X API endpoint section complete and expanded", (): void => {
    expect.assertions(2);

    const apiReferenceTab = findTab(docsConfig(), "API reference");
    const xApiGroup = findGroup(apiReferenceTab, "X API");
    const xApiSubgroups = objectItems(xApiGroup.pages);
    const collapsedGroups = xApiSubgroups
      .filter((group): boolean => group.expanded !== true)
      .map((group): string => group.group ?? "(unnamed)");

    expect(xApiSubgroups.map((group): string | undefined => group.group)).toStrictEqual([
      ...X_API_GROUPS,
    ]);
    expect(collapsedGroups).toStrictEqual([]);
  });

  it("keeps MDX API snippets pointed at the public API origin", (): void => {
    expect.assertions(4);

    const config = docsConfig();

    expect(config.api.mdx?.server).toBe("https://xquik.com/api/v1");
    expect(config.api.mdx?.auth?.method).toBe("key");
    expect(config.api.mdx?.auth?.name).toBe("x-api-key");
    expect(config.api.examples?.languages).toStrictEqual(["curl", "python", "javascript", "go"]);
  });

  it("links priority API tasks directly from the API overview", (): void => {
    expect.assertions(1);

    const overview = readFileSync("api-reference/overview.mdx", "utf8");
    const missingRoutes = PRIORITY_API_ROUTES.filter(
      (route): boolean => !overview.includes(`href="${route}"`),
    );

    expect(missingRoutes).toStrictEqual([]);
  });

  it("keeps exact redirects from normalizing into self-redirects", (): void => {
    expect.assertions(1);

    const selfRedirects = docsConfig().redirects.filter((redirect): boolean => {
      if (redirect.source.includes(":") || redirect.source.includes("*")) {
        return false;
      }

      const normalizedSource = redirect.source.replace(/\/+$/, "") || "/";
      const normalizedDestination = redirect.destination.replace(/\/+$/, "") || "/";

      return normalizedSource === normalizedDestination;
    });

    expect(selfRedirects).toStrictEqual([]);
  });

  it("redirects historical Bing crawl paths to canonical pages", (): void => {
    expect.assertions(2);

    expect(docsConfig().redirects).toContainEqual({
      source: "/overview",
      destination: "/api-reference/overview",
    });
    expect(docsConfig().redirects).toContainEqual({
      source: "/agents",
      destination: "/mcp/agent-handoff",
    });
  });

  it("preserves precise SEO routes and their historical redirects", (): void => {
    expect.assertions(4);

    expect(readFileSync("index.mdx", "utf8")).toMatch(/^noindex: true$/m);
    expect(docsConfig().redirects).toContainEqual({
      source: "/alternatives",
      destination: "/twitter-api-alternatives",
    });
    expect(docsConfig().redirects).toContainEqual({
      source: "/api-reference/x/get-user",
      destination: "/api-reference/x/twitter-profile-lookup",
    });
    expect(docsConfig().redirects).toContainEqual({
      source: "/guides/webhook-testing",
      destination: "/guides/twitter-webhook-testing",
    });
  });
});
