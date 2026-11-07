<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { projectMetadata } from './ProjectFormTemplate';
</script>

<template>
  <StarterFormTemplate :metadataConfiguration="projectMetadata">
    <!-- Hands the engine's field and attribute renders to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <template #range-input="{ fieldContext, fieldMetadata, disabled }">
      <div class="rangeInput">
        <input
          :id="fieldMetadata.path"
          type="range"
          class="sft-input"
          :min="fieldMetadata.min ?? 0"
          :max="fieldMetadata.max ?? 10"
          :step="fieldMetadata.step ?? 1"
          :value="fieldContext.value.value ?? String(fieldMetadata.min ?? 0)"
          :disabled="disabled || fieldMetadata.disabled"
          @input="fieldContext.handleChange(($event.target as HTMLInputElement).value)"
          @blur="fieldContext.handleBlur"
        >
        <output class="rangeValue" :for="fieldMetadata.path">
          {{ fieldContext.value.value ?? fieldMetadata.min ?? 0 }}
        </output>
      </div>
    </template>

    <template #rating-input="{ fieldContext, fieldMetadata, disabled }">
      <div class="ratingInput" role="radiogroup">
        <button
          v-for="star in fieldMetadata.maxRating ?? 5"
          :key="star"
          type="button"
          role="radio"
          class="ratingStar"
          :class="{ isActive: star <= (fieldContext.value.value ?? 0) }"
          :aria-checked="star === fieldContext.value.value"
          :aria-label="`${star} of ${fieldMetadata.maxRating ?? 5}`"
          :disabled="disabled || fieldMetadata.disabled"
          @click="fieldContext.handleChange(star)"
          @blur="fieldContext.handleBlur"
        >
          ★
        </button>
      </div>
    </template>
  </StarterFormTemplate>
</template>

<style scoped>
.rangeInput {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rangeInput input {
  flex: 1;
}

.rangeValue {
  min-width: 2ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ratingInput {
  display: flex;
  gap: 0.25rem;
}

.ratingStar {
  background: none;
  border: none;
  padding: 0;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--sft-input-border, #d4d4d8);
}

.ratingStar.isActive {
  color: #f59e0b;
}
</style>
