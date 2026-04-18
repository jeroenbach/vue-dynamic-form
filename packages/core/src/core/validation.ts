import { max, max_value, min, min_value, one_of, regex, required } from '@vee-validate/rules';
import { defineRule } from 'vee-validate';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';

export { resolveMessage } from '@/utils/resolveMessage';

export type ValidationRule = 'xsd_required'
  | 'xsd_minOccurs'
  | 'xsd_choiceMinOccurs'
  | 'xsd_minLength'
  | 'xsd_maxLength'
  | 'xsd_pattern'
  | 'xsd_minInclusive'
  | 'xsd_maxInclusive'
  | 'xsd_minExclusive'
  | 'xsd_maxExclusive'
  | 'xsd_enumeration'
  | 'xsd_length'
  | 'xsd_whiteSpace'
  | 'xsd_fractionDigits'
  | 'xsd_totalDigits';

// XSD: required
defineRule('xsd_required' as ValidationRule, required);

// XSD: minOccurs — minimum number of array items that have a value
defineRule('xsd_minOccurs' as ValidationRule, (value: unknown, [min]: [number]) => {
  if (!Array.isArray(value))
    return true;
  return value.filter(checkTreeHasValue).length >= Number(min);
});

// XSD: choiceMinOccurs — minimum number of choice items that have a value
defineRule('xsd_choiceMinOccurs' as ValidationRule, () => {
  // As we can't actually validate a choice field (it doesn't exist in the vee-validate value tree)
  // we always validate false if this validation is added.
  return false;
});

// XSD: minLength / maxLength — maps to vee-validate's min/max (string length)
defineRule('xsd_minLength' as ValidationRule, min);
defineRule('xsd_maxLength' as ValidationRule, max);

// XSD: length — exact string length
defineRule('xsd_length' as ValidationRule, (value: unknown, [length]: [number]) => {
  if (value === null || value === undefined || value === '')
    return true;
  return String(value).length === Number(length);
});

// XSD: pattern — maps to vee-validate's regex
defineRule('xsd_pattern' as ValidationRule, regex);

// XSD: minInclusive / maxInclusive (value >= min, value <= max)
defineRule('xsd_minInclusive' as ValidationRule, min_value);
defineRule('xsd_maxInclusive' as ValidationRule, max_value);

// XSD: minExclusive / maxExclusive (value > min, value < max)
defineRule('xsd_minExclusive' as ValidationRule, (value: unknown, [min]: [number]) => {
  if (value === null || value === undefined || value === '')
    return true;
  return Number(value) > Number(min);
});
defineRule('xsd_maxExclusive' as ValidationRule, (value: unknown, [max]: [number]) => {
  if (value === null || value === undefined || value === '')
    return true;
  return Number(value) < Number(max);
});

// XSD: enumeration — maps to vee-validate's one_of
defineRule('xsd_enumeration' as ValidationRule, one_of);

// XSD: whiteSpace — validates the value conforms to the given whitespace mode
// Modes: 'preserve' (no restriction), 'replace' (no tabs/newlines), 'collapse' (no leading/trailing/multiple spaces)
defineRule('xsd_whiteSpace' as ValidationRule, (value: unknown, [mode]: [string]) => {
  if (value === null || value === undefined || value === '')
    return true;
  const str = String(value);
  if (mode === 'replace')
    return !/[\t\n\r]/.test(str);
  if (mode === 'collapse')
    return str === str.trim() && !/\s{2,}/.test(str);
  return true; // 'preserve' — no restriction
});

// XSD: fractionDigits — maximum number of decimal places
defineRule('xsd_fractionDigits' as ValidationRule, (value: unknown, [digits]: [number]) => {
  if (value === null || value === undefined || value === '')
    return true;
  const decimalIndex = String(value).indexOf('.');
  if (decimalIndex === -1)
    return true;
  return String(value).length - decimalIndex - 1 <= Number(digits);
});

// XSD: totalDigits — maximum total number of significant digits (excluding sign and decimal point)
defineRule('xsd_totalDigits' as ValidationRule, (value: unknown, [digits]: [number]) => {
  if (value === null || value === undefined || value === '')
    return true;
  const significant = String(value).replace(/^-/, '').replace('.', '').replace(/^0+/, '') || '0';
  return significant.length <= Number(digits);
});

/**
 * Maps each rule to its semantic parameter name, enabling named placeholder
 * interpolation (e.g. `{length}`, `{min}`) alongside positional `{0}` in messages.
 */
export const ruleParamNames: Partial<Record<ValidationRule, string>> = {
  xsd_minOccurs: 'min',
  xsd_choiceMinOccurs: 'min',
  xsd_minLength: 'length',
  xsd_maxLength: 'length',
  xsd_length: 'length',
  xsd_pattern: 'pattern',
  xsd_minInclusive: 'min',
  xsd_maxInclusive: 'max',
  xsd_minExclusive: 'min',
  xsd_maxExclusive: 'max',
  xsd_whiteSpace: 'mode',
  xsd_fractionDigits: 'digits',
  xsd_totalDigits: 'digits',
};
