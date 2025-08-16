<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration"
>
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { MetadataConfiguration } from '@/types/MetadataConfiguration';
import { computed } from 'vue';

export interface DynamicFormConfigurationProps<
  TMetadataConfiguration extends MetadataConfiguration,
> {
  type?: TMetadataConfiguration['fieldTypes'][number] | 'default'
  metadataConfiguration: TMetadataConfiguration
  field?: FieldMetadata<
    TMetadataConfiguration['fieldTypes'][number],
    TMetadataConfiguration['extendedProperties']
  >
}

type Props = DynamicFormConfigurationProps<TMetadataConfiguration>;

defineOptions({ name: 'DynamicFormConfiguration' });
const { type = 'default' } = defineProps<Props>();
const slots = defineSlots<SlotsFromMetadata>();

type SlotsFromMetadata = {
  default: (props: {
    field: NonNullable<Props['field']>
    type: Props['type']
  }) => any
} & { 'default-input': (props: { field: NonNullable<Props['field']> }) => any } & {
  array: (props: { field: NonNullable<Props['field']> }) => any
} & { choice: (props: { field: NonNullable<Props['field']> }) => any } & {
  [K in TMetadataConfiguration['fieldTypes'][number]]: (props: {
    field: NonNullable<Props['field']>
  }) => any;
} & {
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-input`]: (props: {
    field: NonNullable<Props['field']>
  }) => any;
};

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
