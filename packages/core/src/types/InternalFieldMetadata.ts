import type { FieldMetadata } from '@/types/FieldMetadata.js';
import type { RequireOnly } from '@/types/RequireOnly.js';

export type InternalFieldMetadata<Metadata extends FieldMetadata> = RequireOnly<
  Metadata,
  'name' | 'type' | 'minOccurs' | 'maxOccurs'
> & {
  /**
   * Internal hash computed by the system to track meaningful changes to the computed field.
   * Do not set this manually — it is overwritten after every computedProps run.
   */
  _hash?: string
};
