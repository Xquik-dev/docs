import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT = process.env["XQUIK_PRODUCT_ROOT"] ?? join(PROJECT_ROOT, "..", "xquik");
const page = readFileSync(join(PROJECT_ROOT, "api-reference/drafts/create.mdx"), "utf8");
const normalizedPage = page.replaceAll(/\s+/gu, " ");
const openapi = readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8");
const routePath = join(PRODUCT_ROOT, "app/api/v1/drafts/route.ts");
const createOperation = openapi.slice(
  openapi.indexOf("      operationId: createDraft"),
  openapi.indexOf("  /drafts/{id}:", openapi.indexOf("      operationId: createDraft")),
);

describe("create tweet draft documentation", (): void => {
  it("keeps every response and authentication scheme aligned", (): void => {
    expect.assertions(1);

    expect({
      apiKeyAuth: createOperation.includes("apiKey: []"),
      oauthAuth: createOperation.includes("oauthBearer: []"),
      statuses: ["201", "400", "401", "429"].every((status) =>
        createOperation.includes(`        '${status}':`),
      ),
    }).toStrictEqual({ apiKeyAuth: true, oauthAuth: true, statuses: true });
  });

  it("documents canonical request and response fields", (): void => {
    expect.assertions(1);

    expect({
      requestFields: ["text", "topic", "goal"].every((field) =>
        page.includes(`<ParamField body="${field}"`),
      ),
      responseFields: ["id", "text", "topic", "goal", "createdAt", "updatedAt"].every((field) =>
        page.includes(`<ResponseField name="${field}"`),
      ),
      unsupportedFieldsDenied: normalizedPage.includes(
        "The response contains no thread order, media attachment, reply target, schedule, publishing status, or public tweet ID.",
      ),
    }).toStrictEqual({
      requestFields: true,
      responseFields: true,
      unsupportedFieldsDenied: true,
    });
  });

  it("preserves focused tweet draft creation search intent", (): void => {
    expect.assertions(1);

    expect(
      [
        'title: "Create a tweet draft for review with the Xquik API"',
        '"tweet draft"',
        '"create tweet draft"',
        "## Choose the tweet draft fields",
        "## Build a tweet draft review workflow",
        "## Answer tweet draft creation questions",
      ].every((snippet) => page.includes(snippet)),
    ).toBe(true);
  });

  it("separates draft storage from native X and publishing", (): void => {
    expect.assertions(1);

    expect({
      nativeBoundary: normalizedPage.includes(
        "Xquik drafts are separate from [X's native Unsent posts]",
      ),
      noEdit: normalizedPage.includes("This route provides no edit operation."),
      noIdempotency: normalizedPage.includes("This route also provides no idempotency key."),
      noPublish: normalizedPage.includes("This request does not publish a tweet."),
    }).toStrictEqual({
      nativeBoundary: true,
      noEdit: true,
      noIdempotency: true,
      noPublish: true,
    });
  });

  it("matches product validation when its source is available", (): void => {
    expect.assertions(1);

    if (!existsSync(routePath)) {
      expect(existsSync(routePath)).toBe(false);
      return;
    }

    const route = readFileSync(routePath, "utf8");
    const postStart = route.indexOf("export async function POST(");
    const postSource = route.slice(postStart);

    expect({
      goals: ["engagement", "followers", "authority", "conversation"].every((goal) =>
        route.includes(`'${goal}'`),
      ),
      invalidText: [
        "typeof body['text'] !== 'string'",
        "body['text'].length === 0",
        "body['text'].length > MAX_TEXT_LENGTH",
      ].every((snippet) => postSource.includes(snippet)),
      successStatus: postSource.includes("{ status: 201 }"),
      textLimit: route.includes("const MAX_TEXT_LENGTH = 25_000"),
      topicLimit: route.includes("const MAX_TOPIC_LENGTH = 500"),
      topicTruncation: route.includes("raw.slice(0, MAX_TOPIC_LENGTH)"),
    }).toStrictEqual({
      goals: true,
      invalidText: true,
      successStatus: true,
      textLimit: true,
      topicLimit: true,
      topicTruncation: true,
    });
  });
});
