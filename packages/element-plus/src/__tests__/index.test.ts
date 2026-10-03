import type {
  defineMetadata,
  FieldMetadata,
  GetDynamicFormSettingsType,
  GetMetadataType,
  MetadataConfiguration,
} from '@bach.software/vue-dynamic-form';
import type {
  // @ts-expect-error the previous component name is not exported anymore
  ElementPlusDynamicForm,
  ElementPlusFieldProperties,
  ElementPlusValueTypes,
  FieldMetadata as FromElementPlusFieldMetadata,
  GetDynamicFormSettingsType as FromElementPlusGetDynamicFormSettingsType,
  GetMetadataType as FromElementPlusGetMetadataType,
  MetadataConfiguration as FromElementPlusMetadataConfiguration,
} from '@/index';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as api from '@/index';

type Config = typeof api.elementPlusMetadata;

describe('package entry', () => {
  it('exports the template, the metadata, and the extension function under their final names', () => {
    expect(api.ElementPlusFormTemplate).toBeDefined();
    expect(Object.keys(api).sort()).toEqual(['ElementPlusFormTemplate', 'elementPlusMetadata', 'extendMetadata']);
  });

  it('builds the metadata from the two exported types', () => {
    // eslint-disable-next-line ts/no-empty-object-type
    type Expected = ReturnType<typeof defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>>;
    expectTypeOf(api.elementPlusMetadata).toEqualTypeOf<Expected>();
  });

  it('re-exports the convenience types from the core package', () => {
    expectTypeOf<FromElementPlusFieldMetadata<'text', { label: string }>>().toEqualTypeOf<FieldMetadata<'text', { label: string }>>();
    expectTypeOf<FromElementPlusGetMetadataType<Config>>().toEqualTypeOf<GetMetadataType<Config>>();
    expectTypeOf<FromElementPlusGetDynamicFormSettingsType<Config>>().toEqualTypeOf<GetDynamicFormSettingsType<Config>>();
    expectTypeOf<FromElementPlusMetadataConfiguration>().toEqualTypeOf<MetadataConfiguration>();
  });

  it('does not export the previous component name', () => {
    expectTypeOf<ElementPlusDynamicForm>().toBeAny();
  });
});
