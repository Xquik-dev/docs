import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const PRODUCT_ROOT =
  process.env['XQUIK_PRODUCT_ROOT'] ?? join(PROJECT_ROOT, '..', 'xquik');
const page = readFileSync('api-reference/support/list.mdx', 'utf8');
const normalizedPage = page.replaceAll(/\s+/gu, ' ');
const openapi = readFileSync('openapi.yaml', 'utf8');
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
        'It never returns message bodies or attachment metadata.',
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
      oauthAuth: listOperation.includes('- oauthBearer: []'),
      statuses: ['200', '401', '429'].every((status) =>
        listOperation.includes(`        '${status}':`),
      ),
      ticketStates: openapi.includes(
        'enum: [open, in_progress, resolved, closed]',
      ),
    }).toStrictEqual({
      apiKeyAuth: true,
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

    expect({
      productLimit: ticketSource.includes('const MAX_TICKETS = 200;'),
      productOrder: ticketSource.includes(
        '.orderBy(desc(supportTickets.updatedAt))',
      ),
    }).toStrictEqual({
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
