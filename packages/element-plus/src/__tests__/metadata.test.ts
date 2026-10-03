import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { AllTrue, GoldenFieldProperties, GoldenValueTypes, KeyByKeyEquality } from './metadata.golden';
import type { ElementPlusFieldProperties, ElementPlusValueTypes } from '@/metadata';
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { elementPlusMetadata, extendMetadata } from '@/metadata';

type BuiltInType = keyof GoldenValueTypes;

describe('elementPlusMetadata', () => {
  it('is a type carrier with empty runtime stubs', () => {
    expect(elementPlusMetadata).toEqual(defineMetadata());
    expect(elementPlusMetadata.fieldTypes).toEqual([]);
  });

  it('declares exactly the built-in field types', () => {
    expectTypeOf<keyof ElementPlusValueTypes>().toEqualTypeOf<BuiltInType>();
    expectTypeOf<(typeof elementPlusMetadata)['fieldTypes'][number]>().toEqualTypeOf<BuiltInType | 'default'>();
  });

  it('keeps the exact value type of every built-in field type', () => {
    expectTypeOf<KeyByKeyEquality<(typeof elementPlusMetadata)['valueTypes'], GoldenValueTypes>>()
      .toEqualTypeOf<AllTrue<GoldenValueTypes>>();
    expectTypeOf<(typeof elementPlusMetadata)['valueTypes']['default']>().toEqualTypeOf<string>();
  });

  it('keeps the exact set and types of the extended properties', () => {
    expectTypeOf<ElementPlusFieldProperties>().toEqualTypeOf<GoldenFieldProperties>();
    expectTypeOf<(typeof elementPlusMetadata)['extendedProperties']>().toEqualTypeOf<GoldenFieldProperties>();
  });

  it('starts without slot or settings properties', () => {
    // eslint-disable-next-line ts/no-empty-object-type
    expectTypeOf<(typeof elementPlusMetadata)['slotProperties']>().toEqualTypeOf<{}>();
    // eslint-disable-next-line ts/no-empty-object-type
    expectTypeOf<(typeof elementPlusMetadata)['extendedSettingsProperties']>().toEqualTypeOf<{}>();
  });

  it('types field metadata with the extended properties', () => {
    type Field = GetMetadataType<typeof elementPlusMetadata>;

    const field: Field = {
      name: 'country',
      label: 'Country',
      options: [{ label: 'Netherlands', value: 'nl' }],
      size: 'large',
      valueFormat: 'YYYY-MM-DD',
    };
    expect(field.size).toBe('large');

    const invalid: Field = {
      name: 'country',
      // @ts-expect-error size only accepts large, default, or small
      size: 'huge',
    };
    expect(invalid.name).toBe('country');
  });

  it('keeps the field kind separate from component-specific property groups', () => {
    type Field = GetMetadataType<typeof elementPlusMetadata>;

    const field: Field = { name: 'birthDate', type: 'date', date: { type: 'month' }, slider: { showStops: true } };
    expect(field.type).toBe('date');

    const invalid: Field = {
      name: 'birthDate',
      type: 'date',
      // @ts-expect-error the date picker mode only accepts Element Plus picker types
      date: { type: 'text' },
    };
    expect(invalid.name).toBe('birthDate');
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
      expectTypeOf<Ext['extendedProperties']['label']>().toEqualTypeOf<string | undefined>();
      expectTypeOf<KeyByKeyEquality<Ext['extendedProperties'], GoldenFieldProperties>>()
        .toEqualTypeOf<AllTrue<GoldenFieldProperties>>();
    });

    it('types field metadata with the added property', () => {
      type Field = GetMetadataType<Ext>;
      const field: Field = { name: 'body', toolbar: true, label: 'Body' };
      expect(field.toolbar).toBe(true);
    });
  });

  describe('when the consumer redefines a built-in key', () => {
    type Ext = ReturnType<typeof extendMetadata<{ text: { doc: string } }, { label?: number }>>;
    type Values = Ext['valueTypes'];
    type Properties = Ext['extendedProperties'];

    it('replaces the value type instead of intersecting with it', () => {
      expectTypeOf<Values['text']>().toEqualTypeOf<{ doc: string }>();

      // @ts-expect-error a string is not the redefined value type
      const notTheDoc: Values['text'] = 'abc';
      expect(notTheDoc).toBe('abc');
    });

    it('replaces the property type instead of intersecting with it', () => {
      expectTypeOf<Properties['label']>().toEqualTypeOf<number | undefined>();
    });

    it('leaves every other built-in key unchanged', () => {
      expectTypeOf<KeyByKeyEquality<Values, GoldenValueTypes, 'text'>>().toEqualTypeOf<AllTrue<GoldenValueTypes, 'text'>>();
      expectTypeOf<KeyByKeyEquality<Properties, GoldenFieldProperties, 'label'>>()
        .toEqualTypeOf<AllTrue<GoldenFieldProperties, 'label'>>();
    });
  });

  it('passes slot and settings properties through', () => {
    type Ext = ReturnType<typeof extendMetadata<object, object, { tip: string }, { locale: string }>>;

    expectTypeOf<Ext['slotProperties']>().toEqualTypeOf<{ tip: string }>();
    expectTypeOf<Ext['extendedSettingsProperties']>().toEqualTypeOf<{ locale: string }>();
  });

  it('is equivalent to the built-in catalogue without generics', () => {
    const ext = extendMetadata();
    type Ext = typeof ext;

    expect(ext.fieldTypes).toEqual([]);
    expectTypeOf<KeyByKeyEquality<Ext['valueTypes'], GoldenValueTypes>>().toEqualTypeOf<AllTrue<GoldenValueTypes>>();
    expectTypeOf<KeyByKeyEquality<Ext['extendedProperties'], GoldenFieldProperties>>()
      .toEqualTypeOf<AllTrue<GoldenFieldProperties>>();
    expectTypeOf<Ext['slotProperties']>().toExtend<(typeof elementPlusMetadata)['slotProperties']>();
    expectTypeOf<(typeof elementPlusMetadata)['slotProperties']>().toExtend<Ext['slotProperties']>();
    expectTypeOf<Ext['extendedSettingsProperties']>().toExtend<(typeof elementPlusMetadata)['extendedSettingsProperties']>();
    expectTypeOf<(typeof elementPlusMetadata)['extendedSettingsProperties']>().toExtend<Ext['extendedSettingsProperties']>();
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
