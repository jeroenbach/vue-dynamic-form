import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';

describe('component DynamicFormItemChoice', () => {
  afterEach(() => {
    configure({ generateMessage: undefined as any });
  });

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
          }] as any,
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

    it('disables opt2 when opt1 has a value', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();
    });

    it('disables opt1 when opt2 has a value', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[id="pick.opt2"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="pick.opt1"]').attributes('disabled')).toBeDefined();
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
          }] as any,
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
          }] as any,
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
          }] as any,
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
          }] as any,
          settings: { messages: { choiceMinOccurs: 'At least {min} required' } },
        },
      });
    }

    it('renders all children as disabled', async () => {
      const wrapper = mountDisabledChoice();
      await flushPromises();

      expect(wrapper.find('[id="pick.opt1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();
    });

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
          }] as any,
          settings: { messages: { choiceMinOccurs: 'At least {min} of {field} required' } },
        },
      });
    }

    it('children start with 0 items — no auto-add since partOfChoiceField=true', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      expect(wrapper.findAll('input')).toHaveLength(0);
    });

    it('shows one add button per child initially', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      // Add buttons are <IconButton> inside <label> in the #array template
      expect(wrapper.findAll('label > button[tabindex="-1"]')).toHaveLength(2);
    });

    it('clicking the add button on a child creates a new input for that child', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      const [addOpt1] = wrapper.findAll('label > button[tabindex="-1"]');
      await addOpt1.trigger('click');
      await flushPromises();

      expect(wrapper.findAll('input')).toHaveLength(1);
    });

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

      const [addOpt1] = wrapper.findAll('label > button[tabindex="-1"]');
      await addOpt1.trigger('click');
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

      const addButtons = wrapper.findAll('label > button[tabindex="-1"]');
      await addButtons[0].trigger('click');
      await flushPromises();
      await addButtons[1].trigger('click');
      await flushPromises();

      const inputs = wrapper.findAll('input');
      await inputs[0].setValue('hello');
      await inputs[1].setValue('world');

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);
    });

    it('opt2 add button disappears after opt1 fills all 3 available choice slots', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      const [addOpt1] = wrapper.findAll('label > button[tabindex="-1"]');

      await addOpt1.trigger('click');
      await flushPromises();
      await addOpt1.trigger('click');
      await flushPromises();
      await addOpt1.trigger('click');
      await flushPromises();

      const inputs = wrapper.findAll('input');
      await inputs[0].setValue('a');
      await inputs[1].setValue('b');
      await inputs[2].setValue('c');
      await flushPromises();

      // opt2's add button should be gone (overrideChildMaxOccurrences = 0)
      expect(wrapper.findAll('label > button[tabindex="-1"]')).toHaveLength(0);
    });

    it('error disappears once minOccurs is met and reappears when a value is cleared', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(true);

      const addButtons = wrapper.findAll('label > button[tabindex="-1"]');
      await addButtons[0].trigger('click');
      await flushPromises();
      await addButtons[1].trigger('click');
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
          }] as any,
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
          }] as any,
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
          }] as any,
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
          }] as any,
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

    it('filling a1 disables all branchB inputs', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.branchB.b2"]').attributes('disabled')).toBeDefined();
    });

    it('filling b2 clears the outer error and disables all branchA inputs', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchB.b2"]').setValue('world');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[id="outer.branchA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.branchA.a2"]').attributes('disabled')).toBeDefined();
    });

    it('outer error reappears and branches re-enable after clearing the active value', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(true);
      // branchB should be re-enabled (no longer disabled)
      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeUndefined();
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
                    { name: 'a1', fieldOptions: { label: 'A1' } },
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
          }] as any,
          settings: { messages: { choiceMinOccurs: 'At least {min} required in {field}' } },
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

    it('filling a1 (inside group1.innerA) clears the outer error', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(false);
    });

    it('filling a1 disables group2 and its inner choice inputs', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();

      // group2 is disabled → its inner choice inputs are also disabled
      expect(wrapper.find('[id="outer.group2.innerB.b1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group2.innerB.b2"]').attributes('disabled')).toBeDefined();
    });

    it('filling b1 (inside group2.innerB) clears outer error and disables group1', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group2.innerB.b1"]').setValue('world');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="outer-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeDefined();
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
});
