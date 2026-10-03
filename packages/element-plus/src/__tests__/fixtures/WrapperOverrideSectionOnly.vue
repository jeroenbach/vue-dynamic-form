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

    <template #default-array="s">
      <section data-testid="custom-section" :data-can-add="String(s.canAddItems)">
        <slot v-bind="s" />
        <button type="button" data-testid="custom-add" @click="s.addItem()">
          more
        </button>
      </section>
    </template>
  </ElementPlusFormTemplate>
</template>
