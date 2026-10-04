import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles, extractClassTokens, packageDirectory } from './helpers/sourceScan';

const vueFiles = collectSourceFiles([fileURLToPath(import.meta.url)]).filter(file => file.path.endsWith('.vue'));
const stylesheet = readFileSync(path.join(packageDirectory, 'src/style.css'), 'utf8');

function stylesheetSelectors() {
  const stripped = stylesheet.replace(/\{[^}]*\}/g, '{}').replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set([...stripped.matchAll(/\.([a-z_][\w-]*)/gi)].map(match => match[1]));
}

describe('class usage against the shipped stylesheet', () => {
  it('scans a non-empty set of vue files', () => {
    expect(vueFiles.length).toBeGreaterThan(0);
  });

  it('every sft- or is- class referenced in a component exists in the stylesheet', () => {
    const selectors = stylesheetSelectors();
    const missing: string[] = [];

    for (const file of vueFiles) {
      for (const token of extractClassTokens(file.content)) {
        if ((token.startsWith('sft-') || token.startsWith('is-')) && !selectors.has(token))
          missing.push(`${path.basename(file.path)}: ${token}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
