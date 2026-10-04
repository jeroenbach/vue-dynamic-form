import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const prototypePath = path.join(packageDirectory, '../../specs/FEAT-007-starter-form-template/prototype.html');
const prototype = readFileSync(prototypePath, 'utf8');
const stylesheet = readFileSync(path.join(packageDirectory, 'src/style.css'), 'utf8');

const styleBlock = /<style>([\s\S]*?)<\/style>/.exec(prototype)?.[1] ?? '';
const packageStyles = styleBlock.slice(styleBlock.indexOf('STARTER FORM TEMPLATE PACKAGE STYLES'));

// `.sft-root` names the prototype's per-section wrapper; the shipped stylesheet
// moved its variables to document-root scope instead, so it is deliberately absent.
const supersededClasses = new Set(['sft-root']);

function classTokensIn(source: string) {
  const tokens = new Set<string>();
  for (const match of source.matchAll(/\.((?:sft|is)-[\w-]+)/g))
    tokens.add(match[1]);
  return [...tokens].filter(token => !supersededClasses.has(token));
}

function existsInStylesheet(className: string) {
  const escaped = className.replace(/-/g, '\\-');
  return new RegExp(`\\.${escaped}(?![\\w-])`).test(stylesheet);
}

describe('stylesheet covers the full prototype class inventory', () => {
  const prototypeClasses = classTokensIn(packageStyles);

  it('extracts a non-empty inventory from the prototype', () => {
    expect(prototypeClasses.length).toBeGreaterThan(50);
  });

  it.each(prototypeClasses)('ships an equivalent rule for %s', (className) => {
    expect(existsInStylesheet(className)).toBe(true);
  });
});
