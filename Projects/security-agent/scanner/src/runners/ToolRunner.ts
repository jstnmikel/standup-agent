import type { ScanContext } from '../orchestrator/ScanContext';

export interface RawToolOutput {
  toolId: string;
  exitCode: number;
  rawJson: unknown;
  stderr: string;
  elapsedMs: number;
}

export interface ToolRunner {
  readonly toolId: string;
  readonly minVersion: string;
  isAvailable(): Promise<boolean>;
  getVersion(): Promise<string>;
  run(ctx: ScanContext): Promise<RawToolOutput>;
}
