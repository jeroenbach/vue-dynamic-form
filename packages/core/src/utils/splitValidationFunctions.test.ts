import { validate } from 'vee-validate';
import { describe, expect, it, vi } from 'vitest';
import { splitToValidationFunctions } from '@/utils/splitValidationFunctions';

vi.mock('vee-validate', () => ({
  validate: vi.fn(async (_value: unknown, rules: unknown) => {
    // Simulate a failing rule when the rule key/string is 'fail'
    const ruleKey = typeof rules === 'string' ? rules : Object.keys(rules as object)[0];
    if (ruleKey === 'fail')
      return { valid: false, errors: [`${ruleKey} failed`] };
    return { valid: true, errors: [] };
  }),
}));

const mockValidate = vi.mocked(validate);

describe('splitToValidationFunctions', () => {
  describe('falsy input', () => {
    it('returns empty array for undefined', () => {
      expect(splitToValidationFunctions(undefined)).toEqual([]);
    });
  });

  describe('function input', () => {
    it('wraps a single function in an array', () => {
      const fn = vi.fn();
      const result = splitToValidationFunctions(fn);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(fn);
    });
  });

  describe('array input', () => {
    it('flattens an array of functions into individual functions', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const result = splitToValidationFunctions([fn1, fn2]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(fn1);
      expect(result[1]).toBe(fn2);
    });
  });

  describe('string input', () => {
    it('returns one function for a single rule', () => {
      const result = splitToValidationFunctions('required');
      expect(result).toHaveLength(1);
    });

    it('splits pipe-separated rules into separate functions', () => {
      const result = splitToValidationFunctions('required|email|min');
      expect(result).toHaveLength(3);
    });

    it('returns true when rule passes', async () => {
      const [fn] = splitToValidationFunctions('required');
      expect(await fn('value', {} as never)).toBe(true);
    });

    it('returns error message when rule fails', async () => {
      const [fn] = splitToValidationFunctions('fail');
      expect(await fn('value', {} as never)).toBe('fail failed');
    });

    it('runs each split rule independently', async () => {
      const [pass, fail] = splitToValidationFunctions('required|fail');
      expect(await pass('value', {} as never)).toBe(true);
      expect(await fail('value', {} as never)).toBe('fail failed');
    });

    it('passes rule parameters intact to validate', async () => {
      mockValidate.mockClear();
      const [fn] = splitToValidationFunctions('min:3');
      await fn('value', {} as never);
      expect(mockValidate).toHaveBeenCalledWith('value', 'min:3', undefined);
    });

    it('passes each rule with its parameters as a separate call', async () => {
      mockValidate.mockClear();
      const [min, max] = splitToValidationFunctions('min:3|max:10');
      await min('value', {} as never);
      await max('value', {} as never);
      expect(mockValidate).toHaveBeenCalledWith('value', 'min:3', undefined);
      expect(mockValidate).toHaveBeenCalledWith('value', 'max:10', undefined);
    });
  });

  describe('object input', () => {
    it('returns one function per rule key', () => {
      const result = splitToValidationFunctions({ required: true, email: true });
      expect(result).toHaveLength(2);
    });

    it('returns true when rule passes', async () => {
      const [fn] = splitToValidationFunctions({ required: true });
      expect(await fn('value', {} as never)).toBe(true);
    });

    it('returns error message when rule fails', async () => {
      const [fn] = splitToValidationFunctions({ fail: true });
      expect(await fn('value', {} as never)).toBe('fail failed');
    });

    it('runs each rule independently', async () => {
      const [pass, fail] = splitToValidationFunctions({ required: true, fail: true });
      expect(await pass('value', {} as never)).toBe(true);
      expect(await fail('value', {} as never)).toBe('fail failed');
    });
  });
});
