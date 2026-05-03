import * as vscode from 'vscode';

export class StatusBarReporter {
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

  constructor() {
    this.item.text = 'Scanner: idle';
    this.item.show();
  }

  setPhase(phase: string, elapsed: number): void {
    this.item.text = `Scanner: ${phase} ${Math.round(elapsed / 1000)}s`;
  }

  setComplete(summary: string): void {
    this.item.text = `Scanner: ${summary}`;
  }

  setError(message: string): void {
    this.item.text = `Scanner error: ${message}`;
  }

  dispose(): void {
    this.item.dispose();
  }
}
