<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from './AppButton.vue';
import ErrorMessage from './ErrorMessage.vue';

export interface Props {
  label?: MaybeRefOrGetter<string | undefined>
  description?: string
  required?: boolean
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
    class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6"
    :class="{ 'opacity-60': disabled }"
  >
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div class="space-y-1 grow">
        <span class="flex justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
          {{ label }}
          <span
            v-if="!required"
            class="optional-tag inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            Optional
          </span>
        </span>
        <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>
      </div>
      <div v-if="canAddItems || canRemoveItems" class="flex gap-2">
        <AppButton
          v-if="canAddItems"
          label="Add"
          @click="$emit('add')"
        />
        <AppButton
          v-if="canRemoveItems"
          label="Remove"
          variant="danger"
          @click="$emit('remove')"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2" :class="{ 'hide-optional': !required }">
      <slot />
    </div>
    <ErrorMessage :error-message="errorMessage" :data-testid="dataTestid" />
  </section>
</template>

<style lang="css">
.hide-optional .optional-tag {
  display: none;
}
</style>
