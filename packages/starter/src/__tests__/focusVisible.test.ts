import { describe, expect, it } from 'vitest';
import { compiledStylesheet } from './helpers/compiledStylesheet';

const stylesheet = compiledStylesheet;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every `{...}` block whose selector matches, concatenated (a stylesheet can declare the same selector more than once). Whitespace in the selector (e.g. after a comma) tolerates the line breaks sass-embedded inserts. */
function blocksOf(selector: string): string {
  const escaped = selector.split(/\s+/).map(escapeRegex).join('\\s*');
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g');
  let combined = '';
  for (const match of stylesheet.matchAll(regex))
    combined += `${match[1]}\n`;
  return combined;
}

function variableIn(block: string, name: string) {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(block);
  return match?.[1]?.trim();
}

/** Strips comments so a check against declared values is not tripped up by a comment mentioning the old value. */
function declarationsOf(selector: string): string {
  return blocksOf(selector).replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('focus tokens', () => {
  it.each([
    ['--sft-focus-visible', '#0084d1', '#38bdf8'],
    ['--sft-focus-visible-choice', '#4f39f6', '#a3b3ff'],
  ])('declares %s as %s in light mode and %s in dark mode', (name, light, dark) => {
    expect(variableIn(blocksOf(':root'), name)).toBe(light);
    expect(variableIn(blocksOf(':root.dark'), name)).toBe(dark);
  });

  it('routes every sky-scoped focus-visible rule through --sft-focus-visible, never the choice token', () => {
    for (const selector of ['.sft-password-toggle:focus-visible', '.sft-btn:focus-visible', '.sft-switch:focus-visible .sft-switch-track', '[data-page]:focus-visible', '.sft-file-clear:focus-visible'])
      expect(blocksOf(selector)).toContain('var(--sft-focus-visible)');
  });

  it('scopes --sft-focus-visible-choice to the choice card alone', () => {
    expect(blocksOf('.sft-choice-card:focus-visible')).toContain('var(--sft-focus-visible-choice)');

    const sites = ['.sft-password-toggle:focus-visible', '.sft-btn:focus-visible', '.sft-switch:focus-visible .sft-switch-track', '[data-page]:focus-visible', '.sft-step:focus-visible .sft-step-dot'];
    for (const selector of sites)
      expect(blocksOf(selector)).not.toContain('--sft-focus-visible-choice');
  });
});

describe('outline-group controls (:focus-visible, never a bare :focus ring)', () => {
  it.each([
    ['.sft-password-toggle', '2px'],
    ['.sft-btn', '2px'],
    ['.sft-file-clear', '2px'],
  ])('%s gets a 2px solid outline with a %s offset on :focus-visible', (selector, offset) => {
    const block = blocksOf(`${selector}:focus-visible`);
    expect(block).toMatch(/outline:\s*2px solid var\(--sft-focus-visible\)/);
    expect(block).toMatch(new RegExp(`outline-offset:\\s*${offset}`));
  });

  it('the stepper dot gets a 3px offset outline on :focus-visible', () => {
    const block = blocksOf('.sft-step:focus-visible .sft-step-dot');
    expect(block).toMatch(/outline:\s*2px solid var\(--sft-focus-visible\)/);
    expect(block).toMatch(/outline-offset:\s*3px/);
  });

  it('the toggle switch track gets a 2px offset outline on :focus-visible', () => {
    const block = blocksOf('.sft-switch:focus-visible .sft-switch-track');
    expect(block).toMatch(/outline:\s*2px solid var\(--sft-focus-visible\)/);
    expect(block).toMatch(/outline-offset:\s*2px/);
  });

  it('the wizard page container gets a 4px offset outline on :focus-visible', () => {
    const block = blocksOf('[data-page]:focus-visible');
    expect(block).toMatch(/outline:\s*2px solid var\(--sft-focus-visible\)/);
    expect(block).toMatch(/outline-offset:\s*4px/);
  });

  it('none of the outline-group controls paint a ring on a bare :focus', () => {
    for (const selector of ['.sft-password-toggle', '.sft-btn', '.sft-step', '.sft-switch', '.sft-file-clear'])
      expect(blocksOf(`${selector}:focus`)).toBe('');
  });
});

describe('input and select focus (:focus, not :focus-visible, matching the conventional text-field behaviour)', () => {
  it('sets border-color and box-shadow on :focus, with no outline', () => {
    const block = blocksOf('.sft-input:focus, .sft-select:focus');
    expect(block).toMatch(/border-color:\s*var\(--sft-focus-visible\)/);
    expect(block).toMatch(/box-shadow:\s*0 0 0 2px var\(--sft-focus-ring\)/);
    expect(block).toMatch(/outline:\s*none/);
    expect(block).not.toMatch(/outline:\s*2px solid/);
  });

  it('keeps the plain :focus rule rather than removing or swapping it for :focus-visible', () => {
    expect(stylesheet).toMatch(/\.sft-input:focus,\s*\.sft-select:focus\s*\{/);
  });

  it('no longer references the shipped --sft-focus-border on :focus', () => {
    const block = declarationsOf('.sft-input:focus, .sft-select:focus');
    expect(block).not.toContain('--sft-focus-border');
  });
});

describe('choice card focus (offset outline on :focus-visible, so the selected box-shadow ring stays visible underneath)', () => {
  it('sets a 2px offset outline in the choice token, with no box-shadow of its own', () => {
    const block = blocksOf('.sft-choice-card:focus-visible');
    expect(block).toMatch(/outline:\s*2px solid var\(--sft-focus-visible-choice\)/);
    expect(block).toMatch(/outline-offset:\s*2px/);
    expect(block).not.toMatch(/box-shadow/);
  });

  it('no longer references the shipped pale --sft-choice-ring for its focus state', () => {
    const block = declarationsOf('.sft-choice-card:focus-visible');
    expect(block).not.toContain('--sft-choice-ring');
  });

  it('has no selected-state focus override: the outline must not compete with the selected ring', () => {
    expect(blocksOf('.sft-choice-card.is-selected:focus-visible')).toBe('');
  });
});

describe('pre-existing shipped focus rules are replaced, not left to survive alongside the new ones', () => {
  it('drops the primary button double ring; it relies on the shared .sft-btn outline instead', () => {
    expect(stylesheet).not.toContain('0 0 0 4px #74d4ff');
  });

  it('the switch track outline no longer hardcodes a color', () => {
    const block = blocksOf('.sft-switch:focus-visible .sft-switch-track');
    expect(block).not.toContain('#00a6f4');
  });
});

describe('wizard page container focus target', () => {
  it('ships its own [data-page]:focus-visible ring', () => {
    expect(blocksOf('[data-page]:focus-visible')).not.toBe('');
  });

  it('does not ship a heading-focus ring: no per-page heading inside [data-page] is guaranteed to exist', () => {
    expect(blocksOf('.sft-wizard-title:focus-visible')).toBe('');
    expect(blocksOf('.sft-section-title:focus-visible')).toBe('');
  });
});

describe('.sft-sr-only', () => {
  it('clips content offscreen with a zero-size box, kept in the accessibility tree', () => {
    const block = blocksOf('.sft-sr-only');
    expect(block).toMatch(/position:\s*absolute/);
    expect(block).toMatch(/width:\s*1px/);
    expect(block).toMatch(/height:\s*1px/);
    expect(block).toMatch(/overflow:\s*hidden/);
  });

  it('never uses display:none or visibility:hidden, both of which a screen reader skips too', () => {
    const block = blocksOf('.sft-sr-only');
    expect(block).not.toMatch(/display:\s*none/);
    expect(block).not.toMatch(/visibility:\s*hidden/);
  });
});

describe('dark mode needs no overrides beyond the two tokens', () => {
  const sites = [
    '.sft-input:focus, .sft-select:focus',
    '.sft-password-toggle:focus-visible',
    '.sft-btn:focus-visible',
    '.sft-switch:focus-visible .sft-switch-track',
    '.sft-step:focus-visible .sft-step-dot',
    '.sft-choice-card:focus-visible',
    '[data-page]:focus-visible',
    '.sft-file-clear:focus-visible',
  ];

  it.each(sites)('%s has no :root.dark override of its own; it resolves through the shared tokens', (selector) => {
    expect(blocksOf(`:root.dark ${selector}`)).toBe('');
  });
});
