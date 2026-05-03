import type { ScannerConfig } from '../models/ScannerConfig';

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  enabledCategories: [
    'owasp-top10',
    'cwe-top25',
    'owasp-llm-top10',
    'owasp-agentic-top10',
    'stride',
    'credentials',
    'dependencies',
    'mcp-config',
    'mcp-malicious-code',
    'supply-chain',
    'git-history',
    'agent-attack-patterns',
    'ai-transparency',
    'kiro-agent-files',
    'windows-credential-manager'
  ],
  customRulesDir: '.kiro/security/custom-rules/',
  additionalSemgrepRegistries: [],
  parallelToolLimit: 6,
  scanHistoryRetentionCount: 10,
  ruleStalenessDays: 30,
  debugLogging: false,
  auditLogPath: '.kiro/security/audit.log',
  selfUpdateCheckIntervalDays: 7,
  adminPolicyPath: '.kiro/security/admin-policy.json'
};
