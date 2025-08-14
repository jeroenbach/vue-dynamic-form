import type { WatchSource } from "vue";

export type FieldMetadata<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = {},
> = {
  name?: string;
  type?: ExtendedFieldTypes;
  path?: string;
  minOccurs?: number;
  maxOccurs?: number;
  children?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[];
  /**
   * The parent of the current field.
   */
  parent?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>;
  /**
   * You can add methods that transform the field metadata based on other external values.
   * Make sure to include the reactive value's in your function, so that the function is re-evaluated once
   * the value changes (internally we use a computed that is re-valuated when one of the used reactive values is changed).
   * This way we can for example change the property minOccurs to 1 (required) if another field has a value or change one of the ExtendedAttributes.
   *
   * @param thisField the reactive & cloned current MetadataField that can be changed.
   * @returns A transformed FieldMetadata
   */
  transformReactively?: ((
    thisField: Omit<
      FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
      'children' // Not allowed to change the children of this field, create a transform for those fields specifically
    >,
    fieldValue?: WatchSource<any>,
  ) => Omit<
    FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
    'children'
  >)[];
} & ExtendedProperties;

export type MetadataConfiguration = {
  fieldTypes: readonly string[];
  extendedProperties: object;
};

export type GetMetadataType<T extends MetadataConfiguration> = FieldMetadata<T['fieldTypes'][number], T['extendedProperties']>;

/**
 * Creates metadata based on your configuration. 
 * @param fieldTypes an array of fields that you would like to define. (Note: you can't use 'input' or 'children', they're reserved)
 * @param extendedProperties extra properties that you would like to include in your metadata
 * @returns 
 */
export function defineMetadata<ExtendedProperties extends object, const FieldTypes extends readonly string[]>(fieldTypes: FieldTypes, extendedProperties: ExtendedProperties){
  type FieldTypeMetadata = Exclude<typeof fieldTypes[number], 'input' | 'children'>;
  const exclude = new Set(['input', 'children']);
  const filtered = fieldTypes.filter(v => !exclude.has(v));
  
  return {
    fieldTypes: filtered as unknown as readonly FieldTypeMetadata[],
    extendedProperties,
  };
}
