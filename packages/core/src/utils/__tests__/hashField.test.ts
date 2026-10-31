import type { FieldMetadata } from '@/types/FieldMetadata';
import { describe, expect, it } from 'vitest';
import { hashField } from '@/utils/hashField';

function baseField(): FieldMetadata {
  return {
    name: 'express',
    path: 'pick.express',
    type: 'text',
    minOccurs: 1,
    maxOccurs: 1,
  };
}

describe('hashField', () => {
  it('excludes structural properties: name, path, children, choice, attributes, fieldOptions, computedProps, maxOccurs, parent', () => {
    const withoutStructural = hashField(baseField());
    const withStructural = hashField({
      ...baseField(),
      children: [{ name: 'child' }],
      choice: [{ name: 'branch' }],
      attributes: [{ name: 'attr' }],
      fieldOptions: { label: 'Express Checkout' },
      computedProps: [() => {}],
      parent: { name: 'root' },
    } as FieldMetadata);

    expect(withStructural).toBe(withoutStructural);
  });

  it('includes presenceValue in the hashed mutable properties, so a different marker changes the hash', () => {
    const withoutMarker = hashField(baseField());
    const withMarker = hashField({ ...baseField(), presenceValue: true });

    expect(withMarker).not.toBe(withoutMarker);
  });

  it.each([
    ['boolean', true],
    ['string', 'express'],
    ['empty object', {}],
    ['empty array', []],
    ['non-empty object', { selected: true }],
  ])('hashing the same field twice with a %s presenceValue never perturbs the hash across runs', (_label, presenceValue) => {
    const field = { ...baseField(), presenceValue };

    expect(hashField(field)).toBe(hashField(field));
    expect(hashField({ ...field })).toBe(hashField({ ...field }));
  });
});
