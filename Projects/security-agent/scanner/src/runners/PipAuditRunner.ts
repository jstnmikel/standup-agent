import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class PipAuditRunner extends BaseToolRunner {
  readonly toolId = 'pip-audit';
  readonly minVersion = '2.6.0';
  protected readonly command = 'pip-audit';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['--format', 'json']);
  }
}
