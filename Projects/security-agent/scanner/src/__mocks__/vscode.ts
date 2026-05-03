/**
 * Mock for the 'vscode' module used in unit/integration tests.
 * The real vscode module is only available inside the VS Code extension host.
 */

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3
}

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
}

export class Range {
  constructor(
    public readonly start: Position,
    public readonly end: Position
  ) {}
}

export class Diagnostic {
  public source?: string;
  public code?: string | number;
  public relatedInformation?: DiagnosticRelatedInformation[];
  public tags?: DiagnosticTag[];

  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly severity: DiagnosticSeverity = DiagnosticSeverity.Error
  ) {}
}

export interface DiagnosticRelatedInformation {
  location: { uri: Uri; range: Range };
  message: string;
}

export enum DiagnosticTag {
  Unnecessary = 1,
  Deprecated = 2
}

export class Uri {
  static file(path: string): Uri {
    return new Uri('file', '', path, '', '');
  }
  static parse(value: string): Uri {
    return new Uri('', '', value, '', '');
  }
  constructor(
    public readonly scheme: string,
    public readonly authority: string,
    public readonly path: string,
    public readonly query: string,
    public readonly fragment: string
  ) {}
  toString(): string { return this.path; }
  get fsPath(): string { return this.path; }
}

export class DiagnosticCollection {
  private _map = new Map<string, Diagnostic[]>();

  set(uri: Uri, diagnostics: Diagnostic[] | undefined): void {
    if (diagnostics === undefined) {
      this._map.delete(uri.toString());
    } else {
      this._map.set(uri.toString(), diagnostics);
    }
  }

  get(uri: Uri): Diagnostic[] | undefined {
    return this._map.get(uri.toString());
  }

  clear(): void {
    this._map.clear();
  }

  delete(uri: Uri): void {
    this._map.delete(uri.toString());
  }

  forEach(callback: (uri: Uri, diagnostics: Diagnostic[], collection: DiagnosticCollection) => void): void {
    this._map.forEach((diags, uriStr) => {
      callback(Uri.parse(uriStr), diags, this);
    });
  }

  dispose(): void {
    this._map.clear();
  }
}

export class StatusBarItem {
  text = '';
  tooltip = '';
  show(): void {}
  hide(): void {}
  dispose(): void {}
}

export class OutputChannel {
  private _lines: string[] = [];
  appendLine(value: string): void { this._lines.push(value); }
  append(value: string): void { this._lines.push(value); }
  clear(): void { this._lines = []; }
  show(): void {}
  hide(): void {}
  dispose(): void {}
  get lines(): string[] { return [...this._lines]; }
}

export enum CodeActionKind {
  QuickFix = 'quickfix',
  Refactor = 'refactor',
  Source = 'source'
}

export class CodeAction {
  constructor(
    public readonly title: string,
    public readonly kind?: CodeActionKind
  ) {}
  public command?: { command: string; title: string; arguments?: unknown[] };
}

export const languages = {
  createDiagnosticCollection: (_name: string): DiagnosticCollection => new DiagnosticCollection()
};

export const window = {
  createStatusBarItem: (): StatusBarItem => new StatusBarItem(),
  createOutputChannel: (_name: string): OutputChannel => new OutputChannel(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn()
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn()
};

export const workspace = {
  workspaceFolders: undefined as { uri: Uri; name: string; index: number }[] | undefined,
  getConfiguration: jest.fn().mockReturnValue({
    get: jest.fn(),
    update: jest.fn()
  })
};

export const extensions = {
  getExtension: jest.fn()
};

export enum StatusBarAlignment {
  Left = 1,
  Right = 2
}
