import type { Component } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import StarterFormTemplate from '@/StarterFormTemplate.vue';

interface MountInFormOptions {
  metadata: unknown
  template?: Component
  settings?: Record<string, unknown>
  initialValues?: Record<string, unknown>
  stubs?: Record<string, Component>
  slots?: Record<string, (props: any) => any>
}

/** Mounts a form that renders the given template, exposing the form values and validation. */
export async function mountInForm({ metadata, template = StarterFormTemplate as unknown as Component, settings, initialValues, stubs, slots }: MountInFormOptions) {
  const Host = defineComponent({
    setup(_, { expose }) {
      const form = useDynamicForm({ initialValues });
      expose({ values: form.values, validate: form.validate });
      return () => h(DynamicForm, { metadata: metadata as any, template: template as any, settings }, slots as any);
    },
  });

  const wrapper = mount(Host, { attachTo: document.body, global: { stubs } });
  await flushPromises();

  const exposed = wrapper.vm as unknown as { values: Record<string, any>, validate: () => Promise<unknown> };
  return {
    wrapper,
    values: () => exposed.values,
    validate: () => exposed.validate(),
  };
}
