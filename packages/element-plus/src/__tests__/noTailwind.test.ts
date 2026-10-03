import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectSourceFiles, extractClassTokens, packageDirectory } from './helpers/sourceScan';

const removedUtilities = ['flex', 'items-center', 'gap-2', 'my-4', 'text-lg', 'font-semibold', 'mb-2', 'flex-col'];

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

describe('class token extractor', () => {
  it('finds utility classes in static, bound, and render-code class definitions', () => {
    expect(extractClassTokens('<div class="flex items-center">')).toEqual(['flex', 'items-center']);
    expect(extractClassTokens(`<div :class="['my-4', cond ? 'mb-2' : '']">`)).toEqual(['my-4', 'mb-2']);
    expect(extractClassTokens(`h('div', { class: 'gap-2 flex-col' })`)).toEqual(['gap-2', 'flex-col']);
  });

  it('finds the utility classes most likely to be copied from other templates', () => {
    const tokens = extractClassTokens('<div class="flex-wrap ms-6 ps-2 border-s-2 text-red-500 grid">');
    expect(tokens).toEqual(['flex-wrap', 'ms-6', 'ps-2', 'border-s-2', 'text-red-500', 'grid']);
    expect(tokens.every(token => utilityPatterns.some(pattern => pattern.test(token)))).toBe(true);
  });

  it('does not treat similarly named attributes as class definitions', () => {
    expect(extractClassTokens('<div data-class="flex" subclass="flex">')).toEqual([]);
  });
});

describe('tailwind removal', () => {
  it('scans a non-empty set of source files', () => {
    expect(sources.some(file => file.path.endsWith('ElementPlusFormTemplate.vue'))).toBe(true);
  });

  it('does not use the removed utility classes', () => {
    const hits = tokensByFile().flatMap(file => file.tokens.filter(token => removedUtilities.includes(token)).map(token => `${path.basename(file.path)}: ${token}`));
    expect(hits).toEqual([]);
  });

  it('does not use any utility-style class from a known pattern set', () => {
    const hits = tokensByFile().flatMap(file => file.tokens.filter(token => utilityPatterns.some(pattern => pattern.test(token))).map(token => `${path.basename(file.path)}: ${token}`));
    expect(hits).toEqual([]);
  });

  it('has no apply or tailwind directives in style blocks', () => {
    const directive = /@apply|@tailwind|@import\s+['"]tailwindcss/;
    const hits = sources.filter(file => directive.test(file.content)).map(file => path.basename(file.path));
    expect(hits).toEqual([]);
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

describe('element plus peer range', () => {
  it('does not use layout components missing from the supported peer range', () => {
    const banned = /\bElSpace\b|\bElRow\b|\bElCol\b|\bel-space\b|\bel-row\b|\bel-col\b/;
    const hits = sources.filter(file => banned.test(file.content)).map(file => path.basename(file.path));
    expect(hits).toEqual([]);
  });
});
