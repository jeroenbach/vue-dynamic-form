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
}

const { metadata, settings: _settings } = defineProps<Props>();

const { values, handleSubmit, errors: _errors, meta } = useDynamicForm();
const manualValues = ref();
const errors = ref<Partial<Record<string, string>>>({});
const editMode = ref(true);
const isSubmitted = ref(false);

const metadataWithEdit = metadata?.map(x => mapEachMetadataItem(x, (item) => {
  item.computedProps = item.computedProps ?? [];
  item.computedProps?.push((thisField) => {
    // Re-compute the disabled property of each field, when editMode changes
    thisField.disabled = !editMode.value;

    return thisField;
  });
  return item;
}));

const settings = computed(() => _settings ?? {
  messages: {
    required: 'This field is required - from settings',
    minLength: 'The minimum length of {field} is {0}',
    maxLength: 'The maximum length of {field} is {0}',
  },
});

function submit(e?: Event) {
  handleSubmit(
    (_values) => {
      // Reset errors
      errors.value = {};
      isSubmitted.value = true;
    },
    ({ errors: _errors }) => {
      errors.value = _errors;
      isSubmitted.value = true;
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
    <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
IsDirty: {{ meta.dirty }}

// vee-validate updated values:
{{ JSON.stringify(values, null, 2) }}
            </pre>
    <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
// manual updated values:
{{ JSON.stringify(manualValues, null, 2) }}
          </pre>
  </form>
</template>
