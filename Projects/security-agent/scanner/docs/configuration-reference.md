# Configuration Reference

Local configuration lives at:

```text
.kiro/security/scanner-config.json
```

All fields are optional. Built-in defaults are used when the file is missing.

| Option | Default | Description |
|---|---|---|
| `enabledCategories` | all categories | Finding categories to include. |
| `customRulesDir` | `.kiro/security/custom-rules/` | Local Semgrep-compatible rules directory. |
| `additionalSemgrepRegistries` | `[]` | Reserved for additional Semgrep registry sources. |
| `parallelToolLimit` | `6` | Configured scanner parallelism limit. Current orchestration launches the six tool runners concurrently. |
| `scanHistoryRetentionCount` | `10` | Maximum scan history reports to retain, except protected reports. |
| `ruleStalenessDays` | `30` | Age threshold for stale ruleset warnings. |
| `debugLogging` | `false` | Enables `.kiro/security/scanner-debug.log`. |
| `auditLogPath` | `.kiro/security/audit.log` | Audit JSON Lines path. |
| `selfUpdateCheckIntervalDays` | `7` | Reserved for future self-update checks. |
| `adminPolicyPath` | `.kiro/security/admin-policy.json` | Admin policy path. |
| `proxy` | unset | HTTP, HTTPS, and no-proxy settings. |
| `logForwarding` | unset | Reserved for file/webhook forwarding. Not implemented yet. |

Example:

```json
{
  "debugLogging": true,
  "scanHistoryRetentionCount": 20,
  "ruleStalenessDays": 30,
  "proxy": {
    "httpsProxy": "http://proxy.example.com:8080",
    "noProxy": "localhost,127.0.0.1"
  }
}
```

## Categories

Supported category identifiers:

- `owasp-top10`
- `cwe-top25`
- `owasp-llm-top10`
- `owasp-agentic-top10`
- `stride`
- `credentials`
- `dependencies`
- `mcp-config`
- `mcp-malicious-code`
- `supply-chain`
- `git-history`
- `agent-attack-patterns`
- `ai-transparency`
- `kiro-agent-files`
- `windows-credential-manager`

## Admin Policy Precedence

The scanner resolves config in this order:

1. built-in defaults
2. admin policy
3. developer-local config, where allowed

Admin policy values win for policy-controlled behavior. Current implementation enforces category allow/disable behavior, MCP allowlist entries, suppression baseline, and local suppression allowance.
