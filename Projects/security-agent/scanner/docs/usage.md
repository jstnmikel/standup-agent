# Usage

## CLI Scan

```powershell
scanner scan --workspace .
scanner scan --pre-commit --staged-files src/index.ts
scanner scan --history
scanner scan --output-json
```

When using the packaged Windows executable directly:

```powershell
dist\scanner.exe scan --workspace .
dist\scanner.exe scan --pre-commit --staged-files src/index.ts
dist\scanner.exe scan --history
dist\scanner.exe scan --output-json
```

Reports are written to `.kiro/security/last-scan-report.json` and `.kiro/security/scan-history/`.
If a scanner tool is unavailable or fails, the report includes a `warnings` entry and the audit log records `scan_tool_error`.

## Audit Log

```powershell
scanner audit-log --verify
scanner audit-log --event-type scan_tool_error
dist\scanner.exe audit-log --verify
```

The audit log is JSON Lines with a SHA-256 hash chain.

## Kiro / VS Code

Use the command palette:

- `Agent Security Scanner: Run Scan`
- `Agent Security Scanner: Run History Scan`
- `Agent Security Scanner: View Audit Log`

Findings are published as diagnostics and listed in the `Agent Security Scanner` output channel.

## Setup From EXE

```powershell
dist\scanner.exe setup --workspace .
dist\scanner.exe setup --check-only --no-hook --workspace .
```

Default setup attempts to install missing scanner tools. Check-only mode inventories without installing and returns non-zero if tools are missing.

## Rule Updates

```powershell
dist\scanner.exe update-rules --workspace .
```

This writes the built-in Semgrep rule pack to `.kiro/security/custom-rules/agent-security-scanner.yml` and records it in `rule-manifest.json`.
