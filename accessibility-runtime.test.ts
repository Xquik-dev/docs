import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Mintlify accessibility overrides", (): void => {
  it("uses copyable API examples without the interactive playground", (): void => {
    expect.assertions(1);

    const docsConfig = JSON.parse(readFileSync("docs.json", "utf8")) as {
      readonly api?: {
        readonly playground?: { readonly display?: string };
      };
    };

    expect(docsConfig.api?.playground?.display).toBe("simple");
  });

  it("avoids global custom JavaScript during React hydration", (): void => {
    expect.assertions(1);

    expect(readdirSync(".").filter((file) => file.endsWith(".js"))).toStrictEqual([]);
  });

  it("uses an AA-safe light-theme label color", (): void => {
    expect.assertions(16);

    const source = readFileSync("custom.css", "utf8");

    expect(source).toContain("html:not(.dark) #pagination a span");
    expect(source).toContain("html:not(.dark) footer a");
    expect(source).toContain("color: #5f5d5c !important;");
    expect(source).toContain("html:not(.dark) #search-bar-entry");
    expect(source).toContain("html:not(.dark) #search-bar-entry *");
    expect(source).toContain("html:not(.dark) .text-stone-400");
    expect(source).toContain('html:not(.dark) [class~="peer/title"]');
    expect(source).toContain("html:not(.dark) p.truncate.font-medium");
    expect(source).toContain("html:not(.dark) #navbar button span");
    expect(source).toContain("html:not(.dark) .method-pill");
    expect(source).toContain("html:not(.dark) .tryit-button");
    expect(source).toContain("background-color: #116b46 !important;");
    expect(source).toContain('html:not(.dark) [data-component-part="field-required-pill"]');
    expect(source).toContain("@supports (content-visibility: auto)");
    expect(source).toContain("content-visibility: auto;");
    expect(source).toContain("contain-intrinsic-size: auto 320px;");
  });

  it("keeps the wordmark readable without distorting its ratio", (): void => {
    expect.assertions(5);

    const source = readFileSync("custom.css", "utf8");
    const lightLogo = readFileSync("logo/light.svg", "utf8");
    const darkLogo = readFileSync("logo/dark.svg", "utf8");
    const logoRule = source.match(/\.nav-logo\s*\{([^}]*)\}/u)?.[1] ?? "";

    expect(logoRule).toContain("aspect-ratio: 64 / 29;");
    expect(logoRule).toContain("block-size: 2.25rem !important;");
    expect(logoRule).toContain("inline-size: auto !important;");
    expect(lightLogo).toContain('width="64" height="29"');
    expect(darkLogo).toContain('width="64" height="29"');
  });

  it("marks comparison table columns and rows as headers", (): void => {
    expect.assertions(6);

    const comparisonTables = [
      ["guides/composio-migration.mdx", 6],
      ["mpp/machine-payments-protocol.mdx", 7],
    ] as const;

    for (const [file, rowHeaderCount] of comparisonTables) {
      const source = readFileSync(file, "utf8");

      expect(source).toContain('<caption className="sr-only">');
      expect(source).toContain('<th scope="col">Capability</th>');
      expect(source.match(/<th scope="row">/gu)).toHaveLength(rowHeaderCount);
    }
  });

  it("uses descriptive anchor text for the Xquik MCP endpoint", (): void => {
    expect.assertions(2);

    const composioGuide = readFileSync("guides/composio-migration.mdx", "utf8");

    expect(composioGuide).toContain('<a href="/mcp/overview">Xquik API MCP server</a>');
    expect(composioGuide).not.toContain("<code>https://xquik.com/mcp</code>");
  });

  it("keeps API method badges above WCAG AA contrast", (): void => {
    expect.assertions(9);

    const source = readFileSync("custom.css", "utf8");

    expect(source).toContain('span[class*="bg-[#3064E3]"]');
    expect(source).toContain('span[class*="bg-[#CB3A32]"]');
    expect(source).toContain('span[class*="bg-[#2AB673]"]');
    expect(source).toContain('span[class*="bg-[#DA622B]"]');
    expect(source).toContain('span[class*="bg-[#C28C30]"]');
    expect(source).toContain("color: #ffffff !important;");
    expect(source).toContain("background-color: #147a4b !important;");
    expect(source).toContain("background-color: #a9471b !important;");
    expect(source).toContain("background-color: #855d12 !important;");
  });

  it("reserves related API link accordions before hydration", (): void => {
    expect.assertions(5);

    const css = readFileSync("custom.css", "utf8");
    const snippets = [
      "snippets/x-audience-community-api-links.mdx",
      "snippets/x-connected-account-api-links.mdx",
      "snippets/x-tweet-read-api-links.mdx",
    ];

    expect(css).toContain(".related-api-links");
    expect(css).toContain("min-height: 3rem;");
    for (const file of snippets) {
      expect(readFileSync(file, "utf8")).toContain('<div className="related-api-links">');
    }
  });

  it("avoids focusable links inside linked Card overlays", (): void => {
    expect.assertions(1);

    const source = readFileSync("sdks.mdx", "utf8");
    const linkedCards = [
      ...source.matchAll(
        /<Card\b[^>]*\bhref=(?:"[^"]*"|'[^']*'|\{[^}]*\})[^>]*>([\s\S]*?)<\/Card>/gu,
      ),
    ];
    const nestedLinkCards = linkedCards.filter((match): boolean =>
      /\[[^\]]+\]\([^)]+\)/u.test(match[1] ?? ""),
    );

    expect(nestedLinkCards).toStrictEqual([]);
  });
});
