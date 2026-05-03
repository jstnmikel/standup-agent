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
  versionArgs: string[];
  minVersion: string;
  installSteps: InstallStep[];
}

const TOOL_COMMANDS: ToolSpec[] = [
  {
    toolId: 'semgrep',
    command: 'semgrep',
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

  async run(options: SetupOptions): Promise<SetupResult> {
    const installMissing = options.installMissing ?? true;
    const tools: ToolCheckResult[] = [];

    for (const tool of TOOL_COMMANDS) {
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

    const result = await this.spawner.spawn(tool.command, tool.versionArgs, {
      cwd: process.cwd(),
      timeoutMs: 5000
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
        timeoutMs: 10 * 60 * 1000
      });

      if (install.exitCode !== 0) {
        failures.push(`${step.description}: ${install.stderr || install.stdout || `exit ${install.exitCode}`}`);
        continue;
      }

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

      failures.push(`${step.description}: command completed, but ${tool.command} was not found on PATH after installation. Restart the terminal if PATH was updated.`);
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
}
