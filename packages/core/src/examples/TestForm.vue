<script setup lang="ts">
import type { GenericObject } from 'vee-validate';

import type { Metadata } from './TestFormTemplate.vue';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import { computed, ref } from 'vue';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';
import { mapEachMetadataItem } from '@/utils/mapEachMetadataItem';
import DynamicForm from '../components/DynamicForm.vue';
import { useDynamicForm } from '../core/useDynamicForm';
import TestFormTemplate from './TestFormTemplate.vue';

export interface Props {
  metadata: Metadata[]
  settings?: DynamicFormSettings
  showDebugState?: boolean
  initialEdit?: boolean
  hideFieldsWithoutValue?: boolean
  initialValues?: GenericObject
}

const { metadata, settings: _settings, initialEdit = true, hideFieldsWithoutValue = false, showDebugState = false, initialValues } = defineProps<Props>();

const { values, handleSubmit, errors, meta } = useDynamicForm({
  initialValues,
});
const manualValues = ref();
const editMode = ref(initialEdit);
const isSubmitted = ref(false);

// Add edit mode functionality to the form. In case we're not in edit mode, disable all items.
const metadataWithEdit = computed(() => metadata?.map(x => mapEachMetadataItem(x, (item) => {
  item.computedProps = item.computedProps ?? [];

  // Disable all fields when not in edit mode
  item.computedProps.push((thisField) => {
    if (!editMode.value)
      thisField.disabled = true;
  });

  if (hideFieldsWithoutValue) {
  // In view mode, hide fields that have no value
    item.computedProps.push((thisField, fieldValue) => {
      if (!editMode.value && !checkTreeHasValue(fieldValue.value))
        thisField.hidden = true;
    });

    // In view mode, hide a parent field when all of its children are hidden
    item.computedProps.push((thisField, _fieldValue, childFields) => {
      if (!editMode.value && childFields.value.length > 0 && childFields.value.every(c => c.hidden))
        thisField.hidden = true;
    });
  }

  return item;
})));

const settings = computed(() => ({
  analytics: true,
  messages: {
    required: '{field} is required',
    minOccurs: 'At least {min} items required',
    choiceMinOccurs: 'The following fields need to occur at least {min} time(s): {field}',
    minLength: 'The minimum length of {field} is {length}',
    maxLength: 'The maximum length of {field} is {length}',
    length: '{field} must be exactly {length} characters',
    pattern: '{field} does not match the required pattern',
    minInclusive: '{field} must be at least {min}',
    maxInclusive: '{field} must be at most {max}',
    minExclusive: '{field} must be greater than {min}',
    maxExclusive: '{field} must be less than {max}',
    enumeration: '{field} must be one of the allowed values',
    whiteSpace: '{field} contains invalid whitespace (mode: {mode})',
    fractionDigits: '{field} may have at most {digits} decimal place(s)',
    totalDigits: '{field} may have at most {digits} significant digit(s)',
  },
  ...(_settings ?? {}),
}));

function submit(e?: Event) {
  handleSubmit(
    (_values) => {
      isSubmitted.value = true;
      editMode.value = false;
    },
    ({ errors: _errors }) => {
      isSubmitted.value = false;
    },
  )(e);
};
</script>

<template>
  <form @submit.prevent="submit">
    <div class="flex justify-end gap-2">
      <button v-if="!editMode" type="button" class="cursor-pointer mt-4 bg-blue-500 text-white px-4 py-2 rounded" data-testid="submit" @click="editMode = true">
        Edit
      </button>
      <button v-if="editMode" type="submit" class="cursor-pointer mt-4 bg-blue-500 text-white px-4 py-2 rounded" data-testid="submit">
        Submit
      </button>
      <button v-if="editMode" type="button" class="cursor-pointer mt-4 bg-gray-200 text-black px-4 py-2 rounded" data-testid="cancel" @click="editMode = false">
        Cancel
      </button>
    </div>
    <div v-if="Object.values(errors).length" data-testid="errors" class="col-12 text-red-600">
      Errors:
      <ul>
        <li v-for="(error, key) in errors" :key="key">
          <span v-html="error" />
        </li>
      </ul>
    </div>
    <DynamicForm
      :template="TestFormTemplate"
      :metadata="metadataWithEdit"
      :settings
      @update:model-value="manualValues = $event"
    />
    <span v-if="isSubmitted" data-testid="isSubmitted" />
    <pre v-if="showDebugState" class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
IsDirty: {{ meta.dirty }}
Pending: {{ meta.pending }}
Touched: {{ meta.touched }}
Valid: {{ meta.valid }}
Submitted: {{ isSubmitted }}

// form values:
{{ JSON.stringify(values, null, 2) }}
    </pre>
  </form>
</template>
