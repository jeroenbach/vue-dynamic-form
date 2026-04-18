import type { ValidationRule } from '@/core/validation';
import type { FieldValidationMetaInfo, ValidationMessage } from '@/types/ValidationMessage';
import { validate } from 'vee-validate';
import { resolveMessage, ruleParamNames } from '@/core/validation';
import { getFieldLabel } from '@/utils/getFieldLabel';

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
