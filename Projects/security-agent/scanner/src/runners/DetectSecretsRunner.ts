import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

/**
 * Single regex passed to detect-secrets --exclude-files.
 * detect-secrets only accepts one --exclude-files argument, so all
 * exclusion patterns must be combined with | into a single regex.
 *
 * Excluded:
 * - .kiro/security  — scanner's own log/report output files
 * - .kiro/specs     — documentation and spec files (not source code)
 * - node_modules    — third-party packages
 * - scanner/dist    — compiled output
 * - /dist/          — any dist directory
 * - .git/           — git internals
 * - __tests__       — test fixture secrets are intentionally fake
 */
const EXCLUDE_FILES_REGEX = '\\.kiro[\\\\/]security|\\.kiro[\\\\/]specs|node_modules|scanner[\\\\/]dist|[\\\\/]dist[\\\\/]|\\.git[\\\\/]|__tests__';

export class DetectSecretsRunner extends BaseToolRunner {
  readonly toolId = 'detect-secrets';
  readonly minVersion = '1.4.0';
  protected readonly command = 'detect-secrets';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    return this.runCommand(ctx, ['scan', '--all-files', '--exclude-files', EXCLUDE_FILES_REGEX]);
  }
}
