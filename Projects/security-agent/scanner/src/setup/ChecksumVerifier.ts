import crypto from 'crypto';
import { promises as fs } from 'fs';

export class ChecksumMismatchError extends Error {
  constructor(
    readonly filePath: string,
    readonly expected: string,
    readonly actual: string
  ) {
    super(`Checksum mismatch for ${filePath}: expected ${expected}, got ${actual}`);
  }
}

export class ChecksumVerifier {
  async sha256(filePath: string): Promise<string> {
    return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
  }

  async verifySha256(filePath: string, expectedSha256: string): Promise<void> {
    const actual = await this.sha256(filePath);
    if (actual.toLowerCase() !== expectedSha256.toLowerCase()) {
      throw new ChecksumMismatchError(filePath, expectedSha256, actual);
    }
  }
}
