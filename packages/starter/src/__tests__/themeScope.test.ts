import { describe, expect, it } from 'vitest';
import { compiledStylesheet } from './helpers/compiledStylesheet';

const stylesheet = compiledStylesheet;

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
  it('declares no default grid-column span outside the min-width: 768px media block', () => {
    const mediaBlocks = [...stylesheet.matchAll(/@media\s*\(min-width:[^)]*\)\s*\{([\s\S]*?)\n\}\n/g)].map(match => match[1]);
    let outsideMedia = stylesheet;
    for (const block of mediaBlocks)
      outsideMedia = outsideMedia.replace(block, '');

    // Only the opt-in base-tier utilities may span columns at every width; a form author asks
    // for those explicitly per field. No default chrome rule may.
    const spanSelectors = [...outsideMedia.matchAll(/([^{}]+)\{[^}]*grid-column:\s*span\s+\d/g)]
      .map(match => match[1].trim());
    expect(spanSelectors.filter(selector => !selector.startsWith('.sft-span-base-'))).toEqual([]);
  });

  it('full-width rules use grid-column: 1 / -1 so they only ever span what the grid actually has', () => {
    for (const selector of ['.sft-choice-grid', '.sft-choice-group', '.sft-choice-addbar', '.sft-review-group', '.sft-confirm', '.sft-success-hero', '.sft-timeline', '.sft-success-actions'])
      expect(blockOf(selector)).toMatch(/grid-column:\s*1\s*\/\s*-1/);
  });
});

describe('stepper connector done state in dark mode', () => {
  it('re-declares the green done background for dark mode, where the dark base rule outweighs the single-class done state', () => {
    expect(blockOf('.sft-step-connector.is-done')).toMatch(/background:\s*#00bc7d/);
    expect(blockOf(':root.dark .sft-step-connector.is-done')).toMatch(/background:\s*#00bc7d/);
  });
});

describe('group separator', () => {
  it('ships a border-top rule for the nested group divider', () => {
    const block = blockOf('.sft-group');
    expect(block).toMatch(/border-top:/);
  });
});

describe('public theme contract', () => {
  const rootBlock = blockOf(':root');
  const darkBlock = blockOf(':root.dark');

  function effectiveDarkValue(name: string) {
    return variableIn(darkBlock, name) ?? variableIn(rootBlock, name);
  }

  // Pinned on purpose: this is the whole public --sft-* surface a consumer may
  // override. Adding, renaming, or removing a name must touch this list, which
  // is the deliberate gate that forces the README table and a changeset to
  // keep up with it.
  const CONTRACT_VARIABLES = [
    '--sft-accent',
    '--sft-accent-hover',
    '--sft-card-bg',
    '--sft-card-border',
    '--sft-card-shadow',
    '--sft-choice',
    '--sft-choice-border-hover',
    '--sft-choice-grad-bottom',
    '--sft-choice-grad-top',
    '--sft-choice-ring',
    '--sft-confirm-bg',
    '--sft-confirm-border',
    '--sft-confirm-text',
    '--sft-danger-border',
    '--sft-danger-focus-border',
    '--sft-danger-ring',
    '--sft-danger-soft-bg',
    '--sft-danger-soft-border',
    '--sft-danger-soft-hover-bg',
    '--sft-danger-soft-text',
    '--sft-danger-text',
    '--sft-focus-border',
    '--sft-focus-ring',
    '--sft-focus-visible',
    '--sft-focus-visible-choice',
    '--sft-font-mono',
    '--sft-font-size-2xl',
    '--sft-font-size-lg',
    '--sft-font-size-md',
    '--sft-font-size-sm',
    '--sft-font-size-xl',
    '--sft-font-size-xs',
    '--sft-font-weight-medium',
    '--sft-font-weight-semibold',
    '--sft-heading',
    '--sft-input-bg',
    '--sft-input-border',
    '--sft-input-disabled-bg',
    '--sft-input-disabled-text',
    '--sft-muted-bg',
    '--sft-muted-border',
    '--sft-pill-bg',
    '--sft-pill-text',
    '--sft-placeholder',
    '--sft-radius-lg',
    '--sft-radius-md',
    '--sft-radius-pill',
    '--sft-radius-sm',
    '--sft-radius-xl',
    '--sft-radius-xs',
    '--sft-success',
    '--sft-success-badge-bg',
    '--sft-success-badge-text',
    '--sft-text',
    '--sft-text-muted',
    '--sft-text-strong',
    '--sft-text-subtle',
    '--sft-track',
  ].sort();

  const NEW_RADIUS_AND_TYPOGRAPHY_TOKENS: [string, string][] = [
    ['--sft-radius-xs', '4px'],
    ['--sft-radius-sm', '6px'],
    ['--sft-radius-md', '8px'],
    ['--sft-radius-lg', '10px'],
    ['--sft-radius-xl', '12px'],
    ['--sft-radius-pill', '9999px'],
    ['--sft-font-mono', 'ui-monospace, SFMono-Regular, Menlo, monospace'],
    ['--sft-font-size-xs', '11px'],
    ['--sft-font-size-sm', '12px'],
    ['--sft-font-size-md', '14px'],
    ['--sft-font-size-lg', '18px'],
    ['--sft-font-size-xl', '20px'],
    ['--sft-font-size-2xl', '24px'],
    ['--sft-font-weight-medium', '500'],
    ['--sft-font-weight-semibold', '600'],
  ];

  it.each(NEW_RADIUS_AND_TYPOGRAPHY_TOKENS)('declares %s as %s on :root', (name, value) => {
    expect(variableIn(rootBlock, name)).toBe(value);
  });

  it('groups the new tokens under radius and typography banner comments placed after the colour groups', () => {
    const lastColourBanner = stylesheet.lastIndexOf('/* status */');
    const radiusBanner = stylesheet.indexOf('/* radius */');
    const typographyBanner = stylesheet.indexOf('/* typography */');

    expect(lastColourBanner).toBeGreaterThan(-1);
    expect(radiusBanner).toBeGreaterThan(lastColourBanner);
    expect(typographyBanner).toBeGreaterThan(radiusBanner);
  });

  it('pins the full public --sft-* name set declared on :root', () => {
    const declaredNames = [...new Set([...rootBlock.matchAll(/(--sft-[a-z0-9-]+):/g)].map(match => match[1]))].sort();

    const missing = CONTRACT_VARIABLES.filter(name => !declaredNames.includes(name));
    const unexpected = declaredNames.filter(name => !CONTRACT_VARIABLES.includes(name));

    expect({ missing, unexpected }).toEqual({ missing: [], unexpected: [] });
    expect(declaredNames).toEqual(CONTRACT_VARIABLES);
  });

  it.each(NEW_RADIUS_AND_TYPOGRAPHY_TOKENS)('gives %s no :root.dark override', (name) => {
    expect(variableIn(rootBlock, name)).toBeDefined();
    expect(variableIn(darkBlock, name)).toBeUndefined();
    expect(effectiveDarkValue(name)).toBe(variableIn(rootBlock, name));
  });

  it('never uses a var() fallback for a radius or typography token', () => {
    expect(stylesheet).not.toMatch(/var\(--sft-radius-[a-z]+,/);
    expect(stylesheet).not.toMatch(/var\(--sft-font-(?:size|weight)-[a-z0-9]+,/);
    expect(stylesheet).not.toMatch(/var\(--sft-font-mono,/);
  });

  it('leaves no in-scope radius, font-size, font-weight, or mono font-family literal outside :root/:root.dark', () => {
    const rootRule = /:root\s*\{[^}]*\}/;
    const darkRule = /:root\.dark\s*\{[^}]*\}/;
    const outsideRoot = stylesheet.replace(rootRule, '').replace(darkRule, '');

    expect(outsideRoot).not.toMatch(/border-radius:\s*(?:4px|6px|8px|9999px|10px|12px)\b/);
    expect(outsideRoot).not.toMatch(/font-size:\s*(?:11px|12px|14px|18px|20px|24px)\b/);
    expect(outsideRoot).not.toMatch(/font-weight:\s*(?:500|600)\b/);
    expect(outsideRoot).not.toMatch(/font-family:\s*ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*monospace/);
  });

  it('leaves the inherit call sites untouched and unreachable by the leftover-literal scan', () => {
    const controlFontReset = blockOf('.sft-input,\n.sft-select,\n.sft-btn,\n.sft-step,\n.sft-choice-card,\n.sft-switch,\n.sft-textarea');
    expect(controlFontReset).toMatch(/font-family:\s*inherit;/);

    expect(stylesheet).toMatch(/font-size:\s*inherit;/);
  });
});
