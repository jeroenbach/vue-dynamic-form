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

    <template #default-array-item="s">
      <div :data-testid="`custom-item-${s.index}`" :data-can-remove="String(s.canRemoveItems)">
        <slot v-bind="s" />
        <button type="button" :data-testid="`custom-remove-${s.index}`" @click="s.removeItem()">
          drop
        </button>
      </div>
    </template>
  </ElementPlusFormTemplate>
</template>
