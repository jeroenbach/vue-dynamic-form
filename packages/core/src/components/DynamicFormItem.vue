<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';
import { normalizePath } from '@/utils/normalizePath';
import { overridePath } from '@/utils/overridePath';
import { useField } from 'vee-validate';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';

// #region Interfaces
export interface Emit {
  (e: 'update:modelValue', value: any, index?: number): void;
  (e: 'addItem'): void;
  (e: 'removeItem'): void;
}
type Props = DynamicFormItemProps<InternalMetadata>;
// #endregion

// #region Analytics: to test reactivity and prevent unnecessary rerenders.
// They're not reactive to avoid infinite loops.
let _analytics_renderCount = 0;
let _analytics_constructValidationCount = 0;
let _analytics_fieldChangedCount = 0;
// #endregion

// #region Props and State
const props = defineProps<Props>();
const emit = defineEmits<Emit>();

// Elements without a path should be ignored, as they cannot be linked to a value in vee-validate
const validElement = computed(() => !!props.field?.path);

// Sections and Combined fields have a collection of fields
const isFieldCollection = computed(
  () => !!(validElement.value && props.field?.children?.length),
);

// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!props.field?.path) return '';

  return overridePath(props.field.path, props.pathOverride);
});

// The path that takes value types into consideration
const itemPath = computed(() => {
  let _path = path.value;
  if (props.field?.isComplexType && _path) {
    _path = `${_path}['value']`; // we use this notation to still be able to count the segments by splitting on '.'
  }
  return _path;
});

// Keep track of changes to the field for analytics
const field = computed(() => {
  _analytics_fieldChangedCount++;
  return props.field;
});

// minOccurs determines how many times this field should appear at minimum
const minOccurs = computed(() => {
  if (props.minOccursOverride !== undefined)
    return props.minOccursOverride;

  // In case this element is part of an array field, make the field optional
  if (props.partOfArrayField) return 0;

  return field.value?.minOccurs ?? 1;
});

// maxOccurs determines how many times this field should appear at maximum
const maxOccurs = computed(() =>
  props.maxOccursOverride !== undefined
    ? props.maxOccursOverride
    : (field.value?.maxOccurs ?? 1),
);

const isDisabled = computed(() => maxOccurs.value === 0);

const isRequired = computed(() => minOccurs.value >= 1 && !isDisabled.value);

// Link the vee-validate field to this metadata field
const normalizedPath = computed(() => normalizePath(itemPath.value));
const { value, errorMessage } = validElement.value
  ? useField(normalizedPath, field.value?.validation)
  : { value: ref(null), errorMessage: ref(null) };

  const initialUpdate = ref(true);

const isChoice = computed(() => !!field.value?.choice?.length);
const isArray = computed(() => field.value?.maxOccurs > 1);

// In case this field is optional, we also want to temporarily set the minOccurs to 0 (not required) of the children of this field.
// if this field is optional and none of the children have values yet. Then all required validation
// is removed and the user is not forced to fill in any values.
const _minOccursOverride = computed(() => {
  // If one of it's parents has set the override, pass it down
  // But only if it's set to 0
  if (props.minOccursOverride === 0) return props.minOccursOverride;

  // If the field is required, don't bother continuing (as we don't need to override anything)
  if (minOccurs.value > 0) return undefined;

  // So the field is optional, now check whether there is a value in it
  if (checkTreeHasValue(value.value)) return undefined;

  // No value and the field is optional, set the children to minOccurs = 0 (optional)
  return 0;
});

// When the maxOccurs = 0, we use that to disable fields. We need to pass this down to its children
const _maxOccursOverride = computed(() =>
  maxOccurs.value === 0 ? 0 : undefined,
);

const showAttributes = computed(
  () => field.value?.attributes?.length && checkTreeHasValue(value.value),
);

// #endregion

// #region Watchers and lifecycle events
// We watch the value because it can also be updated by other vee-validate methods
watch(
  value,
  v => {
    // Don't update the parent if the initial value is empty
    if (!initialUpdate.value || v) {
      emit('update:modelValue', v, props.index);
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
    emit('update:modelValue', value.value, props.index); 
  }
});

// #endregion

// #region Methods

function setFieldValue(_value: unknown){
  // In case of an empty value, remove the element from the parent object by setting it to undefined
  value.value = _value === '' ? undefined : _value; // the watch will emit the update:modelValue
}

// #endregion
</script>

<template>  
  <div v-if="analytics" v-show="false">
    <span :data-testid="`${path}-analytics-render-count`">{{
      ++_analytics_renderCount
    }}</span>
  </div>
  <template v-if="isChoice">
    <component :is="template" type="choice" :field="field">
      <template #children>
        <DynamicFormItemChoice :field="field" :template="template" />
      </template>
    </component>
  </template>
  <template v-else-if="isArray">
    <component :is="template" type="array" :field="field">
      <template #children>
        <DynamicFormItemArray :field="field" :template="template" />
      </template>
    </component>
  </template>
  <template v-else>
    <component :is="template" :type="field.type" :field="field">
      <template #input>
        <component
          :is="template"
          :type="`${field.type}-input`"
          :field="field"
          :value="value"
          :update="setFieldValue"
        />
      </template>
      <template #children>
        <DynamicFormItem
          v-for="child in field.children"
          :key="child.path"
          :field="(child as InternalMetadata)"
          :template="template"
        />
      </template>
    </component>
  </template>
</template>
