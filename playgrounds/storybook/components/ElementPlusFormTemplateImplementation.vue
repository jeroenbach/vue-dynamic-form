<script lang="ts" setup>
import { ElementPlusFormTemplate, extendMetadata } from '@bach.software/vue-dynamic-form-element-plus';
import { ElFormItem } from 'element-plus';

// One extra field type on top of the built-in Element Plus catalogue, with its own `rows` property.
const extendedMetadata = extendMetadata<{ richText: string }, { rows?: number }>();
</script>

<template>
  <ElementPlusFormTemplate :metadataConfiguration="extendedMetadata">
    <!-- Hand the engine's field and attribute render to the built-in Element Plus chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <!-- Overrides the chrome shared by most field types; the field itself still comes from the engine. -->
    <template #default="{ fieldMetadata, required, fieldContext, ...s }">
      <ElFormItem
        :label="fieldMetadata.label"
        :required="required"
        :error="fieldContext.errorMessage.value"
        data-testid="chromeOverride"
      >
        <slot v-bind="s" />
      </ElFormItem>
    </template>

    <!-- Overrides the built-in date picker with a native date input. -->
    <template #date-input="{ fieldContext, fieldMetadata, disabled }">
      <input
        type="date"
        class="nativeDateInput"
        data-testid="customDateInput"
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLInputElement).value)"
      >
    </template>

    <!-- Renders the extended field type. -->
    <template #richText-input="{ fieldContext, fieldMetadata, disabled }">
      <div class="richTextField" data-testid="richTextInput">
        <textarea
          class="richTextArea"
          :rows="fieldMetadata.rows ?? 4"
          :value="fieldContext.value.value"
          :placeholder="fieldMetadata.placeholder"
          :disabled="disabled || fieldMetadata.disabled"
          @input="fieldContext.handleChange(($event.target as HTMLTextAreaElement).value)"
        />
        <span class="richTextCounter">{{ fieldContext.value.value?.length ?? 0 }} characters</span>
      </div>
    </template>
  </ElementPlusFormTemplate>
</template>

<style scoped>
.nativeDateInput,
.richTextArea {
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font: inherit;
}

.richTextField {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.richTextArea {
  width: 100%;
  resize: vertical;
}

.richTextCounter {
  color: var(--el-text-color-secondary);
  font-size: 0.75rem;
}
</style>
