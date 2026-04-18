import type { FieldMetadata } from '@/types/FieldMetadata.js';
import type { RequireOnly } from '@/types/RequireOnly.js';

export type InternalFieldMetadata<Metadata extends FieldMetadata> = RequireOnly<
  Metadata,
  'name' | 'type' | 'minOccurs' | 'maxOccurs'
>;
