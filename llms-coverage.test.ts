import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const DOCS_ORIGIN = "https://docs.xquik.com";
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\((?:https:\/\/docs\.xquik\.com)?\/([^\s)]*)\)/gu;

interface NavigationGroup {
  readonly anchors?: readonly NavigationItem[];
  readonly groups?: readonly NavigationItem[];
  readonly pages?: readonly NavigationItem[];
  readonly tabs?: readonly NavigationItem[];
}

type NavigationItem = string | NavigationGroup;

interface DocsConfig {
  readonly navigation: NavigationGroup;
}

function flattenNavigationPages(item: NavigationItem): readonly string[] {
  if (typeof item === "string") {
    return [normalizePagePath(item)];
  }

  return [
    ...(item.anchors ?? []),
    ...(item.groups ?? []),
    ...(item.pages ?? []),
    ...(item.tabs ?? []),
  ].flatMap(flattenNavigationPages);
}

function normalizePagePath(page: string): string {
  const normalizedPage = page
    .replace(/^\/+/u, "")
    .replace(/\.mdx?$/u, "")
    .replace(/#.*$/u, "");

  return normalizedPage === "index" ? "" : normalizedPage;
}

function documentedLlmsPages(source: string): ReadonlySet<string> {
  return new Set(
    [...source.matchAll(MARKDOWN_LINK_PATTERN)].map((match): string =>
      normalizePagePath(match[1] ?? ""),
    ),
  );
}

describe("llms.txt coverage", (): void => {
  it("lists every docs.json navigation page as a markdown link", (): void => {
    expect.assertions(2);

    const docsConfig = JSON.parse(readFileSync("docs.json", "utf8")) as DocsConfig;
    const expectedPages = flattenNavigationPages(docsConfig.navigation);
    const llms = readFileSync("llms.txt", "utf8");
    const actualPages = documentedLlmsPages(llms);
    const missingPages = expectedPages
      .filter((page): boolean => !actualPages.has(page))
      .map((page): string => `${DOCS_ORIGIN}/${page}`);
    const sectionContent = llms
      .slice(llms.indexOf("\n## "))
      .split("\n")
      .filter((line): boolean => line !== "" && !line.startsWith("## "));

    expect(missingPages).toStrictEqual([]);
    expect(sectionContent.every((line): boolean => /^- \[[^\]]+\]\([^)]+\)$/u.test(line))).toBe(
      true,
    );
  });
});
