<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';

type Props = DynamicFormItemProps<InternalMetadata>;
const { template, field } = defineProps<Props>();
</script>

<template>
  <component :is="template" type="choice" :field="field">
    <template #children>
      <DynamicFormItem
        v-for="child in field.choice"
        :key="child.name"
        :field="child as InternalMetadata"
        :template="template"
      />
    </template>
  </component>
</template>
