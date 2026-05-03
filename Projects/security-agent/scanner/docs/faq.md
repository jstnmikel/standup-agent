# FAQ

## How do I run the Windows executable?

```powershell
dist\scanner.exe --version
dist\scanner.exe setup --workspace .
dist\scanner.exe scan --workspace .
```

## Does setup install scanner tools?

Yes. By default, setup attempts to install missing tools with `winget` or `python -m pip --user`.

Use check-only mode to avoid changes:

```powershell
dist\scanner.exe setup --check-only --no-hook --workspace .
```

## Why did setup return exit code 1 in check-only mode?

At least one required tool is missing or below its minimum version. That is expected on a fresh machine and does not mean `scanner.exe` failed.

## Why does my scan show zero findings but several warnings?

The scanner continues when external tools are missing. Missing tools are reported in `warnings`, and the audit log records `scan_tool_error`. Install the tools with setup to get full coverage.

## Why was my commit blocked?

Pre-commit mode exits with code `1` when active findings include `Critical` or `High` severity.

## How do I suppress a false positive?

Add an entry to `.kiro/security/suppressions.json` with `ruleId`, `filePath`, and a non-empty `justification`, or use the IDE quick fix when diagnostics are published.

## How do I add an MCP server to the allowlist?

Add it to `.kiro/security/mcp-allowlist.json`:

```json
[
  {
    "urlOrIdentifier": "https://trusted.example.com/mcp",
    "description": "Approved MCP server",
    "addedAt": "2026-05-03T00:00:00.000Z"
  }
]
```

## How do I update rules?

```powershell
dist\scanner.exe update-rules --workspace .
```

This writes the built-in Semgrep rule pack to `.kiro/security/custom-rules/agent-security-scanner.yml`.

## What data is sent over the network?

The scanner does not forward audit logs or findings by default. Setup may use `winget` or `pip` to install missing tools. External scanner tools may contact their own update/advisory services.

## How do I enable debug logging?

Set `debugLogging: true` in `.kiro/security/scanner-config.json` or pass `--debug` to `scan`.

## Is self-update implemented?

Not yet. `self-update` is a placeholder for local builds.
