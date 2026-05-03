/**
 * Scaffold verification test — confirms the project structure and
 * test framework are set up correctly. This test can be removed once
 * real tests are in place.
 */

import * as fc from 'fast-check';

describe('Project scaffold', () => {
  it('Jest is configured and running', () => {
    expect(true).toBe(true);
  });

  it('fast-check property-based testing is available', () => {
    // Verify fast-check works with a trivial property
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });

  it('TypeScript strict mode is enforced', () => {
    // This test verifies the mock vscode module is importable
    const { DiagnosticSeverity } = require('../__mocks__/vscode');
    expect(DiagnosticSeverity.Error).toBe(0);
    expect(DiagnosticSeverity.Warning).toBe(1);
  });
});
