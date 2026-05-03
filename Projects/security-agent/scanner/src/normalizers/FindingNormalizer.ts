import type { Finding } from '../models/Finding';
import type { RawToolOutput } from '../runners/ToolRunner';

export interface FindingNormalizer {
  normalize(raw: RawToolOutput, workspaceRoot: string): Finding[];
}
