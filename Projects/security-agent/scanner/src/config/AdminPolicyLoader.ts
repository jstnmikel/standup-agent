import { promises as fs } from 'fs';
import path from 'path';
import type { AdminPolicy } from '../models/AdminPolicy';

export class AdminPolicyLoader {
  async load(workspaceRoot: string, policyPath: string): Promise<AdminPolicy | null> {
    const resolvedPath = path.resolve(workspaceRoot, policyPath);

    try {
      const raw = await fs.readFile(resolvedPath, 'utf8');
      return this.validate(JSON.parse(raw));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Unable to load admin policy at ${resolvedPath}: ${(error as Error).message}`);
    }
  }

  validate(value: unknown): AdminPolicy {
    if (!value || typeof value !== 'object') {
      throw new Error('Admin policy must be a JSON object');
    }

    const candidate = value as Partial<AdminPolicy>;
    if (typeof candidate.version !== 'string' || candidate.version.length === 0) {
      throw new Error('Admin policy version is required');
    }

    if (typeof candidate.allowLocalSuppressions !== 'boolean') {
      throw new Error('Admin policy allowLocalSuppressions must be boolean');
    }

    return {
      version: candidate.version,
      mcpAllowlistEntries: candidate.mcpAllowlistEntries ?? [],
      suppressionBaseline: candidate.suppressionBaseline ?? [],
      minimumToolVersions: candidate.minimumToolVersions ?? {},
      enabledCategories: candidate.enabledCategories,
      disabledCategories: candidate.disabledCategories,
      allowLocalSuppressions: candidate.allowLocalSuppressions
    };
  }
}
