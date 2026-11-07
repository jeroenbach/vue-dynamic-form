import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Plain text/structure checks over the starter template docs. No markdown
// parser: the same substring-and-regex technique the package README test
// already uses. The theming contract lives in three places (the package
// README, the Settings & Theming reference page, and the stylesheet's own
// guard test); these checks keep the two markdown copies mirrored.

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const repoRoot = path.resolve(docsRoot, '..');

const guide = readFileSync(path.join(docsRoot, 'guide/starter-template.md'), 'utf8');
const referenceIndex = readFileSync(path.join(docsRoot, 'reference/index.md'), 'utf8');
const themingReference = readFileSync(path.join(docsRoot, 'reference/starter-settings-theming.md'), 'utf8');
const formTemplateReference = readFileSync(path.join(docsRoot, 'reference/starter-form-template.md'), 'utf8');
const fieldTypesReference = readFileSync(path.join(docsRoot, 'reference/starter-field-types.md'), 'utf8');
const extendMetadataReference = readFileSync(path.join(docsRoot, 'reference/starter-extend-metadata.md'), 'utf8');
const starterReadme = readFileSync(path.join(repoRoot, 'packages/starter/README.md'), 'utf8');

function sftVariableNames(markdown: string): string[] {
  const matches = markdown.matchAll(/--sft-[\w-]+/g);
  return [...new Set([...matches].map(m => m[0]))].sort();
}

describe('reference index links every starter reference page', () => {
  it.each([
    '/reference/starter-form-template',
    '/reference/starter-field-types',
    '/reference/starter-field-properties',
    '/reference/starter-settings-theming',
    '/reference/starter-extend-metadata',
  ])('has a row for %s with a non-empty description', (link) => {
    const row = referenceIndex.split('\n').find(line => line.includes(link));
    expect(row).toBeDefined();
    const cells = row!.split('|').map(cell => cell.trim()).filter(Boolean);
    expect(cells.length).toBeGreaterThanOrEqual(2);
    expect(cells[1].length).toBeGreaterThan(0);
  });
});

describe('starter reference pages document the existing public surface', () => {
  it('documents the metadataConfiguration prop', () => {
    expect(formTemplateReference).toContain('## Props');
    expect(formTemplateReference).toContain('metadataConfiguration');
  });

  it('lists the slot family', () => {
    expect(formTemplateReference).toContain('## Slot resolution');
    expect(formTemplateReference).toContain('`default-input`');
  });

  it('lists every built-in field type, including the newest controls', () => {
    for (const type of ['`text`', '`select`', '`radio`', '`checkbox`', '`password`', '`textarea`', '`file`', '`heading`', '`grid`', '`wizardSummaryPage`'])
      expect(fieldTypesReference).toContain(type);
  });

  it('documents the extendMetadata generics signature and both caveats', () => {
    expect(extendMetadataReference).toContain('extendMetadata<');
    expect(extendMetadataReference).toContain('## Collision semantics');
    expect(extendMetadataReference).toContain('## Reserved names');
  });
});

describe('theming reference page mirrors the README theming contract', () => {
  it('carries the same 58 --sft-* variable names as the README', () => {
    const readmeVariables = sftVariableNames(starterReadme);
    const referenceVariables = sftVariableNames(themingReference);
    expect(readmeVariables).toHaveLength(58);
    expect(referenceVariables).toEqual(readmeVariables);
  });

  it('covers the keyboard focus tokens and the full radius scale', () => {
    const names = sftVariableNames(themingReference);
    for (const name of ['--sft-focus-visible', '--sft-focus-visible-choice', '--sft-radius-xs', '--sft-radius-pill'])
      expect(names).toContain(name);
  });

  it('states both semver directions', () => {
    expect(themingReference).toContain('adding a new `--sft-*` variable is a minor change');
    expect(themingReference).toContain('Renaming or removing one is a major change');
  });

  it('shows a radius and a font-size override in the copyable example', () => {
    const theming = themingReference.slice(themingReference.indexOf('## Theming with CSS variables'));
    const example = theming.slice(0, theming.indexOf('```\n', theming.indexOf('```css')));
    expect(example).toMatch(/--sft-radius-/);
    expect(example).toMatch(/--sft-font-size-/);
  });
});

describe('guide theming section stays a short how-to with a link', () => {
  it('shows one representative radius and typography override, not the full list', () => {
    const customization = guide.slice(guide.indexOf('## Make it yours'));
    expect(customization.match(/--sft-radius-/g)).toHaveLength(1);
    expect(customization.match(/--sft-font-size-/g)).toHaveLength(1);
  });

  it('still contains the kept CSS override example', () => {
    expect(guide).toContain('--sft-accent:');
  });

  it('links to the theming reference page', () => {
    expect(guide).toContain('/reference/starter-settings-theming');
  });
});
