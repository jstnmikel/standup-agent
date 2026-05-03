# Admin Deployment

Administrators can distribute the extension/CLI bundle, the packaged Windows executable at `dist\scanner.exe`, and an `admin-policy.json` file.

Build and package:

```powershell
npm install
npm run package:exe
```

Deploy `dist\scanner.exe` to a managed location and run setup per repository:

```powershell
scanner.exe setup --silent --workspace C:\path\to\repo
```

Recommended baseline:

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
  "allowLocalSuppressions": true
}
```

Use `scanner setup --silent --workspace <repo>` or `scanner.exe setup --silent --workspace <repo>` during provisioning to install missing scanner tools and the pre-commit hook.

Use `scanner setup --check-only --silent --workspace <repo>` or `scanner.exe setup --check-only --silent --no-hook --workspace <repo>` to inventory tool availability without changing the machine.

Current setup uses `winget` and `python -m pip --user` installers. It does not yet perform official standalone binary downloads from release manifests by default, although checksum/download utility classes exist in the codebase.
