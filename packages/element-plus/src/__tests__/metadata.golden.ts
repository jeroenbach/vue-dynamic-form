import type { CascaderValue, CheckboxValueType, TransferKey } from 'element-plus';

/** Independently written value types of the built-in catalogue. Drift in the source types must fail a test. */
export interface GoldenValueTypes {
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

/** Independently written extended field properties of the built-in catalogue. */
export interface GoldenFieldProperties {
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

type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

/**
 * Per key of `Golden`, whether `Actual` has that key with exactly the same type.
 * Comparing with `AllTrue<Golden>` fails for a missing, renamed, or retyped key.
 */
export type KeyByKeyEquality<Actual, Golden, Skip extends PropertyKey = never> = {
  [K in Exclude<keyof Golden, Skip>]: K extends keyof Actual ? IsEqual<Actual[K], Golden[K]> : false
};

export type AllTrue<Golden, Skip extends PropertyKey = never> = {
  [K in Exclude<keyof Golden, Skip>]: true
};
