import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const page = readFileSync(
  join(PROJECT_ROOT, 'api-reference/support/list.mdx'),
  'utf8',
);
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync(join(PROJECT_ROOT, 'openapi.yaml'), 'utf8');
const TICKET_SOURCE_PATH = join(PRODUCT_ROOT, 'lib/support/tickets.ts');
const listOperation = openapi.slice(
  openapi.indexOf('      operationId: listTickets'),
  openapi.indexOf('  /support/tickets/{id}:'),
);

describe('support ticket list documentation', (): void => {
  it('documents the exact summary fields and omits attachments', (): void => {
    expect.assertions(1);

    const description =
      /^description: "(?<description>[^"]+)"$/mu.exec(page)?.groups?.[
        'description'
      ] ?? '';

    expect({
      attachmentClaimRemoved: !description.includes('attachment'),
      createdAt: page.includes('| Opened time | `createdAt` |'),
      fullDetailBoundary: normalizedPage.includes(
        'when you need message bodies or attachment metadata.',
      ),
      messageCount: page.includes(
        '| Conversation size | `messageCount` |',
      ),
      publicId: page.includes('| Ticket ID | `publicId` |'),
      status: page.includes('| Current state | `status` |'),
      subject: page.includes('| Reported issue | `subject` |'),
      updatedAt: page.includes('| Latest activity | `updatedAt` |'),
    }).toStrictEqual({
      attachmentClaimRemoved: true,
      createdAt: true,
      fullDetailBoundary: true,
      messageCount: true,
      publicId: true,
      status: true,
      subject: true,
      updatedAt: true,
    });
  });

  it('keeps response and status guidance aligned with OpenAPI', (): void => {
    expect.assertions(1);

    expect({
      apiKeyAuth: listOperation.includes('- apiKey: []'),
      documentedApiKey: normalizedPage.includes(
        'Your Xquik API key. Generate one from the',
      ),
      documentedBearer: normalizedPage.includes(
        'An OAuth bearer token formatted as `Bearer YOUR_TOKEN`.',
      ),
      noSessionCookieClaim: !normalizedPage.includes(
        'Session cookie authentication',
      ),
      oauthAuth: listOperation.includes('- oauthBearer: []'),
      statuses: ['200', '401', '429'].every((status) =>
        listOperation.includes(`        '${status}':`),
      ),
      ticketStates: openapi.includes(
        'enum: [open, in_progress, resolved, closed]',
      ),
    }).toStrictEqual({
      apiKeyAuth: true,
      documentedApiKey: true,
      documentedBearer: true,
      noSessionCookieClaim: true,
      oauthAuth: true,
      statuses: true,
      ticketStates: true,
    });
  });

  it('documents the current limit and recent-update ordering', (): void => {
    expect.assertions(1);

    expect({
      documentedLimit: page.includes('returns up to 200 tickets.'),
      documentedOrder: normalizedPage.includes(
        'It sorts the newest `updatedAt` value first.',
      ),
    }).toStrictEqual({
      documentedLimit: true,
      documentedOrder: true,
    });
  });

  it('matches product ordering when product source is available', (): void => {
    expect.assertions(1);

    if (!existsSync(TICKET_SOURCE_PATH)) {
      expect(existsSync(TICKET_SOURCE_PATH)).toBe(false);
      return;
    }

    const ticketSource = readFileSync(TICKET_SOURCE_PATH, 'utf8');
    const listStart = ticketSource.indexOf('async function listTickets(');
    const listEnd = ticketSource.indexOf(
      '\nasync function getTicketWithMessages(',
      listStart,
    );
    const listTicketsSource = ticketSource.slice(listStart, listEnd);

    expect({
      listFunctionFound: listStart >= 0 && listEnd > listStart,
      productLimit: listTicketsSource.includes('.limit(MAX_TICKETS)'),
      productOrder: listTicketsSource.includes(
        '.orderBy(desc(supportTickets.updatedAt))',
      ),
    }).toStrictEqual({
      listFunctionFound: true,
      productLimit: true,
      productOrder: true,
    });
  });

  it('preserves focused support ticket API search intent', (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "Support Ticket API: List Xquik Tickets & Status"',
        '"support ticket API"',
        '"list support tickets"',
        '"support ticket status"',
        '## Read the Support Ticket Inventory',
        '## Build a Support Ticket Review Queue',
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });
});
