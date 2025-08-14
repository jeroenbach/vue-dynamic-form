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
  /**
   * Simple restrictions to the data
   */
  restrictions?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    minInclusive?: number;
    maxInclusive?: number;
    enumeration?: string;
    length?: number;
    whiteSpace?: string;
    fractionDigits?: number;
    totalDigits?: number;
  };
  children?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[];
  /**
   * Choice is similar to children, with the difference that only one of the items in the array 
   * needs to be present. If you combine this with minOccurs, you can for example create a form where
   * only the email or phone number is required.
   * 
   * This is inspired by the choice element in xsd (XML Schema Definition), for example:
   * 
   * ```xml
   * <?xml version="1.0" encoding="UTF-8"?>
   * <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
   *
   *   <xs:element name="ContactInfo">
   *     <xs:complexType>
   *       <xs:choice>
   *         <xs:element name="Email" type="xs:string"/>
   *         <xs:element name="Phone" type="xs:string"/>
   *         <xs:element name="Fax" type="xs:string"/>
   *       </xs:choice>
   *     </xs:complexType>
   *   </xs:element>
   * 
   * </xs:schema>
   * ```
   * 
   * This will allow the following xml options
   * ```xml
   * <ContactInfo>
   *   <Email>someone@example.com</Email>
   * </ContactInfo>
   * or
   * <ContactInfo>
   *   <Phone>+31 123 456 789</Phone>
   * </ContactInfo>
   *
   * but this is invalid:
   * <ContactInfo>
   * </ContactInfo>
   * 
   * ```
   * 
   */
  choice?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[];

  /**
   * Attributes are additional metadata that can be attached to a field.
   * These attributes can be used to provide extra information about the field,
   * such as for example whether the data is verified.
   * 
   * These attributes will be shown when the parent will have a value filled in. 
   *
   * For example:
   * ```
   * <ContactInfo>
   *   <Phone certainty="unverified">+31 123 456 789</Phone>
   * </ContactInfo>
   * or
   * <ContactInfo>
   *   <Phone certainty="verified">+31 123 456 789</Phone>
   * </ContactInfo>
   * ```
   */
  attributes?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[];
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
       'name'    // At this point name will always be present
      // Not allowed to change the children, choice or attributes of this field, create a transform for those fields specifically 
      |'children'  
      | 'choice'  
      | 'attributes'
    > & {
      name: string;
    },
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
  const exclude = ['input', 'children', 'choice', 'array'] as const;
  type FieldTypeMetadata = Exclude<typeof fieldTypes[number], (typeof exclude)[number]>;
  const excludeSet = new Set<string>(exclude);
  const filtered = fieldTypes.filter(v => !excludeSet.has(v));

  return {
    fieldTypes: filtered as unknown as readonly FieldTypeMetadata[],
    extendedProperties,
  };
}
