import type {
  FormContext,
  Path,
  PathValue,
} from 'vee-validate';
import type { MaybeRefOrGetter, Ref } from 'vue';
import type { KeyValue } from '@/types/KeyValue';
import {
  useFieldValue as _useFieldValue,
  useForm,
} from 'vee-validate';

export function useDynamicForm<TValues extends KeyValue>(): FormContext<TValues> & {
  useFieldValue: <TPath extends Path<TValues>>(path?: MaybeRefOrGetter<TPath>) => Ref<PathValue<TValues, TPath>>
} {
  // Type the useFieldValue
  const useFieldValue = <TPath extends Path<TValues>>(path?: MaybeRefOrGetter<TPath>) => {
    return _useFieldValue<PathValue<TValues, TPath>>(path);
  };

  const form = useForm<TValues>();

  return {
    ...form,
    useFieldValue,
  };
}
