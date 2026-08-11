import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface OpenApiCursorContract {
  readonly components: {
    readonly parameters: {
      readonly After: { readonly name: string };
    };
  };
}

const PLATFORM_AFTER_URL =
  /\/api\/v1\/(?:draws|events|extractions)(?:\/[^?\s"'`]*)?\?[^\s"'`]*\bafter=/u;
const SDK_AFTER_PARAMETER = /\bafter\s*:|\bAfter\s*=|\.after\(|--after\b/u;

function publicMarkdownFiles(): readonly string[] {
  return [...new Bun.Glob('**/*.{md,mdx}').scanSync({ cwd: '.' })].filter(
    (file) => !file.startsWith('node_modules/'),
  );
}

describe('platform cursor contract', (): void => {
  it('keeps cursor primary while preserving distinct Radar and draft names', (): void => {
    expect.assertions(5);

    const files = publicMarkdownFiles();
    const stalePlatformUrls = files.filter((file) =>
      PLATFORM_AFTER_URL.test(readFileSync(file, 'utf8')),
    );
    const staleSdkParameters = files
      .filter((file) => file.startsWith('sdks/'))
      .filter((file) => SDK_AFTER_PARAMETER.test(readFileSync(file, 'utf8')));
    const openApi = Bun.YAML.parse(
      readFileSync('openapi.yaml', 'utf8'),
    ) as OpenApiCursorContract;

    expect(stalePlatformUrls).toStrictEqual([]);
    expect(staleSdkParameters).toStrictEqual([]);
    expect(openApi.components.parameters.After.name).toBe('cursor');
    expect(readFileSync('api-reference/radar/list.mdx', 'utf8')).toContain(
      '<ParamField query="after" type="string">',
    );
    expect(readFileSync('api-reference/drafts/list.mdx', 'utf8')).toContain(
      '<ParamField query="afterCursor" type="string">',
    );
  });
});
