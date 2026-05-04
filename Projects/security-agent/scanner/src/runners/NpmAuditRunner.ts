import { existsSync } from 'fs';
import path from 'path';
import type { ScanContext } from '../orchestrator/ScanContext';
import { BaseToolRunner } from './BaseToolRunner';
import type { RawToolOutput } from './ToolRunner';

export class NpmAuditRunner extends BaseToolRunner {
  readonly toolId = 'npm-audit';
  readonly minVersion = '8.0.0';
  protected readonly command = 'npm';

  run(ctx: ScanContext): Promise<RawToolOutput> {
    const npmCli = this.npmCliPath();
    if (npmCli) {
      return this.runCommandWith('node', [npmCli, 'audit', '--json'], ctx);
    }
    return this.runCommand(ctx, ['audit', '--json']);
  }

  async getVersion(): Promise<string> {
    const npmCli = this.npmCliPath();
    if (npmCli) {
      const result = await this.spawner.spawn('node', [npmCli, '--version'], { cwd: process.cwd(), timeoutMs: 30_000 });
      return result.exitCode === 0 ? (result.stdout || result.stderr).trim() : '';
    }
    return super.getVersion();
  }

  protected async runCommandWith(command: string, args: string[], ctx: ScanContext): Promise<RawToolOutput> {
    const result = await this.spawner.spawn(command, args, {
      cwd: ctx.workspaceRoot,
      timeoutMs: ctx.scanType === 'pre-commit' ? 25_000 : 120_000
    });

    return {
      toolId: this.toolId,
      exitCode: result.exitCode,
      rawJson: this.parseJson(result.stdout),
      stderr: result.stderr,
      elapsedMs: result.elapsedMs
    };
  }

  private npmCliPath(): string | null {
    const programFiles = process.env.ProgramFiles;
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    const candidates = [
      programFiles ? path.join(programFiles, 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js') : '',
      programFilesX86 ? path.join(programFilesX86, 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js') : ''
    ].filter(Boolean);
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }
}
