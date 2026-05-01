import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { formValues } from './DynamicFormItem.test-helpers';

function addButton(wrapper: ReturnType<typeof mount>, path: string) {
  return wrapper.find(`[data-testid="${path}-add-button"]`);
}

function removeButton(wrapper: ReturnType<typeof mount>, path: string) {
  return wrapper.find(`[data-testid="${path}-remove-button"]:not(.invisible)`);
}

function findDynamicFormItemByPath(wrapper: ReturnType<typeof mount>, path: string) {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItem' })
    .find(component => (component.vm as any).$.setupState.path === path);

  expect(item).toBeDefined();
  return item!;
}

function findDynamicFormItemArrayByPath(wrapper: ReturnType<typeof mount>, path: string) {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItemArray' })
    .find(component => (component.vm as any).$.setupState.path === path);

  expect(item).toBeDefined();
  return item!;
}

describe('component DynamicFormItemChoice - logic', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Simple choice — two text inputs (minOccurs=1 default, maxOccurs=1 default)
  // ─────────────────────────────────────────────────────────────────────────
  describe('simple choice — two text inputs (minOccurs=1, maxOccurs=1)', () => {
    function mountSimpleChoice() {
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
        },
      });
    }

    it('both inputs start enabled', async () => {
      const wrapper = mountSimpleChoice();
      await flushPromises();

      expect(wrapper.find('[id="pick.opt1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeUndefined();
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

    it('re-enables the sibling input when the active value is cleared', async () => {
      const wrapper = mountSimpleChoice();

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();

      await wrapper.find('[id="pick.opt1"]').setValue('');
      await flushPromises();

      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeUndefined();
    });

    it('preserves the active child state when the metadata reference changes', async () => {
      const metadata = [{
        name: 'pick',
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'opt1', fieldOptions: { label: 'Option 1' } },
          { name: 'opt2', fieldOptions: { label: 'Option 2' } },
        ],
      }];
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata },
      });
      await flushPromises();

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();
      expect(formValues(wrapper).pick?.opt1).toBe('hello');

      await wrapper.setProps({
        metadata: structuredClone(metadata),
      });
      await flushPromises();

      expect((wrapper.find('[id="pick.opt1"]').element as HTMLInputElement).value).toBe('hello');
      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();
      expect(formValues(wrapper).pick?.opt1).toBe('hello');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Disabled choice — maxOccurs=0
  // ─────────────────────────────────────────────────────────────────────────
  describe('disabled choice — maxOccurs=0', () => {
    it('renders all children as disabled', async () => {
      const wrapper = mount(TestForm, {
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
        },
      });
      await flushPromises();

      expect(wrapper.find('[id="pick.opt1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="pick.opt2"]').attributes('disabled')).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Single child — choice disable logic bypassed
  // ─────────────────────────────────────────────────────────────────────────
  describe('single child — choice disable logic bypassed', () => {
    it('single child is never disabled even when it has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
          }],
        },
      });

      await wrapper.find('[id="pick.only"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="pick.only"]').attributes('disabled')).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Multi-slot choice — minOccurs=2, maxOccurs=3 (children rendered as arrays)
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

      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(true);
      expect(addButton(wrapper, 'pick.opt2').exists()).toBe(true);
    });

    it('clicking add creates an input and shows a remove button for that occurrence', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();

      expect(wrapper.findAll('input')).toHaveLength(1);
      expect(removeButton(wrapper, 'pick.opt1[0]').exists()).toBe(true);
    });

    it('hides all add buttons once one child consumes all shared choice slots', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();

      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(false);
      expect(addButton(wrapper, 'pick.opt2').exists()).toBe(false);
    });

    it('restores add capacity for both children after removing an occurrence', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(false);

      await removeButton(wrapper, 'pick.opt1[0]').trigger('click');
      await flushPromises();

      expect(wrapper.findAll('input')).toHaveLength(2);
      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(true);
      expect(addButton(wrapper, 'pick.opt2').exists()).toBe(true);
    });

    it('keeps both child add buttons available while shared capacity remains', async () => {
      const wrapper = mountMultiSlotChoice();
      await flushPromises();

      await addButton(wrapper, 'pick.opt1').trigger('click');
      await flushPromises();
      await addButton(wrapper, 'pick.opt2').trigger('click');
      await flushPromises();

      expect(wrapper.findAll('input')).toHaveLength(2);
      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(true);
      expect(addButton(wrapper, 'pick.opt1').exists()).toBe(true);
    });
  });

  describe('index', () => {
    it('sets the index for each choice child based on its position in the choice collection', async () => {
      const wrapper = mount(TestForm, {
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
        },
      });
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'pick.opt1').props('index')).toBe(0);
      expect(findDynamicFormItemByPath(wrapper, 'pick.opt2').props('index')).toBe(1);
    });

    it('forwards the choice child index to array children', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick' },
            choice: [
              {
                name: 'items',
                type: 'text',
                fieldOptions: { label: 'Items' },
                maxOccurs: 2,
              },
              {
                name: 'codes',
                type: 'text',
                fieldOptions: { label: 'Codes' },
                maxOccurs: 2,
              },
            ],
          }],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemArrayByPath(wrapper, 'pick.items').props('index')).toBe(0);
      expect(findDynamicFormItemArrayByPath(wrapper, 'pick.codes').props('index')).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Nested choices — choice whose branches are themselves choice fields
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
        },
      });
    }

    it('all branch inputs are enabled initially', async () => {
      const wrapper = mountNestedChoices();
      await flushPromises();

      expect(wrapper.find('[id="outer.branchA.a1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.branchA.a2"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.branchB.b2"]').attributes('disabled')).toBeUndefined();
    });

    it('filling a1 disables all branchB inputs', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.branchB.b2"]').attributes('disabled')).toBeDefined();
    });

    it('filling a1 also disables a2 within branchA\'s own inner choice', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="outer.branchA.a2"]').attributes('disabled')).toBeDefined();
    });

    it('filling b2 disables all branchA inputs', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchB.b2"]').setValue('world');
      await flushPromises();

      expect(wrapper.find('[id="outer.branchA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.branchA.a2"]').attributes('disabled')).toBeDefined();
    });

    it('re-enables the other branch after clearing the active value', async () => {
      const wrapper = mountNestedChoices();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('hello');
      await flushPromises();
      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeDefined();

      await wrapper.find('[id="outer.branchA.a1"]').setValue('');
      await flushPromises();

      expect(wrapper.find('[id="outer.branchB.b1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.branchB.b2"]').attributes('disabled')).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Multi-layer — outer choice with group children that contain inner choices
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
          }],
        },
      });
    }

    it('all inputs are enabled initially', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.group2.innerB.b1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.group2.innerB.b2"]').attributes('disabled')).toBeUndefined();
    });

    it('filling a1 (inside group1.innerA) disables group2 and its inner choice inputs', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[id="outer.group2.innerB.b1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group2.innerB.b2"]').attributes('disabled')).toBeDefined();
    });

    it('filling b1 (inside group2.innerB) disables group1 and its inner choice inputs', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group2.innerB.b1"]').setValue('world');
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeDefined();
    });

    it('group2 inputs re-enable after a1 is cleared', async () => {
      const wrapper = mountMultiLayerChoice();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();
      expect(wrapper.find('[id="outer.group2.innerB.b1"]').attributes('disabled')).toBeDefined();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('');
      await flushPromises();

      expect(wrapper.find('[id="outer.group2.innerB.b1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.group2.innerB.b2"]').attributes('disabled')).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. computedProps / childFields — choice options accessible to parent
  // ─────────────────────────────────────────────────────────────────────────
  describe('computedProps / childFields', () => {
    it('choice options are accessible in the parent field childFields', async () => {
      let capturedPaths: string[] = [];
      mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            computedProps: [(_f, _v, childFields) => {
              capturedPaths = childFields.value.map(c => c.path as string).filter(Boolean);
            }],
            choice: [
              { name: 'opt1', fieldOptions: { label: 'Option 1' } },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
        },
      });
      await flushPromises();

      expect(capturedPaths).toContain('pick.opt1');
      expect(capturedPaths).toContain('pick.opt2');
    });

    it('re-computes when a choice option computed field changes', async () => {
      let updateCount = 0;
      let hiddenChildCount = 0;
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick One' },
            computedProps: [(_f, _v, childFields) => {
              updateCount++;
              hiddenChildCount = childFields.value.filter(c => c.hidden).length;
            }],
            choice: [
              {
                name: 'opt1',
                fieldOptions: { label: 'Option 1' },
                computedProps: [(f, v) => {
                  if (v.value === 'hide-me')
                    f.hidden = true;
                }],
              },
              { name: 'opt2', fieldOptions: { label: 'Option 2' } },
            ],
          }],
        },
      });
      await flushPromises();

      expect(hiddenChildCount).toBe(0);
      const countBeforeChange = updateCount;

      await wrapper.find('[id="pick.opt1"]').setValue('hide-me');
      await flushPromises();

      expect(updateCount).toBeGreaterThan(countBeforeChange);
      expect(hiddenChildCount).toBe(1);
    });

    it('hides a parent group in view mode when its direct choice child has no value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          initialEdit: false,
          hideFieldsWithoutValue: true,
          metadata: [{
            name: 'contact',
            type: 'heading',
            fieldOptions: { label: 'Contact' },
            children: [{
              name: 'preferred',
              minOccurs: 0,
              fieldOptions: { label: 'Preferred Contact' },
              choice: [
                { name: 'email', fieldOptions: { label: 'Email' }, minOccurs: 0 },
                { name: 'phone', fieldOptions: { label: 'Phone' }, minOccurs: 0 },
              ],
            }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.text()).not.toContain('Contact');
      expect(wrapper.text()).not.toContain('Preferred Contact');
    });

    it('keeps a parent group visible in view mode when its direct choice child has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          initialEdit: false,
          hideFieldsWithoutValue: true,
          initialValues: {
            contact: {
              preferred: {
                email: 'john@example.com',
              },
            },
          },
          metadata: [{
            name: 'contact',
            type: 'heading',
            fieldOptions: { label: 'Contact' },
            children: [{
              name: 'preferred',
              minOccurs: 0,
              fieldOptions: { label: 'Preferred Contact' },
              choice: [
                { name: 'email', fieldOptions: { label: 'Email' }, minOccurs: 0 },
                { name: 'phone', fieldOptions: { label: 'Phone' }, minOccurs: 0 },
              ],
            }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.text()).toContain('Contact');
      expect(wrapper.text()).toContain('Preferred Contact');
      expect((wrapper.find('[id="contact.preferred.email"]').element as HTMLInputElement).value).toBe('john@example.com');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Multi-layer — outer choice with group children that contain inner choices
  // ─────────────────────────────────────────────────────────────────────────
  describe('multi-layer — group children each containing an inner choice field and arrays', () => {
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
                maxOccurs: 3,
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
        },
      });
    }

    it('shows the grouped array add button initially, while no array occurrence inputs are rendered yet', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').exists()).toBe(true);
      expect(addButton(wrapper, 'outer.group2').exists()).toBe(true);
      expect(wrapper.find('[id="outer.group2[0].innerB.b1"]').exists()).toBe(false);
      expect(wrapper.find('[id="outer.group2[0].innerB.b2"]').exists()).toBe(false);
    });

    it('clicking the grouped array add button renders the first occurrence and its remove button', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      await addButton(wrapper, 'outer.group2').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="outer.group2[0].innerB.b1"]').exists()).toBe(true);
      expect(wrapper.find('[id="outer.group2[0].innerB.b2"]').exists()).toBe(true);
      expect(removeButton(wrapper, 'outer.group2[0]').exists()).toBe(true);
    });

    it('adding an empty group2 occurrence reserves the outer choice slot and disables group1 while keeping group2 capacity available', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      await addButton(wrapper, 'outer.group2').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeDefined();
      expect(addButton(wrapper, 'outer.group2').exists()).toBe(true);
    });

    it('removing the empty group2 occurrence re-enables group1 and restores the add button', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      await addButton(wrapper, 'outer.group2').trigger('click');
      await flushPromises();
      await removeButton(wrapper, 'outer.group2[0]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeUndefined();
      expect(addButton(wrapper, 'outer.group2').exists()).toBe(true);
      expect(wrapper.find('[id="outer.group2[0].innerB.b1"]').exists()).toBe(false);
    });

    it('filling a1 disables the grouped array branch before any occurrence is added', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      await wrapper.find('[id="outer.group1.innerA.a1"]').setValue('hello');
      await flushPromises();

      expect(addButton(wrapper, 'outer.group2').exists()).toBe(false);
    });

    it('filling group2 inner choice input disables group1 and the sibling input in the same inner choice', async () => {
      const wrapper = mountMultiLayerChoice();
      await flushPromises();

      await addButton(wrapper, 'outer.group2').trigger('click');
      await flushPromises();
      await wrapper.find('[id="outer.group2[0].innerB.b1"]').setValue('world');
      await flushPromises();

      expect(wrapper.find('[id="outer.group1.innerA.a1"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group1.innerA.a2"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[id="outer.group2[0].innerB.b2"]').attributes('disabled')).toBeDefined();
    });
  });

  describe('fieldContext.value', () => {
    it('reflects all choice option values', async () => {
      const wrapper = mount(TestForm, {
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
        },
      });
      await flushPromises();

      const choiceComp = wrapper.findAllComponents({ name: 'DynamicFormItemChoice' })
        .find(c => (c.vm as any).$.setupState.normalizedPath === 'pick');
      const { fieldContext } = (choiceComp?.vm as any).$.setupState;

      expect(fieldContext.value.value).toEqual([undefined, undefined]);

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();

      expect(fieldContext.value.value[0]).toBe('hello');
    });

    it('updates reactively when the active option changes', async () => {
      const wrapper = mount(TestForm, {
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
        },
      });
      await flushPromises();

      const choiceComp = wrapper.findAllComponents({ name: 'DynamicFormItemChoice' })
        .find(c => (c.vm as any).$.setupState.normalizedPath === 'pick');
      const { fieldContext } = (choiceComp?.vm as any).$.setupState;

      await wrapper.find('[id="pick.opt1"]').setValue('hello');
      await flushPromises();
      expect(fieldContext.value.value[0]).toBe('hello');

      await wrapper.find('[id="pick.opt1"]').setValue('');
      await flushPromises();

      expect(fieldContext.value.value[0]).toBeUndefined();
    });
  });

  describe('slotProps', () => {
    it('forwards slot attributes added by the choice template to nested array children', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            fieldOptions: { label: 'Pick' },
            choice: [{
              name: 'items',
              type: 'text',
              fieldOptions: { label: 'Items' },
              maxOccurs: 2,
            }],
          }],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemArrayByPath(wrapper, 'pick.items').props('slotProps')).toEqual({
        belowChoiceField: true,
        level: 1,
      });
    });
  });
});
