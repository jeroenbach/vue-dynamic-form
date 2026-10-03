import { max, max_value, min, min_value, one_of, regex } from '@vee-validate/rules';
import { defineRule } from 'vee-validate';
import { checkTreeHasValue } from '@/utils/checkTreeHasValue';

export { resolveMessage } from '@/utils/resolveMessage';

/**
 * XSD-derived rule names registered globally via vee-validate's `defineRule`, plus one
 * non-XSD occurrence extension (`vdf_maxOccursTotal`, a per-branch choice cap with no XSD
 * equivalent). Every name is prefixed (`xsd_` or `vdf_`): `defineRule` is a last-write-wins
 * global registry shared with the consuming app, so an unprefixed name could silently
 * collide with a consumer-defined rule.
 */
export type ValidationRule = 'xsd_required'
  | 'xsd_minOccurs'
  | 'xsd_maxOccurs'
  | 'xsd_choiceMinOccurs'
  | 'xsd_choiceMaxOccurs'
  | 'vdf_maxOccursTotal'
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

// XSD: required — null/undefined/empty string are invalid; false is a valid boolean value
defineRule('xsd_required' as ValidationRule, (value: unknown) => value !== null && value !== undefined && value !== '');

// XSD: minOccurs — minimum number of array items that have a value
defineRule('xsd_minOccurs' as ValidationRule, (value: unknown, [min]: [number]) => {
  if (!Array.isArray(value))
    return Number(min) <= 0;
  return value.filter(checkTreeHasValue).length >= Number(min);
});

// XSD: maxOccurs: maximum number of raw array items, including empty placeholders.
// Counts the same quantity the array's own "add" affordance limits, not the filled count
// xsd_minOccurs uses, so the rule and the UI cap never disagree.
defineRule('xsd_maxOccurs' as ValidationRule, (value: unknown, [max]: [number]) => {
  if (!Array.isArray(value))
    return true;
  return value.length <= Number(max);
});

// A choice field has no entry in the vee-validate value tree, so its rules cannot inspect a
// value: the real comparison lives in the choice component's guard, which only pushes the rule
// once it has already failed. The rule itself must therefore always fail.
const failChoiceRule = () => false;

// XSD: choiceMinOccurs: minimum number of choice items that have a value
defineRule('xsd_choiceMinOccurs' as ValidationRule, failChoiceRule);

// XSD: choiceMaxOccurs: maximum number of choice-occurrence units in use
defineRule('xsd_choiceMaxOccurs' as ValidationRule, failChoiceRule);

// Non-XSD: a choice branch's own opt-in cap on its raw occurrence count, aggregated and
// reported at the choice level
defineRule('vdf_maxOccursTotal' as ValidationRule, failChoiceRule);

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
  xsd_maxOccurs: 'max',
  xsd_choiceMinOccurs: 'min',
  xsd_choiceMaxOccurs: 'max',
  vdf_maxOccursTotal: 'max',
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
