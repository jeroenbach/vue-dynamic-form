/**
 * Sets a value at a nested path within an object.
 * Based on vee-validate's internal setInPath implementation.
 * Creates intermediate objects/arrays as needed.
 *
 * @param object - The object to modify
 * @param path - Dot-separated path (e.g., "user.address.city") or with array notation (e.g., "items[0].name")
 * @param value - The value to set at the path
 */
export function setInPath(
  object: Record<string, any>,
  path: string,
  value: unknown,
): void {
  // Handle simple non-nested paths
  if (!path.includes('.') && !path.includes('[')) {
    object[path] = value;
    return;
  }

  // Split path by dots or array brackets
  const keys = path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let acc: Record<string, unknown> = object;

  for (let i = 0; i < keys.length; i++) {
    // If this is the last key, set the value
    if (i === keys.length - 1) {
      acc[keys[i]] = value;
      return;
    }

    // Create intermediate object or array if it doesn't exist
    if (!(keys[i] in acc) || acc[keys[i]] === null || acc[keys[i]] === undefined) {
      // Next key is a number? Create array, otherwise object
      const nextKey = keys[i + 1];
      acc[keys[i]] = /^\d+$/.test(nextKey) ? [] : {};
    }

    acc = acc[keys[i]] as Record<string, unknown>;
  }
}
