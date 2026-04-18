import { validate } from 'vee-validate';
import { describe, expect, it } from 'vitest';
import '@/core/validation';

async function passes(value: unknown, rule: string, params: unknown[] = []): Promise<boolean> {
  const result = await validate(value, { [rule]: params.length ? params : true } as never);
  return result.valid;
}

describe('validation rules', () => {
  describe('xsd_required', () => {
    it('passes for a non-empty string', async () => {
      expect(await passes('hello', 'xsd_required')).toBe(true);
    });
    it('fails for an empty string', async () => {
      expect(await passes('', 'xsd_required')).toBe(false);
    });
    it('fails for undefined', async () => {
      expect(await passes(undefined, 'xsd_required')).toBe(false);
    });
  });

  describe('xsd_minOccurs', () => {
    it('passes when filled item count equals min', async () => {
      expect(await passes(['a', 'b'], 'xsd_minOccurs', [2])).toBe(true);
    });
    it('passes when filled item count exceeds min', async () => {
      expect(await passes(['a', 'b', 'c'], 'xsd_minOccurs', [2])).toBe(true);
    });
    it('fails when filled item count is below min', async () => {
      expect(await passes(['a'], 'xsd_minOccurs', [2])).toBe(false);
    });
    it('does not count null items', async () => {
      expect(await passes([null, null], 'xsd_minOccurs', [1])).toBe(false);
    });
    it('does not count undefined items', async () => {
      expect(await passes([undefined, 'a'], 'xsd_minOccurs', [2])).toBe(false);
    });
    it('does not count empty object items', async () => {
      expect(await passes([{ value: null }, 'a'], 'xsd_minOccurs', [2])).toBe(false);
    });
    it('passes for a non-array value', async () => {
      expect(await passes('not-an-array', 'xsd_minOccurs', [1])).toBe(true);
    });
  });

  describe('xsd_minLength', () => {
    it('passes when length equals min', async () => {
      expect(await passes('abc', 'xsd_minLength', [3])).toBe(true);
    });
    it('passes when length exceeds min', async () => {
      expect(await passes('abcde', 'xsd_minLength', [3])).toBe(true);
    });
    it('fails when length is below min', async () => {
      expect(await passes('ab', 'xsd_minLength', [3])).toBe(false);
    });
    it('passes for empty string (presence is enforced separately by xsd_required)', async () => {
      expect(await passes('', 'xsd_minLength', [3])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_minLength', [3])).toBe(true);
    });
  });

  describe('xsd_maxLength', () => {
    it('passes when length equals max', async () => {
      expect(await passes('abc', 'xsd_maxLength', [3])).toBe(true);
    });
    it('passes when length is below max', async () => {
      expect(await passes('ab', 'xsd_maxLength', [3])).toBe(true);
    });
    it('fails when length exceeds max', async () => {
      expect(await passes('abcd', 'xsd_maxLength', [3])).toBe(false);
    });
  });

  describe('xsd_length', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_length', [5])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_length', [5])).toBe(true);
    });
    it('passes for undefined', async () => {
      expect(await passes(undefined, 'xsd_length', [5])).toBe(true);
    });
    it('passes when length matches exactly', async () => {
      expect(await passes('hello', 'xsd_length', [5])).toBe(true);
    });
    it('fails when length is too short', async () => {
      expect(await passes('hi', 'xsd_length', [5])).toBe(false);
    });
    it('fails when length is too long', async () => {
      expect(await passes('hello world', 'xsd_length', [5])).toBe(false);
    });
  });

  describe('xsd_pattern', () => {
    it('passes when value matches the pattern', async () => {
      expect(await passes('123', 'xsd_pattern', [/^\d+$/])).toBe(true);
    });
    it('fails when value does not match the pattern', async () => {
      expect(await passes('abc', 'xsd_pattern', [/^\d+$/])).toBe(false);
    });
    it('passes for empty string (presence is enforced separately by xsd_required)', async () => {
      expect(await passes('', 'xsd_pattern', [/^\d+$/])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_pattern', [/^\d+$/])).toBe(true);
    });
  });

  describe('xsd_minInclusive', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_minInclusive', [5])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_minInclusive', [5])).toBe(true);
    });
    it('passes when value equals min', async () => {
      expect(await passes(5, 'xsd_minInclusive', [5])).toBe(true);
    });
    it('passes when value exceeds min', async () => {
      expect(await passes(6, 'xsd_minInclusive', [5])).toBe(true);
    });
    it('fails when value is below min', async () => {
      expect(await passes(4, 'xsd_minInclusive', [5])).toBe(false);
    });
  });

  describe('xsd_maxInclusive', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_maxInclusive', [10])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_maxInclusive', [10])).toBe(true);
    });
    it('passes when value equals max', async () => {
      expect(await passes(10, 'xsd_maxInclusive', [10])).toBe(true);
    });
    it('passes when value is below max', async () => {
      expect(await passes(9, 'xsd_maxInclusive', [10])).toBe(true);
    });
    it('fails when value exceeds max', async () => {
      expect(await passes(11, 'xsd_maxInclusive', [10])).toBe(false);
    });
  });

  describe('xsd_minExclusive', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_minExclusive', [5])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_minExclusive', [5])).toBe(true);
    });
    it('passes when value is above min', async () => {
      expect(await passes(6, 'xsd_minExclusive', [5])).toBe(true);
    });
    it('fails when value equals min (exclusive)', async () => {
      expect(await passes(5, 'xsd_minExclusive', [5])).toBe(false);
    });
    it('fails when value is below min', async () => {
      expect(await passes(4, 'xsd_minExclusive', [5])).toBe(false);
    });
  });

  describe('xsd_maxExclusive', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_maxExclusive', [10])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_maxExclusive', [10])).toBe(true);
    });
    it('passes when value is below max', async () => {
      expect(await passes(9, 'xsd_maxExclusive', [10])).toBe(true);
    });
    it('fails when value equals max (exclusive)', async () => {
      expect(await passes(10, 'xsd_maxExclusive', [10])).toBe(false);
    });
    it('fails when value exceeds max', async () => {
      expect(await passes(11, 'xsd_maxExclusive', [10])).toBe(false);
    });
  });

  describe('xsd_enumeration', () => {
    it('passes when value is in the list', async () => {
      expect(await passes('b', 'xsd_enumeration', ['a', 'b', 'c'])).toBe(true);
    });
    it('fails when value is not in the list', async () => {
      expect(await passes('d', 'xsd_enumeration', ['a', 'b', 'c'])).toBe(false);
    });
    it('passes for empty string (presence is enforced separately by xsd_required)', async () => {
      expect(await passes('', 'xsd_enumeration', ['a', 'b', 'c'])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_enumeration', ['a', 'b', 'c'])).toBe(true);
    });
  });

  describe('xsd_whiteSpace', () => {
    describe('preserve', () => {
      it('passes any value including tabs and newlines', async () => {
        expect(await passes('hello\tworld\n', 'xsd_whiteSpace', ['preserve'])).toBe(true);
      });
      it('passes for empty string', async () => {
        expect(await passes('', 'xsd_whiteSpace', ['preserve'])).toBe(true);
      });
    });

    describe('replace', () => {
      it('passes when value has no tabs or newlines', async () => {
        expect(await passes('hello world', 'xsd_whiteSpace', ['replace'])).toBe(true);
      });
      it('fails when value contains a tab', async () => {
        expect(await passes('hello\tworld', 'xsd_whiteSpace', ['replace'])).toBe(false);
      });
      it('fails when value contains a newline', async () => {
        expect(await passes('hello\nworld', 'xsd_whiteSpace', ['replace'])).toBe(false);
      });
      it('fails when value contains a carriage return', async () => {
        expect(await passes('hello\rworld', 'xsd_whiteSpace', ['replace'])).toBe(false);
      });
      it('passes for empty string', async () => {
        expect(await passes('', 'xsd_whiteSpace', ['replace'])).toBe(true);
      });
    });

    describe('collapse', () => {
      it('passes when value is already collapsed', async () => {
        expect(await passes('hello world', 'xsd_whiteSpace', ['collapse'])).toBe(true);
      });
      it('fails when value has leading spaces', async () => {
        expect(await passes(' hello', 'xsd_whiteSpace', ['collapse'])).toBe(false);
      });
      it('fails when value has trailing spaces', async () => {
        expect(await passes('hello ', 'xsd_whiteSpace', ['collapse'])).toBe(false);
      });
      it('fails when value has consecutive spaces', async () => {
        expect(await passes('hello  world', 'xsd_whiteSpace', ['collapse'])).toBe(false);
      });
      it('passes for empty string', async () => {
        expect(await passes('', 'xsd_whiteSpace', ['collapse'])).toBe(true);
      });
    });
  });

  describe('xsd_fractionDigits', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_fractionDigits', [2])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_fractionDigits', [2])).toBe(true);
    });
    it('passes for integer (no decimal point)', async () => {
      expect(await passes('42', 'xsd_fractionDigits', [2])).toBe(true);
    });
    it('passes when fraction digits are within the limit', async () => {
      expect(await passes('3.14', 'xsd_fractionDigits', [2])).toBe(true);
    });
    it('passes when fraction digits equal the limit', async () => {
      expect(await passes('3.14', 'xsd_fractionDigits', [2])).toBe(true);
    });
    it('fails when fraction digits exceed the limit', async () => {
      expect(await passes('3.141', 'xsd_fractionDigits', [2])).toBe(false);
    });
  });

  describe('xsd_totalDigits', () => {
    it('passes for empty string', async () => {
      expect(await passes('', 'xsd_totalDigits', [4])).toBe(true);
    });
    it('passes for null', async () => {
      expect(await passes(null, 'xsd_totalDigits', [4])).toBe(true);
    });
    it('passes when total digits are within the limit', async () => {
      expect(await passes('123', 'xsd_totalDigits', [4])).toBe(true);
    });
    it('passes when total digits equal the limit', async () => {
      expect(await passes('1234', 'xsd_totalDigits', [4])).toBe(true);
    });
    it('fails when total digits exceed the limit', async () => {
      expect(await passes('12345', 'xsd_totalDigits', [4])).toBe(false);
    });
    it('ignores the sign when counting digits', async () => {
      expect(await passes('-123', 'xsd_totalDigits', [3])).toBe(true);
    });
    it('ignores the decimal point when counting digits', async () => {
      expect(await passes('12.34', 'xsd_totalDigits', [4])).toBe(true);
    });
    it('ignores leading zeros when counting digits', async () => {
      expect(await passes('0042', 'xsd_totalDigits', [2])).toBe(true);
    });
  });
});
