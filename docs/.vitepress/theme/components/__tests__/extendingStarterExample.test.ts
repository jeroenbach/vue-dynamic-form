import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Guards the "Extending The Starter Template" example: its custom-type demo must
// teach a type the starter genuinely does not ship. textarea moved into the built-in
// catalogue, so this example now extends with range instead, keeping rating as the
// second custom type.

const componentsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.resolve(componentsDir, '..', '..', '..');

const metadataTsPath = path.join(componentsDir, 'ProjectFormTemplate.ts');
const templateVuePath = path.join(componentsDir, 'ProjectFormTemplate.vue');
const fieldsVuePath = path.join(componentsDir, 'FormExampleProjectFields.vue');
const exampleMdPath = path.join(docsDir, 'guide', 'extending-starter.md');

function extractTemplateBlock(source: string, slotName: string): string {
  const pattern = new RegExp(`<template #${slotName}="[^"]*">([\\s\\S]*?)</template>`);
  const match = source.match(pattern);
  if (!match)
    throw new Error(`could not find a <template #${slotName}> block`);
  return match[1];
}

describe('extending-starter.md example', () => {
  it('declares range instead of textarea, keeping rating unchanged', () => {
    const content = readFileSync(metadataTsPath, 'utf8');

    expect(content).toContain('range: string');
    expect(content).not.toContain('textarea: string');
    expect(content).not.toContain('rows?: number');
    expect(content).toContain('rating: number');
    expect(content).toContain('maxRating?: number');
  });

  it('declares a range-relevant property on the extended configuration', () => {
    const content = readFileSync(metadataTsPath, 'utf8');

    expect(content).toMatch(/\bstep\?:\s*number/);
  });

  it('wraps a range-input slot with a native range control and a value readout', () => {
    const content = readFileSync(templateVuePath, 'utf8');

    expect(content).not.toMatch(/<template #textarea-input/);

    const block = extractTemplateBlock(content, 'range-input');
    expect(block).toMatch(/type="range"/);
    // The readout is a separate element from the control itself, reflecting the current value.
    expect(block).toMatch(/<output[^>]*>[\s\S]*fieldContext\.value\.value[\s\S]*<\/output>/);
  });

  it('keeps the rating slot unchanged', () => {
    const content = readFileSync(templateVuePath, 'utf8');
    const block = extractTemplateBlock(content, 'rating-input');

    expect(block).toContain('role="radio"');
    expect(block).toContain('ratingStar');
    expect(block).toContain('fieldMetadata.maxRating');
  });

  it('uses the range type in the example metadata, keeping the rating field', () => {
    const content = readFileSync(fieldsVuePath, 'utf8');

    expect(content).not.toContain('type: \'textarea\'');
    expect(content).toContain('type: \'range\'');
    expect(content).toContain('type: \'rating\'');
  });

  it('no file narrates textarea as a custom type', () => {
    const files = [metadataTsPath, templateVuePath, fieldsVuePath, exampleMdPath];

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf8');
      expect(content.toLowerCase()).not.toContain('textarea');
    }
  });

  it('prose mentions range in the intro, the demonstrates list, and the walkthrough', () => {
    const content = readFileSync(exampleMdPath, 'utf8');
    const lower = content.toLowerCase();

    expect(lower).toContain('range');
    expect(lower).not.toContain('rows');
  });
});
