import type { CascaderValue, CheckboxValueType, TransferKey } from 'element-plus';
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export interface ElementPlusValueTypes {
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
}

export interface ElementPlusFieldProperties {
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
  format?: string
  valueFormat?: string
  /** Properties of `type: 'number'` fields. */
  number?: {
    precision?: number
  }
  /** Properties of `type: 'date'` fields. */
  date?: {
    showTime?: boolean
    /** The `ElDatePicker` mode; a `datetime` field always uses the `datetime` mode. */
    type?: 'year' | 'month' | 'date' | 'dates' | 'datetime' | 'week' | 'datetimerange' | 'daterange' | 'monthrange'
  }
  /** Properties of `type: 'slider'` fields. */
  slider?: {
    showStops?: boolean
    range?: boolean
  }
  /** Properties of `type: 'color'` fields. */
  color?: {
    showAlpha?: boolean
    colorFormat?: string
  }
  /** Properties of `type: 'cascader'` fields. */
  cascader?: {
    /** Passed to the `ElCascader` `props` prop. */
    props?: Record<string, any>
  }
  /** Properties of `type: 'transfer'` fields. */
  transfer?: {
    data?: any[]
    /** Not read by the template: the field value holds the selected keys. */
    targetKeys?: string[]
  }
  /** Properties of `type: 'upload'` fields. */
  upload?: {
    action?: string
    accept?: string
    listType?: 'text' | 'picture' | 'picture-card'
    autoUpload?: boolean
    showFileList?: boolean
  }
}

/** The built-in Element Plus field types and their extended properties. */
// eslint-disable-next-line ts/no-empty-object-type
export const elementPlusMetadata = defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>();

/**
 * Layers your own field types, field properties, slot properties, and settings on top of
 * `elementPlusMetadata`. On a key collision your declaration replaces the built-in one.
 *
 * Purely a type carrier: nothing is merged at runtime.
 */
export function extendMetadata<
  const ExtraValueTypes extends Record<string, any> = object,
  ExtraFieldProperties extends object = object,
  ExtraSlotProperties extends object = object,
  ExtraSettingsProperties extends object = object,
>() {
  return defineMetadata<
    Omit<ElementPlusValueTypes, keyof ExtraValueTypes> & ExtraValueTypes,
    Omit<ElementPlusFieldProperties, keyof ExtraFieldProperties> & ExtraFieldProperties,
    ExtraSlotProperties,
    ExtraSettingsProperties
  >();
}
