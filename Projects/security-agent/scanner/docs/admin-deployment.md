# Admin Deployment

Administrators can distribute:

- `dist\scanner.exe`
- the Kiro/VS Code extension bundle
- an optional `.kiro/security/admin-policy.json`

## Build Artifact

```powershell
npm install
npm run typecheck
npm test -- --runInBand
npm run lint
npm audit
npm run package:exe
```

The Windows executable is created at:

```text
dist\scanner.exe
```

## Provision A Repository

Install missing scanner tools and the pre-commit hook:

```powershell
scanner.exe setup --silent --workspace C:\path\to\repo
```

Inventory only:

```powershell
scanner.exe setup --check-only --silent --no-hook --workspace C:\path\to\repo
```

Current setup uses `winget` and `python -m pip --user`. It does not yet use official standalone binary release manifests by default.

## Recommended Admin Policy

Place this at `.kiro/security/admin-policy.json` or configure `adminPolicyPath`.

```json
{
  "version": "1.0.0",
  "mcpAllowlistEntries": [],
  "suppressionBaseline": [],
  "minimumToolVersions": {
    "semgrep": "1.50.0",
    "gitleaks": "8.18.0",
    "trivy": "0.50.0",
    "npm": "8.0.0",
    "pip-audit": "2.6.0",
    "detect-secrets": "1.4.0"
  },
  "enabledCategories": [
    "owasp-top10",
    "cwe-top25",
    "owasp-llm-top10",
    "owasp-agentic-top10",
    "stride",
    "credentials",
    "dependencies",
    "mcp-config",
    "mcp-malicious-code",
    "supply-chain",
    "git-history",
    "agent-attack-patterns",
    "ai-transparency",
    "kiro-agent-files",
    "windows-credential-manager"
  ],
  "allowLocalSuppressions": true
}
```

## Network Behavior

The scanner itself does not forward code or findings by default. External tools may use their own advisory or rule sources, depending on tool configuration and cache state.

Current not-yet-implemented admin features:

- webhook/file log forwarding with retry
- real scanner self-update from a hosted release manifest
- default checksum-verified standalone tool downloads
