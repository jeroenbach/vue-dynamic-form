import { describe, expect, it } from 'vitest';
import { compiledStylesheet } from './helpers/compiledStylesheet';

/** Maps each individual selector (split out of its comma-separated rule) to its declaration body. */
function ruleMap(rawCss: string) {
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map<string, string>();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const rawSelector of match[1].split(',')) {
      const selector = rawSelector.trim();
      if (!selector || selector.startsWith('@'))
        continue;
      map.set(selector, (map.get(selector) ?? '') + match[2]);
    }
  }
  return map;
}

const rules = ruleMap(compiledStylesheet);

function blockOf(selector: string) {
  return rules.get(selector) ?? '';
}

/** Every selector block whose selector starts with `.sft-radio`, concatenated for a broad "never contains" check. */
const radioBlocks = [...rules.entries()]
  .filter(([selector]) => selector.startsWith('.sft-radio'))
  .map(([, block]) => block)
  .join('\n');

describe('sft-radio-* styling', () => {
  it('uses the sky accent on the selected option and its dot, never the indigo choice accent', () => {
    expect(blockOf('.sft-radio-option.is-selected')).toContain('var(--sft-accent)');
    expect(blockOf('.sft-radio-dot')).toContain('var(--sft-accent)');
    expect(radioBlocks).not.toContain('var(--sft-choice)');
  });

  it('rings the circle with a 2px sky outline on keyboard focus', () => {
    const block = blockOf('.sft-radio-input:focus-visible + .sft-radio-control');
    expect(block).not.toBe('');
    expect(block).toContain('outline: 2px solid var(--sft-focus-border)');
    expect(block).toContain('outline-offset: 2px');
  });

  it('swaps the focus outline to a danger token when the group is invalid', () => {
    const block = blockOf('.sft-radio-group.is-invalid .sft-radio-input:focus-visible + .sft-radio-control');
    expect(block).not.toBe('');
    expect(block).not.toContain('var(--sft-focus-border)');
    expect(block).toMatch(/var\(--sft-danger-[\w-]+\)/);
  });

  it('puts the danger border on the resting circles of an invalid group', () => {
    const block = blockOf('.sft-radio-group.is-invalid .sft-radio-control');
    expect(block).toContain('var(--sft-danger-border)');
  });

  it('visually hides the native input while keeping it in the accessibility tree', () => {
    const block = blockOf('.sft-radio-input');
    expect(block).toContain('position: absolute');
    expect(block).not.toContain('display: none');
    expect(block).not.toContain('visibility: hidden');
  });
});
