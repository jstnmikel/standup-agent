import type { FindingCategory } from './Finding';

export interface LogForwardingConfig {
  type: 'file' | 'webhook';
  destination: string;
  retryOnFailure: boolean;
}

export interface ProxyConfig {
  httpProxy?: string;
  httpsProxy?: string;
  noProxy?: string;
}

export interface ScannerConfig {
  enabledCategories: FindingCategory[];
  customRulesDir: string;
  additionalSemgrepRegistries: string[];
  parallelToolLimit: number;
  scanHistoryRetentionCount: number;
  ruleStalenessDays: number;
  debugLogging: boolean;
  auditLogPath: string;
  logForwarding?: LogForwardingConfig;
  proxy?: ProxyConfig;
  selfUpdateCheckIntervalDays: number;
  adminPolicyPath: string;
}

export interface ConfigOverride {
  key: keyof ScannerConfig;
  source: 'admin-policy';
  value: ScannerConfig[keyof ScannerConfig];
  ignoredLocalValue?: ScannerConfig[keyof ScannerConfig];
}
