/**
 * Recursively traverses a data structure to determine if it holds any meaningful data.
 * Returns false only when the entire structure consists of null/undefined values.
 * Particularly useful for validation frameworks to detect populated form fields.
 *
 * @param element Data structure to analyze (supports primitives, objects, arrays)
 * @returns Boolean indicating presence of non-nullish values
 */
export const checkTreeHasValue = (element: unknown): boolean => {
  if (element === null || element === undefined) {
    return false;
  }

  if (Array.isArray(element)) {
    return element.some((value: unknown) => checkTreeHasValue(value));
  }
  if (typeof element === 'object') {
    return Object.values(element).some((value: unknown) => checkTreeHasValue(value));
  }

  return true;
};
