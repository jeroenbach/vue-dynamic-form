import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));

// Matches `dist/style.css` the way the bundler's sideEffects globs do, relative to the package root.
function matchesStylesheet(pattern: string) {
  const normalized = pattern.replace(/^\.\//, '');
  const expression = normalized
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.*/)?')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${expression}$`).test('dist/style.css');
}

describe('package manifest', () => {
  it('exports the stylesheet subpath', () => {
    expect(manifest.exports['./style.css']).toBe('./dist/style.css');
  });

  it('keeps the main export unchanged', () => {
    expect(manifest.exports['.']).toEqual({
      types: './dist/src/index.d.ts',
      import: './dist/vue-dynamic-form-element-plus.es.js',
      require: './dist/vue-dynamic-form-element-plus.umd.js',
    });
  });

  it('keeps dist in the published files', () => {
    expect(manifest.files).toContain('dist');
    expect(manifest.files.some((entry: string) => entry.startsWith('!'))).toBe(false);
  });

  it('does not export the deep dist path', () => {
    const deepKeys = Object.keys(manifest.exports).filter(key => key.startsWith('./dist'));
    expect(deepKeys).toEqual([]);
  });

  it('does not mark the stylesheet as side-effect free', () => {
    const { sideEffects } = manifest;
    if (sideEffects === undefined) {
      return;
    }
    expect(sideEffects).not.toBe(false);
    expect(Array.isArray(sideEffects) && sideEffects.some(matchesStylesheet)).toBe(true);
  });

  it('stays private', () => {
    expect(manifest.private).toBe(true);
  });
});

describe('sideEffects glob matching', () => {
  it('accepts globs that reach dist/style.css', () => {
    expect(['**/*.css', 'dist/*.css', './dist/style.css'].every(matchesStylesheet)).toBe(true);
  });

  it('rejects a root level css glob', () => {
    expect(matchesStylesheet('*.css')).toBe(false);
  });
});
