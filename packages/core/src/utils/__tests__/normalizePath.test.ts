import { describe, expect, it } from 'vitest';
import {
  normalizePath,
} from '@/utils/normalizePath';

describe('normalizePath', () => {
  it('should convert to the correct paths', () => {
    expect(normalizePath('this.is["value"].my.path.and.more')).toBe(
      'this.is.value.my.path.and.more',
    );
    expect(normalizePath('this.is[\'value\'].my.path.and.more')).toBe(
      'this.is.value.my.path.and.more',
    );
    expect(normalizePath('this.is[`value`].my.path.and.more')).toBe(
      'this.is.value.my.path.and.more',
    );
    expect(
      normalizePath('this.is[`value`][0][`anotherValue`].my.path.and.more'),
    ).toBe('this.is.value[0].anotherValue.my.path.and.more');

    expect(normalizePath('this.is[`another\'sValue`].my.path.and.more')).toBe(
      'this.is.another\'sValue.my.path.and.more',
    );
  });
});
