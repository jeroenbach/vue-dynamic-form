/**
 * Checks whether a field path falls at or under a section path.
 * Matches the section itself, `section.child`, and `section[0]`, but not
 * unrelated paths that happen to share a prefix string (e.g. `addressLine` vs `address`).
 *
 * @param path - Dot-notated field path (e.g. `'address.street'` or `'contacts[0].email'`)
 * @param sectionPath - Dot-notated path prefix (e.g. `'address'` or `'contacts[0]'`)
 */
export function isPathInSection(path: string, sectionPath: string): boolean {
  return path === sectionPath
    || path.startsWith(`${sectionPath}.`)
    || path.startsWith(`${sectionPath}[`);
}
