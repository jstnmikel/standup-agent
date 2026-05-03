import { promises as fs } from 'fs';
import path from 'path';

export class PreCommitHookInstaller {
  async install(repoRoot: string): Promise<string> {
    const gitDir = path.resolve(repoRoot, '.git');
    const hooksDir = path.join(gitDir, 'hooks');
    const hookPath = path.join(hooksDir, 'pre-commit');
    const hook = [
      '#!/usr/bin/env pwsh',
      '$stagedFiles = git diff --cached --name-only',
      'scanner scan --pre-commit --staged-files $stagedFiles',
      'exit $LASTEXITCODE',
      ''
    ].join('\n');

    await fs.mkdir(hooksDir, { recursive: true });
    await fs.writeFile(hookPath, hook, 'utf8');
    return hookPath;
  }
}
