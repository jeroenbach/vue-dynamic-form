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
          :model-value="slotProps.value"
          :placeholder="slotProps.field.placeholder"
          :disabled="slotProps.field.disabled"
          :readonly="slotProps.field.readonly"
          :size="slotProps.field.size"
          :clearable="slotProps.field.clearable"
          @update:model-value="slotProps.update"
        />
      </slot>
    </template>

    <!-- Text input -->
    <template #text-input="{ field, value, update }">
      <ElInput
        :model-value="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        @update:model-value="update"
      />
    </template>

    <!-- Select -->
    <template #select-input="{ field, value, update }">
      <ElSelect
        :model-value="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        :multiple="field.multiple"
        @update:model-value="update"
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
        :model-value="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:model-value="update"
      >
        {{ field.label }}
      </ElCheckbox>
    </template>

    <!-- Radio Group -->
    <template #radio-input="{ field, value, update }">
      <ElRadioGroup
        :model-value="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:model-value="update"
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
        :model-value="value"
        :type="field.type || 'date'"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="update"
      />
    </template>

    <!-- Time picker -->
    <template #time-input="{ field, value, update }">
      <ElTimePicker
        :model-value="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="update"
      />
    </template>

    <!-- DateTime picker -->
    <template #datetime-input="{ field, value, update }">
      <ElDatePicker
        :model-value="value"
        type="datetime"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :clearable="field.clearable"
        :format="field.format"
        :value-format="field.valueFormat"
        @update:model-value="update"
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
        :model-value="value"
        :disabled="field.disabled"
        :size="field.size"
        @update:model-value="update"
      />
    </template>

    <!-- Number input -->
    <template #number-input="{ field, value, update }">
      <ElInputNumber
        :model-value="value"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :readonly="field.readonly"
        :size="field.size"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :precision="field.precision"
        @update:model-value="update"
      />
    </template>

    <!-- Rate -->
    <template #rate-input="{ field, value, update }">
      <ElRate
        :model-value="value"
        :disabled="field.disabled"
        :max="field.max || 5"
        @update:model-value="update"
      />
    </template>

    <!-- Slider -->
    <template #slider-input="{ field, value, update }">
      <ElSlider
        :model-value="value"
        :disabled="field.disabled"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :show-stops="field.showStops"
        :range="field.range"
        @update:model-value="update"
      />
    </template>

    <!-- Color picker -->
    <template #color-input="{ field, value, update }">
      <ElColorPicker
        :model-value="value"
        :disabled="field.disabled"
        :size="field.size"
        :show-alpha="field.showAlpha"
        :color-format="field.colorFormat"
        @update:model-value="update"
      />
    </template>

    <!-- Cascader -->
    <template #cascader-input="{ field, value, update }">
      <ElCascader
        :model-value="value"
        :options="field.options"
        :props="field.props"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :size="field.size"
        :clearable="field.clearable"
        :filterable="field.filterable"
        @update:model-value="update"
      />
    </template>

    <!-- Transfer -->
    <template #transfer-input="{ field, value, update }">
      <ElTransfer
        :model-value="value"
        :data="field.data"
        :target-keys="field.targetKeys"
        :filterable="field.filterable"
        @update:model-value="update"
      />
    </template>

    <!-- Upload -->
    <template #upload-input="{ field, value, update }">
      <ElUpload
        :model-value="value"
        :action="field.action"
        :accept="field.accept"
        :list-type="field.listType"
        :auto-upload="field.autoUpload"
        :show-file-list="field.showFileList"
        :disabled="field.disabled"
        @update:model-value="update"
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
