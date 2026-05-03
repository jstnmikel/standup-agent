import { createNormalizers } from '../normalizers';
import type { RawToolOutput } from '../runners/ToolRunner';

function raw(toolId: string, rawJson: unknown): RawToolOutput {
  return { toolId, rawJson, exitCode: 0, stderr: '', elapsedMs: 1 };
}

describe('normalizers', () => {
  it('normalizes semgrep results into canonical findings', () => {
    const findings = createNormalizers().semgrep.normalize(
      raw('semgrep', {
        results: [
          {
            check_id: 'javascript.lang.security.audit.detect-eval',
            path: 'src/app.ts',
            start: { line: 12, col: 5 },
            extra: {
              severity: 'ERROR',
              message: 'Avoid eval',
              metadata: {
                cwe: 'CWE-95',
                references: 'https://semgrep.dev/docs/'
              }
            }
          }
        ]
      }),
      'C:/repo'
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      toolId: 'semgrep',
      ruleId: 'javascript.lang.security.audit.detect-eval',
      filePath: 'src/app.ts',
      lineNumber: 12,
      standardIdentifier: 'CWE-95'
    });
  });

  it('normalizes gitleaks findings as critical credential findings', () => {
    const findings = createNormalizers().gitleaks.normalize(
      raw('gitleaks', [
        {
          RuleID: 'generic-api-key',
          File: '.env',
          StartLine: 3,
          Description: 'Generic API Key'
        }
      ]),
      'C:/repo'
    );

    expect(findings[0]).toMatchObject({
      toolId: 'gitleaks',
      severity: 'Critical',
      category: 'credentials',
      filePath: '.env',
      standardIdentifier: 'CWE-798'
    });
  });

  it('normalizes trivy vulnerabilities as dependency findings', () => {
    const findings = createNormalizers().trivy.normalize(
      raw('trivy', {
        Results: [
          {
            Target: 'package-lock.json',
            Vulnerabilities: [
              {
                VulnerabilityID: 'CVE-2026-0001',
                PkgName: 'example',
                Severity: 'HIGH',
                Description: 'Example vulnerability',
                FixedVersion: '2.0.0'
              }
            ]
          }
        ]
      }),
      'C:/repo'
    );

    expect(findings[0]).toMatchObject({
      toolId: 'trivy',
      severity: 'High',
      category: 'dependencies',
      standardIdentifier: 'CVE-2026-0001'
    });
  });
});
