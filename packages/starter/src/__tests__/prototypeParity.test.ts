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

const feat011PrototypePath = path.join(packageDirectory, '../../specs/archive/FEAT-011-starter-accessibility/prototype.html');
const feat011Prototype = readFileSync(feat011PrototypePath, 'utf8');
const feat011StyleBlock = /<style>([\s\S]*?)<\/style>/.exec(feat011Prototype)?.[1] ?? '';
// "FEAT-011 ADDITIONS" also names the file's own explanatory header comment, so the LAST
// occurrence (the actual banner marking the design delta) is the one that bounds the slice.
const feat011Additions = feat011StyleBlock.slice(feat011StyleBlock.lastIndexOf('FEAT-011 ADDITIONS'));

// The prototype's heading-focus rings and the `.demo-focus` static stand-in are superseded by
// the shipped [data-page] container ring and are never meant to exist in the real stylesheet.
const supersededFeat011Classes = new Set(['sft-wizard-title', 'sft-section-title']);

function existsInStylesheetUnlessDemoOnly(token: string) {
  if (token.startsWith('demo-focus'))
    return true;
  return existsInStylesheet(token);
}

function variableTokensIn(source: string) {
  const tokens = new Set<string>();
  for (const match of source.matchAll(/(--sft-[\w-]+):/g))
    tokens.add(match[1]);
  return [...tokens];
}

describe('stylesheet covers the FEAT-011 focus-visible CSS delta', () => {
  const additionClasses = classTokensIn(feat011Additions).filter(token => !supersededFeat011Classes.has(token));
  const additionVariables = variableTokensIn(feat011Additions);

  it('extracts a non-empty class inventory from the prototype addition', () => {
    expect(additionClasses.length).toBeGreaterThan(0);
  });

  it.each(additionClasses)('ships an equivalent rule for %s', (className) => {
    expect(existsInStylesheetUnlessDemoOnly(className)).toBe(true);
  });

  it.each(additionVariables)('declares %s on both :root and :root.dark', (name) => {
    const escaped = name.replace(/-/g, '\\-');
    const rootPattern = new RegExp(`:root\\s*\\{[^}]*${escaped}:`);
    const darkPattern = new RegExp(`:root\\.dark\\s*\\{[^}]*${escaped}:`);
    expect(stylesheet).toMatch(rootPattern);
    expect(stylesheet).toMatch(darkPattern);
  });
});
