export interface ControlContract {
  /** Exported name of the Element Plus component. */
  component: string
  /** Props and event handlers the template binds on it. */
  bound: string[]
}

/** The props and events each built-in control binds, in the shape of the vnode props the template creates. */
export const boundContract: Record<string, ControlContract[]> = {
  text: [
    { component: 'ElInput', bound: ['modelValue', 'placeholder', 'disabled', 'readonly', 'size', 'clearable', 'onUpdate:modelValue'] },
  ],
  select: [
    { component: 'ElSelect', bound: ['modelValue', 'placeholder', 'disabled', 'size', 'clearable', 'filterable', 'multiple', 'onUpdate:modelValue'] },
    { component: 'ElOption', bound: ['label', 'value'] },
  ],
  checkbox: [
    { component: 'ElCheckbox', bound: ['modelValue', 'disabled', 'size', 'onUpdate:modelValue'] },
  ],
  radio: [
    { component: 'ElRadioGroup', bound: ['modelValue', 'disabled', 'size', 'onUpdate:modelValue'] },
    { component: 'ElRadio', bound: ['label'] },
  ],
  date: [
    { component: 'ElDatePicker', bound: ['modelValue', 'type', 'placeholder', 'disabled', 'readonly', 'size', 'clearable', 'format', 'valueFormat', 'onUpdate:modelValue'] },
  ],
  time: [
    { component: 'ElTimePicker', bound: ['modelValue', 'placeholder', 'disabled', 'readonly', 'size', 'clearable', 'format', 'valueFormat', 'onUpdate:modelValue'] },
  ],
  datetime: [
    { component: 'ElDatePicker', bound: ['modelValue', 'type', 'placeholder', 'disabled', 'readonly', 'size', 'clearable', 'format', 'valueFormat', 'onUpdate:modelValue'] },
  ],
  switch: [
    { component: 'ElSwitch', bound: ['modelValue', 'disabled', 'size', 'onUpdate:modelValue'] },
  ],
  number: [
    { component: 'ElInputNumber', bound: ['modelValue', 'placeholder', 'disabled', 'readonly', 'size', 'min', 'max', 'step', 'precision', 'onUpdate:modelValue'] },
  ],
  rate: [
    { component: 'ElRate', bound: ['modelValue', 'disabled', 'max', 'onUpdate:modelValue'] },
  ],
  slider: [
    { component: 'ElSlider', bound: ['modelValue', 'disabled', 'min', 'max', 'step', 'showStops', 'range', 'onUpdate:modelValue'] },
  ],
  color: [
    { component: 'ElColorPicker', bound: ['modelValue', 'disabled', 'size', 'showAlpha', 'colorFormat', 'onUpdate:modelValue'] },
  ],
  cascader: [
    { component: 'ElCascader', bound: ['modelValue', 'options', 'props', 'placeholder', 'disabled', 'size', 'clearable', 'filterable', 'onUpdate:modelValue'] },
  ],
  transfer: [
    { component: 'ElTransfer', bound: ['modelValue', 'data', 'filterable', 'onUpdate:modelValue'] },
  ],
  upload: [
    { component: 'ElUpload', bound: ['fileList', 'action', 'accept', 'listType', 'autoUpload', 'showFileList', 'disabled', 'onChange', 'onRemove'] },
    { component: 'ElButton', bound: ['size', 'disabled'] },
  ],
};
