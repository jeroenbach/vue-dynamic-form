<script lang="ts" setup generic="Metadata extends FieldMetadata">
import { computed, useAttrs, type DefineComponent } from 'vue';
import type { FieldMetadata } from '~/types/FieldMetadata';
export interface Props<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[];
  template: DefineComponent<{}, {}, any>;
};

const { metadata, template } = defineProps<Props<Metadata>>();
defineOptions({ name: 'DynamicForm', inheritAttrs: false });
const { recursive } = useAttrs();

const typedTemplate = computed(() => template as DefineComponent<{}, {}, {
    input?: ((props: {}) => any) | undefined;
    children?: ((props: {}) => any) | undefined;
    attributes?: ((props: {}) => any) | undefined;
    choice?: ((props: {}) => any) | undefined;
    array?: ((props: {}) => any) | undefined;
  }>)
const metadataAsArray = computed(() => Array.isArray(metadata) ? metadata : [metadata]);

const metadataWithDefaults = computed(() => {
  // Only set the defaults once
  if (recursive !== undefined) return metadataAsArray.value;

  return metadataAsArray.value?.map((x, index) => correctMetadata(x, index));
});

function correctMetadata(field: Metadata, index?: number, parent?: Metadata) {
  if (!field) return field;

  const backupName = `field-${index}`;

  const copy: Metadata = {
    // Set defaults
    name: backupName,
    path: field.name ?? backupName,
    minOccurs: 1, // by default required
    maxOccurs: 1, // by default not repeatable
    ...field,
    // Override some of the field properties
    transformReactively: [...(field.transformReactively ?? [])],
    parent,
  };

  // Recursively go through the tree 
  copy.children = (field.children ?? []).map((x, index) => correctMetadata(x as Metadata, index, copy));
  copy.choice = (field.choice ?? []).map((x, index) => correctMetadata(x as Metadata, index, copy));
  copy.attributes = (field.attributes ?? []).map((x, index) => correctMetadata(x as Metadata, index, copy));

  return copy;
}

</script>
<template>
  <component
    v-for="value in metadataWithDefaults"
    :is="typedTemplate"
    :key="value.name"
    :type="value.type"
    :field="value"
  >
    <template #input>
      <component
        :is="typedTemplate"
        :type="`${value.type}-input`"
        :field="value"
      />
    </template>
    <template #children>
      <DynamicForm v-if="value.children" :metadata="(value.children as Metadata[])" :template="typedTemplate" recursive />
    </template>
  </component>
</template>
