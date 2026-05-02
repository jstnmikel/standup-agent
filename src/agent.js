/**
 * src/agent.js — Daily Standup Summarizer Agent
 *
 * This agent reads open issues from a GitHub repository using the GitHub MCP
 * server and produces a plain-English summary suitable for a daily standup.
 *
 * Inputs (environment variables):
 *   GITHUB_TOKEN  — GitHub Personal Access Token with `repo` scope
 *   GITHUB_OWNER  — GitHub username or organization that owns the repository
 *   GITHUB_REPO   — Name of the repository to read issues from
 *
 * Output:
 *   A plain-English numbered list of open issues printed to stdout, or a
 *   friendly error message if something goes wrong.
 */

import 'dotenv/config';

/**
 * Validates that all required environment variables are set.
 * Exits the process with a clear error message if any are missing.
 *
 * @param {string[]} required - Array of required environment variable names
 */
export function validateEnv(required = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_TOKEN']) {
  for (const name of required) {
    if (!process.env[name]) {
      console.error(
        `Error: Missing required environment variable ${name}.\nPlease check your .env file and make sure ${name} is set.`
      );
      process.exit(1);
    }
  }
}

/**
 * Maps an HTTP status code to a learner-friendly error message with a suggested next step.
 *
 * @param {number} statusCode - The HTTP status code returned by the GitHub API
 * @returns {string} A human-readable error message including the status code and a next step
 */
export function errorMessage(statusCode) {
  if (statusCode === 401) {
    return `Error fetching issues (HTTP 401): Unauthorized.\nSuggested next step: Check that your GITHUB_TOKEN in .env is correct and has not expired.`;
  }
  if (statusCode === 403) {
    return `Error fetching issues (HTTP 403): Forbidden.\nSuggested next step: Check that your GitHub PAT has the 'repo' scope enabled.`;
  }
  if (statusCode === 404) {
    return `Error fetching issues (HTTP 404): Not Found.\nSuggested next step: Check that GITHUB_OWNER and GITHUB_REPO in your .env are spelled correctly.`;
  }
  if (statusCode === 429) {
    return `Error fetching issues (HTTP 429): Rate Limited.\nSuggested next step: Wait a few minutes and try again.`;
  }
  if (statusCode >= 500 && statusCode <= 599) {
    return `Error fetching issues (HTTP ${statusCode}): GitHub server error.\nSuggested next step: Try again in a few minutes and check https://githubstatus.com`;
  }
  return `Error fetching issues (HTTP ${statusCode}): Unexpected error.\nSuggested next step: Check your network connection and try again.`;
}

/**
 * Formats an array of GitHub issue objects into a plain-English numbered list.
 *
 * @param {Array<{number: number, title: string, labels: Array<{name: string}>, state: string}>} issues
 * @returns {string} A formatted summary string
 */
export function formatSummary(issues) {
  if (!issues || issues.length === 0) {
    return "No open issues found. You're all caught up!";
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const header = `Open issues in ${owner}/${repo}:\n\n`;

  const lines = issues.map((issue, index) => {
    const labelNames = (issue.labels || []).map((l) => l.name).join(', ');
    return `${index + 1}. ${issue.title} [${labelNames}]`;
  });

  return header + lines.join('\n');
}

/**
 * Calls an MCP tool by name with the given parameters.
 *
 * This is a stub that can be overridden in tests. The default implementation
 * throws a helpful error because this agent is designed to run inside Kiro
 * with the GitHub MCP server configured — not as a standalone Node.js process.
 *
 * To override in tests:
 *   import { callMcpTool } from '../src/agent.js';
 *   // reassign the exported binding via the module namespace, or use dependency injection
 *
 * @param {string} toolName - The name of the MCP tool to call (e.g. "list_issues")
 * @param {Object} params   - The parameters to pass to the tool
 * @returns {Promise<any>}  - The tool's response
 */
export async function callMcpTool(toolName, params) {
  throw new Error(
    'MCP tool call not available. This agent is designed to run inside Kiro with the GitHub MCP server configured.'
  );
}

/**
 * Main entry point for the standup-summarizer agent.
 *
 * Reads GITHUB_OWNER and GITHUB_REPO from environment variables, calls the
 * GitHub MCP server's list_issues tool, formats the result, and prints it to
 * stdout. On API error, prints a human-readable error message instead.
 *
 * @param {Function} [mcpCall] - Optional override for callMcpTool (used in tests)
 * @returns {Promise<void>}
 */
export async function main(mcpCall = callMcpTool) {
  validateEnv();

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  try {
    const result = await mcpCall('list_issues', {
      owner,
      repo,
      state: 'open',
    });

    // The MCP server may return the issues array directly or wrapped in a content field
    const issues = Array.isArray(result) ? result : result?.content ?? result;

    console.log(formatSummary(issues));
  } catch (err) {
    // If the error carries an HTTP status code, use the friendly error message
    const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (typeof statusCode === 'number') {
      console.log(errorMessage(statusCode));
    } else {
      console.log(errorMessage(500));
    }
  }
}

// Run main() only when this module is executed directly (not when imported in tests)
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}
