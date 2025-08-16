<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import {
  defineMetadata,
  DynamicFormTemplate,
} from '@bach.software/vue-dynamic-form';
import {
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
} from 'element-plus';

export type Metadata = GetMetadataType<typeof metadata>;

interface ExtendedProperties {
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

const metadata = defineMetadata(
  [
    'text',
    'select',
    'checkbox',
    'radio',
    'date',
    'time',
    'datetime',
    'switch',
    'number',
    'rate',
    'slider',
    'color',
    'cascader',
    'transfer',
    'upload',
    'heading',
    'divider',
    'input',
    'children',
  ],
  {} as ExtendedProperties,
);
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #array />
    <template #choice />

    <!-- Default wrapper with form item -->
    <template #default="{ field }">
      <ElFormItem
        :label="field.label"
        :size="field.size"
        :required="(field.minOccurs ?? 0) > 0"
      >
        <slot name="input" />
      </ElFormItem>
    </template>

    <!-- Default input fallback -->
    <template #default-input="{ field }">
      <ElInput
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
      />
    </template>

    <!-- Text input -->
    <template #text-input="{ field }">
      <ElInput
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
      />
    </template>

    <!-- Select -->
    <template #select-input="{ field }">
      <ElSelect
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        :multiple="field.multiple"
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

    <template #checkbox-input="{ field }">
      <ElCheckbox
        :disabled="field.disabled"
        :size="field.size"
      >
        {{ field.label }}
      </ElCheckbox>
    </template>

    <!-- Radio Group -->
    <template #radio-input="{ field }">
      <ElRadioGroup
        :disabled="field.disabled"
        :size="field.size"
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
    <template #date-input="{ field }">
      <ElDatePicker
        :type="field.type || 'date'"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
      />
    </template>

    <!-- Time picker -->
    <template #time-input="{ field }">
      <ElTimePicker
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
      />
    </template>

    <!-- DateTime picker -->
    <template #datetime-input="{ field }">
      <ElDatePicker
        type="datetime"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
      />
    </template>

    <!-- Switch -->
    <template #switch="{ field }">
      <div class="flex items-center gap-2">
        <span v-if="field.label">{{ field.label }}</span>
        <slot name="input" />
      </div>
    </template>

    <template #switch-input="{ field }">
      <ElSwitch
        :disabled="field.disabled"
        :size="field.size"
      />
    </template>

    <!-- Number input -->
    <template #number-input="{ field }">
      <ElInputNumber
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :precision="field.precision"
      />
    </template>

    <!-- Rate -->
    <template #rate-input="{ field }">
      <ElRate
        :disabled="field.disabled"
        :max="field.max || 5"
      />
    </template>

    <!-- Slider -->
    <template #slider-input="{ field }">
      <ElSlider
        :disabled="field.disabled"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :show-stops="field.showStops"
        :range="field.range"
      />
    </template>

    <!-- Color picker -->
    <template #color-input="{ field }">
      <ElColorPicker
        :disabled="field.disabled"
        :size="field.size"
        :show-alpha="field.showAlpha"
        :color-format="field.colorFormat"
      />
    </template>

    <!-- Cascader -->
    <template #cascader-input="{ field }">
      <ElCascader
        :options="field.options"
        :props="field.props"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
      />
    </template>

    <!-- Transfer -->
    <template #transfer-input="{ field }">
      <ElTransfer
        :data="field.data"
        :target-keys="field.targetKeys"
        :filterable="field.filterable"
      />
    </template>

    <!-- Upload -->
    <template #upload-input="{ field }">
      <ElUpload
        :action="field.action"
        :accept="field.accept"
        :list-type="field.listType"
        :auto-upload="field.autoUpload"
        :show-file-list="field.showFileList"
        :disabled="field.disabled"
      >
        <ElButton :size="field.size" :disabled="field.disabled">
          Click to upload
        </ElButton>
      </ElUpload>
    </template>

    <!-- Heading -->
    <template #heading="{ field }">
      <div class="my-4">
        <h3 class="text-lg font-semibold mb-2">
          {{ field.label }}
        </h3>
        <slot name="children" />
      </div>
    </template>

    <!-- Divider -->
    <template #divider="{ field }">
      <ElDivider>
        {{ field.label }}
      </ElDivider>
    </template>
  </DynamicFormTemplate>
</template>
