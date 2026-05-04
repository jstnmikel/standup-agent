import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Discovers Python Scripts directories and other common tool install locations
 * on Windows and returns an augmented PATH environment that includes them.
 *
 * This is needed because packaged executables (scanner.exe) may not inherit
 * the full interactive shell PATH, causing Python-installed tools like semgrep,
 * pip-audit, and detect-secrets to be unfindable at runtime.
 */
export class PathAugmenter {
  private static cachedEnv: NodeJS.ProcessEnv | null = null;

  /**
   * Returns a process env object with PATH augmented to include all known
   * tool install locations. Result is cached after first call.
   */
  static async getAugmentedEnv(): Promise<NodeJS.ProcessEnv> {
    if (this.cachedEnv) {
      return this.cachedEnv;
    }

    const extraPaths = new Set<string>();

    // Add common Windows tool directories
    for (const dir of this.commonToolDirectories()) {
      if (dir && existsSync(dir)) {
        extraPaths.add(dir);
      }
    }

    // Discover Python user base Scripts directory
    const userBase = await this.getPythonUserBase();
    if (userBase) {
      const scriptsDir = path.join(userBase, 'Scripts');
      if (existsSync(scriptsDir)) {
        extraPaths.add(scriptsDir);
      }
      // Also check versioned subdirectories
      for (const versioned of this.pythonVersionedScriptsDirs(userBase)) {
        if (existsSync(versioned)) {
          extraPaths.add(versioned);
        }
      }
    }

    // Scan WinGet packages directory for known tool executables
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
      if (existsSync(packagesDir)) {
        for (const toolExe of ['semgrep.exe', 'gitleaks.exe', 'trivy.exe', 'pip-audit.exe', 'detect-secrets.exe']) {
          for (const dir of this.findInPackagesDir(packagesDir, toolExe)) {
            extraPaths.add(dir);
          }
        }
      }
    }

    const existingPath = process.env.PATH ?? process.env.Path ?? '';
    const augmentedPath = [...extraPaths, existingPath].filter(Boolean).join(';');

    this.cachedEnv = {
      ...process.env,
      PATH: augmentedPath,
      Path: augmentedPath
    };

    return this.cachedEnv;
  }

  /**
   * Clears the cached env — useful for testing or after tool installation.
   */
  static clearCache(): void {
    this.cachedEnv = null;
  }

  private static commonToolDirectories(): string[] {
    const localAppData = process.env.LOCALAPPDATA;
    const appData = process.env.APPDATA;
    const programFiles = process.env.ProgramFiles;
    const programFilesX86 = process.env['ProgramFiles(x86)'];

    return [
      localAppData ? path.join(localAppData, 'Microsoft', 'WinGet', 'Links') : '',
      localAppData ? path.join(localAppData, 'Microsoft', 'WindowsApps') : '',
      localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python312', 'Scripts') : '',
      localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311', 'Scripts') : '',
      localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Python314', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Python313', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Python312', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Python311', 'Scripts') : '',
      appData ? path.join(appData, 'Python', 'Python310', 'Scripts') : '',
      programFiles ? path.join(programFiles, 'nodejs') : '',
      programFilesX86 ? path.join(programFilesX86, 'nodejs') : '',
      programFiles ? path.join(programFiles, 'Gitleaks') : '',
      programFiles ? path.join(programFiles, 'Trivy') : ''
    ].filter(Boolean);
  }

  private static pythonVersionedScriptsDirs(userBase: string): string[] {
    const versions = ['Python314', 'Python313', 'Python312', 'Python311', 'Python310', 'Python39'];
    return versions.map((v) => path.join(userBase, v, 'Scripts'));
  }

  private static findInPackagesDir(packagesDir: string, exeName: string): string[] {
    try {
      return readdirSync(packagesDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(packagesDir, e.name))
        .filter((dir) => existsSync(path.join(dir, exeName)));
    } catch {
      return [];
    }
  }

  private static getPythonUserBase(): Promise<string | null> {
    return new Promise((resolve) => {
      const commands = ['python', 'py'];
      let index = 0;

      const tryNext = (): void => {
        if (index >= commands.length) {
          resolve(null);
          return;
        }
        const cmd = commands[index++];
        const child = spawn(cmd, ['-m', 'site', '--user-base'], {
          windowsHide: true,
          shell: false,
          env: process.env
        });
        let stdout = '';
        child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
        child.on('error', () => tryNext());
        child.on('close', (code) => {
          if (code === 0) {
            const output = stdout.trim().split(/\r?\n/).at(-1)?.trim();
            if (output) {
              resolve(output);
              return;
            }
          }
          tryNext();
        });
      };

      tryNext();
    });
  }
}
