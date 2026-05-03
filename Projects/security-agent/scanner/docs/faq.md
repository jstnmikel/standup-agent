# FAQ

## Why was my commit blocked?

Pre-commit mode exits with code `1` when active findings include `Critical` or `High` severity.

## How do I suppress a false positive?

Add an entry to `.kiro/security/suppressions.json` with `ruleId`, `filePath`, and a non-empty `justification`.

## What data is sent over the network?

The local scanner does not forward data unless log forwarding or external tool update behavior is configured. Individual tools may contact their own advisory databases.

## What happens if a scanner tool fails?

The failure is logged as `scan_tool_error`, and remaining tools continue.

## How do I enable debug logging?

Set `debugLogging: true` in `.kiro/security/scanner-config.json` or pass `--debug` to `scanner scan`.

## How do I run the Windows executable?

Use the packaged executable:

```powershell
dist\scanner.exe --version
dist\scanner.exe setup --workspace .
dist\scanner.exe scan --workspace .
```

`setup` installs missing tools by default. Use `--check-only --no-hook` to inventory without changing the machine.
