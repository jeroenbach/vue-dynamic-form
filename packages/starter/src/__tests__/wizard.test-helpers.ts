import type { VueWrapper } from '@vue/test-utils';
import type { Component } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { defineComponent, h } from 'vue';
import StarterFormTemplate from '@/StarterFormTemplate.vue';

type Wrapper = VueWrapper<any>;

interface MountWizardFormOptions {
  template?: Component
  settings?: Record<string, unknown>
  initialValues?: Record<string, unknown>
}

/** Mounts the engine inside a consumer-owned native form, so the submit button has something to submit. */
export async function mountWizardForm(metadata: unknown, { template = StarterFormTemplate as unknown as Component, settings, initialValues }: MountWizardFormOptions = {}) {
  const onSubmit = vi.fn();
  const Host = defineComponent({
    setup(_, { expose }) {
      const form = useDynamicForm({ initialValues });
      // The path state is vee-validate's private registry of fields; it is not on the public form type.
      const getPathState = (form as unknown as { getPathState: (path: string) => unknown }).getPathState;
      expose({ values: form.values, errors: form.errors, getPathState, validate: form.validate });
      return () => h('form', { onSubmit: (event: Event) => {
        event.preventDefault();
        onSubmit();
      } }, [h(DynamicForm, { metadata: metadata as any, template: template as any, settings })]);
    },
  });

  const wrapper = mount(Host, { attachTo: document.body });
  await flushPromises();

  const exposed = wrapper.vm as unknown as {
    values: Record<string, any>
    errors: Record<string, string | undefined>
    getPathState: (path: string) => unknown
    validate: () => Promise<unknown>
  };
  return {
    wrapper,
    onSubmit,
    values: () => exposed.values,
    errors: () => exposed.errors,
    isRegistered: (path: string) => exposed.getPathState(path) !== undefined,
    validate: () => exposed.validate(),
  };
}

export function stepButton(wrapper: Wrapper, index: number, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-step-${index}"]`);
}

export function prevButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-back-button"]`);
}

export function nextButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-next-button"]`);
}

export function submitButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-submit-button"]`);
}

export function pageWrapper(wrapper: Wrapper, index: number, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}.page${index}-page"]`);
}

export function reviewPageWrapper(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}.review-page"]`);
}

export function pageWrappers(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.findAll(`[data-testid^="${wizardPath}."][data-page]`);
}

export function isHidden(element: { attributes: (name: string) => string | undefined }) {
  return /display:\s*none/.test(element.attributes('style') ?? '');
}

export function visiblePages(wrapper: Wrapper, wizardPath = 'wizard') {
  return pageWrappers(wrapper, wizardPath).filter(page => !isHidden(page)).map(page => Number(page.attributes('data-page')));
}

export async function click(element: { trigger: (event: string) => Promise<unknown> }) {
  await element.trigger('click');
  await flushPromises();
}
