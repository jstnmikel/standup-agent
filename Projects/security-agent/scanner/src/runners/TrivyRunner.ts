import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class TrivyRunner extends BaseToolRunner {
  readonly toolId = 'trivy';
  readonly minVersion = '0.50.0';
  protected readonly command = 'trivy';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['fs', '--format', 'json', '.']);
  }
}
