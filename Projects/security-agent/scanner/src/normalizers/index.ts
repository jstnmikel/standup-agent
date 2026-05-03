import type { FindingNormalizer } from './FindingNormalizer';
import { DetectSecretsNormalizer } from './DetectSecretsNormalizer';
import { GitleaksNormalizer } from './GitleaksNormalizer';
import { NpmAuditNormalizer } from './NpmAuditNormalizer';
import { PipAuditNormalizer } from './PipAuditNormalizer';
import { SemgrepNormalizer } from './SemgrepNormalizer';
import { TrivyNormalizer } from './TrivyNormalizer';

export function createNormalizers(): Record<string, FindingNormalizer> {
  return {
    semgrep: new SemgrepNormalizer(),
    gitleaks: new GitleaksNormalizer(),
    trivy: new TrivyNormalizer(),
    'npm-audit': new NpmAuditNormalizer(),
    'pip-audit': new PipAuditNormalizer(),
    'detect-secrets': new DetectSecretsNormalizer()
  };
}

export * from './FindingNormalizer';
