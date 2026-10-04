import type { Slots, VNodeChild } from 'vue';
import { defineComponent, h } from 'vue';
import StarterFormTemplate from '@/StarterFormTemplate.vue';

type Override = (scope: any, wrapperSlots: Slots) => VNodeChild;

interface ConsumerWrapperOptions {
  metadataConfiguration?: unknown
  overrides?: Record<string, Override>
  forwardInput?: boolean
  icon?: (props: { name: string, size: number, strokeWidth: number }) => VNodeChild
}

/** A render-function twin of the documented wrapper: forwards the engine renders and adds the given overrides. */
export function createConsumerWrapper({
  metadataConfiguration,
  overrides = {},
  forwardInput = true,
  icon,
}: ConsumerWrapperOptions = {}) {
  return defineComponent({
    name: 'ConsumerWrapper',
    setup: (_, { slots }) => () => {
      const slotFunctions: Record<string, (scope: any) => VNodeChild> = {};
      if (forwardInput)
        slotFunctions.input = scope => slots.default?.(scope);
      if (icon)
        slotFunctions.icon = scope => icon(scope);
      for (const [name, override] of Object.entries(overrides))
        slotFunctions[name] = scope => override(scope, slots);

      return h(StarterFormTemplate as any, { metadataConfiguration }, slotFunctions);
    },
  });
}
