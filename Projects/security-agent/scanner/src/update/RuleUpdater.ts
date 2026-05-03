import { promises as fs } from 'fs';
import path from 'path';
import { RuleManifestManager } from '../config/RuleManifestManager';
import { AuditLogger } from '../logging/AuditLogger';
import { BUILT_IN_SEMGREP_RULES } from './BuiltInRules';

export interface RuleUpdateResult {
  updated: string[];
  current: string[];
  failed: string[];
}

export class RuleUpdater {
  constructor(private readonly manifestManager = new RuleManifestManager()) {}

  async update(workspaceRoot: string): Promise<RuleUpdateResult> {
    const now = new Date().toISOString();
    const customRulesDir = path.resolve(workspaceRoot, '.kiro/security/custom-rules');
    await fs.mkdir(customRulesDir, { recursive: true });
    await fs.writeFile(path.join(customRulesDir, 'agent-security-scanner.yml'), BUILT_IN_SEMGREP_RULES, 'utf8');
    const manifest = {
      lastUpdated: now,
      rulesets: [
        {
          name: 'semgrep-auto',
          sourceUrl: 'https://semgrep.dev/r',
          version: now,
          lastUpdated: now,
          standardsCovered: ['OWASP Top 10', 'CWE Top 25', 'OWASP LLM Top 10', 'OWASP Agentic Top 10']
        },
        {
          name: 'agent-security-scanner-custom',
          sourceUrl: '.kiro/security/custom-rules/agent-security-scanner.yml',
          version: now,
          lastUpdated: now,
          standardsCovered: ['OWASP LLM Top 10', 'OWASP Agentic Top 10', 'MCP Security', 'Windows Credential Manager']
        }
      ]
    };

    await this.manifestManager.save(workspaceRoot, manifest);
    await new AuditLogger(path.resolve(workspaceRoot, '.kiro/security/audit.log')).log({
      event_type: 'rules_updated',
      rulesets: manifest.rulesets.map((ruleset) => ruleset.name)
    });
    return { updated: manifest.rulesets.map((ruleset) => ruleset.name), current: [], failed: [] };
  }
}
