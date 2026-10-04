import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { packageDirectory } from './helpers/sourceScan';

const source = readFileSync(path.join(packageDirectory, 'src/index.ts'), 'utf8');

/** Pulls the exported binding names out of one `export { ... } from '...'` clause, handling `default as X` renames. */
function namesFromClause(clause: string): string[] {
  return clause.split(',').map(entry => entry.trim()).filter(Boolean).map((entry) => {
    const asMatch = /^.*\bas\s+(\w+)$/.exec(entry);
    return asMatch ? asMatch[1] : entry;
  });
}

function collect(pattern: RegExp): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(pattern))
    names.push(...namesFromClause(match[1]));
  return names;
}

const valueExports = collect(/export\s*\{([^}]+)\}\s*from/g).sort();
const typeExports = collect(/export\s+type\s*\{([^}]+)\}\s*from/g).sort();

describe('public api surface matches the architecture exactly', () => {
  it('exports exactly the seven runtime values', () => {
    expect(valueExports).toEqual([
      'ReviewGroup',
      'StarterFormTemplate',
      'StarterIcon',
      'SubmissionSuccess',
      'extendMetadata',
      'starterIconNames',
      'starterMetadata',
    ].sort());
  });

  it('exports exactly the type-only names, including the four re-exported core types', () => {
    expect(typeExports).toEqual([
      'StarterIconName',
      'StarterFieldProperties',
      'StarterValueTypes',
      'ReviewGroupProps',
      'TimelineItem',
      'FieldMetadata',
      'GetDynamicFormSettingsType',
      'GetMetadataType',
      'MetadataConfiguration',
    ].sort());
  });

  it('never exports an internal chrome component', () => {
    const internalChrome = ['FormField', 'GroupField', 'SectionCard', 'ArraySectionCard', 'ArrayField', 'RepeaterCard', 'ChoiceCard', 'ChoiceField', 'ChoiceSectionCard', 'ChoiceArraySectionCard', 'FormWizard', 'Stepper', 'AppButton', 'TextInput', 'SelectInput', 'CheckboxField', 'ToggleSwitch', 'PasswordInput', 'PasswordStrengthBar', 'ErrorMessage', 'OptionalRequiredTag'];
    for (const name of internalChrome)
      expect(valueExports).not.toContain(name);
  });
});
