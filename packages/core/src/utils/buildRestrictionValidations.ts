import type { GenericValidateFunction } from 'vee-validate';
import type { DynamicFormSettings } from '@/types/DynamicFormSettings';
import type { FieldMetadata } from '@/types/FieldMetadata';
import { createValidation } from '@/utils/createValidation';
import { splitToValidationFunctions } from '@/utils/splitValidationFunctions';

/**
 * Builds the XSD restriction rules plus any custom validation declared directly on a field,
 * shared by every place that registers a vee-validate field for that metadata (a plain field, or
 * a choice-hosting field whose own restriction/validation is folded into its nested choice).
 * Required/minOccurs is intentionally not part of this: it is a separate concern each caller
 * decides for itself.
 */
export function buildRestrictionValidations(
  restriction: FieldMetadata['restriction'] | undefined,
  validation: FieldMetadata['validation'],
  messages: DynamicFormSettings['messages'] | undefined,
): GenericValidateFunction[] {
  const _restriction = restriction ?? {};
  const _validations: GenericValidateFunction[] = [];

  if (_restriction.minLength != null)
    _validations.push(createValidation('xsd_minLength', _restriction.minLength, messages?.minLength));

  if (_restriction.maxLength != null)
    _validations.push(createValidation('xsd_maxLength', _restriction.maxLength, messages?.maxLength));

  if (_restriction.length != null)
    _validations.push(createValidation('xsd_length', _restriction.length, messages?.length));

  if (_restriction.pattern != null)
    _validations.push(createValidation('xsd_pattern', _restriction.pattern, messages?.pattern));

  if (_restriction.minInclusive != null)
    _validations.push(createValidation('xsd_minInclusive', _restriction.minInclusive, messages?.minInclusive));

  if (_restriction.maxInclusive != null)
    _validations.push(createValidation('xsd_maxInclusive', _restriction.maxInclusive, messages?.maxInclusive));

  if (_restriction.minExclusive != null)
    _validations.push(createValidation('xsd_minExclusive', _restriction.minExclusive, messages?.minExclusive));

  if (_restriction.maxExclusive != null)
    _validations.push(createValidation('xsd_maxExclusive', _restriction.maxExclusive, messages?.maxExclusive));

  if (_restriction.enumeration != null)
    _validations.push(createValidation('xsd_enumeration', _restriction.enumeration, messages?.enumeration));

  if (_restriction.whiteSpace != null)
    _validations.push(createValidation('xsd_whiteSpace', _restriction.whiteSpace, messages?.whiteSpace));

  if (_restriction.fractionDigits != null)
    _validations.push(createValidation('xsd_fractionDigits', _restriction.fractionDigits, messages?.fractionDigits));

  if (_restriction.totalDigits != null)
    _validations.push(createValidation('xsd_totalDigits', _restriction.totalDigits, messages?.totalDigits));

  if (validation)
    _validations.push(...splitToValidationFunctions(validation));

  return _validations;
}
