# Implementation Plan: Agent Security Scanner

## Tasks

- [ ] 1. Project Scaffolding and Setup
  - [ ] 1.1 Initialize TypeScript project with package.json, tsconfig.json, and VS Code extension manifest (package.json with contributes.commands, activationEvents)
  - [ ] 1.2 Set up build toolchain (esbuild or webpack for extension bundling, tsc for type checking)
  - [ ] 1.3 Create CLI entry point using commander.js with subcommands: scan, setup, update-rules, self-update, audit-log, scan-history, onboarding
  - [ ] 1.4 Create VS Code extension entry point (extension.ts) with activate/deactivate lifecycle
  - [ ] 1.5 Set up fast-check for property-based testing and Jest for unit/integration tests
  - [ ] 1.6 Create the full source directory structure as defined in design.md

- [ ] 2. Core Data Models
  - [ ] 2.1 Implement Finding interface and FindingCategory/Severity types (models/Finding.ts)
  - [ ] 2.2 Implement ScanReport, FindingSummary, and TrendDelta interfaces (models/ScanReport.ts)
  - [ ] 2.3 Implement Suppression and SuppressedFinding interfaces (models/Suppression.ts)
  - [ ] 2.4 Implement AdminPolicy interface (models/AdminPolicy.ts)
  - [ ] 2.5 Implement ScannerConfig, LogForwardingConfig, and ProxyConfig interfaces (models/ScannerConfig.ts)
  - [ ] 2.6 Implement AuditEvent and AuditEventType (models/AuditEvent.ts)
  - [ ] 2.7 Implement RuleManifest and RulesetEntry interfaces (models/RuleManifest.ts)
  - [ ] 2.8 Implement McpAllowlistEntry interface (models/McpAllowlistEntry.ts)

- [ ] 3. Configuration and Policy Loading
  - [ ] 3.1 Implement ConfigLoader that reads scanner-config.json from workspace (config/ConfigLoader.ts)
  - [ ] 3.2 Implement AdminPolicyLoader that reads and validates admin-policy.json (config/AdminPolicyLoader.ts)
  - [ ] 3.3 Implement three-layer config merge: built-in defaults → admin policy → developer-local
  - [ ] 3.4 Implement override tracking so the scanner can notify developers when admin policy overrides local settings
  - [ ] 3.5 Implement ProxyConfig utility that checks scanner config and Windows HTTPS_PROXY/HTTP_PROXY env vars (utils/ProxyConfig.ts)
  - [ ] 3.6 Write unit tests for config merging, including property test: admin policy values always win over developer-local values for the same key

- [ ] 4. Credential Redactor (shared utility — must be built before loggers)
  - [ ] 4.1 Implement CredentialRedactor singleton with redact(string) and redactObject(object) methods (logging/CredentialRedactor.ts)
  - [ ] 4.2 Load credential patterns from the same regex/entropy rules used by Gitleaks and detect-secrets
  - [ ] 4.3 Implement atomic pattern update method called by RuleUpdater after update-rules completes
  - [ ] 4.4 Write property-based test: for any string containing a known credential pattern, redact() returns [REDACTED-<type>] and the original value does not appear in the output

- [ ] 5. Audit Logger
  - [ ] 5.1 Implement AuditLogger with append-only JSON Lines writes to .kiro/security/audit.log (logging/AuditLogger.ts)
  - [ ] 5.2 Implement SHA-256 hash chaining: each entry includes prev_hash of the previous raw JSON line; first entry uses "genesis"
  - [ ] 5.3 Apply CredentialRedactor to all event field values before writing
  - [ ] 5.4 Implement log rotation at 10 MB, retaining last 3 rotated files
  - [ ] 5.5 Implement audit-log --verify command that recomputes the hash chain and reports tampering
  - [ ] 5.6 Implement audit-log command with --event-type, --since, --until filters
  - [ ] 5.7 Implement optional log forwarding (file path or HTTPS webhook) with retry on failure
  - [ ] 5.8 Write property-based tests: (a) audit log grows monotonically, (b) hash chain is valid after any sequence of writes, (c) credential values never appear in written log lines

- [ ] 6. Debug Logger
  - [ ] 6.1 Implement DebugLogger that writes JSON Lines to .kiro/security/scanner-debug.log only when debugLogging is enabled (logging/DebugLogger.ts)
  - [ ] 6.2 Apply CredentialRedactor to all values including tool stdout/stderr before writing
  - [ ] 6.3 Implement log rotation at 50 MB, retaining 1 rotated file
  - [ ] 6.4 Implement --debug CLI flag that enables debug logging for a single invocation without persisting the setting
  - [ ] 6.5 Print notification to terminal/IDE when debug log is written, reminding developer not to share it publicly

- [ ] 7. Tool Runners
  - [ ] 7.1 Implement ToolRunner base interface and ProcessSpawner utility (wraps child_process.spawn with timeout, streaming capture, debug logging) (runners/ToolRunner.ts, utils/ProcessSpawner.ts)
  - [ ] 7.2 Implement SemgrepRunner: builds command with --json flag, rule registry identifiers, and target path (runners/SemgrepRunner.ts)
  - [ ] 7.3 Implement GitleaksRunner: supports both detect mode (file scan) and history mode (--no-git) with --report-format json (runners/GitleaksRunner.ts)
  - [ ] 7.4 Implement TrivyRunner: uses fs subcommand with --format json targeting workspace or package directory (runners/TrivyRunner.ts)
  - [ ] 7.5 Implement NpmAuditRunner: runs npm audit --json in workspace directory (runners/NpmAuditRunner.ts)
  - [ ] 7.6 Implement PipAuditRunner: runs pip-audit --format json (runners/PipAuditRunner.ts)
  - [ ] 7.7 Implement DetectSecretsRunner: runs detect-secrets scan --all-files --json (runners/DetectSecretsRunner.ts)
  - [ ] 7.8 Write integration tests for each runner against fixture files with known findings

- [ ] 8. Finding Normalizers
  - [ ] 8.1 Implement FindingNormalizer base interface (normalizers/FindingNormalizer.ts)
  - [ ] 8.2 Implement SemgrepNormalizer: maps Semgrep JSON output to Finding[], populating standardIdentifier from rule metadata
  - [ ] 8.3 Implement GitleaksNormalizer: maps Gitleaks JSON output to Finding[], classifying by Known-Safe Credential Context
  - [ ] 8.4 Implement TrivyNormalizer: maps Trivy JSON output to Finding[], extracting CVE identifiers and remediation versions
  - [ ] 8.5 Implement NpmAuditNormalizer: maps npm audit JSON output to Finding[]
  - [ ] 8.6 Implement PipAuditNormalizer: maps pip-audit JSON output to Finding[]
  - [ ] 8.7 Implement DetectSecretsNormalizer: maps detect-secrets JSON output to Finding[]
  - [ ] 8.8 Write unit tests for each normalizer using fixture JSON files; write property-based test: every normalized Finding contains all required non-empty fields

- [ ] 9. Finding Filter and Suppression Manager
  - [ ] 9.1 Implement SuppressionManager: reads/writes suppressions.json, validates entries (rule identifier + file path + justification required), checks admin policy for allowLocalSuppressions (filter/SuppressionManager.ts)
  - [ ] 9.2 Implement FindingFilter: applies suppressions and admin policy baseline to produce active/suppressed split (filter/FindingFilter.ts)
  - [ ] 9.3 Implement stale suppression detection: flag suppressions referencing non-existent file paths as Informational findings
  - [ ] 9.4 Implement suppression invalidation: when admin policy prohibits a previously-allowed suppression, exclude it and produce Informational finding
  - [ ] 9.5 Write property-based test: for any finding list and suppression list, every finding matching a suppression appears in suppressed list and not in active list

- [ ] 10. Scan Orchestrator
  - [ ] 10.1 Implement ScanContext interface and ScanCategory types (orchestrator/ScanContext.ts)
  - [ ] 10.2 Implement ScanOrchestrator that reads config, resolves enabled tool runners, and launches them concurrently via Promise.allSettled — NOT Promise.all, so one tool failure does not abort others (orchestrator/ScanOrchestrator.ts)
  - [ ] 10.3 Implement pre-commit scope restriction: pass staged files list to Semgrep/Gitleaks; always pass full manifests to Trivy/npm audit/pip-audit
  - [ ] 10.4 Implement tool failure isolation: log scan_tool_error audit event on failure, continue scan with remaining tools
  - [ ] 10.5 Implement ProgressReporter that emits phase updates to StatusBarReporter (IDE) and stdout (CLI) (orchestrator/ProgressReporter.ts)
  - [ ] 10.6 Implement estimated completion time display for scans expected to exceed 30 seconds
  - [ ] 10.7 Implement scan cancellation support

- [ ] 11. Report Builder and Scan History
  - [ ] 11.1 Implement ReportBuilder: assembles ScanReport from filtered findings, attaches rule manifest, computes trend delta from prior history (report/ReportBuilder.ts)
  - [ ] 11.2 Implement ScanHistoryStore: persists reports to .kiro/security/scan-history/, enforces configurable retention limit, protects reports with open suppressions or unresolved Critical findings (report/ScanHistoryStore.ts)
  - [ ] 11.3 Implement scan-history CLI command: list reports with timestamp/counts, display full report by ID
  - [ ] 11.4 Persist last-scan-report.json after every scan
  - [ ] 11.5 Write property-based test: scan history retention limit is enforced; protected reports are not deleted

- [ ] 12. Semgrep Rule Sets
  - [ ] 12.1 Configure Semgrep registry rulesets for OWASP Top 10 and CWE Top 25 (p/owasp-top-ten, p/cwe-top-25)
  - [ ] 12.2 Write custom Semgrep rules for OWASP LLM Top 10: LLM01 (prompt injection via string concat), LLM02 (insecure output to dangerous sinks), LLM06 (sensitive data in LLM payloads), LLM07 (insecure MCP tool design), LLM08 (excessive agency)
  - [ ] 12.3 Write custom Semgrep rules for OWASP Agentic Top 10: ASI02 (unvalidated tool arguments), ASI03 (credential caching across tasks), ASI05 (unauthenticated inter-agent data), ASI09 (non-HTTPS agent communication), ASI10 (rogue agent deployment)
  - [ ] 12.4 Write custom Semgrep rules for STRIDE patterns: Spoofing (no auth before privileged ops), Tampering (no input validation), Repudiation (state changes without logging), Information Disclosure (secrets in logs), Elevation of Privilege (dynamic shell/eval with external input)
  - [ ] 12.5 Write custom Semgrep rules for agent-specific attack patterns: Tool Call Injection, Indirect Prompt Injection, memory/vector store poisoning
  - [ ] 12.6 Write custom Semgrep rules for AI transparency: missing LLM call logging, unpinned model aliases, missing decision audit trail, missing LLM error handling, unfiltered LLM output to downstream systems
  - [ ] 12.7 Write custom Semgrep rules for Windows Credential Manager enforcement: dotenv usage, credential concatenation, runtime credential writes, TLS bypass, registry writes with credential patterns
  - [ ] 12.8 Write custom Semgrep rules for MCP malicious code patterns: data exfiltration, reverse shell indicators, credential harvesting, suspicious outbound calls, broad env var access
  - [ ] 12.9 Write custom Semgrep rules for Kiro agent/steering file scanning: prompt injection in steering files, shell commands in hooks, credentials in hook commands

- [ ] 13. IDE Integration
  - [ ] 13.1 Implement DiagnosticPublisher: publishes findings to VS Code DiagnosticCollection with correct severity mapping (Critical/High → Error, Medium → Warning, Low/Info → Information) (ide/DiagnosticPublisher.ts)
  - [ ] 13.2 Implement hover tooltip content: finding title, standard identifier, description, remediation guidance, reference URL
  - [ ] 13.3 Implement StatusBarReporter: shows current scan phase and elapsed time in Kiro status bar (ide/StatusBarReporter.ts)
  - [ ] 13.4 Implement OutputChannelReporter: writes formatted scan report to "Agent Security Scanner" output channel (ide/OutputChannelReporter.ts)
  - [ ] 13.5 Implement ScanCodeActionProvider: provides "Suppress finding" quick-fix code actions (ide/ScanCodeActionProvider.ts)
  - [ ] 13.6 Implement suppression removal from DiagnosticCollection when a finding is suppressed (without requiring re-scan)
  - [ ] 13.7 Register all commands in extension.ts: Run Scan, Run History Scan, Update Rules, View Audit Log, Onboarding
  - [ ] 13.8 Write property-based tests: (a) diagnostics mirror active finding list, (b) consecutive scans replace not accumulate diagnostics

- [ ] 14. CLI Implementation
  - [ ] 14.1 Implement scan command with --pre-commit, --staged-files, --history, --debug, --output-json flags (cli.ts)
  - [ ] 14.2 Implement terminal output formatter: colored severity indicators [CRITICAL]/[HIGH], section separators, pre-commit mode shows only Critical/High with summary count of lower severity
  - [ ] 14.3 Implement --help flag on all commands
  - [ ] 14.4 Implement JSON output mode (--output-json flag)

- [ ] 15. Pre-commit Hook
  - [ ] 15.1 Create pre-commit hook PowerShell template at templates/pre-commit.ps1 that calls scanner scan --pre-commit --staged-files with the list of staged files from git diff --cached --name-only
  - [ ] 15.2 Implement PreCommitHookInstaller: copies template to .git/hooks/pre-commit and makes it executable (setup/PreCommitHookInstaller.ts)
  - [ ] 15.3 Hook script exits with code 0 (allow) or 1 (block) based on scan result; hook script itself logs commit_scan_bypassed to audit log when --no-verify is detected via git environment variable GIT_NO_VERIFY or absence of hook invocation
  - [ ] 15.4 Write integration test: invoke hook against staged fixture file with Critical finding; assert exit code 1

- [ ] 16. Setup Manager
  - [ ] 16.1 Implement SetupManager with run() method supporting --silent flag (setup/SetupManager.ts)
  - [ ] 16.2 Implement ChecksumVerifier: downloads tool binary, computes SHA-256, compares to published checksum, aborts on mismatch (setup/ChecksumVerifier.ts)
  - [ ] 16.3 Implement tool availability check and minimum version enforcement for all 6 tools
  - [ ] 16.4 Implement tool download for Semgrep, Gitleaks, Trivy (standalone Windows binaries from official GitHub releases)
  - [ ] 16.5 Implement pip install for pip-audit and detect-secrets with checksum verification
  - [ ] 16.6 Implement upgrade offer when installed tool version is below minimum
  - [ ] 16.7 Silent mode: no interactive prompts, exit non-zero on any tool install failure
  - [ ] 16.8 Write smoke test: scanner setup --silent completes without error; all tools available and meet minimum versions

- [ ] 17. Rule Updater and Self-Update Manager
  - [ ] 17.1 Implement RuleUpdater: downloads latest Semgrep registry rulesets, Gitleaks rules, Trivy DB; reports updated/current/failed per ruleset; updates CredentialRedactor patterns atomically (update/RuleUpdater.ts)
  - [ ] 17.2 Implement RuleManifestManager: reads/writes rule-manifest.json, checks ruleset staleness (update/RuleManifestManager.ts)
  - [ ] 17.3 Implement staleness check at scan start: produce Informational finding if any ruleset is >30 days old
  - [ ] 17.4 Implement SelfUpdateManager: checks release manifest, downloads new binary, verifies checksum, performs atomic replacement (update/SelfUpdateManager.ts)
  - [ ] 17.5 Implement 7-day cached update check: do not make network request on every scan invocation
  - [ ] 17.6 Implement --silent flag on self-update command
  - [ ] 17.7 Log rules_updated, self_update_completed, self_update_failed events to audit log

- [ ] 18. MCP Allowlist and MCP Security Scanning
  - [ ] 18.1 Implement McpAllowlistManager: reads/writes mcp-allowlist.json, checks URLs against allowlist (config/McpAllowlistManager.ts)
  - [ ] 18.2 Integrate allowlist check into MCP config scanning: suppress "unverified external MCP" finding for allowlisted URLs
  - [ ] 18.3 Implement MCP local vs remote detection: check for resolvable local file path or installed package directory
  - [ ] 18.4 Integrate Trivy scanning of local MCP npm package dependency trees

- [ ] 19. Onboarding and First-Run Experience
  - [ ] 19.1 Implement first-run detection: check for absence of scan history to determine first run (orchestrator/ScanOrchestrator.ts)
  - [ ] 19.2 Display onboarding message on first scan: scanner purpose, scan categories, severity model
  - [ ] 19.3 After first scan with findings: display severity model explanation and suppression instructions
  - [ ] 19.4 Implement onboarding CLI command that re-displays guidance and runs a guided first scan
  - [ ] 19.5 Log onboarding_completed audit event

- [ ] 20. Documentation
  - [ ] 20.1 Write docs/installation.md: prerequisites, step-by-step setup, verification steps, pre-commit hook installation
  - [ ] 20.2 Write docs/admin-deployment.md: silent install, MDM/Group Policy deployment, admin-policy.json distribution, proxy configuration, team update management
  - [ ] 20.3 Write docs/usage.md: running scans from IDE and CLI, interpreting reports, severity model, git history scan, update-rules, scan-history command
  - [ ] 20.4 Write docs/configuration-reference.md: every config option with name, default, accepted values, description; covers scan categories, proxy, custom registries, history retention, staleness threshold, debug logging, log forwarding
  - [ ] 20.5 Write docs/security-files.md: schema, fields, and annotated examples for mcp-allowlist.json, suppressions.json, admin-policy.json, rule-manifest.json, custom-rules/ directory
  - [ ] 20.6 Write docs/faq.md: all 13 FAQ topics including debug logging question
  - [ ] 20.7 Write docs/troubleshooting.md: tool install failures, proxy issues, corrupted config recovery, re-installing pre-commit hook
  - [ ] 20.8 Write CHANGELOG.md with initial version entry

- [ ] 21. Property-Based Tests
  - [ ] 21.1 Property 1: Pre-commit exit code reflects highest finding severity (fast-check, min 100 iterations)
  - [ ] 21.2 Property 2: Scan report summary counts match finding list
  - [ ] 21.3 Property 3: Every finding contains all required non-empty fields
  - [ ] 21.4 Property 4: Suppressed findings excluded from active list
  - [ ] 21.5 Property 5: Credential values never written to any log
  - [ ] 21.6 Property 6: Audit log is append-only and grows monotonically
  - [ ] 21.7 Property 7: Audit log hash chain is valid after any sequence of writes
  - [ ] 21.8 Property 8: Allowlisted MCP URLs do not produce unverified-MCP findings
  - [ ] 21.9 Property 9: Admin policy settings take precedence over developer-local config
  - [ ] 21.10 Property 10: IDE diagnostics mirror the active finding list
  - [ ] 21.11 Property 11: Consecutive scans replace, not accumulate, IDE diagnostics
  - [ ] 21.12 Property 12: Scan history retention limit is enforced
  - [ ] 21.13 Property 13: Credential findings in .env and config files are Critical severity
  - [ ] 21.14 Property 14: Known-safe credential contexts produce Informational, not High, severity

- [ ] 22. Integration and Smoke Tests
  - [ ] 22.1 Integration test: SemgrepRunner against fixture file with known SQL injection pattern; assert finding produced
  - [ ] 22.2 Integration test: GitleaksRunner against fixture file with hardcoded API key; assert Critical finding produced
  - [ ] 22.3 Integration test: TrivyRunner against fixture package.json with known-vulnerable dependency; assert CVE finding produced
  - [ ] 22.4 Integration test: pre-commit hook against staged fixture file with Critical finding; assert exit code 1
  - [ ] 22.5 Integration test: audit log forwarding to local file; assert entries written to forwarding destination
  - [ ] 22.6 Smoke test: scanner setup --silent completes without error on clean Windows environment
  - [ ] 22.7 Smoke test: scanner scan produces last-scan-report.json
  - [ ] 22.8 Smoke test: audit-log --verify reports no tampering on freshly written log
