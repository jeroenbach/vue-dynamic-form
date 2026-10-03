<script lang="ts" setup>
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';
import { extendMetadata } from '@/metadata';

const myMetadata = extendMetadata<{ richText: string }>();

function asNumber(_value: number) {}
function asString(_value: string) {}
</script>

<template>
  <ElementPlusFormTemplate :metadataConfiguration="myMetadata">
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <template #richText-input="s">
      <div data-testid="documented-rich-text">
        {{ asString(s.fieldContext.value.value) }}
        <!-- @vue-expect-error the rich text value is a string -->
        {{ asNumber(s.fieldContext.value.value) }}
        <button type="button" @click="s.fieldContext.handleChange('typed')">
          type
        </button>
      </div>
    </template>
  </ElementPlusFormTemplate>
</template>
