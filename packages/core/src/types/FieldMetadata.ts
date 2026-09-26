import type { FieldOptions, RuleExpression } from 'vee-validate';
import type { Ref } from 'vue';

export type FieldMetadata<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = object,
> = {
  name?: string
  type?: ExtendedFieldTypes
  path?: string
  /**
   * The minimal occurrence of a value.
   * Optional fields have a value of 0.
   * Required fields have a value of 1.
   * We also allow to specify if you need a minimum higher then 1.
   */
  minOccurs?: number
  /**
   * The maximal occurrence of a value.
   */
  maxOccurs?: number
  /**
   * Controls whether the array automatically pre-fills empty placeholder items up to `minOccurs`
   * when the form is first rendered and the array is still empty.
   *
   * Defaults to `true` — omitting this property has the same effect as setting it to `true`.
   * Set it explicitly to `false` to suppress auto-filling, which is useful when you want the
   * user to explicitly add the first item themselves even though `minOccurs` is 1 or higher.
   *
   * @example
   * // Will NOT auto-add an initial item, even though minOccurs is 1:
   * { name: 'emails', type: 'text', maxOccurs: 5, minOccurs: 1, autoAddMinOccurs: false }
   */
  autoAddMinOccurs?: boolean
  /**
   * Opt-in, non-XSD cap on the total number of raw occurrences a `choice` branch may reach
   * across the whole choice, independent of the occurrence batching `maxOccurs` drives. Only
   * meaningful on a node that is itself an entry inside a `choice` array.
   *
   * Plain `<xs:choice>` has no equivalent: XSD only bounds how many times the choice itself
   * repeats and how many items a single repetition of a branch may hold, never a branch's
   * running total across the whole choice. Use this when a per-kind ceiling ("at most 3 of this
   * kind") is a real requirement layered on top of correct XSD batching.
   *
   * - With `explicitChoiceSelection: true`, the branch's add affordance disables once its own
   *   raw item count reaches this value, regardless of the shared choice budget.
   * - Without it (auto mode), the branch's rendered array headroom is capped at this value even
   *   when the shared choice budget would otherwise allow more.
   *
   * If set lower than `maxOccurs`, the cap simply limits the effective per-iteration reach;
   * this is not validated at runtime, consistent with other metadata combinations.
   *
   * Read from static metadata only: it is excluded from `ComputedPropsFieldType`, so a
   * `computedProps` function cannot flip occurrence capacity mid-form.
   */
  maxOccursTotal?: number
  /**
   * Simple restrictions to the data, these are available in XSD and can be applied easily.
   * For more advance validation use the validation property.
   */
  restriction?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    minInclusive?: number
    maxInclusive?: number
    minExclusive?: number
    maxExclusive?: number
    enumeration?: unknown[]
    length?: number
    whiteSpace?: 'preserve' | 'replace' | 'collapse'
    fractionDigits?: number
    totalDigits?: number
  }
  /**
   * Vee-Validate validation rules that should be applied to this field.
   */
  validation?: RuleExpression<unknown>
  /**
   * The vee-validate field options.
   * - label: you can set a ref to make this dynamically update.
   */
  fieldOptions?: Partial<FieldOptions<unknown>>
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
   * Opt into selection-first rendering for a `choice` node. When true, no branch is shown until
   * the template calls the `-choice` slot's (`-choice-array` for `maxOccurs > 1`)
   * `addChoiceOccurrence(branchKey)`; the engine clears a
   * deselected branch from the form values on switch. When false or omitted (the default), the
   * current value-driven behaviour is unchanged: every branch renders and siblings disable once
   * one holds a value.
   *
   * Has no effect on non-choice nodes. Read from static metadata only: it is excluded from
   * `ComputedPropsFieldType`, so a `computedProps` function cannot flip it at runtime.
   */
  explicitChoiceSelection?: boolean

  /**
   * Opt into preserve-on-switch for a `maxOccurs: 1` explicit choice (only meaningful together
   * with `explicitChoiceSelection: true`). When true, switching away from a branch (calling
   * `addChoiceOccurrence` for a different branch) deep-clones that branch's current values into
   * an ephemeral, instance-local stash before clearing it as usual; switching back to that branch
   * restores the stashed values via `setFieldValue`. The stash is never written to the form
   * `values`, exactly like the selection state itself.
   *
   * When false or omitted (the default), switching clears the branch with nothing preserved,
   * matching the baseline clear-on-switch behaviour.
   *
   * Restored fields start with fresh touched/validation state (as if freshly re-entered), and no
   * error renders immediately after restore even if a required field is still empty.
   *
   * Has no effect on non-choice nodes, on `maxOccurs > 1` explicit choices, or when
   * `explicitChoiceSelection` is not set. Read reactively from the metadata, so it may be
   * flipped live through the metadata prop; it is excluded from `ComputedPropsFieldType`, so
   * the metadata prop (not `computedProps`) is the channel for changing it.
   */
  preserveOnSwitch?: boolean

  /**
   * How a repeatable explicit choice (`explicitChoiceSelection: true`, `maxOccurs > 1`) orders
   * its occurrences on screen:
   *
   * - `'grouped'` (default): grouped by branch, in declaration order.
   * - `'added'`: in the order the user clicked "add", mixing branches. Occurrences from loaded
   *   data render first, in grouped order. This order is display-only and resets on reload;
   *   combine with `preserveOrder` to keep it.
   *
   * May be changed while the form is mounted; the list re-sorts in place. Ignored everywhere
   * else, and not settable from `computedProps`.
   */
  displayOrder?: 'grouped' | 'added'

  /**
   * Stores the add-order of a repeatable explicit choice (`explicitChoiceSelection: true`,
   * `maxOccurs > 1`) in the form values, so it survives a reload: each occurrence gets a
   * numeric `order` field (1..N across all branches, renumbered on removal, normalized at
   * mount for loaded data). Use together with `displayOrder: 'added'`, which then sorts by
   * this field.
   *
   * Note that `order` becomes part of your submitted values, next to the occurrence's own
   * fields. Don't declare a child named `order` yourself; the engine owns that key.
   *
   * Requires every branch to have `children`, since the `order` field needs an object to live
   * in. If any branch is a bare scalar, the flag is ignored for the whole choice, with a
   * warning in development.
   *
   * May be changed while the form is mounted: turning it on adds `order` to the existing
   * occurrences, seeding it from this session's add-order (so an interleaved display keeps the
   * sequence the user built) and from grouped position for occurrences not added this session;
   * turning it off removes it. Ignored everywhere else, and not settable from `computedProps`.
   */
  preserveOrder?: boolean

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
   *
   * In case you need to change the default value property 'value', do this in the DynamicFormSettings.
   */
  isComplexType?: boolean

  /**
   * The parent of the current field.
   * This is purely for reference, these values cannot be updated.
   */
  parent?: Readonly<FieldMetadata<ExtendedFieldTypes, ExtendedProperties>>

  /**
   * Compute field values locally in the component that represents the field.
   *
   * This is a list of functions that are executed inside a computed in the component of the field.
   * This means that if you reference other computed, refs, etc, these functions will be re-evaluated once one of the used reactive values changes.
   *
   * Allowing you to change the properties in the fieldMetadata, based on other values in the form, without re-rendering the entire component tree.
   *
   * It is also possible to read & write
   *
   * @param thisField the reactive & cloned current MetadataField that can be changed.
   * @param fieldValue the value of the field, you can read and modify it. If you do, the reactivity is activated and the computed
   * is re-computed every time the value changes. If you don't use it, a change in value will not re-trigger the reactivity of the computed.
   * @returns A transformed FieldMetadata
   */
  computedProps?: ((
    thisField: ComputedPropsFieldType<ExtendedFieldTypes, ExtendedProperties>,
    fieldValue: Ref<unknown>,
    childFields: Ref<ReadOnlyFieldType<ExtendedFieldTypes, ExtendedProperties>[]>,
  ) => void)[]
  /**
   * Normally the computedProps are not re-calculate if a child value changes. If you need this functionality, you can enable this by
   * setting this property to true.
   */
  computeOnChildValueChange?: boolean
} & ExtendedProperties;

export type ComputedPropsFieldType<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = object,
> = Omit<
      FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
      // Remove name, path and parent and add them as reference only and not to be updated
      | 'name'
      | 'path'
      | 'parent'
      // Not allowed to change the children, choice or attributes of this field, create a transform for those fields specifically
      | 'children'
      | 'choice'
      | 'attributes'
      // Not allowed to update the fieldOptions, as vee-validate doesn't get updated. If the label needs to be updated
      // this can be done by passing a ref
      | 'fieldOptions'
      // Not allowed to update any of the following values, as they're used initially and are not listened to reactively
      | 'computedProps'
      // Changing the maxOccurs changes the item in an array item, this is not allowed. MinOccurs is ok, as it only affects whether
      // the item is required.
      | 'maxOccurs'
      // Same reasoning as maxOccurs: occurrence capacity must not flip mid-form.
      | 'maxOccursTotal'
      // Not allowed to update the following values as they aren't read from the computedField, but the prop field
      | 'isComplexType'
      | 'computeOnChildValueChange'
      // Static metadata only: flipping this via computedProps would change the render mode
      // mid-form (initial flash / mount-unmount storm).
      | 'explicitChoiceSelection'
      // The three ordering flags below are reactive to the metadata prop, but excluded here so
      // the metadata prop stays their one sanctioned channel: a computedProps function runs
      // inside the engine's computed and must not drive behaviour with side effects (order
      // writes, stash lifecycles) from there.
      | 'preserveOnSwitch'
      | 'displayOrder'
      | 'preserveOrder'
    > & Readonly<{
      // Add the name & path back as not optional and Readonly
      name: string
      path: string
      parent: FieldMetadata<ExtendedFieldTypes, ExtendedProperties>
    }>;

export type ReadOnlyFieldType<
  ExtendedFieldTypes extends string = string,
  ExtendedProperties extends object = object,
> = Readonly<Omit<
FieldMetadata<ExtendedFieldTypes, ExtendedProperties>,
| 'name' // At this point name will always be present, so remove it as being optional
| 'path'
| 'children'
| 'choice'
> & {
  // Add the name & path back as not optional and Readonly
  name: string
  path: string
  children: ReadOnlyFieldType<ExtendedFieldTypes, ExtendedProperties>[]
  choice: ReadOnlyFieldType<ExtendedFieldTypes, ExtendedProperties>[]
}>;

export type ComputedPropsFieldOf<T extends FieldMetadata<any, any>>
  = T extends FieldMetadata<infer FT, infer EP> ? ComputedPropsFieldType<FT, EP> : never;

export type ReadOnlyFieldOf<T extends FieldMetadata<any, any>>
  = T extends FieldMetadata<infer FT, infer EP> ? ReadOnlyFieldType<FT, EP> : never;
