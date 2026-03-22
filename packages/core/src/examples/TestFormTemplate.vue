<script lang="ts" setup>
import type { GetMetadataType } from '@/types/GetMetadataType';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';
import IconButton from './components/IconButton.vue';

export type Metadata = GetMetadataType<typeof metadata>;

export interface Props {
  /**
   * Free to decide what attributes you want to pass internally between your templates.
   * You can add any attribute to a <slot /> and then it will be accessible in props.templateAttrs.
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
    description?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ fieldMetadata, fieldContext, disabled, canAddItems, addItem, canRemoveItems, removeItem }">
      <div class="mt-4" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <h3 v-if="fieldContext.label" class="flex text-xl font-bold gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ fieldContext.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </h3>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot name="children" />
        </div>
      </div>
    </template>

    <template #choice="{ fieldMetadata, fieldContext, disabled, required }">
      <div class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center" :class="{ 'text-gray-500': disabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': required }">
          {{ fieldContext.label }}
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot name="children" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
      </div>
    </template>

    <template #array="{ fieldMetadata, fieldContext, disabled, required, canAddItems, addItem }">
      <div v-if="!fieldMetadata.children?.length" class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label :for="`${fieldMetadata.path}[0]`" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': required }" class="flex gap-2 items-center">
          {{ fieldContext.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
        </label>
        <slot name="input" :hide-label="true" />
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
      </div>
      <slot v-else name="input" />
    </template>

    <template #default="{ fieldMetadata, fieldContext, disabled, required, canAddItems, canRemoveItems, addItem, removeItem }">
      <div v-if="fieldMetadata.children?.length" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <!-- In case we have multiple children, this is a grouped field -->
        <span v-if="!templateAttrs?.hideLabel" class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': required }">
          {{ fieldContext.label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot name="children" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
      </div>
      <div v-else class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label v-if="!templateAttrs?.hideLabel" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled, 'after:content-[\'*\'] after:ml-0.5 after:text-red-500': required }" :for="fieldMetadata.path">{{ fieldContext.label }}</label>
        <div class="flex gap-2 items-center">
          <div class="flex flex-col grow">
            <slot name="input" />
          </div>
          <IconButton :class="{ invisible: !canRemoveItems }" icon="minus" tabindex="-1" color="red" @click="removeItem" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
      </div>
    </template>

    <template #select-input="{ fieldMetadata, fieldContext, disabled, value: currentValue, update }">
      <select :id="fieldMetadata.path" :disabled="fieldMetadata.disabled || disabled" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :value="currentValue" @change="event => update((event.target as HTMLSelectElement).value)">
        <option v-for="{ key, value } in fieldMetadata.options" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext, disabled, value, update }">
      <input :id="fieldMetadata.path" :disabled="fieldMetadata.disabled || disabled" type="checkbox" class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :checked="value" @change="event => update((event.target as HTMLInputElement).checked)">
    </template>

    <template #default-input="{ fieldMetadata, fieldContext, disabled, value, update }">
      <input :id="fieldMetadata.path" :disabled="fieldMetadata.disabled || disabled" type="text" class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm" :value="value" @input="event => update((event.target as HTMLInputElement).value)">
    </template>
  </DynamicFormTemplate>
</template>
