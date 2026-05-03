import { promises as fs } from 'fs';
import path from 'path';
import { CredentialRedactor } from './CredentialRedactor';

export type DebugLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type DebugLogCategory =
  | 'tool_invocation'
  | 'tool_output'
  | 'rule_loading'
  | 'file_enumeration'
  | 'finding_pipeline'
  | 'performance'
  | 'internal_error'
  | 'policy_resolution';

export interface DebugEntry {
  timestamp?: string;
  level: DebugLogLevel;
  category: DebugLogCategory;
  message: string;
  [key: string]: unknown;
}

export class DebugLogger {
  private readonly maxBytes = 50 * 1024 * 1024;

  constructor(
    private readonly logPath: string,
    private readonly enabled: boolean,
    private readonly redactor = CredentialRedactor.instance
  ) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  async log(entry: DebugEntry): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await this.rotateIfNeeded();

    const baseEntry = {
      timestamp: entry.timestamp ?? new Date().toISOString(),
      ...entry
    };
    const redacted = this.redactor.redactObjectWithCount(baseEntry);
    const line = JSON.stringify({
      ...redacted.value,
      ...(redacted.redactionsApplied > 0 ? { redactions_applied: redacted.redactionsApplied } : {})
    });

    await fs.appendFile(this.logPath, `${line}\n`, 'utf8');
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const stat = await fs.stat(this.logPath);
      if (stat.size < this.maxBytes) {
        return;
      }

      const rotatedPath = this.logPath.replace(/\.log$/i, `-${this.timestampForFile()}.log`);
      await this.deleteExistingRotations();
      await fs.rename(this.logPath, rotatedPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async deleteExistingRotations(): Promise<void> {
    const dir = path.dirname(this.logPath);
    const basename = path.basename(this.logPath, '.log');
    const files = await fs.readdir(dir).catch(() => []);

    await Promise.all(
      files
        .filter((file) => file.startsWith(`${basename}-`) && file.endsWith('.log'))
        .map((file) => fs.unlink(path.join(dir, file)))
    );
  }

  private timestampForFile(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}
