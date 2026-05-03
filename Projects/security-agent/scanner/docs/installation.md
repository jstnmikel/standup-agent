# Installation

## Prerequisites

- Windows workstation
- Node.js 18 or newer
- Git
- Optional scanner tools on `PATH`: Semgrep, Gitleaks, Trivy, npm, pip-audit, detect-secrets

## Build

```powershell
npm install
npm run build
```

## Package Windows EXE

```powershell
npm run package:exe
```

This creates:

```text
dist\scanner.exe
```

The packaged executable contains the scanner CLI. It still launches external scanner tools such as Semgrep, Gitleaks, Trivy, npm, pip-audit, and detect-secrets as child processes, so those tools must either be installed by setup or already be available on `PATH`.

## Verify

```powershell
node dist\cli.js scan --workspace .
node dist\cli.js audit-log --verify --workspace .
dist\scanner.exe --version
dist\scanner.exe scan --workspace .
dist\scanner.exe audit-log --verify --workspace .
```

## Pre-Commit Hook

```powershell
node dist\cli.js setup --workspace .
dist\scanner.exe setup --workspace .
```

The setup command installs missing scanner tools when possible and installs `.git/hooks/pre-commit`.

Installer strategy on Windows:

- Semgrep: `python -m pip install --user semgrep`
- Gitleaks: `winget install --id Gitleaks.Gitleaks`
- Trivy: `winget install --id AquaSecurity.Trivy`
- npm audit: `winget install --id OpenJS.NodeJS.LTS`
- pip-audit: `python -m pip install --user pip-audit`
- detect-secrets: `python -m pip install --user detect-secrets`

Use check-only mode when you do not want setup to install anything:

```powershell
node dist\cli.js setup --check-only --workspace .
dist\scanner.exe setup --check-only --no-hook --workspace .
```

`setup --check-only` exits with code `1` when required tools are missing or below minimum versions. That is expected in inventory mode and does not mean the scanner executable failed.
