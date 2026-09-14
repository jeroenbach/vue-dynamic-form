import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { renderCount } from './DynamicFormItem.test-helpers';
import { setupState } from './DynamicFormItemChoice.test-helpers';

function mountExplicitChoiceWithSibling() {
  return mount(TestForm, {
    attachTo: document.body,
    props: {
      metadata: [
        { name: 'sibling', fieldOptions: { label: 'Sibling' } },
        {
          name: 'pick',
          explicitChoiceSelection: true,
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
            { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
          ],
        },
      ],
    },
  });
}

describe('component DynamicFormItemChoice - analytics', () => {
  describe('explicit selection — maxOccurs:1 (ST-01)', () => {
    it('selecting a branch mounts its DynamicFormItem exactly once', async () => {
      const wrapper = mountExplicitChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'pick.selfServe')).toBe(1);
    });

    it('switching branches renders the newly selected branch exactly once', async () => {
      const wrapper = mountExplicitChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      expect(renderCount(wrapper, 'pick.selfServe')).toBe(1);

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(renderCount(wrapper, 'pick.guidedRollout')).toBe(1);
    });

    it('does not re-render a sibling field outside the choice when a branch is selected or switched', async () => {
      const wrapper = mountExplicitChoiceWithSibling();
      await flushPromises();
      const siblingCountBefore = renderCount(wrapper, 'sibling');

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
    });

    it('increases the active-branch computation by exactly one per addChoiceOccurrence/removeChoiceOccurrence call', async () => {
      const wrapper = mountExplicitChoiceWithSibling();
      await flushPromises();

      const countBefore = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countBefore + 1);

      const countAfterAdd = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;
      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countAfterAdd + 1);
    });

    it('idempotent re-selection of the same branch causes zero additional renders and zero additional active-branch recomputes', async () => {
      const wrapper = mountExplicitChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      const renderCountBefore = renderCount(wrapper, 'pick.selfServe');
      const activeCountBefore = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'pick.selfServe')).toBe(renderCountBefore);
      expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(activeCountBefore);
    });
  });
});
