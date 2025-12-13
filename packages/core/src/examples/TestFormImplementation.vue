<script lang="ts" setup>
import type { GetMetadataType } from '@/types/GetMetadataType';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';
import IconButton from './components/IconButton.vue';

export type Metadata = GetMetadataType<typeof metadata>;

export interface Props {
  /**
   * Free to decide what attributes you want to pass internally between your templates.
   */
  templateAttrs?: {
    hideLabel?: boolean
  }
}

defineProps<Props>();

const metadata = defineMetadata<
  {
    text: string
    select: string
    checkbox: boolean
    heading: never
  },
  {
    label?: string
    options?: { key: string, value: string }[]
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ field, canAddItems, addItem, canRemoveItems, removeItem }">
      <div class="mt-4 col-span-2">
        <h3 class="flex text-xl font-bold gap-2 items-center">
          {{ field.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot name="children" />
        </div>
      </div>
    </template>
    <template #array="{ field, canAddItems, addItem }">
      <div v-if="field.type !== 'heading'" class="flex flex-col gap-2">
        <label :for="`${field.path}[0]`" class="flex gap-2 items-center">
          {{ field.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
        </label>
        <slot name="input" :hide-label="true" />
      </div>
      <slot v-else name="input" :hide-label="true" />
    </template>
    <template #default="{ field, canRemoveItems, removeItem }">
      <div class="flex flex-col gap-2">
        <label v-if="!templateAttrs?.hideLabel" :for="field.path">{{ field.label }}</label>
        <div class="flex gap-2 items-center">
          <div class="flex flex-col grow">
            <slot name="input" />
          </div>
          <IconButton :class="{ invisible: !canRemoveItems }" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </div>
      </div>
    </template>
    <template #select-input="{ field, value, update }">
      <select :id="field.path" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm">
        <option v-for="{ key, value } in field.options" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
    </template>
    <template #checkbox-input="{ field, value, update }">
      <input :id="field.path" type="checkbox" class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :checked="value" @change="event => update((event.target as HTMLInputElement).checked)">
    </template>
    <template #default-input="{ field, value, update }">
      <input :id="field.path" type="text" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :value="value" @input="event => update((event.target as HTMLInputElement).value)">
    </template>
  </DynamicFormTemplate>
</template>
