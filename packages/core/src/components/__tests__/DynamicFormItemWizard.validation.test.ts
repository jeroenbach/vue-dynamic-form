import type { Metadata } from '@/examples/TestFormTemplate.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import {
  clickGotoStep,
  clickNext,
  currentStepIndex,
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
  describe('next() validates only the current page, advancing only on success (AC5, AC6)', () => {
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

  describe('gotoStep() honors validateOnJump, config vs call-time, same override rule as AC9 (AC10)', () => {
    it('config validateOnJump: true blocks a jump away from an invalid current page', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true, validateOnJump: true } })] },
      });
      await flushPromises();

      await clickGotoStep(wrapper, 'wizard', 1);
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
    });

    it('validateOnJump: false (default) proceeds without validating the current page', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1);
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(1);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(false);
    });

    it('call-time validateOnJump: true overrides a config false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [wizardWithRequiredFieldOnPage0({ wizard: { allowForwardJump: true } })] },
      });
      await flushPromises();

      const state = setupState(wrapper, 'wizard')!;
      await state.gotoStep(1, { validateOnJump: true });
      await flushPromises();

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
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
    });
  });

  describe('page paths are read from the corrected tree, correct when nested in an array occurrence (AC20)', () => {
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
});
