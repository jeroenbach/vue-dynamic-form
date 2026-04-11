<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericValidateFunction } from 'vee-validate';
import type { ComputedRef } from 'vue';
import type { LimitedFieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField, useFieldError, useForm, useSetFieldError, useSubmitCount, useValidateField } from 'vee-validate';
import { computed, inject, ref, watch, watchEffect } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { useFieldArrayExtended } from '@/core/useFieldArrayExtended';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';
import { splitToValidationFunctions } from '@/utils/splitValidationFunctions';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: unknown): void
}

type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
// #endregion

// #region Analytics: to test reactivity and prevent unnecessary rerenders.
// They're not reactive to avoid infinite loops.
// eslint-disable-next-line prefer-const
let _analytics_renderCount = 0;
let _analytics_occurrencesCalculatedCount = 0;

let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;

// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!props.fieldMetadata?.path)
    return '';

  return overridePath(props.fieldMetadata.path, props.pathOverride);
});

// Keep track of changes to the field for analytics
const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.fieldMetadata;
});

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(path.value));
const validate = useValidateField(normalizedPath);
const submitCount = useSubmitCount();
const { remove, push, fields, update, values, replace }
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

const disabled = computed(() => maxOccurs.value === 0);

const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// An override we pass to the fields, as the sub-items should not be array items themselves
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : 1, // max 1
);

const _canAddItems = computed(
  () =>
    // When we have less then the allowed amount
    maxOccurs.value > fields.value?.length,
);
const _canRemoveItems = computed(() => {
  // If we're a child of a choiceField we can remove until 0 fields
  if (props.partOfChoiceField)
    return fields.value?.length > 0;

  // In other cases allow removing until we reach the minOccurs or the minimum of 1
  return fields.value?.length > minOccurs.value && fields.value?.length > 1;
});

const combinedValidation = computed<GenericValidateFunction[]>(() => {
  _analytics_constructValidationCount++;

  const _validations: GenericValidateFunction[] = [];
  const _messages = settings?.value?.messages;

  if (required.value)
    _validations.push(createValidation('xsd_minOccurs', minOccurs.value, _messages?.minOccurs));

  // Add the user defined validations, if they exist
  if (field.value?.validation)
    _validations.push(...splitToValidationFunctions(field.value?.validation));

  return _validations;
});

const { label, errors, errorMessage } = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const fieldContext: LimitedFieldContext = { label, errors, errorMessage };
// #endregion

// #region Watchers and lifecycle events
watch(
  values,
  (v) => {
    // In case there are validation errors, keep validating this field
    // on each change. This way the error message disappears and appears every time
    // an error is solved or introduced
    if (errors.value?.length > 0) {
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

  // Auto-add items to meet minOccurs — sync initial value so vee-validate
  // doesn't count these empty placeholders as user changes (dirty form)
  if (fields.value?.length < 1 || fields.value?.length < minOccurs.value) {
    _addItem();
    // push(null);
    // resetField(normalizedPath.value, { value: [...values.value] });
  }
});
// #endregion

// #region Methods

function _addItem() {
  push(null); // empty placeholder
  emits('update:modelValue', values.value);
}

function _removeItem(index?: number) {
  if (_canRemoveItems.value) {
    // Remove the item at the given index or the last one
    remove(index ?? fields.value.length - 1);
  }
  else {
    // In case we're not allowed to remove an item, clear it instead
    replace(values.value?.map((x, i) => i === index ? null : x));
  }

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

  // Emit the value coming from vee-validate
  emits('update:modelValue', values.value);
};

function getValuePath(_path: string, _index: number) {
  _path = `${_path}[${_index}]`;
  // Add the { value: ... } part for complex types
  if (props.fieldMetadata?.isComplexType && _path) {
    const complexTypeValueProperty = settings?.value?.complexTypeValueProperty ?? 'value';
    _path = `${_path}['${complexTypeValueProperty}']`; // we use this notation to still have the same length when splitting the path by '.'
  }
  return _path;
};
// #endregion
</script>

<template>
  <div v-if="settings?.analytics" v-show="false">
    <span :data-testid="`${path}-analytics-render-count`">{{
      ++_analytics_renderCount
    }}</span>
  </div>
  <component
    :is="template"
    type="array"
    :field-metadata
    :field-context
    :required
    :disabled
    :index
    :template-attrs
    :can-add-items="_canAddItems"
    :can-remove-items="_canRemoveItems"
    :add-item="_addItem"
    :remove-item="_removeItem"
  >
    <template #default="templateAttrs">
      <DynamicFormItem
        v-for="({ key }, index) in fields ?? []"
        :key="key"
        :template="template"
        :field-metadata
        :path-override="`${path}[${index}]`"
        :max-occurs-override="_maxOccursOverride"
        :index
        :template-attrs
        :can-add-items="_canAddItems"
        :can-remove-items="_canRemoveItems"
        :add-item="_addItem"
        :remove-item="() => _removeItem(index)"
        part-of-array-field

        @update:model-value="updateItem($event, index)"
      />
    </template>
  </component>
</template>
