import { promises as fs } from 'fs';
import path from 'path';
import type { ScanReport } from '../models/ScanReport';
import type { Suppression } from '../models/Suppression';

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  filePath: string;
  summary: ScanReport['summary'];
}

interface StoredScanReport {
  report: ScanReport;
  filePath: string;
}

export class ScanHistoryStore {
  async save(report: ScanReport, retentionLimit: number, suppressions: Suppression[] = []): Promise<void> {
    const historyDir = this.historyDir(report.workspaceRoot);
    await fs.mkdir(historyDir, { recursive: true });
    const fileName = `scan-${report.timestamp.replace(/[:.]/g, '-')}-${report.id}.json`;
    await fs.writeFile(path.join(historyDir, fileName), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await this.enforceRetention(report.workspaceRoot, retentionLimit, suppressions);
  }

  async list(workspaceRoot: string): Promise<ScanHistoryEntry[]> {
    const reports = await this.loadAllWithPaths(workspaceRoot);
    return reports
      .sort((a, b) => b.report.timestamp.localeCompare(a.report.timestamp))
      .map(({ report, filePath }) => ({
        id: report.id,
        timestamp: report.timestamp,
        filePath,
        summary: report.summary
      }));
  }

  async get(workspaceRoot: string, reportId: string): Promise<ScanReport | null> {
    const reports = await this.loadAllWithPaths(workspaceRoot);
    return reports.find(({ report }) => report.id === reportId)?.report ?? null;
  }

  private async loadAllWithPaths(workspaceRoot: string): Promise<StoredScanReport[]> {
    const historyDir = this.historyDir(workspaceRoot);
    const files = await fs.readdir(historyDir).catch(() => []);
    const reports: StoredScanReport[] = [];

    for (const file of files.filter((candidate) => candidate.endsWith('.json'))) {
      const filePath = path.join(historyDir, file);
      try {
        reports.push({ filePath, report: JSON.parse(await fs.readFile(filePath, 'utf8')) as ScanReport });
      } catch {
        // Ignore malformed history entries; audit logging of config/report corruption is handled elsewhere.
      }
    }

    return reports;
  }

  private async enforceRetention(workspaceRoot: string, retentionLimit: number, suppressions: Suppression[]): Promise<void> {
    const historyDir = this.historyDir(workspaceRoot);
    const files = await fs.readdir(historyDir).catch(() => []);
    const reports = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(historyDir, file);
          const report = JSON.parse(await fs.readFile(filePath, 'utf8')) as ScanReport;
          return { filePath, report };
        })
    );

    const sorted = reports.sort((a, b) => a.report.timestamp.localeCompare(b.report.timestamp));
    while (sorted.length > retentionLimit) {
      const candidateIndex = sorted.findIndex(({ report }) => !this.isProtected(report, suppressions));
      if (candidateIndex < 0) {
        return;
      }
      const [candidate] = sorted.splice(candidateIndex, 1);
      await fs.unlink(candidate.filePath);
    }
  }

  private isProtected(report: ScanReport, suppressions: Suppression[]): boolean {
    if (report.findings.some((finding) => finding.severity === 'Critical')) {
      return true;
    }

    return report.findings.some((finding) =>
      suppressions.some((suppression) => suppression.ruleId === finding.ruleId && suppression.filePath === finding.filePath)
    );
  }

  private historyDir(workspaceRoot: string): string {
    return path.resolve(workspaceRoot, '.kiro/security/scan-history');
  }
}
