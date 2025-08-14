<script lang="ts" setup generic="Metadata extends FieldMetadata">
import { computed, type DefineComponent } from 'vue';
import type { FieldMetadata } from '~/types/FieldMetadata';
export interface Props<Metadata extends FieldMetadata> {
  metadata: Metadata | Metadata[];
  template: DefineComponent<{}, {}, any>;
};

const { metadata, template } = defineProps<Props<Metadata>>();
defineOptions({ name: 'DynamicForm' });

const metadataAsArray = computed(() => Array.isArray(metadata) ? metadata : [metadata]);
const typedTemplate = computed(() => template as DefineComponent<{}, {}, {
    input?: ((props: {}) => any) | undefined;
    children?: ((props: {}) => any) | undefined;
  }>)
</script>
<template>
  <component
    v-for="value in metadataAsArray"
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
      <DynamicForm v-if="value.children" :metadata="(value.children as Metadata[])" :template="typedTemplate" />
    </template>
  </component>
</template>
