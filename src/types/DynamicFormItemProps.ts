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
  field: InternalMetadata
}
