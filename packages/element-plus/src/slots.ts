import type { DynamicFormTemplate, MetadataConfiguration } from '@bach.software/vue-dynamic-form';

type TemplateSlots<TMetadataConfiguration extends MetadataConfiguration>
  = NonNullable<ReturnType<typeof DynamicFormTemplate<TMetadataConfiguration>>['__ctx']>['slots'];

/**
 * The slots of `ElementPlusFormTemplate`: every slot the dispatcher understands, scoped by the metadata
 * configuration, plus the two reserved names that carry the engine's field and attribute render.
 */
export type ElementPlusFormTemplateSlots<TMetadataConfiguration extends MetadataConfiguration>
  = TemplateSlots<TMetadataConfiguration>
    & {
      input: (props: any) => any
      attributes: (props: any) => any
    }
    & Record<string, (props: any) => any>;
