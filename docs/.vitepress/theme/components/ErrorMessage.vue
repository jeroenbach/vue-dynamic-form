<script lang="ts" setup>
export interface Props {
  errorMessage?: string
  dataTestid?: string
}
defineProps<Props>();
</script>

<template>
  <span
    v-if="errorMessage"
    class="text-red-600 dark:text-rose-400 text-sm"
    :data-testid="`${dataTestid}-error-message`"
  >{{ errorMessage }}</span>
</template>
