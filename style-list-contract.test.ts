import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('api-reference/styles/list.mdx', 'utf8');
const description = /^description:\s*"([^"]+)"$/mu.exec(source)?.[1] ?? '';

describe('list writing styles documentation', (): void => {
  it('limits metadata to fields returned by the summary contract', (): void => {
    expect.assertions(1);

    expect({
      descriptionPresent: description.length > 0,
      unsupportedTimeClaim: /creation|update time/iu.test(description),
      unsupportedToneClaim: /tone/iu.test(description),
    }).toStrictEqual({
      descriptionPresent: true,
      unsupportedTimeClaim: false,
      unsupportedToneClaim: false,
    });
  });

  it('distinguishes summary fields from detailed style content', (): void => {
    expect.assertions(1);

    expect({
      emptyListDocumented: source.includes('"styles": []'),
      noCursorDocumented: source.includes(
        'The response contains no pagination cursor.',
      ),
      sampleCountDocumented:
        /It only\s+counts the tweet samples stored for this writing-style profile\./u.test(
          source,
        ),
      summaryOnlyDocumented: source.includes(
        'This endpoint returns summaries only.',
      ),
    }).toStrictEqual({
      emptyListDocumented: true,
      noCursorDocumented: true,
      sampleCountDocumented: true,
      summaryOnlyDocumented: true,
    });
  });
});
