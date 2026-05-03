import path from 'path';
import * as vscode from 'vscode';
import type { Finding, Severity } from '../models/Finding';

export class DiagnosticPublisher {
  private readonly collection = vscode.languages.createDiagnosticCollection('agent-security-scanner');

  publish(findings: Finding[], workspaceRoot: string): void {
    this.clear();
    const byFile = new Map<string, vscode.Diagnostic[]>();

    for (const finding of findings) {
      const absolutePath = path.resolve(workspaceRoot, finding.filePath);
      const line = Math.max(finding.lineNumber - 1, 0);
      const col = Math.max((finding.columnNumber ?? 1) - 1, 0);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(line, col, line, col + 20),
        `${finding.title} (${finding.standardIdentifier}): ${finding.remediationGuidance}`,
        this.toDiagnosticSeverity(finding.severity)
      );
      diagnostic.code = JSON.stringify({ id: finding.id, ruleId: finding.ruleId, filePath: finding.filePath });
      diagnostic.source = 'Agent Security Scanner';
      byFile.set(absolutePath, [...(byFile.get(absolutePath) ?? []), diagnostic]);
    }

    for (const [filePath, diagnostics] of byFile.entries()) {
      this.collection.set(vscode.Uri.file(filePath), diagnostics);
    }
  }

  clear(): void {
    this.collection.clear();
  }

  removeFinding(findingId: string): void {
    this.collection.forEach((uri, diagnostics) => {
      const remaining = diagnostics.filter((diagnostic) => !this.codeMatchesFinding(diagnostic.code, findingId));
      this.collection.set(uri, remaining.length ? remaining : undefined);
    });
  }

  private codeMatchesFinding(code: vscode.Diagnostic['code'], findingId: string): boolean {
    if (typeof code !== 'string') {
      return false;
    }
    try {
      return (JSON.parse(code) as { id?: string }).id === findingId;
    } catch {
      return code === findingId;
    }
  }

  dispose(): void {
    this.collection.dispose();
  }

  private toDiagnosticSeverity(severity: Severity): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'Critical':
      case 'High':
        return vscode.DiagnosticSeverity.Error;
      case 'Medium':
        return vscode.DiagnosticSeverity.Warning;
      case 'Low':
      case 'Informational':
        return vscode.DiagnosticSeverity.Information;
    }
  }
}
