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

const SEVERITY_EMOJI: Record<string, string> = {
  Critical: '🔴',
  High: '🟠',
  Medium: '🟡',
  Low: '🔵',
  Informational: 'ℹ️'
};

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

    // Write machine-readable JSON (for tooling and CI integration)
    await fs.writeFile(
      path.join(securityDir, 'last-scan-report.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );

    // Write human-readable Markdown report
    await fs.writeFile(
      path.join(securityDir, 'last-scan-report.md'),
      this.toMarkdown(report),
      'utf8'
    );
  }

  toMarkdown(report: ScanReport): string {
    const lines: string[] = [];
    const ts = new Date(report.timestamp).toLocaleString();
    const elapsed = (report.elapsedMs / 1000).toFixed(1);

    lines.push('# Agent Security Scanner Report');
    lines.push('');
    lines.push(`**Scan ID:** ${report.id}  `);
    lines.push(`**Date:** ${ts}  `);
    lines.push(`**Type:** ${report.scanType}  `);
    lines.push(`**Scanner Version:** ${report.scannerVersion}  `);
    lines.push(`**Duration:** ${elapsed}s  `);
    lines.push('');

    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('|---|---|');
    lines.push(`| 🔴 Critical | ${report.summary.critical} |`);
    lines.push(`| 🟠 High | ${report.summary.high} |`);
    lines.push(`| 🟡 Medium | ${report.summary.medium} |`);
    lines.push(`| 🔵 Low | ${report.summary.low} |`);
    lines.push(`| ℹ️ Informational | ${report.summary.informational} |`);
    lines.push(`| **Total** | **${report.summary.total}** |`);
    lines.push('');

    // Trend
    if (report.trend) {
      const t = report.trend;
      lines.push('## Trend vs Previous Scan');
      lines.push('');
      const fmt = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
      lines.push(`Critical: ${fmt(t.criticalDelta)} | High: ${fmt(t.highDelta)} | Medium: ${fmt(t.mediumDelta)} | Low: ${fmt(t.lowDelta)} | Info: ${fmt(t.informationalDelta)}`);
      lines.push('');
    }

    // Warnings
    if (report.warnings && report.warnings.length > 0) {
      lines.push('## Tool Warnings');
      lines.push('');
      for (const w of report.warnings) {
        lines.push(`- ⚠️ **${w.toolId}**: ${w.message}`);
      }
      lines.push('');
    }

    // Findings grouped by severity
    if (report.findings.length === 0) {
      lines.push('## ✅ No Findings');
      lines.push('');
      lines.push('No security issues were detected in this scan.');
      lines.push('');
    } else {
      const bySeverity: Record<string, Finding[]> = {
        Critical: [],
        High: [],
        Medium: [],
        Low: [],
        Informational: []
      };
      for (const f of report.findings) {
        bySeverity[f.severity]?.push(f);
      }

      for (const severity of ['Critical', 'High', 'Medium', 'Low', 'Informational']) {
        const group = bySeverity[severity];
        if (!group || group.length === 0) continue;

        const emoji = SEVERITY_EMOJI[severity] ?? '';
        lines.push(`## ${emoji} ${severity} (${group.length})`);
        lines.push('');

        for (const finding of group) {
          lines.push(`### ${finding.title}`);
          lines.push('');
          lines.push(`| Field | Value |`);
          lines.push(`|---|---|`);
          lines.push(`| **File** | \`${finding.filePath}:${finding.lineNumber}\` |`);
          lines.push(`| **Standard** | ${finding.standardIdentifier} |`);
          lines.push(`| **Tool** | ${finding.toolId} |`);
          if (finding.credentialType) {
            lines.push(`| **Credential Type** | ${finding.credentialType} |`);
          }
          lines.push('');
          lines.push(`**Description:** ${finding.description}`);
          lines.push('');
          lines.push(`**Remediation:** ${finding.remediationGuidance}`);
          lines.push('');
          if (finding.referenceUrl) {
            lines.push(`**Reference:** [${finding.standardIdentifier}](${finding.referenceUrl})`);
            lines.push('');
          }
          lines.push('---');
          lines.push('');
        }
      }
    }

    // Suppressed findings
    if (report.suppressedFindings && report.suppressedFindings.length > 0) {
      lines.push('## Suppressed Findings');
      lines.push('');
      lines.push(`${report.suppressedFindings.length} finding(s) were suppressed by developer or admin policy.`);
      lines.push('');
    }

    return lines.join('\n');
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
