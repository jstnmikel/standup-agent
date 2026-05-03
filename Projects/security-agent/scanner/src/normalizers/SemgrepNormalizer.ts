import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asArray, asRecord, finding, severityFromText } from './normalizerUtils';

export class SemgrepNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    const root = asRecord(raw.rawJson);
    return asArray(root.results).map((item) => {
      const result = asRecord(item);
      const extra = asRecord(result.extra);
      const metadata = asRecord(extra.metadata);
      const start = asRecord(result.start);
      return finding(
        {
          toolId: 'semgrep',
          ruleId: String(result.check_id ?? 'semgrep-rule'),
          severity: severityFromText(extra.severity ?? metadata.impact),
          title: String(extra.message ?? result.check_id ?? 'Semgrep finding'),
          filePath: String(result.path ?? 'unknown'),
          lineNumber: Number(start.line ?? 1),
          columnNumber: Number(start.col ?? 1),
          standardIdentifier: String(metadata.cwe ?? metadata.owasp ?? metadata.category ?? 'CWE'),
          description: String(extra.message ?? 'Semgrep detected a static-analysis issue.'),
          remediationGuidance: String(metadata.fix ?? metadata.remediation ?? 'Review the matched code and apply the linked guidance.'),
          referenceUrl: String(metadata.references ?? metadata.source ?? 'https://semgrep.dev/docs/'),
          category: 'owasp-top10'
        },
        workspaceRoot
      );
    });
  }
}
