import type { MaybeRefOrGetter } from 'vue';
import { useFormContext } from 'vee-validate';
import { toValue } from 'vue';

interface PathStateWithFlags {
  __flags?: { pendingReset?: boolean }
}

/**
 * While `resetForm()` / `resetField()` flushes, vee-validate marks every affected path state
 * with a private `pendingReset` flag (cleared again on the next tick) so that its own value
 * watchers skip validation during the reset. Our components own their validation timing through
 * custom value watchers, so they must honour the same flag; otherwise the reset-triggered value
 * change would validate the freshly reset value and write the just-cleared errors straight back.
 *
 * `getPathState` and `__flags` are deliberately left off vee-validate's public FormContext type,
 * so they are read through a loosely typed access (the same way DynamicFormItem reads
 * `keepValuesOnUnmount`).
 */
export function useIsResetPending(path: MaybeRefOrGetter<string>): () => boolean {
  const formContext = useFormContext() as {
    getPathState?: (path: string) => PathStateWithFlags | undefined
  } | undefined;

  return () => formContext?.getPathState?.(toValue(path))?.__flags?.pendingReset === true;
}
