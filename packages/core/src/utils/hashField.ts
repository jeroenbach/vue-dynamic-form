import type { FieldMetadata } from '@/types/FieldMetadata';

/**
 * Creates a deterministic hash of all mutable field properties (those that computedProps can change).
 * Excludes structural/immutable properties: name, path, children, choice, attributes,
 * fieldOptions, computedProps, maxOccurs, parent, and _hash itself.
 */
export function hashField(field: FieldMetadata): string {
  const {
    name: _name,
    path: _path,
    children: _children,
    choice: _choice,
    attributes: _attributes,
    fieldOptions: _fieldOptions,
    computedProps: _computedProps,
    maxOccurs: _maxOccurs,
    _hash: _prevHash,
    parent: _parent,
    isComplexType: _isComplexType,
    computeOnChildValueChange: _computeOnChildValueChange,
    ...mutableProps
  } = field as any;

  const sorted = Object.fromEntries(
    Object.entries(mutableProps).sort(([a], [b]) => a.localeCompare(b)),
  );
  return JSON.stringify(sorted);
}
