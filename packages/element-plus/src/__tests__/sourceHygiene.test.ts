import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles } from './helpers/sourceScan';

const sources = collectSourceFiles([fileURLToPath(import.meta.url)]);

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
  it('contains no em dashes', () => {
    const hits = sources.filter(file => file.content.includes(emDash)).map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });

  it('contains no references to process artifacts', () => {
    const hits = sources
      .filter(file => processReferences.some(pattern => pattern.test(file.content)))
      .map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });
});
