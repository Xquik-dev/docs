import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('api-reference/styles/delete.mdx', 'utf8');

describe('delete writing style documentation', (): void => {
  it('keeps deletion scope separate from live X content', (): void => {
    expect.assertions(1);

    expect({
      cacheScopeDocumented: source.includes(
        "This route deletes Xquik's cached analysis only.",
      ),
      liveTweetsPreserved: /The source tweets remain\s+on X\./u.test(source),
      restoreRouteDenied:
        /does not provide a restore endpoint for deleted\s+style profiles/iu.test(
          source,
        ),
    }).toStrictEqual({
      cacheScopeDocumented: true,
      liveTweetsPreserved: true,
      restoreRouteDenied: true,
    });
  });

  it('documents the empty 204 response before parsing errors', (): void => {
    expect.assertions(1);

    expect({
      emptyBodyDocumented: source.includes('The response body is empty.'),
      parsesOnlyErrors: source.includes('if (response.status !== 204)'),
      successJsonParsingForbidden:
        /Do not call\s+`response\.json\(\)` after a successful request\./u.test(
          source,
        ),
    }).toStrictEqual({
      emptyBodyDocumented: true,
      parsesOnlyErrors: true,
      successJsonParsingForbidden: true,
    });
  });
});
