<script setup lang="ts">
import type { Metadata } from './TestFormTemplate.vue';

import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import { computed, ref } from 'vue';
import DynamicForm from '../components/DynamicForm.vue';
import { useDynamicForm } from '../core/useDynamicForm';
import TestFormTemplate from './TestFormTemplate.vue';

export interface Props {
  metadata: Metadata[]
  settings?: DynamicFormSettings
  showDebugState?: boolean
}

const { metadata, settings: _settings, showDebugState = false } = defineProps<Props>();

const { values, handleSubmit, errors, meta } = useDynamicForm();
const manualValues = ref();
const editMode = ref(true);
const isSubmitted = ref(false);

// Add edit mode functionality to the form. In case we're not in edit mode, disable all items.
const metadataWithEdit = computed(() => metadata?.map(x => mapEachMetadataItem(x, (item) => {
  item.computedProps = item.computedProps ?? [];
  item.computedProps?.push((thisField) => {
    // Re-compute the disabled property of each field, when editMode changes
    if (!editMode.value)
      thisField.disabled = true;
  });
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
    },
    ({ errors: _errors }) => {
      isSubmitted.value = false;
    },
  )(e);
};

function mapEachMetadataItem(metadata: Metadata, callbackFunc: (item: Metadata) => Metadata) {
  if (!metadata || !callbackFunc)
    return metadata;

  metadata = callbackFunc?.({ ...metadata });
  metadata.children = metadata?.children?.map(x => mapEachMetadataItem(x, callbackFunc));
  metadata.choice = metadata?.choice?.map(x => mapEachMetadataItem(x, callbackFunc));
  return metadata;
}
</script>

<template>
  <form @submit="submit">
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
