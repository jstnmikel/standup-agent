# Requirements Document

## Introduction

This lab exercise teaches non-developers how to build AI agents, MCP (Model Context Protocol) servers, and automated workflows using Kiro. The learner will be guided step by step through creating a GitHub repository, setting up a Kiro project, installing and configuring a simple MCP server, building a working agent, and wiring everything together into a workflow — all while following security best practices such as never storing secrets in plain text.

The chosen MCP server for this lab is the **GitHub MCP server**, which lets an agent read and write to GitHub repositories using the GitHub API. It is beginner-friendly, widely documented, and immediately useful. The agent built in this lab will be a **"Daily Standup Summarizer"** — it reads open issues from a GitHub repository and produces a short plain-English summary of what needs attention today.

## Glossary

- **Agent**: An AI-powered program that can reason, make decisions, and take actions by calling tools.
- **MCP_Server**: A Model Context Protocol server — a small program that exposes tools (like "list issues" or "create a file") that an agent can call.
- **Workflow**: A sequence of automated steps that the agent follows to complete a task.
- **Kiro**: The AI-powered development environment used in this lab to build and run the agent.
- **GitHub**: A cloud platform for storing and collaborating on code using Git version control.
- **Repository**: A folder on GitHub that stores all the files for a project.
- **Secret**: Sensitive information such as API keys, tokens, passwords, or passphrases.
- **Environment_Variable**: A named value stored in the operating system or a secure config file, used to pass secrets to programs without hard-coding them.
- **PAT**: A GitHub Personal Access Token — a secret credential that grants programmatic access to GitHub.
- **EARS**: Easy Approach to Requirements Syntax — the structured pattern used to write each requirement in this document.

---

## Requirements

### Requirement 1: Lab Environment Setup

**User Story:** As a non-developer learner, I want a guided setup of my local environment and GitHub account, so that I have everything I need before writing any code.

#### Acceptance Criteria

1. THE Lab SHALL instruct the learner to create a free GitHub account if one does not already exist, including a link to `https://github.com/signup`.
2. THE Lab SHALL instruct the learner to install Git on their local machine and verify the installation by running `git --version`.
3. THE Lab SHALL instruct the learner to install Node.js (LTS version) and verify the installation by running `node --version` and `npm --version`.
4. THE Lab SHALL instruct the learner to install Kiro and verify it opens successfully.
5. WHEN the learner completes all installation steps, THE Lab SHALL provide a checklist so the learner can confirm each tool is installed before proceeding.

---

### Requirement 2: GitHub Repository Creation

**User Story:** As a non-developer learner, I want to create a GitHub repository for my project, so that my work is version-controlled and stored safely in the cloud.

#### Acceptance Criteria

1. THE Lab SHALL instruct the learner to create a new public GitHub repository named `standup-agent` using the GitHub web interface.
2. THE Lab SHALL instruct the learner to initialize the repository with a `README.md` file and a `.gitignore` file using the `Node` template.
3. THE Lab SHALL instruct the learner to clone the repository to their local machine using `git clone`.
4. THE Lab SHALL instruct the learner to open the cloned folder in Kiro using "File → Open Folder".
5. WHEN the learner opens the folder in Kiro, THE Lab SHALL confirm the project is ready by showing the expected folder structure.

---

### Requirement 3: Secure Credential Management

**User Story:** As a non-developer learner, I want to store my GitHub token and other secrets securely, so that I never accidentally expose sensitive credentials in my code or on GitHub.

#### Acceptance Criteria

1. THE Lab SHALL explain what a GitHub Personal Access Token (PAT) is and why it is needed before asking the learner to create one.
2. THE Lab SHALL instruct the learner to create a PAT with the minimum required scopes: `repo` (read and write to repositories).
3. THE Lab SHALL instruct the learner to store the PAT in a `.env` file at the root of the project using the format `GITHUB_TOKEN=your_token_here`.
4. THE Lab SHALL instruct the learner to add `.env` to the `.gitignore` file immediately after creating it, before any `git add` or `git commit` command.
5. IF the learner's `.gitignore` file does not contain `.env`, THEN THE Lab SHALL display a prominent warning and halt progress until the learner adds it.
6. THE Lab SHALL explain that the `.env` file is read at runtime by the application and that the token is never written into source code files.
7. THE Lab SHALL provide an `.env.example` file with placeholder values (e.g., `GITHUB_TOKEN=your_token_here`) that is safe to commit to GitHub, so other learners can see what variables are needed.
8. WHERE the learner's operating system supports it, THE Lab SHALL mention that secrets can also be stored in the OS keychain or a secrets manager as a more advanced alternative.

---

### Requirement 4: MCP Server Installation and Configuration

**User Story:** As a non-developer learner, I want to install and configure the GitHub MCP server, so that my agent has a set of ready-made tools for interacting with GitHub.

#### Acceptance Criteria

1. THE Lab SHALL explain what an MCP server is in plain language before any installation steps.
2. THE Lab SHALL instruct the learner to install the GitHub MCP server package by running `npx @modelcontextprotocol/create-server` or the equivalent published package command.
3. THE Lab SHALL instruct the learner to create a Kiro MCP configuration file at `.kiro/settings/mcp.json` that registers the GitHub MCP server.
4. WHEN configuring the MCP server, THE Lab SHALL show the learner how to reference the `GITHUB_TOKEN` environment variable in the configuration rather than pasting the token value directly.
5. THE Lab SHALL provide the exact JSON configuration block the learner needs to paste, with comments explaining each field.
6. WHEN the MCP server is configured, THE Lab SHALL instruct the learner to restart Kiro and verify the server appears in the MCP panel.
7. IF the MCP server fails to start, THEN THE Lab SHALL provide a troubleshooting checklist covering the three most common causes: missing token, wrong Node.js version, and incorrect file path.

---

### Requirement 5: Agent Specification Creation

**User Story:** As a non-developer learner, I want to define what my agent does using a Kiro spec, so that Kiro can generate the agent code for me.

#### Acceptance Criteria

1. THE Lab SHALL explain what a Kiro spec is and how it drives code generation before asking the learner to create one.
2. THE Lab SHALL instruct the learner to create a new spec in Kiro named `standup-summarizer` using the Kiro spec creation UI.
3. THE Lab SHALL provide the exact requirements text the learner should enter into the spec, written in plain English.
4. WHEN the learner submits the spec, THE Lab SHALL instruct the learner to review the generated requirements and design documents before proceeding to task generation.
5. THE Lab SHALL instruct the learner to run the generated tasks one at a time and observe Kiro building the agent code.
6. WHEN all tasks are complete, THE Lab SHALL instruct the learner to inspect the generated files and explain what each file does in one sentence.

---

### Requirement 6: Agent Implementation

**User Story:** As a non-developer learner, I want a working agent that reads open GitHub issues and produces a plain-English standup summary, so that I can see a real, useful result from my work.

#### Acceptance Criteria

1. THE Agent SHALL read all open issues from a specified GitHub repository using the GitHub MCP server tool.
2. WHEN open issues are retrieved, THE Agent SHALL produce a plain-English summary listing each issue title and its label (e.g., "bug", "enhancement") in a numbered list.
3. WHEN no open issues exist in the repository, THE Agent SHALL respond with the message "No open issues found. You're all caught up!"
4. IF the GitHub API returns an error, THEN THE Agent SHALL display a human-readable error message that includes the HTTP status code and a suggested next step.
5. THE Agent SHALL read the target repository name from an environment variable named `GITHUB_REPO` so that the learner can change repositories without editing code.
6. THE Agent SHALL read the GitHub owner (username or organization) from an environment variable named `GITHUB_OWNER`.

---

### Requirement 7: Workflow Creation

**User Story:** As a non-developer learner, I want to define a simple automated workflow in Kiro, so that I understand how agents can be triggered and chained together.

#### Acceptance Criteria

1. THE Lab SHALL explain what a Kiro workflow (hook) is and give one real-world example before asking the learner to create one.
2. THE Lab SHALL instruct the learner to create a workflow that triggers the standup-summarizer agent automatically every time a new file is saved in the repository.
3. THE Workflow SHALL pass the output of the agent to the Kiro chat panel so the learner can see the summary without leaving the editor.
4. WHEN the workflow runs successfully for the first time, THE Lab SHALL prompt the learner to celebrate the milestone and explain what just happened in plain language.
5. THE Lab SHALL instruct the learner to commit and push all project files (excluding `.env`) to GitHub as the final step.

---

### Requirement 8: Security Review Checkpoint

**User Story:** As a non-developer learner, I want a final security checklist at the end of the lab, so that I can confirm I have followed all best practices before sharing my project.

#### Acceptance Criteria

1. THE Lab SHALL present a final security checklist containing at minimum the following items:
   - `.env` is listed in `.gitignore`
   - No tokens, passwords, or API keys appear in any `.js`, `.ts`, `.json`, or `.md` file committed to GitHub
   - The PAT uses the minimum required scopes
   - An `.env.example` file with placeholder values is committed to GitHub
   - The MCP configuration references environment variables, not literal secret values
2. WHEN the learner confirms all checklist items, THE Lab SHALL display a completion message and suggest next steps for further learning.
3. IF the learner cannot confirm one or more checklist items, THEN THE Lab SHALL link directly to the relevant lab section so the learner can fix the issue.
