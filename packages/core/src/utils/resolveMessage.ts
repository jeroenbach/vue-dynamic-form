import type { FieldValidationMetaInfo, ValidationMessage } from '@/types/ValidationMessage';

/**
 * Helper function to resolve a validation message, with parameters.
 *
 * All three param styles work:
 * 'Must be at least {0} characters'   // positional
 * 'Must be at least {min} characters' // named (object params)
 * 'The {field} value {value} is invalid' // context properties
 *
 * This is exactly how @vee-validate/i18n handles it internally.
 * @param message - The message template or function
 * @param ctx - The vee-validate field validation context
 * @param params - Optional param override. Array for positional `{0}, {1}`, or object for
 *   named `{min}, {length}` (also supports positional via numeric keys). Falls back to ctx.rule.params if not provided.
 * @returns The resolved message string
 */
export function resolveMessage(message: ValidationMessage, ctx: FieldValidationMetaInfo, params?: unknown[] | Record<string, unknown>): string {
  if (typeof message === 'function')
    return message(ctx);
  return message.replace(/\{(\w+)\}/g, (_, key) => {
    // Named context properties: {field}, {value}
    if (key in ctx)
      return String((ctx as any)[key]);
    // Named or positional from explicit params object: {min}, {length}, {0}
    if (params && !Array.isArray(params) && key in params)
      return String(params[key]);
    // Positional from explicit params array: {0}, {1}
    const index = Number(key);
    if (!Number.isNaN(index)) {
      if (Array.isArray(params) && params[index] !== undefined)
        return String(params[index]);
      return String((ctx.rule?.params as unknown[])?.[index] ?? `{${key}}`);
    }
    // Named from ctx.rule.params object: {min}, {max}
    if (ctx.rule?.params && !Array.isArray(ctx.rule.params))
      return String(ctx.rule.params[key] ?? `{${key}}`);
    return `{${key}}`;
  });
}
