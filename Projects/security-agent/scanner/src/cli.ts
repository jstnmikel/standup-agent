import { Command } from 'commander';
import path from 'path';
import { AuditLogger } from './logging/AuditLogger';
import { ScanOrchestrator } from './orchestrator/ScanOrchestrator';
import { ScanHistoryStore } from './report/ScanHistoryStore';
import { SetupManager } from './setup/SetupManager';
import { RuleUpdater } from './update/RuleUpdater';
import { SelfUpdateManager } from './update/SelfUpdateManager';
import { preCommitExitCode } from './utils/preCommitPolicy';
import { SCANNER_VERSION } from './version';

const program = new Command();

program
  .name('scanner')
  .description('Agent Security Scanner - security scanning for AI agent and MCP developers')
  .version(SCANNER_VERSION);

program
  .command('scan')
  .description('Run a security scan of the current workspace')
  .option('--pre-commit', 'Run in pre-commit mode (staged files only)')
  .option('--staged-files <files...>', 'List of staged files for pre-commit mode')
  .option('--history', 'Include git history secret scanning')
  .option('--debug', 'Enable debug logging for this invocation')
  .option('--output-json', 'Output scan report as JSON')
  .option('--workspace <path>', 'Workspace root path (defaults to current directory)', process.cwd())
  .action(async (options: {
    preCommit?: boolean;
    stagedFiles?: string[];
    history?: boolean;
    debug?: boolean;
    outputJson?: boolean;
    workspace: string;
  }) => {
    const report = await new ScanOrchestrator().runScan({
      workspaceRoot: path.resolve(options.workspace),
      scanType: options.history ? 'history' : options.preCommit ? 'pre-commit' : 'manual',
      stagedFiles: options.stagedFiles,
      debug: options.debug ?? false
    });

    if (options.outputJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`Scan ${report.id} completed in ${report.elapsedMs}ms`);
      console.log(
        `Findings: ${report.summary.total} total, ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low, ${report.summary.informational} informational`
      );
      if (report.warnings.length) {
        console.log('Warnings:');
        for (const warning of report.warnings) {
          console.log(`- ${warning.toolId ? `${warning.toolId}: ` : ''}${warning.message}`);
        }
      }
      console.log('Report written to .kiro/security/last-scan-report.json');
    }

    process.exit(options.preCommit ? preCommitExitCode(report) : 0);
  });

program
  .command('setup')
  .description('Install required scanning tools and optionally the pre-commit hook')
  .option('--silent', 'Run without interactive prompts (for MDM/Group Policy deployment)')
  .option('--check-only', 'Only check tool availability; do not install missing tools')
  .option('--no-hook', 'Do not install the Git pre-commit hook')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action(async (options: { silent?: boolean; checkOnly?: boolean; hook?: boolean; workspace: string }) => {
    const result = await new SetupManager().run({
      workspace: path.resolve(options.workspace),
      installMissing: !options.checkOnly,
      installHook: options.hook
    });
    console.log(options.checkOnly ? 'Tool availability:' : 'Tool setup:');
    for (const tool of result.tools) {
      const version = tool.version || `(minimum ${tool.minVersion})`;
      const versionStatus = tool.available && !tool.meetsMinimumVersion ? ` below required ${tool.minVersion}` : '';
      console.log(`- ${tool.toolId}: ${tool.available ? 'available' : 'missing'} ${version}${versionStatus} [${tool.installStatus}]`);
      if (tool.installMessage) {
        console.log(`  ${tool.installMessage.split('\n').join('\n  ')}`);
      }
    }
    if (result.hookPath) {
      console.log(`Pre-commit hook installed at ${result.hookPath}`);
    }
    process.exit(result.tools.some((tool) => !tool.available || !tool.meetsMinimumVersion) ? 1 : 0);
  });

program
  .command('update-rules')
  .description('Download and install the latest scanning rulesets')
  .option('--silent', 'Run without interactive prompts')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action(async (options: { silent?: boolean; workspace: string }) => {
    const result = await new RuleUpdater().update(path.resolve(options.workspace));
    console.log(`Rules updated: ${result.updated.join(', ') || 'none'}`);
    if (result.failed.length) {
      console.log(`Rules failed: ${result.failed.join(', ')}`);
    }
    process.exit(0);
  });

program
  .command('self-update')
  .description('Check for and install a newer version of the scanner')
  .option('--silent', 'Run without interactive prompts')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action(async (options: { silent?: boolean; workspace: string }) => {
    const result = await new SelfUpdateManager().applyUpdate(path.resolve(options.workspace));
    console.log(
      result.updateAvailable
        ? `Updated scanner from ${result.currentVersion} to ${result.latestVersion}`
        : `Scanner is current at ${result.currentVersion}; no update source is configured for this local build.`
    );
    process.exit(0);
  });

program
  .command('audit-log')
  .description('View or verify the audit log')
  .option('--verify', 'Verify the hash chain integrity of the audit log')
  .option('--event-type <type>', 'Filter by event type')
  .option('--since <date>', 'Show entries since date (ISO 8601)')
  .option('--until <date>', 'Show entries until date (ISO 8601)')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action(async (options: {
    verify?: boolean;
    eventType?: string;
    since?: string;
    until?: string;
    workspace: string;
  }) => {
    const logger = new AuditLogger(path.resolve(options.workspace, '.kiro/security/audit.log'));

    if (options.verify) {
      const result = await logger.verify();
      if (result.ok) {
        console.log(`Audit log verified: ${result.checkedLines} entries checked.`);
        process.exit(0);
      }

      console.error(
        `Audit log tampering detected at line ${result.firstInvalidLine}. Expected prev_hash ${result.expectedPrevHash}, found ${result.actualPrevHash}.`
      );
      process.exit(1);
    }

    const events = await logger.read({
      eventType: options.eventType,
      since: options.since,
      until: options.until
    });
    for (const event of events) {
      console.log(JSON.stringify(event));
    }
    process.exit(0);
  });

program
  .command('scan-history')
  .description('View scan history')
  .argument('[report-id]', 'Report ID to display in full')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action(async (reportId: string | undefined, options: { workspace: string }) => {
    const store = new ScanHistoryStore();
    const workspace = path.resolve(options.workspace);
    if (reportId) {
      const report = await store.get(workspace, reportId);
      if (!report) {
        console.error(`No scan history report found with id ${reportId}`);
        process.exit(1);
      }
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    }

    const entries = await store.list(workspace);
    for (const entry of entries) {
      console.log(
        `${entry.timestamp} ${entry.id} total=${entry.summary.total} critical=${entry.summary.critical} high=${entry.summary.high}`
      );
    }
    process.exit(0);
  });

program
  .command('onboarding')
  .description('Run the guided onboarding experience')
  .option('--workspace <path>', 'Workspace root path', process.cwd())
  .action((_options: { workspace: string }) => {
    console.log('Onboarding command - implementation coming in Task 19');
    process.exit(0);
  });

program.parse(process.argv);
