<script setup lang="ts">
import type { Metadata } from './TestFormTemplate.vue';
import { computed, ref } from 'vue';
import TestForm from './TestForm.vue';

// A fixed test-case template cannot conditionally unmount a subtree, so this component
// owns its own metadata list and toggles the complex field in and out of it, which unmounts
// (and remounts) its DynamicFormItem the same way a template-level v-if would.
const showContact = ref(true);
const keepValuesOnUnmount = ref(false);

const metadata = computed<Metadata[]>(() => [
  ...(showContact.value
    ? [{
        name: 'contact',
        fieldOptions: { label: 'Contact (complex field with an attribute)' },
        minOccurs: 0,
        fullWidth: true,
        attributes: [
          {
            name: 'certainty',
            type: 'select' as const,
            minOccurs: 0,
            fieldOptions: { label: 'Certainty' },
            options: [
              { key: 'verified', value: 'Verified' },
              { key: 'unverified', value: 'Unverified' },
            ],
          },
        ],
      }]
    : []),
  { name: 'note', fieldOptions: { label: 'Sibling field (always mounted)' }, minOccurs: 0, fullWidth: true },
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-6 flex-wrap">
      <label class="flex items-center gap-2">
        <input v-model="showContact" type="checkbox" data-testid="toggle-show-contact">
        Show contact field (v-if unmount)
      </label>
      <label class="flex items-center gap-2">
        <input v-model="keepValuesOnUnmount" type="checkbox" data-testid="toggle-keep-values-on-unmount">
        keepValuesOnUnmount
      </label>
    </div>
    <TestForm :metadata :keep-values-on-unmount="keepValuesOnUnmount" show-debug-state />
  </div>
</template>
