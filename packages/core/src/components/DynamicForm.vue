<script lang="ts" setup generic="Metadata extends FieldMetadata">
import type { DefineComponent } from 'vue';

import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed, ref } from 'vue';

import DynamicFormItem from '@/components/DynamicFormItem.vue';

// #region Interfaces
export interface DynamicFormProps<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[]
  template: DefineComponent<object, object, any>
}
export interface Emit {
  (e: 'update:modelValue', value: any): void
}
// #endregion

// #region Analytics
/**
 * Some analytics variables to test the reactivity, as we want to make sure we don't cause any unnecessary
 * updates. We don't make them reactive as we don't want to create infinite loops.
 */
let _analytics_fieldTransformCount = 0;
// #endregion

// #region Props and State
defineOptions({ name: 'DynamicForm', inheritAttrs: false });

const { metadata, template } = defineProps<DynamicFormProps<Metadata>>();
const emit = defineEmits<Emit>();

const metadataAsArray = computed(() =>
  Array.isArray(metadata) ? metadata : [metadata],
);

const metadataWithDefaults = computed(() =>
  metadataAsArray.value?.map((x, index) => correctMetadataAndSetDefaults(x, index)),
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

/**
 * In case of an object, the useFieldValue() in vee-validate doesn't react on an update of a value of its children.
 * Therefore we keep track of an reactive value, that is updated by the children.
 */
const readOnlyValue = ref();
// #endregion

// #region Methods

function correctMetadataAndSetDefaults(
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

function updateReadOnlyValue(value: any){
  readOnlyValue.value = value;
  emit('update:modelValue', value);
};

// #endregion
</script>

<template>
  <DynamicFormItem
    v-for="field in metadataWithDefaults"
    :key="field.name"
    :template="typedTemplate"
    :field="field as InternalFieldMetadata<FieldMetadata>"
  />
</template>
