import path from 'path';
import { ConfigLoader } from '../config/ConfigLoader';
import { McpAllowlistManager } from '../config/McpAllowlistManager';
import { FindingFilter } from '../filter/FindingFilter';
import { SuppressionManager } from '../filter/SuppressionManager';
import { AuditLogger } from '../logging/AuditLogger';
import { DebugLogger } from '../logging/DebugLogger';
import type { Finding } from '../models/Finding';
import type { RuleManifest } from '../models/RuleManifest';
import type { ScanReport, ScanWarning } from '../models/ScanReport';
import { createNormalizers } from '../normalizers';
import { ReportBuilder } from '../report/ReportBuilder';
import { ScanHistoryStore } from '../report/ScanHistoryStore';
import {
  DetectSecretsRunner,
  GitleaksRunner,
  NpmAuditRunner,
  PipAuditRunner,
  SemgrepRunner,
  TrivyRunner,
  type RawToolOutput,
  type ToolRunner
} from '../runners';
import type { ScanContext } from './ScanContext';
import { McpConfigScanner } from './McpConfigScanner';
import { SCANNER_VERSION } from '../version';

interface ToolRunResult {
  outputs: RawToolOutput[];
  warnings: ScanWarning[];
}

export class ScanOrchestrator {
  private cancelled = false;

  constructor(
    private readonly configLoader = new ConfigLoader(),
    private readonly filter = new FindingFilter(),
    private readonly reportBuilder = new ReportBuilder(),
    private readonly suppressionManager = new SuppressionManager(),
    private readonly historyStore = new ScanHistoryStore(),
    private readonly mcpAllowlistManager = new McpAllowlistManager(),
    private readonly mcpConfigScanner = new McpConfigScanner()
  ) {}

  async runScan(ctx: Omit<ScanContext, 'enabledCategories'> & { enabledCategories?: ScanContext['enabledCategories'] }): Promise<ScanReport> {
    this.cancelled = false;
    const resolved = await this.configLoader.load(ctx.workspaceRoot);
    const auditLogger = new AuditLogger(path.resolve(ctx.workspaceRoot, resolved.merged.auditLogPath));
    const debugLogger = new DebugLogger(
      path.resolve(ctx.workspaceRoot, '.kiro/security/scanner-debug.log'),
      resolved.merged.debugLogging || ctx.debug
    );
    const startedAt = Date.now();

    await auditLogger.log({
      event_type: 'scan_started',
      scan_type: ctx.scanType,
      workspace_root: ctx.workspaceRoot,
      staged_files_count: ctx.stagedFiles?.length ?? 0
    });

    if (this.cancelled) {
      throw new Error('Scan cancelled');
    }

    const scanContext: ScanContext = {
      ...ctx,
      enabledCategories: ctx.enabledCategories ?? resolved.merged.enabledCategories
    };
    const toolRun = await this.runAllTools(scanContext, auditLogger, debugLogger);
    const outputs = toolRun.outputs;
    const allowlist = await this.mcpAllowlistManager.load(ctx.workspaceRoot, resolved.adminPolicy);
    const mcpFindings = scanContext.enabledCategories.includes('mcp-config')
      ? await this.mcpConfigScanner.scan(ctx.workspaceRoot, allowlist)
      : [];
    const findings = [...this.normalizeOutputs(outputs, ctx.workspaceRoot), ...mcpFindings];
    const suppressions = await this.suppressionManager.load(ctx.workspaceRoot);
    const filtered = this.filter.apply(findings, suppressions, resolved.adminPolicy);
    const report = this.reportBuilder.build(filtered, this.defaultManifest(), null, {
      scanType: ctx.scanType,
      workspaceRoot: ctx.workspaceRoot,
      scannerVersion: SCANNER_VERSION,
      elapsedMs: Date.now() - startedAt,
      warnings: toolRun.warnings
    });

    await this.reportBuilder.persist(report, ctx.workspaceRoot);
    await this.historyStore.save(report, resolved.merged.scanHistoryRetentionCount, suppressions);
    await auditLogger.log({
      event_type: 'scan_completed',
      scan_id: report.id,
      scan_type: report.scanType,
      elapsed_ms: report.elapsedMs,
      total_findings: report.summary.total
    });

    return report;
  }

  cancelScan(): void {
    this.cancelled = true;
  }

  private defaultManifest(): RuleManifest {
    return {
      lastUpdated: new Date().toISOString(),
      rulesets: []
    };
  }

  private async runAllTools(ctx: ScanContext, auditLogger: AuditLogger, debugLogger: DebugLogger): Promise<ToolRunResult> {
    const runners = this.createRunners();
    const results = await Promise.allSettled(
      runners.map(async (runner) => {
        const available = await runner.isAvailable();
        if (!available) {
          throw new Error(`${runner.toolId} is not available on PATH`);
        }
        return runner.run(ctx);
      })
    );
    const outputs: RawToolOutput[] = [];
    const warnings: ScanWarning[] = [];

    for (let index = 0; index < results.length; index += 1) {
      const runner = runners[index];
      const result = results[index];
      if (result.status === 'fulfilled') {
        outputs.push(result.value);
        if (result.value.exitCode !== 0 && !this.exitCodeMayContainFindings(result.value.toolId)) {
          warnings.push({
            code: 'tool-exit-nonzero',
            toolId: result.value.toolId,
            message: `${result.value.toolId} exited with code ${result.value.exitCode}. Results from this tool may be incomplete.`
          });
          await auditLogger.log({
            event_type: 'scan_tool_error',
            tool_id: result.value.toolId,
            exit_code: result.value.exitCode,
            stderr: result.value.stderr
          });
        }
      } else {
        warnings.push({
          code: 'tool-unavailable-or-failed',
          toolId: runner.toolId,
          message: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
        await auditLogger.log({
          event_type: 'scan_tool_error',
          tool_id: runner.toolId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
        await debugLogger.log({
          level: 'WARN',
          category: 'internal_error',
          message: 'Tool failed before producing output',
          toolId: runner.toolId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
      }
    }

    return { outputs, warnings };
  }

  private normalizeOutputs(outputs: RawToolOutput[], workspaceRoot: string): Finding[] {
    const normalizers = createNormalizers();
    const findings = outputs.flatMap((output) => normalizers[output.toolId]?.normalize(output, workspaceRoot) ?? []);
    const unique = new Map<string, Finding>();
    findings.forEach((finding) => unique.set(finding.id, finding));
    return [...unique.values()];
  }

  private createRunners(): ToolRunner[] {
    return [
      new SemgrepRunner(),
      new GitleaksRunner(),
      new TrivyRunner(),
      new NpmAuditRunner(),
      new PipAuditRunner(),
      new DetectSecretsRunner()
    ];
  }

  private exitCodeMayContainFindings(toolId: string): boolean {
    // These tools return non-zero exit codes when they find issues — that is normal behavior, not an error
    // semgrep: exits 2 when findings are present
    // gitleaks: exits 1 when secrets are found
    // npm-audit: exits 1 when vulnerabilities are found
    // pip-audit: exits 1 when vulnerabilities are found
    return ['gitleaks', 'npm-audit', 'semgrep', 'pip-audit'].includes(toolId);
  }
}
