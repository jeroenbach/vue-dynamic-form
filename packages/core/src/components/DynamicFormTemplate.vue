<script
  lang="ts"
  setup
  generic="TMetadataConfiguration extends MetadataConfiguration"
>
import type { FieldContext as _FieldContext } from 'vee-validate';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { ReadOnlyFieldType } from '@/types/FieldMetadata';
import type { MetadataConfiguration } from '@/types/MetadataConfiguration';
import { computed, useAttrs } from 'vue';
import { camelize } from '@/utils/camelize';

// #region Interfaces

export interface FieldContext<TValue = unknown> extends _FieldContext<TValue> {
  /**
   * Whether this field (or any of its descendants) has a value.
   * Lazily evaluated — only computed when accessed, so safe to use on deep field trees.
   */
  hasValue: ComputedRef<boolean>
}

export interface DynamicFormConfigurationProps<
  TMetadataConfiguration extends MetadataConfiguration,
> {
  /**
   * Use defineMetadata to create a strongly-typed metadata configuration.
   * This metadata configuration can be provided here to type the DynamicFormTemplate component.
   */
  metadataConfiguration: TMetadataConfiguration
}

export interface LimitedFieldContext<TValue = unknown> {
  value: ComputedRef<TValue>
  errors: Ref<string[]>
  errorMessage: Ref<string | undefined>
  label?: MaybeRefOrGetter<string | undefined>
}

/**
 * Props passed to the template component by the library internals.
 * Defined as an interface (rather than actual props) so they don't appear in the
 * public prop signature of the user-facing DynamicFormTemplate component.
 */
export interface Attributes<
  TMetadataConfiguration extends MetadataConfiguration,
> {
  type: TMetadataConfiguration['fieldTypes'][number] | 'default' | 'default-array' | 'default-array-item' | 'default-choice'
  /** The metadata you configured for this field. */
  fieldMetadata: ReadOnlyFieldType<
    TMetadataConfiguration['fieldTypes'][number],
    TMetadataConfiguration['extendedProperties']
  >
  /** Whether the field is required. */
  required: boolean
  /** Whether the field is disabled (maxOccurs = 0). */
  disabled: boolean
  /** The position of this item within its parent, that can be its position in the children or choice collection or its index in an array field. */
  index: number
  /**
   * Whether a new array item can be added.
   * False when the current count has already reached maxOccurs.
   */
  canAddItems: boolean
  /**
   * Whether an array item can be removed.
   * False when the current count has already reached minOccurs.
   */
  canRemoveItems: boolean
  /** Adds a new item to the parent array field. */
  addItem: () => void
  /** Removes this item from the parent array field. */
  removeItem: () => void
  /**
   * The user defined properties that are passed between templates by adding attributes on the <slot /> elements.
   * With these properties you can set values that can be read by components "living" further down the tree.
   */
  slotProps: TMetadataConfiguration['slotProperties']
}

export interface ItemAttributes<
  TMetadataConfiguration extends MetadataConfiguration,
  FieldType extends string = string,
> extends Attributes<TMetadataConfiguration> {
  /**
   * The extended vee-validate field context from useField.
   * Includes a `hasValue` computed that is true when this field or any descendant has a value.
   */
  fieldContext: FieldContext<FieldType extends keyof TMetadataConfiguration['valueTypes']
    ? TMetadataConfiguration['valueTypes'][FieldType]
    : unknown>
}

export interface ArrayChoiceAttributes<
  TMetadataConfiguration extends MetadataConfiguration,
> extends Attributes<TMetadataConfiguration> {
  fieldContext: LimitedFieldContext<unknown[]>
}

type Props = DynamicFormConfigurationProps<TMetadataConfiguration>;
type SlotProps<FieldType extends string = string> = ItemAttributes<TMetadataConfiguration, FieldType>;
type ArrayChoiceSlotProps = ArrayChoiceAttributes<TMetadataConfiguration>;

type SlotsFromMetadata = {
  // Fallback slot for field types that don't have a dedicated slot.
  default: (props: SlotProps) => any
} & {
  // Fallback slot for input components that don't have a dedicated slot.
  'default-input': (props: SlotProps) => any
} & {
  // Fallback slot for components that are array's but don't have a dedicated slot.
  'default-array': (props: ArrayChoiceSlotProps) => any
} & {
  // Fallback slot for components that are array items but don't have a dedicated slot.
  'default-array-item': (props: SlotProps) => any
} & {
  // Fallback slot for components that are choice fields but don't have a dedicated slot.
  'default-choice': (props: ArrayChoiceSlotProps) => any
} & {
  // One slot per field type defined in the metadata configuration.
  [K in TMetadataConfiguration['fieldTypes'][number]]: (props: SlotProps<K>) => any;
} & {
  // One input slot per field type (e.g. "text-input") for rendering just the inner control.
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-input`]: (props: SlotProps<K extends `${infer FieldType}-input` ? FieldType : never>) => any;
} & {
  // One array slot per field type (e.g. "text-array") for defining how to render the type when it is an array.
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-array`]: (props: ArrayChoiceSlotProps) => any;
} & {
  // One array item slot per field type (e.g. "text-array-item") for defining how to render the type when it is an array item.
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-array-item`]: (props: SlotProps<K extends `${infer FieldType}-input` ? FieldType : never>) => any;
} & {
  // One choice slot per field type (e.g. "text-choice") for defining how to render the type when it is a choice.
  [K in `${TMetadataConfiguration['fieldTypes'][number]}-choice`]: (props: ArrayChoiceSlotProps) => any;
};

// #endregion

// #region State
defineOptions({ name: 'DynamicFormTemplate', inheritAttrs: false });
defineProps<Props>();
const slots = defineSlots<SlotsFromMetadata>();

// Attributes are passed in as kebab-case HTML attributes by Vue; convert them to camelCase
// so slot consumers receive consistent camelCase props regardless of how they were bound.
const rawAttrs = useAttrs();
const attrs = computed(() => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawAttrs)) {
    result[camelize(key)] = value;
  }
  return result as unknown as SlotProps;
});

type RegularSlotName = keyof SlotsFromMetadata;

// Resolve which slot to render: prefer a dedicated per-type slot, fall back to
// 'default-input' for input variants, and finally to 'default' for everything else.
const typeWithFallback = computed((): RegularSlotName => {
  const type = attrs.value.type;
  if (type && slots[type as RegularSlotName]) {
    return type as RegularSlotName;
  }

  if (type?.endsWith('-input')) {
    return slots['default-input'] ? 'default-input' : 'default';
  }
  if (type?.endsWith('-array')) {
    return slots['default-array'] ? 'default-array' : 'default';
  }
  if (type?.endsWith('-array-item')) {
    return slots['default-array-item'] ? 'default-array-item' : 'default';
  }
  if (type?.endsWith('-choice')) {
    return slots['default-choice'] ? 'default-choice' : 'default';
  }
  return 'default';
});

// #endregion
</script>

<template>
  <template v-if="attrs.fieldMetadata">
    <slot v-if="attrs.type?.endsWith('-array')" :name="typeWithFallback" v-bind="(attrs as unknown as ArrayChoiceSlotProps)" />
    <slot v-else-if="attrs.type?.endsWith('-choice')" :name="typeWithFallback" v-bind="(attrs as unknown as ArrayChoiceSlotProps)" />
    <slot v-else :name="typeWithFallback" v-bind="attrs" />
  </template>
</template>
