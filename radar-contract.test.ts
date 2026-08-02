import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

const RADAR_PAGE = read('api-reference/radar/list.mdx');
const TYPES_GUIDE = read('guides/x-api-typescript-types.mdx');
const OPENAPI = read('openapi.yaml');
const NORMALIZED_RADAR_PAGE = RADAR_PAGE.replaceAll(/\s+/gu, ' ');
const NORMALIZED_TYPES_GUIDE = TYPES_GUIDE.replaceAll(/\s+/gu, ' ');

const REQUIRED_RADAR_PAGE_COPY = [
  'Social Media Monitoring API for Trending Topics',
  '## What Is a Social Media Monitoring API?',
  '## Can Radar Track Brand Mentions and Sentiment?',
  '`items[].source` and `items[].sourceId`',
  'Interpret the fields documented below for that source.',
  'The `score` value measures relevance, not sentiment.',
  'Radar is not a social listening API for every major social platform.',
  'provides no keyword search volume or long-term history.',
  'Apply the relevant source, category, region, and time window to each request.',
  '## Is Radar Real-Time for Monitoring Trending Topics?',
  'Start each scheduled poll without `after`.',
  'The contract guarantees neither cross-poll cursor lifetime nor snapshots.',
  'Deduplicate records by `items[].id`.',
  'Never use an item ID to order separate polling runs.',
  '<ParamField header="x-api-key" type="string">',
  'server-rendered post fields',
  '`html` for current rich items',
  '`json` and `rss` identify legacy rows',
  '`und` means the source did not identify a language.',
  '`estimatedUpvotes` and `estimatedDownvotes` as estimates',
  'Comment bodies are not returned.',
  '`xHandle` | Founder X username without `@`',
  '`metadata.rank` is the revenue rank reported by the source',
  'The top-level `imageUrl` contains the startup logo',
  '"source": "github"',
  '"sourceId": "github_12345"',
] as const;

const REQUIRED_OPENAPI_COPY = [
  'subredditSubscribers?, sourceFormat, score?, upvoteRatio?',
  'estimatedUpvotes?, estimatedDownvotes?, numberComments?',
  'Comment bodies are not included.',
  'enum: [html, json, rss]',
  'Current items use html.',
  'foundedDate?, googleSearchImpressionsLast30Days?',
  'profitMarginLast30Days?, rank?, revenuePerVisitor?',
  'For the startup growth source, xHandle is the founder\'s X username',
  'description: Source image. Startup growth items return the logo here.',
] as const;

describe('Radar documentation contract', (): void => {
  it('documents rich Reddit and startup growth metadata', (): void => {
    expect.assertions(REQUIRED_RADAR_PAGE_COPY.length + 2);

    for (const snippet of REQUIRED_RADAR_PAGE_COPY) {
      expect(NORMALIZED_RADAR_PAGE).toContain(snippet);
    }
    expect(NORMALIZED_TYPES_GUIDE).toContain(
      'Reddit metadata can include post text, links, and media. It can also include public scores, estimated vote counts, and comment counts.',
    );
    expect(NORMALIZED_TYPES_GUIDE).toContain(
      'Startup growth metadata can include reported growth and revenue. Company details and a founder `xHandle` appear when available.',
    );
  });

  it('locks the machine-readable metadata contract', (): void => {
    expect.assertions(REQUIRED_OPENAPI_COPY.length);

    for (const snippet of REQUIRED_OPENAPI_COPY) {
      expect(OPENAPI).toContain(snippet);
    }
  });

  it('rejects the retired example source identifier', (): void => {
    expect.assertions(1);

    expect(RADAR_PAGE).not.toContain('"source": "dev"');
  });
});
