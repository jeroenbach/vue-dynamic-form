import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compiledStylesheet } from './helpers/compiledStylesheet';
import { packageDirectory } from './helpers/sourceScan';

const prototypePath = path.join(packageDirectory, '../../specs/archive/FEAT-007-starter-form-template/prototype.html');
const prototype = readFileSync(prototypePath, 'utf8');
const stylesheet = compiledStylesheet;

const styleBlock = /<style>([\s\S]*?)<\/style>/.exec(prototype)?.[1] ?? '';
const packageStyles = styleBlock.slice(styleBlock.indexOf('STARTER FORM TEMPLATE PACKAGE STYLES'));

// `.sft-root` names the prototype's per-section wrapper; the shipped stylesheet
// moved its variables to document-root scope instead, so it is deliberately absent.
// `.sft-col-span` was the prototype's full-row default; the shipped stylesheet uses
// the identical `sft-span-full` utility for that instead.
const supersededClasses = new Set(['sft-root', 'sft-col-span']);

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

const additionalFieldTypesPrototypePath = path.join(packageDirectory, '../../specs/archive/FEAT-014-starter-field-types/prototype.html');
const additionalFieldTypesPrototype = readFileSync(additionalFieldTypesPrototypePath, 'utf8');
const additionalFieldTypesStyleBlock = /<style>([\s\S]*?)<\/style>/.exec(additionalFieldTypesPrototype)?.[1] ?? '';
// The prototype's own CSS comment marks where the file-input rules start; stop at the closing
// </style>, which this file section reaches last.
const fileInputStyles = additionalFieldTypesStyleBlock.slice(additionalFieldTypesStyleBlock.indexOf('file input (FileInput.vue)'));

describe('stylesheet covers the file-input prototype section\'s class inventory', () => {
  const fileClasses = classTokensIn(fileInputStyles).filter(token => token.startsWith('sft-file'));

  it('extracts the sft-file-* classes used by the #file prototype section', () => {
    expect(fileClasses.length).toBeGreaterThan(0);
  });

  it.each(fileClasses)('ships an equivalent rule for %s', (className) => {
    expect(existsInStylesheet(className)).toBe(true);
  });
});
