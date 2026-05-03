# Requirements Document

## Introduction

The Agent Security Scanner is a developer-facing security tool that integrates into the Kiro IDE and local Git workflows on Windows workstations. It enables developers who are experimenting with AI agents, MCPs (Model Context Protocols), and Kiro to continue building freely while automatically detecting common security vulnerabilities in their code, dependencies, and configuration files. The scanner runs open-source tools locally, covering OWASP Top 10, CWE Top 25, OWASP LLM Top 10, OWASP Agentic Top 10 (ASI01-ASI10), STRIDE threat patterns, supply chain integrity, credential and secret detection, MCP security, and AI transparency and observability patterns. It can be triggered manually by the developer or automatically on Git pre-commit events, with centralized admin policy management for team deployments.

## Glossary

- **Admin Policy File**: A centrally managed scanner configuration file distributed by an administrator that establishes baseline scanner settings, approved allowlists, and suppression baselines for all developers on a team.
- **Agent Goal Hijacking**: An attack (ASI01) where an attacker alters an agent's objectives by injecting malicious instructions into data the agent processes, such as poisoned documents, emails, or RAG content.
- **Audit Log**: A tamper-evident, append-only record of security-relevant actions performed by or on the Scanner, including scan executions, suppression additions, and allowlist modifications.
- **Checksum**: A cryptographic hash value used to verify the integrity of a downloaded file, confirming it has not been tampered with or corrupted.
- **Configuration Reference**: A complete listing of all available scanner configuration options, their default values, accepted values, and descriptions of what each option controls.
- **Credential**: A secret value such as an API key, password, token, or private key that grants access to a system or service.
- **Custom Rule**: A developer- or team-authored scanning rule (e.g., a Semgrep YAML rule file) placed in a designated directory to extend the Scanner's detection capabilities beyond its built-in rulesets.
- **CWE Top 25**: The Common Weakness Enumeration list of the 25 most dangerous software weaknesses.
- **Debug Log**: An optional operational log file (scanner-debug.log) that captures detailed scanner execution information including tool invocations, exit codes, stdout/stderr output from scanning tools, per-tool timing, and internal scanner state. Only written when debug logging is enabled in the scanner configuration. Intended for troubleshooting and support, not compliance.
- **Dependency**: A third-party package or library declared in a project's dependency manifest (e.g., package.json, requirements.txt, pom.xml).
- **Developer**: A software developer using Kiro IDE who is building AI agents or MCPs on their local workstation.
- **Excessive Agency**: A condition where an LLM agent is granted more permissions or capabilities than required for its intended function, increasing the blast radius of a compromise.
- **FAQ**: Frequently Asked Questions - a curated list of common questions and answers about the scanner's behavior, findings, and configuration.
- **Finding**: A single security issue identified during a Scan, including its severity, location, and description.
- **Git History**: The complete record of all commits ever made to a Git repository, including content that has since been deleted or modified.
- **Indirect Prompt Injection**: An attack where an LLM agent reads external content (e.g., a webpage, file, or email) that contains hidden instructions designed to hijack the agent's behavior.
- **JSON Lines**: A text format where each line is a valid, self-contained JSON object. Used for the Audit Log to make it both human-readable (one event per line) and machine-parseable by log aggregation tools and SIEM systems.
- **Kiro**: The AI-powered IDE in which the Scanner is integrated.
- **Known-Safe Credential Context**: A recognized tooling pattern where environment variables are the accepted and documented mechanism for credential injection, including Docker build arguments, GitHub Actions secrets, Azure DevOps variable groups, AWS CodeBuild environment variables sourced from Parameter Store or Secrets Manager, Docker Compose environment blocks, and cloud SDK credential chain environment variables (e.g., AZURE_CLIENT_SECRET, AWS_SECRET_ACCESS_KEY, GOOGLE_APPLICATION_CREDENTIALS). Findings in these contexts are reported as Informational rather than Critical, and developers may suppress them per Requirement 8 with a justification.
- **Lockfile**: A dependency lockfile (e.g., package-lock.json, yarn.lock, Pipfile.lock) that pins exact versions and integrity hashes of all installed packages.
- **MCP**: Model Context Protocol - a protocol used to extend AI agent capabilities via external tools and services.
- **Model Version Pinning**: The practice of specifying an exact LLM model version identifier in code (e.g., gpt-4-0613 rather than gpt-4) to prevent unintended behavior changes when a model provider updates the default version behind an alias.
- **Observability**: The ability to understand the internal state and behavior of an AI agent by examining its inputs, outputs, tool calls, and decision rationale through logging and monitoring.
- **Open-Source Tool**: A freely available, community-maintained security scanning utility (e.g., Semgrep, Trivy, Gitleaks, Bandit).
- **OWASP Agentic Top 10**: The OWASP Top 10 for Agentic Applications (ASI01-ASI10), released December 2025, the first security framework dedicated to autonomous AI agent systems covering risks such as goal hijacking, tool misuse, and multi-agent trust exploitation.
- **OWASP LLM Top 10**: The Open Worldwide Application Security Project's list of the ten most critical security risks specific to Large Language Model applications.
- **OWASP Top 10**: The Open Worldwide Application Security Project's list of the ten most critical web application security risks.
- **Pre-commit Hook**: A Git hook script that executes automatically before a commit is recorded.
- **Prompt Injection**: An attack where malicious content in user input or external data manipulates an LLM's behavior by being interpreted as instructions.
- **Rule Manifest**: A versioned file maintained by the Scanner that records the source, version, and last-updated timestamp of each scanning ruleset in use.
- **Scan**: A single execution of one or more security scanning tools against a target repository or file set.
- **Scan Report**: A structured summary of all Findings produced by a Scan.
- **Scanner**: The Agent Security Scanner system described in this document.
- **Severity**: A classification of a Finding's risk level - one of: Critical, High, Medium, Low, or Informational.
- **Silent Install**: An installation mode that runs without interactive prompts, suitable for automated deployment via MDM, Group Policy, or provisioning scripts.
- **SLSA**: Supply-chain Levels for Software Artifacts - a security framework for verifying the integrity and provenance of software packages and dependencies.
- **STRIDE**: A threat modeling methodology covering six threat categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.
- **Suppression**: A developer-declared instruction to ignore a specific Finding in future Scans.
- **Tool Call Injection**: An attack where malicious content in a tool's response manipulates an LLM agent's subsequent actions or decisions.
- **Tool Misuse**: An attack pattern (ASI02) where an agent uses legitimate tools in unsafe ways due to ambiguous prompts, misalignment, or manipulated input, potentially causing destructive actions through individually benign tool calls.
- **Transitive Dependency**: A package that is not directly declared in a project's manifest but is required by one of its direct dependencies, forming an indirect dependency chain.
- **Windows Credential Manager**: The Windows operating system's built-in encrypted credential store, accessible via the DPAPI (Data Protection API), the cmdkey CLI tool, the Windows.Security.Credentials WinRT API, or the keytar npm package. Credentials stored here are encrypted and tied to the user's Windows login session.
- **Windows Registry**: The Windows system database that stores configuration settings including environment variables. User-level environment variables are stored in HKEY_CURRENT_USER\Environment in plaintext, readable by any process running as that user. System-level environment variables are stored in HKEY_LOCAL_MACHINE\SYSTEM\... in plaintext, readable by any process on the machine. The registry is NOT a secure credential store.

---

## Tools and Integrations

This section describes every external tool and platform integration used by the Agent Security Scanner, how each one is invoked, and what it is responsible for. All tools are free and open-source unless otherwise noted.

---

### Semgrep

**Invocation:** CLI subprocess — the Scanner spawns `semgrep` as a child process, passing rule registry identifiers or local rule file paths and the target directory as arguments. Output is captured as JSON via `--json` flag and parsed by the Scanner.

**Used for:** Requirements 3, 12, 13, 14, 17, 24, 27, 29, 30

**What it does:** Semgrep is a static analysis engine that matches code patterns against a library of rules. The Scanner uses Semgrep to detect:
- OWASP Top 10 and CWE Top 25 vulnerability patterns (e.g., SQL injection, XSS, insecure deserialization)
- OWASP LLM Top 10 patterns (e.g., prompt injection via string concatenation, insecure output handling, sensitive data in LLM payloads)
- STRIDE threat patterns (e.g., missing input validation, missing logging on state-changing operations)
- Agent-specific attack patterns (e.g., tool call injection, indirect prompt injection, memory poisoning)
- OWASP Agentic Top 10 patterns (e.g., unvalidated tool arguments, insecure inter-agent communication)
- AI transparency gaps (e.g., missing LLM call logging, unpinned model aliases)
- Windows Credential Manager enforcement patterns (e.g., dotenv usage, credential concatenation)
- MCP malicious code patterns (e.g., data exfiltration, reverse shell indicators)

Semgrep rules are sourced from the public Semgrep registry (`semgrep.dev/r`) and from the local `.kiro/security/custom-rules/` directory. Rules are updated via the `update-rules` command.

**Minimum version required:** Semgrep 1.50.0

**Installation:** Downloaded during `scanner setup` via the Semgrep Python package (`pip install semgrep`) or the standalone Windows binary. Checksum verified before installation.

---

### Gitleaks

**Invocation:** CLI subprocess — the Scanner spawns `gitleaks` as a child process with either `detect` (workspace file scan) or `detect --no-git` / `git log` mode (history scan). Output is captured as JSON via `--report-format json` and parsed by the Scanner.

**Used for:** Requirements 5, 16

**What it does:** Gitleaks is a secret detection tool that scans files and git history for credential patterns using regular expressions and entropy analysis. The Scanner uses Gitleaks to:
- Detect hardcoded API keys, tokens, passwords, and private keys in source files and configuration files
- Scan `.env`, `mcp.json`, `appsettings.json`, and other config files for plaintext credentials
- Scan the full git commit history for secrets that were previously committed and later deleted
- Detect credentials even in files listed in `.gitignore`

Gitleaks rules are updated via the `update-rules` command. The Scanner applies additional post-processing to Gitleaks output to classify findings by Known-Safe Credential Context and to redact secret values before writing to logs.

**Minimum version required:** Gitleaks 8.18.0

**Installation:** Downloaded during `scanner setup` as a standalone Windows binary from the official Gitleaks GitHub releases. Checksum verified before installation.

---

### Trivy

**Invocation:** CLI subprocess — the Scanner spawns `trivy` as a child process with the `fs` subcommand targeting the workspace directory or a specific package directory. Output is captured as JSON via `--format json` and parsed by the Scanner.

**Used for:** Requirements 4, 12, 15

**What it does:** Trivy is a comprehensive vulnerability scanner for dependencies and container images. The Scanner uses Trivy to:
- Scan `package.json`, `requirements.txt`, `Pipfile`, `pom.xml`, and `Cargo.toml` manifests for known CVEs in both direct and transitive dependencies
- Check npm-based MCP packages and their full dependency trees against CVE and OSV databases
- Detect dependencies sourced from non-registry locations
- Trivy automatically updates its vulnerability database (from GitHub Advisory Database, NVD, OSV) before each scan when network is available

**Minimum version required:** Trivy 0.50.0

**Installation:** Downloaded during `scanner setup` as a standalone Windows binary from the official Trivy GitHub releases. Checksum verified before installation.

---

### npm audit

**Invocation:** CLI subprocess — the Scanner spawns `npm audit --json` in the workspace directory containing a `package.json`. Output is captured as JSON and parsed by the Scanner.

**Used for:** Requirement 4 (supplementary to Trivy for Node.js projects)

**What it does:** npm audit queries the npm registry's security advisory database for known vulnerabilities in the project's Node.js dependencies. It provides package-specific remediation commands (e.g., `npm audit fix`). Used as a supplementary check alongside Trivy to catch advisories that may appear in the npm registry before the broader CVE databases.

**Minimum version required:** npm 8.0.0 (bundled with Node.js 16+)

**Installation:** Assumed present if Node.js is installed. The Scanner checks for npm during setup and reports if not found.

---

### pip-audit

**Invocation:** CLI subprocess — the Scanner spawns `pip-audit --format json` targeting the workspace's Python dependency files. Output is captured as JSON and parsed by the Scanner.

**Used for:** Requirement 4 (supplementary to Trivy for Python projects)

**What it does:** pip-audit queries the Python Packaging Advisory Database (PyPA) and OSV for known vulnerabilities in Python dependencies declared in `requirements.txt` or `Pipfile`. Provides package-specific remediation recommendations.

**Minimum version required:** pip-audit 2.6.0

**Installation:** Downloaded during `scanner setup` via `pip install pip-audit`. Checksum verified before installation.

---

### detect-secrets

**Invocation:** CLI subprocess — the Scanner spawns `detect-secrets scan --all-files --json` targeting the workspace directory. Output is captured as JSON and parsed by the Scanner.

**Used for:** Requirement 5 (supplementary to Gitleaks)

**What it does:** detect-secrets is a Python-based secret detection tool that uses a plugin architecture to identify secrets using both pattern matching and entropy analysis. Used as a supplementary scanner alongside Gitleaks to improve coverage of secret types, particularly for high-entropy strings that may not match known patterns.

**Minimum version required:** detect-secrets 1.4.0

**Installation:** Downloaded during `scanner setup` via `pip install detect-secrets`. Checksum verified before installation.

---

### Git (Pre-commit Hook)

**Invocation:** Shell script — the Scanner installs a `.git/hooks/pre-commit` script in the developer's local repository during setup. Git invokes this script automatically before recording each commit. The script calls the Scanner CLI, which runs the scan and exits with code 0 (allow) or 1 (block).

**Used for:** Requirement 2

**What it does:** The pre-commit hook intercepts `git commit` invocations and triggers a scan of the staged files before the commit is recorded. If Critical or High severity findings are detected, the hook exits with a non-zero code, blocking the commit and displaying the findings. The hook is a plain Windows batch/PowerShell script that delegates to the Scanner CLI.

**Note:** The hook is bypassed when the developer uses `git commit --no-verify`. This bypass event is recorded in the Audit Log.

---

### Kiro IDE Extension API

**Invocation:** VS Code-compatible extension API — the Scanner is packaged as a Kiro IDE extension that registers commands, diagnostic providers, and status bar items using the VS Code extension API (`vscode` module).

**Used for:** Requirements 1, 7, 19, 20, 21, 22, 23

**What it does:** The Kiro IDE integration provides:
- **Command palette commands**: `Agent Security Scanner: Run Scan`, `Agent Security Scanner: Run History Scan`, `Agent Security Scanner: Update Rules`, `Agent Security Scanner: View Audit Log`, `Agent Security Scanner: Onboarding`
- **Inline diagnostic annotations**: Findings are published to VS Code's `DiagnosticCollection` API, which renders them as squiggly underlines in the editor with hover tooltips showing the finding title, standard identifier, remediation guidance, and reference URL
- **Status bar updates**: Scan progress and phase are shown in the Kiro status bar via `StatusBarItem` API
- **Output panel**: Scan reports are written to a dedicated `OutputChannel` named "Agent Security Scanner"
- **Code actions**: Quick-fix suggestions for suppressing findings are registered via `CodeActionProvider`

**Note:** The Scanner does not use MCP for its own operation. It scans MCP configuration files and MCP source code as targets, but the Scanner itself communicates with Kiro via the standard VS Code extension API, not via MCP.

---

### Windows Credential Manager (DPAPI / WinRT API)

**Invocation:** Native Windows API — accessed from the Scanner's Node.js runtime via the `keytar` npm package (which wraps the Windows Credential Manager Win32 API), or from Python via the `win32cred` package (which wraps `CredRead`/`CredWrite` Win32 functions).

**Used for:** Requirements 5, 30 (guidance and enforcement)

**What it does:** The Windows Credential Manager is the secure credential store that the Scanner enforces as the required storage location for all developer secrets. The Scanner does not store its own credentials in the Credential Manager — rather, it:
- Detects when developer code reads credentials from insecure sources (environment variables, hardcoded strings, `.env` files) and flags these as findings
- Provides concrete remediation code examples showing how to store and retrieve credentials using the Credential Manager via `keytar` (JavaScript/TypeScript), `win32cred` (Python), or `Get-StoredCredential` (PowerShell)
- Detects when code writes credentials to insecure locations (registry, files, logs) and flags these as Critical findings

---

### HTTPS Webhook (Optional — Audit Log Forwarding)

**Invocation:** HTTP POST — the Scanner makes outbound HTTPS POST requests to a configured webhook URL, sending each Audit Log entry as a JSON payload in real time.

**Used for:** Requirement 23

**What it does:** When log forwarding is configured, the Scanner forwards each Audit Log entry to an external SIEM or log aggregation system (e.g., Splunk HTTP Event Collector, Azure Monitor Data Collection Endpoint, or a custom webhook). This enables centralized security monitoring across all developer workstations without requiring developers to manually export logs. Failed forwarding attempts are retried and do not block scanner operation.

---

### Scanner Update Source (HTTPS)

**Invocation:** HTTPS GET — the Scanner makes outbound HTTPS requests to its official release endpoint to check for and download new versions during `self-update`.

**Used for:** Requirement 28

**What it does:** The Scanner checks a versioned release manifest at its official release URL to determine if a newer version is available. If so, it downloads the new binary, verifies its SHA-256 checksum against the published value, and replaces the current installation. All network requests respect the configured proxy settings.

---

## Requirements

### Requirement 1: Manual Scan Execution

**User Story:** As a developer, I want to manually trigger a security scan of my project at any time, so that I can check for vulnerabilities on demand without waiting for a commit.

#### Acceptance Criteria

1. THE Scanner SHALL provide a command that developers can invoke from the Kiro IDE command palette to start a Scan of the current workspace.
2. THE Scanner SHALL provide a CLI command that developers can invoke from a terminal to start a Scan of a specified directory.
3. WHEN a manual Scan is initiated, THE Scanner SHALL begin scanning within 5 seconds of the invocation.
4. WHEN a manual Scan completes, THE Scanner SHALL display the Scan Report to the developer in the Kiro IDE output panel.
5. WHEN a manual Scan completes, THE Scanner SHALL display the Scan Report to the developer in the terminal if invoked via CLI.

---

### Requirement 2: Automatic Scan on Git Commit

**User Story:** As a developer, I want the scanner to run automatically when I commit code, so that security issues are caught before they enter the repository history.

#### Acceptance Criteria

1. THE Scanner SHALL install a Git pre-commit hook in the developer's local repository upon setup.
2. WHEN a developer executes `git commit`, THE Scanner SHALL automatically run a Scan on the staged files before the commit is recorded.
3. WHEN a Scan triggered by a pre-commit hook produces one or more Critical or High severity Findings, THE Scanner SHALL block the commit and display the Findings to the developer.
4. WHEN a Scan triggered by a pre-commit hook produces only Medium, Low, or Informational severity Findings, THE Scanner SHALL allow the commit to proceed and display the Findings as warnings.
5. WHEN a developer invokes `git commit` with the `--no-verify` flag, THE Scanner SHALL skip the pre-commit Scan and allow the commit to proceed without scanning.
6. IF the pre-commit hook Scan fails to complete due to a tool error, THEN THE Scanner SHALL log the error, allow the commit to proceed, and notify the developer of the scan failure.

---

### Requirement 3: OWASP Top 10 and CWE Top 25 Code Scanning

**User Story:** As a developer, I want my code scanned for OWASP Top 10 and CWE Top 25 vulnerabilities, so that I can identify and fix common security weaknesses before they reach production.

#### Acceptance Criteria

1. THE Scanner SHALL use at least one open-source static analysis tool (e.g., Semgrep) to detect code patterns associated with the OWASP Top 10 vulnerability categories.
2. THE Scanner SHALL use at least one open-source static analysis tool to detect code patterns associated with the CWE Top 25 most dangerous software weaknesses.
3. WHEN a Finding is produced, THE Scanner SHALL include the associated OWASP Top 10 category or CWE identifier in the Finding.
4. WHEN a Finding is produced, THE Scanner SHALL include the file path, line number, and a description of the vulnerability in the Finding.
5. THE Scanner SHALL support scanning source files written in at least the following languages: JavaScript, TypeScript, Python, and JSON.

---

### Requirement 4: Dependency Vulnerability Scanning

**User Story:** As a developer, I want my project dependencies scanned for known vulnerabilities, so that I can update or replace packages that introduce security risks.

#### Acceptance Criteria

1. THE Scanner SHALL detect and scan dependency manifests including `package.json`, `requirements.txt`, `Pipfile`, `pom.xml`, and `Cargo.toml` when present in the workspace.
2. WHEN a dependency manifest is found, THE Scanner SHALL use an open-source tool (e.g., Trivy, npm audit, pip-audit) to check both direct and transitive dependencies in the full dependency tree against known vulnerability databases (e.g., CVE, OSV), not only the packages explicitly declared in the manifest.
3. WHEN a vulnerable Dependency is found, THE Scanner SHALL report the package name, installed version, vulnerable version range, CVE identifier, and Severity in the Finding.
4. WHEN a vulnerable Dependency is found, THE Scanner SHALL include a recommended remediation action (e.g., upgrade to a specific version) in the Finding.
5. THE Scanner SHALL complete a dependency Scan of a manifest containing up to 500 direct packages within 60 seconds under normal network conditions; WHERE the full transitive dependency tree exceeds 2,000 packages, THE Scanner SHALL notify the developer that the scan may take longer and SHALL display progress updates per Requirement 20.

---

### Requirement 5: Credential and Secret Detection

**User Story:** As a developer, I want the scanner to detect credentials and secrets stored insecurely in my codebase and enforce that all secrets are stored in the Windows Credential Manager, so that I can ensure no plaintext credentials exist in code, configuration files, or the Windows environment variable registry.

#### Acceptance Criteria

1. THE Scanner SHALL scan all files in the workspace for patterns that indicate insecurely stored Credentials, including API keys, tokens, passwords, and private keys stored as plaintext string literals, in configuration files, or in `.env` files.

2. THE Scanner SHALL specifically scan `.env` files, `mcp.json` files, `appsettings.json`, `appsettings.*.json`, `web.config`, `app.config`, and other configuration files for plaintext Credentials, and SHALL produce a Critical severity Finding for each Credential detected.

3. THE Scanner SHALL scan source code files for hardcoded Credential patterns (e.g., string literals matching known secret formats such as API keys, tokens, passwords, and private keys) and SHALL produce a Critical severity Finding for each hardcoded Credential detected.

4. THE Scanner SHALL detect code that reads Credentials from Windows environment variables (e.g., `process.env.MY_SECRET`, `os.environ['MY_SECRET']`, `Environment.GetEnvironmentVariable("MY_SECRET")`) and SHALL produce a High severity Finding noting that Windows environment variables are stored in plaintext in the Windows Registry and are not a secure credential store; the Finding SHALL recommend migrating the credential to Windows Credential Manager and accessing it via the `keytar` npm package, the `Windows.Security.Credentials` WinRT API, the `cmdkey` CLI tool, or the `win32cred` Python package.

5. WHEN a Credential access pattern matches a Known-Safe Credential Context -- specifically: Docker `ENV` instructions or `--build-arg` flags in Dockerfiles, GitHub Actions `${{ secrets.* }}` expressions, Azure DevOps `$(*)` variable group references, AWS CodeBuild environment variables declared with a `valueFrom` referencing Parameter Store or Secrets Manager, Docker Compose `environment:` blocks, or well-known cloud SDK credential chain environment variable names (`AZURE_CLIENT_SECRET`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`) -- THE Scanner SHALL produce an Informational severity Finding rather than a High severity Finding, noting the recognized tooling context and advising the developer to verify the credential is injected at runtime from a secure source rather than hardcoded.

6. THE Scanner SHALL detect code that reads Credentials from Windows environment variables outside of a Known-Safe Credential Context and SHALL produce a High severity Finding with concrete remediation guidance showing how to store and retrieve the same credential using Windows Credential Manager, including a code example in the language of the scanned file.

7. THE Scanner SHALL use an open-source secret detection tool (e.g., Gitleaks, detect-secrets) to identify Credential patterns across all file types.

8. IF a file is listed in `.gitignore`, THEN THE Scanner SHALL still scan the file for Credentials and include any Findings in the Scan Report.

9. WHEN a developer suppresses a High severity Finding produced under AC 4 or AC 6 (environment variable credential access), THE Scanner SHALL require the suppression entry to include a justification string explaining why Windows Credential Manager cannot be used in this specific context, per Requirement 8 AC 4.

10. THE Scanner SHALL include in the remediation guidance for every Credential Finding a reference to the Windows Credential Manager and the appropriate access method for the language of the scanned file:
    - JavaScript/TypeScript: `keytar` npm package (`keytar.getPassword(service, account)`)
    - Python: `win32cred` package (`win32cred.CredRead(target, type)`) or `keyring` package with Windows backend
    - PowerShell: `Get-StoredCredential` from the `CredentialManager` module or `[System.Net.NetworkCredential]` with Windows Credential Manager

---

### Requirement 6: MCP Configuration Security Scanning

**User Story:** As a developer, I want the scanner to check my MCP configuration files for security issues, so that I can safely experiment with MCPs without introducing vulnerabilities.

#### Acceptance Criteria

1. THE Scanner SHALL detect and scan MCP configuration files (e.g., `mcp.json`, `.kiro/settings/mcp.json`) in the workspace.
2. WHEN an MCP configuration file is found, THE Scanner SHALL check for plaintext Credentials embedded in the configuration and SHALL produce a Critical severity Finding for each plaintext Credential detected; the Finding SHALL include remediation guidance to store the credential in Windows Credential Manager and reference it by name in the MCP configuration rather than embedding the value directly.
3. WHEN an MCP configuration file references an external MCP server URL that is NOT present in the MCP allowlist (per Requirement 11), THE Scanner SHALL flag the reference as an Informational Finding noting that the MCP has not been verified as an official manufacturer-supported MCP.
4. WHEN an MCP configuration file grants broad filesystem or network permissions, THE Scanner SHALL produce a High severity Finding describing the permission scope.
5. THE Scanner SHALL check MCP configuration files for use of non-HTTPS transport protocols and produce a High severity Finding when a non-HTTPS URL is detected.

---

### Requirement 7: Scan Report Generation and Display

**User Story:** As a developer, I want a clear, actionable scan report after each scan that shows me exactly what was found, how to fix it, and which security standard flagged it, so that I can quickly understand and remediate issues without having to look up external documentation.

#### Acceptance Criteria

1. WHEN a Scan completes, THE Scanner SHALL produce a Scan Report containing: total Finding count broken down by Severity (Critical, High, Medium, Low, Informational), and a list of all Findings ordered by Severity descending.
2. THE Scanner SHALL format each Finding in the Scan Report with all of the following fields:
   - Severity level (Critical / High / Medium / Low / Informational)
   - Finding title (short descriptive name)
   - File path and line number
   - Standard or framework identifier (e.g., "OWASP LLM01", "CWE-798", "CVE-2024-1234", "STRIDE-Tampering")
   - Description of the detected vulnerability or pattern
   - Concrete remediation guidance -- a specific, actionable fix suggestion that includes example code or configuration where applicable (not just a general description)
   - Reference URL linking directly to the relevant standard, framework page, or CVE entry (e.g., https://cwe.mitre.org/data/definitions/798.html, https://owasp.org/www-project-top-10-for-llm/)
3. THE Scanner SHALL output the Scan Report in a structured, human-readable format to the terminal, using visual severity indicators (e.g., [CRITICAL], [HIGH]) and clear section separators between findings.
4. WHEN a Scan triggered by a pre-commit hook blocks a commit, THE Scanner SHALL display only the Critical and High severity Findings in the terminal output, with a summary count of lower-severity findings, to keep the output focused and actionable.
5. WHEN a manual Scan completes, THE Scanner SHALL display the full Scan Report including all severity levels in the Kiro IDE output panel.
6. WHERE a developer requests machine-readable output, THE Scanner SHALL output the Scan Report in JSON format containing all Finding fields defined in AC 2.
7. WHEN a Scan produces zero Findings, THE Scanner SHALL output a message confirming that no issues were detected, including the ruleset versions used as recorded in the Rule Manifest.
8. THE Scanner SHALL persist the most recent Scan Report to a file at `.kiro/security/last-scan-report.json` in the workspace, in JSON format, after every Scan.
9. THE Scanner SHALL include the Rule Manifest version information (ruleset names and versions/timestamps) in every Scan Report so that developers and auditors can verify which rules were active when the report was produced.

---

### Requirement 8: Finding Suppression

**User Story:** As a developer, I want to suppress specific findings that I have reviewed and accepted, so that repeated scans do not surface known false positives.

#### Acceptance Criteria

1. THE Scanner SHALL support a suppression configuration file at `.kiro/security/suppressions.json` that lists Findings the developer has chosen to suppress.
2. WHEN a suppressed Finding is encountered during a Scan, THE Scanner SHALL exclude it from the Scan Report's active Finding count and list.
3. WHEN a suppressed Finding is encountered during a Scan, THE Scanner SHALL include it in a separate "Suppressed Findings" section of the Scan Report.
4. THE Scanner SHALL require each suppression entry to include: the rule identifier, file path, and a developer-provided justification string.
5. WHEN a suppression entry references a file path that no longer exists in the workspace, THE Scanner SHALL produce an Informational Finding noting the stale suppression entry.
6. WHEN an admin policy file is updated to prohibit a suppression that a developer had previously added to their local suppression file, THE Scanner SHALL treat the previously-allowed suppression as invalid on the next Scan, exclude it from the active suppression list, produce an Informational Finding noting that the suppression has been invalidated by admin policy, and log the invalidation event to the Audit Log.

---

### Requirement 9: Local Installation and Setup

**User Story:** As a developer or administrator, I want a simple, secure setup process to install the scanner on Windows workstations, so that I can get started quickly whether installing manually or deploying at scale.

#### Acceptance Criteria

1. THE Scanner SHALL provide a setup command that installs all required open-source scanning tool dependencies on the developer's local Windows workstation.
2. THE Scanner SHALL support installation on Windows operating systems only.
3. WHEN the setup command is run, THE Scanner SHALL verify that each required scanning tool is available and meets the minimum required version, and SHALL report any tools that failed to install or that do not meet the minimum version requirement.
4. WHEN the setup command is run in a Git repository, THE Scanner SHALL offer to install the pre-commit hook automatically.
5. THE Scanner SHALL complete the setup process without requiring elevated (administrator) system privileges, except where a specific scanning tool explicitly requires them.
6. IF a required scanning tool is already installed on the workstation and meets the minimum required version, THEN THE Scanner SHALL use the existing installation rather than reinstalling it.
7. IF a required scanning tool is already installed but does not meet the minimum required version, THEN THE Scanner SHALL notify the developer and offer to upgrade the tool to the required version.
8. THE Scanner SHALL support a silent (unattended) installation mode, invokable via a command-line flag (e.g., `--silent`), that runs the full setup process without interactive prompts and exits with a non-zero status code if any required tool fails to install, suitable for deployment via MDM, Group Policy, or provisioning scripts.
9. WHEN downloading scanning tool binaries or packages during setup, THE Scanner SHALL verify the cryptographic checksum of each downloaded file against the expected checksum published by the tool's official source before installation, and SHALL abort installation and report an error if any checksum does not match.
10. THE Scanner SHALL support configuration of an HTTP/HTTPS proxy for all outbound network connections made during setup and rule updates, via a proxy setting in the scanner configuration file or via standard Windows proxy environment variables (e.g., `HTTPS_PROXY`, `HTTP_PROXY`).

---

### Requirement 10: Scan Performance

**User Story:** As a developer, I want scans to complete quickly, so that the pre-commit hook does not significantly slow down my development workflow.

#### Acceptance Criteria

1. WHEN a pre-commit hook Scan is triggered on a changeset of up to 50 staged files, THE Scanner SHALL complete the Scan within 30 seconds.
2. THE Scanner SHALL run scanning tools in parallel where the tools support concurrent execution.
3. WHERE a developer configures a subset of scan categories to run (e.g., credentials only), THE Scanner SHALL run only the configured categories during that Scan; HOWEVER, IF an admin policy file is present (per Requirement 25) and specifies enabled or disabled scan categories, the admin policy settings SHALL take precedence over developer-local category configuration, and the developer SHALL be notified when a local category setting has been overridden by admin policy.
4. WHEN a full workspace Scan is initiated manually on a repository containing up to 10,000 files, THE Scanner SHALL complete within 5 minutes.

---

### Requirement 11: MCP Allowlist

**User Story:** As a developer or administrator, I want to maintain an allowlist of approved MCP server URLs and identifiers, so that trusted MCPs do not generate unnecessary informational findings during scans.

#### Acceptance Criteria

1. THE Scanner SHALL support an allowlist configuration file at `.kiro/security/mcp-allowlist.json` that lists approved MCP server URLs and identifiers.
2. WHEN an MCP configuration file references an external MCP server URL or identifier that is present in the allowlist, THE Scanner SHALL NOT produce the "unverified external MCP" Informational Finding for that entry.
3. WHEN an MCP configuration file references an external MCP server URL or identifier that is NOT present in the allowlist, THE Scanner SHALL produce the "unverified external MCP" Informational Finding as defined in Requirement 6.
4. THE Scanner SHALL require each allowlist entry to include: the MCP server URL or identifier, and an optional description field for documentation purposes.
5. WHEN the allowlist configuration file is absent or empty, THE Scanner SHALL treat all external MCP references as unallowlisted and apply standard MCP configuration scanning rules.

---

### Requirement 12: MCP Malicious Code Scanning

**User Story:** As a developer, I want the scanner to analyze locally installed MCP source code and dependencies for malicious patterns, so that I can detect compromised or malicious MCPs before they execute in my environment.

#### Acceptance Criteria

1. WHEN an MCP is installed locally (e.g., as an npm package or cloned repository), THE Scanner SHALL run static analysis against the MCP's source code to detect malicious patterns including: data exfiltration patterns, reverse shell indicators, credential harvesting code, suspicious outbound network calls, obfuscated code, and broad environment variable access.
2. WHEN clearly malicious patterns are detected in an MCP's source code -- specifically data exfiltration patterns, reverse shell indicators, credential harvesting code, suspicious outbound network calls, or broad environment variable access -- THE Scanner SHALL report the Finding with Critical severity, including the file path, line number, pattern type, and a description of the detected pattern.
3. WHEN obfuscated code is detected in an MCP's source code, THE Scanner SHALL report the Finding with High severity, including the file path, line number, and a note in the Finding that obfuscation is suspicious but may also be present in legitimate minified build artifacts, and that the developer should review and suppress with justification if it is a known false positive.
4. WHEN an MCP is npm-based and installed locally, THE Scanner SHALL check the MCP package and its full dependency tree against known malicious package databases (e.g., CVE, OSV).
5. WHEN a vulnerable or malicious package is identified in an MCP's dependency tree, THE Scanner SHALL report the package name, version, identifier (CVE or OSV ID), and Severity in the Finding.
6. WHEN an MCP is remote (referenced by URL only, with no local source code available) and the MCP configuration is scanned per Requirement 6, THE Scanner SHALL produce a separate Informational Finding noting that source code analysis was not possible for this MCP and that only configuration-level checks were performed.
7. THE Scanner SHALL distinguish between locally installed MCPs and remote-only MCPs based on the presence of a resolvable local file path or installed package directory in the MCP configuration.

---

### Requirement 13: OWASP LLM Top 10 Scanning

**User Story:** As a developer building LLM-based agents or MCPs with Kiro, I want the scanner to detect vulnerabilities from the OWASP LLM Top 10 that are identifiable via static analysis, so that I can find and fix LLM-specific security weaknesses before they reach production.

#### Acceptance Criteria

1. THE Scanner SHALL use static analysis to detect code patterns associated with LLM01 (Prompt Injection) -- specifically, code that constructs LLM prompts by concatenating or interpolating unsanitized user input, external data, or tool outputs directly into prompt strings without sanitization or validation.
2. THE Scanner SHALL use static analysis to detect code patterns associated with LLM02 (Insecure Output Handling) -- specifically, LLM-generated output passed directly to dangerous sinks such as shell command execution, SQL queries, HTML rendering, or `eval()` without validation or sanitization.
3. THE Scanner SHALL use static analysis to detect code patterns associated with LLM06 (Sensitive Information Disclosure) -- specifically, code that includes PII, credentials, or sensitive environment variables directly in LLM API call payloads or prompt construction.
4. THE Scanner SHALL use static analysis to detect code patterns associated with LLM07 (Insecure Plugin/MCP Design) -- specifically, MCP tool definitions or agent plugin code that lacks input validation, accepts arbitrary file paths, executes shell commands from tool arguments, or exposes overly broad capabilities without scope restrictions.
5. THE Scanner SHALL use static analysis to detect code patterns associated with LLM08 (Excessive Agency) -- specifically, agent or MCP code that requests or is granted filesystem, network, or code execution permissions beyond what is needed for its declared purpose, detectable via permission scope patterns in configuration and code.
6. WHEN a Finding is produced for an OWASP LLM Top 10 category, THE Scanner SHALL include the corresponding LLM Top 10 category identifier (e.g., LLM01, LLM07) in the Finding, in the same manner that OWASP Top 10 and CWE identifiers are included per Requirement 3.
7. WHEN a Finding is produced for an OWASP LLM Top 10 category, THE Scanner SHALL include the file path, line number, category identifier, and a description of the detected pattern in the Finding.
8. THE Scanner SHALL support OWASP LLM Top 10 scanning for source files written in at least the following languages: JavaScript, TypeScript, and Python.

---

### Requirement 14: STRIDE-Based Threat Pattern Detection

**User Story:** As a developer building agents and MCPs, I want the scanner to detect code patterns associated with STRIDE threat categories, so that I can identify common architectural security weaknesses in my agent code before they are exploited.

#### Acceptance Criteria

1. THE Scanner SHALL use static analysis to detect patterns associated with the Spoofing threat category -- specifically, MCP tool handlers or agent API endpoints that perform no authentication or identity verification before executing privileged operations.
2. THE Scanner SHALL use static analysis to detect patterns associated with the Tampering threat category -- specifically, MCP tool definitions or agent input handlers that accept and use external input without any validation, sanitization, or type checking.
3. THE Scanner SHALL use static analysis to detect patterns associated with the Repudiation threat category -- specifically, agent action handlers or MCP tool executions that perform state-changing operations (file writes, API calls, database mutations) without any logging or audit trail.
4. THE Scanner SHALL use static analysis to detect patterns associated with the Information Disclosure threat category -- specifically, code that writes sensitive data, credentials, or PII to log outputs, console statements, or error messages.
5. THE Scanner SHALL use static analysis to detect patterns associated with the Elevation of Privilege threat category -- specifically, code that dynamically constructs or executes shell commands, system calls, or eval() expressions using externally supplied input.
6. WHEN a Finding is produced for a STRIDE threat category, THE Scanner SHALL include the STRIDE category name (e.g., "STRIDE-Tampering", "STRIDE-Repudiation") in the Finding along with the file path, line number, and description of the detected pattern.
7. THE Scanner SHALL support STRIDE pattern detection for source files written in at least the following languages: JavaScript, TypeScript, and Python.

---

### Requirement 15: Supply Chain and Dependency Integrity Checks

**User Story:** As a developer, I want the scanner to verify that my project's dependency supply chain is properly secured, so that I can detect missing lockfiles, unpinned versions, and unverified package integrity before they introduce supply chain risks.

#### Acceptance Criteria

1. WHEN a `package.json` is present in the workspace without a corresponding `package-lock.json` or `yarn.lock`, THE Scanner SHALL produce a High severity Finding indicating that no dependency Lockfile is present and that package versions are not pinned.
2. WHEN a `requirements.txt` or `Pipfile` is present without a corresponding `Pipfile.lock` or `requirements.txt` with pinned versions, THE Scanner SHALL produce a High severity Finding indicating unpinned Python dependencies.
3. THE Scanner SHALL detect dependency manifest entries that use version ranges (e.g., `^`, `~`, `*`, `>=`) rather than exact pinned versions and produce a Medium severity Finding for each such entry.
4. WHEN a Lockfile is present, THE Scanner SHALL verify that the Lockfile is committed to the repository (i.e., not listed in `.gitignore`) and produce a High severity Finding if the Lockfile is excluded from version control.
5. THE Scanner SHALL detect `package.json` scripts (e.g., `postinstall`, `preinstall`) that execute shell commands and produce a High severity Finding noting that install-time scripts can execute arbitrary code during dependency installation.
6. WHEN a dependency is sourced from a non-registry location (e.g., a GitHub URL, local file path, or private registry) in a manifest, THE Scanner SHALL produce a Medium severity Finding noting the non-standard dependency source.

---

### Requirement 16: Git History Secret Scanning

**User Story:** As a developer, I want the scanner to scan the full Git commit history of my repository for secrets and credentials that were previously committed and later deleted, so that I can identify and remediate historical secret exposures before they are exploited.

#### Acceptance Criteria

1. THE Scanner SHALL support a git history scan mode that scans all commits in the repository's Git History for Credential patterns, in addition to the standard workspace file scan.
2. WHEN a Credential is detected in a historical commit that is no longer present in the current working tree, THE Scanner SHALL produce a Critical severity Finding that includes the commit hash, file path at time of commit, line number, credential type, and a note that the secret exists in repository history and must be purged from history to be fully remediated.
3. THE Scanner SHALL use an open-source tool capable of scanning Git History (e.g., Gitleaks with `--no-git` or git log scanning mode) to perform historical secret detection.
4. WHEN running a pre-commit hook Scan, THE Scanner SHALL NOT run a full git history scan by default, as history scanning is a long-running operation; git history scanning SHALL only be performed when explicitly invoked via manual scan with a history scan flag.
5. WHEN a git history scan is initiated on a repository with more than 1,000 commits, THE Scanner SHALL notify the developer that the scan may take several minutes to complete.
6. WHEN a Credential found in Git History is also present in the current working tree, THE Scanner SHALL report it as a single Critical Finding covering both the current file and the historical commit, rather than two separate Findings.

---

### Requirement 17: Agent-Specific Attack Pattern Detection

**User Story:** As a developer building LLM agents, I want the scanner to detect code patterns that are vulnerable to agent-specific attacks such as tool call injection and indirect prompt injection, so that I can harden my agents against attacks that exploit the agentic execution model.

#### Acceptance Criteria

1. THE Scanner SHALL use static analysis to detect patterns vulnerable to Tool Call Injection -- specifically, code where an LLM agent uses tool response content directly as input to subsequent tool calls, prompt constructions, or control flow decisions without validation or sanitization of the tool response.
2. THE Scanner SHALL use static analysis to detect patterns vulnerable to Indirect Prompt Injection -- specifically, code where an agent reads content from external sources (e.g., web pages, files, emails, database records) and passes that content directly into an LLM prompt without sanitization, content filtering, or trust boundary enforcement.
3. THE Scanner SHALL use static analysis to detect agent memory or vector store write operations that accept externally sourced content without sanitization before storage, flagging these as potential memory poisoning vectors.
4. WHEN a Tool Call Injection or Indirect Prompt Injection pattern is detected, THE Scanner SHALL produce a High severity Finding including the file path, line number, attack pattern type, and a description of why the pattern is vulnerable.
5. WHEN a memory poisoning pattern is detected, THE Scanner SHALL produce a Medium severity Finding including the file path, line number, and a description of the unsanitized write operation.
6. THE Scanner SHALL support agent-specific attack pattern detection for source files written in at least the following languages: JavaScript, TypeScript, and Python.
7. WHEN a Finding is produced for an agent-specific attack pattern, THE Scanner SHALL include a reference to the relevant OWASP LLM Top 10 category (LLM01 for prompt injection variants) where applicable.

---

### Requirement 18: Rule and Standards Update Management

**User Story:** As a developer, I want the scanner's detection rules and security standards rulesets to stay current with the latest versions, and I want to be able to add custom rules for emerging threats, so that the scanner remains effective as the threat landscape evolves.

#### Acceptance Criteria

1. THE Scanner SHALL provide an `update-rules` command that downloads and installs the latest versions of all configured scanning tool rulesets (e.g., Semgrep registry rulesets, Gitleaks rule updates, Trivy vulnerability database) from their respective upstream sources.
2. WHEN a Scan is initiated, THE Scanner SHALL check the age of the currently installed rulesets and produce an Informational Finding in the Scan Report if any ruleset has not been updated within the past 30 days, advising the developer to run the `update-rules` command.
3. THE Scanner SHALL maintain a Rule Manifest file at `.kiro/security/rule-manifest.json` that records, for each active ruleset: the ruleset name, source URL or registry identifier, current version or last-updated timestamp, and the security standard it covers (e.g., "OWASP LLM Top 10", "CWE Top 25").
4. THE Scanner SHALL ensure the Rule Manifest is current before each Scan so that the version information included in the Scan Report per Requirement 7 AC 9 accurately reflects the rulesets used.
5. THE Scanner SHALL support a custom rules directory at `.kiro/security/custom-rules/` where developers can place Semgrep-compatible YAML rule files to extend the Scanner's detection capabilities with team-specific or emerging-threat rules.
6. WHEN the custom rules directory contains one or more rule files, THE Scanner SHALL automatically include those rules in every Scan without requiring additional configuration.
7. WHEN the `update-rules` command is run, THE Scanner SHALL report which rulesets were updated, which were already current, and which failed to update, including the previous and new version or timestamp for each updated ruleset.
8. THE Scanner SHALL support configuration of additional Semgrep rule registry sources or custom rule repository URLs in the scanner configuration file, allowing teams to point the Scanner at organization-specific or third-party rule registries beyond the default Semgrep public registry.

---

### Requirement 19: IDE Inline Finding Annotations

**User Story:** As a developer, I want security findings to appear as inline annotations directly in my code editor, so that I can see and address issues in context without switching to a separate report or terminal output.

#### Acceptance Criteria

1. WHEN a Scan completes within the Kiro IDE, THE Scanner SHALL publish each Finding as an inline diagnostic annotation on the affected file and line number in the Kiro editor, using the same severity levels as the Scan Report.
2. THE Scanner SHALL display inline annotations using visual severity indicators consistent with Kiro's diagnostic system -- Critical and High findings SHALL use error-level indicators, Medium findings SHALL use warning-level indicators, and Low and Informational findings SHALL use information-level indicators.
3. WHEN a developer hovers over an inline annotation in the Kiro editor, THE Scanner SHALL display a tooltip containing: the Finding title, standard or framework identifier, a brief description of the vulnerability, the concrete remediation guidance, and the reference URL for the relevant standard.
4. WHEN a developer clicks on an inline annotation in the Kiro IDE, THE Scanner SHALL navigate the editor to the exact file and line number of the Finding.
5. WHEN a new Scan completes, THE Scanner SHALL clear all previous inline annotations and replace them with the annotations from the new Scan, so that resolved findings are not shown as still active.
6. WHEN a Finding has been added to the suppression list (per Requirement 8), THE Scanner SHALL remove the corresponding inline annotation from the editor without requiring a new Scan to be run.
7. THE Scanner SHALL support inline annotations for all Finding types produced by all scanning requirements, including Requirements 3 (OWASP Top 10/CWE Top 25), 4 (Dependency Vulnerability), 5 (Credential Detection), 6 (MCP Configuration), 12 (MCP Malicious Code), 13 (OWASP LLM Top 10), 14 (STRIDE), 15 (Supply Chain), 16 (Git History), 17 (Agent Attack Patterns), 24 (Kiro Agent and Steering File Scanning), 27 (OWASP Agentic Top 10), 29 (AI Transparency), 30 (Windows Credential Manager Enforcement), and any future scanning requirements added to this specification.

---

### Requirement 20: Scan Progress Feedback

**User Story:** As a developer, I want to see real-time progress feedback while a scan is running, so that I know the scanner is working and can estimate how long it will take to complete.

#### Acceptance Criteria

1. WHEN a manual Scan is initiated, THE Scanner SHALL display a progress indicator showing which scan category is currently running (e.g., "Running credential detection...", "Running dependency vulnerability scan...") and how many categories remain.
2. WHEN a manual Scan is running in the Kiro IDE, THE Scanner SHALL update the Kiro IDE status bar or output panel with the current scan phase and elapsed time.
3. WHEN a manual Scan is running via CLI, THE Scanner SHALL output progress updates to the terminal at each phase transition so that the developer can see activity without waiting in silence.
4. WHEN a full workspace Scan is expected to take more than 30 seconds based on repository size, THE Scanner SHALL display an estimated completion time at scan start.
5. WHEN a Scan completes, THE Scanner SHALL display the total elapsed time alongside the Scan Report summary.

---

### Requirement 21: Scan History

**User Story:** As a developer, I want to view a history of past scan results, so that I can track whether my security posture is improving or regressing over time.

#### Acceptance Criteria

1. THE Scanner SHALL retain Scan Reports in the `.kiro/security/scan-history/` directory, named by timestamp (e.g., `scan-2026-05-02T14-30-00.json`), up to the configured retention limit defined in the scanner configuration file (defaulting to 10 reports).
2. THE Scanner SHALL provide a `scan-history` command that lists all retained Scan Reports with their timestamp, total Finding count, and count by Severity.
3. WHEN a developer invokes the `scan-history` command with a specific report identifier, THE Scanner SHALL display the full Scan Report for that historical scan.
4. THE Scanner SHALL include a trend summary in the Scan Report when prior scan history exists, showing the change in Finding counts by Severity compared to the previous Scan (e.g., "+2 Critical, -1 High since last scan").
5. THE Scanner SHALL apply a configurable scan history retention limit (defaulting to 10 reports) as defined in the scanner configuration file; WHEN the scan history directory contains more reports than the configured retention limit, THE Scanner SHALL automatically delete the oldest report to maintain the limit and SHALL log each deletion event to the Audit Log (per Requirement 23).
6. THE Scanner SHALL NOT automatically delete scan history reports that are referenced by open suppression entries or that contain Critical severity Findings that have not yet been resolved, regardless of the configured retention limit, until those conditions are cleared.

---

### Requirement 22: First-Run Onboarding

**User Story:** As a developer setting up the scanner for the first time, I want a guided onboarding experience that explains what the scanner does, walks me through my first scan, and helps me understand the findings, so that I can get value from the tool immediately without reading documentation.

#### Acceptance Criteria

1. WHEN the Scanner is run for the first time in a workspace (i.e., no prior scan history exists), THE Scanner SHALL display a brief onboarding message explaining the scanner's purpose, the scan categories it will run, and the severity model (Critical through Informational).
2. THE Scanner SHALL provide an `onboarding` command that developers can run at any time to re-display the onboarding guidance and run a guided first scan.
3. WHEN the first Scan completes and produces Findings, THE Scanner SHALL display an explanation of the severity model alongside the Scan Report, clarifying which severities block commits and which produce warnings only.
4. WHEN the first Scan completes and produces Findings, THE Scanner SHALL display instructions for how to suppress a false positive Finding, including the location of the suppression file and the required fields.
5. THE Scanner SHALL include a `--help` flag on all commands that outputs a concise description of the command, its options, and an example invocation.

---

### Requirement 23: Audit Log

**User Story:** As a developer or administrator, I want a comprehensive, structured, tamper-evident audit log of all security-relevant scanner actions, so that I can track when scans ran, what was suppressed, when the allowlist or configuration was modified, and when security controls were bypassed, for compliance and accountability purposes.

#### Acceptance Criteria

1. THE Scanner SHALL maintain an append-only Audit Log file at `.kiro/security/audit.log` that records security-relevant events in JSON Lines format (one JSON object per line), where each entry includes at minimum: `timestamp` (ISO 8601), `event_type`, `scanner_version`, and event-specific fields as defined in the following criteria.

2. THE Scanner SHALL write an Audit Log entry for each of the following event types:
   - `scan_started`: timestamp, scan type (manual/pre-commit/history), scan categories enabled, scanner version, ruleset versions from Rule Manifest
   - `scan_completed`: timestamp, scan type, total finding count by severity, elapsed time in milliseconds, exit code
   - `scan_tool_error`: timestamp, tool name, error message, exit code, whether the scan was allowed to continue
   - `commit_blocked`: timestamp, commit hash (partial), finding count by severity that caused the block
   - `commit_scan_bypassed`: timestamp, the --no-verify flag was used to bypass the pre-commit scan -- this is a significant security audit event
   - `suppression_added`: timestamp, rule identifier, file path, justification string (scanned for Credential patterns and redacted with [REDACTED] if a secret is detected before writing), developer username (Windows username)
   - `suppression_removed`: timestamp, rule identifier, file path
   - `suppression_invalidated_by_policy`: timestamp, rule identifier, file path, policy reason
   - `allowlist_entry_added`: timestamp, MCP identifier or URL, description
   - `allowlist_entry_removed`: timestamp, MCP identifier or URL
   - `config_changed`: timestamp, configuration key changed, previous value (redacted if credential-related), new value (redacted if credential-related)
   - `admin_policy_loaded`: timestamp, policy file path, policy version or hash
   - `admin_policy_conflict`: timestamp, conflict description
   - `rules_updated`: timestamp, rulesets updated (names and previous/new versions), rulesets already current, rulesets that failed to update
   - `self_update_completed`: timestamp, previous scanner version, new scanner version
   - `self_update_failed`: timestamp, failure reason
   - `scan_history_deleted`: timestamp, deleted report filename, reason (retention limit or manual)
   - `onboarding_completed`: timestamp, workspace path

3. THE Scanner SHALL NOT delete or overwrite existing Audit Log entries; the Audit Log SHALL be append-only.

4. THE Scanner SHALL implement hash chaining in the Audit Log: each entry SHALL include a `prev_hash` field containing the SHA-256 hash of the previous log entry's raw JSON line, so that any modification or deletion of a log entry can be detected by recomputing the chain. The first entry in a new log file SHALL use `"prev_hash": "genesis"`.

5. THE Scanner SHALL provide an `audit-log` command that displays the Audit Log contents in a human-readable format, with optional filtering by `--event-type` and `--since` / `--until` date range flags.

6. THE Scanner SHALL provide an `audit-log --verify` flag that recomputes the hash chain of the Audit Log and reports whether the log has been tampered with, including identifying the first entry where the chain breaks if tampering is detected.

7. WHEN the Audit Log file exceeds 10 MB in size, THE Scanner SHALL rotate the log by renaming the current log file with a timestamp suffix (e.g., `audit-2026-05-02T14-30-00.log`) and starting a new Audit Log file, retaining the last 3 rotated log files and deleting older rotated files.

8. THE Scanner SHALL support an optional log forwarding configuration in the scanner configuration file that specifies a local file path or HTTPS webhook URL to which each Audit Log entry is also forwarded in real time, to support integration with SIEM systems or centralized log aggregation tools such as Splunk or Azure Monitor.

9. WHEN log forwarding is configured and a forwarding attempt fails, THE Scanner SHALL continue writing to the local Audit Log, retry the failed entry on the next scan event, and produce an Informational Finding in the next Scan Report noting that log forwarding has failed and entries may be queued.

10. THE Scanner SHALL apply Credential pattern detection to all string values written to the Audit Log before writing each entry, and SHALL replace any detected Credential value with `[REDACTED-<credential-type>]` (e.g., `[REDACTED-AWS-ACCESS-KEY]`) to ensure that no secret values are ever persisted to the Audit Log, regardless of which event type produced the entry. THE Scanner SHALL log a `redaction_applied` sub-field alongside the redacted entry noting that a value was redacted and the credential type detected, without including the original value.

---

### Requirement 24: Kiro Agent and Steering File Scanning

**User Story:** As a developer, I want the scanner to check my Kiro agent configuration, hook files, and steering files for security issues, so that I can detect prompt injection vectors, sensitive data exposure, and insecure configurations in my Kiro-specific files.

#### Acceptance Criteria

1. THE Scanner SHALL detect and scan Kiro agent hook files (e.g., `.kiro/hooks/*.json`) for security issues including: commands that execute arbitrary shell instructions, hooks that exfiltrate data to external URLs, and hooks that reference non-allowlisted MCP servers.
2. THE Scanner SHALL detect and scan Kiro steering files (e.g., `.kiro/steering/*.md`) for patterns that indicate prompt injection vectors -- specifically, content that attempts to override system instructions, impersonate system roles, or inject hidden instructions into agent context.
3. WHEN a Kiro steering file contains content that matches known prompt injection patterns, THE Scanner SHALL produce a High severity Finding including the file path, line number, and a description of the detected pattern.
4. THE Scanner SHALL scan Kiro agent configuration files and hook command strings for plaintext Credentials embedded in hook commands, environment variable definitions, or MCP server configurations, and SHALL produce a Critical severity Finding for each plaintext Credential detected with remediation guidance to use Windows Credential Manager instead.
5. WHEN a Kiro hook file references an external URL or MCP server not present in the MCP allowlist, THE Scanner SHALL produce an Informational Finding noting the unverified external reference.

---

### Requirement 25: Centralized Admin Policy Management

**User Story:** As an administrator, I want to distribute a centralized scanner policy to all developer workstations, so that I can enforce consistent scanner configuration, approved MCP allowlists, and suppression baselines across the team without requiring each developer to configure the scanner individually.

#### Acceptance Criteria

1. THE Scanner SHALL support an admin policy file at a configurable path (defaulting to `.kiro/security/admin-policy.json`) that an administrator can author and distribute to developer workstations via version control, MDM, or file share.
2. WHEN an admin policy file is present, THE Scanner SHALL apply the policy settings as the baseline configuration, with developer-local settings layered on top where the policy permits overrides.
3. THE Admin Policy File SHALL support the following configurable settings: approved MCP allowlist entries, suppression baseline entries (pre-approved suppressions that apply to all developers), minimum required scanner tool versions, enabled and disabled scan categories, and whether developers are permitted to add local suppressions beyond the baseline.
4. WHEN an admin policy file specifies that local suppressions are not permitted, THE Scanner SHALL ignore any developer-local suppression entries and apply only the admin-defined suppression baseline.
5. WHEN an admin policy file is present and a developer attempts to add a suppression that conflicts with an admin-defined policy setting, THE Scanner SHALL notify the developer that the suppression is not permitted under the current admin policy.
6. THE Scanner SHALL log all admin policy file loads and any policy conflicts to the Audit Log (per Requirement 23).
7. WHEN the admin policy file cannot be parsed or is malformed, THE Scanner SHALL log an error to the Audit Log, notify the developer, and fall back to default scanner settings rather than failing silently.

---

### Requirement 26: User and Administrator Documentation

**User Story:** As a developer or administrator, I want comprehensive documentation covering installation, usage, configuration options, and frequently asked questions, so that I can install, operate, and troubleshoot the scanner without needing external support.

#### Acceptance Criteria

1. THE Scanner SHALL include a developer-facing installation guide that covers: system prerequisites (Windows version, required runtimes), step-by-step installation instructions for the interactive setup command, verification steps to confirm a successful installation, and instructions for installing the Git pre-commit hook.

2. THE Scanner SHALL include an administrator-facing deployment guide that covers: silent/unattended installation using the `--silent` flag, deploying the scanner via MDM or Group Policy, configuring and distributing the admin policy file (`admin-policy.json`), configuring proxy settings for corporate networks, and managing scanner and rule updates across a team.

3. THE Scanner SHALL include a usage guide that covers: how to run a manual scan from the Kiro IDE command palette and from the CLI, how to interpret the Scan Report including the severity model and what each severity level means for commit blocking, how to view and navigate inline findings in the Kiro editor, how to run a git history scan, how to use the `update-rules` command, and how to view scan history with the `scan-history` command.

4. THE Scanner SHALL include a complete Configuration Reference that documents every available configuration option in the scanner configuration file, including: the option name, its default value, accepted values or format, and a plain-language description of what the option controls. The Configuration Reference SHALL cover at minimum: scan category enable/disable settings, proxy configuration, custom rule registry sources, scan history retention count, and rule staleness warning threshold.

5. THE Scanner SHALL include documentation for each security configuration file used by the scanner, covering: the file path, the JSON schema or format, all supported fields with their types and descriptions, and an annotated example. The files to be documented SHALL include at minimum: `mcp-allowlist.json`, `suppressions.json`, `admin-policy.json`, `rule-manifest.json`, and `custom-rules/` directory usage.

6. THE Scanner SHALL include a FAQ document that addresses at minimum the following topics:
   - Why was my commit blocked and how do I fix it?
   - How do I suppress a false positive finding?
   - What does each severity level mean?
   - How do I add an MCP to the allowlist?
   - How do I update the scanning rules?
   - How do I add a custom scanning rule?
   - What happens if a scanning tool fails to run?
   - How do I run a scan without the pre-commit hook?
   - How do I view findings from a previous scan?
   - How do I deploy the scanner to my whole team?
   - What data does the scanner send over the network?
   - How do I configure the scanner to work behind a corporate proxy?
   - How do I enable debug logging to troubleshoot a scanner issue?

7. THE Scanner SHALL include a troubleshooting section that covers: what to do when a required scanning tool fails to install, how to diagnose and resolve proxy-related failures during rule updates, how to recover from a corrupted scanner configuration, and how to re-install the pre-commit hook if it is missing or broken.

8. ALL documentation SHALL be authored in Markdown format and included in a `docs/` directory within the scanner's repository, so that it can be rendered on GitHub and distributed alongside the scanner.

9. THE Scanner SHALL include a `CHANGELOG.md` file that records all changes between scanner versions, including new features, bug fixes, updated scanning rules, and any breaking changes to configuration file formats.

---

### Requirement 27: OWASP Agentic Top 10 Scanning

**User Story:** As a developer building autonomous AI agents, I want the scanner to detect code patterns associated with the OWASP Top 10 for Agentic Applications (ASI01-ASI10), so that I can identify and fix security weaknesses specific to autonomous agent systems before they are exploited.

#### Acceptance Criteria

1. THE Scanner SHALL use static analysis to detect patterns associated with ASI02 (Tool Misuse and Exploitation) -- specifically, agent code that invokes tool calls using unvalidated or unsanitized arguments, passes externally sourced data directly as tool parameters without type checking or bounds validation, or chains tool calls in sequences where the output of one tool is used as input to another without intermediate validation.

2. THE Scanner SHALL use static analysis to detect patterns associated with ASI03 (Identity and Privilege Abuse) -- specifically, agent code that caches, stores, or reuses authentication credentials, session tokens, or OAuth tokens across multiple agent tasks or sessions without scoping them to a single task context, and agent code that uses high-privilege credentials for operations that could be performed with lower-privilege access.

3. THE Scanner SHALL use static analysis to detect patterns associated with ASI05 (Multi-Agent Trust Exploitation) -- specifically, agent orchestration code that accepts instructions or data from other agents without authenticating the source agent's identity, and agent code that passes data between agents without validating or sanitizing the inter-agent payload.

4. THE Scanner SHALL use static analysis to detect patterns associated with ASI09 (Insecure Agent Communication) -- specifically, agent code that communicates with other agents or external services using non-HTTPS protocols, that disables TLS certificate validation, or that transmits agent state or tool results over unencrypted channels.

5. THE Scanner SHALL use static analysis to detect patterns associated with ASI10 (Rogue Agent Deployment) -- specifically, agent configuration files or deployment manifests that define agents without explicit permission scopes, agents that are not registered in a known agent manifest or registry file, and agent code that spawns sub-agents dynamically without logging or governance controls.

6. WHEN a Finding is produced for an OWASP Agentic Top 10 category, THE Scanner SHALL include the ASI category identifier (e.g., "ASI02", "ASI09") in the Finding along with the file path, line number, description of the detected pattern, and a reference URL to the OWASP Agentic Top 10 documentation.

7. THE Scanner SHALL support OWASP Agentic Top 10 scanning for source files written in at least the following languages: JavaScript, TypeScript, and Python.

8. THE Scanner SHALL update its OWASP Agentic Top 10 detection rules via the `update-rules` command (per Requirement 18) as the framework evolves, given that the ASI framework was released in December 2025 and is actively being refined.

---

### Requirement 28: Scanner Self-Update

**User Story:** As a developer or administrator, I want the scanner to check for and apply updates to itself, so that I am always running a version with the latest security detection capabilities, bug fixes, and compatibility improvements.

#### Acceptance Criteria

1. THE Scanner SHALL provide a `self-update` command that checks for a newer version of the scanner and, if one is available, downloads and installs it.

2. WHEN a Scan is initiated and the scanner has not checked for updates within the past 7 days, THE Scanner SHALL check whether a newer version is available and produce an Informational Finding in the Scan Report if the installed scanner version is more than one minor version behind the latest available release, advising the developer to run `self-update`; THE Scanner SHALL cache the result of this check and SHALL NOT make a network request on every Scan invocation.

3. WHEN downloading a scanner update, THE Scanner SHALL verify the cryptographic checksum of the downloaded update package against the expected checksum published by the scanner's official release source before applying the update, and SHALL abort the update and report an error if the checksum does not match.

4. THE Scanner SHALL support a `--silent` flag on the `self-update` command that performs the update without interactive prompts, suitable for use in automated deployment and maintenance scripts.

5. WHEN a `self-update` completes successfully, THE Scanner SHALL log the previous version, the new version, and the update timestamp to the Audit Log (per Requirement 23).

6. WHEN a `self-update` fails, THE Scanner SHALL log the failure reason to the Audit Log, leave the existing scanner installation intact, and report the error to the developer without leaving the scanner in a partially updated state.

7. THE Scanner SHALL support configuration of an HTTP/HTTPS proxy for the `self-update` command, using the same proxy settings defined in the scanner configuration file per Requirement 9 AC 10.

---

### Requirement 29: AI Transparency and Observability Pattern Detection

**User Story:** As a developer building LLM agents, I want the scanner to detect code patterns that lack transparency, observability, or model version governance, so that I can ensure my agents produce auditable, reproducible, and accountable behavior.

#### Acceptance Criteria

1. THE Scanner SHALL use static analysis to detect agent code that makes LLM API calls without logging the request payload, response, model identifier, and timestamp to a persistent log or observability sink, and SHALL produce a Medium severity Finding noting the absence of LLM call observability.

2. THE Scanner SHALL use static analysis to detect agent code that references LLM model identifiers using mutable aliases (e.g., `"gpt-4"`, `"claude-3"`, `"gemini-pro"`) rather than pinned version identifiers (e.g., `"gpt-4-0613"`), and SHALL produce a Medium severity Finding noting that unpinned model aliases can cause silent behavioral drift when the model provider updates the alias to a new model version.

3. THE Scanner SHALL use static analysis to detect agent code that performs state-changing actions (file writes, API calls, database mutations, email sends) based on LLM-generated decisions without logging the LLM output that drove the decision, and SHALL produce a High severity Finding noting the absence of decision audit trail.

4. THE Scanner SHALL use static analysis to detect agent code that does not implement any error handling or fallback behavior for LLM API call failures, and SHALL produce a Medium severity Finding noting that unhandled LLM failures can cause agents to silently skip actions or produce undefined behavior.

5. THE Scanner SHALL use static analysis to detect agent code that passes LLM-generated content to downstream systems or users without any content filtering, output validation, or disclaimer that the content is AI-generated, and SHALL produce a Medium severity Finding noting the absence of AI output transparency controls.

6. WHEN a Finding is produced for an AI transparency or observability pattern, THE Scanner SHALL include the file path, line number, pattern type, a description of the transparency gap, and a reference to relevant guidance (e.g., OWASP LLM02 for insecure output handling, ASI02 for tool misuse).

7. THE Scanner SHALL support AI transparency and observability pattern detection for source files written in at least the following languages: JavaScript, TypeScript, and Python.

---

### Requirement 30: Windows Credential Manager Enforcement and Guidance

**User Story:** As a developer, I want the scanner to actively guide me toward using Windows Credential Manager for all secret storage and to detect any patterns that bypass it, so that no credentials are ever stored in plaintext on my workstation.

#### Acceptance Criteria

1. THE Scanner SHALL detect source code that constructs credential values by concatenating string literals with environment variable reads (e.g., `"Bearer " + process.env.TOKEN`) and SHALL produce a High severity Finding noting that the credential value is partially or fully derived from an insecure source.

2. THE Scanner SHALL detect source code that writes credential values to files, logs, console output, or environment variables at runtime (e.g., `fs.writeFileSync('.env', 'API_KEY=' + secret)`) and SHALL produce a Critical severity Finding noting that the code is persisting a credential to an insecure location.

3. THE Scanner SHALL detect `dotenv` package usage (e.g., `require('dotenv').config()`, `from dotenv import load_dotenv`) and SHALL produce a High severity Finding noting that `dotenv` loads credentials from `.env` files into process environment variables, which are stored in plaintext in the Windows Registry for the duration of the process, and SHALL recommend using Windows Credential Manager instead.

4. THE Scanner SHALL detect Windows Registry write operations that store credential-like values (e.g., calls to `reg add`, `Set-ItemProperty` on registry paths, or `winreg` Python module writes containing credential patterns) and SHALL produce a Critical severity Finding noting that the Windows Registry is not a secure credential store.

5. WHEN the scanner detects any Credential Finding in Requirements 5 or 30, THE Scanner SHALL include in the Finding's remediation guidance a link to the project's documentation on Windows Credential Manager usage (per Requirement 26) and a language-appropriate code example showing the correct Windows Credential Manager access pattern.

6. THE Scanner SHALL detect code that disables or bypasses TLS/SSL certificate validation when making API calls that transmit credentials (e.g., `verify=False` in Python requests, `rejectUnauthorized: false` in Node.js HTTPS) and SHALL produce a High severity Finding noting that disabling certificate validation exposes credentials to interception.

7. THE Scanner SHALL support Windows Credential Manager enforcement scanning for source files written in at least the following languages: JavaScript, TypeScript, Python, and PowerShell.

---

### Requirement 31: Operational and Debug Logging

**User Story:** As a developer or administrator, I want to enable detailed debug logging when troubleshooting scanner issues, so that I can diagnose tool failures, performance problems, and unexpected behavior without having to re-run scans with manual tool invocations.

#### Acceptance Criteria

1. THE Scanner SHALL support a `debugLogging` boolean configuration option in the scanner configuration file (defaulting to `false`) that enables or disables debug logging. THE Scanner SHALL also support enabling debug logging for a single scan invocation via a `--debug` CLI flag without persisting the setting.

2. WHEN debug logging is disabled (the default), THE Scanner SHALL write only the Audit Log (per Requirement 23) and Scan Reports (per Requirements 7 and 21). No debug log file SHALL be created.

3. WHEN debug logging is enabled, THE Scanner SHALL write a Debug Log file at `.kiro/security/scanner-debug.log` that captures the following additional information not present in the Audit Log:
   - **Tool invocations**: the exact command line used to invoke each scanning tool (e.g., `semgrep --config auto src/`), including all arguments and environment variable names (but NOT environment variable values, to avoid logging credentials)
   - **Tool exit codes and timing**: the exit code and wall-clock execution time in milliseconds for each tool invocation
   - **Tool stdout and stderr**: the complete stdout and stderr output from each scanning tool invocation, truncated to 50KB per tool per scan if output is excessively large
   - **Rule loading**: which rulesets and custom rule files were loaded, and how many rules were active per scan category
   - **File enumeration**: the count of files discovered per scan category and any files excluded by `.gitignore` or scanner configuration
   - **Finding pipeline**: for each raw finding produced by a scanning tool, whether it was included in the Scan Report, suppressed (and by which suppression entry), or deduplicated
   - **Performance breakdown**: elapsed time per scan category and per tool, total scan elapsed time
   - **Scanner internal errors**: any exceptions, unexpected tool outputs, or internal state errors that did not result in a scan failure but may indicate a problem
   - **Admin policy resolution**: which settings came from the admin policy file vs developer-local configuration, and any overrides applied

4. THE Scanner SHALL write Debug Log entries in JSON Lines format (one JSON object per line) with each entry including: `timestamp` (ISO 8601), `level` (one of: DEBUG, INFO, WARN, ERROR), `category` (one of: tool_invocation, tool_output, rule_loading, file_enumeration, finding_pipeline, performance, internal_error, policy_resolution), and a `message` field with the event details.

5. THE Scanner SHALL apply Credential pattern detection to ALL string values written to the Debug Log before writing each entry, and SHALL replace any detected Credential value with `[REDACTED-<credential-type>]` (e.g., `[REDACTED-API-KEY]`) before writing. This applies to: tool command line arguments, tool stdout and stderr output, file paths that contain credential-like patterns, error messages, and all other debug log fields. THE Scanner SHALL NOT write credential values, secret patterns matched during scanning, or the content of detected secrets to the Debug Log under any circumstances. WHEN a redaction is applied, THE Scanner SHALL include a `redactions_applied` count field in the affected log entry noting how many values were redacted, without including the original values.

6. WHEN the Debug Log file exceeds 50 MB in size, THE Scanner SHALL rotate it by renaming it with a timestamp suffix and starting a new Debug Log file, retaining only the most recent rotated Debug Log file (1 rotation) to limit disk usage.

7. THE Scanner SHALL include documentation (per Requirement 26) that explicitly lists what additional information is captured in debug mode vs standard mode, including the complete list of debug log categories defined in AC 3, so that developers and administrators know exactly what data is being written to disk when debug logging is enabled.

8. THE Scanner SHALL include in the FAQ (per Requirement 26 AC 6) the question "How do I enable debug logging to troubleshoot a scanner issue?" with instructions for both the configuration file setting and the `--debug` CLI flag.

9. WHEN debug logging is enabled and a scan completes, THE Scanner SHALL print a message to the terminal or IDE output panel noting that a debug log has been written to `.kiro/security/scanner-debug.log` and reminding the developer that the debug log may contain sensitive file paths and tool output that should not be shared publicly.

10. THE Scanner SHALL apply the same Credential redaction logic used for scanning (per Requirement 5) to all log output, ensuring that the redaction patterns are consistent and maintained in a single shared component rather than duplicated. WHEN the Credential detection rules are updated via the `update-rules` command (per Requirement 18), the log redaction patterns SHALL be updated simultaneously to reflect the latest known secret formats.
