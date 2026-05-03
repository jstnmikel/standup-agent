import crypto from 'crypto';

export function createFindingId(toolId: string, ruleId: string, filePath: string, lineNumber: number): string {
  return crypto.createHash('sha256').update(`${toolId}:${ruleId}:${filePath}:${lineNumber}`).digest('hex').slice(0, 24);
}

export function normalizeWorkspacePath(filePath: string, workspaceRoot: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const root = workspaceRoot.replace(/\\/g, '/');
  return normalized.startsWith(root) ? normalized.slice(root.length).replace(/^\/+/, '') : normalized;
}
