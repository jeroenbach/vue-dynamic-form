<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericValidateFunction } from 'vee-validate';
import type { ComputedRef } from 'vue';
import type { FieldContext } from '@/components/DynamicFormTemplate.vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { ComputedPropsType, FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField, useSubmitCount } from 'vee-validate';
import { computed, inject, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';
import { splitToValidationFunctions } from '@/utils/splitValidationFunctions';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: unknown): void
  (e: 'blur', event?: Event | undefined, shouldValidate?: boolean | undefined): void
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
let _analytics_fieldComputeCount = 0;
let _analytics_valueChangedCount = 0;
let _analytics_notifyValueUpdateCount = 0;
// #endregion

// #region Safety guard
// Detects non-idempotent value writes in computedProps that would cause an infinite recomputation loop.
// The counter resets after each microtask, so it only catches computes that happen synchronously.
const COMPUTE_LOOP_MAX = 10;
let _computeLoopCount = 0;
let _computeLoopResetTimer: ReturnType<typeof setTimeout> | undefined;

function assertNoComputeLoop(fieldPath: string) {
  _computeLoopCount++;

  if (_computeLoopResetTimer == null) {
    _computeLoopResetTimer = setTimeout(() => {
      // Reset after the current macrotask so repeated Vue flushes in one runaway update
      // cascade still accumulate and trip the guard.
      _computeLoopCount = 0;
      _computeLoopResetTimer = undefined;
    }, 0);
  }
  if (_computeLoopCount > COMPUTE_LOOP_MAX) {
    throw new Error(
      `[DynamicFormItem] Possible infinite loop detected in computedProps for field "${fieldPath}". `
      + `computedProps recomputed more than ${COMPUTE_LOOP_MAX} times synchronously. `
      + `Ensure value writes inside computedProps are idempotent (the same input always produces the same output).`,
    );
  }
}
// #endregion

// #region Computed properties and state

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

// If the field has attributes, it automatically becomes a complexType
const isComplexType = computed(() => field.value?.isComplexType || field.value?.attributes?.length);

// The path that takes value types into consideration
const itemPath = computed(() => {
  let _path = path.value;
  if (isComplexType.value && _path) {
    const complexTypeValueProperty = settings?.value?.complexTypeValueProperty ?? 'value';
    _path = `${_path}['${complexTypeValueProperty}']`; // we use this notation to still be able to count the segments by splitting on '.'
  }
  return _path;
});

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(itemPath.value));

const isArray = computed(() => {
  if (props.isArrayOverride === 'array')
    return true;

  if (props.isArrayOverride === 'single')
    return false;

  // Check if we can occur multiple times, if yes, we're an array.
  // This can not be reactive.
  return (field.value?.maxOccurs ?? 1) > 1;
});

const combinedValidation = ref<GenericValidateFunction[]>([]);

// Create the Vee-validate extended field context
const fieldContext = !isArray.value
  ? useField(normalizedPath, combinedValidation, {
    ...(field.value?.fieldOptions ?? {}),
    validateOnValueUpdate: false, // We own the validation moment
  }) as FieldContext
  : { value: ref(undefined) } as FieldContext;

const value = fieldContext.value;

const initialUpdate = ref(true);

/**
 * In case of an object, the useFieldValue() in vee-validate doesn't react on an update of a value of its children.
 * Therefore we keep track of an reactive value, that is updated by the children. That re-triggers reactivity
 */
const childValueReactivity = ref(0);

const computedField = computed(() => {
  _analytics_fieldComputeCount++;
  assertNoComputeLoop(path.value);

  if (field.value?.computeOnChildValueChange === true) {
    // In case the component has children and when those children update their value, the object in the current component (parent)
    // doesn't retrigger this computed. If this is required, the computeOnChildValueChange can be set to true. We then include the
    // childValueReactivity in here, so the computed is hooked up to changes of children.
    void childValueReactivity.value;
  }
  const _computedField = (field.value?.computedProps ?? []).reduce(
    (field, compute) => {
      // We allow to transform the field metadata reactively based on the current value. In case the value is not
      // called upon in any of the computedProps, it will not be part of the reactivity that triggers a re-compute
      compute(field, value);
      return field;
    },
    // Spread the original object, so we can make changes & add the actual path
    { ...field.value, path: path.value } as ComputedPropsType<FieldMetadata>,
  );

  // Path is always reverted back to our calculated value. This way it can be used, but no set.
  const _internalMetadata = _computedField as InternalMetadata; // convert back to normal (stop pretending to not have any children and other excluded properties)
  _internalMetadata.path = path.value;

  return _internalMetadata;
});

// minOccurs determines how many times this field should appear at minimum
const minOccurs = computed(() => {
  if (props.minOccursOverride !== undefined)
    return props.minOccursOverride;

  // In case this element is part of an array field, make the field optional
  if (props.partOfArrayField)
    return 0;

  return computedField.value?.minOccurs ?? 1;
});

// maxOccurs determines how many times this field should appear at maximum
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (computedField.value?.maxOccurs ?? 1),
);

const isParent = computed(() => !!field.value?.children?.length);

const isChoice = computed(() => !!field.value?.choice?.length);

// If we're none of the other types that can hold other components, we're an input
const isInput = computed(() => !isArray.value && !isChoice.value && !isParent.value);

const disabled = computed(() => maxOccurs.value === 0);

const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// In case this field is optional, we also want to temporarily set the minOccurs to 0 (not required) of the children of this field.
// if this field is optional and none of the children have values yet. Then all required validation
// is removed and the user is not forced to fill in any values.
const _minOccursOverride = computed(() => {
  // If one of it's parents has set the override, pass it down
  // But only if it's set to 0
  if (props.minOccursOverride === 0)
    return props.minOccursOverride;

  // If the field is required, don't bother continuing (as we don't need to override anything)
  if (minOccurs.value > 0)
    return undefined;

  // So the field is optional, now check whether there is a value in it
  if (checkTreeHasValue(value.value))
    return undefined;

  // No value and the field is optional, set the children to minOccurs = 0 (optional)
  return 0;
});

// When the maxOccurs = 0, we use that to disable fields. We need to pass this down to its children
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

const _canRemoveItems = computed(() => {
  // If we're part of an array field and we have a value, we can always remove it.
  // This way the user can just easily press the x button to clear any values.
  if (props.partOfArrayField && checkTreeHasValue((value.value)))
    return true;

  // In all other cases, listen to the props
  return props.canRemoveItems;
});

const showAttributes = computed(
  () => field.value?.attributes?.length && checkTreeHasValue(value.value),
);
const submitCount = useSubmitCount();
const shouldValidateOnValueUpdate = computed(() => {
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

// #region Improve FieldContext
fieldContext.hasValue = computed(
  // Computed that will only be called, when the hasValue.value is actually used
  () => checkTreeHasValue(value.value),
);

// When shouldValidate is not provided, I would have expected to use the general settings and not a default false.
// Therefore we override the handleBlur and handleChange and listen to the settings, before setting a default.
const originalHandleBlur = fieldContext.handleBlur;
fieldContext.handleBlur = function (e?: Event | undefined, shouldValidate?: boolean | undefined) {
  shouldValidate = shouldValidate ?? settings?.value?.validateOnBlur;
  originalHandleBlur(e, shouldValidate);
  emits('blur', e, shouldValidate); // add a helper for array fields to know when a blur occurred
};

const originalHandleChange = fieldContext.handleChange;
fieldContext.handleChange = function (e: unknown, shouldValidate?: boolean | undefined) {
  // We're handling the validate in the value watcher. Only execute it here if it is explicitly set to true by the user
  originalHandleChange(e, shouldValidate === true);
};

// #endregion

// #region Watchers and lifecycle events
/**
 * We've used a watchEffect to solve a circular reference. The useField starts with an empty validation, but this will be updated quickly.
 * Because we have a circular reference with the computedField, that needs the value from useField,
 * and useField needs the combinedValidation, which needs the computedField again.
 */
watchEffect(() => {
  _analytics_constructValidationCount++;

  const _validations: GenericValidateFunction[] = [];
  const _restriction = field.value.restriction ?? {};
  const _messages = settings?.value?.messages;

  if (required.value)
    _validations.push(createValidation('xsd_required', undefined, _messages?.required));

  if (_restriction.minLength != null)
    _validations.push(createValidation('xsd_minLength', _restriction.minLength, _messages?.minLength));

  if (_restriction.maxLength != null)
    _validations.push(createValidation('xsd_maxLength', _restriction.maxLength, _messages?.maxLength));

  if (_restriction.length != null)
    _validations.push(createValidation('xsd_length', _restriction.length, _messages?.length));

  if (_restriction.pattern != null)
    _validations.push(createValidation('xsd_pattern', _restriction.pattern, _messages?.pattern));

  if (_restriction.minInclusive != null)
    _validations.push(createValidation('xsd_minInclusive', _restriction.minInclusive, _messages?.minInclusive));

  if (_restriction.maxInclusive != null)
    _validations.push(createValidation('xsd_maxInclusive', _restriction.maxInclusive, _messages?.maxInclusive));

  if (_restriction.minExclusive != null)
    _validations.push(createValidation('xsd_minExclusive', _restriction.minExclusive, _messages?.minExclusive));

  if (_restriction.maxExclusive != null)
    _validations.push(createValidation('xsd_maxExclusive', _restriction.maxExclusive, _messages?.maxExclusive));

  if (_restriction.enumeration != null)
    _validations.push(createValidation('xsd_enumeration', _restriction.enumeration, _messages?.enumeration));

  if (_restriction.whiteSpace != null)
    _validations.push(createValidation('xsd_whiteSpace', _restriction.whiteSpace, _messages?.whiteSpace));

  if (_restriction.fractionDigits != null)
    _validations.push(createValidation('xsd_fractionDigits', _restriction.fractionDigits, _messages?.fractionDigits));

  if (_restriction.totalDigits != null)
    _validations.push(createValidation('xsd_totalDigits', _restriction.totalDigits, _messages?.totalDigits));

  // Add the user defined validations, if they exist
  if (field.value?.validation)
    _validations.push(...splitToValidationFunctions(field.value?.validation));

  combinedValidation.value = _validations;
});

// Hook into the fieldContext.value to make sure that if it is an empty string we change the value to undefined.
// This way the element is removed from the parent object.
let _transforming = false;
watch(value, (newValue) => {
  // We need to use a guard flag, because we're updating the same value we're watching.
  // Which would cause an endless loop
  if (_transforming)
    return;

  _transforming = true;

  // In case of an empty value, remove the element from the parent object by setting it to undefined.
  // In case of an arrayField we set it back to null
  if (newValue === '')
    value.value = props.partOfArrayField ? null : undefined;

  _transforming = false;
}, {
  flush: 'sync', // we need to override the value before its used somewhere else
});

// We watch the value because it can also be updated by other vee-validate methods.
// Every time its updated we let the parent know that the value has changed. This functionality is not present it
// vee-validate, therefore we implemented manually using a readOnlyValue.
watch(
  value,
  (v) => {
    _analytics_valueChangedCount++;

    // Only notify and validate when this is an actual input field, in all other cases
    // it will be done by the children directly
    if (!isInput.value)
      return;

    // Don't update the parent if the initial value is empty, neither validate
    if (!initialUpdate.value || v) {
      notifyValueUpdate();

      if (shouldValidateOnValueUpdate.value)
        fieldContext?.validate();
    }

    initialUpdate.value = false;
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  if (_computeLoopResetTimer != null)
    clearTimeout(_computeLoopResetTimer);

  // Array items are cleaned up by useFieldArray's remove() — setting the value to undefined here
  // would write back to form.values at the (now-removed) index, causing useFieldArray's sync
  // watcher to detect a mismatch and re-add the entry via initFields().
  if (props.partOfArrayField) {
    return;
  }

  // In case of attributes, they're removed depending on whether the parent has a value.
  // We experience the problem that if the value is removed, the attribute field is removed but the value remained.
  // Therefore we have this extra rule to remove any values once a field gets unmounted.
  if (value.value !== undefined) {
    value.value = undefined;
    // The watch is not executed anymore at this point, therefore manually update the parents
    notifyValueUpdate();
  }
});
// #endregion

// #region Methods

function notifyValueUpdate() {
  _analytics_notifyValueUpdateCount++;
  childValueReactivity.value++;
  emits('update:modelValue', value.value);
};

/**
 * In case of an ArrayField, we bypass the useField, therefore we need to manually update the value.
 */
function updateArrayValue(_value: unknown) {
  value.value = _value;
  emits('update:modelValue', value.value);
};
// #endregion
</script>

<template>
  <div v-if="settings?.analytics" v-show="false">
    <span :data-testid="`${path}-analytics-render-count`">{{
      ++_analytics_renderCount
    }}</span>
  </div>
  <template v-if="isChoice">
    <DynamicFormItemChoice
      v-bind="props"
      :field-metadata="computedField"

      @update:model-value="notifyValueUpdate"
    />
  </template>
  <template v-else-if="isArray">
    <DynamicFormItemArray
      v-bind="props"
      :part-of-choice-field
      :field-metadata="computedField"

      @update:model-value="updateArrayValue"
    />
  </template>
  <template v-else>
    <component
      :is="template"
      :type="computedField.type"
      :field-metadata="computedField"
      :field-context
      :slot-props
      :required
      :disabled
      :can-add-items
      :can-remove-items="_canRemoveItems"
      :add-item
      :remove-item
    >
      <template #default="slotProps">
        <template v-if="isParent">
          <DynamicFormItem
            v-for="child in computedField.children"
            :key="child.path"
            :field-metadata="(child as InternalMetadata)"
            :path-override="itemPath"
            :template
            :slot-props
            :min-occurs-override="_minOccursOverride"
            :max-occurs-override="_maxOccursOverride"

            @update:model-value="notifyValueUpdate"
          />
        </template>
        <template v-if="!isParent">
          <component
            :is="template"
            :type="`${computedField.type}-input`"
            :field-metadata="computedField"
            :field-context
            :slot-props
            :required
            :disabled
            :can-add-items
            :can-remove-items="_canRemoveItems"
            :add-item
            :remove-item
          />
        </template>
      </template>
      <template v-if="showAttributes" #attributes="slotProps">
        <DynamicFormItem
          v-for="attribute in computedField.attributes"
          :key="attribute.path"
          :field-metadata="(attribute as InternalMetadata)"
          :path-override="path"
          :template
          :slot-props
          :min-occurs-override="_minOccursOverride"
          :max-occurs-override="_maxOccursOverride"

          @update:model-value="notifyValueUpdate"
        />
      </template>
    </component>
  </template>
</template>
