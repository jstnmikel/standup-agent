import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { AuditEvent, AuditEventInput } from '../models/AuditEvent';
import { SCANNER_VERSION } from '../version';
import { CredentialRedactor } from './CredentialRedactor';

export interface VerifyResult {
  ok: boolean;
  checkedLines: number;
  firstInvalidLine?: number;
  expectedPrevHash?: string;
  actualPrevHash?: string;
}

export interface AuditLogFilter {
  eventType?: string;
  since?: string;
  until?: string;
}

export class AuditLogger {
  private readonly maxBytes = 10 * 1024 * 1024;
  private readonly rotatedRetainCount = 3;

  constructor(
    private readonly logPath: string,
    private readonly scannerVersion = SCANNER_VERSION,
    private readonly redactor = CredentialRedactor.instance
  ) {}

  async log(event: AuditEventInput): Promise<AuditEvent> {
    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await this.rotateIfNeeded();

    const prevHash = await this.getPreviousHash();
    const completeEvent: AuditEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
      event_type: event.event_type,
      scanner_version: event.scanner_version ?? this.scannerVersion,
      prev_hash: prevHash
    };
    const redactedEvent = this.redactor.redactObject<AuditEvent>(completeEvent);
    const line = JSON.stringify(redactedEvent);

    await fs.appendFile(this.logPath, `${line}\n`, 'utf8');
    return redactedEvent;
  }

  async verify(): Promise<VerifyResult> {
    const lines = await this.readLines();
    let previousHash = 'genesis';

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const parsed = JSON.parse(line) as AuditEvent;

      if (parsed.prev_hash !== previousHash) {
        return {
          ok: false,
          checkedLines: index + 1,
          firstInvalidLine: index + 1,
          expectedPrevHash: previousHash,
          actualPrevHash: parsed.prev_hash
        };
      }

      previousHash = this.sha256(line);
    }

    return { ok: true, checkedLines: lines.length };
  }

  async read(filter: AuditLogFilter = {}): Promise<AuditEvent[]> {
    const since = filter.since ? Date.parse(filter.since) : undefined;
    const until = filter.until ? Date.parse(filter.until) : undefined;

    return (await this.readLines())
      .map((line) => JSON.parse(line) as AuditEvent)
      .filter((event) => {
        const timestamp = Date.parse(event.timestamp);
        return (
          (!filter.eventType || event.event_type === filter.eventType) &&
          (since === undefined || timestamp >= since) &&
          (until === undefined || timestamp <= until)
        );
      });
  }

  async rotate(): Promise<void> {
    try {
      await fs.stat(this.logPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }

    await this.rotateCurrentLog();
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const stat = await fs.stat(this.logPath);
      if (stat.size >= this.maxBytes) {
        await this.rotateCurrentLog();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async rotateCurrentLog(): Promise<void> {
    const rotatedPath = this.logPath.replace(/\.log$/i, `-${this.timestampForFile()}.log`);
    await fs.rename(this.logPath, rotatedPath);
    await this.pruneRotations();
  }

  private async pruneRotations(): Promise<void> {
    const dir = path.dirname(this.logPath);
    const basename = path.basename(this.logPath, '.log');
    const files = await fs.readdir(dir).catch(() => []);
    const rotations = files
      .filter((file) => file.startsWith(`${basename}-`) && file.endsWith('.log'))
      .sort()
      .reverse();

    await Promise.all(
      rotations
        .slice(this.rotatedRetainCount)
        .map((file) => fs.unlink(path.join(dir, file)))
    );
  }

  private async getPreviousHash(): Promise<string> {
    const lines = await this.readLines();
    const previousLine = lines.at(-1);
    return previousLine ? this.sha256(previousLine) : 'genesis';
  }

  private async readLines(): Promise<string[]> {
    try {
      const raw = await fs.readFile(this.logPath, 'utf8');
      return raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private timestampForFile(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}
