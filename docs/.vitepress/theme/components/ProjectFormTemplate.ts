import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';
import { extendMetadata } from '@bach.software/vue-dynamic-form-starter';

// #region metadata-configuration
/**
 * The starter catalogue plus the field types this project needs:
 * a multi-line `textarea` and a star `rating`.
 */
export const projectMetadata = extendMetadata<
  {
    textarea: string
    rating: number
  },
  {
    /** Visible rows of the textarea control. */
    rows?: number
    /** Highest selectable rating. */
    maxRating?: number
  }
>();

export type Metadata = GetMetadataType<typeof projectMetadata>;
export type Settings = GetDynamicFormSettingsType<typeof projectMetadata>;
// #endregion metadata-configuration
