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
    description?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ field, isDisabled, canAddItems, addItem, canRemoveItems, removeItem }">
      <div class="mt-4" :class="{ 'md:col-span-2': field.fullWidth }">
        <h3 v-if="field.label" class="flex text-xl font-bold gap-2 items-center mb-2" :class="{ 'text-gray-500': isDisabled }">
          {{ field.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </h3>
        <pre class="text-sm whitespace-pre-wrap">{{ field.description }}</pre>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot name="children" />
        </div>
      </div>
    </template>

    <template #choice="{ field, isDisabled, isRequired }">
      <div class="flex flex-col gap-2" :class="{ 'md:col-span-2': field.fullWidth }">
        <span class="flex gap-2 items-center" :class="{ 'text-gray-500': isDisabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': isRequired }">
          {{ field.label }}
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot name="children" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ field.description }}</pre>
      </div>
    </template>

    <template #array="{ field, isDisabled, isRequired, canAddItems, addItem }">
      <div v-if="!field.children?.length" class="flex flex-col gap-2" :class="{ 'md:col-span-2': field.fullWidth }">
        <label :for="`${field.path}[0]`" :class="{ 'text-gray-500': isDisabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': isRequired }" class="flex gap-2 items-center">
          {{ field.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
        </label>
        <slot name="input" :hide-label="true" />
        <pre class="text-sm whitespace-pre-wrap">{{ field.description }}</pre>
      </div>
      <slot v-else name="input" />
    </template>

    <template #default="{ field, isDisabled, isRequired, canAddItems, canRemoveItems, addItem, removeItem }">
      <div v-if="field.children?.length" :class="{ 'md:col-span-2': field.fullWidth }">
        <!-- In case we have multiple children, this is a grouped field -->
        <span v-if="!templateAttrs?.hideLabel" class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': isDisabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': isRequired }">
          {{ field.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot name="children" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ field.description }}</pre>
      </div>
      <div v-else class="flex flex-col gap-2" :class="{ 'md:col-span-2': field.fullWidth }">
        <label v-if="!templateAttrs?.hideLabel" :class="{ 'text-gray-500': isDisabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': isRequired }" :for="field.path">{{ field.label }}</label>
        <div class="flex gap-2 items-center">
          <div class="flex flex-col grow">
            <slot name="input" />
          </div>
          <IconButton :class="{ invisible: !canRemoveItems }" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ field.description }}</pre>
      </div>
    </template>

    <template #select-input="{ field, isDisabled, value: currentValue, update }">
      <select :id="field.path" :disabled="isDisabled" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :value="currentValue" @change="event => update((event.target as HTMLSelectElement).value)">
        <option v-for="{ key, value } in field.options" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
    </template>

    <template #checkbox-input="{ field, isDisabled, value, update }">
      <input :id="field.path" :disabled="isDisabled" type="checkbox" class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :checked="value" @change="event => update((event.target as HTMLInputElement).checked)">
    </template>

    <template #default-input="{ field, isDisabled, value, update }">
      <input :id="field.path" :disabled="isDisabled" type="text" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :value="value" @input="event => update((event.target as HTMLInputElement).value)">
    </template>
  </DynamicFormTemplate>
</template>
