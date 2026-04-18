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
} {
  // Type the useFieldValue
  const useFieldValue = <TPath extends Path<TValues>>(path?: MaybeRefOrGetter<TPath>) => {
    return _useFieldValue<PathValue<TValues, TPath>>(path);
  };

  const form = useForm<TValues>(opts);

  return {
    ...form,
    useFieldValue,
  };
}
