import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const workspaceCatalog = readFileSync(path.join(packageDirectory, '../../pnpm-workspace.yaml'), 'utf8');

const expectedDevDependencyKeys = [
  '@antfu/eslint-config',
  '@bach.software/vue-dynamic-form',
  '@types/node',
  '@vitejs/plugin-vue',
  '@vitest/coverage-v8',
  '@vue/test-utils',
  'eslint',
  'eslint-plugin-format',
  'jsdom',
  'sass-embedded',
  'tsc-alias',
  'typescript',
  'vee-validate',
  'vite',
  'vitest',
  'vue',
  'vue-tsc',
];

describe('package scaffold', () => {
  it('names the package under the bach.software scope', () => {
    expect(manifest.name).toBe('@bach.software/vue-dynamic-form-starter');
  });

  it('is publishable: not private, MIT licensed, with a changesets-managed version', () => {
    expect(manifest.private).toBeUndefined();
    expect(manifest.license).toBe('MIT');
    expect(manifest.version).toBeDefined();
  });

  it('exports the dual-condition entry plus the shipped stylesheet', () => {
    expect(Object.keys(manifest.exports)).toEqual(['.', './style.css']);
    expect(Object.keys(manifest.exports['.'])).toEqual(['types', 'import', 'require']);
    expect(manifest.exports['./style.css']).toBe('./dist/style.css');
  });

  it('declares the matching main/module/types/files shape', () => {
    expect(manifest.main).toBe('./dist/vue-dynamic-form-starter.umd.js');
    expect(manifest.module).toBe('./dist/vue-dynamic-form-starter.es.js');
    expect(manifest.types).toBe('./dist/src/index.d.ts');
    expect(manifest.files).toEqual(['dist']);
  });

  it('publishes under public access', () => {
    expect(manifest.publishConfig).toEqual({ access: 'public' });
  });

  it('carries the publish guard alongside the standard script set', () => {
    expect(Object.keys(manifest.scripts).sort()).toEqual([
      'build',
      'build:watch',
      'ci',
      'ci:lint',
      'ci:test',
      'ci:test:coverage',
      'ci:typecheck',
      'lint',
      'lint:fix',
      'prepublishOnly',
      'test',
      'typecheck',
    ].sort());
  });
});

describe('peer and runtime dependencies match the architecture', () => {
  it('lists only the framework peers', () => {
    expect(Object.keys(manifest.peerDependencies).sort()).toEqual([
      '@bach.software/vue-dynamic-form',
      'vee-validate',
      'vue',
    ]);
  });

  it('bundles @lucide/vue as a runtime dependency', () => {
    expect(Object.keys(manifest.dependencies)).toEqual(['@lucide/vue']);
  });

  it('matches the architecture explicit devDependencies list', () => {
    expect(Object.keys(manifest.devDependencies).sort()).toEqual([...expectedDevDependencyKeys].sort());
  });
});

describe('@lucide/vue is pinned through a workspace catalog entry', () => {
  it('declares a catalog range below the next major', () => {
    expect(workspaceCatalog).toMatch(/'@lucide\/vue':\s*'>=1 <2'/);
  });

  it('references the catalog entry, not a literal or open-ended version', () => {
    expect(manifest.dependencies['@lucide/vue']).toBe('catalog:framework');
  });
});
