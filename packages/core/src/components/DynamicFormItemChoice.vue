<script
  lang="ts"
  setup
  generic="InternalMetadata extends InternalFieldMetadata<FieldMetadata>"
>
import type { DynamicFormItemProps } from '@/types/DynamicFormItemProps';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';
import { computed } from 'vue';
import { overridePath } from '@/utils/overridePath';

type Props = DynamicFormItemProps<InternalMetadata>;
const props = defineProps<Props>();

// The path of this field, while taking the override into consideration
const path = computed(() => {
  if (!props.field?.path)
    return '';

  return overridePath(props.field.path, props.pathOverride);
});
</script>

<template>
  <component :is="template" type="choice" :field="field">
    <template #children>
      <DynamicFormItem
        v-for="child in field.choice"
        :key="child.name"
        :field="(child as InternalMetadata)"
        :path-override="path"
        :template="template"
      />
    </template>
  </component>
</template>
