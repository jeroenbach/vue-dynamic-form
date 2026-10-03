import type { ValidationRule } from '@/core/validation';
import type { FieldValidationMetaInfo, ValidationMessage } from '@/types/ValidationMessage';
import { validate } from 'vee-validate';
import { resolveMessage, ruleParamNames } from '@/core/validation';
import { getFieldLabel } from '@/utils/getFieldLabel';

// Memoized per (rule, param, customMessage) so identical inputs return the identical closure.
// Components rebuild their validation arrays inside computeds; without a stable identity every
// rebuild looks like a rules change to vee-validate's deep rules watcher (functions compare by
// reference) and triggers a validation pass the field's own timing settings meant to suppress.
const validationCache = new Map<string, Map<unknown, Map<unknown, ReturnType<typeof buildValidation>>>>();

/**
 * Creates a validation that uses a globally defined rule in our 'vdf' namespace.
 * When the validation fails we either show the message override from the settings.messages
 * or let the user override the message using the configure.generateMessage
 *
 * @param rule
 * @param param
 * @param customMessage
 */
export function createValidation(rule: ValidationRule, param?: unknown, customMessage?: ValidationMessage) {
  let byParam = validationCache.get(rule);
  if (!byParam)
    validationCache.set(rule, byParam = new Map());
  let byMessage = byParam.get(param);
  if (!byMessage)
    byParam.set(param, byMessage = new Map());
  let validation = byMessage.get(customMessage);
  if (!validation)
    byMessage.set(customMessage, validation = buildValidation(rule, param, customMessage));
  return validation;
}

function buildValidation(rule: ValidationRule, param?: unknown, customMessage?: ValidationMessage) {
  // Build params as an object so both positional ({0}) and named ({length}, {min}, ...) placeholders work
  const paramName = ruleParamNames[rule];
  const params: Record<string, unknown> = param !== undefined
    ? { 0: param, ...(paramName ? { [paramName]: param } : {}) }
    : {};
  return async (value: unknown, ctx: FieldValidationMetaInfo) => {
    const fieldName = getFieldLabel(ctx);
    const validateOptions = fieldName ? { name: fieldName } : undefined;
    const normalizedCtx = fieldName && ctx.field !== fieldName
      ? { ...ctx, field: fieldName }
      : ctx;

    const result = await validate(
      value,
      param !== undefined ? { [rule]: param } : rule,
      validateOptions,
    );
    if (result.valid)
      return true;
    return customMessage ? resolveMessage(customMessage, normalizedCtx, params) : result.errors[0];
  };
}
