/**
 * Compares two values by content instead of by reference. Primitives, plain objects, arrays and
 * Dates are compared recursively; everything else (functions, class instances, Maps, ...) only
 * counts as equal when it is the exact same reference.
 *
 * Mirrors the value scope of `deepCloneValue`. Useful to detect "rebuilt but identical" objects,
 * such as metadata that computedProps functions recreate on every run.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b)
    return true;

  // NaN is the only value that is not === to itself.
  if (Number.isNaN(a) && Number.isNaN(b))
    return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null)
    return false;

  if (a instanceof Date || b instanceof Date)
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();

  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a)
      && Array.isArray(b)
      && a.length === b.length
      && a.every((item, index) => deepEqual(item, b[index]));
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  return aKeys.length === Object.keys(bRecord).length
    && aKeys.every(key => key in bRecord && deepEqual(aRecord[key], bRecord[key]));
}
