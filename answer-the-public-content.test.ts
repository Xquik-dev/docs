import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();
const MINIMUM_ANSWER_WORDS = 75;
const MAXIMUM_SENTENCE_WORDS = 14;
const CONCRETE_TERMS = [
  'tweet',
  'reply',
  'repost',
  'like',
  'profile',
  'follower',
  'following',
  'media',
  'cursor',
  'webhook',
  'monitor',
  'community',
  'list',
  'export',
  'author',
  'username',
  'user id',
  'keyword',
  'hashtag',
  'draw',
  'winner',
  'rate limit',
  'api key',
] as const;

const REQUIRED_PROMPTS_BY_FILE = {
  'twitter-api-alternatives.mdx': [
    'What Is the Best API to Scrape Twitter Data in 2026?',
    'What Is the Best Twitter Scraper API for Developers in 2026?',
    'Best Twitter API 2026',
    'Which Twitter API Alternative Is Easiest to Use?',
    'Twitter Data API Comparison',
    'Top Tweet Scraping Tools',
    'Best Twitter Scraper API',
    'Twitter API Alternatives 2026',
    'Is Xquik Better Than the Official Twitter API for Scraping?',
    'Xquik vs Apify Twitter Scraper',
    'Xquik vs Twitter API v2',
  ],
  'guides/tweet-scraper-csv-export.mdx': [
    'Export Twitter Data',
    'How Do I Scrape Tweets Without Getting Blocked?',
    'Twitter Scraper API',
    'Scrape Tweets Python',
    'Automate Tweet Export',
    'How Do I Build an Automated Twitter Data Pipeline With an API?',
    'How to Schedule Recurring Tweet Exports Using a REST API',
    'Twitter Data Pipeline Python',
    'Tweet Scraping Workflow',
  ],
  'guides/follower-export-crm.mdx': [
    'Download Follower List Twitter',
    'Export Twitter Followers API',
    'What API Can I Use to Get Someone’s Twitter Followers?',
    'How Do I Export All Followers of a Twitter Account?',
    'Twitter Followers Scraper',
    'How Can I Scrape Twitter Followers for a Specific Account?',
    'Export List of Twitter Followers to CSV or Excel',
    'Can I Export Twitter Followers to a Spreadsheet Automatically?',
    'Can I Scrape Twitter Followers With Python Scripts?',
    'What Are the Risks of Twitter Follower Scraping Tools?',
    'How Do I Get Public Follower Lists Responsibly?',
    'Can I Download My Own X Archive Instead?',
  ],
  'guides/brand-monitoring-workflow.mdx': [
    'What Is the Best API to Track Twitter Keyword Mentions?',
    'How Do I Monitor a Keyword on Twitter in Real Time?',
    'Track Keywords Twitter API',
    'Twitter Mention Tracking Tool',
    'Twitter Keyword Monitor',
    'What Is the Best Way to Monitor a Twitter Account Programmatically?',
    'Monitor Twitter Mentions',
    'Twitter Webhook Alerts',
    'Twitter Account Monitor API',
    'How Do I Get Real-Time Twitter Alerts via Webhook?',
    'How Do Businesses Use Twitter Monitoring for Customer Service?',
    'How Do I Monitor Competitor Activity on Twitter?',
    'How Do I Integrate Twitter Monitoring Into a Dashboard?',
    'What Are Best Practices for Twitter Monitoring in Crisis Management?',
  ],
  'api-reference/x/community-members.mdx': [
    'Scrape X Community Members',
    'What Is the Best Way to Extract Data From a Twitter Community?',
    'How Do I Scrape Members From an X Community?',
    'Twitter Community API',
  ],
  'api-reference/x/community-tweets.mdx': ['Export Community Tweets'],
  'guides/guest-wallets.mdx': [
    'What Twitter APIs Work Without Connecting an X Account?',
    'Can I Scrape Twitter Without an API Account?',
    'Twitter API No Account Required',
    'Accountless Twitter Scraper',
    'Guest Key Twitter API',
  ],
  'guides/twitter-giveaway-picker.mdx': [
    'What Makes the Best Twitter Giveaway Picker?',
    'How Do I Automate a Twitter Giveaway With an API?',
    'Programmatic Twitter Giveaway Draw Checklist',
    'How Does a Twitter Random Giveaway Picker Choose Winners?',
    'How Do I Prove Giveaway Winners Were Eligible?',
    'What Should I Publish With the Winner?',
  ],
  'guides/twitter-comment-retweet-picker.mdx': [
    'How Does a Twitter Comment Picker Work?',
    'How Do I Pick a Winner From Twitter Comments?',
    'How Does a Twitter Retweet Picker Verify Entries?',
    'How Does a Twitter Hashtag Giveaway Picker Work?',
    'Can a Comment Picker Verify Likes?',
    'Combine Comment and Retweet Checks',
  ],
} as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function extractAnswer(source: string, heading: string): string | undefined {
  const pattern = new RegExp(
    `^#{2,3} ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^#{1,3} |(?![\\s\\S]))`,
    'mu',
  );
  return pattern.exec(source)?.[1]?.trim();
}

function countWords(value: string): number {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}’'_-]*/gu)?.length ?? 0;
}

function findConcreteTerms(value: string): readonly string[] {
  const normalized = value.toLocaleLowerCase('en-US');
  return CONCRETE_TERMS.filter((term) => normalized.includes(term));
}

function findLongSentences(value: string): readonly string[] {
  const prose = value
    .replace(/`[^`]*`/gu, 'term')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/\s+/gu, ' ')
    .trim();

  return prose
    .split(/(?<=[.!?])\s+/u)
    .filter((sentence) => countWords(sentence) > MAXIMUM_SENTENCE_WORDS);
}

describe('AnswerThePublic content depth', (): void => {
  it('answers every selected prompt with specific X workflow guidance', (): void => {
    expect.assertions(1);

    const findings: string[] = [];

    for (const [file, prompts] of Object.entries(REQUIRED_PROMPTS_BY_FILE)) {
      const source = readFileSync(join(PROJECT_ROOT, file), 'utf8');

      for (const prompt of prompts) {
        const answer = extractAnswer(source, prompt);
        if (answer === undefined) {
          findings.push(`${file}: missing exact heading “${prompt}”.`);
          continue;
        }

        const wordCount = countWords(answer);
        if (wordCount < MINIMUM_ANSWER_WORDS) {
          findings.push(
            `${file}: “${prompt}” has ${wordCount} words; minimum is ${MINIMUM_ANSWER_WORDS}.`,
          );
        }

        const concreteTerms = findConcreteTerms(answer);
        if (concreteTerms.length < 4) {
          findings.push(
            `${file}: “${prompt}” uses only ${concreteTerms.length} concrete workflow terms.`,
          );
        }

        const longSentences = findLongSentences(answer);
        if (longSentences.length > 0) {
          findings.push(
            `${file}: “${prompt}” has ${longSentences.length} sentence(s) above ${MAXIMUM_SENTENCE_WORDS} words.`,
          );
        }
      }
    }

    expect(findings).toStrictEqual([]);
  });
});
