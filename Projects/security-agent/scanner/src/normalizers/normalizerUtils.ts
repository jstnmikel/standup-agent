import type { Finding, Severity } from '../models/Finding';
import { createFindingId, normalizeWorkspacePath } from '../utils/findingIds';

export function severityFromText(value: unknown): Severity {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('critical')) {
    return 'Critical';
  }
  if (text.includes('high')) {
    return 'High';
  }
  if (text.includes('medium') || text.includes('moderate')) {
    return 'Medium';
  }
  if (text.includes('low')) {
    return 'Low';
  }
  return 'Informational';
}

export function finding(params: Omit<Finding, 'id'>, workspaceRoot: string): Finding {
  const filePath = normalizeWorkspacePath(params.filePath || 'unknown', workspaceRoot);
  return {
    ...params,
    id: createFindingId(params.toolId, params.ruleId, filePath, params.lineNumber || 1),
    filePath,
    lineNumber: params.lineNumber || 1
  };
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
