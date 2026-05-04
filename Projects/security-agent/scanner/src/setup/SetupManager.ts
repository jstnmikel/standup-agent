import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { ProcessSpawner } from '../utils/ProcessSpawner';
import { satisfiesMinimumVersion } from '../utils/version';
import { PreCommitHookInstaller } from './PreCommitHookInstaller';

export interface ToolCheckResult {
  toolId: string;
  available: boolean;
  version: string;
  minVersion: string;
  installStatus: 'already-present' | 'installed' | 'failed' | 'skipped';
  installMessage?: string;
  meetsMinimumVersion: boolean;
}

export interface SetupOptions {
  workspace: string;
  installHook?: boolean;
  installMissing?: boolean;
}

export interface SetupResult {
  tools: ToolCheckResult[];
  hookPath?: string;
}

interface InstallStep {
  command: string;
  args: string[];
  description: string;
}

interface ToolSpec {
  toolId: string;
  command: string;
  fallbackCommands: string[];
  versionArgs: string[];
  minVersion: string;
  installSteps: InstallStep[];
}

const TOOL_COMMANDS: ToolSpec[] = [
  {
    toolId: 'semgrep',
    command: 'semgrep',
    fallbackCommands: ['semgrep.exe'],
    versionArgs: ['--version'],
    minVersion: '1.50.0',
    installSteps: [
      { command: 'python', args: ['-m', 'pip', 'install', '--user', 'semgrep'], description: 'python -m pip install --user semgrep' },
      { command: 'py', args: ['-m', 'pip', 'install', '--user', 'semgrep'], description: 'py -m pip install --user semgrep' }
    ]
  },
  {
    toolId: 'gitleaks',
    command: 'gitleaks',
    fallbackCommands: ['gitleaks.exe'],
    versionArgs: ['version'],
    minVersion: '8.18.0',
    installSteps: [
      {
        command: 'winget',
        args: ['install', '--exact', '--id', 'Gitleaks.Gitleaks', '--accept-package-agreements', '--accept-source-agreements'],
        description: 'winget install --id Gitleaks.Gitleaks'
      }
    ]
  },
  {
    toolId: 'trivy',
    command: 'trivy',
    fallbackCommands: ['trivy.exe'],
    versionArgs: ['--version'],
    minVersion: '0.50.0',
    installSteps: [
      {
        command: 'winget',
        args: ['install', '--exact', '--id', 'AquaSecurity.Trivy', '--accept-package-agreements', '--accept-source-agreements'],
        description: 'winget install --id AquaSecurity.Trivy'
      }
    ]
  },
  {
    toolId: 'npm-audit',
    command: 'npm',
    fallbackCommands: ['npm.cmd', 'npm.exe'],
    versionArgs: ['--version'],
    minVersion: '8.0.0',
    installSteps: [
      {
        command: 'winget',
        args: ['install', '--exact', '--id', 'OpenJS.NodeJS.LTS', '--accept-package-agreements', '--accept-source-agreements'],
        description: 'winget install --id OpenJS.NodeJS.LTS'
      }
    ]
  },
  {
    toolId: 'pip-audit',
    command: 'pip-audit',
    fallbackCommands: ['pip-audit.exe'],
    versionArgs: ['--version'],
    minVersion: '2.6.0',
    installSteps: [
      { command: 'python', args: ['-m', 'pip', 'install', '--user', 'pip-audit'], description: 'python -m pip install --user pip-audit' },
      { command: 'py', args: ['-m', 'pip', 'install', '--user', 'pip-audit'], description: 'py -m pip install --user pip-audit' }
    ]
  },
  {
    toolId: 'detect-secrets',
    command: 'detect-secrets',
    fallbackCommands: ['detect-secrets.exe'],
    versionArgs: ['--version'],
    minVersion: '1.4.0',
    installSteps: [
      { command: 'python', args: ['-m', 'pip', 'install', '--user', 'detect-secrets'], description: 'python -m pip install --user detect-secrets' },
      { command: 'py', args: ['-m', 'pip', 'install', '--user', 'detect-secrets'], description: 'py -m pip install --user detect-secrets' }
    ]
  }
];

export class SetupManager {
  private readonly spawner = new ProcessSpawner();
  private readonly discoveredPaths = new Set<string>();

  async run(options: SetupOptions): Promise<SetupResult> {
    const installMissing = options.installMissing ?? true;
    const tools: ToolCheckResult[] = [];

    for (const tool of TOOL_COMMANDS) {
      await this.refreshDiscoveredPaths();
      const initial = await this.checkTool(tool.toolId);
      if (initial.available && initial.meetsMinimumVersion) {
        tools.push({ ...initial, installStatus: 'already-present' });
        continue;
      }

      if (!installMissing) {
        tools.push({ ...initial, installStatus: 'skipped', installMessage: 'Installation disabled by --check-only.' });
        continue;
      }

      tools.push(await this.installAndRecheck(tool));
    }

    const hookPath = options.installHook === false ? undefined : await new PreCommitHookInstaller().install(options.workspace);
    return { tools, hookPath };
  }

  async checkTool(toolId: string): Promise<ToolCheckResult> {
    const tool = TOOL_COMMANDS.find((candidate) => candidate.toolId === toolId);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolId}`);
    }

    const npmInvocation = tool.toolId === 'npm-audit' ? this.npmCliInvocation(tool.versionArgs) : null;
    const command = npmInvocation?.command ?? this.resolveCommand(tool);
    const args = npmInvocation?.args ?? tool.versionArgs;
    const result = await this.spawner.spawn(command, args, {
      cwd: process.cwd(),
      timeoutMs: 30_000,
      env: this.createAugmentedEnv()
    });
    const version = result.exitCode === 0 ? (result.stdout || result.stderr).trim() : '';
    return {
      toolId,
      available: result.exitCode === 0,
      version,
      minVersion: tool.minVersion,
      installStatus: result.exitCode === 0 ? 'already-present' : 'skipped',
      meetsMinimumVersion: result.exitCode === 0 && satisfiesMinimumVersion(version, tool.minVersion)
    };
  }

  private async installAndRecheck(tool: ToolSpec): Promise<ToolCheckResult> {
    const failures: string[] = [];

    for (const step of tool.installSteps) {
      const install = await this.spawner.spawn(step.command, step.args, {
        cwd: process.cwd(),
        timeoutMs: 10 * 60 * 1000,
        env: this.createAugmentedEnv()
      });

      if (install.exitCode !== 0) {
        failures.push(`${step.description}: ${install.stderr || install.stdout || `exit ${install.exitCode}`}`);
        continue;
      }

      await this.refreshDiscoveredPaths();
      const recheck = await this.checkTool(tool.toolId);
      if (recheck.available) {
        return {
          ...recheck,
          installStatus: recheck.meetsMinimumVersion ? 'installed' : 'failed',
          installMessage: recheck.meetsMinimumVersion
            ? `Installed with ${step.description}.`
            : `${step.description} completed, but ${tool.command} version ${recheck.version} is below required ${tool.minVersion}.`
        };
      }

      const extraPaths = [...this.discoveredPaths].join('; ');
      failures.push(
        `${step.description}: command completed, but ${tool.command} was not found after checking PATH and common install locations.${extraPaths ? ` Checked extra paths: ${extraPaths}` : ''}`
      );
    }

    return {
      toolId: tool.toolId,
      available: false,
      version: '',
      minVersion: tool.minVersion,
      installStatus: 'failed',
      installMessage: failures.join('\n'),
      meetsMinimumVersion: false
    };
  }

  private async refreshDiscoveredPaths(): Promise<void> {
    for (const candidate of this.commonToolDirectories()) {
      if (existsSync(candidate)) {
        this.discoveredPaths.add(candidate);
      }
    }

    const userBase = await this.getPythonUserBase();
    if (userBase) {
      const scriptsDir = path.join(userBase, 'Scripts');
      if (existsSync(scriptsDir)) {
        this.discoveredPaths.add(scriptsDir);
      }
      for (const scriptsSubdir of this.pythonVersionedScriptsDirs(userBase)) {
        if (existsSync(scriptsSubdir)) {
          this.discoveredPaths.add(scriptsSubdir);
        }
      }
    }

    for (const tool of TOOL_COMMANDS) {
      for (const commandName of tool.fallbackCommands) {
        for (const dir of this.findKnownPackageDirs(commandName)) {
          this.discoveredPaths.add(dir);
        }
      }
    }
  }

  private commonToolDirectories(): string[] {
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

  private findKnownPackageDirs(commandName: string): string[] {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
      return [];
    }

    const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
    if (!existsSync(packagesDir)) {
      return [];
    }

    const matches: string[] = [];
    const packageDirs = this.safeListDirectories(packagesDir);
    for (const packageDir of packageDirs) {
      const candidate = path.join(packageDir, commandName);
      if (existsSync(candidate)) {
        matches.push(packageDir);
      }
    }
    return matches;
  }

  private safeListDirectories(dir: string): string[] {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((entry: { isDirectory(): boolean }) => entry.isDirectory())
        .map((entry: { name: string }) => path.join(dir, entry.name));
    } catch {
      return [];
    }
  }

  private async getPythonUserBase(): Promise<string | null> {
    for (const command of ['python', 'py']) {
      const result = await this.spawner.spawn(command, ['-m', 'site', '--user-base'], {
        cwd: process.cwd(),
        timeoutMs: 5000,
        env: this.createAugmentedEnv()
      });
      const output = result.stdout.trim().split(/\r?\n/).at(-1)?.trim();
      if (result.exitCode === 0 && output) {
        return output;
      }
    }
    return null;
  }

  private createAugmentedEnv(): NodeJS.ProcessEnv {
    const existingPath = process.env.PATH ?? process.env.Path ?? '';
    const pathValue = [...this.discoveredPaths, existingPath].filter(Boolean).join(';');
    return {
      ...process.env,
      PATH: pathValue,
      Path: pathValue
    };
  }

  private resolveCommand(tool: ToolSpec): string {
    const names = this.commandCandidates(tool);
    for (const dir of this.pathEntries()) {
      for (const name of names) {
        const fullPath = path.join(dir, name);
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
    return tool.command;
  }

  private npmCliInvocation(args: string[]): { command: string; args: string[] } | null {
    const programFiles = process.env.ProgramFiles;
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    const candidates = [
      programFiles ? path.join(programFiles, 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js') : '',
      programFilesX86 ? path.join(programFilesX86, 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js') : ''
    ].filter(Boolean);
    const npmCli = candidates.find((candidate) => existsSync(candidate));
    return npmCli ? { command: 'node', args: [npmCli, ...args] } : null;
  }

  private commandCandidates(tool: ToolSpec): string[] {
    if (process.platform !== 'win32') {
      return [tool.command, ...tool.fallbackCommands];
    }
    return [...tool.fallbackCommands, tool.command];
  }

  private pathEntries(): string[] {
    const existingPath = process.env.PATH ?? process.env.Path ?? '';
    return [...this.discoveredPaths, ...existingPath.split(';')].filter(Boolean);
  }

  private pythonVersionedScriptsDirs(userBase: string): string[] {
    const versions = ['Python314', 'Python313', 'Python312', 'Python311', 'Python310', 'Python39'];
    return versions.map((version) => path.join(userBase, version, 'Scripts'));
  }
}
