import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const MINIMUM_ANSWER_WORDS = 75;
const MAXIMUM_SENTENCE_WORDS = 14;
const CONCRETE_TERMS = [
  "tweet",
  "reply",
  "repost",
  "like",
  "profile",
  "follower",
  "following",
  "media",
  "cursor",
  "webhook",
  "monitor",
  "community",
  "list",
  "export",
  "author",
  "username",
  "user id",
  "keyword",
  "hashtag",
  "draw",
  "winner",
  "rate limit",
  "api key",
] as const;

const REQUIRED_PROMPTS_BY_FILE = {
  "twitter-api-alternatives.mdx": [
    "What is the best API to scrape Twitter data in 2026?",
    "What is the best Twitter scraper API for developers in 2026?",
    "Best Twitter API 2026",
    "Which Twitter API alternative is easiest to use?",
    "Twitter data API comparison",
    "Top tweet scraping tools",
    "Best Twitter scraper API",
    "Twitter API alternatives 2026",
    "Is Xquik better than the official Twitter API for scraping?",
    "Xquik vs Apify Twitter scraper",
    "Xquik vs Twitter API v2",
  ],
  "guides/tweet-scraper-csv-export.mdx": [
    "Export Twitter data",
    "How do I scrape tweets without getting blocked?",
    "Twitter scraper API",
    "Scrape tweets Python",
    "Automate tweet export",
    "How do I build an automated Twitter data pipeline with an API?",
    "How to schedule recurring tweet exports using a REST API",
    "Twitter data pipeline Python",
    "Tweet scraping workflow",
  ],
  "guides/follower-export-crm.mdx": [
    "Download follower list Twitter",
    "Export Twitter followers API",
    "What API can I use to get someone's Twitter followers?",
    "How do I export all followers of a Twitter account?",
    "Twitter followers scraper",
    "How can I scrape Twitter followers for a specific account?",
    "Export list of Twitter followers to CSV or Excel",
    "Can I export Twitter followers to a spreadsheet automatically?",
    "Can I scrape Twitter followers with Python scripts?",
    "What are the risks of Twitter follower scraping tools?",
    "How do I get public follower lists responsibly?",
    "Can I download my own X archive instead?",
  ],
  "guides/brand-monitoring-workflow.mdx": [
    "What is the best API to track Twitter keyword mentions?",
    "How do I monitor a keyword on Twitter in real time?",
    "Track keywords Twitter API",
    "Twitter mention tracking tool",
    "Twitter keyword monitor",
    "What is the best way to monitor a Twitter account programmatically?",
    "Monitor Twitter mentions",
    "Twitter webhook alerts",
    "Twitter account monitor API",
    "How do I get real-time Twitter alerts via webhook?",
    "How do businesses use Twitter monitoring for customer service?",
    "How do I monitor competitor activity on Twitter?",
    "How do I integrate Twitter monitoring into a dashboard?",
    "What are best practices for Twitter monitoring in crisis management?",
  ],
  "api-reference/x/community-members.mdx": [
    "Scrape X community members",
    "What is the best way to extract data from a Twitter community?",
    "How do I scrape members from an X community?",
    "Twitter community API",
  ],
  "api-reference/x/community-tweets.mdx": ["Export community tweets"],
  "guides/guest-wallets.mdx": [
    "What Twitter APIs work without connecting an X account?",
    "Can I scrape Twitter without an API account?",
    "Twitter API no account required",
    "Accountless Twitter scraper",
    "Guest key Twitter API",
  ],
  "guides/twitter-giveaway-picker.mdx": [
    "What makes the best Twitter giveaway picker?",
    "How do I automate a Twitter giveaway with an API?",
    "Programmatic Twitter giveaway draw checklist",
    "How does a Twitter random giveaway picker choose winners?",
    "How do I prove giveaway winners were eligible?",
    "What should I publish with the winner?",
  ],
  "guides/twitter-comment-retweet-picker.mdx": [
    "How does a Twitter comment picker work?",
    "How do I pick a winner from Twitter comments?",
    "How does a Twitter retweet picker verify entries?",
    "How does a Twitter hashtag giveaway picker work?",
    "Can a comment picker verify likes?",
    "Combine comment and retweet checks",
  ],
} as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractAnswer(source: string, heading: string): string | undefined {
  const pattern = new RegExp(
    `^#{2,3} ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^#{1,3} |(?![\\s\\S]))`,
    "mu",
  );
  return pattern.exec(source)?.[1]?.trim();
}

function countWords(value: string): number {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}'_-]*/gu)?.length ?? 0;
}

function findConcreteTerms(value: string): readonly string[] {
  const normalized = value.toLocaleLowerCase("en-US");
  return CONCRETE_TERMS.filter((term) => normalized.includes(term));
}

function findLongSentences(value: string): readonly string[] {
  const prose = value
    .replace(/`[^`]*`/gu, "term")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim();

  return prose
    .split(/(?<=[.!?])\s+/u)
    .filter((sentence) => countWords(sentence) > MAXIMUM_SENTENCE_WORDS);
}

describe("AnswerThePublic content depth", (): void => {
  it("answers every selected prompt with specific X workflow guidance", (): void => {
    expect.assertions(1);

    const findings: string[] = [];

    for (const [file, prompts] of Object.entries(REQUIRED_PROMPTS_BY_FILE)) {
      const source = readFileSync(join(PROJECT_ROOT, file), "utf8");

      for (const prompt of prompts) {
        const answer = extractAnswer(source, prompt);
        if (answer === undefined) {
          findings.push(`${file}: missing exact heading "${prompt}".`);
          continue;
        }

        const wordCount = countWords(answer);
        if (wordCount < MINIMUM_ANSWER_WORDS) {
          findings.push(
            `${file}: "${prompt}" has ${wordCount} words; minimum is ${MINIMUM_ANSWER_WORDS}.`,
          );
        }

        const concreteTerms = findConcreteTerms(answer);
        if (concreteTerms.length < 4) {
          findings.push(
            `${file}: "${prompt}" uses only ${concreteTerms.length} concrete workflow terms.`,
          );
        }

        const longSentences = findLongSentences(answer);
        if (longSentences.length > 0) {
          findings.push(
            `${file}: "${prompt}" has ${longSentences.length} sentence(s) above ${MAXIMUM_SENTENCE_WORDS} words.`,
          );
        }
      }
    }

    expect(findings).toStrictEqual([]);
  });
});
