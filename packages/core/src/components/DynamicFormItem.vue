<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericValidateFunction } from 'vee-validate';
import type { ComputedRef } from 'vue';
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { ComputedPropsType, FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { useField } from 'vee-validate';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { createValidation } from '@/utils/createValidation';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';
import { splitToValidationFunctions } from '@/utils/splitValidationFunctions';
import { syncRef } from '@/utils/syncRef';

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
let _analytics_fieldComputeCount = 0;
// #endregion

// #region Safety guard
// Detects non-idempotent value writes in computedProps that would cause an infinite recomputation loop.
// The counter resets after each microtask, so it only catches computes that happen synchronously.
const COMPUTE_LOOP_MAX = 10;
let _computeLoopCount = 0;
let _computeLoopResetScheduled = false;

function assertNoComputeLoop(fieldPath: string) {
  _computeLoopCount++;
  if (!_computeLoopResetScheduled) {
    _computeLoopResetScheduled = true;
    Promise.resolve().then(() => {
      // Reset after all synchronous computes in this tick have settled
      _computeLoopCount = 0;
      _computeLoopResetScheduled = false;
    });
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

/**
 * In case of an object, the useFieldValue() in vee-validate doesn't react on an update of a value of its children.
 * Therefore we keep track of an reactive value, that is updated by the children.
 */
const readOnlyValue = ref();

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

const isParent = computed(() => !!field.value?.children?.length);

const isChoice = computed(() => !!field.value?.choice?.length);

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(itemPath.value));

// We use a separate ref for the value that is passed to the computedProps.
// We need this, because the transformedField is needed before we call useField, but the actual value comes after, so we're stuck in a dependency loop.
const syncedValue = ref<unknown>();
const computedField = computed(() => {
  _analytics_fieldComputeCount++;
  assertNoComputeLoop(path.value);

  if (field.value?.computeOnChildValueChange === true) {
    // In case the component has children and when those children update their value, the object in the current component (parent)
    // doesn't retrigger this computed. If this is required, the computeOnChildValueChange can be set to true. We then include the
    // readOnlyValue in here, so the computed is hooked up to changes of children.
    void readOnlyValue.value;
  }
  const _computedField = (field.value?.computedProps ?? []).reduce(
    (field, compute) => {
      // We allow to transform the field metadata reactively based on the current value (syncedValue). In case the value is not
      // called upon in any of the computedProps, it will not be part of the reactivity that triggers a re-compute
      compute(field, syncedValue);
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

const isArray = computed(() => {
  if (props.isArrayOverride)
    return true;

  // Check if we can occur multiple times, if yes, we're an array.
  // This can not be reactive.
  return maxOccurs.value > 1;
});

const disabled = computed(() => maxOccurs.value === 0);

const required = computed(() => minOccurs.value >= 1 && !disabled.value);

const combinedValidation = computed<GenericValidateFunction[]>(() => {
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

  return _validations;
});

// Create the Vee-validate field context
const fieldContext = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const value = fieldContext.value;

const initialUpdate = ref(true);

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
// #endregion

// #region Watchers and lifecycle events
// keep in sync, to allow value updates in the computedField
syncRef(value, syncedValue, { master: 'b' });

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
// vee-validate, therefore we implemented manually.
watch(
  value,
  (v) => {
    // Don't update the parent if the initial value is empty
    if (!initialUpdate.value || v) {
      emits('update:modelValue', v);
    }

    initialUpdate.value = false;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
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
    emits('update:modelValue', value.value);
  }
});
// #endregion

// #region Methods
function updateReadOnlyValue(value: unknown) {
  readOnlyValue.value = value;
  emits('update:modelValue', value);
};

// In case of attributes, we only need to notify when the value has been set to undefined.
// This could be the last value in the object tree and some parents need to react on this.
// The attributes are only shown when the main field has a value, therefore we know the attribute
// will never be the first value int he object tree and therefore we can ignore it.
function notifyEmptyAttributeUpdate(value: unknown) {
  if (value !== undefined)
    return;
  emits('update:modelValue', readOnlyValue.value);
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
      :path-override="path"
      @update:model-value="updateReadOnlyValue"
    />
  </template>
  <template v-else-if="isArray">
    <DynamicFormItemArray
      v-bind="props"
      :field-metadata="computedField"
      :path-override="path"
      @update:model-value="updateReadOnlyValue"
    />
  </template>
  <template v-else>
    <component
      :is="template"
      :type="computedField.type"
      :field-metadata="computedField"
      :field-context
      :template-attrs
      :required
      :disabled
      :can-add-items
      :can-remove-items="_canRemoveItems"
      :add-item
      :remove-item
    >
      <template v-if="isParent" #children="templateAttrs">
        <DynamicFormItem
          v-for="child in computedField.children"
          :key="child.path"
          :field-metadata="(child as InternalMetadata)"
          :path-override="path"
          :template
          :template-attrs
          :min-occurs-override="_minOccursOverride"
          :max-occurs-override="_maxOccursOverride"
          @update:model-value="updateReadOnlyValue"
        />
      </template>
      <template v-if="!isParent" #input="templateAttrs">
        <component
          :is="template"
          :type="`${computedField.type}-input`"
          :field-metadata="computedField"
          :field-context
          :template-attrs
          :required
          :disabled
          :can-add-items
          :can-remove-items="_canRemoveItems"
          :add-item
          :remove-item
        />
      </template>
      <template v-if="showAttributes" #attributes="templateAttrs">
        <DynamicFormItem
          v-for="attribute in computedField.attributes"
          :key="attribute.path"
          :field-metadata="(attribute as InternalMetadata)"
          :path-override="path"
          :template
          :template-attrs
          :min-occurs-override="_minOccursOverride"
          :max-occurs-override="_maxOccursOverride"
          @update:model-value="notifyEmptyAttributeUpdate"
        />
      </template>
    </component>
  </template>
</template>
