/**
 * Build script for the Agent Security Scanner.
 * Uses esbuild to bundle both the VS Code extension and the CLI.
 * This script avoids shell quoting issues on Windows with npm scripts.
 */

const esbuild = require('esbuild');
const args = process.argv.slice(2);
const minify = args.includes('--minify');
const sourcemap = args.includes('--sourcemap');

async function build() {
  // Build VS Code extension
  await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    minify,
    sourcemap,
  });

  // Build CLI — add shebang banner for executable
  await esbuild.build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    outfile: 'dist/cli.js',
    format: 'cjs',
    platform: 'node',
    minify,
    sourcemap,
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  console.log('Build complete.');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
