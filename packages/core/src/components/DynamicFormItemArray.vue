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
import { useField, useSubmitCount, useValidateField } from 'vee-validate';
import { computed, inject, ref, watch, watchEffect } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { useFieldArrayExtended } from '@/core/useFieldArrayExtended';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
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
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
// #endregion

// Keep track of changes to the field for analytics
const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.fieldMetadata;
});

// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!field.value?.path)
    return '';

  return overridePath(field.value.path, props.pathOverride);
});

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(path.value));
const validate = useValidateField(normalizedPath);
const { remove, push, fields, update, values, replace }
  = useFieldArrayExtended(normalizedPath);

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

const { label, errors, errorMessage, handleBlur } = useField(normalizedPath, combinedValidation, {
  ...(field.value?.fieldOptions ?? {}),
  validateOnValueUpdate: false, // We own the validation moment
});
const fieldContext: LimitedFieldContext = { label, errors, errorMessage };

// Because we add empty placeholders, we only want to trigger validation once a child actually updated the value
const submitCount = useSubmitCount();
const firstValueSet = ref(false);
const shouldValidateOnValueUpdate = computed(() => {
  // Without a first value set, no point validating
  if (!firstValueSet.value)
    return;

  // Only when validateOnValueUpdateAfterSubmit is true, we want to take the check into account.
  // The check can be true or false, both should be final. In case validateOnValueUpdateAfterSubmit is not true (undefined or false)
  // we want to listen to the next check (therefore we use undefined).
  const validateOnValueUpdateAfterSubmit = settings?.value?.validateOnValueUpdateAfterSubmit === true
    ? (submitCount.value > 0 && settings?.value?.validateOnValueUpdateAfterSubmit)
    : undefined;

  // Either validate or let another value determine whether we should validate
  const validateWhenInError = settings?.value?.validateWhenInError && fieldContext?.errors.value?.length > 0
    ? true
    : undefined;

  // field has priority
  return field.value?.fieldOptions?.validateOnValueUpdate
  // then whether we are in error
    ?? validateWhenInError
  // then whether we only want to validate after submit
    ?? validateOnValueUpdateAfterSubmit
  // and finally the always validate
    ?? settings?.value?.validateOnValueUpdate;
});
// #endregion

// #region Watchers and lifecycle events
watch(
  values,
  (v) => {
    // Automatically validate when we configured it to do so
    if (shouldValidateOnValueUpdate.value) {
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

  // Auto-add items to meet minOccurs
  if (fields.value?.length < 1 || fields.value?.length < minOccurs.value) {
    _addItem();
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

function guardAndNotifyItemUpdate(value: any, index: number) {
  if (!firstValueSet.value) {
    // We postponed validation until the first value is set, now that the first value is set
    // make sure that we also validate if we have to
    firstValueSet.value = true;
    if (shouldValidateOnValueUpdate.value) {
      validate();
    }
  }

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
        :field-metadata
        :path-override="`${path}[${index}]`"
        :index
        :template="template"
        :template-attrs
        :max-occurs-override="_maxOccursOverride"
        :can-add-items="_canAddItems"
        :can-remove-items="_canRemoveItems"
        :add-item="_addItem"
        :remove-item="() => _removeItem(index)"
        part-of-array-field
        is-array-override="single"

        @update:model-value="guardAndNotifyItemUpdate($event, index)"
        @blur="handleBlur"
      />
    </template>
  </component>
</template>
