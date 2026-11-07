import type { DynamicFormTemplateComponent } from '@bach.software/vue-dynamic-form';
import type { Component } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import StarterFormTemplate from '@/StarterFormTemplate.vue';

interface MountInFormOptions {
  metadata: unknown
  template?: DynamicFormTemplateComponent
  settings?: Record<string, unknown>
  initialValues?: Record<string, unknown>
  stubs?: Record<string, Component>
  slots?: Record<string, (props: any) => any>
}

/** Mounts a form that renders the given template, exposing the form values and validation. */
export async function mountInForm({ metadata, template = StarterFormTemplate, settings, initialValues, stubs, slots }: MountInFormOptions) {
  const Host = defineComponent({
    setup(_, { expose }) {
      const form = useDynamicForm({ initialValues });
      expose({ values: form.values, validate: form.validate, setFieldValue: form.setFieldValue, resetForm: form.resetForm, resetField: form.resetField });
      return () => h(DynamicForm, { metadata: metadata as any, template, settings }, slots as any);
    },
  });

  const wrapper = mount(Host, { attachTo: document.body, global: { stubs } });
  await flushPromises();

  const exposed = wrapper.vm as unknown as {
    values: Record<string, any>
    validate: () => Promise<unknown>
    setFieldValue: (path: string, value: unknown) => void
    resetForm: (...args: unknown[]) => void
    resetField: (path: string, ...args: unknown[]) => void
  };
  return {
    wrapper,
    values: () => exposed.values,
    validate: () => exposed.validate(),
    setFieldValue: (path: string, value: unknown) => exposed.setFieldValue(path, value),
    resetForm: (...args: unknown[]) => exposed.resetForm(...args),
    resetField: (path: string, ...args: unknown[]) => exposed.resetField(path, ...args),
  };
}
