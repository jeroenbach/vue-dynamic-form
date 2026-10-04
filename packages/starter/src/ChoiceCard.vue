<script lang="ts" setup>
export interface Props {
  title?: string
  description?: string
  selected?: boolean
  dataTestid?: string
}

defineProps<Props>();
defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    role="radio"
    :data-testid="dataTestid"
    :aria-checked="selected"
    class="sft-choice-card"
    :class="{ 'is-selected': selected }"
    @click="$emit('select')"
  >
    <div class="sft-choice-body">
      <span class="sft-choice-radio">
        <span class="sft-choice-radio-dot" />
      </span>
      <div class="sft-choice-text">
        <div class="sft-choice-title-row">
          <span v-if="$slots.icon" class="sft-choice-icon"><slot name="icon" /></span>
          <p v-if="title" class="sft-choice-title">
            {{ title }}
          </p>
        </div>
        <p v-if="description" class="sft-choice-desc">
          {{ description }}
        </p>
      </div>
    </div>
  </button>
</template>
