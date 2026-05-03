import type { FindingCategory } from '../models/Finding';

export interface ScanContext {
  workspaceRoot: string;
  scanType: 'manual' | 'pre-commit' | 'history';
  stagedFiles?: string[];
  enabledCategories: FindingCategory[];
  debug: boolean;
}
