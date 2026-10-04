import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles } from './helpers/sourceScan';

const vueFiles = collectSourceFiles([fileURLToPath(import.meta.url)]).filter(file => file.path.endsWith('.vue'));

describe('no scoped styles', () => {
  it('scans a non-empty set of vue files', () => {
    expect(vueFiles.length).toBeGreaterThan(0);
  });

  it('never uses <style scoped>', () => {
    const hits = vueFiles.filter(file => /<style\s+scoped/.test(file.content)).map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });
});
