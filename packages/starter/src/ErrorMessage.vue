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
    class="sft-error"
    :data-testid="dataTestid ? `${dataTestid}-error` : undefined"
  >{{ errorMessage }}</span>
</template>
