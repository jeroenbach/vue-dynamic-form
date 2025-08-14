<script lang="ts" setup>
import DynamicFormTemplate from '@bach.software/vue-dynamic-form/src/components/DynamicFormTemplate.vue';
import  { type GetMetadataType, defineMetadata } from '@bach.software/vue-dynamic-form/src/types/FieldMetadata';

type ExtendedProperties = {
  label: string;
  options?: { key: string, value: string}[];
};

const metadata = defineMetadata(["text", "select", "checkbox", "heading", 'input', 'children'], {} as ExtendedProperties);
export type Metadata = GetMetadataType<typeof metadata>;

</script>
<template>
  <DynamicFormTemplate :metadataConfiguration="metadata">
    <template #default="{ field }">
      <div class="flex flex-col gap-2">
        <label>{{ field.label }}</label>
        <slot name="input" />
      </div>
    </template>
    <template #default-input="{}">
      <input type="text" class="bg-blue-200" />
    </template>
    <template #heading="{ field }">
      <div class="mt-4">
        <h3 class="text-xl font-bold">{{ field.label }}</h3>
        <slot name="children" />
      </div>
    </template>
    <template #checkbox="{ field }">
      <div>
        <label>{{ field.label }}</label>
        <slot name="input" />
      </div>
    </template>
    <template #text-input="{}">
      <input type="text" class="bg-gray-200" />
    </template>
    <template #select-input="{ field }">
      <select class="bg-gray-200">
        <option v-for="{ key, value } in field.options" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
    </template>
    <template #checkbox-input="{}">
      <input type="checkbox" class="bg-gray-200" />
    </template>
  </DynamicFormTemplate>
</template>
