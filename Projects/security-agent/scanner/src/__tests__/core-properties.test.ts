import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import * as fc from 'fast-check';
import { ConfigLoader } from '../config/ConfigLoader';
import { FindingFilter } from '../filter/FindingFilter';
import { AuditLogger } from '../logging/AuditLogger';
import { CredentialRedactor } from '../logging/CredentialRedactor';
import type { AdminPolicy } from '../models/AdminPolicy';
import type { Finding, Severity } from '../models/Finding';
import type { Suppression } from '../models/Suppression';
import { ReportBuilder } from '../report/ReportBuilder';
import { preCommitExitCode } from '../utils/preCommitPolicy';

const severities: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'finding-id',
    toolId: 'semgrep',
    ruleId: 'rule-id',
    severity: 'Medium',
    title: 'Example finding',
    filePath: 'src/example.ts',
    lineNumber: 1,
    standardIdentifier: 'CWE-798',
    description: 'Example description',
    remediationGuidance: 'Fix the issue',
    referenceUrl: 'https://example.com/security',
    category: 'credentials',
    ...overrides
  };
}

function suppression(overrides: Partial<Suppression> = {}): Suppression {
  return {
    ruleId: 'rule-id',
    filePath: 'src/example.ts',
    justification: 'False positive in test fixture',
    addedAt: '2026-05-03T00:00:00.000Z',
    addedBy: 'tester',
    requiresJustification: false,
    ...overrides
  };
}

async function tempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'agent-security-scanner-'));
}

describe('core scanner properties', () => {
  it('Property 1: pre-commit exit code reflects highest finding severity', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...severities)), (generatedSeverities) => {
        const findings = generatedSeverities.map((severity, index) => finding({ id: `finding-${index}`, severity }));
        const hasBlockingFinding = generatedSeverities.some((severity) => severity === 'Critical' || severity === 'High');
        expect(preCommitExitCode(findings)).toBe(hasBlockingFinding ? 1 : 0);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 2: scan report summary counts match finding list', () => {
    const builder = new ReportBuilder();

    fc.assert(
      fc.property(fc.array(fc.constantFrom(...severities)), (generatedSeverities) => {
        const findings = generatedSeverities.map((severity, index) => finding({ id: `finding-${index}`, severity }));
        const summary = builder.summarize(findings);

        expect(summary.total).toBe(findings.length);
        expect(summary.critical).toBe(generatedSeverities.filter((severity) => severity === 'Critical').length);
        expect(summary.high).toBe(generatedSeverities.filter((severity) => severity === 'High').length);
        expect(summary.medium).toBe(generatedSeverities.filter((severity) => severity === 'Medium').length);
        expect(summary.low).toBe(generatedSeverities.filter((severity) => severity === 'Low').length);
        expect(summary.informational).toBe(generatedSeverities.filter((severity) => severity === 'Informational').length);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4: suppressed findings are excluded from active list', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1 }), { minLength: 1 }), (ruleIds) => {
        const findings = ruleIds.map((ruleId, index) =>
          finding({ id: `finding-${index}`, ruleId, filePath: `src/file-${index}.ts` })
        );
        const suppressions = findings
          .filter((_, index) => index % 2 === 0)
          .map((item) => suppression({ ruleId: item.ruleId, filePath: item.filePath }));

        const result = new FindingFilter().apply(findings, suppressions, null);
        const suppressedPairs = new Set(result.suppressed.map(({ finding: item }) => `${item.ruleId}:${item.filePath}`));
        const activePairs = new Set(result.active.map((item) => `${item.ruleId}:${item.filePath}`));

        for (const item of suppressions) {
          const pair = `${item.ruleId}:${item.filePath}`;
          expect(suppressedPairs.has(pair)).toBe(true);
          expect(activePairs.has(pair)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 5: credential values are never written to audit log lines', async () => {
    const workspace = await tempDir();
    const auditPath = path.join(workspace, 'audit.log');
    const secret = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';

    try {
      await new AuditLogger(auditPath).log({
        event_type: 'scan_started',
        scanner_version: '0.1.0',
        command: `scanner scan --token ${secret}`
      });

      const raw = await readFile(auditPath, 'utf8');
      expect(raw).not.toContain(secret);
      expect(raw).toContain('[REDACTED-OPENAI-API-KEY]');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it('Property 7: audit log hash chain is valid after any sequence of writes', async () => {
    const workspace = await tempDir();
    const auditPath = path.join(workspace, 'audit.log');

    try {
      const logger = new AuditLogger(auditPath);
      await logger.log({ event_type: 'scan_started' });
      await logger.log({ event_type: 'scan_completed', total_findings: 0 });
      await logger.log({ event_type: 'rules_updated', rulesets: ['semgrep'] });

      await expect(logger.verify()).resolves.toEqual({ ok: true, checkedLines: 3 });
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it('Property 9: admin policy settings take precedence over developer-local config', () => {
    const adminPolicy: AdminPolicy = {
      version: '1.0.0',
      mcpAllowlistEntries: [],
      suppressionBaseline: [],
      minimumToolVersions: {},
      enabledCategories: ['credentials'],
      allowLocalSuppressions: false
    };

    const resolved = new ConfigLoader().merge({ enabledCategories: ['dependencies'] }, adminPolicy);

    expect(resolved.merged.enabledCategories).toEqual(['credentials']);
    expect(resolved.overrides).toEqual([
      {
        key: 'enabledCategories',
        source: 'admin-policy',
        value: ['credentials'],
        ignoredLocalValue: ['dependencies']
      }
    ]);
  });

  it('redacts nested object values without mutating clean values', () => {
    const redactor = new CredentialRedactor();
    const result = redactor.redactObjectWithCount({
      clean: 'hello',
      nested: { token: 'github=ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ' }
    });

    expect(result.value.clean).toBe('hello');
    expect(JSON.stringify(result.value)).not.toContain('ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJ');
    expect(result.redactionsApplied).toBe(1);
  });

  it('audit-log verify detects tampering', async () => {
    const workspace = await tempDir();
    const auditPath = path.join(workspace, 'audit.log');

    try {
      const logger = new AuditLogger(auditPath);
      await logger.log({ event_type: 'scan_started' });
      await logger.log({ event_type: 'scan_completed', total_findings: 0 });

      const raw = await readFile(auditPath, 'utf8');
      await writeFile(auditPath, raw.replace('scan_started', 'config_changed'), 'utf8');

      const result = await logger.verify();
      expect(result.ok).toBe(false);
      expect(result.firstInvalidLine).toBe(2);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
