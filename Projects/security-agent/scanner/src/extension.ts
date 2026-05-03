import path from 'path';
import * as vscode from 'vscode';
import { DiagnosticPublisher } from './ide/DiagnosticPublisher';
import { OutputChannelReporter } from './ide/OutputChannelReporter';
import { ScanCodeActionProvider } from './ide/ScanCodeActionProvider';
import { StatusBarReporter } from './ide/StatusBarReporter';
import { AuditLogger } from './logging/AuditLogger';
import { ScanOrchestrator } from './orchestrator/ScanOrchestrator';
import { SuppressionManager } from './filter/SuppressionManager';

let outputChannel: vscode.OutputChannel;
let diagnostics: DiagnosticPublisher;
let statusBar: StatusBarReporter;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('Agent Security Scanner');
  diagnostics = new DiagnosticPublisher();
  statusBar = new StatusBarReporter();

  context.subscriptions.push(outputChannel, { dispose: () => diagnostics.dispose() }, { dispose: () => statusBar.dispose() });
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, new ScanCodeActionProvider()));
  outputChannel.appendLine('Agent Security Scanner activated.');

  context.subscriptions.push(
    vscode.commands.registerCommand('agentSecurityScanner.runScan', async () => runIdeScan('manual')),
    vscode.commands.registerCommand('agentSecurityScanner.runHistoryScan', async () => runIdeScan('history')),
    vscode.commands.registerCommand('agentSecurityScanner.updateRules', async () => {
      outputChannel.show();
      outputChannel.appendLine('Rule updates are not yet implemented; current local rules remain active.');
    }),
    vscode.commands.registerCommand('agentSecurityScanner.viewAuditLog', async () => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        return;
      }
      outputChannel.show();
      const events = await new AuditLogger(path.resolve(workspaceRoot, '.kiro/security/audit.log')).read();
      events.slice(-50).forEach((event) => outputChannel.appendLine(JSON.stringify(event)));
    }),
    vscode.commands.registerCommand('agentSecurityScanner.onboarding', async () => {
      outputChannel.show();
      outputChannel.appendLine('Run Agent Security Scanner: Run Scan to create the first local report and audit log.');
    }),
    vscode.commands.registerCommand('agentSecurityScanner.selfUpdate', async () => {
      outputChannel.show();
      outputChannel.appendLine('Self-update is not yet implemented; install newer extension builds through your normal deployment channel.');
    }),
    vscode.commands.registerCommand('agentSecurityScanner.suppressFinding', async (diagnostic: vscode.Diagnostic) => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot || typeof diagnostic.code !== 'string') {
        return;
      }
      const code = JSON.parse(diagnostic.code) as { id: string; ruleId: string; filePath: string };
      const justification = await vscode.window.showInputBox?.({
        prompt: 'Justification for suppressing this finding',
        ignoreFocusOut: true
      });
      if (!justification?.trim()) {
        void vscode.window.showWarningMessage('Suppression requires a justification.');
        return;
      }
      await new SuppressionManager().add(workspaceRoot, {
        ruleId: code.ruleId,
        filePath: code.filePath,
        justification
      });
      diagnostics.removeFinding(code.id);
      outputChannel.appendLine(`Suppressed finding ${code.id}`);
    })
  );
}

export function deactivate(): void {
  outputChannel?.dispose();
  diagnostics?.dispose();
  statusBar?.dispose();
}

async function runIdeScan(scanType: 'manual' | 'history'): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const startedAt = Date.now();
  outputChannel.show();
  outputChannel.appendLine(`Starting ${scanType} scan...`);
  statusBar.setPhase('running', 0);

  try {
    const report = await new ScanOrchestrator().runScan({ workspaceRoot, scanType, debug: false });
    diagnostics.publish(report.findings, workspaceRoot);
    new OutputChannelReporter(outputChannel).showReport(report);
    statusBar.setComplete(`${report.summary.total} findings`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    statusBar.setError(message);
    outputChannel.appendLine(`Scan failed after ${Date.now() - startedAt}ms: ${message}`);
    void vscode.window.showErrorMessage(`Agent Security Scanner failed: ${message}`);
  }
}

function getWorkspaceRoot(): string | null {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('Open a workspace before running Agent Security Scanner.');
    return null;
  }
  return folder.uri.fsPath;
}
