import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const page = readFileSync(
  'api-reference/account/subscription-checkout.mdx',
  'utf8',
);
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync('openapi.yaml', 'utf8');

describe('subscription checkout documentation', (): void => {
  it('requires confirmation and routes every billing state', (): void => {
    expect.assertions(1);

    expect({
      confirmationRequired: page.includes(
        'after an authenticated user confirms a billing action.',
      ),
      paymentNotAutomatic: page.includes(
        'It never completes payment automatically.',
      ),
      statusesDocumented: [
        '| No active subscription | `checkout_created` | Hosted subscription checkout |',
        '| Active or trialing subscription | `already_subscribed` | Billing portal for plan or payment management |',
        '| Past-due or incomplete subscription | `payment_issue` | Billing portal for payment recovery |',
      ].every((row) => normalizedPage.includes(row)),
      pricingBoundaryDocumented: page.includes(
        'does not quote current Twitter API pricing or X API pricing.',
      ),
      payAsYouGoPreserved:
        /funded pay-as-you-go account can\s+continue eligible work while `plan` is `inactive`\./u.test(
          page,
        ),
    }).toStrictEqual({
      confirmationRequired: true,
      paymentNotAutomatic: true,
      statusesDocumented: true,
      pricingBoundaryDocumented: true,
      payAsYouGoPreserved: true,
    });
  });

  it('keeps tier and response wording aligned with OpenAPI', (): void => {
    expect.assertions(1);

    expect({
      confirmationContract: openapi.includes(
        'user confirms. The request never completes payment by itself.',
      ),
      responseStatuses: openapi.includes(
        'enum: [checkout_created, already_subscribed, payment_issue]',
      ),
      tierValues: openapi.includes('enum: [starter, pro, business]'),
    }).toStrictEqual({
      confirmationContract: true,
      responseStatuses: true,
      tierValues: true,
    });
  });
});
