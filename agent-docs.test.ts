import { describeAgentDocsPerCheck } from 'afdocs/helpers';

const LIVE_AGENT_DOCS_TIMEOUT_MS = 420_000;

describeAgentDocsPerCheck(undefined, LIVE_AGENT_DOCS_TIMEOUT_MS);
