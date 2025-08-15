/**
 * Creates metadata based on your configuration.
 * @param fieldTypes an array of fields that you would like to define. (Note: you can't use 'input' or 'children', they're reserved)
 * @param extendedProperties extra properties that you would like to include in your metadata
 * @returns a metadata object that can be passed to the DynamicFormTemplate component
 */
export function defineMetadata<
  ExtendedProperties extends object,
  const FieldTypes extends readonly string[],
>(fieldTypes: FieldTypes, extendedProperties: ExtendedProperties) {
  const exclude = ['text', 'input', 'children', 'choice', 'array'] as const;
  const include = ['text'] as const;
  type FieldTypeMetadata
    = | Exclude<(typeof fieldTypes)[number], (typeof exclude)[number]>
      | (typeof include)[number];
  const excludeSet = new Set<string>(exclude);
  const filtered = [
    ...include,
    ...fieldTypes.filter(v => !excludeSet.has(v)),
  ];

  return {
    fieldTypes: filtered as unknown as readonly FieldTypeMetadata[],
    extendedProperties,
  };
}
