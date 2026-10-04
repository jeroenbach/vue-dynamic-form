<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
</script>

<template>
  <StarterFormTemplate>
    <!-- Hands the engine's field render to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>

    <!-- Swaps every Lucide glyph for a visibly distinct solid square, proving the #icon slot reaches every glyph site. -->
    <template #icon="{ name, size }">
      <span
        class="iconOverrideGlyph"
        data-testid="icon-override-glyph"
        :data-name="name"
        :style="{ width: `${size}px`, height: `${size}px` }"
      />
    </template>
  </StarterFormTemplate>
</template>

<style scoped>
.iconOverrideGlyph {
  display: inline-block;
  background-color: currentColor;
  border-radius: 2px;
}
</style>
