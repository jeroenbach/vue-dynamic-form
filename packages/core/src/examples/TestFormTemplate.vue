<script lang="ts" setup>
import type { GetMetadataType } from '@/types/GetMetadataType';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';
import IconButton from './components/IconButton.vue';

export type Metadata = GetMetadataType<typeof metadata>;

const metadata = defineMetadata<
  {
    text: string
    textBoundByVModel: string
    select: string
    selectBoundByVModel: string
    checkbox: boolean
    checkboxBoundByVModel: boolean
    heading: never
  },
  {
    description?: string
    options?: { key: string, value: string }[]
    fullWidth?: boolean
    disabled?: boolean
  },
  /**
   * Free to decide what attributes you want to pass internally between your templates.
   * You can add any attribute to a <slot /> and then it will be accessible in props.slotProps.
   */
  {
    hideLabel?: boolean
    /** Example on how to keep track of the levels */
    level?: number
    /** Helps identifying that we're below a choice field, so if we're rendering an array we can adjust our layout */
    belowChoiceField?: boolean
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, canAddItems, addItem, canRemoveItems, removeItem, slotProps }">
      <div class="mt-4" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <h3 v-if="label" class="flex text-xl font-bold gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" color="red" :data-testid="`${fieldMetadata.path}-remove-button`" @click="removeItem" />
        </h3>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
      </div>
    </template>

    <template #choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, slotProps }">
      <div class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center" :class="{ 'text-gray-500': disabled, 'after:content-[\'*\'] after:-ml-0.5 after:text-red-500': required }">
          {{ label }}
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" :below-choice-field="true" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
    </template>

    <template #array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, addItem, slotProps }">
      <!-- In case we're below a choice field, the first array item is not automatically added, so show a label with buttons -->
      <div v-if="slotProps?.belowChoiceField" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <span v-if="required" class="-ml-0.5 text-red-500">*</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <!-- In case the array has multiple fields, just show those fields, no extra label -->
      <slot v-else-if="fieldMetadata.children?.length" />
      <!-- In case we show an input directly, show a label and buttons -->
      <div v-else class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label :for="`${fieldMetadata.path}[0]`" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }" class="flex gap-2 items-center">
          {{ label }}
          <span v-if="required" class="-ml-0.5 text-red-500">*</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
        </label>
        <slot :hide-label="true" />
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, canRemoveItems, addItem, removeItem, slotProps }">
      <!-- In case we have multiple children, this is a grouped field and we adjust how it is displayed -->
      <div v-if="fieldMetadata.children?.length" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <span v-if="!slotProps?.hideLabel" class="flex gap-2 items-center mb-2" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <span v-if="required" class="-ml-0.5 text-red-500">*</span>
          <IconButton v-if="canAddItems" icon="plus" tabindex="-1" :data-testid="`${fieldMetadata.path}-add-button`" @click="addItem" />
          <IconButton v-if="canRemoveItems" icon="minus" tabindex="-1" :data-testid="`${fieldMetadata.path}-remove-button`" color="red" @click="removeItem" />
        </span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ms-6">
          <slot :level="(slotProps?.level ?? 0) + 1" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <!-- Otherwise load only the slot with the input -->
      <div v-else class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth }">
        <label v-if="!slotProps?.hideLabel" :for="fieldMetadata.path" :class="{ 'text-gray-500': fieldMetadata.disabled || disabled }">
          {{ label }}
          <span v-if="required" class="-ml-0.5 text-red-500">*</span>
        </label>
        <div class="flex gap-2 items-center">
          <div class="flex flex-col grow">
            <slot />
          </div>
          <IconButton :class="{ invisible: !canRemoveItems }" icon="minus" tabindex="-1" color="red" :data-testid="`${fieldMetadata.path}-remove-button`" @click="removeItem" />
        </div>
        <pre class="text-sm whitespace-pre-wrap">{{ fieldMetadata.description }}</pre>
        <span
          v-if="errorMessage.value"
          class="text-red-600 text-sm"
          :data-testid="`${fieldMetadata.path}-error-message`"
        >{{ errorMessage.value }}</span>
      </div>
      <slot name="attributes" />
    </template>

    <template #select-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <select
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @change="handleChange"
        @blur="handleBlur"
      >
        <option v-for="{ key: optionKey, value: optionValue } in fieldMetadata.options" :key="optionKey" :value="optionKey">
          {{ optionValue }}
        </option>
      </select>
    </template>

    <template #selectBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <select
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
        <option v-for="{ key: optionKey, value: optionValue } in fieldMetadata.options" :key="optionKey" :value="optionKey">
          {{ optionValue }}
        </option>
      </select>
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <input
        :id="fieldMetadata.path"
        :checked="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="checkbox"
        class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @change="handleChange(($event.target as HTMLInputElement).checked)"
        @blur="handleBlur"
      >
    </template>

    <template #checkboxBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <input
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="checkbox"
        class="h-6 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
    </template>

    <template #textBoundByVModel-input="{ fieldMetadata, fieldContext: { value, handleBlur }, disabled }">
      <input
        :id="fieldMetadata.path"
        v-model="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="text"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @blur="handleBlur"
      >
    </template>

    <template #default-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <input
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        type="text"
        class="h-9 bg-gray-100 border-gray-200 border rounded px-3 text-sm"
        @input="handleChange"
        @blur="handleBlur"
      >
    </template>
  </DynamicFormTemplate>
</template>
