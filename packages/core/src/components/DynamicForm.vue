<script lang="ts" setup generic="Metadata extends FieldMetadata">
import type { DefineComponent } from 'vue';

import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed, ref } from 'vue';

import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { setInPath } from '@/utils/setInPath';

// #region Interfaces
export interface DynamicFormProps<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[]
  template: DefineComponent<object, object, any>
}
export interface Emit {
  (e: 'update:modelValue', value: any): void
}
// #endregion

// #region Props and State
defineOptions({ name: 'DynamicForm', inheritAttrs: false });

const props = defineProps<DynamicFormProps<Metadata>>();
const emits = defineEmits<Emit>();

const readOnlyValue = ref();

const metadataAsArray = computed(() =>
  Array.isArray(props.metadata) ? props.metadata : [props.metadata],
);

const metadataWithDefaults = computed(() =>
  metadataAsArray.value?.map((x, index) => correctMetadataAndSetDefaults(x, index)) ?? [],
);

const typedTemplate = computed(
  () =>
    props.template as DefineComponent<
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

// #endregion

// #region Methods

function correctMetadataAndSetDefaults(
  field: Metadata,
  index?: number,
  parent?: InternalFieldMetadata<Metadata>,
) {
  if (!field)
    return field;

  const fieldName = field.name ?? `field-${index}`;
  // Construct the path with the parent path, unless we specify an override
  const fieldPath = field.path ?? [parent?.path, fieldName].filter(Boolean).join('.');
  const copy: InternalFieldMetadata<Metadata> = {
    // Set defaults
    name: fieldName,
    path: fieldPath,
    type: 'text', // Default type
    minOccurs: 1, // by default required
    maxOccurs: 1, // by default not repeatable

    ...field,
    // Override some of the field properties
    transformReactively: [...(field.transformReactively ?? [])],
    parent,
  };

  // Recursively go through the tree
  copy.children = (field.children ?? []).map((x, index) =>
    correctMetadataAndSetDefaults(x as Metadata, index, copy),
  );
  copy.choice = (field.choice ?? []).map((x, index) =>
    correctMetadataAndSetDefaults(x as Metadata, index, copy),
  );
  copy.attributes = (field.attributes ?? []).map((x, index) =>
    correctMetadataAndSetDefaults(x as Metadata, index, copy),
  );

  return copy;
}

function updateReadOnlyValue(value: any, path?: string) {
  if (path) {
    // Ensure readOnlyValue is an object if we're setting a path
    if (!readOnlyValue.value || typeof readOnlyValue.value !== 'object') {
      readOnlyValue.value = {};
    }
    setInPath(readOnlyValue.value, path, value);
  }
  else {
    readOnlyValue.value = value;
  }
  emits('update:modelValue', readOnlyValue.value);
};

// #endregion
</script>

<template>
  <DynamicFormItem
    v-for="field in metadataWithDefaults"
    :key="field.name"
    :template="typedTemplate"
    :field="(field as InternalFieldMetadata<FieldMetadata>)"
    @update:model-value="updateReadOnlyValue"
  />
</template>
