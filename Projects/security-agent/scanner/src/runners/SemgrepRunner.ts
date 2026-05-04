import { existsSync } from 'fs';
import path from 'path';
import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

/** Paths to exclude from Semgrep scanning */
const EXCLUDED_PATHS = [
  '.kiro/security',
  'node_modules',
  'scanner/dist',
  'dist'
];

export class SemgrepRunner extends BaseToolRunner {
  readonly toolId = 'semgrep';
  readonly minVersion = '1.50.0';
  protected readonly command = 'semgrep';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    const targets = ctx.scanType === 'pre-commit' && ctx.stagedFiles?.length ? ctx.stagedFiles : ['.'];
    const args = ['--json', '--config', 'auto'];
    for (const excluded of EXCLUDED_PATHS) {
      args.push('--exclude', excluded);
    }
    const customRules = path.resolve(ctx.workspaceRoot, '.kiro/security/custom-rules/agent-security-scanner.yml');
    if (existsSync(customRules)) {
      args.push('--config', customRules);
    }
    return this.runCommand(ctx, [...args, ...targets]);
  }
}
