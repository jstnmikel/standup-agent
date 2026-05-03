import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';
import type { FindingNormalizer } from './FindingNormalizer';
import { asArray, asRecord, finding } from './normalizerUtils';

export class DetectSecretsNormalizer implements FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[] {
    const root = asRecord(raw.rawJson);
    const results = asRecord(root.results);
    return Object.entries(results).flatMap(([filePath, entries]) =>
      asArray(entries).map((entryValue) => {
        const entry = asRecord(entryValue);
        return finding(
          {
            toolId: 'detect-secrets',
            ruleId: String(entry.type ?? 'detect-secrets-secret'),
            severity: 'Critical',
            title: 'Secret detected by detect-secrets',
            filePath,
            lineNumber: Number(entry.line_number ?? 1),
            standardIdentifier: 'CWE-798',
            description: 'A hardcoded credential or high-entropy secret was detected.',
            remediationGuidance: 'Remove the secret, rotate it, and store future credentials in Windows Credential Manager.',
            referenceUrl: 'https://github.com/Yelp/detect-secrets',
            category: 'credentials',
            credentialType: String(entry.type ?? 'secret')
          },
          workspaceRoot
        );
      })
    );
  }
}
