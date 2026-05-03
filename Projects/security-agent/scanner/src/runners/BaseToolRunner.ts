import type { ScanContext } from '../orchestrator/ScanContext';
import { ProcessSpawner } from '../utils/ProcessSpawner';
import type { RawToolOutput, ToolRunner } from './ToolRunner';

export abstract class BaseToolRunner implements ToolRunner {
  protected readonly spawner = new ProcessSpawner();
  abstract readonly toolId: string;
  abstract readonly minVersion: string;
  protected abstract readonly command: string;

  async isAvailable(): Promise<boolean> {
    const version = await this.getVersion();
    return version.length > 0;
  }

  async getVersion(): Promise<string> {
    const result = await this.spawner.spawn(this.command, ['--version'], { cwd: process.cwd(), timeoutMs: 5000 });
    return result.exitCode === 0 ? (result.stdout || result.stderr).trim() : '';
  }

  protected async runCommand(ctx: ScanContext, args: string[]): Promise<RawToolOutput> {
    const result = await this.spawner.spawn(this.command, args, {
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

  protected parseJson(value: string): unknown {
    if (!value.trim()) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return { parseError: true, raw: value };
    }
  }

  abstract run(ctx: ScanContext): Promise<RawToolOutput>;
}
