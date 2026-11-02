import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { starterIconNames } from '@bach.software/vue-dynamic-form-starter';
import { describe, expect, it } from 'vitest';

// Structural guards for the docs theme's use of @bach.software/vue-dynamic-form-starter: it
// must keep consuming the package's icon registry and stylesheet correctly, and the one
// template-chrome file this theme fully ported (AdvancedForm.vue) must stay Tailwind-free.
// The rest of the theme keeps its own Tailwind usage.

const themeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(themeDir, 'components');
const themeIndexPath = path.join(themeDir, 'index.ts');
const customCssPath = path.join(themeDir, 'custom.css');

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

const quotedStrings = /'([^']*)'|`([^`]*)`/g;

function splitTokens(value: string) {
  return value.split(/\s+/).filter(Boolean);
}

function extractClassTokens(source: string): string[] {
  const tokens: string[] = [];

  for (const match of source.matchAll(/(?<![:\w-])class\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
    tokens.push(...splitTokens(match[1] ?? match[2] ?? ''));

  for (const match of source.matchAll(/(?:v-bind)?:class\s*=\s*"([^"]*)"/g)) {
    for (const literal of match[1].matchAll(quotedStrings))
      tokens.push(...splitTokens(literal[1] ?? literal[2] ?? ''));
  }

  return tokens;
}

function collectVueFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...collectVueFiles(fullPath));
    else if (entry.name.endsWith('.vue'))
      files.push(fullPath);
  }
  return files;
}

describe('starter package dogfooding', () => {
  it('only uses iconName values the starter package registry knows', () => {
    const hits: string[] = [];
    for (const filePath of collectVueFiles(componentsDir)) {
      const content = readFileSync(filePath, 'utf8');
      for (const match of content.matchAll(/iconName:\s*'([^']+)'/g)) {
        if (!(starterIconNames as readonly string[]).includes(match[1]))
          hits.push(`${path.basename(filePath)}: iconName '${match[1]}'`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('imports the starter stylesheet exactly once', () => {
    const stylesheetMarker = 'vue-dynamic-form-starter/style.css';
    const themeIndexContent = readFileSync(themeIndexPath, 'utf8');
    const customCssContent = readFileSync(customCssPath, 'utf8');
    const importCount
      = [...themeIndexContent.matchAll(new RegExp(stylesheetMarker, 'g'))].length
        + [...customCssContent.matchAll(new RegExp(stylesheetMarker, 'g'))].length;
    expect(importCount).toBe(1);
  });

  it('keeps the rest of the theme on Tailwind', () => {
    const customCssContent = readFileSync(customCssPath, 'utf8');
    expect(customCssContent).toContain('@import \'tailwindcss\';');
  });

  it('keeps AdvancedForm.vue, the fully ported template chrome file, free of Tailwind utility classes', () => {
    const content = readFileSync(path.join(componentsDir, 'AdvancedForm.vue'), 'utf8');
    const hits = extractClassTokens(content).filter(token => utilityPatterns.some(pattern => pattern.test(token)));
    expect(hits).toEqual([]);
  });
});
