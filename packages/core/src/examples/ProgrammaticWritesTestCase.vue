<script setup lang="ts">
import type { Metadata } from './TestFormTemplate.vue';
import { ref, useTemplateRef } from 'vue';
import TestForm from './TestForm.vue';

// Drives the form the way application code would (prefilling from an API response, applying a
// draft, ...): through setFieldValue/setValues on the form owned by TestForm, reached via its
// exposed handle. Every written value is deliberately invalid, so whether the write validated is
// directly visible: with shouldValidate false no errors may appear until the value is edited by
// hand or the form is submitted.
const form = useTemplateRef<InstanceType<typeof TestForm>>('form');
const shouldValidate = ref(false);

const metadata: Metadata[] = [
  { name: 'code', fieldOptions: { label: 'Code (required, maxLength 5)' }, restriction: { maxLength: 5 }, fullWidth: true },
  { name: 'quantity', fieldOptions: { label: 'Quantity (at most 10)' }, minOccurs: 0, restriction: { maxInclusive: 10 }, fullWidth: true },
  { name: 'tags', fieldOptions: { label: 'Tags (at least 2 items)' }, minOccurs: 2, maxOccurs: 4, fullWidth: true },
];

const invalidValues = {
  code: 'far too long for five',
  quantity: '42',
  tags: ['only one'],
};

function writeOneField() {
  form.value?.setFieldValue('code', invalidValues.code, shouldValidate.value);
}

function writeAllFields() {
  form.value?.setValues({ ...invalidValues }, shouldValidate.value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-4 flex-wrap">
      <button type="button" class="cursor-pointer bg-gray-200 text-black px-4 py-2 rounded" data-testid="set-field-value" @click="writeOneField">
        setFieldValue('code', ...)
      </button>
      <button type="button" class="cursor-pointer bg-gray-200 text-black px-4 py-2 rounded" data-testid="set-values" @click="writeAllFields">
        setValues({ ... })
      </button>
      <label class="flex items-center gap-2">
        <input v-model="shouldValidate" type="checkbox" data-testid="toggle-should-validate">
        shouldValidate
      </label>
    </div>
    <TestForm ref="form" :metadata show-debug-state />
  </div>
</template>
