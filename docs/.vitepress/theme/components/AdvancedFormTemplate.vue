<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import AppButton from './AppButton.vue';
import ArrayField from './ArrayField.vue';
import CheckboxInput from './CheckboxInput.vue';
import ChoiceField from './ChoiceField.vue';
import ErrorMessage from './ErrorMessage.vue';
import FormField from './FormField.vue';
import GroupField from './GroupField.vue';
import HeadingField from './HeadingField.vue';
import SelectInput from './SelectInput.vue';
import TextInput from './TextInput.vue';

// #region template-metadata-contract
export type Metadata = GetMetadataType<typeof metadata>;

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
// #endregion template-metadata-contract
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <!-- #region structural-slots -->
    <template #heading="{ fieldMetadata, fieldContext: { errorMessage, label } }">
      <HeadingField
        :label
        :description="fieldMetadata.description"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </HeadingField>
    </template>

    <template #choice="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required }">
      <ChoiceField
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </ChoiceField>
    </template>

    <template #array="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, addItem }">
      <ArrayField
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :can-add-items="canAddItems"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        @add="addItem"
      >
        <slot />
      </ArrayField>
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, disabled, required, canAddItems, canRemoveItems, addItem, removeItem }">
      <GroupField
        v-if="fieldMetadata.children?.length"
        :label
        :description="fieldMetadata.description"
        :required
        :disabled="fieldMetadata.disabled || disabled"
        :can-add-items="canAddItems"
        :can-remove-items="canRemoveItems"
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
        @add="addItem"
        @remove="removeItem"
      >
        <slot />
      </GroupField>

      <div v-else class="flex flex-col gap-2" :class="{ 'md:col-span-2': fieldMetadata.fullWidth, 'opacity-60': fieldMetadata.disabled || disabled }">
        <FormField :input-id="fieldMetadata.path" :label :required>
          <div class="flex items-start gap-2">
            <div class="grow">
              <slot />
            </div>
            <AppButton
              v-if="canRemoveItems"
              label="Remove"
              variant="danger"
              @click="removeItem"
            />
          </div>
          <p v-if="fieldMetadata.description" class="text-sm leading-5 text-slate-500">
            {{ fieldMetadata.description }}
          </p>
          <ErrorMessage :error-message="errorMessage.value" :data-testid="fieldMetadata.path" />
        </FormField>
      </div>
    </template>
    <!-- #endregion structural-slots -->

    <!-- #region input-slots -->
    <template #select-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <SelectInput
        :id="fieldMetadata.path"
        :value="value.value"
        :options="fieldMetadata.options"
        :disabled="fieldMetadata.disabled || disabled"
        @change="handleChange"
        @blur="handleBlur"
      />
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <CheckboxInput
        :id="fieldMetadata.path"
        :checked="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        @change="handleChange(($event.target as HTMLInputElement).checked)"
        @blur="handleBlur"
      />
    </template>

    <template #default-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange }, disabled }">
      <TextInput
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>
    <!-- #endregion input-slots -->
  </DynamicFormTemplate>
</template>
