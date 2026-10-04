import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const stylesheet = readFileSync(path.join(packageDirectory, 'src/style.css'), 'utf8');

function blockOf(selector: string) {
  const escaped = selector.replace(/\./g, '\\.');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(stylesheet);
  return match?.[1] ?? '';
}

function variableIn(block: string, name: string) {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
  return match?.[1]?.trim();
}

describe('theme variables live at document-root scope', () => {
  it('declares the variable block on :root', () => {
    expect(blockOf(':root')).toMatch(/--sft-text:/);
  });

  it('re-declares the dark overrides under :root.dark', () => {
    expect(blockOf(':root.dark')).toMatch(/--sft-card-bg:/);
  });

  it('never uses the superseded .sft-root selector', () => {
    expect(stylesheet).not.toContain('.sft-root');
  });
});

describe('decision A variable-driven color spots', () => {
  const rootBlock = blockOf(':root');
  const darkBlock = blockOf(':root.dark');

  // A variable not redeclared under :root.dark keeps its :root value for that
  // element once `.dark` is added, since both selectors target the same node.
  function effectiveDarkValue(name: string) {
    return variableIn(darkBlock, name) ?? variableIn(rootBlock, name);
  }

  it.each([
    '--sft-confirm-bg',
    '--sft-confirm-border',
    '--sft-confirm-text',
    '--sft-success-badge-bg',
    '--sft-success-badge-text',
    '--sft-pill-bg',
    '--sft-pill-text',
  ])('keeps %s identical between light and dark', (name) => {
    const rootValue = variableIn(rootBlock, name);
    expect(rootValue).toBeDefined();
    expect(effectiveDarkValue(name)).toBe(rootValue);
  });

  it('gives --sft-input-border no dark override', () => {
    expect(variableIn(darkBlock, '--sft-input-border')).toBeUndefined();
    expect(variableIn(rootBlock, '--sft-input-border')).toBeDefined();
  });
});

describe('full-width spans stay out of the single-column mobile grid', () => {
  it('declares no grid-column: span 2 outside the min-width: 768px media block', () => {
    const mediaBlocks = [...stylesheet.matchAll(/@media\s*\(min-width:\s*768px\)\s*\{([\s\S]*?)\n\}\n/g)].map(match => match[1]);
    let outsideMedia = stylesheet;
    for (const block of mediaBlocks)
      outsideMedia = outsideMedia.replace(block, '');

    expect(outsideMedia).not.toMatch(/grid-column:\s*span\s*2/);
  });

  it('full-width rules use grid-column: 1 / -1 so they only ever span what the grid actually has', () => {
    for (const selector of ['.sft-choice-grid', '.sft-choice-group', '.sft-choice-addbar', '.sft-review-group', '.sft-confirm', '.sft-success-hero', '.sft-timeline', '.sft-success-actions'])
      expect(blockOf(selector)).toMatch(/grid-column:\s*1\s*\/\s*-1/);
  });
});

describe('group separator', () => {
  it('ships a border-top rule for the nested group divider', () => {
    const block = blockOf('.sft-group');
    expect(block).toMatch(/border-top:/);
  });
});
