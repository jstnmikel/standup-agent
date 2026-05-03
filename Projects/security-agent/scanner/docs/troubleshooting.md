# Troubleshooting

## Tool Missing

Run setup:

```powershell
dist\scanner.exe setup --workspace .
```

If you only want to inspect the machine:

```powershell
dist\scanner.exe setup --check-only --no-hook --workspace .
```

Setup attempts to install missing tools with `winget` or `python -m pip install --user`. If setup says a tool installed but the tool is still missing, restart the terminal so PATH changes take effect.

## Tool Version Too Old

Setup parses command output and compares it with minimum versions. Update the tool manually or rerun setup.

## Scan Has Warnings

Warnings mean some scanner coverage may be missing. Common causes:

- a tool is not installed
- a tool is below minimum version
- a tool exited non-zero
- a tool produced invalid JSON

The audit log also records `scan_tool_error`.

## Audit Log Verification Fails

Run:

```powershell
dist\scanner.exe audit-log --verify --workspace .
```

If verification fails, treat the log as tampered or corrupted from the first invalid line onward.

## Proxy Issues

Set environment variables:

```powershell
$env:HTTPS_PROXY = "http://proxy.example.com:8080"
$env:HTTP_PROXY = "http://proxy.example.com:8080"
$env:NO_PROXY = "localhost,127.0.0.1"
```

Or configure `proxy` in `.kiro/security/scanner-config.json`.

## Reinstall Pre-Commit Hook

```powershell
dist\scanner.exe setup --workspace .
```

Use `--no-hook` when you do not want setup to touch Git hooks.
