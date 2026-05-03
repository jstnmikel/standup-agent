import type { FindingCategory } from './Finding';
import type { McpAllowlistEntry } from './McpAllowlistEntry';
import type { Suppression } from './Suppression';

export interface AdminPolicy {
  version: string;
  mcpAllowlistEntries: McpAllowlistEntry[];
  suppressionBaseline: Suppression[];
  minimumToolVersions: Record<string, string>;
  enabledCategories?: FindingCategory[];
  disabledCategories?: FindingCategory[];
  allowLocalSuppressions: boolean;
}
