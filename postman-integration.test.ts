import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const OVERVIEW = readFileSync("api-reference/overview.mdx", "utf8");
const HOME = readFileSync("index.mdx", "utf8");
const RUN_BUTTON = "[![Run in Postman](https://run.pstmn.io/button.svg)]";
const RUN_URL =
  "https://app.getpostman.com/run-collection/12709954-5ee4fae0-138a-4615-ae47-ac4be7904df2?action=collection%2Ffork&source=rip_markdown";

describe("Postman integration", (): void => {
  it("publishes the official collection from public entry pages", (): void => {
    expect.assertions(5);

    expect(HOME).toContain(RUN_BUTTON);
    expect(HOME).toContain(RUN_URL);
    expect(OVERVIEW).toContain(RUN_BUTTON);
    expect(OVERVIEW).toContain(RUN_URL);
    expect(OVERVIEW).toContain("https://documenter.getpostman.com/view/12709954/2sBY4TpxXK");
  });
});
