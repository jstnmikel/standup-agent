export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type FindingCategory =
  | 'owasp-top10'
  | 'cwe-top25'
  | 'owasp-llm-top10'
  | 'owasp-agentic-top10'
  | 'stride'
  | 'credentials'
  | 'dependencies'
  | 'mcp-config'
  | 'mcp-malicious-code'
  | 'supply-chain'
  | 'git-history'
  | 'agent-attack-patterns'
  | 'ai-transparency'
  | 'kiro-agent-files'
  | 'windows-credential-manager';

export interface Finding {
  id: string;
  toolId: string;
  ruleId: string;
  severity: Severity;
  title: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  standardIdentifier: string;
  description: string;
  remediationGuidance: string;
  referenceUrl: string;
  category: FindingCategory;
  language?: string;
  credentialType?: string;
  commitHash?: string;
  isKnownSafeContext?: boolean;
}
