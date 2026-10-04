import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles } from './helpers/sourceScan';

// prototypeParity.test.ts locates the design source by its real folder path,
// which happens to carry the feature's folder name; that is a file-system
// reference, not a process citation, so it is excluded from this scan.
//
// ReviewGroup.vue renders a literal em dash as a table placeholder glyph for an
// empty value, a typographic use distinct from connecting clauses in prose, so
// it is excluded from the em-dash check specifically (it still runs the process
// reference check below).
const emDashExclusions = [path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ReviewGroup.vue')];
const sources = collectSourceFiles([
  fileURLToPath(import.meta.url),
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'prototypeParity.test.ts'),
]);

// Built from pieces so this file does not match its own patterns.
const emDash = String.fromCodePoint(0x2014);
const processReferences = [
  new RegExp(`${'FEAT'}-\\d`),
  new RegExp(`\\b${'ST'}-\\d`),
  new RegExp(`\\b${'AC'}\\d`),
  new RegExp(`${'ADR'}-\\d`),
  new RegExp(`${'finding'} \\d`, 'i'),
  new RegExp(`${'QA'} ${'plan'}`, 'i'),
  new RegExp(`${'decision'} \\d`, 'i'),
];

describe('source hygiene', () => {
  it('contains no em dashes, aside from the documented placeholder-glyph exception', () => {
    const excluded = new Set(emDashExclusions.map(file => path.resolve(file)));
    const hits = sources
      .filter(file => !excluded.has(path.resolve(file.path)))
      .filter(file => file.content.includes(emDash))
      .map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });

  it('contains no references to process artifacts', () => {
    const hits = sources
      .filter(file => processReferences.some(pattern => pattern.test(file.content)))
      .map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });
});
