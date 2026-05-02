# Design Document: Agent MCP Lab

## Overview

This document describes how the **Agent MCP Lab** is built — the files it produces, the way each piece connects to the others, and the decisions behind those choices. The audience is a non-developer learner, so technical terms are explained in plain language wherever they appear.

### What the lab produces

By the end of the lab, the learner will have:

1. A **lab guide** — a step-by-step Markdown document that walks the learner through every task.
2. A **standup-summarizer agent** — a small Node.js program that reads open GitHub issues and writes a plain-English summary.
3. A **GitHub MCP server configuration** — a JSON file that tells Kiro how to connect the agent to GitHub's API.
4. A **Kiro hook** — an automation rule that runs the agent automatically whenever a file is saved.
5. A set of **security scaffolding files** — `.env.example`, an updated `.gitignore`, and a final security checklist.

### Key design decisions

| Decision | Choice | Reason |
|---|---|---|
| MCP server | `github/github-mcp-server` (official GitHub MCP server via Docker or npx) | Officially maintained by GitHub, well-documented, beginner-friendly |
| Agent language | Node.js / JavaScript | Matches the Node.js prerequisite; no extra toolchain needed |
| Secret storage | `.env` file + `dotenv` package | Industry-standard pattern; easy to understand; safe when `.gitignore` is correct |
| Hook trigger | `fileEdited` (file save) | Immediately visible to the learner; no extra setup required |
| Hook action | `askAgent` (outputs to Kiro chat panel) | Learner sees results without leaving the editor |

---

## Architecture

The lab is built around four layers that talk to each other in a simple chain:

```
┌─────────────────────────────────────────────────────────────┐
│                        Kiro IDE                             │
│                                                             │
│  ┌──────────────┐    triggers    ┌──────────────────────┐  │
│  │  Hook        │ ─────────────► │  standup-summarizer  │  │
│  │ (file save)  │                │  agent (Node.js)     │  │
│  └──────────────┘                └──────────┬───────────┘  │
│                                             │ calls tools   │
│                                  ┌──────────▼───────────┐  │
│                                  │  GitHub MCP Server   │  │
│                                  │  (local process)     │  │
│                                  └──────────┬───────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                                              │ HTTPS API calls
                                   ┌──────────▼───────────┐
                                   │   GitHub REST API    │
                                   │   (cloud service)    │
                                   └──────────────────────┘
```

**Plain-language walkthrough:**

1. The learner saves a file in Kiro.
2. The **hook** detects the save event and asks Kiro to run the standup-summarizer agent.
3. The **agent** decides it needs to list open issues, so it calls a tool provided by the GitHub MCP server.
4. The **GitHub MCP server** translates that tool call into a real HTTPS request to the GitHub REST API, using the learner's Personal Access Token (PAT) for authentication.
5. GitHub returns a list of open issues.
6. The MCP server passes the data back to the agent.
7. The agent formats the data into a plain-English summary and sends it to the Kiro chat panel.

---

## Components and Interfaces

### Component 1: Lab Guide (`lab-guide.md`)

A single Markdown file that contains every instruction the learner needs. It is divided into eight sections that match the eight requirements. Each section ends with a checkpoint so the learner can confirm they are ready to continue.

**Key interface:** The lab guide is a static document. It does not call any code. Its "interface" is the set of commands, file contents, and configuration snippets it tells the learner to type or paste.

### Component 2: Standup-Summarizer Agent (`src/agent.js`)

A Node.js script that:
- Reads `GITHUB_OWNER` and `GITHUB_REPO` from environment variables.
- Calls the `list_issues` tool on the GitHub MCP server (filtered to open issues only).
- Formats the result as a numbered plain-English list.
- Handles the empty-list case and API error cases gracefully.

**Key interface:**

```
Input:  Environment variables GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN
Output: A plain-English string printed to stdout (captured by Kiro's chat panel)
Errors: A human-readable error message including the HTTP status code
```

### Component 3: GitHub MCP Server Configuration (`.kiro/settings/mcp.json`)

A JSON file that tells Kiro how to start the GitHub MCP server as a local process. The server is run via `npx` (no global install required). The PAT is passed as an environment variable reference — never as a literal value.

**Key interface (the JSON structure Kiro reads):**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

> **Note on the official GitHub MCP server:** GitHub also publishes `github/github-mcp-server` (a Go binary, run via Docker). For this beginner lab we use the npm package `@modelcontextprotocol/server-github` because it requires only Node.js (already installed) and no Docker. The lab guide mentions the Docker-based option as an advanced alternative.

### Component 4: Kiro Hook (`.kiro/hooks/standup-on-save.kiro.hook`)

A JSON file that defines the automation rule. When any file in the workspace is saved, Kiro runs the standup-summarizer agent and displays the output in the chat panel.

**Key interface (the hook structure Kiro reads):**

```json
{
  "id": "standup-on-save",
  "name": "Standup Summarizer on Save",
  "description": "Runs the standup-summarizer agent whenever a file is saved",
  "eventType": "fileEdited",
  "filePatterns": "**/*",
  "hookAction": "askAgent",
  "outputPrompt": "Run the standup-summarizer agent and show the summary of open GitHub issues in plain English."
}
```

### Component 5: Security Scaffolding

Three files that enforce the security best practices taught in the lab:

| File | Purpose |
|---|---|
| `.env` | Stores the learner's real secrets locally. Never committed. |
| `.env.example` | A template with placeholder values. Safe to commit. Shows other learners what variables are needed. |
| `.gitignore` | Must contain `.env` before any `git add` command is run. |

---

## Data Models

### Issue (from GitHub API, via MCP server)

The GitHub MCP server returns issues in the standard GitHub REST API format. The agent only uses a small subset:

```javascript
{
  number: 42,           // Issue number (integer)
  title: "Fix login bug",  // Issue title (string)
  labels: [             // Array of label objects
    { name: "bug" },
    { name: "high-priority" }
  ],
  state: "open"         // Always "open" because we filter for open issues
}
```

### Summary Output (produced by the agent)

The agent transforms the list of issues into a plain string:

```
Open issues in myorg/standup-agent:

1. Fix login bug [bug, high-priority]
2. Add dark mode [enhancement]
3. Update README [documentation]
```

If there are no open issues:

```
No open issues found. You're all caught up!
```

If the API returns an error:

```
Error fetching issues (HTTP 401): Unauthorized.
Suggested next step: Check that your GITHUB_TOKEN in .env is correct and has not expired.
```

### Environment Variables

| Variable | Description | Example value |
|---|---|---|
| `GITHUB_TOKEN` | The learner's GitHub Personal Access Token | `ghp_abc123...` |
| `GITHUB_OWNER` | The GitHub username or organization that owns the repository | `myusername` |
| `GITHUB_REPO` | The name of the repository to read issues from | `standup-agent` |

### `.env.example` File

```
# Copy this file to .env and fill in your real values.
# NEVER commit .env to GitHub.
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username_or_org_here
GITHUB_REPO=your_repository_name_here
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Most of this lab's requirements are content requirements for a static document (the lab guide), which are best verified by smoke tests (single checks that specific text or links exist). The properties below cover the parts of the system that contain real logic: the agent's formatting and error handling, the security scaffolding generation, and the configuration files.

### Property 1: Issue summary contains all issue titles and labels

*For any* non-empty list of GitHub issues (each with a title and zero or more labels), the formatted summary string produced by the agent SHALL contain each issue's title and each issue's label names.

**Validates: Requirements 6.1, 6.2**

### Property 2: Error message includes HTTP status code and next step

*For any* HTTP error status code returned by the GitHub API, the agent's error message SHALL contain that status code as a number and a non-empty suggested next step string.

**Validates: Requirements 6.4**

### Property 3: Agent uses environment variables for owner and repo

*For any* valid value of `GITHUB_OWNER` and `GITHUB_REPO` set in the environment, the agent SHALL pass those exact values as the owner and repository parameters when calling the GitHub MCP tool — never a hard-coded value.

**Validates: Requirements 6.5, 6.6**

### Property 4: Generated .env.example contains all required variable names with placeholder values

*For any* set of required environment variable names, the generated `.env.example` file SHALL contain each variable name followed by a placeholder value that does not resemble a real secret (i.e., it contains the word "here" or "your" or is otherwise clearly a placeholder).

**Validates: Requirements 3.7**

### Property 5: MCP configuration never contains a literal token value

*For any* generated `.kiro/settings/mcp.json` configuration, the file SHALL NOT contain any string that matches the pattern of a GitHub PAT (e.g., starts with `ghp_`, `github_pat_`, or is a 40-character hex string). All authentication values SHALL be expressed as environment variable references (e.g., `${GITHUB_TOKEN}`).

**Validates: Requirements 4.4**

### Property 6: Hook configuration uses askAgent action

*For any* generated hook configuration file, the `hookAction` field SHALL be `"askAgent"` (not `"runCommand"`), ensuring the agent's output is directed to the Kiro chat panel.

**Validates: Requirements 7.3**

---

## Error Handling

### Missing environment variables

If `GITHUB_OWNER`, `GITHUB_REPO`, or `GITHUB_TOKEN` is not set when the agent runs, the agent SHALL exit immediately with a clear message naming the missing variable and pointing the learner to the `.env` file. It SHALL NOT attempt to call the GitHub API with an undefined value.

```
Error: Missing required environment variable GITHUB_OWNER.
Please check your .env file and make sure GITHUB_OWNER is set.
```

### GitHub API errors

The agent maps common HTTP status codes to learner-friendly messages:

| HTTP Status | Meaning | Suggested next step shown to learner |
|---|---|---|
| 401 | Unauthorized | Check that `GITHUB_TOKEN` is correct and not expired |
| 403 | Forbidden | Check that the PAT has the `repo` scope |
| 404 | Not Found | Check that `GITHUB_OWNER` and `GITHUB_REPO` are spelled correctly |
| 429 | Rate Limited | Wait a few minutes and try again |
| 5xx | GitHub server error | Try again in a few minutes; check https://githubstatus.com |

### MCP server not running

If the GitHub MCP server is not running when the agent tries to call a tool, Kiro will display an error in the chat panel. The lab guide's troubleshooting section (Requirement 4.7) covers the three most common causes:

1. `GITHUB_TOKEN` is missing or empty in `.env`
2. Node.js version is too old (must be LTS, v18 or later)
3. The path in `mcp.json` is incorrect

### `.gitignore` safety check

Before the agent generates any files or runs any git commands, it checks whether `.env` appears in `.gitignore`. If it does not, the agent halts and displays a prominent warning (Requirement 3.5):

```
⚠️  SECURITY WARNING: .env is not listed in your .gitignore file.
Adding .env to .gitignore now before proceeding.
Please review the change, then re-run this step.
```

---

## Testing Strategy

### Overview

This lab is primarily a **guided document** (the lab guide) plus a small **Node.js agent**. The testing strategy reflects that split:

- The lab guide's content requirements are verified by **smoke tests** — single checks that specific text, links, commands, and sections exist in the document.
- The agent's logic is verified by **unit tests** (specific examples and edge cases) and **property-based tests** (universal properties across many generated inputs).

Property-based testing is appropriate here because the agent contains pure transformation logic (formatting a list of issues into a string) and error-handling logic (mapping status codes to messages) that should hold for all valid inputs, not just a handful of examples.

### Property-Based Testing

**Library:** [fast-check](https://fast-check.io/) (TypeScript/JavaScript property-based testing library)

**Configuration:** Each property test runs a minimum of **100 iterations** with randomly generated inputs.

**Tag format:** Each property test is tagged with a comment in the format:
`// Feature: agent-mcp-lab, Property N: <property text>`

**Property tests to implement:**

| Property | Test description |
|---|---|
| Property 1 | Generate random arrays of issue objects (varying titles, label counts, label names). Assert the formatted summary contains every title and every label name. |
| Property 2 | Generate random HTTP status codes in the 4xx–5xx range. Assert the error message string contains the status code and a non-empty next-step string. |
| Property 3 | Generate random owner/repo strings. Assert the MCP tool call parameters match the environment variable values exactly. |
| Property 4 | Generate random sets of variable names. Assert the `.env.example` output contains each name with a placeholder value. |
| Property 5 | Generate random configuration objects. Assert the serialized JSON contains no strings matching GitHub PAT patterns. |
| Property 6 | Generate random hook configurations. Assert the `hookAction` field is always `"askAgent"`. |

### Unit Tests

Unit tests cover specific examples and edge cases that complement the property tests:

- **Empty issues list** → exact message "No open issues found. You're all caught up!" (Requirement 6.3)
- **Issue with no labels** → summary line shows the title with empty brackets or no label section
- **Issue with multiple labels** → all labels appear comma-separated
- **Missing `GITHUB_OWNER`** → agent exits with the correct error message naming that variable
- **Missing `GITHUB_REPO`** → agent exits with the correct error message naming that variable
- **Missing `GITHUB_TOKEN`** → agent exits with the correct error message naming that variable

### Smoke Tests (Lab Guide Content)

A lightweight test suite checks that the lab guide document contains all required content:

- GitHub signup link (`https://github.com/signup`)
- `git --version`, `node --version`, `npm --version` commands
- Installation checklist
- `.env` format example (`GITHUB_TOKEN=your_token_here`)
- `.env` added to `.gitignore` instruction appearing before any `git add` instruction
- MCP JSON configuration block
- Troubleshooting section with the three common causes
- Final security checklist with all five items
- Completion message and next-steps section

### Integration Tests

One integration test (run manually, not in CI) verifies the end-to-end flow against a real GitHub repository:

1. Set `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_TOKEN` to a real test repository.
2. Run the agent.
3. Assert the output is a non-empty string containing at least one issue title (or the "all caught up" message if the repo has no open issues).

This test is excluded from automated CI because it requires a real GitHub token and makes live API calls.
