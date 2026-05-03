import { promises as fs } from 'fs';
import path from 'path';
import type { Finding } from '../models/Finding';
import type { McpAllowlistEntry } from '../models/McpAllowlistEntry';
import { createFindingId, normalizeWorkspacePath } from '../utils/findingIds';

const MCP_CONFIG_NAMES = new Set(['mcp.json', 'mcp.config.json', 'mcp-settings.json']);
const REMOTE_URL = /^https?:\/\//i;

export class McpConfigScanner {
  async scan(workspaceRoot: string, allowlist: McpAllowlistEntry[]): Promise<Finding[]> {
    const files = await this.findMcpConfigFiles(workspaceRoot);
    const findings: Finding[] = [];

    for (const file of files) {
      const raw = await fs.readFile(file, 'utf8');
      const urls = this.extractUrls(JSON.parse(raw));
      for (const url of urls) {
        if (allowlist.some((entry) => entry.urlOrIdentifier === url)) {
          continue;
        }

        const filePath = normalizeWorkspacePath(file, workspaceRoot);
        const ruleId = `unverified-external-mcp:${url}`;
        findings.push({
          id: createFindingId('mcp-config', ruleId, filePath, 1),
          toolId: 'mcp-config',
          ruleId,
          severity: 'Informational',
          title: 'Unverified external MCP server',
          filePath,
          lineNumber: this.findLine(raw, url),
          standardIdentifier: 'MCP',
          description: `MCP configuration references an external server that is not allowlisted: ${url}`,
          remediationGuidance: 'Review the MCP server provenance, then add it to .kiro/security/mcp-allowlist.json if approved.',
          referenceUrl: 'https://modelcontextprotocol.io/',
          category: 'mcp-config'
        });
      }
    }

    return findings;
  }

  private async findMcpConfigFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];
    await this.walk(workspaceRoot, files);
    return files;
  }

  private async walk(dir: string, files: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walk(fullPath, files);
      } else if (MCP_CONFIG_NAMES.has(entry.name.toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  private extractUrls(value: unknown): string[] {
    if (typeof value === 'string') {
      return REMOTE_URL.test(value) ? [value] : [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.extractUrls(item));
    }
    if (value && typeof value === 'object') {
      return Object.values(value).flatMap((item) => this.extractUrls(item));
    }
    return [];
  }

  private findLine(raw: string, needle: string): number {
    const lines = raw.split(/\r?\n/);
    const index = lines.findIndex((line) => line.includes(needle));
    return index >= 0 ? index + 1 : 1;
  }
}
