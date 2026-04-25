<script lang="ts" setup generic="Metadata extends FieldMetadata">
import type { DefineComponent } from 'vue';

import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';

import { computed, provide } from 'vue';
import DynamicFormItem from '@/components/DynamicFormItem.vue';
import { dynamicFormSettingsKey } from '@/types/DynamicFormSettings';

// #region Interfaces
export interface DynamicFormProps<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[]
  template: DefineComponent<object, object, any>
  settings?: DynamicFormSettings
}
// #endregion

// #region Props and State
defineOptions({ name: 'DynamicForm', inheritAttrs: false });

const { settings: _settings, metadata, template } = defineProps<DynamicFormProps<Metadata>>();

const settings = computed(() => ({
  validateOnValueUpdate: true,
  validateWhenInError: true,
  ...(_settings ?? {}),
}));

provide(dynamicFormSettingsKey, settings);

const metadataAsArray = computed(() =>
  Array.isArray(metadata) ? metadata : [metadata],
);

const metadataWithDefaults = computed(() =>
  metadataAsArray.value?.map((x, index) => correctMetadataAndSetDefaults(x, index)) ?? [],
);

// DefineComponent doesn't carry slot shape information, so we widen the type here
// to make the available slots known to child components at the type level.
const typedTemplate = computed(
  () =>
    template as DefineComponent<
      object,
      object,
      {
        default?: ((props: object) => any) | undefined
        attributes?: ((props: object) => any) | undefined
        choice?: ((props: object) => any) | undefined
        array?: ((props: object) => any) | undefined
      }
    >,
);
// #endregion

// #region Methods

/**
 * Recursively walks the metadata tree and fills in missing defaults (name, path, type, minOccurs,
 * maxOccurs) and links each node to its parent so child components can compute fully-qualified paths.
 */
function correctMetadataAndSetDefaults(
  fieldMetadata: Metadata,
  index?: number,
  parent?: InternalFieldMetadata<Metadata>,
) {
  if (!fieldMetadata)
    return fieldMetadata;

  const fieldName = fieldMetadata.name ?? `field-${index}`;
  const fieldPath = fieldMetadata.path ?? [parent?.path, fieldName].filter(Boolean).join('.');
  const copy: InternalFieldMetadata<Metadata> = {
    name: fieldName,
    path: fieldPath,
    type: 'text',
    minOccurs: 1,
    maxOccurs: 1,

    ...fieldMetadata,
    computedProps: [...(fieldMetadata.computedProps ?? [])],
    parent,
  };

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

// #endregion
</script>

<template>
  <DynamicFormItem
    v-for="fieldMetadata in metadataWithDefaults"
    :key="fieldMetadata.name"
    :template="typedTemplate"
    :field-metadata="(fieldMetadata as InternalFieldMetadata<FieldMetadata>)"
  />
</template>
