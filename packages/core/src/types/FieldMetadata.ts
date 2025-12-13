import type { RuleExpression } from 'vee-validate';
import type { WatchSource } from 'vue';

export type FieldMetadata<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = object,
> = {
  name?: string
  type?: ExtendedFieldTypes
  path?: string
  minOccurs?: number
  maxOccurs?: number
  /**
   * Simple restrictions to the data: TODO: move to different level and use validation instead
   */
  restrictions?: {
    maxLength?: number
    maxLengthMessage?: string
    minLength?: number
    minLengthMessage?: string
    pattern?: string
    patternMessage?: string
    minInclusive?: number
    minInclusiveMessage?: string
    maxInclusive?: number
    maxInclusiveMessage?: string
    enumeration?: string
    enumerationMessage?: string
    length?: number
    lengthMessage?: string
    whiteSpace?: string
    whiteSpaceMessage?: string
    fractionDigits?: number
    fractionDigitsMessage?: string
    totalDigits?: number
    totalDigitsMessage?: string
  }
  /**
   * Validation rules that should be applied to this field.
   */
  validation?: RuleExpression<unknown>
  children?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[]
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
   * <!-- or -->
   * <ContactInfo>
   *   <Phone>+31 123 456 789</Phone>
   * </ContactInfo>
   *
   * <!-- but this is invalid: -->
   * <ContactInfo>
   * </ContactInfo>
   * ```
   *
   * Or json
   * ```json
   * {
   *  "contactInfo": {
   *     "email": "someone@example.com"
   *  }
   * }
   * <!-- or -->
   * {
   *  "contactInfo": {
   *   "phone": "+31 123 456 789"
   *  }
   * }
   *
   * <!-- but this is invalid: -->
   * {
   * "contactInfo": { }
   * }
   * ```
   *
   */
  choice?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[]

  /**
   * Attributes are additional metadata that can be attached to a field.
   * These attributes can be used to provide extra information about the field,
   * such as for example whether the data is verified.
   *
   * These attributes will be shown when the parent will have a value filled in.
   * The field automatically becomes a complex type, meaning that the value will be
   * an object containing the value and the attributes.
   *
   * For example:
   * ```
   * <ContactInfo>
   *   <Phone certainty="unverified">+31 123 456 789</Phone>
   * </ContactInfo>
   * <!-- or -->
   * <ContactInfo>
   *   <Phone certainty="verified">+31 123 456 789</Phone>
   * </ContactInfo>
   * ```
   */
  attributes?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>[]

  /**
   * To support generating a form based on a xsd, we need to be able to work with complex types.
   * In case a SimpleContent has a ComplexType as parent, the json converter creates a value object
   * with the value inside i.e. { value: 'the actual value' } and the attributes alongside it.
   *
   * By setting isComplexType to true, the form generator knows it needs to look for the value inside
   * the value property.
   *
   * When attributes are present, isComplexType is automatically set to true.
   */
  isComplexType?: boolean

  /**
   * The parent of the current field.
   */
  parent?: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>

  /**
   * A list of functions that are executed inside a computed. This means that if you have links to computed, refs, etc,
   * these functions will be re-evaluated once one of the used reactive values changes.
   * This way you can create dynamic field metadata that changes based on other values in the form.
   *
   * @param thisField the reactive & cloned current MetadataField that can be changed.
   * @returns A transformed FieldMetadata
   */
  transformReactively?: ((
    thisField: TransformReactivelyType<FieldMetadata<ExtendedFieldTypes, ExtendedProperties>>,
    fieldValue?: WatchSource<unknown>,
  ) => TransformReactivelyType<FieldMetadata<ExtendedFieldTypes, ExtendedProperties>>)[]
  /**
   * To opt-in to having the reactive transformer re-evaluated on value changes, set this to true.
   * This is useful when the transformation logic depends on the current value of the field.
   */
  transformOnValueChange?: boolean
} & ExtendedProperties;

export type TransformReactivelyType<T> = Omit<
      T,
      | 'name' // At this point name will always be present, so remove it
      // Not allowed to change the children, choice or attributes of this field, create a transform for those fields specifically
      | 'children'
      | 'choice'
      | 'attributes'
    > & {
      // Add the name back as required
      name: string
    };
