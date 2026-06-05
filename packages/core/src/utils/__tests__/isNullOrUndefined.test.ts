import { describe, expect, it } from 'vitest';
import { isNotNullOrUndefined, isNullOrUndefined } from '@/utils/isNullOrUndefined';

describe('isNullOrUndefined', () => {
  it('returns true for null', () => {
    expect(isNullOrUndefined(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isNullOrUndefined(undefined)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(isNullOrUndefined(0)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isNullOrUndefined('')).toBe(false);
  });

  it('returns false for false', () => {
    expect(isNullOrUndefined(false)).toBe(false);
  });

  it('returns false for a non-empty value', () => {
    expect(isNullOrUndefined('hello')).toBe(false);
  });

  it('returns false for an object', () => {
    expect(isNullOrUndefined({})).toBe(false);
  });

  it('returns false for an array', () => {
    expect(isNullOrUndefined([])).toBe(false);
  });
});

describe('isNotNullOrUndefined', () => {
  it('returns false for null', () => {
    expect(isNotNullOrUndefined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNotNullOrUndefined(undefined)).toBe(false);
  });

  it('returns true for 0', () => {
    expect(isNotNullOrUndefined(0)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isNotNullOrUndefined('')).toBe(true);
  });

  it('returns true for false', () => {
    expect(isNotNullOrUndefined(false)).toBe(true);
  });

  it('returns true for a non-empty value', () => {
    expect(isNotNullOrUndefined('hello')).toBe(true);
  });

  it('returns true for an object', () => {
    expect(isNotNullOrUndefined({})).toBe(true);
  });

  it('returns true for an array', () => {
    expect(isNotNullOrUndefined([])).toBe(true);
  });
});
