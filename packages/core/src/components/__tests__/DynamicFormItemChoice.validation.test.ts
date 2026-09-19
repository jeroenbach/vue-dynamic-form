import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { setupState } from './DynamicFormItem.test-helpers';
import { enablePreserveOnSwitch } from './DynamicFormItemChoice.test-helpers';

describe('component DynamicFormItemChoice', () => {
  afterEach(() => {
    configure({ generateMessage: undefined });
  });

  // TODO: add a check with multiple validations failing at the same time, the error messages should be displayed on the correct item.

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Simple choice — two text inputs (minOccurs=1 default, maxOccurs=1 default)
  // ─────────────────────────────────────────────────────────────────────────
  describe('simple choice — two text inputs (minOccurs=1, maxOccurs=1)', () => {
    function mountSimpleChoice(message = 'Pick at least {min} in {field}') {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: message } },
        },
      });
    }

    it('shows an error when neither child is filled on submit', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text())
        .toContain('Pick at least 1 in Pick One');
    });

    it('shows no error when the first child has a value', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('shows no error when the second child has a value', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[id="pick.opt2"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('error clears when a value is entered and reappears when cleared again', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      await wrapper.find('[id="pick.opt1"]').setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Custom error messages — {0}, {min}, {field} placeholders + generateMessage
  // ─────────────────────────────────────────────────────────────────────────
  describe('xsd_choiceMinOccurs — custom error messages', () => {
    it.each`
      label       | minOccurs | message                                             | expected
      ${'Picker'} | ${1}      | ${'At least {0} option(s) required for {field}'}   | ${'At least 1 option(s) required for Picker'}
      ${'Picker'} | ${2}      | ${'At least {0} option(s) required for {field}'}   | ${'At least 2 option(s) required for Picker'}
      ${'Picker'} | ${1}      | ${'{field} requires at least {min} selection(s)'}  | ${'Picker requires at least 1 selection(s)'}
      ${'Picker'} | ${2}      | ${'{field} requires at least {min} selection(s)'}  | ${'Picker requires at least 2 selection(s)'}
    `('shows "$expected" for minOccurs=$minOccurs with message "$message"', async ({ label, minOccurs, message, expected }: any) => {
      const maxOccurs = Math.max(3, minOccurs + 1);
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label },
            minOccurs,
            maxOccurs,
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
              { name: 'opt3', fieldOptions: { label: 'Option 3' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: message } },
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text()).toContain(expected);
    });

    it('falls back to configure.generateMessage when no settings message is provided', async () => {
      configure({
        generateMessage: ctx =>
          `${ctx.field}: needs ${(ctx.rule?.params as unknown[])?.[0]} choice(s)`,
      });

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Picker' },
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          settings: { messages: {} },
        },
      });

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text())
        .toContain('Picker: needs 1 choice(s)');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Optional choice — minOccurs=0
  // ─────────────────────────────────────────────────────────────────────────
  describe('optional choice — minOccurs=0', () => {
    function mountOptionalChoice() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            minOccurs: 0,
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'At least {min} required' } },
        },
      });
    }

    it('shows no error when neither child is filled on submit', async () => {
      const wrapper = mountOptionalChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('shows no error when one child has a value', async () => {
      const wrapper = mountOptionalChoice();

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Disabled choice — maxOccurs=0
  // ─────────────────────────────────────────────────────────────────────────
  describe('disabled choice — maxOccurs=0', () => {
    function mountDisabledChoice() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            maxOccurs: 0,
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'At least {min} required' } },
        },
      });
    }

    it('shows no validation error on submit', async () => {
      const wrapper = mountDisabledChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Multi-slot choice — minOccurs=2, maxOccurs=3 (children rendered as arrays)
  // ─────────────────────────────────────────────────────────────────────────
  describe('multi-slot choice — minOccurs=2, maxOccurs=3 (children as arrays)', () => {
    function mountMultiSlotChoice() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick Two' },
            minOccurs: 2,
            maxOccurs: 3,
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'At least {min} of {field} required' } },
        },
      });
    }

    it('shows error when 0 slots are filled (< 2 required)', async () => {
      const wrapper = mountMultiSlotChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text())
        .toContain('At least 2 of Pick Two required');
    });

    it('shows error when only 1 slot is filled (< 2 required)', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.opt1-add-button"]').trigger('click');
      await flushPromises();

      await wrapper.findAll('input')[0].setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text())
        .toContain('At least 2 of Pick Two required');
    });

    it('shows no error when 2 different children each have a value (2 slots filled)', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.opt1-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.opt2-add-button"]').trigger('click');
      await flushPromises();

      const inputs = wrapper.findAll('input');
      await inputs[0].setValue('hello');
      await inputs[1].setValue('world');

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('error disappears once minOccurs is met and reappears when a value is cleared', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      await wrapper.find('[data-testid="pick.opt1-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.opt2-add-button"]').trigger('click');
      await flushPromises();

      const inputs = wrapper.findAll('input');
      await inputs[0].setValue('hello');
      await inputs[1].setValue('world');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      await inputs[1].setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Single child — choice logic bypassed, child validates independently
  // ─────────────────────────────────────────────────────────────────────────
  describe('single child choice — choice logic bypassed', () => {
    it('no choice-level error shown on submit when child is empty', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
          }],
          settings: { messages: { choiceMinOccurs: 'Choice error' } },
        },
      });

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('the single child still validates as required (minOccurs=1)', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
          }],
          settings: {},
        },
      });

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.only-error-message"]').exists()).toBe(true);
    });

    it('no error when the single child has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
          }],
          settings: {},
        },
      });

      await wrapper.find('[id="pick.only"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.only-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Nested choices — choice whose branches are themselves choice fields
  // ─────────────────────────────────────────────────────────────────────────
  describe('nested choices — each branch is itself a choice field', () => {
    function mountNestedChoices() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'outer',
            fieldOptions: { label: 'Outer Choice' },
            choice: [
              {
                name: 'branchA',
                fieldOptions: { label: 'Branch A' },
                choice: [
                  { name: 'a1', fieldOptions: { label: 'A1' } },
                  { name: 'a2', fieldOptions: { label: 'A2' } },
                ],
              },
              {
                name: 'branchB',
                fieldOptions: { label: 'Branch B' },
                choice: [
                  { name: 'b1', fieldOptions: { label: 'B1' } },
                  { name: 'b2', fieldOptions: { label: 'B2' } },
                ],
              },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'At least {min} required in {field}' } },
        },
      });
    }

    it('outer choice shows error when nothing is filled', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').text())
        .toContain('At least 1 required in Outer Choice');
    });

    it('inner branches show no error on submit when nothing filled — minOccursOverride=0 propagated from outer', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer.branchA-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="outer.branchB-error-message"]').exists()).toBe(false);
    });

    it('filling a1 clears the outer error', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Multi-layer — outer choice with group children that contain inner choices
  // ─────────────────────────────────────────────────────────────────────────
  describe('multi-layer — group children each containing an inner choice field', () => {
    function mountMultiLayerChoice() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'outer',
            fieldOptions: { label: 'Outer Choice' },
            choice: [
              {
                name: 'group1',
                fieldOptions: { label: 'Group 1' },
                children: [{
                  name: 'innerA',
                  fieldOptions: { label: 'Inner A' },
                  choice: [
                    { name: 'a1', fieldOptions: { label: 'A1' }, restriction: { minLength: 3 } },
                    { name: 'a2', fieldOptions: { label: 'A2' } },
                  ],
                }],
              },
              {
                name: 'group2',
                fieldOptions: { label: 'Group 2' },
                children: [{
                  name: 'innerB',
                  fieldOptions: { label: 'Inner B' },
                  choice: [
                    { name: 'b1', fieldOptions: { label: 'B1' } },
                    { name: 'b2', fieldOptions: { label: 'B2' } },
                  ],
                }],
              },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'At least {min} required in {field}', minLength: 'Min length of {field} is {length}' } },
        },
      });
    }

    it('outer shows error on submit when nothing is filled', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').text())
        .toContain('At least 1 required in Outer Choice');
    });

    it('inner choices show no error — minOccursOverride=0 propagates from outer through the group', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      // Both inner choices should be optional (no errors) since their parent groups are optional
      expect(wrapper.find('[data-testid="outer.group1.innerA-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="outer.group2.innerB-error-message"]').exists()).toBe(false);
    });

    it('filling a1 (inside group1.innerA) clears the outer error, but also validates', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('h');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer.group1.innerA.a1-error-message"]').text())
        .toContain('Min length of A1 is 3');

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(false);

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer.group1.innerA.a1-error-message"]').exists())
        .toBe(false);
    });

    it('inner choice of the active group shows error when its own selection is missing', async () => {
      // Activate group1 by giving innerA a value, then clear it so innerA has no value
      // but group1 is now the "active" choice (outer knows group1 has values)
      // In this edge case: innerA becomes required (minOccursOverride clears once group1 is active)
      const wrapper = mountMultiLayerChoice();

      // Fill a1 to make group1 active
      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();

      // Clear a1 — outer still knows group1 "was" selected but now group1.valuesCount=0
      // → outer resets group1's minOccursOverride to 0 (optional again)
      // → innerA becomes optional again (no error shown)
      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      // innerA is optional again (outer treats group1 as unchosen), no innerA error
      expect(wrapper.find('[data-testid="outer.group1.innerA-error-message"]').exists()).toBe(false);
      // outer error reappears since no group is chosen
      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Explicit selection — xsd_choiceMinOccurs parity
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — xsd_choiceMinOccurs parity', () => {
    function mountExplicitRequiredChoice() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
              { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'Pick at least {min} in {field}' } },
        },
      });
    }

    it('shows an error when nothing is selected on submit', async () => {
      const wrapper = mountExplicitRequiredChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text())
        .toContain('Pick at least 1 in Pick One');
    });

    it('clears the error the moment a branch is selected, even with no field inside it filled in', async () => {
      const wrapper = mountExplicitRequiredChoice();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('reappears when switching away from the only selected branch', async () => {
      const wrapper = mountExplicitRequiredChoice();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
    });

    it('the selected branch\'s own required fields still validate independently of the choice-level error', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
              {
                name: 'guidedRollout',
                fieldOptions: { label: 'Guided Rollout' },
                children: [{ name: 'contactEmail', fieldOptions: { label: 'Contact Email' } }],
              },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'Choice required' } },
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      // Selection alone satisfies the choice-level minimum...
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
      // ...but the branch's own required field still enforces its own content independently.
      expect(wrapper.find('[data-testid="pick.guidedRollout.contactEmail-error-message"]').exists()).toBe(true);
    });

    // ───────────────────────────────────────────────────────────────────────
    // maxOccurs > 1, placed beside the maxOccurs:1 cases above so both
    // cardinalities are visible side by side.
    // ───────────────────────────────────────────────────────────────────────
    describe('maxOccurs > 1', () => {
      function mountExplicitRequiredRepeatableChoice() {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 3,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
            settings: { messages: { choiceMinOccurs: 'Pick at least {min} in {field}' } },
          },
        });
      }

      it('shows an error when nothing is added on submit', async () => {
        const wrapper = mountExplicitRequiredRepeatableChoice();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="pick-error-message"]').text())
          .toContain('Pick at least 1 in Pick Several');
      });

      it('clears the error the moment an occurrence is added, even with no field inside it filled in', async () => {
        const wrapper = mountExplicitRequiredRepeatableChoice();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
      });

      it('reappears once the only occurrence is removed again', async () => {
        const wrapper = mountExplicitRequiredRepeatableChoice();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);
      });

      it('the occurrence\'s own required fields still validate independently once the occurrence holds some data', async () => {
        // An occurrence is an array item (part-of-array-field), so — matching plain array-item
        // semantics elsewhere in the codebase — its own children stay optional until the
        // occurrence holds any data at all; once it does, its own required fields enforce their
        // content independently of the (already-satisfied) choice-level minimum.
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 3,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                {
                  name: 'apiEndpoint',
                  maxOccurs: 2,
                  fieldOptions: { label: 'Api Endpoint' },
                  children: [
                    { name: 'url', fieldOptions: { label: 'Url' } },
                    { name: 'token', fieldOptions: { label: 'Token' } },
                  ],
                },
                { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
            settings: { messages: { choiceMinOccurs: 'Choice required' } },
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.apiEndpoint[0].token"]').setValue('secret');
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        // Adding the occurrence alone satisfies the choice-level minimum...
        expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
        // ...but the occurrence's own required field still enforces its own content, once touched.
        expect(wrapper.find('[data-testid="pick.apiEndpoint[0].url-error-message"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="pick.apiEndpoint[0].token-error-message"]').exists()).toBe(false);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9b. Explicit selection — xsd_choiceMinOccurs counts in choice-occurrence units
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — xsd_choiceMinOccurs counts in choice-occurrence units', () => {
    function mountChoiceUnitValidation() {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            minOccurs: 2,
            maxOccurs: 5,
            fieldOptions: { label: 'Pick Several' },
            choice: [
              { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
              { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
            ],
          }],
          settings: { messages: { choiceMinOccurs: 'Pick at least {min}' } },
        },
      });
    }

    it('2 items of one maxOccurs:2 branch count as 1 choice occurrence, still below minOccurs:2', async () => {
      const wrapper = mountChoiceUnitValidation();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').text()).toContain('Pick at least 2');
    });

    it('adding an item of a second branch satisfies the minimum', async () => {
      const wrapper = mountChoiceUnitValidation();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('a third item of the first branch also satisfies the minimum (2 choice slots consumed)', async () => {
      const wrapper = mountChoiceUnitValidation();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Explicit selection — single-branch degenerate case
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — single-branch degenerate case', () => {
    it('shows the choice-level required error before selection, then validates the branch\'s own field after selection', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick One' },
            choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
          }],
          settings: { messages: { choiceMinOccurs: 'Choice required' } },
        },
      });

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').text()).toContain('Choice required');

      await wrapper.find('[data-testid="pick.only-add-choice-button"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.only-error-message"]').exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 11. Preserve-on-switch — touched/validation reset
  // ─────────────────────────────────────────────────────────────────────────
  describe('preserve-on-switch — touched/validation reset', () => {
    function mountPreserveOnSwitchRequiredChoice() {
      const metadata = enablePreserveOnSwitch([{
        name: 'pick',
        explicitChoiceSelection: true,
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
          { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
        ],
      }], 'pick');

      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata,
          settings: { messages: { required: '{field} is required' } },
        },
      });
    }

    it('a restored field is a genuinely fresh field registration: touched resets to false, and it is valid with no stale error carried over', async () => {
      const wrapper = mountPreserveOnSwitchRequiredChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      const input = wrapper.find('[id="pick.selfServe"]');
      await input.setValue('hello');
      await input.trigger('blur');
      await flushPromises();

      const idBeforeSwitch = setupState(wrapper, 'pick.selfServe')?.fieldContext.meta.id;
      expect(setupState(wrapper, 'pick.selfServe')?.fieldContext.meta.touched).toBe(true);

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      // The restored data is present...
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('hello');
      // ...as a genuinely new field registration (a fresh vee-validate field id, not the same
      // instance that was touched before switching away)...
      expect(setupState(wrapper, 'pick.selfServe')?.fieldContext.meta.id).not.toBe(idBeforeSwitch);
      // ...so its own touched flag is fresh, not carried over from before the switch.
      expect(setupState(wrapper, 'pick.selfServe')?.fieldContext.meta.touched).toBe(false);
      // No stale error carries over either: the restored value is valid.
      expect(setupState(wrapper, 'pick.selfServe')?.fieldContext.meta.valid).toBe(true);
      expect(wrapper.find('[data-testid="pick.selfServe-error-message"]').exists()).toBe(false);
    });

    it('companion: restoring a stash where a required field was left empty shows no error immediately after restore', async () => {
      const wrapper = mountPreserveOnSwitchRequiredChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      // selfServe is left empty on purpose.

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.selfServe-error-message"]').exists()).toBe(false);
    });
  });
});
