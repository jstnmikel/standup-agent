import { promises as fs } from 'fs';
import path from 'path';
import type { RuleManifest } from '../models/RuleManifest';

export class RuleManifestManager {
  async load(workspaceRoot: string): Promise<RuleManifest> {
    const filePath = this.path(workspaceRoot);
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8')) as RuleManifest;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      return { lastUpdated: new Date().toISOString(), rulesets: [] };
    }
  }

  async save(workspaceRoot: string, manifest: RuleManifest): Promise<void> {
    const filePath = this.path(workspaceRoot);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  staleRulesets(manifest: RuleManifest, stalenessDays: number): string[] {
    const threshold = Date.now() - stalenessDays * 24 * 60 * 60 * 1000;
    return manifest.rulesets.filter((entry) => Date.parse(entry.lastUpdated) < threshold).map((entry) => entry.name);
  }

  private path(workspaceRoot: string): string {
    return path.resolve(workspaceRoot, '.kiro/security/rule-manifest.json');
  }
}
