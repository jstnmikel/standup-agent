export interface RuleManifest {
  lastUpdated: string;
  rulesets: RulesetEntry[];
}

export interface RulesetEntry {
  name: string;
  sourceUrl: string;
  version: string;
  lastUpdated: string;
  standardsCovered: string[];
}
