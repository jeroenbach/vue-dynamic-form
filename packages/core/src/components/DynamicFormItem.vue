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

// #region Internal tracking

// Plain variables (not reactive) to avoid triggering renders when measuring analytics.
// eslint-disable-next-line prefer-const
let _analytics_renderCount = 0;
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
let _analytics_fieldComputeCount = 0;
let _analytics_valueChangedCount = 0;
let _analytics_notifyValueUpdateCount = 0;

// Detects non-idempotent writes inside computedProps that would cause an infinite recomputation loop.
// The counter resets after each macrotask, so it only catches computes that happen synchronously.
const COMPUTE_LOOP_MAX = 10;
let _computeLoopCount = 0;
let _computeLoopResetTimer: ReturnType<typeof setTimeout> | undefined;

function assertNoComputeLoop(fieldPath: string) {
  _computeLoopCount++;

  if (_computeLoopResetTimer == null) {
    _computeLoopResetTimer = setTimeout(() => {
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

// If the field has attributes, it is treated as a complex type: the user-visible value lives
// at a nested property (e.g. `path['value']`) instead of directly at `path`.
const isComplexType = computed(() => field.value?.isComplexType || field.value?.attributes?.length);

// The path vee-validate binds to. For complex types we append the value property key
// using bracket notation so segment counting by '.' still works correctly.
const itemPath = computed(() => {
  let _path = path.value;
  if (isComplexType.value && _path) {
    const complexTypeValueProperty = settings?.value?.complexTypeValueProperty ?? 'value';
    _path = `${_path}['${complexTypeValueProperty}']`;
  }
  return _path;
});

const normalizedPath = computed(() => normalizePath(itemPath.value));

const isArray = computed(() => {
  if (props.isArrayOverride === 'array')
    return true;

  if (props.isArrayOverride === 'single')
    return false;

  return (field.value?.maxOccurs ?? 1) > 1;
});

// --- Vee-Validate field context ---

// Initialized empty; populated by the watchEffect below.
// This indirection breaks a circular dependency:
//   combinedValidation → computedField → value → fieldContext → combinedValidation
const combinedValidation = ref<GenericValidateFunction[]>([]);

const fieldContext = !isArray.value
  ? useField(normalizedPath, combinedValidation, {
    ...(field.value?.fieldOptions ?? {}),
    validateOnValueUpdate: false, // validation timing is owned by this component
  }) as FieldContext
  : { value: ref(undefined) } as FieldContext;

const value = fieldContext.value;

// Lazily evaluated — only computed when accessed, safe to use on deep field trees.
fieldContext.hasValue = computed(() => checkTreeHasValue(value.value));

// Apply the global validateOnBlur setting when shouldValidate is not explicitly provided.
const originalHandleBlur = fieldContext.handleBlur;
fieldContext.handleBlur = function (e?: Event | undefined, shouldValidate?: boolean | undefined) {
  shouldValidate = shouldValidate ?? settings?.value?.validateOnBlur;
  originalHandleBlur(e, shouldValidate);
  emits('blur', e, shouldValidate); // lets array fields know when a blur occurred
};

// Validation is handled in the value watcher; only pass through when explicitly requested.
const originalHandleChange = fieldContext.handleChange;
fieldContext.handleChange = function (e: unknown, shouldValidate?: boolean | undefined) {
  originalHandleChange(e, shouldValidate === true);
};

// --- Field type flags ---

const isParent = computed(() => !!field.value?.children?.length);
const isChoice = computed(() => !!field.value?.choice?.length);
// An input is any leaf field — not a repeating array, not a branching choice, not a parent group.
const isInput = computed(() => !isArray.value && !isChoice.value && !isParent.value);

// --- Reactive field and dynamic state ---

// When a child updates its value, vee-validate's useFieldValue() does not re-trigger on the parent
// computed. Incrementing this ref from notifyValueUpdate() forces computedField to re-evaluate
// when computeOnChildValueChange is enabled.
const childValueReactivity = ref(0);
const initialUpdate = ref(true);

const computedField = computed(() => {
  _analytics_fieldComputeCount++;
  assertNoComputeLoop(path.value);

  if (field.value?.computeOnChildValueChange === true) {
    void childValueReactivity.value; // subscribe to child value changes
  }

  const _computedField = (field.value?.computedProps ?? []).reduce(
    (field, compute) => {
      // computedProps may read `value` to drive reactive transformations;
      // if value is not accessed, it won't contribute to this computed's dependencies.
      compute(field, value);
      return field;
    },
    { ...field.value, path: path.value } as ComputedPropsType<FieldMetadata>,
  );

  // Always restore our calculated path — computedProps may read it but must not override it.
  const _internalMetadata = _computedField as InternalMetadata;
  _internalMetadata.path = path.value;

  return _internalMetadata;
});

// --- Occurrence limits ---

// minOccurs determines how many times this field must appear at minimum.
const minOccurs = computed(() => {
  if (props.minOccursOverride !== undefined)
    return props.minOccursOverride;

  // Array items themselves control multiplicity; individual items are always optional.
  if (props.partOfArrayField)
    return 0;

  return computedField.value?.minOccurs ?? 1;
});

// maxOccurs determines how many times this field may appear at maximum.
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (computedField.value?.maxOccurs ?? 1),
);

const disabled = computed(() => maxOccurs.value === 0);
const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// When this optional field has no value yet, propagate minOccurs=0 to children so their
// required validation doesn't fire until the user starts filling in values.
const _minOccursOverride = computed(() => {
  // If an ancestor already set the override to 0, keep propagating it.
  if (props.minOccursOverride === 0)
    return props.minOccursOverride;

  // Field is required — nothing to override.
  if (minOccurs.value > 0)
    return undefined;

  // Field is optional but already has a value — keep children required.
  if (checkTreeHasValue(value.value))
    return undefined;

  // Optional field with no value: make all children optional too.
  return 0;
});

// When maxOccurs=0 (disabled), propagate the disabled state to children.
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

const _canRemoveItems = computed(() => {
  // Array items with a value can always be removed via the × button to clear them.
  if (props.partOfArrayField && checkTreeHasValue(value.value))
    return true;

  return props.canRemoveItems;
});

// --- Validation helpers ---

const submitCount = useSubmitCount();
const shouldValidateOnValueUpdate = computed(() => {
  // Only check validateOnValueUpdateAfterSubmit when it is explicitly true; otherwise leave
  // the decision to the next check (undefined means "defer to next rule").
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

const showAttributes = computed(
  () => field.value?.attributes?.length && checkTreeHasValue(value.value),
);

// #endregion

// #region Watchers and lifecycle events

// Build the validation array reactively so it stays in sync with field metadata and settings.
// watchEffect (rather than computed) is used here to avoid the circular dependency described
// at the combinedValidation declaration above.
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

  if (field.value?.validation)
    _validations.push(...splitToValidationFunctions(field.value?.validation));

  combinedValidation.value = _validations;
});

// Normalise empty strings to undefined (or null for array items) so the field is cleanly
// removed from the form values object rather than left as an empty string.
// flush: 'sync' ensures the value is corrected before any other watchers or computeds read it.
let _transforming = false;
watch(value, (newValue) => {
  if (_transforming)
    return;

  _transforming = true;
  if (newValue === '')
    value.value = props.partOfArrayField ? null : undefined;
  _transforming = false;
}, {
  flush: 'sync',
});

// Notify the parent and conditionally trigger validation whenever the value changes.
// vee-validate does not provide a built-in update event, so we implement it here.
watch(
  value,
  (v) => {
    _analytics_valueChangedCount++;

    // Only leaf inputs emit; parent/array/choice fields are updated by their children.
    if (!isInput.value)
      return;

    // Skip notification on the initial render if there is no value yet.
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

  // Array items are cleaned up by useFieldArray's remove() — setting value to undefined here
  // would write back to form.values at the (now-removed) index, causing useFieldArray's sync
  // watcher to detect a mismatch and re-add the entry via initFields().
  if (props.partOfArrayField)
    return;

  // Attribute fields are conditionally mounted based on whether the parent has a value.
  // When unmounted, explicitly clear the value so it is removed from the form state.
  if (value.value !== undefined) {
    value.value = undefined;
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

// Array fields bypass useField and manage their own field array; when their value changes
// we receive it here and write it directly so the parent can pick it up via its own watcher.
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
