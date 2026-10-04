import type {
  FieldMetadata,
  GetDynamicFormSettingsType,
  GetMetadataType,
  MetadataConfiguration,
} from '@bach.software/vue-dynamic-form';
import type {
  FieldMetadata as FromStarterFieldMetadata,
  GetDynamicFormSettingsType as FromStarterGetDynamicFormSettingsType,
  GetMetadataType as FromStarterGetMetadataType,
  MetadataConfiguration as FromStarterMetadataConfiguration,
  ReviewGroupProps,
  StarterFieldProperties,
  StarterValueTypes,
  TimelineItem,
} from '@/index';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as api from '@/index';
import { starterMetadata as starterMetadataFromModule } from '@/metadata';

type Config = typeof api.starterMetadata;

describe('package entry', () => {
  it('exports exactly the seven runtime values the architecture lists', () => {
    expect(api.StarterFormTemplate).toBeDefined();
    expect(api.StarterIcon).toBeDefined();
    expect(api.ReviewGroup).toBeDefined();
    expect(api.SubmissionSuccess).toBeDefined();
    expect(Object.keys(api).sort()).toEqual([
      'ReviewGroup',
      'StarterFormTemplate',
      'StarterIcon',
      'SubmissionSuccess',
      'extendMetadata',
      'starterIconNames',
      'starterMetadata',
    ]);
  });

  it('builds the metadata from the exact module the catalogue is declared in', () => {
    expectTypeOf(api.starterMetadata).toEqualTypeOf(starterMetadataFromModule);
    expectTypeOf<keyof StarterValueTypes | 'default'>().toEqualTypeOf<keyof typeof starterMetadataFromModule['valueTypes']>();
    expectTypeOf<StarterFieldProperties>().toEqualTypeOf(starterMetadataFromModule.extendedProperties);
  });

  it('types ReviewGroup props and the standalone TimelineItem shape', () => {
    const props: ReviewGroupProps = { title: 'Company', rows: [['Name', 'Acme']], dataTestid: 'company' };
    expect(props.title).toBe('Company');

    const item: TimelineItem = { id: 'a', label: 'Received', status: 'done' };
    expect(item.status).toBe('done');
  });

  it('re-exports the convenience types from the core package', () => {
    expectTypeOf<FromStarterFieldMetadata<'text', { description: string }>>().toEqualTypeOf<FieldMetadata<'text', { description: string }>>();
    expectTypeOf<FromStarterGetMetadataType<Config>>().toEqualTypeOf<GetMetadataType<Config>>();
    expectTypeOf<FromStarterGetDynamicFormSettingsType<Config>>().toEqualTypeOf<GetDynamicFormSettingsType<Config>>();
    expectTypeOf<FromStarterMetadataConfiguration>().toEqualTypeOf<MetadataConfiguration>();
  });
});
