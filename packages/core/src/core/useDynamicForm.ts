import type { PartialDeep } from 'type-fest';
import type {
  FlattenAndSetPathsType,
  FormContext,
  GenericObject,
  Path,
  PathValue,
} from 'vee-validate';
import type { MaybeRef, MaybeRefOrGetter, Ref } from 'vue';
import {
  useFieldValue as _useFieldValue,
  useForm,
} from 'vee-validate';
import { useValidatePartialForm } from '@/core/useValidatePartialForm';

/** Options forwarded directly to vee-validate's `useForm()`. */
export interface FormOptions<TValues extends GenericObject> {
  initialValues?: PartialDeep<TValues> | undefined | null
  initialErrors?: FlattenAndSetPathsType<TValues, string | undefined>
  initialTouched?: FlattenAndSetPathsType<TValues, boolean>
  validateOnMount?: boolean
  keepValuesOnUnmount?: MaybeRef<boolean>
  name?: string
}

/**
 * Typed wrapper around vee-validate's `useForm()`. Adds:
 * - `useFieldValue(path)` — path-aware field value accessor with full `TValues` type inference,
 *   avoiding the need to manually cast `PathValue`.
 * - `validateSection(path)` — validates only the fields registered under the given path prefix,
 *   useful for multi-step wizard validation.
 */
export function useDynamicForm<TValues extends GenericObject = GenericObject>(opts?: FormOptions<TValues>): FormContext<TValues> & {
  useFieldValue: <TPath extends Path<TValues>>(path?: MaybeRefOrGetter<TPath>) => Ref<PathValue<TValues, TPath>>
  validateSection: ReturnType<typeof useValidatePartialForm>['validateSection']
} {
  const useFieldValue = <TPath extends Path<TValues>>(path?: MaybeRefOrGetter<TPath>) => {
    return _useFieldValue<PathValue<TValues, TPath>>(path);
  };

  const form = useForm<TValues>(opts);
  const { validateSection } = useValidatePartialForm();

  return {
    ...form,
    useFieldValue,
    validateSection,
  };
}
