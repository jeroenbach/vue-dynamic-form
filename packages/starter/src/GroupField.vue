<script lang="ts" setup>
import type { MaybeRefOrGetter } from 'vue';
import AppButton from '@/AppButton.vue';
import ErrorMessage from '@/ErrorMessage.vue';
import OptionalRequiredTag from '@/OptionalRequiredTag.vue';

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
    class="sft-field sft-group"
    :class="{ 'is-disabled': disabled }"
  >
    <div>
      <span class="sft-choice-group-title" :class="{ 'is-disabled': disabled }">
        {{ label }}
        <OptionalRequiredTag v-if="showRequiredOrOptional === 'optional'" :required :show-required-or-optional />
      </span>
      <p v-if="description" class="sft-field-desc">
        {{ description }}
      </p>
    </div>
    <div v-if="canAddItems || canRemoveItems">
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
    <div
      class="sft-choice-group-body"
      :class="{ 'sft-hide-tag': showRequiredOrOptional === 'optional' }"
    >
      <slot />
    </div>
    <ErrorMessage :errorMessage="errorMessage" :dataTestid="dataTestid" />
  </section>
</template>
