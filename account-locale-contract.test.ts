import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const getAccountSource = readFileSync("api-reference/account/get.mdx", "utf8");
const updateAccountSource = readFileSync("api-reference/account/update.mdx", "utf8");

describe("account locale documentation", (): void => {
  it("limits the update page to the canonical locale contract", (): void => {
    expect.assertions(1);

    expect({
      acceptedLocalesDocumented: ["en", "tr", "es"].every((locale) =>
        updateAccountSource.includes(`\`${locale}\``),
      ),
      frontmatterClaimsProfileSettings: /^(?:title|description):.*profile settings.*$/imu.test(
        updateAccountSource,
      ),
      successBodyDocumented: updateAccountSource.includes(
        'A successful request returns `{ "success": true }`.',
      ),
    }).toStrictEqual({
      acceptedLocalesDocumented: true,
      frontmatterClaimsProfileSettings: false,
      successBodyDocumented: true,
    });
  });

  it("does not claim that account details return the saved locale", (): void => {
    expect.assertions(1);

    expect({
      getDescriptionClaimsLocale: /^description:.*\blocale\b.*$/imu.test(getAccountSource),
      updateExplainsGetScope: /It does not return the\s+saved locale\./u.test(updateAccountSource),
    }).toStrictEqual({
      getDescriptionClaimsLocale: false,
      updateExplainsGetScope: true,
    });
  });
});
