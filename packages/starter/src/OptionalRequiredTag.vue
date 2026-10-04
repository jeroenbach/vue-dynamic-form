<script lang="ts" setup>
export interface Props {
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
}

const { showRequiredOrOptional = 'optional' } = defineProps<Props>();
</script>

<template>
  <span v-if="required && showRequiredOrOptional === 'required'" class="sft-tag-required">*</span>
  <span v-if="!required && showRequiredOrOptional === 'optional'" class="sft-tag-optional">Optional</span>
</template>
