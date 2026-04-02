<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration"
>
import type { FieldContext } from 'vee-validate';
import type { MaybeRefOrGetter, Ref } from 'vue';
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

export interface LimitedFieldContext {
  errors: Ref<string[]>
  errorMessage: Ref<string | undefined>
  label?: MaybeRefOrGetter<string | undefined>
}

/**
 * We define the attributes here instead of the props. This way the user don't see them
 * when using the DynamicFormConfiguration component.
 * The attributes will be passed internally by the other components of the library.
 */
export interface Attributes<
  TMetadataConfiguration extends MetadataConfiguration,
> {
  type: TMetadataConfiguration['fieldTypes'][number] | 'default' | 'array' | 'choice'
  /**
   * The metadata that you configured for this field
   */
  fieldMetadata: FieldMetadata<
    TMetadataConfiguration['fieldTypes'][number],
    TMetadataConfiguration['extendedProperties']
  >
  /**
   * Indicates if a field is required.
   */
  required: boolean
  /**
   * Indicates whether a field is disabled
   */
  disabled: boolean
  /**
   * If the field is part of an arrayField, this is its index in the array
   */
  index: number
  /**
   * If the field is part of an arrayField, this boolean lets you know whether
   * new items can be added. For example: when the maxOccurs is 2 and there are already
   * 2 items, this will be false.
   */
  canAddItems: boolean
  /**
   * If the field is part of an arrayField, this boolean lets you konw whether
   * an item can be removed. For example: when the minOccurs is 2 and there are already
   * 2 items, this will be false.
   */
  canRemoveItems: boolean
  /**
   * if the field is part of an arrayField, this method will add another item.
   */
  addItem: () => void
  /**
   * if the field is part of an arrayField, this method will remove an item.
   */
  removeItem: () => void
}

export interface ItemAttributes<
  TMetadataConfiguration extends MetadataConfiguration,
  FieldType extends string = string,
> extends Attributes<TMetadataConfiguration> {
  /**
   * The Vee-Validate context, coming from the useField.
   */
  fieldContext: FieldContext<FieldType extends keyof TMetadataConfiguration['valueTypes']
    ? TMetadataConfiguration['valueTypes'][FieldType]
    : unknown>
}

export interface ArrayChoiceAttributes<
  TMetadataConfiguration extends MetadataConfiguration,
> extends Attributes<TMetadataConfiguration> {
  fieldContext: LimitedFieldContext
}

type Props = DynamicFormConfigurationProps<TMetadataConfiguration>;
type SlotProps<FieldType extends string = string> = ItemAttributes<TMetadataConfiguration, FieldType>; // we pass the attributes as slot props
type ArrayChoiceSlotProps = ArrayChoiceAttributes<TMetadataConfiguration>; // we pass the attributes as slot props

type SlotsFromMetadata = {
  // With the default slot you can define how unknown fields are rendered
  default: (props: SlotProps) => any
} & {
  // With the default-input slot you can define how unknown input components are rendered
  'default-input': (props: SlotProps) => any
} & {
  // With the array slot you can define how array fields are rendered
  array: (props: ArrayChoiceSlotProps) => any
} & {
  // With the choice slot you can define how choice fields are rendered
  choice: (props: ArrayChoiceSlotProps) => any
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
  return result as unknown as SlotProps;
});

type RegularSlotName = Exclude<keyof SlotsFromMetadata, 'array' | 'choice'>

const typeWithFallback = computed((): RegularSlotName => {
  const type = attrs.value.type;
  if (type && type !== 'array' && type !== 'choice' && slots[type as RegularSlotName]) {
    return type as RegularSlotName;
  }
  if (type?.includes('-input')) {
    return 'default-input';
  }
  return 'default';
});

// #endregion
</script>

<template>
  <template v-if="attrs.fieldMetadata">
    <slot v-if="attrs.type === 'array'" name="array" v-bind="(attrs as unknown as ArrayChoiceSlotProps)" />
    <slot v-else-if="attrs.type === 'choice'" name="choice" v-bind="(attrs as unknown as ArrayChoiceSlotProps)" />
    <slot v-else :name="typeWithFallback" v-bind="attrs" />
  </template>
</template>
