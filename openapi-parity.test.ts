import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT = process.env["XQUIK_ROOT"] ?? join(PROJECT_ROOT, "..", "xquik");
const DOCS_OPENAPI = join(PROJECT_ROOT, "openapi.yaml");
const PRODUCT_OPENAPI = join(PRODUCT_ROOT, "openapi.yaml");

describe("OpenAPI parity", (): void => {
  it("keeps docs OpenAPI aligned with product OpenAPI", (): void => {
    expect.assertions(1);

    const docsOpenapi = Bun.YAML.parse(readFileSync(DOCS_OPENAPI, "utf8"));
    const productOpenapi = Bun.YAML.parse(readFileSync(PRODUCT_OPENAPI, "utf8"));

    expect(docsOpenapi).toStrictEqual(productOpenapi);
  });
});
