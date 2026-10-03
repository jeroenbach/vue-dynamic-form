<script lang="ts" setup>
import type { GetDynamicFormSettingsType, GetMetadataType } from '@/index';
import { ElementPlusFormTemplate, extendMetadata } from '@/index';

const myMetadata = extendMetadata<
  { richText: string },
  { toolbar?: boolean },
  { tip: string },
  { locale: string }
>();

export type ExtendedField = GetMetadataType<typeof myMetadata>;
export type ExtendedSettings = GetDynamicFormSettingsType<typeof myMetadata>;

// Compile-time assertion helpers: each accepts only its own type, so a wrong
// (or `any`) slot scope type shows up as an error on the line that uses it.
function asOptionalBoolean(_value: boolean | undefined) {}
function asOptionalString(_value: string | undefined) {}
function asString(_value: string) {}
function asNumber(_value: number) {}
</script>

<template>
  <ElementPlusFormTemplate :metadataConfiguration="myMetadata">
    <template #default-input="s">
      {{ asOptionalBoolean(s.fieldMetadata.toolbar) }}
      {{ asString(s.settings.locale) }}
      {{ asString(s.slotProps.tip) }}
      <!-- @vue-expect-error toolbar is not a string -->
      {{ asString(s.fieldMetadata.toolbar) }}
      <!-- @vue-expect-error locale is not a number -->
      {{ asNumber(s.settings.locale) }}
      <!-- @vue-expect-error tip is not a number -->
      {{ asNumber(s.slotProps.tip) }}
    </template>
  </ElementPlusFormTemplate>

  <ElementPlusFormTemplate>
    <template #default-input="s">
      {{ asOptionalString(s.fieldMetadata.placeholder) }}
      <!-- @vue-expect-error toolbar only exists on the extended configuration -->
      {{ asOptionalBoolean(s.fieldMetadata.toolbar) }}
    </template>
  </ElementPlusFormTemplate>

  <!-- @vue-expect-error an empty object is not a metadata configuration -->
  <ElementPlusFormTemplate :metadataConfiguration="{}" />
</template>
