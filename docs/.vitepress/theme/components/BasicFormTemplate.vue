<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import ErrorMessage from './ErrorMessage.vue';
import FormField from './FormField.vue';
import SectionCard from './SectionCard.vue';
import TextInput from './TextInput.vue';

// #region basic-form-template
export type Metadata = GetMetadataType<typeof metadata>;

const metadata = defineMetadata<
  {
    text: string
    heading: string
  }
>();
// #endregion basic-form-template
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ fieldMetadata, fieldContext: { errorMessage, label } }">
      <SectionCard
        :label
        :error-message="errorMessage.value"
        :data-testid="fieldMetadata.path"
      >
        <slot />
      </SectionCard>
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, required }">
      <FormField :input-id="fieldMetadata.path" :label :required>
        <slot />
        <ErrorMessage :error-message="errorMessage.value" :data-testid="fieldMetadata.path" />
      </FormField>
    </template>

    <template #default-input="{ fieldMetadata, fieldContext: { value, handleBlur, handleChange } }">
      <TextInput
        :id="fieldMetadata.path"
        :value="value.value"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>
  </DynamicFormTemplate>
</template>
