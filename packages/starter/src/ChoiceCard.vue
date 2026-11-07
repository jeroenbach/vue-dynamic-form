<script lang="ts" setup>
export interface Props {
  title?: string
  description?: string
  selected?: boolean
  disabled?: boolean
  dataTestid?: string
  /** Roving tabindex seat: the group keeps exactly one card at `0`, every other card at `-1`. */
  tabindex?: number
}

withDefaults(defineProps<Props>(), {
  tabindex: 0,
});
defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    role="radio"
    :data-testid="dataTestid"
    :aria-checked="selected"
    :disabled="disabled"
    :tabindex="tabindex"
    class="sft-choice-card"
    :class="{ 'is-selected': selected, 'is-disabled': disabled }"
    @click="$emit('select')"
    @keydown.space.prevent="$emit('select')"
    @keydown.enter.prevent="$emit('select')"
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
