<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from './AppButton.vue';
import ErrorMessage from './ErrorMessage.vue';
import OptionalRequiredTag from './OptionalRequiredTag.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
  showRequiredOrOptional?: 'optional' | 'required'
  disabled?: boolean
  canAddItems?: boolean
  canRemoveItems?: boolean
  errorMessage?: string
  dataTestid?: string
}

defineProps<Props>();

defineEmits<{
  add: []
  remove: []
}>();
</script>

<template>
  <section
    :data-testid="dataTestid"
    class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6"
    :class="{ 'opacity-60': disabled }"
  >
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1 grow">
        <span class="flex justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
          {{ label }}
          <OptionalRequiredTag v-if="showRequiredOrOptional === 'optional'" :required :show-required-or-optional />
        </span>
        <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>
      </div>
      <div v-if="canAddItems || canRemoveItems" class="flex gap-2">
        <AppButton
          v-if="canAddItems"
          label="Add"
          :dataTestid="dataTestid ? `${dataTestid}-add-button` : undefined"
          @click="$emit('add')"
        />
        <AppButton
          v-if="canRemoveItems"
          label="Remove"
          variant="danger"
          :dataTestid="dataTestid ? `${dataTestid}-remove-button` : undefined"
          @click="$emit('remove')"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2" :class="{ 'hide-optional-required': showRequiredOrOptional === 'optional' }">
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
