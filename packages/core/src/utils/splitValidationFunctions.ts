import type { GenericValidateFunction, RuleExpression } from 'vee-validate';
import type { FieldValidationMetaInfo } from '@/types/ValidationMessage';
import { validate } from 'vee-validate';

/**
 * Splits a vee-validate `RuleExpression` into an array of individual `GenericValidateFunction`s,
 * one per rule. This allows vee-validate to run each rule independently and collect all errors
 * when `bails: false` is configured.
 *
 * Handles all `RuleExpression` formats:
 * - **Function** — returned as-is in a single-element array
 * - **Array** — each element is recursively split
 * - **String** — pipe-separated rules (e.g. `'required|email'`) are split into separate functions,
 *   each delegating to vee-validate's `validate()`
 * - **Object** — each key/value pair (e.g. `{ required: true, min: 3 }`) becomes a separate function,
 *   each delegating to vee-validate's `validate()`
 */
export function splitToValidationFunctions(userRules: RuleExpression<unknown>):
GenericValidateFunction[] {
  if (!userRules)
    return [];
  if (typeof userRules === 'function')
    return [userRules];
  if (Array.isArray(userRules))
    return userRules.flatMap(splitToValidationFunctions);

  if (typeof userRules === 'string') {
    return userRules.split('|').map(rule => async (value: unknown, ctx: FieldValidationMetaInfo) => {
      const result = await validate(value, rule, { name: ctx.field });
      return result.valid ? true : result.errors[0];
    });
  }

  // Object format: { required: true, email: true }
  return Object.entries(userRules).map(([key, val]) => async (value: unknown, ctx: FieldValidationMetaInfo) => {
    const result = await validate(value, { [key]: val }, { name: ctx.field });
    return result.valid ? true : result.errors[0];
  });
}
