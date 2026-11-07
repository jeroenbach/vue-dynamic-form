import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { extendMetadata } from '@bach.software/vue-dynamic-form-starter';

// #region metadata-configuration
/**
 * The starter catalogue plus the field types this project needs:
 * a slider `range` and a star `rating`.
 */
export const projectMetadata = extendMetadata<
  {
    range: string
    rating: number
  },
  {
    /** Lowest selectable value of the range control. */
    min?: number
    /** Highest selectable value of the range control. */
    max?: number
    /** Step size of the range control. */
    step?: number
    /** Highest selectable rating. */
    maxRating?: number
  }
>();

export type Metadata = GetMetadataType<typeof projectMetadata>;
export type Settings = GetDynamicFormSettingsType<typeof projectMetadata>;
// #endregion metadata-configuration
