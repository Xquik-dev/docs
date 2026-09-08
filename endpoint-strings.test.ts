import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);
const EXCLUDED_DIRS = new Set([".git", "node_modules"]);
const EXCLUDED_FILES = new Set(["DOCS_QUALITY_POLL.md"]);
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
const ENDPOINT_PATTERN = new RegExp(
  `\\b(${HTTP_METHODS.join("|")})\\s+((?:https:\\/\\/xquik\\.com)?(?:\\/api\\/v1)?\\/[^\\s\`|)"']+)`,
  "g",
);
const COLON_PLACEHOLDER_PATTERN = /\/:[A-Za-z][A-Za-z0-9_]*/u;
const BARE_PLACEHOLDER_SEGMENTS = new Set([
  "accountId",
  "drawId",
  "id",
  "jobId",
  "monitorId",
  "styleId",
  "tweetId",
  "userId",
  "webhookId",
]);

interface Operation {
  readonly key: string;
  readonly method: string;
  readonly path: string;
}

interface RoutePattern {
  readonly method: string;
  readonly pattern: RegExp;
}

interface Finding {
  readonly endpoint: string;
  readonly file: string;
  readonly issue: string;
  readonly line: number;
}

function hasDocExtension(filePath: string): boolean {
  return [...DOC_EXTENSIONS].some((extension): boolean => filePath.endsWith(extension));
}

function listDocFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...listDocFiles(fullPath));
      }
      continue;
    }

    const relativePath = relative(PROJECT_ROOT, fullPath);
    if (hasDocExtension(relativePath) && !EXCLUDED_FILES.has(relativePath)) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

function extractOpenApiOperations(source: string): readonly Operation[] {
  const operations: Operation[] = [];
  let inPaths = false;
  let currentPath = "";

  for (const line of source.split(/\r?\n/u)) {
    if (line === "paths:") {
      inPaths = true;
      continue;
    }
    if (!inPaths) {
      continue;
    }

    const pathMatch = /^  (\/[^:]+):\s*$/u.exec(line);
    if (pathMatch?.[1] !== undefined) {
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = /^    (get|post|put|patch|delete|head|options):\s*$/u.exec(line);
    if (methodMatch?.[1] !== undefined && currentPath !== "") {
      const method = methodMatch[1].toUpperCase();
      operations.push({
        key: `${method} ${currentPath}`,
        method,
        path: currentPath,
      });
    }
  }

  return operations;
}

function normalizeDocumentedPath(rawPath: string): string {
  let normalized = rawPath.trim();
  normalized = normalized.replace(/^["'`]+/u, "");
  normalized = normalized.replace(/^https:\/\/xquik\.com/u, "");
  normalized = normalized.replace(/["'`.,;\]]+$/u, "");
  normalized = normalized.replace(/^\/api\/v1(?=\/)/u, "");
  normalized = normalized.split(/[?#]/u)[0] ?? normalized;
  normalized = normalized.replace(/\/$/u, "");
  return normalized === "" ? "/" : normalized;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function toRoutePattern(operation: Operation): RoutePattern {
  const source = operation.path
    .split(/(\{[^}]+\})/u)
    .map((part): string =>
      part.startsWith("{") && part.endsWith("}") ? "[^/]+" : escapeRegExp(part),
    )
    .join("");
  return {
    method: operation.method,
    pattern: new RegExp(`^${source}$`, "u"),
  };
}

function firstPathSegment(pathValue: string): string {
  return pathValue.split("/")[1] ?? "";
}

function hasBarePlaceholderSegment(pathValue: string): boolean {
  return pathValue.split("/").some((segment): boolean => BARE_PLACEHOLDER_SEGMENTS.has(segment));
}

function lineNumberForIndex(source: string, index: number): number {
  return source.slice(0, index).split(/\r?\n/u).length;
}

function collectEndpointFindings(operations: readonly Operation[]): readonly Finding[] {
  const operationKeys = new Set(operations.map((operation): string => operation.key));
  const routePatterns = operations.map(toRoutePattern);
  const firstSegments = new Set(
    operations.map((operation): string => firstPathSegment(operation.path)),
  );
  const findings: Finding[] = [];

  for (const file of listDocFiles(PROJECT_ROOT)) {
    const source = readFileSync(join(PROJECT_ROOT, file), "utf8");
    for (const match of source.matchAll(ENDPOINT_PATTERN)) {
      const method = match[1];
      const rawPath = match[2];
      if (method === undefined || rawPath === undefined) {
        continue;
      }

      const pathValue = normalizeDocumentedPath(rawPath);
      if (pathValue.includes("*") || !firstSegments.has(firstPathSegment(pathValue))) {
        continue;
      }

      const endpoint = `${method} ${pathValue}`;
      const line = lineNumberForIndex(source, match.index ?? 0);
      if (COLON_PLACEHOLDER_PATTERN.test(pathValue)) {
        findings.push({
          endpoint,
          file,
          issue: "Use OpenAPI brace placeholders instead of colon placeholders.",
          line,
        });
        continue;
      }

      if (hasBarePlaceholderSegment(pathValue)) {
        findings.push({
          endpoint,
          file,
          issue: "Wrap placeholder path segments in braces.",
          line,
        });
        continue;
      }

      if (pathValue.includes("{") || pathValue.includes("}")) {
        if (!operationKeys.has(endpoint)) {
          findings.push({
            endpoint,
            file,
            issue: "Endpoint template does not match openapi.yaml.",
            line,
          });
        }
        continue;
      }

      const matchesOperation = routePatterns.some(
        (routePattern): boolean =>
          routePattern.method === method && routePattern.pattern.test(pathValue),
      );
      if (!matchesOperation) {
        findings.push({
          endpoint,
          file,
          issue: "Concrete endpoint example does not match an OpenAPI route.",
          line,
        });
      }
    }
  }

  return findings;
}

describe("documented endpoint strings", (): void => {
  it("match OpenAPI route templates and placeholder style", (): void => {
    expect.assertions(1);

    const operations = extractOpenApiOperations(
      readFileSync(join(PROJECT_ROOT, "openapi.yaml"), "utf8"),
    );
    expect(collectEndpointFindings(operations)).toStrictEqual([]);
  });
});
