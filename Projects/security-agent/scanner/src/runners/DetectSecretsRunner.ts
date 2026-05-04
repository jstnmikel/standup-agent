import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

/**
 * Single regex passed to detect-secrets --exclude-files.
 * detect-secrets only accepts one --exclude-files argument, so all
 * exclusion patterns must be combined with | into a single regex.
 */
const EXCLUDE_FILES_REGEX = '\\.kiro[\\\\/]security|node_modules|scanner[\\\\/]dist|[\\\\/]dist[\\\\/]|\\.git[\\\\/]';

export class DetectSecretsRunner extends BaseToolRunner {
  readonly toolId = 'detect-secrets';
  readonly minVersion = '1.4.0';
  protected readonly command = 'detect-secrets';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['scan', '--all-files', '--exclude-files', EXCLUDE_FILES_REGEX]);
  }
}
