/**
 * Helps you to create a metadata configuration with strongly-typed field definitions.
 * Field value types are directly inferred from the provided type interface.
 *
 * Simply pass an interface where keys are field names and values are the expected value types.
 * Use `never` for fields that don't hold values (like headings).
 * Note: you can't use the following reserved field names: 'input', 'children', 'choice', 'array'.
 *
 * Use the extended properties to add custom metadata to each field definition. *
 * @returns Typed configuration object for DynamicFormTemplate consumption
 *
 * @example
 * const config = defineMetadata<
 *   {
 *     text: string;
 *     checkbox: boolean;
 *     age: number;
 *     address: { street: string; city: string };
 *     heading: never;
 *   },
 *   {
 *     // This will add a label and options property to each field's metadata
 *     label?: string;
 *     options?: Array<{ key: string; value: string }>;
 *   }
 * >();
 */
export function defineMetadata<
  const FieldValueTypes extends Record<string, any>,
  ExtendedFieldProperties extends object,
>() {
  // Reserved field identifiers that cannot be defined by the user
  type ExcludedFields = 'input' | 'children' | 'choice' | 'array';
  type IncludeFields = 'default';

  type FieldTypeMetadata
    = | Exclude<keyof FieldValueTypes, ExcludedFields>
      | IncludeFields;

  // Value types are directly from the generic parameter, default is always included and always a string
  type ValueTypeMap = FieldValueTypes & {
    default: string
  };

  return {
    fieldTypes: Object.keys({} as FieldValueTypes) as unknown as readonly FieldTypeMetadata[],
    extendedProperties: {} as ExtendedFieldProperties,
    valueTypes: {} as ValueTypeMap,
  };
}
