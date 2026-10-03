import type { Metadata } from '@/examples/TestFormTemplate.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import {
  clickGotoStep,
  clickNext,
  currentStepIndex,
  isLast,
  isValidating,
  setupState,
} from './DynamicFormItemWizard.test-helpers';

function wizardWithRequiredFieldOnPage0(overrides: Partial<Metadata> = {}): Metadata {
  return {
    name: 'wizard',
    wizard: true,
    children: [
      {
        name: 'company',
        children: [{ name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } }],
      },
      {
        name: 'plan',
        children: [{ name: 'planName', minOccurs: 0, fieldOptions: { label: 'Plan Name' } }],
      },
    ],
    ...overrides,
  } as Metadata;
}

describe('component DynamicFormItemWizard - validation', () => {
  describe('linear next() validates only the current page, advancing only on success', () => {
    it('does not advance and shows the error when the current page is invalid', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [wizardWithRequiredFieldOnPage0()] } });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      const pending = state.next();
      await Promise.resolve();
      expect(isValidating(wrapper, 'wizard')).toBe(true);

      await pending;
      await flushPromises();

      expect(isValidating(wrapper, 'wizard')).toBe(false);
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });

    it('advances when the current page validates, and does not advance again past the last page', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [wizardWithRequiredFieldOnPage0()] } });
      await flushPromises();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);

      await clickNext(wrapper, 'wizard');
      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
    });
  });

  describe('non-linear next() surfaces errors but never blocks', () => {
    it('advances past an invalid page and leaves the error visible', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true } })] },
      });
      await flushPromises();

      await clickNext(wrapper, 'wizard');
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });

    it('validateOnJump: false advances silently, without surfacing the error', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true, validateOnJump: false } })] },
      });
      await flushPromises();

      await clickNext(wrapper, 'wizard');
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
    });
  });

  describe('non-linear forward gotoStep() surfaces errors but never blocks', () => {
    it('validateOnJump defaults on: a forward jump surfaces the error and still advances', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true } })] },
      });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 1);
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });

    it('validateOnJump: false makes a forward jump silent', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true, validateOnJump: false } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1);
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
    });

    it('call-time validateOnJump: false overrides a config true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true, validateOnJump: true } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1, { validateOnJump: false });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
    });

    it('exposes isValidating while a forward jump validates, mirroring next()', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      const pending = state.gotoStep(1);
      await Promise.resolve();
      expect(isValidating(wrapper, 'wizard')).toBe(true);

      await pending;
      await flushPromises();
      expect(isValidating(wrapper, 'wizard')).toBe(false);
    });

    it('call-time validateOnJump: true overrides a config false, surfacing the error while still advancing', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true, validateOnJump: false } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1, { validateOnJump: true });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });
  });

  describe('page paths are read from the corrected tree, correct when nested in an array occurrence', () => {
    it('validates against the exact runtime path of the nested page, not a re-derived one', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'teams',
            maxOccurs: 3,
            minOccurs: 3,
            children: [{
              name: 'wiz',
              wizard: true,
              children: [
                { name: 'company', children: [{ name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } }] },
                { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
              ],
            }],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      const state = setupState(wrapper, 'teams[2].wiz')!;

      // Give the occurrence a value first: an untouched occurrence is fully optional (its
      // relaxation propagates through the wizard, like any plain group), so nothing would block.
      await wrapper.find('[id="teams[2].wiz.plan.planName"]').setValue('Starter');
      await flushPromises();

      await state.next();
      await flushPromises();

      // Blocked: the required field at teams[2].wiz.company is still empty.
      expect(currentStepIndex(wrapper, 'teams[2].wiz')).toBe(0);
      expect(wrapper.find('[data-testid="teams[2].wiz.company.companyName-error-message"]').exists()).toBe(true);
      // Sibling occurrences are untouched — validateSection only targeted teams[2].wiz.company.
      expect(wrapper.find('[data-testid="teams[0].wiz.company.companyName-error-message"]').exists()).toBe(false);

      await wrapper.find('[id="teams[2].wiz.company.companyName"]').setValue('Acme');
      await state.next();
      await flushPromises();

      expect(currentStepIndex(wrapper, 'teams[2].wiz')).toBe(1);
    });
  });

  describe('optional and disabled wizards relax their pages, like the same tree without wizard: true', () => {
    it('an untouched optional wizard submits clean instead of demanding its required page fields', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ minOccurs: 0 })] },
      });
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(true);
    });

    it('once an optional wizard has a value, its required page fields are enforced again', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ minOccurs: 0 })] },
      });
      await flushPromises();

      // Any value inside the wizard subtree ends the untouched-and-optional relaxation.
      await wrapper.find('[id="wizard.plan.planName"]').setValue('Starter');
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.next();
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });
  });

  describe('whole-form submit validates fields on non-current pages', () => {
    it('a required field on a hidden page blocks handleSubmit and clears once filled', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: true,
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 1, fieldOptions: { label: 'Plan Name' } }] },
            ],
          } as Metadata],
        },
      });
      await flushPromises();

      // Give the wizard a value so its required page fields are live, then submit from page 0
      // while the invalid required field sits on the still-hidden page 1.
      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="wizard.plan.planName-error-message"]').exists()).toBe(true);

      // The field is mounted despite being hidden (v-show), so it can be filled and resubmitted.
      await wrapper.find('[id="wizard.plan.planName"]').setValue('Pro');
      await flushPromises();
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(true);
    });
  });

  describe('the wizard container surfaces its own error state', () => {
    it('a validation rule on the wizard node itself renders through the container slot after submit', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: true,
            fieldOptions: { label: 'Wizard' },
            validation: [() => 'Wizard is incomplete'],
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
            ],
          } as unknown as Metadata],
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="wizard-error-message"]').text()).toBe('Wizard is incomplete');
      expect(wrapper.find('[data-testid="isSubmitted"]').exists()).toBe(false);
    });
  });

  describe('concurrent navigation resolves to a single step', () => {
    it('two overlapping next() calls advance one step, not two', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [wizardWithRequiredFieldOnPage0()] } });
      await flushPromises();

      await wrapper.find('[id="wizard.company.companyName"]').setValue('Acme');
      await flushPromises();

      // A double click reaches next() twice before the first async validation resolves.
      const state = setupState(wrapper, 'wizard')!;
      await Promise.all([state.next(), state.next()]);
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(isLast(wrapper, 'wizard')).toBe(true);

      // The wizard is still navigable, not stuck past its last page.
      state.prev();
      await flushPromises();
      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });

    it('a backward jump during a pending forward jump wins', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: { allowForwardJump: true },
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
              { name: 'summary', children: [{ name: 'notes', minOccurs: 0 }] },
            ],
          } as Metadata],
        },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1, { validateOnJump: false });
      await flushPromises();

      // Forward jump validates asynchronously; the backward jump lands first and must not be
      // overridden when the forward jump's validation resolves.
      const pendingForward = state.gotoStep(2);
      state.gotoStep(0);
      await pendingForward;
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
    });
  });
});
