import { promises as fs } from 'fs';
import path from 'path';
import type { AdminPolicy } from '../models/AdminPolicy';
import type { McpAllowlistEntry } from '../models/McpAllowlistEntry';

export class McpAllowlistManager {
  async load(workspaceRoot: string, adminPolicy: AdminPolicy | null): Promise<McpAllowlistEntry[]> {
    const localPath = path.resolve(workspaceRoot, '.kiro/security/mcp-allowlist.json');
    const local = await this.loadLocal(localPath);
    return [...(adminPolicy?.mcpAllowlistEntries ?? []), ...local];
  }

  isAllowlisted(urlOrIdentifier: string, entries: McpAllowlistEntry[]): boolean {
    return entries.some((entry) => entry.urlOrIdentifier === urlOrIdentifier);
  }

  private async loadLocal(filePath: string): Promise<McpAllowlistEntry[]> {
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((entry): entry is McpAllowlistEntry => {
        const candidate = entry as Partial<McpAllowlistEntry>;
        return typeof candidate.urlOrIdentifier === 'string' && typeof candidate.addedAt === 'string';
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
