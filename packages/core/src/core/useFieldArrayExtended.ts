import type { MaybeRefOrGetter } from 'vue';
import { useFieldArray } from 'vee-validate';
import { computed } from 'vue';

/**
 * Extended useFieldArray, with the childrens values included.
 */
export function useFieldArrayExtended(arrayPath: MaybeRefOrGetter<string>) {
  const { fields, ...originalFieldArray } = useFieldArray(arrayPath);
  const values = computed(() => fields.value.map(({ value }) => value));

  return {
    fields,
    values,
    ...originalFieldArray,
  };
}
