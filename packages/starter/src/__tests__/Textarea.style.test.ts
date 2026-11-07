import { describe, expect, it } from 'vitest';
import { compiledStylesheet } from './helpers/compiledStylesheet';

/**
 * Maps each individual selector (split out of its comma-separated rule) to its declaration
 * body. Needed because `.sft-textarea` appears both as its own rule and as one entry in the
 * shared font-family selector list, and a naive "find this selector then grab until the next
 * closing brace" search would latch onto the wrong one.
 */
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

function declarationsOf(block: string, property: string) {
  return [...block.matchAll(new RegExp(`(?<![\\w-])${property}:\\s*([^;]+);`, 'g'))].map(match => match[1].trim());
}

const sharedProperties = ['border', 'border-color', 'background', 'color', 'box-shadow', 'outline'];

describe('sft-textarea matches sft-input\'s state tokens', () => {
  it.each([
    ['resting', '.sft-textarea', '.sft-input'],
    ['focus', '.sft-textarea:focus', '.sft-input:focus'],
    ['disabled', '.sft-textarea:disabled', '.sft-input:disabled'],
    ['invalid', '.sft-textarea.is-invalid', '.sft-input.is-invalid'],
    ['invalid focus', '.sft-textarea.is-invalid:focus', '.sft-input.is-invalid:focus'],
  ])('%s block reads the same chrome tokens as the text input', (_state, textareaSelector, inputSelector) => {
    const textareaBlock = blockOf(textareaSelector);
    const inputBlock = blockOf(inputSelector);

    expect(textareaBlock).not.toBe('');
    expect(inputBlock).not.toBe('');
    for (const property of sharedProperties)
      expect(declarationsOf(textareaBlock, property)).toEqual(declarationsOf(inputBlock, property));
  });

  it('has no fixed height, uses a 104px minimum instead', () => {
    const block = blockOf('.sft-textarea');
    expect(declarationsOf(block, 'height')).toEqual([]);
    expect(declarationsOf(block, 'min-height')).toEqual(['104px']);
  });

  it('is resizable vertically at rest and loses the handle when disabled', () => {
    expect(declarationsOf(blockOf('.sft-textarea'), 'resize')).toEqual(['vertical']);
    expect(declarationsOf(blockOf('.sft-textarea:disabled'), 'resize')).toEqual(['none']);
  });

  it('sets a 1.5 line height, which the text input does not need', () => {
    expect(declarationsOf(blockOf('.sft-textarea'), 'line-height')).toEqual(['1.5']);
  });

  it('mirrors the text input\'s mobile-first font-size rule', () => {
    expect(declarationsOf(blockOf('.sft-textarea'), 'font-size')).toEqual(declarationsOf(blockOf('.sft-input'), 'font-size'));

    const mdBlockMatch = /@media \(min-width: 768px\) \{\s*\.sft-textarea \{([^}]*)\}/.exec(compiledStylesheet);
    const inputMdBlockMatch = /@media \(min-width: 768px\) \{\s*\.sft-input,\s*\.sft-select \{([^}]*)\}/.exec(compiledStylesheet);

    expect(mdBlockMatch).not.toBeNull();
    expect(inputMdBlockMatch).not.toBeNull();
    expect(declarationsOf(mdBlockMatch?.[1] ?? '', 'font-size')).toEqual(declarationsOf(inputMdBlockMatch?.[1] ?? '', 'font-size'));
  });

  it('inherits the host font family like every other control', () => {
    expect(declarationsOf(blockOf('.sft-textarea'), 'font-family')).toEqual(['inherit']);
  });
});
