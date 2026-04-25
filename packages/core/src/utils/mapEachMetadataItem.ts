import type { FieldMetadata } from '@/types/FieldMetadata';

/**
 * Recursively walks a `FieldMetadata` tree (visiting `children` and `choice`) and applies
 * `callbackFunc` to every node, returning the transformed tree.
 *
 * The callback receives a shallow clone of each node, so mutations inside the callback do not
 * affect the original metadata. `children` and `choice` on the returned node are replaced with
 * the recursively-mapped results after the callback runs.
 */
export function mapEachMetadataItem<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = object,
>(
  metadata: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
  callbackFunc: (item: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>) => FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
): FieldMetadata<ExtendedFieldTypes, ExtendedProperties> {
  if (!metadata || !callbackFunc)
    return metadata;

  metadata = callbackFunc?.({ ...metadata });
  metadata.children = metadata?.children?.map(x => mapEachMetadataItem(x, callbackFunc));
  metadata.choice = metadata?.choice?.map(x => mapEachMetadataItem(x, callbackFunc));
  return metadata;
}
