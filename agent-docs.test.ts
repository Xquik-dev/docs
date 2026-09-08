import { getChecksSorted, runChecks } from "afdocs";
import { loadConfig } from "afdocs/helpers";
import type { AgentDocsConfig, CheckResult, RunnerOptions } from "afdocs";
import { beforeAll, describe, expect, it } from "vitest";

const LIVE_AGENT_DOCS_TIMEOUT_MS = 19_000;

function runnerOptions(config: AgentDocsConfig): Partial<RunnerOptions> {
  const inferredStrategy =
    config.pages && config.pages.length > 0 && !config.options?.samplingStrategy
      ? "curated"
      : undefined;

  return {
    ...(config.checks === undefined ? {} : { checkIds: config.checks }),
    ...(config.skipChecks === undefined ? {} : { skipCheckIds: config.skipChecks }),
    ...config.options,
    ...(inferredStrategy ? { samplingStrategy: inferredStrategy } : {}),
    ...(config.pages === undefined ? {} : { curatedPages: config.pages }),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const record = asRecord(item);
        return record ? [record] : [];
      })
    : [];
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function formatSize(value: number): string {
  return value >= 1_000 ? `${Math.round(value / 1_000)}K chars` : `${value} chars`;
}

function formatPageIssue(page: Record<string, unknown>): string {
  const parts = [asString(page.status), asString(page.classification), asString(page.error)];
  if (page.found === false) {
    parts.push("missing directive");
  }

  const positionPercent = asNumber(page.positionPercent);
  if (positionPercent !== undefined) {
    parts.push(`${Math.round(positionPercent * 100)}% body position`);
  }

  const missingPercent = asNumber(page.missingPercent);
  if (missingPercent !== undefined) {
    parts.push(`${Math.round(missingPercent)}% missing`);
  }

  const convertedCharacters = asNumber(page.convertedCharacters);
  if (convertedCharacters !== undefined) {
    parts.push(`${formatSize(convertedCharacters)} after HTML conversion`);
  }

  const characters = asNumber(page.characters);
  if (characters !== undefined) {
    parts.push(formatSize(characters));
  }

  return parts.filter((part) => part && part !== "pass").join(", ") || "content differs";
}

function formatPageDetails(result: CheckResult): string[] {
  const details = asRecord(result.details);
  const pageResults = asRecordArray(details?.pageResults);
  const issuePages = pageResults.filter((page) => page.status !== "pass");

  return issuePages.map((page) => {
    const url =
      asString(page.url) ?? asString(page.mdUrl) ?? asString(page.testUrl) ?? "unknown URL";
    return `  - ${url}: ${formatPageIssue(page)}`;
  });
}

function formatResult(result: CheckResult): string {
  const lines = [`[${result.status}] ${result.message}`];
  if (result.status !== "pass" && result.status !== "skip") {
    lines.push(...formatPageDetails(result));
  }
  return lines.join("\n");
}

function isExpectedSectionHeaderSkip(result: CheckResult): boolean {
  return (
    result.status === "skip" &&
    result.message.endsWith(
      "page(s) with tabs found, but no section headers inside tab panels to evaluate",
    )
  );
}

function acceptsResult(checkId: string, result: CheckResult): boolean {
  if (result.status === "pass") {
    return true;
  }
  if (checkId === "auth-alternative-access") {
    return result.status === "skip";
  }
  if (checkId === "section-header-quality") {
    return isExpectedSectionHeaderSkip(result);
  }
  return false;
}

describe("Agent-Friendly Documentation", (): void => {
  let configuredCheckIds = new Set<string>();
  let resultsByCheck: Map<string, CheckResult> | undefined;

  beforeAll(async (): Promise<void> => {
    const config = await loadConfig();
    configuredCheckIds = new Set(config.checks);
    const report = await runChecks(config.url, runnerOptions(config));
    resultsByCheck = new Map(
      report.results.map((result): [string, CheckResult] => [result.id, result]),
    );
  }, LIVE_AGENT_DOCS_TIMEOUT_MS);

  for (const check of getChecksSorted()) {
    it(check.id, (): void => {
      expect.assertions(1);

      const result = resultsByCheck?.get(check.id);
      if (!result) {
        expect(configuredCheckIds.has(check.id)).toBe(false);
        return;
      }

      const message = formatResult(result);
      process.stdout.write(`${message}\n`);
      expect(acceptsResult(check.id, result), message).toBe(true);
    });
  }
});
