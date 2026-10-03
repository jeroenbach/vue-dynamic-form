import type { Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { ref } from 'vue';
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';

interface MountInputOptions {
  value?: unknown
  fieldMetadata?: Record<string, unknown>
  disabled?: boolean
  required?: boolean
  props?: Record<string, unknown>
  slots?: Record<string, string | ((props: any) => any)>
}

/** Mounts the template with the attributes the engine passes for one field. */
export function mountInput(type: string, options: MountInputOptions = {}) {
  const value: Ref<unknown> = ref(options.value);
  const handleChange = vi.fn((next: unknown) => {
    value.value = next;
  });

  const wrapper = mount(ElementPlusFormTemplate, {
    props: options.props as any,
    attrs: {
      type,
      fieldMetadata: { name: 'field', path: 'field', ...options.fieldMetadata },
      fieldContext: { value, handleChange, errorMessage: ref<string | undefined>() },
      disabled: options.disabled ?? false,
      required: options.required ?? false,
      settings: {},
      slotProps: {},
    },
    slots: options.slots as any,
  });

  return { wrapper, value, handleChange };
}
