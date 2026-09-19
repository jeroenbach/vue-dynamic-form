import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { deepCloneValue } from '../deepCloneValue';

describe('deepCloneValue', () => {
  it('returns primitives and null/undefined as-is', () => {
    expect(deepCloneValue('hello')).toBe('hello');
    expect(deepCloneValue(42)).toBe(42);
    expect(deepCloneValue(true)).toBe(true);
    expect(deepCloneValue(null)).toBeNull();
    expect(deepCloneValue(undefined)).toBeUndefined();
  });

  it('deep-clones nested objects and arrays without sharing references', () => {
    const original = { a: { b: [1, 2, { c: 'x' }] } };
    const clone = deepCloneValue(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.a).not.toBe(original.a);
    expect(clone.a.b).not.toBe(original.a.b);
    expect(clone.a.b[2]).not.toBe(original.a.b[2]);
  });

  it('clones Date values into new Date instances', () => {
    const original = { when: new Date('2026-01-15T10:00:00Z') };
    const clone = deepCloneValue(original);

    expect(clone.when).toBeInstanceOf(Date);
    expect(clone.when.getTime()).toBe(original.when.getTime());
    expect(clone.when).not.toBe(original.when);
  });

  it('clones a Vue reactive Proxy into plain data (where structuredClone would throw)', () => {
    const original = reactive({ street: 'Main Street 1', nested: { city: 'Amsterdam' } });

    expect(() => structuredClone(original)).toThrow();

    const clone = deepCloneValue(original);
    expect(clone).toEqual({ street: 'Main Street 1', nested: { city: 'Amsterdam' } });
    expect(() => structuredClone(clone)).not.toThrow();
  });
});
