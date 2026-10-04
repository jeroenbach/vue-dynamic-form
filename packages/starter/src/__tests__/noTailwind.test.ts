import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles, extractClassTokens, packageDirectory } from './helpers/sourceScan';

const utilityPatterns = [
  /^(?:m|p)[xytblr]?-\d/,
  /^gap(?:-[xy])?-/,
  /^text-(?:xs|sm|base|lg|xl|\dxl)$/,
  /^font-(?:medium|semibold|bold)$/,
  /^(?:flex|grid|hidden|block|inline-flex|inline-block)$/,
  /^(?:items|justify)-/,
  /^flex-(?:wrap|col|row|1)$/,
  /^(?:ms|me|ps|pe)-\d/,
  /^border(?:-[a-z])?-\d/,
  /^(?:text|bg)-(?:red|slate|gray|indigo|blue|green)-\d/,
  /^(?:grid-cols|col-span|md:|dark:)/,
];

const sources = collectSourceFiles([fileURLToPath(import.meta.url)]);

function tokensByFile() {
  return sources.map(file => ({ path: file.path, tokens: extractClassTokens(file.content) }));
}

describe('tailwind removal', () => {
  it('scans a non-empty set of source files', () => {
    expect(sources.some(file => file.path.endsWith('StarterIcon.vue'))).toBe(true);
  });

  it('does not use any utility-style class from a known pattern set', () => {
    const hits = tokensByFile().flatMap(file => file.tokens.filter(token => utilityPatterns.some(pattern => pattern.test(token))).map(token => `${path.basename(file.path)}: ${token}`));
    expect(hits).toEqual([]);
  });

  it('has no apply or tailwind directives in style blocks or the stylesheet', () => {
    const directive = /@apply|@tailwind|@import\s+['"]tailwindcss/;
    const styleFiles = [...sources, { path: path.join(packageDirectory, 'src/style.css'), content: readFileSync(path.join(packageDirectory, 'src/style.css'), 'utf8') }];
    const hits = styleFiles.filter(file => directive.test(file.content)).map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });

  it('contains only sft- prefixed classes, is-* state modifiers, and the plain selectors they are nested under', () => {
    const stylesheet = readFileSync(path.join(packageDirectory, 'src/style.css'), 'utf8');
    const selectors = stylesheet.replace(/\{[^}]*\}/g, '{}').replace(/\/\*[\s\S]*?\*\//g, '');
    const classNames = [...selectors.matchAll(/\.([a-z_][\w-]*)/gi)].map(match => match[1]);
    // `dark` is the ancestor class VitePress toggles on <html>; `grow`/`cols-2` are
    // structural qualifiers on the prototype's own markup, not Tailwind utilities.
    const knownNonPrefixed = new Set(['dark', 'grow', 'cols-2']);
    const foreign = classNames.filter(name => !name.startsWith('sft-') && !name.startsWith('is-') && !knownNonPrefixed.has(name));
    expect(foreign).toEqual([]);
  });

  it('declares no tailwind dependency', () => {
    const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
    const names = ['dependencies', 'devDependencies', 'peerDependencies'].flatMap(field => Object.keys(manifest[field] ?? {}));
    expect(names.filter(name => name.includes('tailwind'))).toEqual([]);
  });

  it('has no tailwind or postcss config file', () => {
    const configFiles = readdirSync(packageDirectory).filter(name => /^(?:tailwind|postcss)\.config\./.test(name));
    expect(configFiles).toEqual([]);
    expect(readFileSync(path.join(packageDirectory, 'vite.config.ts'), 'utf8').toLowerCase()).not.toContain('tailwind');
  });
});
