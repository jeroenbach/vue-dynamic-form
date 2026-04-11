<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type {
  CascaderValue,
  CheckboxValueType,
  ElButton,
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElDivider,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTransfer,
  ElUpload,
  TransferKey,
} from 'element-plus';
import {
  defineMetadata,
  DynamicFormTemplate,
} from '@bach.software/vue-dynamic-form';

export type Metadata = GetMetadataType<typeof metadata>;

const metadata = defineMetadata<
  {
    text: string
    select: string | number
    checkbox: CheckboxValueType
    radio: string | number | boolean | undefined
    date: string
    time: string
    datetime: string
    switch: string | number | boolean
    number: number | undefined
    rate: number
    slider: number | number[]
    color: string | null
    cascader: CascaderValue | null | undefined
    transfer: TransferKey[]
    upload: any[]
    heading: never
    divider: never
  },
  {
    label?: string
    placeholder?: string
    options?: { label: string, value: string | number }[]
    multiple?: boolean
    clearable?: boolean
    filterable?: boolean
    disabled?: boolean
    readonly?: boolean
    size?: 'large' | 'default' | 'small'
    min?: number
    max?: number
    step?: number
    precision?: number
    format?: string
    valueFormat?: string
    showTime?: boolean
    type?: 'year' | 'month' | 'date' | 'dates' | 'datetime' | 'week' | 'datetimerange' | 'daterange' | 'monthrange'
    showStops?: boolean
    range?: boolean
    showAlpha?: boolean
    colorFormat?: string
    props?: Record<string, any>
    data?: any[]
    targetKeys?: string[]
    action?: string
    accept?: string
    listType?: 'text' | 'picture' | 'picture-card'
    autoUpload?: boolean
    showFileList?: boolean
  }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #array />
    <template #choice />

    <!-- Default wrapper with form item -->
    <template #default="slotProps">
      <slot name="default" v-bind="slotProps">
        <ElFormItem
          :label="slotProps.fieldMetadata.label"
          :size="slotProps.fieldMetadata.size"
          :required="slotProps.required"
        >
          <slot name="input" />
        </ElFormItem>
      </slot>
    </template>

    <!-- Default input fallback -->
    <template #default-input="slotProps">
      <slot name="default-input" v-bind="slotProps">
        <ElInput
          :model-value="slotProps.fieldContext.value.value"
          :placeholder="slotProps.fieldMetadata.placeholder"
          :disabled="slotProps.fieldMetadata.disabled || slotProps.disabled"
          :readonly="slotProps.fieldMetadata.readonly"
          :size="slotProps.fieldMetadata.size"
          :clearable="slotProps.fieldMetadata.clearable"
          @update:model-value="slotProps.fieldContext.handleChange"
        />
      </slot>
    </template>

    <!-- Text input -->
    <template #text-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElInput
        :model-value="value.value"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Select -->
    <template #select-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElSelect
        :model-value="value.value"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        :multiple="field.multiple"
        @update:model-value="handleChange"
      >
        <ElOption
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </template>

    <!-- Checkbox -->
    <template #checkbox>
      <div>
        <slot name="input" />
      </div>
    </template>

    <template #checkbox-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElCheckbox
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :size="field.size"
        @update:model-value="handleChange"
      >
        {{ field.label }}
      </ElCheckbox>
    </template>

    <!-- Radio Group -->
    <template #radio-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElRadioGroup
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :size="field.size"
        @update:model-value="handleChange"
      >
        <ElRadio
          v-for="option in field.options"
          :key="option.value"
          :label="option.value"
        >
          {{ option.label }}
        </ElRadio>
      </ElRadioGroup>
    </template>

    <!-- Date picker -->
    <template #date-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElDatePicker
        :model-value="value.value"
        :type="field.type || 'date'"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Time picker -->
    <template #time-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElTimePicker
        :model-value="value.value"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="handleChange"
      />
    </template>

    <!-- DateTime picker -->
    <template #datetime-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElDatePicker
        :model-value="value.value"
        type="datetime"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Switch -->
    <template #switch="{ fieldMetadata: field }">
      <div class="flex items-center gap-2">
        <span v-if="field.label">{{ field.label }}</span>
        <slot name="input" />
      </div>
    </template>

    <template #switch-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElSwitch
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :size="field.size"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Number input -->
    <template #number-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElInputNumber
        :model-value="value.value"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :size="field.size"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :precision="field.precision"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Rate -->
    <template #rate-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElRate
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :max="field.max || 5"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Slider -->
    <template #slider-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElSlider
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :show-stops="field.showStops"
        :range="field.range"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Color picker -->
    <template #color-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElColorPicker
        :model-value="value.value"
        :disabled="field.disabled || disabled"
        :size="field.size"
        :show-alpha="field.showAlpha"
        :color-format="field.colorFormat"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Cascader -->
    <template #cascader-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElCascader
        :model-value="value.value"
        :options="field.options"
        :props="field.props"
        :placeholder="field.placeholder"
        :disabled="field.disabled || disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Transfer -->
    <template #transfer-input="{ fieldMetadata: field, fieldContext: { value, handleChange } }">
      <ElTransfer
        :model-value="value.value"
        :data="field.data"
        :target-keys="field.targetKeys"
        :filterable="field.filterable"
        @update:model-value="handleChange"
      />
    </template>

    <!-- Upload -->
    <template #upload-input="{ fieldMetadata: field, fieldContext: { value, handleChange }, disabled }">
      <ElUpload
        :model-value="value.value"
        :action="field.action"
        :accept="field.accept"
        :list-type="field.listType"
        :auto-upload="field.autoUpload"
        :show-file-list="field.showFileList"
        :disabled="field.disabled || disabled"
        @update:model-value="handleChange"
      >
        <ElButton :size="field.size" :disabled="field.disabled || disabled">
          Click to upload
        </ElButton>
      </ElUpload>
    </template>

    <!-- Heading -->
    <template #heading="{ fieldMetadata: field }">
      <div class="my-4">
        <h3 class="text-lg font-semibold mb-2">
          {{ field.label }}
        </h3>
        <slot />
      </div>
    </template>

    <!-- Divider -->
    <template #divider="{ fieldMetadata: field }">
      <ElDivider>
        {{ field.label }}
      </ElDivider>
    </template>
  </DynamicFormTemplate>
</template>
