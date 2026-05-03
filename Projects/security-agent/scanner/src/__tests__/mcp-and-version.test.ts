import { mkdir, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { McpConfigScanner } from '../orchestrator/McpConfigScanner';
import { compareVersions, extractVersion, satisfiesMinimumVersion } from '../utils/version';

async function tempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `agent-security-scanner-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

describe('MCP scanning and version helpers', () => {
  it('extracts and compares semantic versions from command output', () => {
    expect(extractVersion('semgrep 1.52.3')).toBe('1.52.3');
    expect(compareVersions('1.52.3', '1.50.0')).toBe(1);
    expect(compareVersions('1.50.0', '1.50.0')).toBe(0);
    expect(compareVersions('1.49.9', '1.50.0')).toBe(-1);
    expect(satisfiesMinimumVersion('gitleaks version 8.18.0', '8.18.0')).toBe(true);
  });

  it('does not report allowlisted external MCP URLs', async () => {
    const workspace = await tempDir();
    try {
      await writeFile(
        path.join(workspace, 'mcp.json'),
        JSON.stringify({ servers: [{ url: 'https://trusted.example.com/mcp' }, { url: 'https://unknown.example.com/mcp' }] }),
        'utf8'
      );

      const findings = await new McpConfigScanner().scan(workspace, [
        {
          urlOrIdentifier: 'https://trusted.example.com/mcp',
          addedAt: '2026-05-03T00:00:00.000Z'
        }
      ]);

      expect(findings).toHaveLength(1);
      expect(findings[0].description).toContain('https://unknown.example.com/mcp');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
