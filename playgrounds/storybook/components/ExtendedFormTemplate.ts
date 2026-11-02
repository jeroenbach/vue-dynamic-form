import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import { extendMetadata } from '@bach.software/vue-dynamic-form-starter';

/** The starter catalogue plus a project-specific multi-line "textarea" and star "rating" type. */
export const extendedMetadata = extendMetadata<
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

export type ExtendedMetadata = GetMetadataType<typeof extendedMetadata>;
