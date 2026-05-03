import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class DetectSecretsRunner extends BaseToolRunner {
  readonly toolId = 'detect-secrets';
  readonly minVersion = '1.4.0';
  protected readonly command = 'detect-secrets';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['scan', '--all-files']);
  }
}
