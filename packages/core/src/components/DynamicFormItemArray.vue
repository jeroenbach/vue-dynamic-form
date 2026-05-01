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
  (e: 'update:computedField', field: InternalFieldMetadata<FieldMetadata>): void
}
type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Props, Emits and inject
const props = defineProps<Props>();
const emits = defineEmits<Emit>();
const settings = inject<ComputedRef<DynamicFormSettings>>(dynamicFormSettingsKey);
// #endregion

// #region Internal tracking
// Plain variables (not reactive) to avoid triggering renders when measuring analytics.
// eslint-disable-next-line prefer-const
let _analytics_renderCount = 0;
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
// #endregion

// #region Computed state

// --- Path ---

const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.fieldMetadata;
});

const path = computed(() => {
  if (!field.value?.path)
    return '';

  return overridePath(field.value.path, props.pathOverride);
});

const normalizedPath = computed(() => normalizePath(path.value));

// --- Vee-Validate field array ---

const validate = useValidateField(normalizedPath);
const { remove, push, fields, update, values, replace } = useFieldArrayExtended(normalizedPath);

// --- Occurrence limits ---

// minOccurs determines how many items must exist at minimum.
const minOccurs = computed(() =>
  props.minOccursOverride !== undefined
    ? props.minOccursOverride
    : (field.value?.minOccurs ?? 1),
);

// maxOccurs determines how many items may exist at maximum.
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (field.value?.maxOccurs ?? 1),
);

const disabled = computed(() => maxOccurs.value === 0);
const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// Each individual array item is rendered as a single-occurrence field, not another array.
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : 1,
);

const _canAddItems = computed(() => maxOccurs.value > fields.value?.length);
const _canRemoveItems = computed(() => {
  // Choice-field children can be removed down to 0.
  if (props.partOfChoiceField)
    return fields.value?.length > 0;

  // Otherwise, keep at least minOccurs items and never go below 1.
  return fields.value?.length > minOccurs.value && fields.value?.length > 1;
});

// --- Validation ---

// Validation is built as a computed (not watchEffect) because there is no circular dependency
// to break here — the array field does not depend on its own validation value.
const combinedValidation = computed<GenericValidateFunction[]>(() => {
  _analytics_constructValidationCount++;

  const _validations: GenericValidateFunction[] = [];
  const _messages = settings?.value?.messages;

  if (required.value)
    _validations.push(createValidation('xsd_minOccurs', minOccurs.value, _messages?.minOccurs));

  if (field.value?.validation)
    _validations.push(...splitToValidationFunctions(field.value?.validation));

  return _validations;
});

const { label, errors, errorMessage, handleBlur } = useField(normalizedPath, combinedValidation, {
  ...(field.value?.fieldOptions ?? {}),
  validateOnValueUpdate: false, // validation timing is owned by this component
});
const fieldContext: LimitedFieldContext = { label, errors, errorMessage };

// Delay validation until after the first real value is set — empty placeholder items
// (added to satisfy minOccurs) should not trigger errors before the user has interacted.
const submitCount = useSubmitCount();
const firstValueSet = ref(false);
const shouldValidateOnValueUpdate = computed(() => {
  if (!firstValueSet.value)
    return;

  const validateOnValueUpdateAfterSubmit = settings?.value?.validateOnValueUpdateAfterSubmit === true
    ? (submitCount.value > 0 && settings?.value?.validateOnValueUpdateAfterSubmit)
    : undefined;

  const validateWhenInError = settings?.value?.validateWhenInError && fieldContext?.errors.value?.length > 0
    ? true
    : undefined;

  // Priority: field-level option → in-error state → after-submit setting → global setting
  return field.value?.fieldOptions?.validateOnValueUpdate
    ?? validateWhenInError
    ?? validateOnValueUpdateAfterSubmit
    ?? settings?.value?.validateOnValueUpdate;
});

// #endregion

// #region Watchers and lifecycle events

watch(
  values,
  (v) => {
    if (shouldValidateOnValueUpdate.value) {
      validate();
    }
    emits('update:modelValue', v);
  },
  { immediate: true },
);

// Auto-add empty placeholder items to satisfy minOccurs.
// Skipped for choice-field children — the choice manages their count.
// Skipped when autoAddMinOccurs is explicitly set to false.
watchEffect(() => {
  if (props.partOfChoiceField)
    return;

  if (field.value?.autoAddMinOccurs === false)
    return;

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
    remove(index ?? fields.value.length - 1);
  }
  else {
    // Below the allowed minimum — clear the item instead of removing it.
    replace(values.value?.map((x, i) => i === index ? null : x));
  }

  emits('update:modelValue', values.value);
}

function guardAndNotifyItemUpdate(value: any, index: number) {
  if (!firstValueSet.value) {
    // Now that a real value exists, enable validation going forward.
    firstValueSet.value = true;
    if (shouldValidateOnValueUpdate.value) {
      validate();
    }
  }

  // Workaround: when an array item has attributes, the complexType wrapper may retain
  // attribute values even after the main value is cleared. This causes checkTreeHasValue()
  // to return true and bypasses required validation. Explicitly calling update() with undefined
  // ensures vee-validate clears the entry and required validation can fire correctly.
  if (value === undefined && index >= 0) {
    update(index, undefined);
  }

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
    :slot-props
    :can-add-items="_canAddItems"
    :can-remove-items="_canRemoveItems"
    :add-item="_addItem"
    :remove-item="_removeItem"
  >
    <template #default="slotProps">
      <DynamicFormItem
        v-for="({ key }, arrayIndex) in fields ?? []"
        :key="key"
        :field-metadata
        :path-override="`${path}[${arrayIndex}]`"
        :index="arrayIndex"
        :template="template"
        :slot-props
        :max-occurs-override="_maxOccursOverride"
        :can-add-items="_canAddItems"
        :can-remove-items="_canRemoveItems"
        :add-item="_addItem"
        :remove-item="() => _removeItem(arrayIndex)"
        part-of-array-field
        is-array-override="single"

        @update:model-value="guardAndNotifyItemUpdate($event, arrayIndex)"
        @update:computed-field="emits('update:computedField', $event)"
        @blur="handleBlur"
      />
    </template>
  </component>
</template>
