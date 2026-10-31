import { describe, expect, it } from 'vitest';
import { deepEqual } from '../deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('compares equal primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
    });

    it('compares different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual(0, false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual(undefined, 0)).toBe(false);
    });

    it('treats NaN as equal to NaN', () => {
      expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
      expect(deepEqual(Number.NaN, 1)).toBe(false);
    });
  });

  describe('objects', () => {
    it('compares rebuilt objects with the same values as equal', () => {
      expect(deepEqual({ minLength: 2, pattern: 'a+' }, { minLength: 2, pattern: 'a+' })).toBe(true);
    });

    it('ignores key order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('detects changed, added and removed keys', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('does not treat different keys with undefined values as equal', () => {
      expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false);
      expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true);
    });

    it('compares nested objects recursively', () => {
      expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
      expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false);
    });

    it('compares empty objects as equal', () => {
      expect(deepEqual({}, {})).toBe(true);
    });
  });

  describe('arrays', () => {
    it('compares arrays item by item', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('respects item order', () => {
      expect(deepEqual([1, 2], [2, 1])).toBe(false);
    });

    it('compares arrays of objects recursively', () => {
      expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });

    it('does not treat an array and an object alike', () => {
      expect(deepEqual([], {})).toBe(false);
      expect(deepEqual({ 0: 'a', length: 1 }, ['a'])).toBe(false);
    });
  });

  describe('dates', () => {
    it('compares Dates by time value', () => {
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(true);
      expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(false);
    });

    it('does not treat a Date and a plain object alike', () => {
      expect(deepEqual(new Date('2024-01-01'), {})).toBe(false);
    });
  });

  describe('functions and other references', () => {
    it('compares functions by reference only', () => {
      const fn = () => true;
      expect(deepEqual(fn, fn)).toBe(true);
      expect(deepEqual(() => true, () => true)).toBe(false);
    });

    it('compares functions nested in objects and arrays by reference', () => {
      const fn = () => true;
      expect(deepEqual({ validation: fn }, { validation: fn })).toBe(true);
      expect(deepEqual([fn], [fn])).toBe(true);
      expect(deepEqual({ validation: () => true }, { validation: () => true })).toBe(false);
    });
  });
});
