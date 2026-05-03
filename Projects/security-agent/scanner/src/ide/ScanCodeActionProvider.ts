import * as vscode from 'vscode';

export class ScanCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter((diagnostic) => diagnostic.source === 'Agent Security Scanner' && diagnostic.code)
      .map((diagnostic) => {
        const action = new vscode.CodeAction('Suppress Agent Security Scanner finding', vscode.CodeActionKind.QuickFix);
        action.command = {
          command: 'agentSecurityScanner.suppressFinding',
          title: 'Suppress Agent Security Scanner finding',
          arguments: [diagnostic]
        };
        return action;
      });
  }
}
