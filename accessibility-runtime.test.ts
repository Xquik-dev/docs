import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('Mintlify accessibility overrides', (): void => {
  it('uses copyable API examples without the interactive playground', (): void => {
    expect.assertions(1);

    const docsConfig = JSON.parse(readFileSync('docs.json', 'utf8')) as {
      readonly api?: {
        readonly playground?: { readonly display?: string };
      };
    };

    expect(docsConfig.api?.playground?.display).toBe('simple');
  });

  it('avoids global custom JavaScript during React hydration', (): void => {
    expect.assertions(1);

    expect(readdirSync('.').filter((file) => file.endsWith('.js'))).toStrictEqual(
      [],
    );
  });

  it('uses an AA-safe light-theme label color', (): void => {
    expect.assertions(16);

    const source = readFileSync('custom.css', 'utf8');

    expect(source).toContain('html:not(.dark) #pagination a span');
    expect(source).toContain('html:not(.dark) footer a');
    expect(source).toContain('color: #5f5d5c !important;');
    expect(source).toContain('html:not(.dark) #search-bar-entry');
    expect(source).toContain('html:not(.dark) #search-bar-entry *');
    expect(source).toContain('html:not(.dark) .text-stone-400');
    expect(source).toContain('html:not(.dark) [class~="peer/title"]');
    expect(source).toContain('html:not(.dark) p.truncate.font-medium');
    expect(source).toContain('html:not(.dark) .method-pill');
    expect(source).toContain('html:not(.dark) .method-nav-pill span');
    expect(source).toContain('html:not(.dark) .tryit-button');
    expect(source).toContain('background-color: #116b46 !important;');
    expect(source).toContain(
      'html:not(.dark) [data-component-part="field-required-pill"]',
    );
    expect(source).toContain('@supports (content-visibility: auto)');
    expect(source).toContain('content-visibility: auto;');
    expect(source).toContain('contain-intrinsic-size: auto 320px;');
  });
});
