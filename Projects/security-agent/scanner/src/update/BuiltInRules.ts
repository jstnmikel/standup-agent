export const BUILT_IN_SEMGREP_RULES = `rules:
  - id: agent.unpinned-model-alias
    languages: [javascript, typescript, python]
    message: LLM model identifier uses a mutable alias; pin an exact model version for reproducibility.
    severity: WARNING
    metadata:
      category: ai-transparency
      owasp: OWASP LLM
      references: https://owasp.org/www-project-top-10-for-large-language-model-applications/
    patterns:
      - pattern-regex: '(gpt-4|gpt-3\\.5|claude-3|gemini-pro)(["'']|$)'

  - id: agent.disable-tls-validation
    languages: [javascript, typescript, python]
    message: TLS certificate validation is disabled, which can expose credentials and agent traffic.
    severity: ERROR
    metadata:
      category: windows-credential-manager
      cwe: CWE-295
      references: https://cwe.mitre.org/data/definitions/295.html
    patterns:
      - pattern-regex: '(rejectUnauthorized\\s*:\\s*false|verify\\s*=\\s*False)'

  - id: agent.dotenv-usage
    languages: [javascript, typescript, python]
    message: dotenv loads secrets from plaintext .env files; use Windows Credential Manager for local secrets.
    severity: ERROR
    metadata:
      category: windows-credential-manager
      cwe: CWE-522
      references: https://learn.microsoft.com/windows/security/identity-protection/credential-guard/
    patterns:
      - pattern-regex: '(dotenv\\.config\\(|load_dotenv\\()'

  - id: agent.shell-with-external-input
    languages: [javascript, typescript, python]
    message: Shell execution should validate and constrain externally influenced arguments.
    severity: ERROR
    metadata:
      category: owasp-agentic-top10
      owasp: ASI02
      references: https://owasp.org/
    patterns:
      - pattern-regex: '(exec\\(|spawn\\(|subprocess\\.(run|Popen)\\()'

  - id: agent.mcp-remote-http
    languages: [json]
    message: MCP server uses an unencrypted http URL; prefer HTTPS and allowlist trusted servers.
    severity: WARNING
    metadata:
      category: mcp-config
      references: https://modelcontextprotocol.io/
    patterns:
      - pattern-regex: 'http://'
`;
