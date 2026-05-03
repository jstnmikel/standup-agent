# Security Files

## `.kiro/security/suppressions.json`

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

## `.kiro/security/admin-policy.json`

```json
{
  "version": "1.0.0",
  "mcpAllowlistEntries": [],
  "suppressionBaseline": [],
  "minimumToolVersions": {},
  "enabledCategories": ["credentials", "dependencies"],
  "allowLocalSuppressions": true
}
```

## `.kiro/security/rule-manifest.json`

Records ruleset names, versions, source URLs, and update timestamps.

## `.kiro/security/custom-rules/`

Place Semgrep YAML rule files here. `scanner update-rules` writes `agent-security-scanner.yml`, and the Semgrep runner loads it alongside `--config auto`.
