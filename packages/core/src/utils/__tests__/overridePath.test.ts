import { describe, expect, it } from 'vitest';
import {
  overridePath,
} from '@/utils/overridePath';

describe('overridePath', () => {
  it('should convert to the correct paths', () => {
    // @ts-expect-error testing invalid values
    expect(overridePath(undefined, '')).toBe(undefined);
    // @ts-expect-error testing invalid values
    expect(overridePath(null, '')).toBe(null);
    expect(overridePath('', undefined)).toBe('');
    // @ts-expect-error testing invalid values
    expect(overridePath('', null)).toBe('');
    expect(overridePath('', '')).toBe('');
    expect(overridePath('this.is.my.path', '')).toBe('this.is.my.path');
    expect(overridePath('this.is.my.path', 'this.is.your')).toBe(
      'this.is.your.path',
    );
    expect(overridePath('this.is.my.path', 'this.is[0]')).toBe(
      'this.is[0].my.path',
    );
    expect(
      overridePath('this.is.my.path', 'this.is[0].my.path.and.more'),
    ).toBe('this.is[0].my.path.and.more');
  });
});
