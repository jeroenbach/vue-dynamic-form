<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';

export interface Props {
  inputId?: string
  label?: MaybeRefOrGetter<string | undefined>
  required?: boolean
}
defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="inputId">
      {{ label }}
      <span v-if="required" class="-ml-0.5 text-red-500">*</span>
    </label>
    <slot />
  </div>
</template>
