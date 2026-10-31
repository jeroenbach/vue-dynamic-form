import { isNotNullOrUndefined } from '@/utils/isNullOrUndefined';

/**
 * Removes all null value's from object properties and array's.
 *
 * Note: an empty-object or empty-array `presenceValue` marker on a choice branch is stripped
 * back to `undefined` by this cleanup, same as any other empty object/array; use a non-empty
 * marker if the branch's selection must survive this round-trip.
 * @param element any value
 */
export function removeNullValues<T>(element: T): T | undefined {
  if (element === null || element === undefined) {
    return element;
  }

  if (Array.isArray(element)) {
    const items = element.map(removeNullValues).filter(isNotNullOrUndefined);
    return items.length ? (items as T) : undefined;
  }

  if (typeof element === 'object') {
    const entries = Object.entries(element)
      .map(([key, value]) => [key, removeNullValues(value)])
      .filter(([_, value]) => isNotNullOrUndefined(value))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    return Object.entries(entries).length ? (entries as T) : undefined;
  }

  return element;
}
