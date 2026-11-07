<script lang="ts" setup>
export interface Props {
  errorMessage?: string
  dataTestid?: string
  id?: string
}
defineProps<Props>();
</script>

<template>
  <span
    v-if="errorMessage"
    :id
    class="sft-error"
    role="alert"
    :data-testid="dataTestid ? `${dataTestid}-error` : undefined"
  >{{ errorMessage }}</span>
</template>
