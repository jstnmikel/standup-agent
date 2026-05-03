# Changelog

## 0.1.0

- Added CLI and Kiro/VS Code extension entry points.
- Added six scanner tool runners and JSON normalizers.
- Added unified finding model, report builder, scan history, suppressions, config loading, and admin policy precedence.
- Added tamper-evident audit logging and debug logging with credential redaction.
- Added setup and pre-commit hook installer.
- Added Windows executable packaging via `npm run package:exe`, producing `dist/scanner.exe`.
- Added setup installation attempts for missing scanner tools using `winget` and `python -m pip --user`.
- Added minimum version parsing/enforcement and scan report warnings for missing/failing tools.
- Added MCP allowlist/config scanning and generated built-in Semgrep rule pack.
- Updated `esbuild` to a patched version; `npm audit` reports zero vulnerabilities.
