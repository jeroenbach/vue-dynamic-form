import type { ValidationMessage } from '@/types/ValidationMessage';

export const dynamicFormSettingsKey = Symbol('dynamicFormSettings');

export interface DynamicFormSettings {
  /**
   * Enables diagnostic data output via concealed DOM elements for reactivity testing
   */
  analytics?: boolean

  /**
   * In case of a complex type the value is stored in a value property, i.e. { value: 'the actual value' }
   * Use complexTypeValueProperty to change the property name, for example 'myValue' will result in { myValue: 'the actual value' }
   */
  complexTypeValueProperty?: string

  /**
   * When true, validates fields on every value change.
   * When false, only validates on submit.
   *
   * Defaults to true.
   */
  validateOnValueUpdate?: boolean

  /**
   * When true, validates fields on every value change after the first submit.
   * When false, listen to the validateOnValueUpdate.
   *
   * Defaults to false.
   */
  validateOnValueUpdateAfterSubmit?: boolean

  /**
   * When true, validates fields on blur.
   *
   * Defaults to false.
   */
  validateOnBlur?: boolean

  /**
   * When true, validates fields on every value change when the field has an error.
   *
   * Defaults to false.
   */
  validateWhenInError?: boolean

  /**
   * Use this setting to override the default text of the validation messages.
   *
   * Each message accepts either a `string` template or a `(ctx) => string` function.
   *
   * String templates support the following placeholders:
   * - `{field}` — the field label
   * - `{value}` — the current field value
   * - `{0}`, `{1}`, ... — rule params by position (e.g. `{0}` = the limit value)
   * - Named params where supported (e.g. `{min}`, `{max}`)
   *
   * Examples:
   * ```ts
   * required: 'The {field} field is required'
   * minLength: 'The {field} must be at least {0} characters'
   * minLength: (ctx) => `${ctx.field} is too short`
   * ```
   */
  messages?: {
    /** XSD: required. Available placeholders: `{field}` */
    required?: ValidationMessage
    /** XSD: minOccurs. Available placeholders: `{field}`, `{0}` or `{min}` (min number of filled items) */
    minOccurs?: ValidationMessage
    /** XSD: choiceMinOccurs. Available placeholders: `{field}`, `{0}` or `{min}` (min number of filled items) */
    choiceMinOccurs?: ValidationMessage
    /** XSD: minLength. Available placeholders: `{field}`, `{0}` or `{length}` (min length) */
    minLength?: ValidationMessage
    /** XSD: maxLength. Available placeholders: `{field}`, `{0}` or `{length}` (max length) */
    maxLength?: ValidationMessage
    /** XSD: length. Available placeholders: `{field}`, `{0}` or `{length}` (exact length) */
    length?: ValidationMessage
    /** XSD: pattern. Available placeholders: `{field}`, `{0}` or `{pattern}` (regex pattern) */
    pattern?: ValidationMessage
    /** XSD: minInclusive. Available placeholders: `{field}`, `{0}` or `{min}` (min value, inclusive) */
    minInclusive?: ValidationMessage
    /** XSD: maxInclusive. Available placeholders: `{field}`, `{0}` or `{max}` (max value, inclusive) */
    maxInclusive?: ValidationMessage
    /** XSD: minExclusive. Available placeholders: `{field}`, `{0}` or `{min}` (min value, exclusive) */
    minExclusive?: ValidationMessage
    /** XSD: maxExclusive. Available placeholders: `{field}`, `{0}` or `{max}` (max value, exclusive) */
    maxExclusive?: ValidationMessage
    /** XSD: enumeration. Available placeholders: `{field}` */
    enumeration?: ValidationMessage
    /** XSD: whiteSpace. Available placeholders: `{field}`, `{0}` or `{mode}` (preserve | replace | collapse) */
    whiteSpace?: ValidationMessage
    /** XSD: fractionDigits. Available placeholders: `{field}`, `{0}` or `{digits}` (max decimal places) */
    fractionDigits?: ValidationMessage
    /** XSD: totalDigits. Available placeholders: `{field}`, `{0}` or `{digits}` (max total digits) */
    totalDigits?: ValidationMessage
  }
}
