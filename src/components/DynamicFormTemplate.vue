<script lang="ts" setup generic="TMetadataConfiguration extends MetadataConfiguration">
import { computed, type WatchSource } from 'vue';
import type { MetadataConfiguration } from '~/types/FieldMetadata';

export type FieldMetadata<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = {},
> = {
  name?: string;
  type?: ExtendedFieldTypes;
  path?: string;
  minOccurs?: number;
  maxOccurs?: number;
  children?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[];
  /**
   * The parent of the current field.
   */
  parent?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>;
  /**
   * You can add methods that transform the field metadata based on other external values.
   * Make sure to include the reactive value's in your function, so that the function is re-evaluated once
   * the value changes (internally we use a computed that is re-valuated when one of the used reactive values is changed).
   * This way we can for example change the property minOccurs to 1 (required) if another field has a value or change one of the ExtendedAttributes.
   *
   * @param thisField the reactive & cloned current MetadataField that can be changed.
   * @returns A transformed FieldMetadata
   */
  transformReactively?: ((
    thisField: Omit<
      FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
      'children' // Not allowed to change the children of this field, create a transform for those fields specifically
    >,
    fieldValue?: WatchSource<any>,
  ) => Omit<
    FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
    'children'
  >)[];
} & ExtendedProperties;

export interface DynamicFormConfigurationProps<TMetadataConfiguration extends MetadataConfiguration> {
  type?: TMetadataConfiguration['fieldTypes'][number] | 'default';
  metadataConfiguration: TMetadataConfiguration;
  field?: FieldMetadata<TMetadataConfiguration['fieldTypes'][number], TMetadataConfiguration['extendedProperties']>;
}

type Props = DynamicFormConfigurationProps<TMetadataConfiguration>;

const { type = 'default' } = defineProps<Props>();
defineOptions({ name: 'DynamicFormConfiguration' });

type SlotsFromMetadata =
  { default(props: { field: NonNullable<Props['field']> }): any } &
  { 'default-input'(props: { field: NonNullable<Props['field']> }): any } &
  { 'array'(props: { field: NonNullable<Props['field']> }): any } &
  { 'choice'(props: { field: NonNullable<Props['field']> }): any } &
  {
    [K in TMetadataConfiguration['fieldTypes'][number]]: (props: { field: NonNullable<Props['field']> }) => any;
  } &
  {
    [K in `${TMetadataConfiguration['fieldTypes'][number]}-input`]: (props: { field: NonNullable<Props['field']> }) => any;
  };

const slots = defineSlots<SlotsFromMetadata>();

const typeWithFallback = computed(() => {
  if (type && slots[type]) {
    return type;
  }
  if (type?.includes('-input')) {
    return 'default-input';
  }
  
  return 'default';
});

</script>
<template>
  <slot v-if="field" :name="typeWithFallback" :field="field!" />
</template>
