import type { FieldMetadata } from './FieldMetadata.js';
import type { RequireOnly } from './RequireOnly.js';

export type InternalFieldMetadata<Metadata extends FieldMetadata> = RequireOnly<
  Metadata,
  'name' | 'type' | 'minOccurs' | 'maxOccurs'
>;
