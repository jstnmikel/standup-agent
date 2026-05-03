import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asArray, asRecord, finding } from './normalizerUtils';

export class PipAuditNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    const root = asRecord(raw.rawJson);
    return asArray(root.dependencies).flatMap((dependencyValue) => {
      const dependency = asRecord(dependencyValue);
      return asArray(dependency.vulns).map((vulnValue) => {
        const vuln = asRecord(vulnValue);
        return finding(
          {
            toolId: 'pip-audit',
            ruleId: String(vuln.id ?? 'pip-vulnerability'),
            severity: 'High',
            title: `Python vulnerability in ${String(dependency.name ?? 'dependency')}`,
            filePath: 'requirements.txt',
            lineNumber: 1,
            standardIdentifier: String(vuln.id ?? 'PYSEC'),
            description: String(vuln.description ?? 'pip-audit reported a vulnerable Python dependency.'),
            remediationGuidance: vuln.fix_versions ? `Upgrade to one of: ${String(vuln.fix_versions)}.` : 'Upgrade the affected dependency.',
            referenceUrl: String(vuln.aliases ?? 'https://pypi.org/project/pip-audit/'),
            category: 'dependencies'
          },
          workspaceRoot
        );
      });
    });
  }
}
