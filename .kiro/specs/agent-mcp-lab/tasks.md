# Implementation Plan: Agent MCP Lab

## Overview

Build the Agent MCP Lab — a guided learning experience that produces a working standup-summarizer agent, GitHub MCP server configuration, a Kiro hook, and security scaffolding. Implementation proceeds in layers: project structure and scaffolding first, then the agent logic, then configuration files, then the lab guide document, and finally integration and wiring.

## Tasks

- [x] 1. Set up project structure and testing framework
  - Create the `src/` directory and `src/agent.js` entry point (empty scaffold)
  - Initialize `package.json` with `"type": "module"` and add `dotenv` as a dependency
  - Install `fast-check` and a test runner (e.g., `vitest`) as dev dependencies
  - Create `tests/` directory with placeholder files for unit, property, and smoke test suites
  - _Requirements: 6.1, 6.5, 6.6_

- [x] 2. Implement security scaffolding files
  - [x] 2.1 Create `.env.example` with all three required placeholder variables
    - File must contain `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` with clearly non-secret placeholder values (containing "your" or "here")
    - _Requirements: 3.7_

  - [ ]* 2.2 Write property test for `.env.example` generation (Property 4)
    - **Property 4: Generated .env.example contains all required variable names with placeholder values**
    - Generate random sets of variable names; assert each appears in the output with a placeholder value matching `/your|here/i`
    - Tag: `// Feature: agent-mcp-lab, Property 4: env.example placeholder values`
    - **Validates: Requirements 3.7**

  - [x] 2.3 Update `.gitignore` to include `.env`
    - Ensure `.env` appears in `.gitignore` before any other file-creation steps
    - _Requirements: 3.4, 3.5_

  - [ ]* 2.4 Write unit tests for security scaffolding
    - Assert `.env` is present in `.gitignore`
    - Assert `.env.example` is safe to commit (no real token patterns)
    - _Requirements: 3.4, 3.5, 3.7_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the standup-summarizer agent (`src/agent.js`)
  - [x] 4.1 Implement environment variable validation
    - On startup, check that `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_TOKEN` are all set
    - If any is missing, exit immediately with a message naming the missing variable and pointing to `.env`
    - _Requirements: 6.5, 6.6_

  - [ ]* 4.2 Write unit tests for missing environment variable handling
    - Test missing `GITHUB_OWNER` → correct error message naming that variable
    - Test missing `GITHUB_REPO` → correct error message naming that variable
    - Test missing `GITHUB_TOKEN` → correct error message naming that variable
    - _Requirements: 6.5, 6.6_

  - [x] 4.3 Implement issue list formatting logic
    - Write a pure `formatSummary(issues)` function that accepts an array of issue objects and returns a plain-English numbered list string
    - Each line must include the issue title and comma-separated label names in brackets
    - Handle the empty-array case by returning `"No open issues found. You're all caught up!"`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.4 Write property test for issue summary formatting (Property 1)
    - **Property 1: Issue summary contains all issue titles and labels**
    - Generate random arrays of issue objects (varying titles, label counts, label names); assert the formatted summary contains every title and every label name
    - Tag: `// Feature: agent-mcp-lab, Property 1: summary contains all titles and labels`
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 4.5 Write unit tests for `formatSummary`
    - Empty issues list → exact message "No open issues found. You're all caught up!"
    - Issue with no labels → title appears with empty brackets or no label section
    - Issue with multiple labels → all labels appear comma-separated
    - _Requirements: 6.2, 6.3_

  - [x] 4.6 Implement GitHub API error handling
    - Write an `errorMessage(statusCode)` function that maps HTTP status codes to learner-friendly messages with a suggested next step
    - Cover 401, 403, 404, 429, and 5xx ranges
    - Each message must include the numeric status code and a non-empty next-step string
    - _Requirements: 6.4_

  - [ ]* 4.7 Write property test for error message generation (Property 2)
    - **Property 2: Error message includes HTTP status code and next step**
    - Generate random HTTP status codes in the 4xx–5xx range; assert the error message contains the status code as a number and a non-empty next-step string
    - Tag: `// Feature: agent-mcp-lab, Property 2: error message includes status code and next step`
    - **Validates: Requirements 6.4**

  - [x] 4.8 Wire agent entry point: read env vars, call MCP tool, format and print output
    - Connect `GITHUB_OWNER` and `GITHUB_REPO` env vars to the `list_issues` MCP tool call parameters
    - Pass the result to `formatSummary` and print to stdout
    - On API error, call `errorMessage` and print to stdout
    - _Requirements: 6.1, 6.5, 6.6_

  - [ ]* 4.9 Write property test for environment variable passthrough (Property 3)
    - **Property 3: Agent uses environment variables for owner and repo**
    - Generate random owner/repo strings; assert the MCP tool call parameters match the environment variable values exactly (no hard-coded values)
    - Tag: `// Feature: agent-mcp-lab, Property 3: env vars passed to MCP tool`
    - **Validates: Requirements 6.5, 6.6**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create GitHub MCP server configuration
  - [x] 6.1 Create `.kiro/settings/mcp.json` with the GitHub MCP server entry
    - Use `npx` command with `@modelcontextprotocol/server-github`
    - Reference `GITHUB_TOKEN` as `${GITHUB_TOKEN}` — never a literal value
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 6.2 Write property test for MCP configuration safety (Property 5)
    - **Property 5: MCP configuration never contains a literal token value**
    - Generate random configuration objects; assert the serialized JSON contains no strings matching GitHub PAT patterns (`ghp_`, `github_pat_`, or 40-character hex strings)
    - Tag: `// Feature: agent-mcp-lab, Property 5: MCP config has no literal token`
    - **Validates: Requirements 4.4**

  - [ ]* 6.3 Write unit tests for MCP configuration structure
    - Assert `mcpServers.github.command` is `"npx"`
    - Assert `GITHUB_PERSONAL_ACCESS_TOKEN` value is `"${GITHUB_TOKEN}"` (env var reference, not a literal)
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Create Kiro hook configuration
  - [x] 7.1 Create `.kiro/hooks/standup-on-save.kiro.hook` with the correct hook definition
    - Set `eventType` to `"fileEdited"`, `filePatterns` to `"**/*"`, and `hookAction` to `"askAgent"`
    - Include an `outputPrompt` that instructs the agent to run and show the summary
    - _Requirements: 7.2, 7.3_

  - [ ]* 7.2 Write property test for hook configuration (Property 6)
    - **Property 6: Hook configuration uses askAgent action**
    - Generate random hook configuration objects; assert the `hookAction` field is always `"askAgent"`
    - Tag: `// Feature: agent-mcp-lab, Property 6: hook uses askAgent`
    - **Validates: Requirements 7.3**

  - [ ]* 7.3 Write unit tests for hook configuration
    - Assert `eventType` is `"fileEdited"`
    - Assert `hookAction` is `"askAgent"`
    - Assert `filePatterns` covers all files
    - _Requirements: 7.2, 7.3_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create the lab guide document (`lab-guide.md`)
  - [x] 9.1 Write Section 1 — Lab Environment Setup
    - Include GitHub signup link (`https://github.com/signup`)
    - Include `git --version`, `node --version`, `npm --version` verification commands
    - Include installation checklist at the end of the section
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 9.2 Write Section 2 — GitHub Repository Creation
    - Include instructions to create `standup-agent` repo with `README.md` and Node `.gitignore`
    - Include `git clone` and "File → Open Folder" steps
    - Include expected folder structure confirmation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 9.3 Write Section 3 — Secure Credential Management
    - Explain what a PAT is and why it is needed before any creation steps
    - Include `.env` format example and instruction to add `.env` to `.gitignore` before any `git add`
    - Include `.env.example` explanation and OS keychain mention
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 9.4 Write Section 4 — MCP Server Installation and Configuration
    - Explain what an MCP server is in plain language before installation steps
    - Include exact JSON configuration block with comments
    - Include restart-and-verify step and troubleshooting checklist (missing token, wrong Node.js version, incorrect path)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 9.5 Write Section 5 — Agent Specification Creation
    - Explain what a Kiro spec is before asking the learner to create one
    - Include exact requirements text for the `standup-summarizer` spec
    - Include review, task-run, and file-inspection steps
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 9.6 Write Section 6 — Agent Implementation walkthrough
    - Explain what the generated agent code does in plain language
    - Reference the `formatSummary` function, error handling, and env var usage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 9.7 Write Section 7 — Workflow Creation
    - Explain what a Kiro hook is with a real-world example before creation steps
    - Include hook creation instructions and celebration milestone prompt
    - Include commit-and-push instructions (excluding `.env`)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.8 Write Section 8 — Security Review Checkpoint
    - Include the five-item security checklist
    - Include completion message, next-steps suggestions, and links back to relevant sections for any failed checklist item
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.9 Write smoke tests for lab guide content
    - Assert GitHub signup link is present
    - Assert `git --version`, `node --version`, `npm --version` commands appear
    - Assert `.env` added to `.gitignore` instruction appears before any `git add` instruction
    - Assert MCP JSON configuration block is present
    - Assert troubleshooting section covers the three common causes
    - Assert final security checklist contains all five items
    - Assert completion message and next-steps section exist
    - _Requirements: 1.1, 1.2, 1.3, 3.4, 4.5, 4.7, 8.1, 8.2_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each major layer
- Property tests (Properties 1–6) validate universal correctness properties using `fast-check` with a minimum of 100 iterations each
- Unit tests validate specific examples and edge cases that complement the property tests
- Smoke tests verify the lab guide document contains all required content
- The integration test (live GitHub API call) is intentionally excluded from this task list — it requires a real token and is run manually
