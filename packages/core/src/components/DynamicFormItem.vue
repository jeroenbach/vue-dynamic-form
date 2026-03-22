<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { GenericValidateFunction } from 'vee-validate';
import type { ComputedRef, WatchSource } from 'vue';
import type { ValidationRule } from '@/core/validation';

import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { ComputedPropsType, FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import type { FieldValidationMetaInfo, ValidationMessage } from '@/types/ValidationMessage';
import { useField, validate } from 'vee-validate';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';
import { resolveMessage, ruleParamNames } from '@/core/validation';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
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
let _analytics_fieldTransformCount = 0;
// #endregion

// #region Computed properties and state

// Elements without a path should be ignored, as they cannot be linked to a value in vee-validate
const validElement = computed(() => !!props.fieldMetadata?.path);

// Sections and Combined fields have a collection of fields
const isFieldCollection = computed(
  () => !!(validElement.value && props.fieldMetadata?.children?.length),
);

// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!props.fieldMetadata?.path)
    return '';

  return overridePath(props.fieldMetadata.path, props.pathOverride);
});

// The path that takes value types into consideration
const itemPath = computed(() => {
  let _path = path.value;
  if (props.fieldMetadata?.isComplexType && _path) {
    _path = `${_path}['value']`; // we use this notation to still be able to count the segments by splitting on '.'
  }
  return _path;
});

// Keep track of changes to the field for analytics
const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.fieldMetadata;
});

// minOccurs determines how many times this field should appear at minimum
const minOccurs = computed(() => {
  if (props.minOccursOverride !== undefined)
    return props.minOccursOverride;

  // In case this element is part of an array field, make the field optional
  if (props.partOfArrayField)
    return 0;

  return field.value?.minOccurs ?? 1;
});

// maxOccurs determines how many times this field should appear at maximum
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (field.value?.maxOccurs ?? 1),
);

const disabled = computed(() => maxOccurs.value === 0);

const required = computed(() => minOccurs.value >= 1 && !disabled.value);

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(itemPath.value));

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

const fieldContext = useField(normalizedPath, combinedValidation, field.value?.fieldOptions);
const value = fieldContext.value;
const errorMessage = fieldContext.errorMessage;

const initialUpdate = ref(true);

const isParent = computed(() => !!field.value?.children?.length);
const isChoice = computed(() => !!field.value?.choice?.length);
const isArray = computed(() => {
  //
  if (props.isArrayOverride)
    return true;

  // Check if we can occur multiple times, if yes, we're an array.
  // This can not be reactive.
  return maxOccurs.value > 1;
});

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

/**
 * In case of an object, the useFieldValue() in vee-validate doesn't react on an update of a value of its children.
 * Therefore we keep track of an reactive value, that is updated by the children.
 */
const readOnlyValue = ref();

const transformedField = computed(() => {
  _analytics_fieldTransformCount++;

  // We allow to transform the field metadata reactively based on the current value.
  // To do this we set the value using a readOnlyValue ref. Every time the ref is updated, this transformField is re-executed.
  // If we don't set the value with the ref, the link is never made and this computed is not re-excuted on value changes.
  let value: WatchSource<unknown>;
  if (props.fieldMetadata.computeOnValueChange === true) {
    value = readOnlyValue.value;
  }

  const _transformedField = (props.fieldMetadata.computedProps ?? []).reduce(
    (field, transformer) => transformer(field, value),
    {
      ...props.fieldMetadata,
      computedProps: [...(props.fieldMetadata.computedProps ?? [])],
    } as ComputedPropsType<FieldMetadata>,
  );

  _transformedField.path = path.value;

  return _transformedField as InternalMetadata; // convert back to normal (stop pretending to not have any children)
});
// #endregion

// #region Watchers and lifecycle events
// We watch the value because it can also be updated by other vee-validate methods
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

function setFieldValue(_value: unknown) {
  // In case of an empty value, remove the element from the parent object by setting it to undefined
  value.value = _value === '' ? undefined : _value; // the watch will emit the update:modelValue

  emits('update:modelValue', value.value);
}

function updateReadOnlyValue(value: any) {
  readOnlyValue.value = value;
  emits('update:modelValue', value);
};

/**
 * Creates a validation that uses a globally defined rule in our 'vdf' namespace.
 * When the validation fails we either show the message override from the settings.messages
 * or let the user override the message using the configure.generateMessage
 *
 * @param rule
 * @param param
 * @param customMessage
 */
function createValidation(rule: ValidationRule, param?: unknown, customMessage?: ValidationMessage) {
  // Build params as an object so both positional ({0}) and named ({length}, {min}, ...) placeholders work
  const paramName = ruleParamNames[rule];
  const params: Record<string, unknown> = param !== undefined
    ? { 0: param, ...(paramName ? { [paramName]: param } : {}) }
    : {};
  return async (value: unknown, ctx: FieldValidationMetaInfo) => {
    // Pass the field name so generateMessage receives the correct ctx.field (standalone validate() defaults to '{field}')
    const result = await validate(value, param !== undefined ? { [rule]: param } : rule, { name: ctx.field });
    if (result.valid)
      return true;
    return customMessage ? resolveMessage(customMessage, ctx, params) : result.errors[0];
  };
}

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
      :field-metadata="transformedField"
      :path-override="path"
      @update:model-value="updateReadOnlyValue"
    />
  </template>
  <template v-else-if="isArray">
    <DynamicFormItemArray
      v-bind="props"
      :field-metadata="transformedField"
      :path-override="path"
      @update:model-value="updateReadOnlyValue"
    />
  </template>
  <template v-else>
    <component
      :is="template"
      :type="transformedField.type"
      :field-metadata="transformedField"
      :value
      :error-message
      :field-context
      :template-attrs
      :required
      :disabled
      :can-add-items
      :can-remove-items="_canRemoveItems"
      :add-item
      :remove-item
      :update="setFieldValue"
    >
      <template v-if="isParent" #children="templateAttrs">
        <DynamicFormItem
          v-for="child in transformedField.children"
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
          :type="`${transformedField.type}-input`"
          :field-metadata="transformedField"
          :value
          :error-message
          :field-context
          :template-attrs
          :required
          :disabled
          :can-add-items
          :can-remove-items="_canRemoveItems"
          :add-item
          :remove-item
          :update="setFieldValue"
        />
      </template>
    </component>
  </template>
</template>
