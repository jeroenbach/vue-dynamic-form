<script lang="ts" setup>
export interface Props {
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
}

const { showRequiredOrOptional = 'optional' } = defineProps<Props>();
</script>

<template>
  <span v-if="required && showRequiredOrOptional === 'required'" class="optional-required-tag text-red-500 dark:text-rose-400">*</span>
  <span
    v-if="!required && showRequiredOrOptional === 'optional'"
    class="optional-required-tag inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
  >
    Optional
  </span>
</template>

<style lang="css">
.hide-optional-required .optional-required-tag {
  display: none;
}
</style>
