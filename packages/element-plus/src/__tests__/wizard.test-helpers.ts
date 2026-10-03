import type { VueWrapper } from '@vue/test-utils';
import type { Component } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { defineComponent, h } from 'vue';
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';

type Wrapper = VueWrapper<any>;

interface WizardMetadataOptions {
  name?: string
  pages?: number
  wizard?: boolean | { allowForwardJump?: boolean, validateOnJump?: boolean }
  requiredPages?: number[]
  extra?: Record<string, unknown>
}

/** A wizard with one text field per page: `<name>.page<i>.field<i>`, optional unless the page is listed as required. */
export function wizardMetadata({ name = 'wizard', pages = 3, wizard = true, requiredPages = [], extra = {} }: WizardMetadataOptions = {}) {
  return {
    name,
    wizard,
    ...extra,
    children: Array.from({ length: pages }, (_, index) => ({
      name: `page${index}`,
      label: `Page ${index + 1}`,
      children: [{ name: `field${index}`, type: 'text', label: `Field ${index + 1}`, minOccurs: requiredPages.includes(index) ? 1 : 0 }],
    })),
  };
}

export function fieldPath(index: number, wizardPath = 'wizard') {
  return `${wizardPath}.page${index}.field${index}`;
}

interface MountWizardFormOptions {
  template?: Component
  settings?: Record<string, unknown>
  initialValues?: Record<string, unknown>
}

/** Mounts the engine inside a consumer-owned native form, so the submit button has something to submit. */
export async function mountWizardForm(metadata: unknown, { template = ElementPlusFormTemplate as unknown as Component, settings, initialValues }: MountWizardFormOptions = {}) {
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

interface IsolatedWizardOptions {
  fieldMetadata?: Record<string, unknown>
  pages?: Record<string, unknown>[]
  currentStepIndex?: number
  isValidating?: boolean
  disabled?: boolean
  wizardConfig?: { allowForwardJump: boolean, validateOnJump: boolean }
  errorMessage?: string
  isFirst?: boolean
  isLast?: boolean
  defaultSlot?: string
}

/** Mounts the template with the attributes the engine passes to a wizard container, with spies for the actions. */
export function mountWizardContainer(options: IsolatedWizardOptions = {}) {
  const pages = options.pages ?? [
    { name: 'a', path: 'wizard.a', label: 'Alpha' },
    { name: 'b', path: 'wizard.b', label: 'Beta' },
    { name: 'c', path: 'wizard.c', label: 'Gamma' },
  ];
  const currentStepIndex = options.currentStepIndex ?? 0;
  const actions = { next: vi.fn(), prev: vi.fn(), gotoStep: vi.fn() };

  const wrapper = mount(ElementPlusFormTemplate, {
    attrs: {
      type: 'text-wizard',
      fieldMetadata: { name: 'wizard', path: 'wizard', type: 'text', wizard: true, ...options.fieldMetadata },
      fieldContext: { errorMessage: { value: options.errorMessage }, value: { value: undefined } },
      disabled: options.disabled ?? false,
      required: false,
      settings: {},
      slotProps: {},
      currentStepIndex,
      pages,
      pageCount: pages.length,
      isFirst: options.isFirst ?? currentStepIndex === 0,
      isLast: options.isLast ?? (pages.length === 0 ? true : currentStepIndex === pages.length - 1),
      isValidating: options.isValidating ?? false,
      wizardConfig: options.wizardConfig ?? { allowForwardJump: false, validateOnJump: true },
      ...actions,
    },
    slots: { default: options.defaultSlot ?? '<div data-testid="pages-content">pages</div>' } as any,
  });

  return { wrapper, ...actions };
}

/** Mounts the template with the attributes the engine passes to one wizard page. */
export function mountWizardPage(options: { isCurrent: boolean, pageIndex?: number }) {
  return mount(ElementPlusFormTemplate, {
    attrs: {
      type: 'text-wizard-page',
      fieldMetadata: { name: 'a', path: 'wizard.a' },
      fieldContext: { errorMessage: { value: undefined }, value: { value: undefined } },
      disabled: false,
      required: false,
      settings: {},
      slotProps: {},
      isCurrent: options.isCurrent,
      pageIndex: options.pageIndex ?? 0,
      currentStepIndex: 0,
      isFirst: true,
      isLast: false,
      wizardConfig: { allowForwardJump: false, validateOnJump: true },
      next: vi.fn(),
      prev: vi.fn(),
      gotoStep: vi.fn(),
    },
    slots: { default: '<span data-testid="page-content">content</span>' } as any,
  });
}

export function stepButton(wrapper: Wrapper, index: number, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-step-${index}"]`);
}

export function stepTitles(wrapper: Wrapper) {
  return wrapper.findAll('.el-step__title').map(title => title.text());
}

export function prevButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-prev-button"]`);
}

export function nextButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-next-button"]`);
}

export function submitButton(wrapper: Wrapper, wizardPath = 'wizard') {
  return wrapper.find(`[data-testid="${wizardPath}-submit-button"]`);
}

export function pageWrappers(wrapper: Wrapper) {
  return wrapper.findAll('[data-page]');
}

export function isHidden(element: { attributes: (name: string) => string | undefined }) {
  return /display:\s*none/.test(element.attributes('style') ?? '');
}

export function visiblePages(wrapper: Wrapper) {
  return pageWrappers(wrapper).filter(page => !isHidden(page)).map(page => Number(page.attributes('data-page')));
}

export function isDisabled(element: { attributes: (name: string) => string | undefined }) {
  return element.attributes('disabled') !== undefined;
}

/** The step the indicator reports as current. */
export function activeStep(wrapper: Wrapper) {
  return stepStatuses(wrapper).indexOf('process');
}

/** The status Element Plus puts on each step head: `success`, `process`, or `wait`. */
export function stepStatuses(wrapper: Wrapper) {
  return wrapper.findAll('.el-step__head').map(head => head.classes().find(name => /^is-(?:process|finish|success|wait)$/.test(name))?.replace('is-', ''));
}

export async function click(element: { trigger: (event: string) => Promise<unknown> }) {
  await element.trigger('click');
  await flushPromises();
}

/** A validation function that stays pending until the test settles it. */
export function deferredRule() {
  let settle: (result: boolean | string) => void = () => {};
  const pending = new Promise<boolean | string>((resolve) => {
    settle = resolve;
  });
  return { rule: () => pending, settle };
}
