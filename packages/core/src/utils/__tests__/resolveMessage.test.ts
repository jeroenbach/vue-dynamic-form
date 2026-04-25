import type { FieldValidationMetaInfo } from '@/types/ValidationMessage';
import { describe, expect, it } from 'vitest';
import { resolveMessage } from '@/utils/resolveMessage';

function ctx(overrides: Partial<FieldValidationMetaInfo> = {}): FieldValidationMetaInfo {
  return {
    field: 'My Field',
    value: 'someValue',
    form: {},
    rule: undefined,
    ...overrides,
  } as FieldValidationMetaInfo;
}

describe('resolveMessage', () => {
  describe('function message', () => {
    it('calls the function with ctx and returns the result', () => {
      const message = (c: FieldValidationMetaInfo) => `${c.field} is invalid`;
      expect(resolveMessage(message, ctx())).toBe('My Field is invalid');
    });
  });

  describe('string message', () => {
    it('returns the string as-is when no placeholders', () => {
      expect(resolveMessage('This field is required', ctx())).toBe('This field is required');
    });

    it('replaces {field} with ctx.field', () => {
      expect(resolveMessage('The {field} is required', ctx())).toBe('The My Field is required');
    });

    it('replaces {value} with ctx.value', () => {
      expect(resolveMessage('{value} is not allowed', ctx())).toBe('someValue is not allowed');
    });

    it('leaves unknown placeholders intact', () => {
      expect(resolveMessage('Error: {unknown}', ctx())).toBe('Error: {unknown}');
    });

    describe('positional params — {0}, {1}', () => {
      it('uses params override when provided', () => {
        expect(resolveMessage('Min is {0}', ctx(), [5])).toBe('Min is 5');
      });

      it('uses ctx.rule.params as fallback when no override', () => {
        expect(resolveMessage('Min is {0}', ctx({ rule: { name: 'min', params: [5] } }))).toBe('Min is 5');
      });

      it('params override takes precedence over ctx.rule.params', () => {
        expect(resolveMessage('Min is {0}', ctx({ rule: { name: 'min', params: [99] } }), [5])).toBe('Min is 5');
      });

      it('supports multiple positional params', () => {
        expect(resolveMessage('{0} to {1}', ctx(), [1, 10])).toBe('1 to 10');
      });

      it('leaves {0} intact when no params available', () => {
        expect(resolveMessage('Min is {0}', ctx())).toBe('Min is {0}');
      });
    });

    describe('named params — {min}, {max}', () => {
      it('replaces named params from ctx.rule.params object', () => {
        expect(resolveMessage('Min is {min}', ctx({ rule: { name: 'min', params: { min: 3 } } }))).toBe('Min is 3');
      });

      it('leaves named param intact when ctx.rule.params is an array', () => {
        expect(resolveMessage('Min is {min}', ctx({ rule: { name: 'min', params: [3] } }))).toBe('Min is {min}');
      });

      it('leaves named param intact when no rule params', () => {
        expect(resolveMessage('Min is {min}', ctx())).toBe('Min is {min}');
      });
    });
  });
});
