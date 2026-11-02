import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const elementPlusManifest = JSON.parse(
  readFileSync(path.join(packageDirectory, '../element-plus/package.json'), 'utf8'),
);
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

describe('package scaffold mirrors element-plus', () => {
  it('names the package under the bach.software scope', () => {
    expect(manifest.name).toBe('@bach.software/vue-dynamic-form-starter');
  });

  it('is publishable: not private, MIT licensed, with a changesets-managed version', () => {
    expect(manifest.private).toBeUndefined();
    expect(manifest.license).toBe('MIT');
    expect(manifest.version).toBeDefined();
  });

  it('shares the same exports map shape, plus the shipped stylesheet', () => {
    // The starter additionally ships its stylesheet as a subpath export; element-plus has none.
    expect(Object.keys(manifest.exports)).toEqual(['.', './style.css']);
    expect(Object.keys(manifest.exports['.'])).toEqual(Object.keys(elementPlusManifest.exports['.']));
    expect(manifest.exports['./style.css']).toBe('./dist/style.css');
  });

  it('shares the same main/module/types/files shape', () => {
    expect(manifest.main).toBe('./dist/vue-dynamic-form-starter.umd.js');
    expect(manifest.module).toBe('./dist/vue-dynamic-form-starter.es.js');
    expect(manifest.types).toBe('./dist/src/index.d.ts');
    expect(manifest.files).toEqual(elementPlusManifest.files);
  });

  it('shares the same publishConfig access', () => {
    expect(manifest.publishConfig).toEqual(elementPlusManifest.publishConfig);
  });

  it('shares the same script set, plus the publish guard', () => {
    // prepublishOnly re-runs the full ci pipeline before `npm publish`; the private element-plus package has no reason to carry it.
    expect(Object.keys(manifest.scripts).sort()).toEqual([...Object.keys(elementPlusManifest.scripts), 'prepublishOnly'].sort());
  });
});

describe('peer and runtime dependencies match the architecture', () => {
  it('lists only the framework peers, no element-plus', () => {
    expect(Object.keys(manifest.peerDependencies).sort()).toEqual([
      '@bach.software/vue-dynamic-form',
      'vee-validate',
      'vue',
    ]);
    expect(manifest.peerDependencies['element-plus']).toBeUndefined();
  });

  it('bundles @lucide/vue as a runtime dependency', () => {
    expect(Object.keys(manifest.dependencies)).toEqual(['@lucide/vue']);
  });

  it('matches the architecture explicit devDependencies list, with no element-plus', () => {
    expect(Object.keys(manifest.devDependencies).sort()).toEqual([...expectedDevDependencyKeys].sort());
    expect(manifest.devDependencies['element-plus']).toBeUndefined();
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
