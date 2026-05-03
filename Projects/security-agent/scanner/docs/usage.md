# Usage

Use `dist\scanner.exe` when running the packaged Windows build. If the CLI is installed on `PATH`, the same commands are available as `scanner`.

## Setup

Install missing tools and the Git pre-commit hook:

```powershell
dist\scanner.exe setup --workspace .
```

Check tool availability without changing the machine:

```powershell
dist\scanner.exe setup --check-only --no-hook --workspace .
```

## Scan

Run a full workspace scan:

```powershell
dist\scanner.exe scan --workspace .
```

Run a pre-commit scan over staged files:

```powershell
dist\scanner.exe scan --pre-commit --staged-files src/index.ts --workspace .
```

Run history mode:

```powershell
dist\scanner.exe scan --history --workspace .
```

Emit JSON to stdout:

```powershell
dist\scanner.exe scan --output-json --workspace .
```

Reports are written to:

- `.kiro/security/last-scan-report.json`
- `.kiro/security/scan-history/`

If a scanner tool is unavailable or fails, the scan still completes. The report includes a `warnings` array, terminal output lists the warning, and the audit log records `scan_tool_error`.

## Audit Log

Verify the tamper-evident hash chain:

```powershell
dist\scanner.exe audit-log --verify --workspace .
```

Print recent audit entries with filters:

```powershell
dist\scanner.exe audit-log --event-type scan_tool_error --workspace .
```

The audit log is JSON Lines and is written to `.kiro/security/audit.log` by default.

## Rule Updates

```powershell
dist\scanner.exe update-rules --workspace .
```

Current behavior writes the built-in Semgrep rule pack to:

```text
.kiro/security/custom-rules/agent-security-scanner.yml
```

The Semgrep runner loads that file alongside `--config auto` when it exists.

## Scan History

List reports:

```powershell
dist\scanner.exe scan-history --workspace .
```

Show one report:

```powershell
dist\scanner.exe scan-history <report-id> --workspace .
```

## Kiro / VS Code

Command palette commands:

- `Agent Security Scanner: Run Scan`
- `Agent Security Scanner: Run History Scan`
- `Agent Security Scanner: View Audit Log`
- `Agent Security Scanner: Suppress Finding`

Findings are published as diagnostics and listed in the `Agent Security Scanner` output channel.

## Exit Codes

- `scan --pre-commit` exits `1` when active findings include `Critical` or `High`.
- `setup --check-only` exits `1` when required tools are missing or below minimum version.
- `audit-log --verify` exits `1` when the hash chain is invalid.
