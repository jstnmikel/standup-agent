import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asRecord, finding, severityFromText } from './normalizerUtils';

export class NpmAuditNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    const root = asRecord(raw.rawJson);
    const vulnerabilities = asRecord(root.vulnerabilities);
    return Object.entries(vulnerabilities).map(([name, value]) => {
      const vuln = asRecord(value);
      const viaValues: unknown[] = Array.isArray(vuln.via) ? vuln.via : [];
      const via = viaValues[0];
      const viaRecord = asRecord(via);
      const advisoryId = viaRecord.source ?? viaRecord.url ?? name;
      return finding(
        {
          toolId: 'npm-audit',
          ruleId: String(advisoryId),
          severity: severityFromText(vuln.severity),
          title: `npm vulnerability in ${name}`,
          filePath: 'package-lock.json',
          lineNumber: 1,
          standardIdentifier: String(viaRecord.cwe ?? 'npm-advisory'),
          description: String(viaRecord.title ?? `npm audit reported a vulnerability in ${name}.`),
          remediationGuidance: vuln.fixAvailable ? 'Run npm audit fix or update the affected dependency.' : 'Review the dependency and update when a patched version is available.',
          referenceUrl: String(viaRecord.url ?? 'https://docs.npmjs.com/cli/commands/npm-audit'),
          category: 'dependencies'
        },
        workspaceRoot
      );
    });
  }
}
