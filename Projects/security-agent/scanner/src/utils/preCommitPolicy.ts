import type { Finding } from '../models/Finding';
import type { ScanReport } from '../models/ScanReport';

export function shouldBlockPreCommit(reportOrFindings: ScanReport | Finding[]): boolean {
  const findings = Array.isArray(reportOrFindings) ? reportOrFindings : reportOrFindings.findings;
  return findings.some((finding) => finding.severity === 'Critical' || finding.severity === 'High');
}

export function preCommitExitCode(reportOrFindings: ScanReport | Finding[]): 0 | 1 {
  return shouldBlockPreCommit(reportOrFindings) ? 1 : 0;
}
