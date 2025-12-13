import { describe, expect, it } from 'vitest';
import {
  checkTreeHasValue,
} from '@/utils/checkTreeHasValue';

describe('checkTreeHasValue', () => {
  it('should check an entire tree correctly for values', () => {
    expect(checkTreeHasValue({})).toBeFalsy();
    expect(checkTreeHasValue([])).toBeFalsy();
    expect(checkTreeHasValue('')).toBeTruthy();
    expect(checkTreeHasValue(1)).toBeTruthy();
    expect(checkTreeHasValue([{ test: '' }])).toBeTruthy();
    expect(checkTreeHasValue([{ test: ['test'] }])).toBeTruthy();
    expect(checkTreeHasValue({ test: [''] })).toBeTruthy();
    expect(checkTreeHasValue([null])).toBeFalsy();
    expect(checkTreeHasValue([undefined])).toBeFalsy();
    expect(checkTreeHasValue({ test: null })).toBeFalsy();
    expect(
      checkTreeHasValue({ test: undefined, a: [{ d: undefined }] }),
    ).toBeFalsy();
  });
});
