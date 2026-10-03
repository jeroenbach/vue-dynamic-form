import type { Metadata } from '@/examples/TestFormTemplate.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { renderCount } from './DynamicFormItem.test-helpers';
import { clickGotoStep, clickNext, currentStepIndex, setupState } from './DynamicFormItemWizard.test-helpers';

function threePageWizard(name = 'wizard'): Metadata {
  return {
    name,
    wizard: { allowForwardJump: true },
    children: [
      { name: 'company', children: [{ name: 'companyName', minOccurs: 0 }] },
      { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
      { name: 'launch', children: [{ name: 'launchName', minOccurs: 0 }] },
    ],
  } as unknown as Metadata;
}

describe('component DynamicFormItemWizard - analytics', () => {
  describe('navigating does not remount pages (v-show, not v-if)', () => {
    it('a field on page 0 keeps the same render identity across a round trip to page 1 and back', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: [threePageWizard()] } });
      await flushPromises();

      const before = renderCount(wrapper, 'wizard.company.companyName');

      await clickGotoStep(wrapper, 'wizard', 1);
      await clickGotoStep(wrapper, 'wizard', 0);

      // v-show toggling never triggers a mount/unmount of the underlying DynamicFormItem, so the
      // page-0 field's own render count is unaffected by navigating away and back.
      expect(renderCount(wrapper, 'wizard.company.companyName')).toBe(before);
    });
  });

  describe('isCurrent toggling is scoped', () => {
    it('does not re-render an untouched page or a sibling field outside the wizard', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'sibling', fieldOptions: { label: 'Sibling' } },
            threePageWizard(),
          ],
        },
      });
      await flushPromises();

      const launchCountBefore = renderCount(wrapper, 'wizard.launch.launchName');
      const siblingCountBefore = renderCount(wrapper, 'sibling');

      await clickGotoStep(wrapper, 'wizard', 1);

      expect(renderCount(wrapper, 'wizard.launch.launchName')).toBe(launchCountBefore);
      expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
    });
  });

  describe('two independent wizards never cross-affect each other', () => {
    it('navigating a choice-of-wizards branch does not change a sibling top-level wizard', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            threePageWizard('topLevel'),
            {
              name: 'pick',
              explicitChoiceSelection: true,
              choice: [{ ...threePageWizard(), name: 'nested' }],
            },
          ] as unknown as Metadata[],
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.nested-add-choice-button"]').trigger('click');
      await flushPromises();

      const topLevelRenderCountBefore = renderCount(wrapper, 'topLevel.company.companyName');
      const topLevelStepBefore = currentStepIndex(wrapper, 'topLevel');

      await clickGotoStep(wrapper, 'pick.nested', 1);

      expect(currentStepIndex(wrapper, 'pick.nested')).toBe(1);
      expect(currentStepIndex(wrapper, 'topLevel')).toBe(topLevelStepBefore);
      expect(renderCount(wrapper, 'topLevel.company.companyName')).toBe(topLevelRenderCountBefore);
    });
  });

  describe('a blocked next() causes only the expected re-render', () => {
    it('increments the failing field\'s render count without remounting the wizard container', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'wizard',
            wizard: true,
            children: [
              { name: 'company', children: [{ name: 'companyName', minOccurs: 1, fieldOptions: { label: 'Company Name' } }] },
              { name: 'plan', children: [{ name: 'planName', minOccurs: 0 }] },
            ],
          }] as unknown as Metadata[],
        },
      });
      await flushPromises();

      const wizardInstanceBefore = setupState(wrapper, 'wizard');

      await clickNext(wrapper, 'wizard');

      expect(currentStepIndex(wrapper, 'wizard')).toBe(0);
      expect(wrapper.find('[data-testid="wizard.company.companyName-error-message"]').exists()).toBe(true);
      // Same DynamicFormItemWizard instance — a blocked next() does not remount the container.
      expect(setupState(wrapper, 'wizard')).toBe(wizardInstanceBefore);
    });
  });
});
