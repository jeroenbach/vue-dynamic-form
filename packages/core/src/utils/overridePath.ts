/**
 * Merges two dot-notation paths by replacing leading segments of the base path
 * with segments from the replacement path. Useful for resolving array indices
 * in nested field paths where parent context contains array positions.
 *
 * @example
 * // Given a generic path and an indexed parent path, produce the indexed child path
 * const result = overridePath(
 *  'data.users.contact.email',
 *  'data.users[2]'
 * )
 *
 * console.log(result) // 'data.users[2].contact.email'
 *
 * @param path Base path string to be modified
 * @param overrideWithPath Replacement path that will substitute initial segments
 * @returns Modified path with replaced segments
 */
export const overridePath = (path: string, overrideWithPath: string | undefined) => {
  if (!path || !overrideWithPath) return path;

  // Split both paths and substitute leading segments from the replacement path
  const parentSegments = overrideWithPath.split('.') ?? [];
  const childSegments = path.split('.') ?? [];
  for (let index = 0; index < parentSegments.length; index++) {
    childSegments[index] = parentSegments[index];
  }
  return childSegments.join('.');
};
