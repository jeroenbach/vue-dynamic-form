import type { FieldValidationMetaInfo } from '@/types/ValidationMessage';

/**
 * Resolves the most user-friendly label for a field validation context.
 *
 * Most components (e.g. DynamicFormItem, DynamicFormItemArray) call `useField`
 * with the field's `fieldOptions`, so vee-validate already sets `ctx.label`
 * and `ctx.field` to a human-readable name. Choice fields are special: they
 * validate at the root path (`''`) and historically registered without any
 * `fieldOptions`, which left vee-validate with the literal placeholder
 * string `{field}`. Normalizing the label here ensures shared helpers like
 * createValidation/splitValidationFunctions always receive a real display name
 * even for those “virtual” fields.
 *
 * Preference order: explicit label → ctx.field → ctx.name → empty string.
 */
export function getFieldLabel(ctx: FieldValidationMetaInfo): string {
  return ctx.label ?? ctx.field ?? ctx.name ?? '';
}
