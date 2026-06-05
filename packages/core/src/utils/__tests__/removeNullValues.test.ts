import { describe, expect, it } from 'vitest';
import { removeNullValues } from '@/utils/removeNullValues';

describe('removeNullValues', () => {
  it('returns null as-is', () => {
    expect(removeNullValues(null)).toBe(null);
  });

  it('returns undefined as-is', () => {
    expect(removeNullValues(undefined)).toBe(undefined);
  });

  it('returns primitive values unchanged', () => {
    expect(removeNullValues(0)).toBe(0);
    expect(removeNullValues('')).toBe('');
    expect(removeNullValues(false)).toBe(false);
    expect(removeNullValues('hello')).toBe('hello');
    expect(removeNullValues(42)).toBe(42);
  });

  describe('objects', () => {
    it('removes null properties', () => {
      expect(removeNullValues({ a: 1, b: null })).toEqual({ a: 1 });
    });

    it('removes undefined properties', () => {
      expect(removeNullValues({ a: 1, b: undefined })).toEqual({ a: 1 });
    });

    it('keeps falsy but non-null properties', () => {
      expect(removeNullValues({ a: 0, b: false, c: '' })).toEqual({ a: 0, b: false, c: '' });
    });

    it('returns undefined when all properties are null or undefined', () => {
      expect(removeNullValues({ a: null, b: undefined })).toBe(undefined);
    });

    it('recursively removes null values from nested objects', () => {
      expect(removeNullValues({ a: { b: null, c: 1 } })).toEqual({ a: { c: 1 } });
    });

    it('removes a property when its nested object becomes empty after cleaning', () => {
      expect(removeNullValues({ a: { b: null } })).toBe(undefined);
    });
  });

  describe('arrays', () => {
    it('filters out null elements', () => {
      expect(removeNullValues([1, null, 2])).toEqual([1, 2]);
    });

    it('filters out undefined elements', () => {
      expect(removeNullValues([1, undefined, 2])).toEqual([1, 2]);
    });

    it('keeps falsy but non-null elements', () => {
      expect(removeNullValues([0, false, ''])).toEqual([0, false, '']);
    });

    it('returns undefined when all elements are null or undefined', () => {
      expect(removeNullValues([null, undefined])).toBe(undefined);
    });

    it('recursively cleans objects inside arrays', () => {
      expect(removeNullValues([{ a: 1, b: null }, { a: null }])).toEqual([{ a: 1 }]);
    });

    it('filters out array elements that become empty objects after cleaning', () => {
      expect(removeNullValues([{ a: null }, { b: null }])).toBe(undefined);
    });
  });
});
