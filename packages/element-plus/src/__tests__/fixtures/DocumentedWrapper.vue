<script lang="ts" setup>
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';

function asNumber(_value: number) {}
function asString(_value: string) {}
</script>

<template>
  <ElementPlusFormTemplate>
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <template #date-input="s">
      <div data-testid="documented-date">
        {{ s.fieldMetadata.name }}
        {{ asString(s.fieldContext.value.value) }}
        <!-- @vue-expect-error the date value is a string -->
        {{ asNumber(s.fieldContext.value.value) }}
      </div>
    </template>
  </ElementPlusFormTemplate>
</template>
