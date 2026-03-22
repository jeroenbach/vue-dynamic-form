<script lang="ts" setup generic="Metadata extends FieldMetadata">
import type { DefineComponent } from 'vue';

import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';

import { computed, provide, ref } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';
import { setInPath } from '@/utils/setInPath';

// #region Interfaces
export interface DynamicFormProps<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[]
  template: DefineComponent<object, object, any>
  settings?: DynamicFormSettings
}
export interface Emit {
  (e: 'update:modelValue', value: any): void
}
// #endregion

// #region Props and State
defineOptions({ name: 'DynamicForm', inheritAttrs: false });

const { settings, metadata, template } = defineProps<DynamicFormProps<Metadata>>();
const emits = defineEmits<Emit>();

provide(dynamicFormSettingsKey, computed(() => settings));

const readOnlyValue = ref();

const metadataAsArray = computed(() =>
  Array.isArray(metadata) ? metadata : [metadata],
);

const metadataWithDefaults = computed(() =>
  metadataAsArray.value?.map((x, index) => correctMetadataAndSetDefaults(x, index)) ?? [],
);

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

// #endregion

// #region Methods

function correctMetadataAndSetDefaults(
  fieldMetadata: Metadata,
  index?: number,
  parent?: InternalFieldMetadata<Metadata>,
) {
  if (!fieldMetadata)
    return fieldMetadata;

  const fieldName = fieldMetadata.name ?? `field-${index}`;
  // Construct the path with the parent path, unless we specify an override
  const fieldPath = fieldMetadata.path ?? [parent?.path, fieldName].filter(Boolean).join('.');
  const copy: InternalFieldMetadata<Metadata> = {
    // Set defaults
    name: fieldName,
    path: fieldPath,
    type: 'text', // Default type
    minOccurs: 1, // by default required
    maxOccurs: 1, // by default not repeatable

    ...fieldMetadata,
    // Override some of the field properties
    computedProps: [...(fieldMetadata.computedProps ?? [])],
    parent,
  };

  // Recursively go through the tree
  copy.children = (fieldMetadata.children ?? []).map((x, index) =>
    correctMetadataAndSetDefaults(x as Metadata, index, copy),
  );
  copy.choice = (fieldMetadata.choice ?? []).map((x, index) =>
    correctMetadataAndSetDefaults(x as Metadata, index, copy),
  );
  copy.attributes = (fieldMetadata.attributes ?? []).map((x, index) =>
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
    v-for="fieldMetadata in metadataWithDefaults"
    :key="fieldMetadata.name"
    :template="typedTemplate"
    :field-metadata="(fieldMetadata as InternalFieldMetadata<FieldMetadata>)"
    @update:model-value="value => updateReadOnlyValue(value, fieldMetadata.path)"
  />
</template>
