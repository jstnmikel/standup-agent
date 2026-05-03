# Troubleshooting

## Tool Missing

Run:

```powershell
scanner setup --workspace .
dist\scanner.exe setup --workspace .
```

Setup attempts to install missing tools with `winget` or `python -m pip install --user`. If a tool installs but is still reported missing, restart the terminal so PATH changes take effect.

Inventory without installing:

```powershell
dist\scanner.exe setup --check-only --no-hook --workspace .
```

In check-only mode, exit code `1` means one or more required tools are missing or below minimum version.

## Audit Log Verification Fails

`scanner audit-log --verify` reports the first invalid line. Treat the log as tampered or corrupted from that line onward.

The executable form is equivalent:

```powershell
dist\scanner.exe audit-log --verify --workspace .
```

## Proxy Issues

Set `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY`, or configure the `proxy` object in `.kiro/security/scanner-config.json`.

## Reinstall Pre-Commit Hook

```powershell
scanner setup --workspace .
```
