import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { Finding } from '../models/Finding';
import type { FindingSummary, ScanReport, ScanWarning, TrendDelta } from '../models/ScanReport';
import type { RuleManifest } from '../models/RuleManifest';
import type { FilterResult } from '../filter/FindingFilter';

export interface BuildReportOptions {
  scanType: ScanReport['scanType'];
  workspaceRoot: string;
  scannerVersion: string;
  elapsedMs: number;
  staleRulesets?: string[];
  warnings?: ScanWarning[];
}

export class ReportBuilder {
  build(filtered: FilterResult, manifest: RuleManifest, history: ScanReport | null, options: BuildReportOptions): ScanReport {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      scanType: options.scanType,
      workspaceRoot: options.workspaceRoot,
      scannerVersion: options.scannerVersion,
      ruleManifest: manifest,
      elapsedMs: options.elapsedMs,
      summary: this.summarize(filtered.active),
      findings: filtered.active,
      suppressedFindings: filtered.suppressed,
      trend: history ? this.computeTrend(filtered.active, history) : undefined,
      staleRulesets: options.staleRulesets ?? [],
      warnings: options.warnings ?? []
    };
  }

  async persist(report: ScanReport, workspaceRoot: string): Promise<void> {
    const securityDir = path.resolve(workspaceRoot, '.kiro/security');
    await fs.mkdir(securityDir, { recursive: true });
    await fs.writeFile(path.join(securityDir, 'last-scan-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  summarize(findings: Finding[]): FindingSummary {
    const summary: FindingSummary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      total: findings.length
    };

    for (const finding of findings) {
      switch (finding.severity) {
        case 'Critical':
          summary.critical += 1;
          break;
        case 'High':
          summary.high += 1;
          break;
        case 'Medium':
          summary.medium += 1;
          break;
        case 'Low':
          summary.low += 1;
          break;
        case 'Informational':
          summary.informational += 1;
          break;
      }
    }

    return summary;
  }

  private computeTrend(findings: Finding[], history: ScanReport): TrendDelta {
    const current = this.summarize(findings);
    return {
      criticalDelta: current.critical - history.summary.critical,
      highDelta: current.high - history.summary.high,
      mediumDelta: current.medium - history.summary.medium,
      lowDelta: current.low - history.summary.low,
      informationalDelta: current.informational - history.summary.informational,
      comparedToReportId: history.id
    };
  }
}
