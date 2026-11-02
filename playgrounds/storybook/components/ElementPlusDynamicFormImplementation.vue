<script lang="ts" setup>
import { ElementPlusDynamicForm } from '@bach.software/vue-dynamic-form-element-plus';
</script>

<template>
  <ElementPlusDynamicForm>
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
    <!-- Override the default wrapper with form item -->
    <template #default="{ fieldMetadata }">
      <div class="flex flex-col gap-2">
        <label>{{ fieldMetadata.label }}</label>
        <slot name="input" />
      </div>
    </template>
  </ElementPlusDynamicForm>
</template>
