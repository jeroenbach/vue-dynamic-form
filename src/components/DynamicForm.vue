<script lang="ts" setup generic="Metadata extends FieldMetadata">
import type { DefineComponent } from 'vue';

import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed } from 'vue';

import DynamicFormItem from '@/components/DynamicFormItem.vue';

export interface DynamicFormProps<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[]
  template: DefineComponent<object, object, any>
}
type Props = DynamicFormProps<Metadata>;

defineOptions({ name: 'DynamicForm', inheritAttrs: false });
const { metadata, template } = defineProps<Props>();
const metadataAsArray = computed(() =>
  Array.isArray(metadata) ? metadata : [metadata],
);

const metadataWithDefaults = computed(() =>
  metadataAsArray.value?.map((x, index) => correctMetadata(x, index)),
);

function correctMetadata(
  field: Metadata,
  index?: number,
  parent?: InternalFieldMetadata<Metadata>,
) {
  if (!field)
    return field;

  const backupName = `field-${index}`;
  const copy: InternalFieldMetadata<Metadata> = {
    // Set defaults
    name: backupName,
    type: 'text', // Default type
    path: field.name ?? backupName,
    minOccurs: 1, // by default required
    maxOccurs: 1, // by default not repeatable
    ...field,
    // Override some of the field properties
    transformReactively: [...(field.transformReactively ?? [])],
    parent,
  };

  // Recursively go through the tree
  copy.children = (field.children ?? []).map((x, index) =>
    correctMetadata(x as Metadata, index, copy),
  );
  copy.choice = (field.choice ?? []).map((x, index) =>
    correctMetadata(x as Metadata, index, copy),
  );
  copy.attributes = (field.attributes ?? []).map((x, index) =>
    correctMetadata(x as Metadata, index, copy),
  );

  return copy;
}

const typedTemplate = computed(
  () =>
    template as DefineComponent<
      object,
      object,
      {
        input?: ((props: object) => any) | undefined
        children?: ((props: object) => any) | undefined
        attributes?: ((props: object) => any) | undefined
        choice?: ((props: object) => any) | undefined
        array?: ((props: object) => any) | undefined
      }
    >,
);
</script>

<template>
  <DynamicFormItem
    v-for="field in metadataWithDefaults"
    :key="field.name"
    :template="typedTemplate"
    :field="field as InternalFieldMetadata<FieldMetadata>"
  />
</template>
