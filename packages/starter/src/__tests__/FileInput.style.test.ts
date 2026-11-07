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

describe('sft-file-* styling', () => {
  it('visually hides the native input while keeping it in the accessibility tree', () => {
    const block = blockOf('.sft-file-native');
    expect(block).not.toBe('');
    expect(block).toContain('position: absolute');
    expect(block).not.toContain('display: none');
    expect(block).not.toContain('visibility: hidden');
  });

  // Asserts the shared token directly, not a textual match against .sft-textarea:focus: that
  // selector belongs to a different, independently shippable slice, and this rule must hold
  // regardless of whether that one has landed yet.
  it('rings the trigger with the shared sky focus-ring token on keyboard focus', () => {
    const block = blockOf('.sft-file-trigger:focus-within');
    expect(block).not.toBe('');
    expect(block).toContain('var(--sft-focus-ring)');
  });

  it('swaps the focus ring to the danger token when the field is invalid', () => {
    const block = blockOf('.sft-file.is-invalid .sft-file-trigger:focus-within');
    expect(block).not.toBe('');
    expect(block).toContain('var(--sft-danger-ring)');
    expect(block).not.toContain('var(--sft-focus-ring)');
  });

  it('puts the danger border and text on the trigger when invalid, never on the hidden native input', () => {
    const block = blockOf('.sft-file.is-invalid .sft-file-trigger');
    expect(block).toContain('var(--sft-danger-border)');
    expect(blockOf('.sft-file-native')).not.toContain('var(--sft-danger-border)');
  });

  it('shows the empty-state filename in a muted color', () => {
    expect(blockOf('.sft-file-name.is-empty')).toContain('var(--sft-text-subtle)');
  });

  it('makes the trigger not-allowed when the field is disabled, and gates the hover restyle back to resting', () => {
    expect(blockOf('.sft-file.is-disabled .sft-file-trigger')).toContain('cursor: not-allowed');

    const hoverBlock = blockOf('.sft-file.is-disabled .sft-file-trigger:hover');
    expect(hoverBlock).not.toBe('');
    expect(hoverBlock).not.toContain('cursor');
  });

  // The light-mode gate above alone is not enough: .sft-btn-default's own dark
  // :hover rule has higher specificity than a bare dark :hover on the trigger,
  // so without this more specific selector the disabled trigger would still
  // darken on hover in dark mode.
  it('repeats the hover gate under :root.dark so the disabled trigger stays resting in dark mode too', () => {
    const block = blockOf(':root.dark .sft-file.is-disabled .sft-file-trigger:hover');
    expect(block).not.toBe('');
    expect(block).toContain('var(--sft-card-bg)');
    expect(block).not.toContain('cursor');
  });
});
