import { promises as fs } from 'fs';
import path from 'path';
import type { AdminPolicy } from '../models/AdminPolicy';
import type { ConfigOverride, ScannerConfig } from '../models/ScannerConfig';
import { DEFAULT_SCANNER_CONFIG } from './defaults';
import { AdminPolicyLoader } from './AdminPolicyLoader';

export interface ResolvedConfig {
  adminPolicy: AdminPolicy | null;
  merged: ScannerConfig;
  overrides: ConfigOverride[];
}

type PartialScannerConfig = Partial<ScannerConfig>;

export class ConfigLoader {
  constructor(private readonly adminPolicyLoader = new AdminPolicyLoader()) {}

  async load(workspaceRoot: string): Promise<ResolvedConfig> {
    const localConfig = await this.loadLocalConfig(workspaceRoot);
    const initialAdminPath = localConfig.adminPolicyPath ?? DEFAULT_SCANNER_CONFIG.adminPolicyPath;
    const adminPolicy = await this.adminPolicyLoader.load(workspaceRoot, initialAdminPath);
    return this.merge(localConfig, adminPolicy);
  }

  merge(localConfig: PartialScannerConfig, adminPolicy: AdminPolicy | null): ResolvedConfig {
    const merged: ScannerConfig = {
      ...DEFAULT_SCANNER_CONFIG,
      ...localConfig
    };
    const overrides: ConfigOverride[] = [];

    if (adminPolicy) {
      this.applyAdminOverride(merged, overrides, localConfig, 'enabledCategories', adminPolicy.enabledCategories);

      if (adminPolicy.disabledCategories?.length) {
        const disabled = new Set(adminPolicy.disabledCategories);
        const filtered = merged.enabledCategories.filter((category) => !disabled.has(category));
        this.applyAdminOverride(merged, overrides, localConfig, 'enabledCategories', filtered);
      }
    }

    return { adminPolicy, merged, overrides };
  }

  private async loadLocalConfig(workspaceRoot: string): Promise<PartialScannerConfig> {
    const configPath = path.resolve(workspaceRoot, '.kiro/security/scanner-config.json');

    try {
      const raw = await fs.readFile(configPath, 'utf8');
      return JSON.parse(raw) as PartialScannerConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw new Error(`Unable to load scanner config at ${configPath}: ${(error as Error).message}`);
    }
  }

  private applyAdminOverride<K extends keyof ScannerConfig>(
    merged: ScannerConfig,
    overrides: ConfigOverride[],
    localConfig: PartialScannerConfig,
    key: K,
    value: ScannerConfig[K] | undefined
  ): void {
    if (value === undefined) {
      return;
    }

    const ignoredLocalValue = localConfig[key];
    merged[key] = value;
    overrides.push({
      key,
      source: 'admin-policy',
      value,
      ignoredLocalValue
    });
  }
}
