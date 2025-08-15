<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed } from 'vue';

import DynamicFormItemArray from '@/components/DynamicFormItemArray.vue';
import DynamicFormItemChoice from '@/components/DynamicFormItemChoice.vue';

type Props = DynamicFormItemProps<InternalMetadata>;
const { template, field } = defineProps<Props>();

const isChoice = computed(() => !!field.choice?.length);
const isArray = computed(() => field.maxOccurs > 1);
</script>

<template>
  <template v-if="isChoice">
    <component :is="template" type="choice" :field="field">
      <template #children>
        <DynamicFormItemChoice :field="field" :template="template" />
      </template>
    </component>
  </template>
  <template v-else-if="isArray">
    <component :is="template" type="array" :field="field">
      <template #children>
        <DynamicFormItemArray :field="field" :template="template" />
      </template>
    </component>
  </template>
  <template v-else>
    <component :is="template" :type="field.type" :field="field">
      <template #input>
        <component
          :is="template"
          :type="`${field.type}-input`"
          :field="field"
        />
      </template>
      <template #children>
        <DynamicFormItem
          v-for="child in field.children"
          :key="child.name"
          :field="child as InternalMetadata"
          :template="template"
        />
      </template>
    </component>
  </template>
</template>
