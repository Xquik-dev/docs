import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface FooterLink {
  readonly href: string;
  readonly label: string;
}

interface DocsConfig {
  readonly footer?: {
    readonly links?: readonly {
      readonly header: string;
      readonly items: readonly FooterLink[];
    }[];
  };
  readonly redirects?: readonly {
    readonly destination: string;
    readonly source: string;
  }[];
}

const OWNERSHIP_TOKEN =
  'uda1iefj0dc1wig4yb4c3afl2m35st1ox7rufm0q4ljla00rmzazwhuyjvlgnzp2';

function docsConfig(): DocsConfig {
  return JSON.parse(readFileSync('docs.json', 'utf8')) as DocsConfig;
}

describe('public security guidance', (): void => {
  it('keeps owner verification and security contacts discoverable', (): void => {
    expect.assertions(10);

    const config = docsConfig();
    const trustLinks = config.footer?.links?.find(
      (group): boolean => group.header === 'Trust & support',
    )?.items;
    const securityPage = readFileSync('security.mdx', 'utf8');
    const securityText = readFileSync('security.txt', 'utf8');

    expect(config.redirects).toContainEqual({
      source: '/.well-known/security.txt',
      destination: '/security.txt',
    });
    expect(config.redirects).toContainEqual({
      source: '/',
      destination: '/api-reference/overview',
    });
    expect(config.redirects).toContainEqual({
      source: '/introduction',
      destination: '/api-reference/overview',
    });
    expect(trustLinks).toStrictEqual([
      { label: 'Security', href: '/security' },
      { label: 'Support', href: 'mailto:support@xquik.com' },
      { label: 'Privacy', href: 'https://xquik.com/en/privacy' },
      { label: 'Terms', href: 'https://xquik.com/en/terms' },
    ]);
    expect(securityText).toContain('Contact: mailto:security@xquik.com\n');
    expect(securityText).toContain('Policy: https://docs.xquik.com/security\n');
    expect(securityPage).toContain(
      '[security@xquik.com](mailto:security@xquik.com)',
    );
    expect(securityPage).toContain(
      'https://github.com/Xquik-dev/xquik-docs/security/advisories/new',
    );
    expect(securityPage).toContain('Progress updates at least every 14 days');
    expect(
      readFileSync(
        'gridinsoft-uda1iefj0dc1wig4yb4c3afl2m35st1ox7rufm0q4ljla00rmzazwhuyjvlgnzp2.txt',
        'utf8',
      ).trim(),
    ).toBe(OWNERSHIP_TOKEN);
  });

  it('keeps renamed SEO routes redirected to specific keyword slugs', (): void => {
    expect.assertions(1);

    expect(docsConfig().redirects).toEqual(
      expect.arrayContaining([
        {
          source: '/quickstart',
          destination: '/x-api-quickstart',
        },
        {
          source: '/guides/read-data-richness',
          destination: '/guides/tweet-profile-api-fields',
        },
        {
          source: '/guides/tweet-search-export',
          destination: '/guides/tweet-scraper-csv-export',
        },
        {
          source: '/guides/types',
          destination: '/guides/x-api-typescript-types',
        },
        {
          source: '/mpp/overview',
          destination: '/mpp/machine-payments-protocol',
        },
        {
          source: '/sdks/csharp',
          destination: '/sdks/csharp-x-api-sdk',
        },
      ]),
    );
  });

  it('normalizes trailing slashes on nested documentation URLs', (): void => {
    expect.assertions(1);

    expect(docsConfig().redirects).toEqual(
      expect.arrayContaining([
        {
          source: '/:section/:slug*/',
          destination: '/:section/:slug*',
        },
      ]),
    );
  });

  it('renders alternatives icons without decorative image elements', (): void => {
    expect.assertions(3);

    const alternatives = readdirSync('alternatives')
      .filter((file): boolean => file.endsWith('.mdx'))
      .map((file): string => readFileSync(`alternatives/${file}`, 'utf8'))
      .join('\n');
    const overview = readFileSync('twitter-api-alternatives.mdx', 'utf8');

    expect(JSON.stringify(docsConfig())).not.toContain('/logo/x-only.svg');
    expect(overview).not.toContain('icon="/logo/x-only.svg"');
    expect(alternatives).not.toContain('icon="/logo/x-only.svg"');
  });
});
