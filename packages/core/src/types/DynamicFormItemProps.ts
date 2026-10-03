import type { DefineComponent } from 'vue';
import type { FieldMetadata } from '@/types/FieldMetadata';
import type { InternalFieldMetadata } from '@/types/InternalFieldMetadata';

export interface DynamicFormItemProps<
  InternalMetadata extends InternalFieldMetadata<FieldMetadata>,
> {
  template: DefineComponent<
    object,
    object,
    {
      default?: ((props: object) => any)
      attributes?: ((props: object) => any)
    }
  >
  fieldMetadata: InternalMetadata
  /**
   * In case a parent can occur multiple times, its path will have an index in it.
   * This needs to be passed to the child items so they can adjust their own path accordingly.
   *
   * Example scenario:
   * - field.path = root.collections.item.nested.deepItems
   * - pathOverride = root.collections[3]
   * - Result: root.collections[3].item.nested.deepItems
   * Full path specification is unnecessary; partial override suffices.
   */
  pathOverride?: string
  /**
   * Runtime adjustment of minimum occurrence constraint for this field.
   * Controls requirement level: 0 makes optional, 1 enforces presence, higher values demand repetition.
   *
   * For example: Conditional sections where child validation activates only after
   * user interaction with any descendant field.
   */
  minOccursOverride?: number
  /**
   * Runtime adjustment of maximum occurrence constraint for this field.
   * Values exceeding 1 transform the field into a repeatable collection with multiple instances.
   *
   * For example: Within choice groups, disable add button when any option
   * reaches the shared occurrence limit.
   */
  maxOccursOverride?: number
  /**
   * In case this field is part of a array field, it needs to co-operate with that array field and
   * mark all children optional if no value has been filled in.
   */
  partOfArrayField?: boolean
  /**
   * In case this field is one of the parent's `attributes`, it is conditionally mounted based on
   * whether the parent has a value. This marks it so unmount cleanup can tell it apart from a
   * regular field and consult `attributeOwnerHasValue` before deciding whether to clear it.
   */
  partOfAttributeField?: boolean
  /**
   * For an item marked `partOfAttributeField`, a getter that reports whether the owning field
   * currently has a main value. Called at unmount time: when it returns false, the attribute's
   * value is cleared regardless of `keepValuesOnUnmount`/`keepValueOnUnmount`, since it belongs
   * to a value that is itself gone; when it returns true, the attribute follows the same keep
   * flags as any other field.
   */
  attributeOwnerHasValue?: () => boolean
  /**
   * In case this field is part of a choice field, it needs to co-operate with that choice field and
   * behave differently in some situations.
   */
  partOfChoiceField?: boolean
  /**
   * We check the maxOccurs to see if the field is an Array. If we want to override this, we can do so with this property.
   * In case the field is a child of a choice field, it needs to be made repeatable and we can set this to true.
   */
  isArrayOverride?: 'auto' | 'array' | 'single'

  /**
   * In case this item is a single occurrence of a repeatable explicit choice branch
   * (`DynamicFormItemChoice`, `maxOccurs > 1`), the branch (choice child) `name` it belongs to.
   * When set, it drives the `-choice-array-item` slot type suffix (mirroring `partOfArrayField`'s
   * `-array-item` suffix) and is forwarded to the slot as `branchKey`.
   */
  branchKey?: string

  /**
   * In case this item is a single occurrence of a repeatable explicit choice branch
   * (`DynamicFormItemChoice`, `maxOccurs > 1`), this occurrence's zero-based position across
   * every branch's active occurrences (not just its own branch). Forwarded to the slot as
   * `globalIndex`. `undefined` everywhere else.
   */
  globalIndex?: number

  /**
   * In case this item is a single occurrence of a repeatable explicit choice branch
   * (`DynamicFormItemChoice`, `maxOccurs > 1`), the instance-local, ephemeral position at which
   * this occurrence was added this session (1-based, in add-press order across every branch).
   * `undefined` for an occurrence that existed before this session (loaded saved data) or that
   * was never added through `addChoiceOccurrence`. Forwarded to the slot as `insertionOrder`;
   * never written to form values.
   */
  insertionOrder?: number

  /**
   * In case this item is part of a field array, we need some extra info
   */
  index?: number
  canAddItems?: boolean
  canRemoveItems?: boolean
  addItem?: () => void
  removeItem?: (index?: number) => void

  /**
   * You can provide additional attributes to the slots in your template. They will be passed to the
   * component below.
   */
  slotProps?: object
}
