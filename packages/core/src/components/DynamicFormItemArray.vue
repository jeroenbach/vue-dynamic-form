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
  <DynamicFormItem
    v-for="(item) in field.children"
    :key="item.name"
    :template="template"
    :field="item"
  />
</template>
