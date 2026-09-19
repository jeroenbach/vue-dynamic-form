/**
 * Deep-clones a form value tree (plain objects, arrays, Dates and primitives) into plain,
 * non-reactive data.
 *
 * Exists because `structuredClone` cannot be used on values read from the vee-validate form
 * context: those are Vue reactive Proxies (any branch value that is an object, i.e. a node with
 * `children`), and `structuredClone` throws a `DataCloneError` on a Proxy. Recursively copying
 * by property instead reads *through* the proxy, so the clone comes out raw.
 */
export function deepCloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object')
    return value;

  if (value instanceof Date)
    return new Date(value.getTime()) as T;

  if (Array.isArray(value))
    return value.map(item => deepCloneValue(item)) as T;

  const clone: Record<string, unknown> = {};
  for (const key of Object.keys(value))
    clone[key] = deepCloneValue((value as Record<string, unknown>)[key]);

  return clone as T;
}
