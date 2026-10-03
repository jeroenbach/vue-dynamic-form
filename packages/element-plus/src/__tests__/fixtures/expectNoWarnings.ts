import { afterEach, beforeEach, expect, vi } from 'vitest';

// Element Plus 2.14 deprecates the radio `label` prop in favour of `value`, which does not exist on the supported floor.
const knownNoise = /\[el-radio\].*label act as value is about to be deprecated/;

/** Fails the surrounding test when Vue or Element Plus logs a warning or error. */
export function expectNoWarnings() {
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    const logged = [...warn.mock.calls, ...error.mock.calls]
      .map(args => args.map(String).join(' '))
      .filter(message => !knownNoise.test(message));
    warn.mockRestore();
    error.mockRestore();
    expect(logged).toEqual([]);
  });
}
