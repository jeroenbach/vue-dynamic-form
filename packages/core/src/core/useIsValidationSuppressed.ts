import type { MaybeRefOrGetter } from 'vue';
import { useFormContext } from 'vee-validate';
import { nextTick } from 'vue';
import { useIsResetPending } from '@/core/useIsResetPending';

interface PatchableFormContext {
  setFieldValue?: (field: unknown, value: unknown, shouldValidate?: boolean) => void
  setValues?: (fields: unknown, shouldValidate?: boolean) => void
}

// Suppression is form-wide and lasts a single tick: the window in which the write's own value
// change flushes through the value watchers. Per-path tracking is deliberately avoided: user
// input is event-driven and cannot land in the same microtask flush as a programmatic write,
// and a validation skipped during the window re-runs on the field's next value change anyway.
const suppressedForms = new WeakSet<object>();
const patchedForms = new WeakSet<object>();

function suppress(form: object) {
  suppressedForms.add(form);
  // Cleared once the write has flushed, mirroring how vee-validate clears `pendingReset`.
  // Must be scheduled after the value write: only then does nextTick chain behind the
  // pending watcher flush instead of resolving on an earlier microtask.
  nextTick(() => suppressedForms.delete(form));
}

/**
 * Makes a form context's `shouldValidate: false` argument actually stick: wraps `setFieldValue`
 * and `setValues` so that writes which ask to skip validation are remembered until their flush
 * settles. vee-validate only skips its *own* validation for such writes; our components run their
 * validation from custom value watchers, which would otherwise fire regardless.
 *
 * Mutates the context in place (vee-validate provides the very object it returns from `useForm`),
 * so the consumer's handle and every injected `useFormContext()` share the wrapped functions.
 * Safe to call multiple times on the same form.
 */
export function trackNonValidatingWrites(form: unknown): void {
  if (!form || typeof form !== 'object' || patchedForms.has(form))
    return;
  patchedForms.add(form);

  const context = form as PatchableFormContext;

  const originalSetFieldValue = context.setFieldValue?.bind(context);
  if (originalSetFieldValue) {
    context.setFieldValue = (field, value, shouldValidate = true) => {
      originalSetFieldValue(field, value, shouldValidate);
      if (!shouldValidate)
        suppress(form);
    };
  }

  const originalSetValues = context.setValues?.bind(context);
  if (originalSetValues) {
    context.setValues = (fields, shouldValidate = true) => {
      originalSetValues(fields, shouldValidate);
      if (!shouldValidate)
        suppress(form);
    };
  }
}

/**
 * True while the field's value is changing through a programmatic write that asked not to
 * validate: a `resetForm()`/`resetField()` flush (vee-validate's `pendingReset` window) or a
 * `setFieldValue`/`setValues` call with `shouldValidate: false` on a form wrapped by
 * `trackNonValidatingWrites`. Value watchers that own validation timing must skip validation
 * while this returns true, otherwise they would override the caller's explicit intent.
 */
export function useIsValidationSuppressed(path: MaybeRefOrGetter<string>): () => boolean {
  const isResetPending = useIsResetPending(path);
  const formContext = useFormContext() as object | undefined;

  return () => isResetPending() || (!!formContext && suppressedForms.has(formContext));
}
