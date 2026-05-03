import type { Finding } from './Finding';
import type { RuleManifest } from './RuleManifest';
import type { SuppressedFinding } from './Suppression';

export interface FindingSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  total: number;
}

export interface TrendDelta {
  criticalDelta: number;
  highDelta: number;
  mediumDelta: number;
  lowDelta: number;
  informationalDelta: number;
  comparedToReportId: string;
}

export interface ScanWarning {
  code: string;
  message: string;
  toolId?: string;
}

export interface ScanReport {
  id: string;
  timestamp: string;
  scanType: 'manual' | 'pre-commit' | 'history';
  workspaceRoot: string;
  scannerVersion: string;
  ruleManifest: RuleManifest;
  elapsedMs: number;
  summary: FindingSummary;
  findings: Finding[];
  suppressedFindings: SuppressedFinding[];
  trend?: TrendDelta;
  staleRulesets: string[];
  warnings: ScanWarning[];
}
