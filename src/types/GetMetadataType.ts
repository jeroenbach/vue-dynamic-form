import type { FieldMetadata } from '@/types/FieldMetadata';
import type { MetadataConfiguration } from '@/types/MetadataConfiguration';

export type GetMetadataType<T extends MetadataConfiguration> = FieldMetadata<
  T['fieldTypes'][number],
  T['extendedProperties']
>;
