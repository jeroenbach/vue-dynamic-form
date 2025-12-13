<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration"
>
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { MetadataConfiguration } from '@/types/MetadataConfiguration';
import { computed, useAttrs } from 'vue';
import { camelize } from '@/utils/camelize';

// #region Interface
export interface DynamicFormConfigurationProps<
  TMetadataConfiguration extends MetadataConfiguration,
> {
  /**
   * Use defineMetadata to create a strongly-typed metadata configuration.
   * This metadata configuration can be provided here to type the DynamicFormTemplate component.
   */
  metadataConfiguration: TMetadataConfiguration
}

/**
 * We define the attributes here instead of the props. This way the user don't see them
 * when using the DynamicFormConfiguration component.
 * The attributes will be passed internally by the other components of the library.
 */
export interface Attributes<
  TMetadataConfiguration extends MetadataConfiguration,
  FieldType extends string = string,
> {
  type: TMetadataConfiguration['fieldTypes'][number] | 'default'
  field: FieldMetadata<
    TMetadataConfiguration['fieldTypes'][number],
    TMetadataConfiguration['extendedProperties']
  >
  value: FieldType extends keyof TMetadataConfiguration['valueTypes']
    ? TMetadataConfiguration['valueTypes'][FieldType]
    : unknown
  isRequired: boolean
  isDisabled: boolean
  level: number
  index: number
  canAddItems: boolean
  canRemoveItems: boolean
  /**
   * You can provide additional attributes to the slots in your template. They will be passed to the
   * component below.
   */
  templateAttrs: object
  addItem: () => void
  removeItem: () => void
  update: (value: FieldType extends keyof TMetadataConfiguration['valueTypes']
    ? TMetadataConfiguration['valueTypes'][FieldType]
    : any, index?: number) => void
}

type Props = DynamicFormConfigurationProps<TMetadataConfiguration>;
type SlotProps<FieldType extends string = string> = Attributes<TMetadataConfiguration, FieldType>; // we pass the attributes as slot props

type SlotsFromMetadata = {
  // With the default slot you can define how unknown fields are rendered
  default: (props: SlotProps) => any
} & {
  // With the default-input slot you can define how unknown input components are rendered
  'default-input': (props: SlotProps) => any
} & {
  // With the array slot you can define how array fields are rendered
  array: (props: SlotProps) => any
} & {
  // With the choice slot you can define how choice fields are rendered
  choice: (props: SlotProps) => any
}
& {
  // Each field type will have its own slot that you can use to define how that field type is rendered
  [K in TMetadataConfiguration['fieldTypes'][number]]: (props: SlotProps<K>) => any;
} & {
  // Each field type will have its own input slot that you can use to define how that input is rendered
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-input`]: (props: SlotProps<K extends `${infer FieldType}-input` ? FieldType : never>) => any;
};

// #endregion

// #region State
defineOptions({ name: 'DynamicFormTemplate', inheritAttrs: false });
defineProps<Props>();
const slots = defineSlots<SlotsFromMetadata>();

const rawAttrs = useAttrs();

// Convert kebab-case attributes to camelCase
const attrs = computed(() => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawAttrs)) {
    result[camelize(key)] = value;
  }
  return result as unknown as Attributes<TMetadataConfiguration>;
});

const typeWithFallback = computed(() => {
  const type = attrs.value.type || 'default';
  if (type && slots[type]) {
    return type;
  }
  if (type?.includes('-input')) {
    return 'default-input';
  }

  return 'default';
});

// #endregion
</script>

<template>
  <slot
    v-if="attrs.field"
    :name="typeWithFallback"
    v-bind="attrs"
  />
</template>
