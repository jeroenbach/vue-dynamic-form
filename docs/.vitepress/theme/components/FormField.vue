<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import ErrorMessage from './ErrorMessage.vue';
import OptionalRequiredTag from './OptionalRequiredTag.vue';

export interface Props {
  inputId?: string
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  disabled?: boolean
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  dependentOnMessage?: string
  errorMessage?: string
  canRemoveItems?: boolean
  dataTestid?: string
}
defineProps<Props>();
defineEmits<{
  removeItem: []
}>();
</script>

<template>
  <div
    :data-testid="dataTestid"
    class="flex flex-col gap-2"
    :class="{ 'opacity-60': disabled }"
  >
    <label class="flex justify-between" :for="inputId">
      {{ label }}
      <OptionalRequiredTag :required :show-required-or-optional />
    </label>
    <div
      v-if="dependentOnMessage"
      class="h-10 grid place-items-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400"
    >
      {{ dependentOnMessage }}
    </div>
    <div v-else class="flex items-start gap-2">
      <div class="grow">
        <slot />
      </div>
      <AppButton
        v-if="canRemoveItems"
        label="Remove"
        variant="danger"
        :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
        @click="$emit('removeItem')"
      />
    </div>
    <p v-if="description" class="text-sm leading-5 text-slate-500 dark:text-slate-400">
      {{ description }}
    </p>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </div>
</template>
