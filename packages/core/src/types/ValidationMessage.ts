import type { GenericValidateFunction } from 'vee-validate';

export type FieldValidationMetaInfo = Parameters<GenericValidateFunction>[1];

export type ValidationMessage = string | ((ctx: FieldValidationMetaInfo) => string);
