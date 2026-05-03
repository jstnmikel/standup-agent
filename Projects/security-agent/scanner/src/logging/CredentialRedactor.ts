export interface RedactResult {
  redacted: string;
  redactionsApplied: number;
  credentialTypesFound: string[];
}

export interface CredentialPattern {
  type: string;
  regex: RegExp;
}

const DEFAULT_PATTERNS: CredentialPattern[] = [
  { type: 'PRIVATE-KEY', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { type: 'AWS-ACCESS-KEY', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: 'GITHUB-TOKEN', regex: /\bgh[pousr]_[A-Za-z0-9_]{36,255}\b/g },
  { type: 'OPENAI-API-KEY', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { type: 'PASSWORD', regex: /\b(password|passwd|pwd)\s*[:=]\s*["']?[^"'\s,;]{8,}/gi },
  { type: 'API-KEY', regex: /\b(api[_-]?key|token|secret)\s*[:=]\s*["']?[A-Za-z0-9._-]{16,}/gi },
  { type: 'JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g }
];

export class CredentialRedactor {
  private patterns = DEFAULT_PATTERNS;

  static readonly instance = new CredentialRedactor();

  updatePatterns(patterns: CredentialPattern[]): void {
    this.patterns = patterns.map((pattern) => ({
      type: pattern.type,
      regex: new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`)
    }));
  }

  redact(value: string): RedactResult {
    let redacted = value;
    let redactionsApplied = 0;
    const credentialTypesFound = new Set<string>();

    for (const pattern of this.patterns) {
      redacted = redacted.replace(pattern.regex, () => {
        redactionsApplied += 1;
        credentialTypesFound.add(pattern.type);
        return `[REDACTED-${pattern.type}]`;
      });
    }

    return {
      redacted,
      redactionsApplied,
      credentialTypesFound: [...credentialTypesFound]
    };
  }

  redactObject<T>(obj: T): T {
    return this.redactUnknown(obj).value as T;
  }

  redactObjectWithCount<T>(obj: T): { value: T; redactionsApplied: number; credentialTypesFound: string[] } {
    const result = this.redactUnknown(obj);
    return {
      value: result.value as T,
      redactionsApplied: result.redactionsApplied,
      credentialTypesFound: [...result.credentialTypesFound]
    };
  }

  private redactUnknown(value: unknown): { value: unknown; redactionsApplied: number; credentialTypesFound: Set<string> } {
    if (typeof value === 'string') {
      const result = this.redact(value);
      return {
        value: result.redacted,
        redactionsApplied: result.redactionsApplied,
        credentialTypesFound: new Set(result.credentialTypesFound)
      };
    }

    if (Array.isArray(value)) {
      let count = 0;
      const types = new Set<string>();
      const redactedArray = value.map((item) => {
        const result = this.redactUnknown(item);
        count += result.redactionsApplied;
        result.credentialTypesFound.forEach((type) => types.add(type));
        return result.value;
      });
      return { value: redactedArray, redactionsApplied: count, credentialTypesFound: types };
    }

    if (value && typeof value === 'object') {
      let count = 0;
      const types = new Set<string>();
      const redactedRecord: Record<string, unknown> = {};

      for (const [key, item] of Object.entries(value)) {
        const result = this.redactUnknown(item);
        count += result.redactionsApplied;
        result.credentialTypesFound.forEach((type) => types.add(type));
        redactedRecord[key] = result.value;
      }

      return { value: redactedRecord, redactionsApplied: count, credentialTypesFound: types };
    }

    return { value, redactionsApplied: 0, credentialTypesFound: new Set<string>() };
  }
}
