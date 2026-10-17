import type { Metadata } from '@/examples/TestFormTemplate.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useFieldValue } from 'vee-validate';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import DynamicForm from '@/components/DynamicForm.vue';
import { useDynamicForm } from '@/core/useDynamicForm';
import TestForm from '@/examples/TestForm.vue';
import TestFormTemplate from '@/examples/TestFormTemplate.vue';
import { setupState as itemSetupState } from './DynamicFormItem.test-helpers';
import {
  clickGotoStep,
  clickNext,
  currentStepIndex,
} from './DynamicFormItemWizard.test-helpers';

function threePageWizard(overrides: Partial<Metadata> = {}): Metadata {
  return {
    name: 'wizard',
    wizard: true,
    children: [
      {
        name: 'company',
        children: [
          { name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } },
          { name: 'companyCode', minOccurs: 1, fieldOptions: { label: 'Company Code' } },
        ],
      },
      {
        name: 'plan',
        children: [{ name: 'planName', minOccurs: 1, fieldOptions: { label: 'Plan Name' } }],
      },
      {
        name: 'review',
        children: [{ name: 'notes', minOccurs: 0, fieldOptions: { label: 'Notes' } }],
      },
    ],
    ...overrides,
  } as Metadata;
}

function allOptionalThreePageWizard(): Metadata {
  return {
    name: 'wizard',
    wizard: true,
    children: [
      {
        name: 'company',
        children: [
          { name: 'companyName', minOccurs: 0, fieldOptions: { label: 'Company Name' } },
          { name: 'companyCode', minOccurs: 0, fieldOptions: { label: 'Company Code' } },
        ],
      },
      {
        name: 'plan',
        children: [{ name: 'planName', minOccurs: 0, fieldOptions: { label: 'Plan Name' } }],
      },
      {
        name: 'review',
        children: [{ name: 'notes', minOccurs: 0, fieldOptions: { label: 'Notes' } }],
      },
    ],
  } as Metadata;
}

async function mountWizard(overrides: Partial<Metadata> = {}) {
  const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [threePageWizard(overrides)] } });
  await flushPromises();
  return wrapper;
}

/** The private vee-validate form context, reached through any mounted field's own `formContext` setup variable. */
function formContextAt(wrapper: ReturnType<typeof mount>, path: string): any {
  return itemSetupState(wrapper, path)?.formContext;
}

describe('component DynamicFormItemWizard - form API surface', () => {
  describe('validateSection through blocked navigation', () => {
    it('leaves errors only for the invalid page, with later pages untouched', async () => {
      const wrapper = await mountWizard();

      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(false);
    });

    it('proceeds once the blocked page is filled in', async () => {
      const wrapper = await mountWizard();

      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
    });
  });

  describe('resetForm() after a failed next()', () => {
    it('clears the blocked page errors and they do not reappear', async () => {
      const wrapper = await mountWizard();

      await clickNext(wrapper, 'wizard');
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      await nextTick();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(false);
    });

    it('stays navigable and validates freshly on the next navigation attempt', async () => {
      const wrapper = await mountWizard();

      await clickNext(wrapper, 'wizard');
      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      await nextTick();

      // Still empty: a fresh next() blocks again with a fresh error, not a stale one.
      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
    });
  });

  describe('resetForm() while on a later page', () => {
    it('resets values on every page but leaves the current step untouched', async () => {
      const wrapper = await mountWizard();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);

      await wrapper.find('[id="wizard.plan.planName"]').setValue('Pro');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      await nextTick();

      // The step index lives on the wizard component itself, independent of vee-validate state.
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect((wrapper.find<HTMLInputElement>('[id="wizard.plan.planName"]').element).value).toBe('');
      expect((wrapper.find<HTMLInputElement>('[id="wizard.company.companyName"]').element).value).toBe('');
    });

    it('re-validates correctly on the next navigation after resetting on a later page', async () => {
      const wrapper = await mountWizard();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');

      await wrapper.find('[id="wizard.plan.planName"]').setValue('Pro');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      await nextTick();

      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
    });
  });

  describe('setFieldValue on the current page', () => {
    it('validates the written value by default', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      form.setFieldValue('wizard.company.companyName', 'Acme');
      await flushPromises();

      expect(wrapper.find<HTMLInputElement>('[id="wizard.company.companyName"]').element.value).toBe('Acme');
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);

      form.setFieldValue('wizard.company.companyName', '');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });

    it('suppresses validation when called with shouldValidate: false, but still updates the value', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      form.setFieldValue('wizard.company.companyName', '', false);
      await flushPromises();

      expect(wrapper.find<HTMLInputElement>('[id="wizard.company.companyName"]').element.value).toBe('');
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);

      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });
  });

  describe('setFieldValue on a non-current (hidden) page', () => {
    it('validates immediately even though the page is hidden', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.plan.planName');

      form.setFieldValue('wizard.plan.planName', '');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });

    it('suppresses with shouldValidate: false, and a later navigation to that page still catches it', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.plan.planName');

      form.setFieldValue('wizard.plan.planName', '', false);
      await flushPromises();
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(false);

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);

      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
    });
  });

  describe('setValues spanning multiple pages', () => {
    it('validates the whole form by default, surfacing errors across pages at once', async () => {
      const wrapper = await mountWizard();

      (wrapper.vm as any).$.setupState.setValues({
        wizard: {
          company: { companyName: 'Acme', companyCode: 'C1' },
          plan: { planName: '' },
        },
      });
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });

    it('does not validate with shouldValidate: false, leaving every page error-free', async () => {
      const wrapper = await mountWizard();

      (wrapper.vm as any).$.setupState.setValues({
        wizard: {
          company: { companyName: '', companyCode: '' },
          plan: { planName: '' },
        },
      }, false);
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(false);
    });
  });

  describe('resetField on a page-0 field after its error shows', () => {
    it('resets only the targeted field, leaving a sibling error on the same page intact', async () => {
      const wrapper = await mountWizard();

      await clickNext(wrapper, 'wizard');
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(true);

      (wrapper.vm as any).$.setupState.resetField('wizard.company.companyName');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(true);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });

  describe('validate() force mode', () => {
    it('surfaces every invalid field across all pages at once, including non-visible ones', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      const result = await form.validate();
      await flushPromises();

      expect(result.valid).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.review.notes-error-message"]').exists()).toBe(false);
    });
  });

  describe('validate({ mode: \'silent\' })', () => {
    it('updates validity without writing any error text', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      const result = await form.validate({ mode: 'silent' });
      await flushPromises();

      expect(result.valid).toBe(false);
      expect(form.meta.value.valid).toBe(false);
      expect(wrapper.findAll('[data-testid$="-error-message"]')).toHaveLength(0);
    });
  });

  describe('submitting from within a wizard', () => {
    it('blocks on invalid fields on any page, increments submitCount, and shows every page\'s errors', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');
      expect(form.submitCount.value).toBe(0);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(form.submitCount.value).toBe(1);
      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.company.companyCode-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);
    });

    it('submits once every page is valid, regardless of the current page', async () => {
      const wrapper = await mountWizard();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await wrapper.find('[id="wizard.company.companyCode"]').setValue('C1');
      await wrapper.find('[id="wizard.plan.planName"]').setValue('Pro');
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(true);
    });
  });

  describe('setFieldError on a non-current page field', () => {
    it('surfaces in errors and is unaffected by navigation away from and back to its page', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [allOptionalThreePageWizard()] } });
      await flushPromises();

      const form = formContextAt(wrapper, 'wizard.company.companyName');
      form.setFieldError('wizard.plan.planName', 'Custom error');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').text()).toContain('Custom error');

      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').text()).toContain('Custom error');
    });
  });

  describe('setTouched / setFieldTouched on hidden-page fields', () => {
    it('setFieldTouched marks only the targeted field touched', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      form.setFieldTouched('wizard.plan.planName', true);
      await flushPromises();

      expect(form.isFieldTouched('wizard.plan.planName')).toBe(true);
      expect(form.isFieldTouched('wizard.company.companyName')).toBe(false);
    });

    it('setTouched(true) touches every field, including ones on hidden pages', async () => {
      const wrapper = await mountWizard();
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      form.setTouched(true);
      await flushPromises();

      expect(form.isFieldTouched('wizard.company.companyName')).toBe(true);
      expect(form.isFieldTouched('wizard.plan.planName')).toBe(true);
    });
  });

  describe('meta.dirty across page edits and after resetForm', () => {
    it('becomes dirty on an edit and clean again after resetForm', async () => {
      const wrapper = await mountWizard();

      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(true);

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      await nextTick();

      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);
    });
  });

  describe('useFieldValue for fields on different wizard pages', () => {
    it('reads each page\'s own value independently', async () => {
      let companyNameValue: any;
      let planNameValue: any;

      const Host = defineComponent({
        setup() {
          useDynamicForm();
          companyNameValue = useFieldValue('wizard.company.companyName');
          planNameValue = useFieldValue('wizard.plan.planName');
          const metadata = [threePageWizard()];
          return () => h(DynamicForm as any, { template: TestFormTemplate, metadata });
        },
      });

      const wrapper = mount(Host, { attachTo: document.body });
      await flushPromises();

      expect(companyNameValue.value).toBeUndefined();
      expect(planNameValue.value).toBeUndefined();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();

      expect(companyNameValue.value).toBe('Acme');
      expect(planNameValue.value).toBeUndefined();

      await wrapper.find('[id="wizard.plan.planName"]').setValue('Pro');
      await flushPromises();

      expect(planNameValue.value).toBe('Pro');
      expect(companyNameValue.value).toBe('Acme');
    });
  });

  describe('wizard config interplay: a suppressed write still surfaces on a validated forward jump', () => {
    it('allowForwardJump with default validateOnJump surfaces a value written with shouldValidate: false', async () => {
      const wrapper = await mountWizard({ wizard: { allowForwardJump: true } });
      const form = formContextAt(wrapper, 'wizard.company.companyName');

      form.setFieldValue('wizard.company.companyName', '', false);
      await flushPromises();
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);

      await clickGotoStep(wrapper, 'wizard', 1);

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });
  });
});
