import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asArray, asRecord, finding } from './normalizerUtils';

export class GitleaksNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    return asArray(raw.rawJson).map((item) => {
      const leak = asRecord(item);
      return finding(
        {
          toolId: 'gitleaks',
          ruleId: String(leak.RuleID ?? leak.RuleId ?? 'gitleaks-secret'),
          severity: 'Critical',
          title: 'Secret detected by Gitleaks',
          filePath: String(leak.File ?? leak.file ?? 'unknown'),
          lineNumber: Number(leak.StartLine ?? leak.Line ?? 1),
          standardIdentifier: 'CWE-798',
          description: 'A hardcoded credential or token was detected.',
          remediationGuidance: 'Remove the secret, rotate it, and store future credentials in Windows Credential Manager.',
          referenceUrl: 'https://github.com/gitleaks/gitleaks',
          category: leak.Commit ? 'git-history' : 'credentials',
          credentialType: String(leak.Description ?? leak.RuleID ?? 'secret'),
          commitHash: leak.Commit ? String(leak.Commit) : undefined
        },
        workspaceRoot
      );
    });
  }
}
