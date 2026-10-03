<script lang="ts" setup>
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';
</script>

<template>
  <ElementPlusFormTemplate>
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <template #text-array-item="s">
      <div data-testid="custom-text-item">
        <slot v-bind="s" />
      </div>
    </template>
  </ElementPlusFormTemplate>
</template>
