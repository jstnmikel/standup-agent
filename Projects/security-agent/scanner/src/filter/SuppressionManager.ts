import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type { Suppression } from '../models/Suppression';

export class SuppressionManager {
  async load(workspaceRoot: string): Promise<Suppression[]> {
    const filePath = path.resolve(workspaceRoot, '.kiro/security/suppressions.json');
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map((item) => this.validate(item)) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async add(workspaceRoot: string, suppression: Omit<Suppression, 'addedAt' | 'addedBy' | 'requiresJustification'> & Partial<Suppression>): Promise<Suppression> {
    if (!suppression.justification?.trim()) {
      throw new Error('Suppression justification is required');
    }

    const current = await this.load(workspaceRoot);
    const next: Suppression = {
      ruleId: suppression.ruleId,
      filePath: suppression.filePath,
      justification: suppression.justification,
      addedAt: suppression.addedAt ?? new Date().toISOString(),
      addedBy: suppression.addedBy ?? os.userInfo().username,
      requiresJustification: suppression.requiresJustification ?? false
    };
    const filePath = path.resolve(workspaceRoot, '.kiro/security/suppressions.json');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify([...current, next], null, 2)}\n`, 'utf8');
    return next;
  }

  private validate(value: unknown): Suppression {
    const candidate = value as Partial<Suppression>;
    if (!candidate.ruleId || !candidate.filePath || !candidate.justification) {
      throw new Error('Suppression entries require ruleId, filePath, and justification');
    }
    return {
      ruleId: candidate.ruleId,
      filePath: candidate.filePath,
      justification: candidate.justification,
      addedAt: candidate.addedAt ?? new Date().toISOString(),
      addedBy: candidate.addedBy ?? 'unknown',
      requiresJustification: candidate.requiresJustification ?? false
    };
  }
}
