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
  // With the default slot you can define how unknown fields are rendered
  default: (props: {
    field: NonNullable<Props['field']>
    type: Props['type']
  }) => any
} & {
  // With the default-input slot you can define how unknown input components are rendered
  'default-input': (props: { field: NonNullable<Props['field']> }) => any
} & {
  // With the array slot you can define how array fields are rendered
  array: (props: { field: NonNullable<Props['field']> }) => any
} & {
  // With the choice slot you can define how choice fields are rendered
  choice: (props: { field: NonNullable<Props['field']> }) => any
}
& {
  // Each field type will have its own slot that you can use to define how that field type is rendered
  [K in TMetadataConfiguration['fieldTypes'][number]]: (props: {
    field: NonNullable<Props['field']>
  }) => any;
} & {
  // Each field type will have its own input slot that you can use to define how that input is rendered
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
