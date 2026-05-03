import type { AdminPolicy } from '../models/AdminPolicy';
import type { Finding } from '../models/Finding';
import type { SuppressedFinding, Suppression } from '../models/Suppression';

export interface FilterResult {
  active: Finding[];
  suppressed: SuppressedFinding[];
  invalidatedSuppressions: Suppression[];
}

export class FindingFilter {
  apply(findings: Finding[], suppressions: Suppression[], policy: AdminPolicy | null): FilterResult {
    const policySuppressions = policy?.suppressionBaseline ?? [];
    const localSuppressions = policy?.allowLocalSuppressions === false ? [] : suppressions;
    const effectiveSuppressions = [...policySuppressions, ...localSuppressions];
    const suppressed: SuppressedFinding[] = [];
    const active: Finding[] = [];

    for (const finding of findings) {
      const suppression = effectiveSuppressions.find(
        (candidate) => candidate.ruleId === finding.ruleId && candidate.filePath === finding.filePath
      );

      if (suppression) {
        suppressed.push({ finding, suppression });
      } else {
        active.push(finding);
      }
    }

    return {
      active,
      suppressed,
      invalidatedSuppressions: policy?.allowLocalSuppressions === false ? suppressions : []
    };
  }
}
