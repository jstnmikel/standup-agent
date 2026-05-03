import type { Finding } from './Finding';

export interface Suppression {
  ruleId: string;
  filePath: string;
  justification: string;
  addedAt: string;
  addedBy: string;
  requiresJustification: boolean;
}

export interface SuppressedFinding {
  finding: Finding;
  suppression: Suppression;
}
