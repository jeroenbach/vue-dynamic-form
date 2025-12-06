<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import {
  defineMetadata,
  DynamicFormTemplate,
} from '@bach.software/vue-dynamic-form';

export type Metadata = GetMetadataType<typeof metadata>;

const metadata = defineMetadata<
  {
    text: string;
    select: string;
    checkbox: boolean;
    heading: never;
  },
  {
    label?: string
    options?: { key: string, value: string }[]
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadataConfiguration="metadata">
    <template #array />
    <template #choice />
    <template #default="{ field }">
      <div class="flex flex-col gap-2">
        <label>{{ field.label }}</label>
        <slot name="input" />
      </div>
    </template>
    <template #heading="{ field }">
      <div class="mt-4">
        <h3 class="text-xl font-bold">
          {{ field.label }}
        </h3>
        <slot name="children" />
      </div>
    </template>
    <template #checkbox="{ field, update, value }">
      <div>
        <label>{{ field.label }}</label>
        <slot name="input" />
      </div>
    </template>
    <template #text-input="{ value, update, type }">
      <input type="text" class="bg-gray-200" :value="value" @input="event => update((event.target as HTMLInputElement).value)">
    </template>
    <template #select-input="{ field, value, update }">
      <select class="bg-gray-200">
        <option v-for="{ key, value } in field.options" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
    </template>
    <template #checkbox-input="{ value, update }">
      <input type="checkbox" class="bg-gray-200" :checked="value" @change="event => update((event.target as HTMLInputElement).checked)" />
    </template>
    <template #default-input="{ value, update }">
      <input type="text" class="bg-blue-200" :value="value" @input="event => update((event.target as HTMLInputElement).value)">
    </template>
  </DynamicFormTemplate>
</template>
