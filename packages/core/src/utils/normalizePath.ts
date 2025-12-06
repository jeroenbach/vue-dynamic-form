/**
 * Helper function that converts a path with bracket notation to a dot notation.
 * When adding an extra path segment, we do this by using the bracket notation, i.e.: person['value'].
 * 
 * Vee-validate can't work with this notation, therefore this function fixes those cases.
 *
 * const actualPath = normalizePath(
 *  'this.is["added"].to.my.path.and.more',
 * )
 *
 * console.log(actualPath) // 'this.is.added.to.my.path.and.more'
 *
 * @param path to be normalized
 */
export const normalizePath = (path: string) =>
  path?.replaceAll(/\[[`'"](.*?)[`'"]\]/g, '.$1') ?? '';
