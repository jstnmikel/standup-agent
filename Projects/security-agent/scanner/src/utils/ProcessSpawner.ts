import { spawn } from 'child_process';
import { DebugLogger } from '../logging/DebugLogger';

export interface SpawnResult {
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  elapsedMs: number;
  timedOut: boolean;
}

export interface SpawnOptions {
  cwd: string;
  timeoutMs: number;
  debugLogger?: DebugLogger;
}

export class ProcessSpawner {
  async spawn(command: string, args: string[], options: SpawnOptions): Promise<SpawnResult> {
    const startedAt = Date.now();

    await options.debugLogger?.log({
      level: 'DEBUG',
      category: 'tool_invocation',
      message: 'Starting scanner tool',
      command,
      args,
      cwd: options.cwd
    });

    return new Promise<SpawnResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let settled = false;
      let timedOut = false;
      const child = spawn(command, args, { cwd: options.cwd, windowsHide: true });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, options.timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });
      child.on('error', (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({
          command,
          args,
          exitCode: -1,
          stdout,
          stderr: `${stderr}${error.message}`,
          elapsedMs: Date.now() - startedAt,
          timedOut
        });
      });
      child.on('close', (exitCode) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({
          command,
          args,
          exitCode: exitCode ?? -1,
          stdout,
          stderr,
          elapsedMs: Date.now() - startedAt,
          timedOut
        });
      });
    }).then(async (result) => {
      await options.debugLogger?.log({
        level: result.exitCode === 0 ? 'INFO' : 'WARN',
        category: 'tool_output',
        message: 'Scanner tool finished',
        command,
        args,
        exitCode: result.exitCode,
        elapsedMs: result.elapsedMs,
        stdout: result.stdout.slice(0, 50 * 1024),
        stderr: result.stderr.slice(0, 50 * 1024),
        timedOut: result.timedOut
      });
      return result;
    });
  }
}
