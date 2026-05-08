import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const DOCS_OPENAPI = join(PROJECT_ROOT, 'openapi.yaml');
const PRODUCT_OPENAPI = join(PRODUCT_ROOT, 'openapi.yaml');

describe('OpenAPI parity', (): void => {
  it('keeps docs OpenAPI aligned with product OpenAPI when available', (): void => {
    expect.assertions(1);

    if (!existsSync(PRODUCT_OPENAPI)) {
      expect(existsSync(PRODUCT_OPENAPI)).toBe(false);
      return;
    }

    const docsOpenapi = readFileSync(DOCS_OPENAPI);
    const productOpenapi = readFileSync(PRODUCT_OPENAPI);

    expect(docsOpenapi.equals(productOpenapi)).toBe(true);
  });
});
