/**
 * Creates a typed metadata configuration for use with `DynamicFormTemplate`.
 *
 * The returned object is a pure type carrier — its runtime values are empty stubs.
 * TypeScript uses it to infer slot names, `fieldContext.value` types, extended field properties,
 * and the shape of `slotProps`. A `default` field type is always injected automatically.
 *
 * @typeParam FieldValueTypes - Map of field type names to their `fieldContext.value` types.
 *   Use `never` for display-only types (headings, separators) that hold no value.
 * @typeParam ExtendedFieldProperties - Extra properties merged into every `FieldMetadata` object.
 * @typeParam SlotProperties - Shape of `slotProps` passed from parent slots to child slots.
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
  ExtendedFieldProperties extends object = object,
  SlotProperties extends object = object,
>() {
  type IncludeFields = 'default';

  type FieldTypeMetadata
    = | keyof FieldValueTypes
      | IncludeFields;

  // Value types are directly from the generic parameter, default is always included and always a string
  type ValueTypeMap = FieldValueTypes & {
    default: string
  };

  return {
    fieldTypes: Object.keys({} as FieldValueTypes) as unknown as readonly FieldTypeMetadata[],
    extendedProperties: {} as ExtendedFieldProperties,
    slotProperties: {} as SlotProperties,
    valueTypes: {} as ValueTypeMap,
  };
}
