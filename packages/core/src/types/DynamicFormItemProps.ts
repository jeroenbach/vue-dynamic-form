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
      input?: ((props: object) => any) | undefined
      children?: ((props: object) => any) | undefined
      attributes?: ((props: object) => any) | undefined
      choice?: ((props: object) => any) | undefined
      array?: ((props: object) => any) | undefined
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
  templateAttrs?: object
}
