import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import {
  GENERATED_RESPONSE_EXAMPLES_END as END_MARKER,
  GENERATED_RESPONSE_EXAMPLES_START as START_MARKER,
  stripGeneratedResponseExamples,
} from "./lib/generated-response-examples.ts";

/**
 * @typedef {{example?: unknown, const?: unknown, default?: unknown, enum?: unknown[],
 * $ref?: string, allOf?: Schema[], oneOf?: Schema[], anyOf?: Schema[], items?: Schema,
 * properties?: Record<string, Schema>, required?: string[], type?: string, format?: string}} Schema
 * @typedef {{schema?: Schema, example?: unknown, examples?: Record<string, {value?: unknown}>}} Media
 * @typedef {{$ref?: string, content?: Record<string, Media>, description?: string}} Response
 * @typedef {{responses?: Record<string, Response>, 'x-write-action'?: string}} Operation
 * @typedef {{paths?: Record<string, Record<string, Operation>>}} Document
 */

const PROJECT_ROOT = process.cwd();
const API_PATTERN = /^api: "([A-Z]+) ([^"]+)"$/mu;
const HTTP_METHODS = new Set(["delete", "get", "head", "options", "patch", "post", "put"]);
const ERROR_EXAMPLE_KEYS = [
  "error",
  "message",
  "code",
  "status",
  "retryAfter",
  "charged",
  "chargedCredits",
  "retryable",
  "safeToRetry",
  "writeActionId",
  "statusUrl",
];

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @param {unknown} document @param {string} reference @returns {unknown} */
function resolveReference(document, reference) {
  if (!reference.startsWith("#/")) {
    throw new Error(`Only local OpenAPI references are supported: ${reference}`);
  }

  return reference
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce(
      (value, segment) =>
        value !== null && typeof value === "object" ? Reflect.get(value, segment) : undefined,
      document,
    );
}

/** @param {unknown} document @param {Schema | undefined} schema @param {number} depth @param {Set<string>} visited @returns {unknown} */
function exampleFromSchema(document, schema, depth = 0, visited = new Set()) {
  if (schema === undefined || depth > 7) {
    return {};
  }
  const explicit = [schema.example, schema.const, schema.default, schema.enum?.[0]].find(
    (value) => value !== undefined,
  );
  if (explicit !== undefined) {
    return explicit;
  }

  if (schema.$ref !== undefined) {
    if (visited.has(schema.$ref)) {
      return {};
    }
    return exampleFromSchema(
      document,
      /** @type {Schema | undefined} */ (resolveReference(document, schema.$ref)),
      depth + 1,
      new Set(visited).add(schema.$ref),
    );
  }

  /** @param {Schema | undefined} child @returns {unknown} */
  const next = (child) => exampleFromSchema(document, child, depth + 1, visited);
  if (schema.allOf !== undefined) {
    return schema.allOf
      .map(next)
      .reduce(
        (result, value) =>
          isRecord(result) && isRecord(value) ? { ...result, ...value } : (value ?? result),
        {},
      );
  }
  const variant = schema.oneOf?.[0] ?? schema.anyOf?.[0];
  if (variant !== undefined) {
    return next(variant);
  }

  if (schema.type === "array") {
    return [next(schema.items)];
  }
  if (schema.type === "object" || schema.properties !== undefined) {
    const properties = Object.entries(schema.properties ?? {});
    const required = new Set(schema.required ?? []);
    const selected = properties.filter(([name]) => required.has(name));
    const fields = (selected.length > 0 ? selected : properties).slice(0, 12);
    return Object.fromEntries(fields.map(([name, property]) => [name, next(property)]));
  }
  if (schema.type === "boolean") {
    return false;
  }
  if (schema.type === "integer" || schema.type === "number") {
    return 0;
  }
  if (schema.format === "date-time") {
    return "2026-08-01T09:00:00.000Z";
  }
  if (schema.format === "uri" || schema.format === "url") {
    return "https://example.com/resource";
  }
  return "<string>";
}

/** @param {unknown} value @param {number} maxFields @param {number} depth @returns {unknown} */
function compactExample(value, maxFields, depth = 0) {
  if (Array.isArray(value)) {
    return value.slice(0, 1).map((item) => compactExample(item, maxFields, depth + 1));
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  const fieldLimit = depth === 0 ? maxFields : Math.min(maxFields, 5);
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, fieldLimit)
      .map(([key, item]) => [key, compactExample(item, maxFields, depth + 1)]),
  );
}

/** @param {unknown} value @returns {unknown} */
function compactErrorExample(value) {
  if (!isRecord(value)) {
    return value;
  }

  const selected = ERROR_EXAMPLE_KEYS.filter((key) => Object.hasOwn(value, key)).map(
    (key) => /** @type {[string, unknown]} */ ([key, value[key]]),
  );
  return Object.fromEntries(
    (selected.length > 0 ? selected : Object.entries(value).slice(0, 6)).map(([key, item]) => [
      key,
      compactExample(item, 5, 1),
    ]),
  );
}

/** @param {unknown} document @param {Response} rawResponse @param {string} status @param {string | undefined} writeAction @returns {{language: string, value: unknown}} */
function responseExample(document, rawResponse, status, writeAction) {
  const reference = rawResponse?.$ref;
  const response =
    reference === undefined
      ? rawResponse
      : /** @type {Response | undefined} */ (resolveReference(document, reference));
  if (response === undefined) {
    throw new Error(`OpenAPI reference not found: ${reference}`);
  }
  if (status === "204") {
    return { language: "text", value: "No response body." };
  }
  const contentEntries = Object.entries(response.content ?? {});
  const firstContent = contentEntries[0];
  if (firstContent === undefined) {
    return { language: "text", value: response.description ?? "No response body." };
  }

  const [mediaType, media] =
    contentEntries.find(([type]) => type === "application/json") ??
    contentEntries.find(([type]) => type.includes("json")) ??
    firstContent;
  const firstNamedExample = Object.values(media.examples ?? {})[0];
  const value =
    media.example ?? firstNamedExample?.value ?? exampleFromSchema(document, media.schema);
  const operationValue =
    (status === "200" || status === "202") &&
    typeof writeAction === "string" &&
    isRecord(value) &&
    Object.hasOwn(value, "action")
      ? { ...value, action: writeAction }
      : value;
  const compactValue =
    status.startsWith("4") || status.startsWith("5")
      ? compactErrorExample(operationValue)
      : compactExample(operationValue, 10);

  return {
    language: mediaType.includes("json") ? "json" : "text",
    value: compactValue,
  };
}

/** @param {string} language @param {unknown} value @returns {string} */
function formatValue(language, value) {
  return language === "json" || typeof value !== "string" ? JSON.stringify(value, null, 2) : value;
}

/** @param {unknown} document @param {Operation} operation @param {string} scope @returns {string} */
export function responseExampleBlock(document, operation, scope) {
  const responses = operation.responses ?? {};
  const tabs = Object.entries(responses).map(([status, rawResponse]) => {
    const example = responseExample(document, rawResponse, status, operation["x-write-action"]);
    const tabId = `response-${scope.replaceAll("/", "-")}-${status}`;
    const value = formatValue(example.language, example.value)
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n");
    return [
      `  <Tab title="${status}" id="${tabId}">`,
      `    \`\`\`${example.language}\n${value}\n    \`\`\``,
      "  </Tab>",
    ].join("\n\n");
  });

  return [
    START_MARKER,
    "",
    "<Panel>",
    "",
    "<Tabs defaultTabIndex={0} sync={false}>",
    "",
    tabs.join("\n\n"),
    "</Tabs>",
    "",
    "</Panel>",
    END_MARKER,
  ].join("\n");
}

/** @param {string} source @param {string} block @returns {string} */
export function replaceGeneratedBlock(source, block) {
  const sourceWithoutBlock = stripGeneratedResponseExamples(source);

  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u.exec(sourceWithoutBlock);
  if (frontmatter === null) {
    throw new Error("API reference page has no frontmatter insertion point.");
  }

  const topLevelImports = /^(?:\r?\n)*(?:import [^\r\n]+;\r?\n)+/u.exec(
    sourceWithoutBlock.slice(frontmatter[0].length),
  );
  if (topLevelImports === null) {
    throw new Error("API reference page has no import insertion point.");
  }

  const insertion = frontmatter[0].length + topLevelImports[0].length;

  return `${sourceWithoutBlock.slice(0, insertion)}\n${block}\n${sourceWithoutBlock.slice(insertion).replace(/^\r?\n*/u, "")}`;
}

if (import.meta.main) {
  const document = /** @type {Document} */ (Bun.YAML.parse(readFileSync("openapi.yaml", "utf8")));
  const check = process.argv.includes("--check");
  const findings = [];
  let pages = 0;
  let statuses = 0;

  for (const file of new Bun.Glob("**/*.mdx").scanSync({
    cwd: join(PROJECT_ROOT, "api-reference"),
    absolute: true,
    dot: true,
  })) {
    const source = readFileSync(file, "utf8");
    const match = API_PATTERN.exec(source);
    if (match === null) {
      continue;
    }
    const [, method = "", path = ""] = match;
    const operation = document.paths?.[path]?.[method.toLowerCase()];
    if (operation === undefined || !HTTP_METHODS.has(method.toLowerCase())) {
      findings.push(`${relative(PROJECT_ROOT, file)}: OpenAPI operation not found.`);
      continue;
    }

    const scope = relative(join(PROJECT_ROOT, "api-reference"), file).replace(/\.mdx$/u, "");
    const block = responseExampleBlock(document, operation, scope);
    const nextSource = replaceGeneratedBlock(source, block);
    pages += 1;
    statuses += Object.keys(operation.responses ?? {}).length;

    if (nextSource !== source) {
      if (check) {
        findings.push(`${relative(PROJECT_ROOT, file)}: response examples are stale.`);
      } else {
        writeFileSync(file, nextSource);
      }
    }
  }

  if (findings.length > 0) {
    throw new Error(findings.join("\n"));
  }

  process.stdout.write(
    `${check ? "Verified" : "Synchronized"} ${statuses} response statuses across ${pages} API pages.\n`,
  );
}
