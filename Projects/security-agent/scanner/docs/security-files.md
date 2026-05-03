# Security Files

Scanner state lives under `.kiro/security/` in each workspace.

## `audit.log`

JSON Lines audit log with SHA-256 hash chaining. Verify it with:

```powershell
dist\scanner.exe audit-log --verify --workspace .
```

## `last-scan-report.json`

Most recent scan report. Reports include:

- `summary`
- `findings`
- `suppressedFindings`
- `warnings`
- `staleRulesets`

Warnings are used for missing tools, tool failures, or incomplete scanner coverage.

## `scan-history/`

Retained scan reports. The default retention limit is `10`.

## `suppressions.json`

Developer-local suppressions:

```json
[
  {
    "ruleId": "example-rule",
    "filePath": "src/example.ts",
    "justification": "False positive because the test value is synthetic.",
    "addedAt": "2026-05-03T00:00:00.000Z",
    "addedBy": "developer",
    "requiresJustification": false
  }
]
```

`ruleId`, `filePath`, and `justification` are required.

## `mcp-allowlist.json`

Allowlisted remote MCP URLs or identifiers:

```json
[
  {
    "urlOrIdentifier": "https://trusted.example.com/mcp",
    "description": "Approved team MCP server",
    "addedAt": "2026-05-03T00:00:00.000Z"
  }
]
```

The internal MCP scanner checks `mcp.json`, `mcp.config.json`, and `mcp-settings.json`. Remote URLs not present in the local or admin allowlist produce informational findings.

## `admin-policy.json`

```json
{
  "version": "1.0.0",
  "mcpAllowlistEntries": [],
  "suppressionBaseline": [],
  "minimumToolVersions": {},
  "enabledCategories": ["credentials", "dependencies", "mcp-config"],
  "allowLocalSuppressions": true
}
```

## `rule-manifest.json`

Records ruleset names, versions, source URLs, and update timestamps.

## `custom-rules/`

`dist\scanner.exe update-rules --workspace .` writes:

```text
.kiro/security/custom-rules/agent-security-scanner.yml
```

The Semgrep runner loads that file alongside `--config auto` when present.
