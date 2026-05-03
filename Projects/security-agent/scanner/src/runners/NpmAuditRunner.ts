import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class NpmAuditRunner extends BaseToolRunner {
  readonly toolId = 'npm-audit';
  readonly minVersion = '8.0.0';
  protected readonly command = 'npm';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['audit', '--json']);
  }
}
