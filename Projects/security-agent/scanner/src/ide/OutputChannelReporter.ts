import * as vscode from 'vscode';
import type { ScanReport } from '../models/ScanReport';

export class OutputChannelReporter {
  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  showReport(report: ScanReport): void {
    this.outputChannel.show();
    this.outputChannel.appendLine(`Scan ${report.id} completed in ${report.elapsedMs}ms`);
    this.outputChannel.appendLine(
      `Findings: ${report.summary.total} total, ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low, ${report.summary.informational} informational`
    );

    for (const finding of report.findings) {
      this.outputChannel.appendLine(
        `[${finding.severity}] ${finding.filePath}:${finding.lineNumber} ${finding.title} (${finding.standardIdentifier})`
      );
    }

    for (const warning of report.warnings) {
      this.outputChannel.appendLine(`[WARN] ${warning.toolId ? `${warning.toolId}: ` : ''}${warning.message}`);
    }
  }
}
