import type {
  Document as OpenApiSpec,
  Operation as OpenApiOperation,
} from "./scripts/sync-api-response-examples.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { responseExampleBlock } from "./scripts/sync-api-response-examples.mjs";

import {
  GENERATED_RESPONSE_EXAMPLES_END,
  GENERATED_RESPONSE_EXAMPLES_START,
} from "./scripts/lib/generated-response-examples";

const PROJECT_ROOT = process.cwd();
const spec = Bun.YAML.parse(
  readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8"),
) as OpenApiSpec;
const WRITE_ACTION_LIFECYCLE_SNIPPET_PATH = join(
  PROJECT_ROOT,
  "snippets/write-action-lifecycle-response.mdx",
);
const FRONTMATTER_API_PATTERN = /^api:\s*"([A-Z]+) ([^"]+)"/mu;
const RESPONSE_STATUS_PATTERN = /(?:<Tab title="|^### |^  ```(?:json|text) )(\d{3})\b/gmu;
const STATUS_CODE_PATTERN = /^\d{3}$/u;
interface ApiDoc {
  readonly file: string;
  readonly method: string;
  readonly path: string;
  readonly source: string;
}

interface ResponseStatusFinding {
  readonly file: string;
  readonly issue: string;
  readonly operation: string;
  readonly status: string;
}

const apiReferenceFiles = [
  ...new Bun.Glob("api-reference/**/*.mdx").scanSync({
    cwd: PROJECT_ROOT,
    dot: true,
  }),
].sort();

function readApiDocs(): readonly ApiDoc[] {
  return apiReferenceFiles.flatMap((file) => {
    const pageSource = readFileSync(join(PROJECT_ROOT, file), "utf8");
    const source = pageSource.includes("<WriteActionLifecycleResponse />")
      ? `${pageSource}\n${readFileSync(WRITE_ACTION_LIFECYCLE_SNIPPET_PATH, "utf8")}`
      : pageSource;
    const match = FRONTMATTER_API_PATTERN.exec(pageSource);
    if (match?.[1] === undefined || match[2] === undefined) {
      return [];
    }
    return [{ file, method: match[1].toLowerCase(), path: match[2], source }];
  });
}

function successfulResponseStatuses(operation: OpenApiOperation): readonly string[] {
  return responseStatuses(operation).filter((status): boolean => status.startsWith("2"));
}

function documentedSuccessfulResponseStatuses(source: string): readonly string[] {
  return documentedResponseStatuses(source).filter((status): boolean => status.startsWith("2"));
}

function documentedResponseStatuses(source: string): readonly string[] {
  return [...source.matchAll(RESPONSE_STATUS_PATTERN)]
    .map((match): string => match[1] ?? "")
    .sort();
}

interface GeneratedResponseTab {
  readonly id: string;
  readonly title: string;
}

function generatedResponseBlock(source: string): string | undefined {
  const start = source.indexOf(GENERATED_RESPONSE_EXAMPLES_START);
  const end = source.indexOf(GENERATED_RESPONSE_EXAMPLES_END);
  if (start === -1 || end === -1 || end < start) {
    return undefined;
  }
  return source.slice(start, end);
}

function generatedResponseTabs(source: string): readonly GeneratedResponseTab[] {
  const generated = generatedResponseBlock(source);
  if (generated === undefined) return [];

  return [...generated.matchAll(/^  <Tab title="(\d{3})" id="([^"]+)">$/gmu)].map(
    (match): GeneratedResponseTab => ({
      id: match[2] ?? "",
      title: match[1] ?? "",
    }),
  );
}

function generatedJsonResponse(
  source: string,
  status: string,
): Readonly<Record<string, unknown>> | undefined {
  const generated = generatedResponseBlock(source);
  if (generated === undefined) return undefined;

  const tabStart = generated.indexOf(`<Tab title="${status}"`);
  if (tabStart === -1) return undefined;

  const json = /```json\n(?<body>[\s\S]*?)\n    ```/u.exec(generated.slice(tabStart))?.groups?.[
    "body"
  ];
  return json === undefined
    ? undefined
    : (JSON.parse(json.replace(/^    /gmu, "")) as Readonly<Record<string, unknown>>);
}

function responseStatuses(operation: OpenApiOperation): readonly string[] {
  return Object.keys(operation.responses ?? {})
    .filter((status): boolean => STATUS_CODE_PATTERN.test(status))
    .sort();
}

function collectStatusFindings({
  docsStatusProvider,
  issuePrefix,
  spec,
  statusProvider,
}: {
  readonly docsStatusProvider: (source: string) => readonly string[];
  readonly issuePrefix: string;
  readonly spec: OpenApiSpec;
  readonly statusProvider: (operation: OpenApiOperation) => readonly string[];
}): readonly ResponseStatusFinding[] {
  const findings: ResponseStatusFinding[] = [];

  for (const apiDoc of readApiDocs()) {
    const operationLabel = `${apiDoc.method.toUpperCase()} ${apiDoc.path}`;
    const operation = spec.paths?.[apiDoc.path]?.[apiDoc.method];
    if (operation === undefined) {
      findings.push({
        file: apiDoc.file,
        issue: "API reference frontmatter does not match openapi.yaml.",
        operation: operationLabel,
        status: apiDoc.path,
      });
      continue;
    }

    const openApiStatuses = statusProvider(operation);
    const docsStatuses = docsStatusProvider(apiDoc.source);

    for (const status of openApiStatuses.filter(
      (statusCode): boolean => !docsStatuses.includes(statusCode),
    )) {
      findings.push({
        file: apiDoc.file,
        issue: `OpenAPI ${issuePrefix}response status is missing from endpoint docs.`,
        operation: operationLabel,
        status,
      });
    }

    for (const status of docsStatuses.filter(
      (statusCode): boolean => !openApiStatuses.includes(statusCode),
    )) {
      findings.push({
        file: apiDoc.file,
        issue: `Endpoint docs include a ${issuePrefix}status not present in OpenAPI.`,
        operation: operationLabel,
        status,
      });
    }
  }

  return findings;
}

describe("API success response status documentation", (): void => {
  it("generates the documented response blocks from canonical schemas", (): void => {
    expect.assertions(1);
    const mismatches = readApiDocs().flatMap((apiDoc): readonly string[] => {
      const scope = apiDoc.file.replace(/^api-reference\//u, "").replace(/\.mdx$/u, "");
      const operation = spec.paths?.[apiDoc.path]?.[apiDoc.method];
      if (operation === undefined) return [apiDoc.file];
      const generated = responseExampleBlock(spec, operation, scope);
      return generatedResponseBlock(apiDoc.source) === generatedResponseBlock(generated)
        ? []
        : [apiDoc.file];
    });
    expect(mismatches).toStrictEqual([]);
  });

  it("combines response schema fields without losing false or zero values", (): void => {
    expect.assertions(1);
    const schema = {
      allOf: [
        { type: "object", properties: { available: { type: "boolean" } } },
        { type: "object", properties: { score: { type: "integer" } } },
      ],
    };
    const responses = { "200": { content: { "application/json": { schema } } } };
    const block = responseExampleBlock({}, { responses }, "combined");
    expect(generatedJsonResponse(block, "200")).toStrictEqual({ available: false, score: 0 });
  });

  it.each([
    {
      docsStatusProvider: documentedSuccessfulResponseStatuses,
      issuePrefix: "success ",
      statusProvider: successfulResponseStatuses,
    },
    {
      docsStatusProvider: documentedResponseStatuses,
      issuePrefix: "",
      statusProvider: responseStatuses,
    },
  ])("matches $issuePrefix\u200bresponse tabs to OpenAPI", (providers): void => {
    expect.assertions(1);
    expect(collectStatusFindings({ ...providers, spec })).toStrictEqual([]);
  });

  it("keeps response tabs independent and success-first", (): void => {
    expect.assertions(2);

    const ids: string[] = [];
    const findings = readApiDocs().flatMap((apiDoc): readonly string[] => {
      const tabs = generatedResponseTabs(apiDoc.source);
      const scope = apiDoc.file.replace(/^api-reference\//u, "").replace(/\.mdx$/u, "");
      ids.push(...tabs.map((tab): string => tab.id));

      return [
        ...(/<Panel>\s*<Tabs defaultTabIndex=\{0\} sync=\{false\}>/u.test(apiDoc.source)
          ? []
          : [`${apiDoc.file}: response panel tabs are not independent.`]),
        ...(tabs[0]?.title.startsWith("2") === true
          ? []
          : [`${apiDoc.file}: first response tab is not a success status.`]),
        ...tabs
          .filter(
            (tab): boolean => tab.id !== `response-${scope.replaceAll("/", "-")}-${tab.title}`,
          )
          .map((tab): string => `${apiDoc.file}: response tab is not page-scoped: ${tab.id}`),
      ];
    });

    expect(findings).toStrictEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders every 204 response as an empty body", (): void => {
    expect.assertions(2);

    const noContentPages = readApiDocs().filter((apiDoc): boolean =>
      apiDoc.source.includes('<Tab title="204"'),
    );
    const findings = noContentPages.flatMap((apiDoc): readonly string[] =>
      /<Tab title="204"[^>]*>\s+```text\s+No response body\.\s+```/u.test(apiDoc.source)
        ? []
        : [`${apiDoc.file}: 204 tab implies a response body.`],
    );

    expect(noContentPages).toHaveLength(2);
    expect(findings).toStrictEqual([]);
  });

  it("keeps write success examples aligned with each canonical action", (): void => {
    expect.assertions(2);

    const writeDocs = readApiDocs().flatMap((apiDoc) => {
      const action = spec.paths?.[apiDoc.path]?.[apiDoc.method]?.["x-write-action"];
      return action === undefined ? [] : [{ action, apiDoc }];
    });
    const findings = writeDocs.flatMap(({ action, apiDoc }) =>
      ["200", "202"].flatMap((status): readonly string[] => {
        const example = generatedJsonResponse(apiDoc.source, status);
        return example?.["action"] === action
          ? []
          : [
              `${apiDoc.file}: ${status} action is ${String(example?.["action"])}; expected ${action}.`,
            ];
      }),
    );

    expect(writeDocs).toHaveLength(18);
    expect(findings).toStrictEqual([]);
  });

  it("keeps every write page idempotent and lifecycle-aware", (): void => {
    expect.assertions(2);

    const pages = readApiDocs().filter(
      ({ file }): boolean =>
        file.startsWith("api-reference/x-write/") && !file.endsWith("/get-write-action-status.mdx"),
    );
    const findings = pages.flatMap(({ file, source }): readonly string[] => {
      const guidance = [
        [true, '-H "Idempotency-Key:'],
        [true, '<ParamField header="Idempotency-Key" type="string" required>'],
        [true, "<WriteActionLifecycleResponse />"],
        [true, "Replay the same account, target, payload, and media after a lost response."],
        [true, "Retry only when `safeToRetry` is `true`."],
        [true, "Keep the original key for that replay."],
        [true, "Use a new key when `nextAction.requiresNewIdempotencyKey` is `true`."],
        [true, "After HTTP `429`, wait for `Retry-After`. Follow `nextAction`."],
        [false, "Safe to retry with exponential backoff."],
        [false, "Preserve the same key."],
      ] as const;
      return guidance
        .filter(([required, snippet]): boolean => source.includes(snippet) !== required)
        .map(([, snippet]): string => `${file}: incorrect retry guidance ${snippet}`);
    });

    expect(pages).toHaveLength(18);
    expect(findings).toStrictEqual([]);
  });
});
