// Components
export { default as ElementPlusFormTemplate } from '@/ElementPlusFormTemplate.vue';

// Metadata
export { elementPlusMetadata, extendMetadata } from '@/metadata';
export type { ElementPlusFieldProperties, ElementPlusValueTypes } from '@/metadata';

// Re-export types from core for convenience
export type {
  FieldMetadata,
  GetDynamicFormSettingsType,
  GetMetadataType,
  MetadataConfiguration,
} from '@bach.software/vue-dynamic-form';
