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
    class="text-red-600 text-sm"
    :data-testid="`${dataTestid}-error-message`"
  >{{ errorMessage }}</span>
</template>
