# Installation

Agent Security Scanner is built as a Node.js CLI, a Kiro/VS Code-compatible extension bundle, and a packaged Windows executable.

## Prerequisites

- Windows workstation
- Git
- Node.js 18 or newer, only needed to build from source
- Python and `pip`, needed if setup installs Semgrep, pip-audit, or detect-secrets
- `winget`, needed if setup installs Gitleaks, Trivy, or Node.js/npm

The scanner runs external tools as child processes. Setup can install missing tools, but scans only get full coverage once these commands are available on `PATH`:

- `semgrep`
- `gitleaks`
- `trivy`
- `npm`
- `pip-audit`
- `detect-secrets`

## Build From Source

```powershell
npm install
npm run typecheck
npm test -- --runInBand
npm run lint
npm run build
```

## Package The Windows EXE

```powershell
npm run package:exe
```

This creates:

```text
dist\scanner.exe
```

Verify the executable:

```powershell
dist\scanner.exe --version
```

Expected output for this build:

```text
0.1.0
```

## Install Scanner Tools

Run setup from the packaged executable:

```powershell
dist\scanner.exe setup --workspace .
```

Setup installs the Git pre-commit hook and attempts to install missing scanner tools. Current installer strategy:

| Tool | Install strategy |
|---|---|
| Semgrep | `python -m pip install --user semgrep`, then `py -m pip install --user semgrep` |
| Gitleaks | `winget install --exact --id Gitleaks.Gitleaks` |
| Trivy | `winget install --exact --id AquaSecurity.Trivy` |
| npm audit | `winget install --exact --id OpenJS.NodeJS.LTS` |
| pip-audit | `python -m pip install --user pip-audit`, then `py -m pip install --user pip-audit` |
| detect-secrets | `python -m pip install --user detect-secrets`, then `py -m pip install --user detect-secrets` |

Inventory without installing tools or a hook:

```powershell
dist\scanner.exe setup --check-only --no-hook --workspace .
```

In check-only mode, exit code `1` means one or more tools are missing or below the required minimum version. That is expected when auditing a fresh machine.

## Verify A Workspace

```powershell
dist\scanner.exe update-rules --workspace .
dist\scanner.exe scan --workspace .
dist\scanner.exe audit-log --verify --workspace .
```

Reports are written under `.kiro/security/`.

## Current Limitations

- Setup uses `winget` and `pip` instead of official standalone release downloads by default.
- Checksum verification utilities exist in code, but are not yet wired into the default setup installers.
- `self-update` is a placeholder for local builds and does not replace `scanner.exe` yet.
