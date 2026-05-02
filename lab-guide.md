# Lab Guide: Build Your First Agent with Kiro and an MCP Server

Welcome! This lab walks you through building a real, working AI agent from scratch — no prior coding experience required. By the end, you will have:

- A GitHub repository storing your project safely in the cloud
- A working **Daily Standup Summarizer** agent that reads open issues from GitHub
- A configured **GitHub MCP server** that gives your agent tools to talk to GitHub
- An automated **workflow** that runs your agent every time you save a file
- A solid understanding of security best practices for keeping secrets safe

Each section ends with a checkpoint so you can confirm everything is working before moving on.

---

## Table of Contents

1. [Lab Environment Setup](#section-1-lab-environment-setup)
2. [GitHub Repository Creation](#section-2-github-repository-creation)
3. [Secure Credential Management](#section-3-secure-credential-management)
4. [MCP Server Installation and Configuration](#section-4-mcp-server-installation-and-configuration)
5. [Agent Specification Creation](#section-5-agent-specification-creation)
6. [Agent Implementation Walkthrough](#section-6-agent-implementation-walkthrough)
7. [Workflow Creation](#section-7-workflow-creation)
8. [Security Review Checkpoint](#section-8-security-review-checkpoint)

---

## Section 1: Lab Environment Setup

Before writing any code, you need four tools installed on your computer: a GitHub account, Git, Node.js, and Kiro.

### 1.1 Create a GitHub Account

GitHub is a cloud platform for storing and sharing code. Think of it like Google Drive, but designed specifically for software projects.

If you don't have an account yet, go to [https://github.com/signup](https://github.com/signup) and create a free one.

### 1.2 Install Git

Git is the tool that tracks changes to your files and syncs them to GitHub.

- **Windows:** Download from [https://git-scm.com/download/win](https://git-scm.com/download/win) and run the installer with default settings.
- **Mac:** Open Terminal and run `git --version` — if Git isn't installed, macOS will prompt you to install it automatically.

Verify the installation by opening a terminal and running:

```
git --version
```

You should see something like `git version 2.x.x`.

### 1.3 Install Node.js

Node.js lets your computer run JavaScript programs outside of a web browser. It also includes `npm`, a tool for installing code packages.

Download the **LTS (Long Term Support)** version from [https://nodejs.org](https://nodejs.org) and run the installer.

Verify the installation:

```
node --version
npm --version
```

You should see version numbers for both. Node.js v18 or later is required.

### 1.4 Install Kiro

Kiro is the AI-powered development environment you will use to build and run your agent.

Download and install Kiro from [https://kiro.dev](https://kiro.dev). Open it and confirm it launches successfully.

### ✅ Section 1 Checklist

Before moving on, confirm all four items:

- [ ] I have a GitHub account
- [ ] `git --version` shows a version number
- [ ] `node --version` shows v18 or later
- [ ] `npm --version` shows a version number
- [ ] Kiro opens successfully

---

## Section 2: GitHub Repository Creation

A repository (or "repo") is a folder on GitHub that stores all the files for your project, along with the full history of every change ever made.

### 2.1 Create the Repository

1. Log in to [github.com](https://github.com)
2. Click the **+** icon in the top right corner → **New repository**
3. Fill in the details:
   - **Repository name:** `standup-agent`
   - **Description:** `Daily standup summarizer agent built with Kiro`
   - **Visibility:** Public
   - **Initialize this repository with:** check **Add a README file**
   - **Add .gitignore:** select **Node** from the dropdown
4. Click **Create repository**

> **Why a .gitignore?** A `.gitignore` file tells Git which files to ignore and never upload to GitHub. The Node template pre-fills it with common files that should stay off GitHub, like `node_modules/` (a large folder of installed packages). You will add your secrets file to it in Section 3.

### 2.2 Clone the Repository to Your Computer

"Cloning" downloads a copy of the repository to your local machine so you can work on it.

1. On your new repository page on GitHub, click the green **Code** button
2. Copy the HTTPS URL (it looks like `https://github.com/yourusername/standup-agent.git`)
3. Open a terminal and run:

```
git clone https://github.com/yourusername/standup-agent.git
```

Replace `yourusername` with your actual GitHub username.

### 2.3 Open the Project in Kiro

1. Open Kiro
2. Click **File → Open Folder**
3. Navigate to the `standup-agent` folder that was just created and click **Open**

### ✅ Section 2 Checkpoint

Your project folder should look like this in Kiro's file explorer:

```
standup-agent/
├── .gitignore
└── README.md
```

If you see those two files, you're ready to continue.

---

## Section 3: Secure Credential Management

This section is one of the most important in the lab. You will learn how to handle secrets — like passwords and tokens — safely.

### What is a Secret?

A **secret** is any piece of sensitive information that grants access to a system: passwords, API keys, tokens, passphrases. If a secret ends up on GitHub (even briefly), it can be found by automated scanners within seconds and used to access your account.

> **Security rule #1:** Never put a secret directly in your code or in a file that gets committed to GitHub.

### What is a GitHub Personal Access Token (PAT)?

A PAT is a credential that lets programs access GitHub on your behalf. It's safer than using your password because:
- You can limit exactly what it can do (called "scopes")
- You can delete it at any time without changing your password
- You can create separate tokens for different projects

### 3.1 Create a PAT

1. On GitHub, click your profile picture → **Settings**
2. Scroll to the bottom of the left sidebar → **Developer settings**
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Fill in:
   - **Note:** `standup-agent-lab`
   - **Expiration:** 30 days
   - **Scopes:** check only `repo`
6. Click **Generate token**
7. **Copy the token immediately** — it starts with `ghp_` and GitHub will only show it once

> **Security note:** Only check the scopes you actually need. This lab only needs `repo` to read issues. Giving a token more permissions than necessary is a common security mistake called "over-privileged credentials."

### 3.2 Store the Token Securely

**Do NOT paste your token into any code file.** Instead, store it as a Windows environment variable — a value stored securely in your operating system, not in any file in your project.

Open PowerShell and run this command, replacing the token value with your actual token:

```powershell
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_yourTokenHere", "User")
```

The `"User"` parameter stores it for your Windows user account only. It is saved in the Windows registry, which is encrypted and only accessible to you.

> **Why not just use a .env file?** A `.env` file is a common approach for local development, and this project includes one for the Node.js agent. However, Kiro's MCP server reads from your system environment, not from `.env`. Storing the token as a system variable means it works for both.

### 3.3 Create a .env File for the Agent

The Node.js agent also needs to know your GitHub username and repository name. Create a file called `.env` in the root of your project with this content:

```
GITHUB_TOKEN=ghp_yourTokenHere
GITHUB_OWNER=yourusername
GITHUB_REPO=standup-agent
```

Replace the values with your actual token, GitHub username, and repository name.

### 3.4 Protect the .env File

⚠️ **CRITICAL SECURITY STEP — Do this before anything else.**

Open the `.gitignore` file in your project and confirm `.env` is listed. If it is not there, add it now:

```
.env
```

This tells Git to never include your `.env` file when uploading to GitHub. Your token stays on your computer only.

> **Security rule #2:** Always add `.env` to `.gitignore` before running any `git add` command. Once a secret is committed to Git history, it is very difficult to fully remove.

### 3.5 Create a .env.example File

Create a file called `.env.example` in your project root. This file is safe to commit — it contains placeholder values, not real secrets. It shows other people what variables they need to set up:

```
# Copy this file to .env and fill in your real values.
# NEVER commit .env to GitHub.
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username_or_org_here
GITHUB_REPO=your_repository_name_here
```

> **Advanced tip:** On Windows, you can also store secrets in the Windows Credential Manager. On Mac, use the Keychain. These are more secure than environment variables for production systems, but environment variables are the standard approach for development.

### ✅ Section 3 Checklist

- [ ] PAT created with only the `repo` scope
- [ ] Token stored as a Windows user environment variable (`GITHUB_TOKEN`)
- [ ] `.env` file created with your real values
- [ ] `.env` is listed in `.gitignore`
- [ ] `.env.example` file created with placeholder values

---

## Section 4: MCP Server Installation and Configuration

### What is an MCP Server?

An **MCP server** (Model Context Protocol server) is a small helper program that gives an AI agent a set of ready-made tools. Think of it like a power strip — instead of the agent needing to know how to talk to GitHub directly, it just plugs into the MCP server and gets tools like "list issues", "create a comment", or "read a file" ready to use.

The MCP server runs locally on your computer as a background process. It handles the technical details of talking to GitHub's API, so your agent code stays simple.

### 4.1 How the GitHub MCP Server Works

This lab uses `@modelcontextprotocol/server-github`, an npm package that provides GitHub tools to any MCP-compatible agent. When Kiro starts, it reads the MCP configuration file and automatically launches the server using `npx` — no separate installation step needed. `npx` downloads and runs the package on demand.

### 4.2 The MCP Configuration File

The configuration file at `.kiro/settings/mcp.json` is already created in your project. Open it and you will see:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**What each field means:**
- `command`: Use `npx` to run the server (no global install needed)
- `args`: The package name and `-y` to auto-confirm the download
- `env`: Environment variables to pass to the server — notice `${GITHUB_TOKEN}` references your system environment variable, never a literal token value
- `disabled`: Set to `false` so the server starts automatically
- `autoApprove`: Tools that can run without asking you first (empty = ask every time)

> **Security note:** The `${GITHUB_TOKEN}` reference means your actual token value never appears in this file. If someone sees this config file, they see only the variable name, not the secret.

### 4.3 Approve the Environment Variable in Kiro

When Kiro first reads this config, it will show a security warning:

> *"Your MCP configuration contains environment variables that have not been approved: GITHUB_TOKEN"*

This is Kiro protecting you — it won't expand environment variables in MCP configs without your explicit permission. Click **Approve** to allow `GITHUB_TOKEN` to be used.

### 4.4 Verify the MCP Server is Running

After approving and restarting Kiro:

1. Open the Kiro feature panel (the Kiro icon in the left sidebar)
2. Look for the **MCP Servers** section
3. You should see **github** listed with a green connected indicator

### 4.5 Troubleshooting

If the server doesn't appear or shows an error, check these three common causes:

1. **Missing token:** Run `[System.Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")` in PowerShell — if it returns nothing, re-run the command from Section 3.2
2. **Wrong Node.js version:** Run `node --version` — must be v18 or later
3. **Kiro not restarted:** Close and reopen Kiro after setting the environment variable — environment variables are only loaded when a program starts

### ✅ Section 4 Checklist

- [ ] `.kiro/settings/mcp.json` exists and uses `${GITHUB_TOKEN}` (not a literal token)
- [ ] Kiro security warning approved for `GITHUB_TOKEN`
- [ ] Kiro restarted after setting the environment variable
- [ ] GitHub MCP server shows as connected in the Kiro MCP panel

---

## Section 5: Agent Specification Creation

### What is a Kiro Spec?

A **spec** is a structured document that describes what you want to build. In Kiro, you write a spec in plain English and Kiro uses it to generate requirements, a design, and an implementation plan — then builds the code for you task by task.

Think of it like giving a very detailed brief to a contractor. The more clearly you describe what you want, the better the result.

### 5.1 Create the Spec

1. In Kiro, open the chat panel
2. Type a description of what you want to build. Here is the exact text to use:

```
I want to build a Daily Standup Summarizer agent. It should read all open 
issues from a GitHub repository and produce a plain-English numbered list 
of what needs attention today. Each item should show the issue title and 
its labels. If there are no open issues, it should say "No open issues 
found. You're all caught up!" The agent should read the GitHub owner and 
repository name from environment variables so I can change them without 
editing code.
```

3. Kiro will ask if this is a new feature or a bugfix — choose **Build a Feature**
4. Choose **Requirements** as the starting point

### 5.2 Review the Generated Documents

Kiro will generate a requirements document. Read through it and confirm it matches what you described. If anything is missing or wrong, tell Kiro in plain English and it will update the document.

Once you are happy with the requirements, Kiro will generate a design document. Review that too — it describes how the agent will be built.

### 5.3 Run the Tasks

After approving the design, Kiro will generate a task list. You can run tasks one at a time by clicking on them, or tell Kiro "run all tasks" to build everything automatically.

Watch the files appear in your project as Kiro works through each task.

### 5.4 Inspect the Generated Files

When all tasks are complete, look at the files Kiro created:

- `src/agent.js` — the agent code that reads issues and formats the summary
- `tests/` — test files that verify the agent works correctly
- `package.json` — the project configuration listing all dependencies

> **What you just did:** You described what you wanted in plain English, and Kiro translated that into working code. This is spec-driven development — the spec is the source of truth, and the code follows from it.

### ✅ Section 5 Checklist

- [ ] Spec created and requirements approved
- [ ] Design document reviewed and approved
- [ ] All tasks completed
- [ ] `src/agent.js` exists and contains the agent code

---

## Section 6: Agent Implementation Walkthrough

Let's look at what Kiro built and understand how it works.

### 6.1 The Agent File: src/agent.js

Open `src/agent.js`. You will see four main parts:

**Part 1 — Loading secrets safely**
```javascript
import 'dotenv/config';
```
This line loads your `.env` file automatically when the agent starts. Your token and other values become available as `process.env.GITHUB_TOKEN` etc. — they are never written into the code itself.

**Part 2 — Environment variable validation**
```javascript
export function validateEnv(required) { ... }
```
Before doing anything else, the agent checks that all three required variables (`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`) are set. If any are missing, it stops immediately with a clear message telling you exactly which variable is missing and where to set it. This prevents confusing errors later.

**Part 3 — Formatting the summary**
```javascript
export function formatSummary(issues) { ... }
```
This is a pure function — it takes a list of issues and returns a formatted string. It handles two cases: an empty list (returns the "all caught up" message) and a non-empty list (returns a numbered list with titles and labels).

**Part 4 — Error handling**
```javascript
export function errorMessage(statusCode) { ... }
```
When the GitHub API returns an error, this function translates the technical HTTP status code into a plain-English message with a suggested fix. For example, a 401 error means your token is wrong or expired.

**Part 5 — The main function**
```javascript
export async function main(mcpCall) { ... }
```
This wires everything together: validates env vars, calls the GitHub MCP server's `list_issues` tool using your owner and repo values from environment variables (never hard-coded), formats the result, and prints it.

### 6.2 Why Environment Variables Matter

Notice that the agent never contains your actual GitHub username, repository name, or token. They are always read from `process.env`. This means:

- You can use the same agent code with any GitHub repository just by changing `.env`
- Your secrets never appear in the code that gets committed to GitHub
- If you share the code with someone else, they set up their own `.env` with their own credentials

### ✅ Section 6 Checkpoint

- [ ] I can open `src/agent.js` and identify the four main functions
- [ ] I understand that secrets come from environment variables, not from the code
- [ ] I understand what happens when a required environment variable is missing

---

## Section 7: Workflow Creation

### What is a Kiro Workflow (Hook)?

A **hook** is an automation rule that tells Kiro: "when X happens, do Y." 

Real-world example: A team might set up a hook that runs their test suite automatically every time someone saves a file — so they catch mistakes immediately instead of finding out later.

In this lab, your hook will run the standup-summarizer agent automatically every time you save a file, and show the summary in the Kiro chat panel.

### 7.1 How the Hook Works

The hook configuration file is already created at `.kiro/hooks/standup-on-save.kiro.hook`. Open it and you will see:

```json
{
  "name": "Standup Summarizer on Save",
  "version": "1.0.0",
  "description": "Runs the standup-summarizer agent whenever a file is saved",
  "when": {
    "type": "fileEdited",
    "patterns": ["**/*"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Run the standup-summarizer agent: read all open issues from the GitHub repository configured in the .env file using the GitHub MCP server, then show a plain-English numbered summary of what needs attention today."
  }
}
```

**What each field means:**
- `when.type`: `fileEdited` — triggers whenever you save any file
- `when.patterns`: `**/*` — matches all files in the project
- `then.type`: `askAgent` — sends a message to the Kiro agent
- `then.prompt`: the instruction Kiro follows when the hook fires

### 7.2 Test the Workflow

1. Make sure the GitHub MCP server is connected (green in the MCP panel)
2. Open any file in your project — for example, `README.md`
3. Make a small change (add a space or a new line)
4. Save the file (Ctrl+S)
5. Watch the Kiro chat panel — within a few seconds, the standup summary should appear

🎉 **Congratulations!** You just triggered an AI agent automatically by saving a file. That is a real workflow. The agent read your GitHub issues, formatted them, and delivered the summary — all without you doing anything except saving a file.

**What just happened, step by step:**
1. You saved a file
2. Kiro detected the save event and fired the hook
3. The hook sent a prompt to the Kiro agent
4. The agent called the GitHub MCP server's `list_issues` tool
5. The MCP server made a secure HTTPS call to GitHub using your token
6. GitHub returned the open issues
7. The agent formatted them and displayed the summary in the chat panel

### 7.3 Commit and Push Your Work to GitHub

Now save your work to GitHub. Run these commands in the terminal (make sure you are in the `standup-agent` folder):

```
git add .
git commit -m "Add standup-summarizer agent with MCP server and workflow"
git push
```

> **Security reminder:** Git will only upload files that are not in `.gitignore`. Your `.env` file will be skipped automatically. You can verify by running `git status` before committing — `.env` should not appear in the list.

### ✅ Section 7 Checklist

- [ ] Hook file exists at `.kiro/hooks/standup-on-save.kiro.hook`
- [ ] Saving a file triggers the agent and shows a summary in the chat panel
- [ ] All project files committed and pushed to GitHub (excluding `.env`)

---

## Section 8: Security Review Checkpoint

Before sharing your project, run through this final security checklist. Every item should be checked before you consider the lab complete.

### Final Security Checklist

- [ ] **`.env` is listed in `.gitignore`**
  — Open `.gitignore` and confirm `.env` appears. If not, go back to [Section 3.4](#section-3-secure-credential-management).

- [ ] **No tokens, passwords, or API keys appear in any committed file**
  — Open `src/agent.js`, `package.json`, `.kiro/settings/mcp.json`, and `README.md`. Search for `ghp_` — nothing should match. If you find a token, go back to [Section 3](#section-3-secure-credential-management).

- [ ] **The PAT uses only the `repo` scope**
  — On GitHub, go to Settings → Developer settings → Personal access tokens and confirm your `standup-agent-lab` token only has `repo` checked. If it has extra scopes, edit the token and uncheck them.

- [ ] **`.env.example` with placeholder values is committed to GitHub**
  — Run `git log --oneline` and confirm `.env.example` appears in your commits. If not, run `git add .env.example && git commit -m "Add env example" && git push`.

- [ ] **The MCP configuration uses `${GITHUB_TOKEN}`, not a literal token value**
  — Open `.kiro/settings/mcp.json` and confirm the value is `"${GITHUB_TOKEN}"`, not an actual `ghp_...` string. If you see a real token there, replace it with `"${GITHUB_TOKEN}"` immediately and commit the fix.

### 🎉 You're Done!

You have built a working AI agent from scratch. Here is what you accomplished:

- Set up a professional development environment with security best practices
- Created a GitHub repository with proper version control
- Stored secrets safely using environment variables — never in code
- Installed and configured an MCP server that gives your agent GitHub superpowers
- Built an agent that reads real data and produces useful output
- Created an automated workflow that runs without any manual steps

### Next Steps

Now that you understand the fundamentals, here are some directions to explore:

1. **Add more MCP tools** — The GitHub MCP server has many more tools: create issues, add comments, read pull requests. Try asking your agent to do more.

2. **Try a different MCP server** — There are MCP servers for Slack, databases, file systems, web search, and more. Each one gives your agent a new set of tools.

3. **Build a more complex workflow** — Chain multiple agents together, or trigger workflows on different events (like when a new file is created, or when you submit a chat message).

4. **Explore property-based testing** — The test files in this project use `fast-check` to verify that your agent's logic holds for any possible input, not just the examples you thought of.

5. **Learn about secrets managers** — For production systems, look into AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault — these are enterprise-grade alternatives to environment variables.

---

*If any checklist item above is not checked, click the link next to it to go back to the relevant section and fix it before sharing your project.*
