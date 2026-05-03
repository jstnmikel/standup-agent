import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class GitleaksRunner extends BaseToolRunner {
  readonly toolId = 'gitleaks';
  readonly minVersion = '8.18.0';
  protected readonly command = 'gitleaks';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    const args = ['detect', '--report-format', 'json', '--redact'];
    if (ctx.scanType !== 'history') {
      args.push('--no-git');
    }
    if (ctx.scanType === 'pre-commit' && ctx.stagedFiles?.length) {
      args.push('--source', '.');
    }
    return this.runCommand(ctx, args);
  }
}
