import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const OVERVIEW = readFileSync('api-reference/overview.mdx', 'utf8');

describe('Postman integration', (): void => {
  it('publishes the official collection from the API overview', (): void => {
    expect.assertions(3);

    expect(OVERVIEW).toContain(
      '[![Run in Postman](https://run.pstmn.io/button.svg)]',
    );
    expect(OVERVIEW).toContain(
      'https://app.getpostman.com/run-collection/12709954-5ee4fae0-138a-4615-ae47-ac4be7904df2?action=collection%2Ffork&source=rip_markdown',
    );
    expect(OVERVIEW).toContain(
      'https://documenter.getpostman.com/view/12709954/2sBY4TpxXK',
    );
  });
});
