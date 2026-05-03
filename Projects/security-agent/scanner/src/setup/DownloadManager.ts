import { createWriteStream, promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { ChecksumVerifier } from './ChecksumVerifier';

export interface DownloadOptions {
  url: string;
  destinationPath: string;
  expectedSha256: string;
}

export class DownloadManager {
  constructor(private readonly checksumVerifier = new ChecksumVerifier()) {}

  async downloadAndVerify(options: DownloadOptions): Promise<void> {
    await fs.mkdir(path.dirname(options.destinationPath), { recursive: true });
    const tempPath = `${options.destinationPath}.download`;

    try {
      await this.download(options.url, tempPath);
      await this.checksumVerifier.verifySha256(tempPath, options.expectedSha256);
      await fs.rename(tempPath, options.destinationPath);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }
  }

  private async download(url: string, destinationPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          void this.download(response.headers.location, destinationPath).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with HTTP ${response.statusCode}`));
          return;
        }

        const file = createWriteStream(destinationPath);
        response.pipe(file);
        file.on('finish', () => file.close((error) => (error ? reject(error) : resolve())));
        file.on('error', reject);
      });
      request.on('error', reject);
    });
  }
}
