import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { AllTrue, GoldenFieldProperties, GoldenSettingsProperties, GoldenSlotProperties, GoldenValueTypes, KeyByKeyEquality } from './metadata.golden';
import type { StarterIconName } from '@/icons';
import type { StarterFieldProperties, StarterValueTypes } from '@/metadata';
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { extendMetadata, starterMetadata } from '@/metadata';

type BuiltInType = keyof GoldenValueTypes;

describe('starterMetadata', () => {
  it('is a type carrier with empty runtime stubs', () => {
    expect(starterMetadata).toEqual(defineMetadata());
    expect(starterMetadata.fieldTypes).toEqual([]);
  });

  it('declares exactly the built-in field types', () => {
    expectTypeOf<keyof StarterValueTypes>().toEqualTypeOf<BuiltInType>();
    expectTypeOf<(typeof starterMetadata)['fieldTypes'][number]>().toEqualTypeOf<BuiltInType | 'default'>();
  });

  it('keeps the exact value type of every built-in field type', () => {
    expectTypeOf<KeyByKeyEquality<(typeof starterMetadata)['valueTypes'], GoldenValueTypes>>()
      .toEqualTypeOf<AllTrue<GoldenValueTypes>>();
  });

  it('keeps the exact set and types of the extended properties', () => {
    expectTypeOf<KeyByKeyEquality<StarterFieldProperties, GoldenFieldProperties, 'iconName'>>()
      .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'iconName'>>();
    expectTypeOf<KeyByKeyEquality<(typeof starterMetadata)['extendedProperties'], GoldenFieldProperties, 'iconName'>>()
      .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'iconName'>>();
  });

  it('types the icon property with the starter icon registry, not the old AppIconName enum', () => {
    expectTypeOf<StarterFieldProperties['iconName']>().toEqualTypeOf<StarterIconName | undefined>();
  });

  it('keeps the exact set and types of the slot and settings properties', () => {
    expectTypeOf<(typeof starterMetadata)['slotProperties']>().toEqualTypeOf<GoldenSlotProperties>();
    expectTypeOf<(typeof starterMetadata)['extendedSettingsProperties']>().toEqualTypeOf<GoldenSettingsProperties>();
  });

  it('types field metadata with the extended properties', () => {
    type Field = GetMetadataType<typeof starterMetadata>;

    const field: Field = {
      name: 'country',
      description: 'Pick your country',
      options: [{ key: 'nl', value: 'Netherlands' }],
      fullWidth: true,
    };
    expect(field.fullWidth).toBe(true);

    const invalid: Field = {
      name: 'country',
      // @ts-expect-error fullWidth only accepts a boolean
      fullWidth: 'yes',
    };
    expect(invalid.name).toBe('country');
  });
});

describe('extendMetadata', () => {
  describe('adding a type and a property', () => {
    type Ext = ReturnType<typeof extendMetadata<{ richText: string }, { toolbar?: boolean }>>;
    type Values = Ext['valueTypes'];

    it('adds the new value type', () => {
      expectTypeOf<Values['richText']>().toEqualTypeOf<string>();
      expectTypeOf<Ext['fieldTypes'][number]>().toEqualTypeOf<BuiltInType | 'richText' | 'default'>();
    });

    it('keeps every built-in value type unchanged', () => {
      expectTypeOf<KeyByKeyEquality<Values, GoldenValueTypes>>().toEqualTypeOf<AllTrue<GoldenValueTypes>>();
    });

    it('adds the new property and keeps the built-in properties', () => {
      expectTypeOf<Ext['extendedProperties']['toolbar']>().toEqualTypeOf<boolean | undefined>();
      expectTypeOf<Ext['extendedProperties']['description']>().toEqualTypeOf<string | undefined>();
      expectTypeOf<KeyByKeyEquality<Ext['extendedProperties'], GoldenFieldProperties, 'iconName'>>()
        .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'iconName'>>();
    });

    it('types field metadata with the added property', () => {
      type Field = GetMetadataType<Ext>;
      const field: Field = { name: 'body', toolbar: true, description: 'Body' };
      expect(field.toolbar).toBe(true);
    });
  });

  describe('when the consumer redefines a built-in key', () => {
    type Ext = ReturnType<typeof extendMetadata<{ text: { doc: string } }, { description?: number }>>;
    type Values = Ext['valueTypes'];
    type Properties = Ext['extendedProperties'];

    it('replaces the value type instead of intersecting with it', () => {
      expectTypeOf<Values['text']>().toEqualTypeOf<{ doc: string }>();

      // @ts-expect-error a string is not the redefined value type
      const notTheDoc: Values['text'] = 'abc';
      expect(notTheDoc).toBe('abc');
    });

    it('replaces the property type instead of intersecting with it', () => {
      expectTypeOf<Properties['description']>().toEqualTypeOf<number | undefined>();
    });

    it('leaves every other built-in key unchanged', () => {
      expectTypeOf<KeyByKeyEquality<Values, GoldenValueTypes, 'text'>>().toEqualTypeOf<AllTrue<GoldenValueTypes, 'text'>>();
      expectTypeOf<KeyByKeyEquality<Properties, GoldenFieldProperties, 'description' | 'iconName'>>()
        .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'description' | 'iconName'>>();
    });
  });

  it('merges slot and settings properties, consumer wins, built-ins survive', () => {
    type Ext = ReturnType<typeof extendMetadata<object, object, { mySlot?: unknown }, { mySetting?: unknown }>>;

    expectTypeOf<Ext['slotProperties']['mySlot']>().toEqualTypeOf<unknown>();
    expectTypeOf<Ext['slotProperties']['gotoStep']>().toEqualTypeOf<(typeof starterMetadata)['slotProperties']['gotoStep']>();
    expectTypeOf<Ext['extendedSettingsProperties']['mySetting']>().toEqualTypeOf<unknown>();
    expectTypeOf<Ext['extendedSettingsProperties']['showRequiredOrOptional']>()
      .toEqualTypeOf<(typeof starterMetadata)['extendedSettingsProperties']['showRequiredOrOptional']>();
  });

  it('is equivalent to the built-in catalogue without generics, across all four generics', () => {
    const ext = extendMetadata();
    type Ext = typeof ext;

    expect(ext.fieldTypes).toEqual([]);
    expectTypeOf<KeyByKeyEquality<Ext['valueTypes'], GoldenValueTypes>>().toEqualTypeOf<AllTrue<GoldenValueTypes>>();
    expectTypeOf<KeyByKeyEquality<Ext['extendedProperties'], GoldenFieldProperties, 'iconName'>>()
      .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'iconName'>>();
    expectTypeOf<Ext['slotProperties']>().toExtend<(typeof starterMetadata)['slotProperties']>();
    expectTypeOf<(typeof starterMetadata)['slotProperties']>().toExtend<Ext['slotProperties']>();
    expectTypeOf<Ext['extendedSettingsProperties']>().toExtend<(typeof starterMetadata)['extendedSettingsProperties']>();
    expectTypeOf<(typeof starterMetadata)['extendedSettingsProperties']>().toExtend<Ext['extendedSettingsProperties']>();
  });

  describe('at runtime', () => {
    it('returns the same empty stubs as defineMetadata', () => {
      expect(extendMetadata()).toEqual(defineMetadata());
      expect(extendMetadata<{ a: string }>()).toEqual(defineMetadata());
      expect(extendMetadata<{ a: string }>().fieldTypes).toEqual([]);
    });

    it('returns a fresh object per call', () => {
      expect(extendMetadata()).not.toBe(extendMetadata());
    });
  });
});
