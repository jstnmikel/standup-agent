export function extractVersion(value: string): string {
  return value.match(/\d+\.\d+\.\d+/)?.[0] ?? value.match(/\d+\.\d+/)?.[0] ?? '';
}

export function compareVersions(actual: string, minimum: string): number {
  const actualParts = extractVersion(actual).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const minimumParts = extractVersion(minimum).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(actualParts.length, minimumParts.length);

  for (let index = 0; index < length; index += 1) {
    const actualPart = actualParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;
    if (actualPart > minimumPart) {
      return 1;
    }
    if (actualPart < minimumPart) {
      return -1;
    }
  }

  return 0;
}

export function satisfiesMinimumVersion(actual: string, minimum: string): boolean {
  const actualVersion = extractVersion(actual);
  return actualVersion.length > 0 && compareVersions(actualVersion, minimum) >= 0;
}
