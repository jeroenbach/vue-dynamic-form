import type { FieldValidationMetaInfo } from '@/types/ValidationMessage';
import { describe, expect, it } from 'vitest';
import '@/core/validation'; // registers all xsd_* rules
import { createValidation } from '@/utils/createValidation';

function ctx(overrides: Partial<FieldValidationMetaInfo> = {}): FieldValidationMetaInfo {
  return {
    field: 'My Field',
    value: '',
    form: {},
    rule: undefined,
    ...overrides,
  } as FieldValidationMetaInfo;
}

describe('createValidation', () => {
  it('returns true when the rule passes', async () => {
    const validate = createValidation('xsd_required');
    expect(await validate('hello', ctx())).toBe(true);
  });

  it('returns the vee-validate error message when the rule fails and no custom message is provided', async () => {
    const validate = createValidation('xsd_required');
    const result = await validate('', ctx());
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  describe('custom message', () => {
    it('returns a custom string message when the rule fails', async () => {
      const validate = createValidation('xsd_required', undefined, 'This field is required');
      expect(await validate('', ctx())).toBe('This field is required');
    });

    it('returns a custom function message when the rule fails', async () => {
      const validate = createValidation('xsd_required', undefined, (c) => `${c.field} is required`);
      expect(await validate('', ctx())).toBe('My Field is required');
    });

    it('does not use the custom message when the rule passes', async () => {
      const validate = createValidation('xsd_required', undefined, 'This field is required');
      expect(await validate('hello', ctx())).toBe(true);
    });

    describe('positional param {0} in custom message', () => {
      it('replaces {0} with the param value', async () => {
        const validate = createValidation('xsd_minLength', 5, 'Min length is {0}');
        expect(await validate('hi', ctx())).toBe('Min length is 5');
      });
    });

    describe('named param in custom message', () => {
      it('replaces {length} with the param value for xsd_minLength', async () => {
        const validate = createValidation('xsd_minLength', 5, 'Min length is {length}');
        expect(await validate('hi', ctx())).toBe('Min length is 5');
      });

      it('replaces {min} with the param value for xsd_minInclusive', async () => {
        const validate = createValidation('xsd_minInclusive', 10, 'Min value is {min}');
        expect(await validate('5', ctx())).toBe('Min value is 10');
      });

      it('replaces {max} with the param value for xsd_maxInclusive', async () => {
        const validate = createValidation('xsd_maxInclusive', 10, 'Max value is {max}');
        expect(await validate('15', ctx())).toBe('Max value is 10');
      });
    });
  });
});
