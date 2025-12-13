<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useSubmitCount, useValidateField } from 'vee-validate';
import { computed, watch, watchEffect } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { useFieldArrayExtended } from '@/core/useFieldArrayExtended';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: unknown, index?: number): void
  (e: 'addItem'): void
  (e: 'removeItem'): void
}

type Props = DynamicFormItemProps<InternalMetadata>;

// #endregion

// #region Props and State
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
// #endregion

// #region Analytics: to test reactivity and prevent unnecessary rerenders.
// They're not reactive to avoid infinite loops.
// eslint-disable-next-line prefer-const
let _analytics_renderCount = 0;
let _analytics_occurrencesCalculatedCount = 0;
// eslint-disable-next-line prefer-const
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!props.field?.path)
    return '';

  return overridePath(props.field.path, props.pathOverride);
});

// Keep track of changes to the field for analytics
const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.field;
});

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(path.value));
const validate = useValidateField(normalizedPath);
const submitCount = useSubmitCount();
const { remove, push, fields, update, values }
  = useFieldArrayExtended(normalizedPath);

// Occurrences information for each item in the array
const occurrences = computed(() => {
  _analytics_occurrencesCalculatedCount++;
  const _occurrences: {
    [index: string]: {
      hasValue: boolean
    }
  } = {};

  // Calculate for each value whether it has a value or not
  values.value.forEach((value, index) => {
    const hasValue = checkTreeHasValue(value);
    _occurrences[index] = {
      hasValue,
    };
  });

  return _occurrences;
});

const valuesCount = computed(
  () => Object.values(occurrences.value).filter(v => v.hasValue).length,
);

// minOccurs determines how many times this field should appear at minimum
const minOccurs = computed(() =>
  props.minOccursOverride !== undefined
    ? props.minOccursOverride
    : (field.value?.minOccurs ?? 1),
);

// maxOccurs determines how many times this field should appear at maximum
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (field.value?.maxOccurs ?? 1),
);

// An override we pass to the fields, as the sub-items should not be array items themselves
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : 1, // max 1
);

const canAddItems = computed(
  () =>
    // When we have less then the allowed amount
    maxOccurs.value > fields.value?.length,
);
const canRemoveItems = computed(() => {
  // If we're a child of a choiceField we can remove until 0 fields
  if (props.partOfChoiceField)
    return fields.value?.length > 0;

  // In other cases allow removing until we reach the minOccurs or the minimum of 1
  return fields.value?.length > minOccurs.value && fields.value?.length > 1;
});

// #endregion

// #region Watchers and lifecycle events
watch(
  values,
  (v) => {
    // In case the form has been validated, keep validating this field
    // on each change. This way the error message disappears and appears every time
    // an error is solved or introduced
    if (submitCount.value > 0) {
      validate();
    }
    emits('update:modelValue', v);
  },
  { immediate: true },
);

watchEffect(() => {
  // Don't add items when part of a choice field
  if (props.partOfChoiceField)
    return;

  // Add items automatically
  if (fields.value?.length < 1 || fields.value?.length < minOccurs.value) {
    addItem(null); // empty placeholder
  }
});
// #endregion

// #region Methods

function addItem(index?: number | null) {
  push(index ?? null);
  emits('update:modelValue', values.value);
}
function removeItem(index?: number) {
  // Remove the item at the given index or the last one
  remove(index ?? fields.value.length - 1);
  emits('update:modelValue', values.value);
}
function updateItem(value: any, index: number) {
  // Workaround for required validation on array items with attributes:
  // When an array item has attributes, the complexType structure may still contain the attribute values
  // even when the main value has just been emptied. This causes checkTreeHasValue() to return true,
  // incorrectly marking the item as having a value and bypassing required validation.
  // We explicitly call update() with undefined to ensure the value is properly cleared
  // and required validation can trigger correctly.
  if (value === undefined && index >= 0) {
    update(index, undefined);
  }
  emits('update:modelValue', values.value);
};

function getValuePath(_path: string, _index: number) {
  _path = `${_path}[${_index}]`;
  // Add the { value: ... } part for complex types
  if (props.field?.isComplexType && _path) {
    _path = `${_path}['value']`; // we use this notation to still have the same length when splitting the path by '.'
  }
  return _path;
};
// #endregion
</script>

<template>
  <div v-if="analytics" v-show="false">
    <span :data-testid="`${path}-analytics-render-count`">{{
      ++_analytics_renderCount
    }}</span>
  </div>
  <component
    :is="template"
    type="array"
    :field
    :can-add-items
    :can-remove-items
    :index
    :template-attrs
    :add-item
    :remove-item
  >
    <template #input="templateAttrs">
      <DynamicFormItem
        v-for="({ key }, index) in fields ?? []"
        :key="key"
        :template="template"
        :field
        :path-override="`${path}[${index}]`"
        part-of-array-field
        :max-occurs-override="_maxOccursOverride"
        :can-add-items
        :can-remove-items
        :index
        :analytics
        :template-attrs
        :add-item
        :remove-item
        @update:model-value="updateItem($event, index)"
      />
    </template>
  </component>
</template>
