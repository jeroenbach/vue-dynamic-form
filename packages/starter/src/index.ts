// The one shipped stylesheet; compiled to plain CSS and exported as the `./style.css` subpath.
import '@/style.scss';

// Standalone extras, used directly by consumer demo pages as well as by the wizard review page
export { default as AppButton } from '@/AppButton.vue';
export type { Props as AppButtonProps } from '@/AppButton.vue';
export { default as ChoiceArraySectionCard } from '@/ChoiceArraySectionCard.vue';
export type { ChoiceOption } from '@/ChoiceSectionCard.vue';
export { starterIconNames } from '@/icons';
export type { StarterIconName } from '@/icons';
// Metadata
export { extendMetadata, starterMetadata } from '@/metadata';
export type { GridColumnCount, Responsive, StarterFieldProperties, StarterValueTypes } from '@/metadata';
export { default as ReviewGroup } from '@/ReviewGroup.vue';
export type { Props as ReviewGroupProps } from '@/ReviewGroup.vue';
// Template
export { default as StarterFormTemplate } from '@/StarterFormTemplate.vue';
// Icon primitive
export { default as StarterIcon } from '@/StarterIcon.vue';
export { default as SubmissionSuccess } from '@/SubmissionSuccess.vue';
export type { TimelineItem } from '@/SubmissionSuccess.vue';

// Re-export types from core for convenience
export type {
  FieldMetadata,
  GetDynamicFormSettingsType,
  GetMetadataType,
  MetadataConfiguration,
} from '@bach.software/vue-dynamic-form';
