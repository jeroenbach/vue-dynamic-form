<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import {
  defineMetadata,
  DynamicFormTemplate,
} from '@bach.software/vue-dynamic-form';
import {
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
    'switch': string | number | boolean
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
          :label="slotProps.field.label"
          :size="slotProps.field.size"
          :required="slotProps.isRequired"
        >
          <slot name="input" />
        </ElFormItem>
      </slot>
    </template>

    <!-- Default input fallback -->
    <template #default-input="slotProps">
      <slot name="default-input" v-bind="slotProps">
        <ElInput
          :modelValue="slotProps.value"
          :placeholder="slotProps.field.placeholder"
          :disabled="slotProps.field.disabled"
          :readonly="slotProps.field.readonly"
          :size="slotProps.field.size"
          :clearable="slotProps.field.clearable"
          @update:modelValue="slotProps.update"
        />
      </slot>
    </template>

    <!-- Text input -->
    <template #text-input="{ field, value, update }">
      <ElInput
        :modelValue="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        @update:modelValue="update"
      />
    </template>

    <!-- Select -->
    <template #select-input="{ field, value, update }">
      <ElSelect
        :modelValue="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        :multiple="field.multiple"
        @update:modelValue="update"
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

    <template #checkbox-input="{ field, value, update }">
      <ElCheckbox
        :modelValue="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:modelValue="update"
      >
        {{ field.label }}
      </ElCheckbox>
    </template>

    <!-- Radio Group -->
    <template #radio-input="{ field, value, update }">
      <ElRadioGroup
        :modelValue="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:modelValue="update"
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
    <template #date-input="{ field, value, update }">
      <ElDatePicker
        :modelValue="value"
        :type="field.type || 'date'"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :valueFormat="field.valueFormat"
        @update:modelValue="update"
      />
    </template>

    <!-- Time picker -->
    <template #time-input="{ field, value, update }">
      <ElTimePicker
        :modelValue="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :valueFormat="field.valueFormat"
        @update:modelValue="update"
      />
    </template>

    <!-- DateTime picker -->
    <template #datetime-input="{ field, value, update }">
      <ElDatePicker
        :modelValue="value"
        type="datetime"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :valueFormat="field.valueFormat"
        @update:modelValue="update"
      />
    </template>

    <!-- Switch -->
    <template #switch="{ field }">
      <div class="flex items-center gap-2">
        <span v-if="field.label">{{ field.label }}</span>
        <slot name="input" />
      </div>
    </template>

    <template #switch-input="{ field, value, update }">
      <ElSwitch
        :modelValue="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:modelValue="update"
      />
    </template>

    <!-- Number input -->
    <template #number-input="{ field, value, update }">
      <ElInputNumber
        :modelValue="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :precision="field.precision"
        @update:modelValue="update"
      />
    </template>

    <!-- Rate -->
    <template #rate-input="{ field, value, update }">
      <ElRate
        :modelValue="value"
        :disabled="field.disabled"
        :max="field.max || 5"
        @update:modelValue="update"
      />
    </template>

    <!-- Slider -->
    <template #slider-input="{ field, value, update }">
      <ElSlider
        :modelValue="value"
        :disabled="field.disabled"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :showStops="field.showStops"
        :range="field.range"
        @update:modelValue="update"
      />
    </template>

    <!-- Color picker -->
    <template #color-input="{ field, value, update }">
      <ElColorPicker
        :modelValue="value"
        :disabled="field.disabled"
        :size="field.size"
        :showAlpha="field.showAlpha"
        :colorFormat="field.colorFormat"
        @update:modelValue="update"
      />
    </template>

    <!-- Cascader -->
    <template #cascader-input="{ field, value, update }">
      <ElCascader
        :modelValue="value"
        :options="field.options"
        :props="field.props"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        @update:modelValue="update"
      />
    </template>

    <!-- Transfer -->
    <template #transfer-input="{ field, value, update }">
      <ElTransfer
        :modelValue="value"
        :data="field.data"
        :targetKeys="field.targetKeys"
        :filterable="field.filterable"
        @update:modelValue="update"
      />
    </template>

    <!-- Upload -->
    <template #upload-input="{ field, value, update }">
      <ElUpload
        :modelValue="value"
        :action="field.action"
        :accept="field.accept"
        :listType="field.listType"
        :autoUpload="field.autoUpload"
        :showFileList="field.showFileList"
        :disabled="field.disabled"
        @update:modelValue="update"
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
