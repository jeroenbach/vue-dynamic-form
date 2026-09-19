import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { renderCount } from './DynamicFormItem.test-helpers';
import { enableDisplayOrder, enablePreserveOnSwitch, occurrenceGlobalIndex, setupState } from './DynamicFormItemChoice.test-helpers';

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
  describe('explicit selection — maxOccurs:1', () => {
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

  describe('maxOccurs > 1', () => {
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
      // globalIndex already reflects the correct cross-branch position at that very first render,
      // no flash of a stale or undefined value (apiEndpoint is declared before crmExport, so it
      // groups first regardless of add-press order).
      expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
      expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(1);
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
      // The survivor's globalIndex is already renumbered at that same bounded render pass.
      expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
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

    describe('globalIndex — render counts', () => {
      it('removing occurrence 1 of 4 across branches does not remount any survivor, and each renumbers at that same bounded render pass', async () => {
        const wrapper = mountExplicitRepeatableChoiceWithSibling();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        // Grouped order: apiEndpoint[0]=0, apiEndpoint[1]=1, crmExport[0]=2, crmExport[1]=3.
        const survivors = ['pick.crmExport[0]', 'pick.crmExport[1]'];
        const elementsBefore = survivors.map(path => wrapper.find(`[id="${path}"]`).element);
        const countsBefore = survivors.map(path => renderCount(wrapper, path));

        // Remove the occurrence at globalIndex 1 (apiEndpoint[1]).
        await wrapper.find('[data-testid="pick.apiEndpoint[1]-remove-choice-button"]').trigger('click');
        await flushPromises();

        survivors.forEach((path, i) => {
          expect(wrapper.find(`[id="${path}"]`).element).toBe(elementsBefore[i]);
          expect(renderCount(wrapper, path)).toBeGreaterThanOrEqual(countsBefore[i]);
          expect(renderCount(wrapper, path)).toBeLessThanOrEqual(countsBefore[i] + 1);
        });
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(2);
      });

      it('exercising globalIndex across branches does not change the sibling render count', async () => {
        const wrapper = mountExplicitRepeatableChoiceWithSibling();
        await flushPromises();
        const siblingCountBefore = renderCount(wrapper, 'sibling');

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
      });

      it('adds exactly one activeChoiceOccurrences recompute per add/remove call, unchanged by forwarding globalIndex', async () => {
        const wrapper = mountExplicitRepeatableChoiceWithSibling();
        await flushPromises();

        const countBefore = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countBefore + 1);

        const countAfterAdd = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countAfterAdd + 1);
      });
    });

    describe('insertionOrder / displayOrder: render counts', () => {
      function mountInterleavedRepeatableChoiceWithSibling(extraProps: Record<string, any> = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: enableDisplayOrder([
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
            ], 'pick', 'added'),
            ...extraProps,
          },
        });
      }

      it('displayOrder absent reproduces the same render-count bounds as before this story\'s source-list swap', async () => {
        const wrapper = mountExplicitRepeatableChoiceWithSibling();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        const survivorCountBefore = renderCount(wrapper, 'pick.apiEndpoint[0]');
        const survivorElementBefore = wrapper.find('[id="pick.apiEndpoint[0]"]').element;

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.apiEndpoint[0]"]').element).toBe(survivorElementBefore);
        expect(renderCount(wrapper, 'pick.apiEndpoint[0]')).toBeGreaterThanOrEqual(survivorCountBefore);
        expect(renderCount(wrapper, 'pick.apiEndpoint[0]')).toBeLessThanOrEqual(survivorCountBefore + 1);
      });

      it('an add or remove that changes renderedChoiceOccurrences\'s composition does not remount a surviving occurrence and preserves its entered value', async () => {
        const wrapper = mountInterleavedRepeatableChoiceWithSibling({
          initialValues: { pick: { apiEndpoint: [null], crmExport: [null, null] } },
        });
        await flushPromises();
        await wrapper.find('[id="pick.crmExport[0]"]').setValue('salesforce');
        await flushPromises();

        const survivorElementBefore = wrapper.find('[id="pick.crmExport[0]"]').element;
        const survivorCountBeforeAdd = renderCount(wrapper, 'pick.crmExport[0]');

        // Appends a new occurrence at the end of the displayed sequence: a composition change
        // that leaves every already-rendered occurrence's relative position untouched.
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.crmExport[0]"]').element).toBe(survivorElementBefore);
        expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeGreaterThanOrEqual(survivorCountBeforeAdd);
        expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeLessThanOrEqual(survivorCountBeforeAdd + 1);
        expect((wrapper.find('[id="pick.crmExport[0]"]').element as HTMLInputElement).value).toBe('salesforce');

        // Removal is the other composition-changing operation.
        const survivorCountBeforeRemove = renderCount(wrapper, 'pick.crmExport[0]');
        await wrapper.find('[data-testid="pick.crmExport[1]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.crmExport[0]"]').element).toBe(survivorElementBefore);
        expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeGreaterThanOrEqual(survivorCountBeforeRemove);
        expect(renderCount(wrapper, 'pick.crmExport[0]')).toBeLessThanOrEqual(survivorCountBeforeRemove + 1);
        expect((wrapper.find('[id="pick.crmExport[0]"]').element as HTMLInputElement).value).toBe('salesforce');
      });

      it('does not re-render a sibling field outside the choice when insertionOrder is assigned or renderedChoiceOccurrences recomputes', async () => {
        const wrapper = mountInterleavedRepeatableChoiceWithSibling();
        await flushPromises();
        const siblingCountBefore = renderCount(wrapper, 'sibling');

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
      });

      it('leaves the existing activeChoiceOccurrences/occurrences recompute contracts unchanged', async () => {
        const wrapper = mountInterleavedRepeatableChoiceWithSibling();
        await flushPromises();

        const countBefore = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countBefore + 1);

        const countAfterAdd = setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount;
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(setupState(wrapper, 'pick')?._analytics_activeChoiceOccurrencesCalculatedCount).toBe(countAfterAdd + 1);
      });

      it('recomputes _analytics_renderedChoiceOccurrencesCalculatedCount a bounded number of times per add/remove call, and not on an unrelated sibling change', async () => {
        const wrapper = mountInterleavedRepeatableChoiceWithSibling();
        await flushPromises();

        const countBefore = setupState(wrapper, 'pick')?._analytics_renderedChoiceOccurrencesCalculatedCount;

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        const countAfterAdd = setupState(wrapper, 'pick')?._analytics_renderedChoiceOccurrencesCalculatedCount;
        expect(countAfterAdd).toBe(countBefore + 1);

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        const countAfterRemove = setupState(wrapper, 'pick')?._analytics_renderedChoiceOccurrencesCalculatedCount;
        expect(countAfterRemove).toBe(countAfterAdd + 1);

        const countBeforeSibling = setupState(wrapper, 'pick')?._analytics_renderedChoiceOccurrencesCalculatedCount;
        await wrapper.find('[id="sibling"]').setValue('unrelated');
        await flushPromises();

        expect(setupState(wrapper, 'pick')?._analytics_renderedChoiceOccurrencesCalculatedCount).toBe(countBeforeSibling);
      });
    });
  });

  describe('preserve-on-switch — render counts', () => {
    function mountPreserveOnSwitchChoiceWithSibling() {
      const metadata = enablePreserveOnSwitch([
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
      ], 'pick');

      return mount(TestForm, {
        attachTo: document.body,
        props: { metadata },
      });
    }

    it('restoring a branch mounts its DynamicFormItem exactly once, with the restored data already present at that first render', async () => {
      const wrapper = mountPreserveOnSwitchChoiceWithSibling();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();
      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      // Read immediately after the switch-back call, with no intervening flushPromises-triggered
      // increment: the restored data must already be present at the very first render.
      await flushPromises();

      expect(renderCount(wrapper, 'pick.selfServe')).toBe(1);
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('hello');
    });

    it('switching away with the flag on does not add any extra _analytics_occurrencesCalculatedCount recompute compared to the flag-off baseline', async () => {
      // Flag-off baseline (the existing single-recompute contract for plain clear-on-switch).
      const metadataOff = [
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
      ];
      const wrapperOff = mount(TestForm, { attachTo: document.body, props: { metadata: metadataOff } });
      await flushPromises();
      await wrapperOff.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      const countBeforeOff = setupState(wrapperOff, 'pick')?._analytics_occurrencesCalculatedCount;
      await wrapperOff.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      const countAfterOff = setupState(wrapperOff, 'pick')?._analytics_occurrencesCalculatedCount;

      // Flag-on: stash capture must not add a second recompute on top of the baseline above.
      const wrapper = mountPreserveOnSwitchChoiceWithSibling();
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      const countBeforeOn = setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount;
      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      const countAfterOn = setupState(wrapper, 'pick')?._analytics_occurrencesCalculatedCount;

      expect(countAfterOn - countBeforeOn).toBe(countAfterOff - countBeforeOff);
    });

    it('does not re-render a sibling field outside the choice across a stash/restore cycle', async () => {
      const wrapper = mountPreserveOnSwitchChoiceWithSibling();
      await flushPromises();
      const siblingCountBefore = renderCount(wrapper, 'sibling');

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();
      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
    });

    it('flag-off baseline: render counts for a plain switch-away/switch-back-to-empty cycle are unchanged', async () => {
      const metadata = [
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
      ];
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      expect(renderCount(wrapper, 'pick.selfServe')).toBe(1);

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      // Switching back to an empty branch (flag off, so no restore) mounts it exactly once too.
      expect(renderCount(wrapper, 'pick.selfServe')).toBe(1);
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
    });
  });
});
