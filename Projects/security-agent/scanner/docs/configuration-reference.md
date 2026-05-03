# Configuration Reference

Local configuration lives at `.kiro/security/scanner-config.json`.

| Option | Default | Description |
|---|---:|---|
| `enabledCategories` | all categories | Finding categories to include. |
| `customRulesDir` | `.kiro/security/custom-rules/` | Local Semgrep-compatible rules directory. |
| `additionalSemgrepRegistries` | `[]` | Additional Semgrep registry rules. |
| `parallelToolLimit` | `6` | Intended parallel scanner limit. |
| `scanHistoryRetentionCount` | `10` | Number of history reports to keep. |
| `ruleStalenessDays` | `30` | Age threshold for stale rulesets. |
| `debugLogging` | `false` | Enables `.kiro/security/scanner-debug.log`. |
| `auditLogPath` | `.kiro/security/audit.log` | Audit JSON Lines path. |
| `selfUpdateCheckIntervalDays` | `7` | Cached update check interval. |
| `adminPolicyPath` | `.kiro/security/admin-policy.json` | Admin policy path. |
| `proxy` | unset | HTTP, HTTPS, and no-proxy settings. |
| `logForwarding` | unset | Optional file/webhook forwarding target. |

Admin policy values override local settings when both define the same policy-controlled behavior.
