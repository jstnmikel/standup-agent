import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asArray, asRecord, finding, severityFromText } from './normalizerUtils';

export class TrivyNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    const root = asRecord(raw.rawJson);
    return asArray(root.Results).flatMap((resultValue) => {
      const result = asRecord(resultValue);
      const target = String(result.Target ?? 'dependency manifest');
      return asArray(result.Vulnerabilities).map((vulnValue) => {
        const vuln = asRecord(vulnValue);
        return finding(
          {
            toolId: 'trivy',
            ruleId: String(vuln.VulnerabilityID ?? 'trivy-vulnerability'),
            severity: severityFromText(vuln.Severity),
            title: `${String(vuln.PkgName ?? 'Dependency')} ${String(vuln.VulnerabilityID ?? 'vulnerability')}`,
            filePath: target,
            lineNumber: 1,
            standardIdentifier: String(vuln.VulnerabilityID ?? 'CVE'),
            description: String(vuln.Description ?? vuln.Title ?? 'A vulnerable dependency was detected.'),
            remediationGuidance: vuln.FixedVersion ? `Upgrade to ${String(vuln.FixedVersion)} or later.` : 'Upgrade or replace the vulnerable dependency.',
            referenceUrl: String(vuln.PrimaryURL ?? 'https://aquasecurity.github.io/trivy/'),
            category: 'dependencies'
          },
          workspaceRoot
        );
      });
    });
  }
}
