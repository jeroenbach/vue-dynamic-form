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

  describe('maxOccurs > 1 (ST-02)', () => {
    function mountExplicitRepeatableChoiceWithSibling() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'sibling', fieldOptions: { label: 'Sibling' } },
            {
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 3,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
              ],
            },
          ],
        },
      });
    }

    it('adding an occurrence mounts exactly one new DynamicFormItem and does not remount another branch\'s existing occurrence', async () => {
      const wrapper = mountExplicitRepeatableChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
      await flushPromises();
      const crmExportCountBefore = renderCount(wrapper, 'pick.crmExport[0]');
      const crmExportElementBefore = wrapper.find('[id="pick.crmExport[0]"]').element;

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      // The newly added occurrence mounts with a single, fresh render pass.
      expect(renderCount(wrapper, 'pick.apiEndpoint[0]')).toBe(1);
      // crmExport's occurrence is not remounted: same DOM node identity, and at most one extra
      // render pass (an existing, DynamicFormItemArray-shared characteristic of the v-slot
      // forwarding chain: every sibling receives a fresh slotProps object whenever the choice
      // re-renders for any reason, which is a benign prop update, not a remount or a cascade).
      expect(wrapper.find('[id="pick.crmExport[0]"]').element).toBe(crmExportElementBefore);
      expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeGreaterThanOrEqual(crmExportCountBefore);
      expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeLessThanOrEqual(crmExportCountBefore + 1);
    });

    it('removing occurrence 0 of two does not remount the surviving occurrence', async () => {
      const wrapper = mountExplicitRepeatableChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      const survivorCountBefore = renderCount(wrapper, 'pick.apiEndpoint[1]');
      const survivorElementBefore = wrapper.find('[id="pick.apiEndpoint[1]"]').element;

      await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
      await flushPromises();

      // The stable vee-validate key means the surviving occurrence's component instance is the
      // same one that reindexed from [1] to [0]: same DOM node identity, at most one extra render
      // pass from the index/prop update, never a full unmount/remount cycle.
      expect(wrapper.find('[id="pick.apiEndpoint[0]"]').element).toBe(survivorElementBefore);
      expect(renderCount(wrapper, 'pick.apiEndpoint[0]')).toBeGreaterThanOrEqual(survivorCountBefore);
      expect(renderCount(wrapper, 'pick.apiEndpoint[0]')).toBeLessThanOrEqual(survivorCountBefore + 1);
    });

    it('_analytics_occurrencesCalculatedCount increases per addChoiceOccurrence/removeChoiceOccurrence call in the repeatable path too', async () => {
      const wrapper = mountExplicitRepeatableChoiceWithSibling();
      await flushPromises();

      const countBefore = setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount;

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount).toBeGreaterThan(countBefore);

      const countAfterAdd = setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount;
      await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount).toBeGreaterThan(countAfterAdd);
    });

    it('does not re-render a sibling field outside the choice when a repeatable occurrence is added or removed', async () => {
      const wrapper = mountExplicitRepeatableChoiceWithSibling();
      await flushPromises();
      const siblingCountBefore = renderCount(wrapper, 'sibling');

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
    });

    it('the reindex case does not remount the surviving occurrence in a nested repeatable choice after a sibling array item is removed', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'projectContacts',
            maxOccurs: 3,
            minOccurs: 0,
            autoAddMinOccurs: false,
            fieldOptions: { label: 'Project Contacts' },
            children: [{
              name: 'certifications',
              explicitChoiceSelection: true,
              maxOccurs: 4,
              minOccurs: 0,
              fieldOptions: { label: 'Certifications' },
              choice: [
                { name: 'basic', maxOccurs: 3, fieldOptions: { label: 'Basic' } },
                { name: 'advanced', maxOccurs: 3, fieldOptions: { label: 'Advanced' } },
              ],
            }],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="projectContacts[1].certifications.basic-add-choice-button"]').trigger('click');
      await flushPromises();
      const survivorCountBefore = renderCount(wrapper, 'projectContacts[1].certifications.basic[0]');

      await wrapper.find('[data-testid="projectContacts[0]-remove-button"]:not(.invisible)').trigger('click');
      await flushPromises();

      // Bounded: at most one re-render from the path/index adjustment, never an unmount/remount
      // storm — guards against a per-branch field array captured as a setup-time string.
      const survivorCountAfter = renderCount(wrapper, 'projectContacts[0].certifications.basic[0]');
      expect(survivorCountAfter).toBeGreaterThanOrEqual(survivorCountBefore);
      expect(survivorCountAfter).toBeLessThanOrEqual(survivorCountBefore + 1);
    });
  });
});
