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

export interface FormOptions<TValues extends GenericObject> {
  initialValues?: PartialDeep<TValues> | undefined | null
  initialErrors?: FlattenAndSetPathsType<TValues, string | undefined>
  initialTouched?: FlattenAndSetPathsType<TValues, boolean>
  validateOnMount?: boolean
  keepValuesOnUnmount?: MaybeRef<boolean>
  name?: string
}

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
