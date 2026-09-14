import type { Metadata } from '@/examples/TestFormTemplate.vue';
import type { ComputedPropsFieldOf } from '@/types/FieldMetadata';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { removeNullValues } from '@/utils/removeNullValues';
import { formValues } from './DynamicFormItem.test-helpers';
import { activeChoiceOccurrences, canAddChoiceOccurrence, childValuesEntry, enablePreserveOnSwitch, findDynamicFormItemChoiceByPath, occurrenceBranchKey } from './DynamicFormItemChoice.test-helpers';

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

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Explicit selection — maxOccurs:1 (ST-01 foundation)
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — maxOccurs:1 (ST-01)', () => {
    function mountExplicitSingleChoice(extraProps: Record<string, any> = {}) {
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
          ...extraProps,
        },
      });
    }

    // --- AC1: auto mode regression baseline ---
    it('(AC1) renders byte-identical html whether explicitChoiceSelection is absent or explicitly false', async () => {
      const metadataWithoutFlag = [{
        name: 'pick',
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'opt1', fieldOptions: { label: 'Option 1' } },
          { name: 'opt2', fieldOptions: { label: 'Option 2' } },
        ],
      }];
      const metadataWithFalseFlag = structuredClone(metadataWithoutFlag)
        .map(m => ({ ...m, explicitChoiceSelection: false }));

      const wrapperWithoutFlag = mount(TestForm, { attachTo: document.body, props: { metadata: metadataWithoutFlag } });
      const wrapperWithFalseFlag = mount(TestForm, { attachTo: document.body, props: { metadata: metadataWithFalseFlag } });
      await flushPromises();

      expect(wrapperWithFalseFlag.html()).toBe(wrapperWithoutFlag.html());
    });

    // --- AC2 ---
    it('(AC2) renders no branch and activeChoiceOccurrences is empty when nothing is selected', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      const choiceComp = findDynamicFormItemChoiceByPath(wrapper, 'pick');
      expect(choiceComp).toBeDefined();
      expect(choiceComp!.findAllComponents({ name: 'DynamicFormItem' })).toHaveLength(0);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
    });

    // --- AC3 ---
    it('(AC3) addChoiceOccurrence selects a branch immediately with no value required', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    // --- AC4 ---
    it('(AC4) switching branches clears the deselected branch and mounts the new one', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(formValues(wrapper).pick).toEqual({ selfServe: undefined, guidedRollout: undefined });
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(true);
      expect(childValuesEntry(wrapper, 'pick', 'selfServe')).toEqual({ occurrences: 0, valuesCount: 0 });
    });

    // --- AC5 ---
    it('(AC5) removeChoiceOccurrence deselects the active branch', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
    });

    // --- AC7 ---
    it('(AC7) canAddChoiceOccurrence is false for every branch when the choice is disabled', async () => {
      const wrapper = mountExplicitSingleChoice({
        metadata: [{
          name: 'pick',
          maxOccurs: 0,
          explicitChoiceSelection: true,
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
            { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
          ],
        }],
      });
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').attributes('disabled')).toBeDefined();
      expect(wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').attributes('disabled')).toBeDefined();
    });

    it('(AC7) canAddChoiceOccurrence is true for an enabled choice, before and after a selection', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').attributes('disabled')).toBeUndefined();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').attributes('disabled')).toBeUndefined();
    });

    // --- AC8 ---
    describe('(AC8) single-branch choice bypasses the singleChild fast path when explicit', () => {
      it('nothing renders until addChoiceOccurrence is called, then the sole branch mounts', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              fieldOptions: { label: 'Pick One' },
              choice: [{ name: 'only', fieldOptions: { label: 'Only Option' } }],
            }],
          },
        });
        await flushPromises();

        expect(wrapper.find('[id="pick.only"]').exists()).toBe(false);

        await wrapper.find('[data-testid="pick.only-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.only"]').exists()).toBe(true);
      });

      it('regression: with the flag absent, the existing singleChild fast path is unchanged', async () => {
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
        await flushPromises();

        expect(wrapper.find('[id="pick.only"]').exists()).toBe(true);
      });
    });

    // --- AC9 ---
    describe('(AC9) explicitChoiceSelection is static metadata, not computed', () => {
      it('runtime: a computedProps mutation of explicitChoiceSelection (via an as any cast) has no effect on the render mode', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              fieldOptions: { label: 'Pick One' },
              computedProps: [(thisField: any) => {
                thisField.explicitChoiceSelection = false;
              }],
              choice: [
                { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
                { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
              ],
            }],
          },
        });
        await flushPromises();

        // Still explicit: nothing rendered until addChoiceOccurrence is called.
        expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
        expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(false);

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      });

      it('type-level: explicitChoiceSelection is not assignable inside computedProps', () => {
        // Checked by vue-tsc during `pnpm typecheck` / `pnpm ci`. If explicitChoiceSelection is
        // ever re-added to ComputedPropsFieldType, this line stops erroring and vue-tsc fails
        // with TS2578 (unused '@ts-expect-error' directive).
        function typeCheckOnly(thisField: ComputedPropsFieldOf<Metadata>) {
          // @ts-expect-error explicitChoiceSelection is excluded from ComputedPropsFieldType
          thisField.explicitChoiceSelection = true;
        }
        expect(typeof typeCheckOnly).toBe('function');
      });
    });

    // --- AC11 ---
    describe('(AC11) choice inside an array occurrence (maxOccurs:1)', () => {
      function mountChoiceInArray() {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'projectContacts',
              maxOccurs: 2,
              minOccurs: 0,
              autoAddMinOccurs: false,
              fieldOptions: { label: 'Project Contacts' },
              children: [{
                name: 'method',
                explicitChoiceSelection: true,
                minOccurs: 0,
                fieldOptions: { label: 'Method' },
                choice: [
                  { name: 'email', fieldOptions: { label: 'Email' } },
                  { name: 'phone', fieldOptions: { label: 'Phone' } },
                ],
              }],
            }],
          },
        });
      }

      it('each contact\'s selection and clearing resolves through its own pathOverride, without leaking into the other', async () => {
        const wrapper = mountChoiceInArray();
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts[0].method.email-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts[1].method.phone-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="projectContacts[0].method.email"]').exists()).toBe(true);
        expect(wrapper.find('[id="projectContacts[1].method.email"]').exists()).toBe(false);
        expect(wrapper.find('[id="projectContacts[1].method.phone"]').exists()).toBe(true);
        expect(wrapper.find('[id="projectContacts[0].method.phone"]').exists()).toBe(false);

        expect(activeChoiceOccurrences(wrapper, 'projectContacts[0].method')).toEqual([{ branchKey: 'email', index: 0 }]);
        expect(activeChoiceOccurrences(wrapper, 'projectContacts[1].method')).toEqual([{ branchKey: 'phone', index: 0 }]);
      });
    });

    // --- Edge cases ---
    describe('edge cases', () => {
      it('calling addChoiceOccurrence twice in a row with the same branch is idempotent', async () => {
        const wrapper = mountExplicitSingleChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
        expect(wrapper.findAllComponents({ name: 'DynamicFormItem' }).filter(c => (c.vm as any).$.setupState?.path === 'pick.selfServe')).toHaveLength(1);
      });

      it('addChoiceOccurrence/removeChoiceOccurrence/canAddChoiceOccurrence no-op for an unknown branchKey', async () => {
        const wrapper = mountExplicitSingleChoice();
        await flushPromises();

        expect(() => {
          const state = findDynamicFormItemChoiceByPath(wrapper, 'pick');
          (state!.vm as any).$.setupState.addChoiceOccurrence('doesNotExist');
          (state!.vm as any).$.setupState.removeChoiceOccurrence('doesNotExist');
        }).not.toThrow();
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);

        const choiceComp = findDynamicFormItemChoiceByPath(wrapper, 'pick');
        expect((choiceComp!.vm as any).$.setupState.canAddChoiceOccurrence('doesNotExist')).toBe(false);
      });

      it('loading saved data: a branch that already has a value renders even though addChoiceOccurrence was never called', async () => {
        const wrapper = mountExplicitSingleChoice({
          initialValues: { pick: { selfServe: 'hello' } },
        });
        await flushPromises();

        expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
      });

      it('removeChoiceOccurrence is a no-op for a branch that exists but is not currently active', async () => {
        const wrapper = mountExplicitSingleChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        // guidedRollout exists on the metadata but was never selected.
        await wrapper.find('[data-testid="pick.guidedRollout-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
        expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      });

      it('addChoiceOccurrence does not crash when the previously selected branch no longer exists in a replaced metadata array', async () => {
        const metadata = [{
          name: 'pick',
          explicitChoiceSelection: true,
          fieldOptions: { label: 'Pick One' },
          choice: [
            { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
            { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
          ],
        }];
        const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        // Replace the metadata array so 'selfServe' no longer exists as a branch.
        await wrapper.setProps({
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick One' },
            choice: [
              { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
              { name: 'apiEndpoint', fieldOptions: { label: 'Api Endpoint' } },
            ],
          }],
        });
        await flushPromises();

        expect(() => {
          const state = findDynamicFormItemChoiceByPath(wrapper, 'pick');
          (state!.vm as any).$.setupState.addChoiceOccurrence('apiEndpoint');
        }).not.toThrow();
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);
      });
    });

    // --- AC10 ---
    it('(AC10) post-switch residue matches the accepted contract, and removeNullValues prunes it', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.guidedRollout"]').setValue('world');
      await flushPromises();

      const values = formValues(wrapper);
      expect(values.pick).toEqual({ selfServe: undefined, guidedRollout: 'world' });
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'guidedRollout', index: 0 }]);

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      // The residual `selfServe: undefined` key does not affect the required-choice validation.
      expect(wrapper.find('[data-testid="pick-error-message"]').exists()).toBe(false);

      const cleaned = removeNullValues(values)!;
      expect(cleaned.pick).toEqual({ guidedRollout: 'world' });
      expect('selfServe' in cleaned.pick).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9b. Preserve-on-switch — maxOccurs:1 (ST-05)
  // ─────────────────────────────────────────────────────────────────────────
  describe('preserve-on-switch (ST-05)', () => {
    function baseMetadata() {
      return [{
        name: 'pick',
        explicitChoiceSelection: true,
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
          { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
          { name: 'apiEndpoint', fieldOptions: { label: 'Api Endpoint' } },
        ],
      }];
    }

    function mountPreserveOnSwitchChoice(extraProps: Record<string, any> = {}) {
      const metadata = enablePreserveOnSwitch(baseMetadata(), 'pick');
      return mount(TestForm, {
        attachTo: document.body,
        props: { metadata, ...extraProps },
      });
    }

    // --- AC1: default behaviour unchanged (opt-in, defaulted off) ---
    describe('(AC1) default behaviour is unchanged', () => {
      it('1a. flag absent: switching away clears (ST-01 residue), and switching back renders empty, not restored', async () => {
        const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: baseMetadata() } });
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.selfServe"]').setValue('hello');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.selfServe).toBeUndefined();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      });

      it('1b. flag explicitly false: identical to absent', async () => {
        const metadata = enablePreserveOnSwitch(baseMetadata(), 'pick', false);
        const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.selfServe"]').setValue('hello');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.selfServe).toBeUndefined();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      });
    });

    // --- AC2 + AC3 (joint, per the QA plan) ---
    it('(AC2/AC3) stashes before clearing, and switching back restores the stashed data', async () => {
      const wrapper = mountPreserveOnSwitchChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      // AC2: the residue shape at the moment of stashing is byte-identical to the flag-off shape.
      expect(formValues(wrapper).pick.selfServe).toBeUndefined();
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      // AC3: restored, guidedRollout unmounted, exactly one branch mounted.
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('hello');
      expect(formValues(wrapper).pick.selfServe).toBe('hello');
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(false);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    // --- AC5: pure ephemeral UI state ---
    // Only the metadata-declared branch names may appear as keys of `pick` — no extra,
    // stash-shaped key (e.g. `_stash`/`stashedBranchValues`) is ever allowed to leak in. This is
    // deliberately NOT an exact-key-set check: which branch keys are present at any given moment
    // is governed by vee-validate's own field (un)registration lifecycle (out of this story's
    // scope), not by the stash feature: the stash itself never touches `values` at all.
    describe('(AC5) the stash never appears in values', () => {
      const declaredBranchNames = ['selfServe', 'guidedRollout', 'apiEndpoint'];

      function expectOnlyDeclaredBranchKeys(wrapper: ReturnType<typeof mount>) {
        expect(Object.keys(formValues(wrapper))).toEqual(['pick']);
        expect(Object.keys(formValues(wrapper).pick).every(key => declaredBranchNames.includes(key))).toBe(true);
      }

      it('5a/5b. no stash-shaped key at stash time or restore time', async () => {
        const wrapper = mountPreserveOnSwitchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.selfServe"]').setValue('hello');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();

        expectOnlyDeclaredBranchKeys(wrapper);

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expectOnlyDeclaredBranchKeys(wrapper);
        expect(formValues(wrapper).pick.selfServe).toBe('hello');
      });

      it('5c. the values object submit would receive carries no stash-shaped key either', async () => {
        const wrapper = mountPreserveOnSwitchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.selfServe"]').setValue('hello');
        await flushPromises();
        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expectOnlyDeclaredBranchKeys(wrapper);

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expectOnlyDeclaredBranchKeys(wrapper);
        expect(formValues(wrapper).pick.selfServe).toBe('hello');
      });
    });

    // --- Edge cases ---
    describe('edge cases', () => {
      it('only the most recent stash per branch is kept; restore-then-edit-then-switch-again keeps latest data', async () => {
        const wrapper = mountPreserveOnSwitchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.selfServe"]').setValue('A');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('A');

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();
        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('A');

        await wrapper.find('[id="pick.selfServe"]').setValue('B');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('B');
      });

      it('empty branch stashed: switching back renders empty with no error/crash, same shape as a fresh empty selection', async () => {
        const wrapper = mountPreserveOnSwitchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
        expect(formValues(wrapper).pick.selfServe).toBeUndefined();
      });

      it('first-ever selection, no stash exists: mounts empty with no throw and no attempted restore', async () => {
        const wrapper = mountPreserveOnSwitchChoice();
        await flushPromises();

        // apiEndpoint has never been deselected before, so no stash entry exists for it.
        await expect(
          wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click'),
        ).resolves.not.toThrow();
        await flushPromises();

        expect(wrapper.find('[id="pick.apiEndpoint"]').exists()).toBe(true);
        expect((wrapper.find('[id="pick.apiEndpoint"]').element as HTMLInputElement).value).toBe('');
      });

      it('per-instance isolation inside an array (decision 6): each contact restores its own stash, not the other\'s', async () => {
        const metadata = enablePreserveOnSwitch([{
          name: 'projectContacts',
          maxOccurs: 2,
          minOccurs: 0,
          autoAddMinOccurs: false,
          fieldOptions: { label: 'Project Contacts' },
          children: [{
            name: 'method',
            explicitChoiceSelection: true,
            minOccurs: 0,
            fieldOptions: { label: 'Method' },
            choice: [
              { name: 'email', fieldOptions: { label: 'Email' } },
              { name: 'phone', fieldOptions: { label: 'Phone' } },
            ],
          }],
        }], 'projectContacts.method');

        const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();

        // Contact 0: fill email, switch to phone (stashes contact 0's email data).
        await wrapper.find('[data-testid="projectContacts[0].method.email-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="projectContacts[0].method.email"]').setValue('contact0@example.com');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts[0].method.phone-add-choice-button"]').trigger('click');
        await flushPromises();

        // Contact 1: fill phone with a different value, switch to email (stashes contact 1's phone data).
        await wrapper.find('[data-testid="projectContacts[1].method.phone-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="projectContacts[1].method.phone"]').setValue('+1-555-0100');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts[1].method.email-add-choice-button"]').trigger('click');
        await flushPromises();

        // Switch contact 0 back to email: restores contact 0's original value.
        await wrapper.find('[data-testid="projectContacts[0].method.email-add-choice-button"]').trigger('click');
        await flushPromises();
        expect((wrapper.find('[id="projectContacts[0].method.email"]').element as HTMLInputElement).value).toBe('contact0@example.com');

        // Switch contact 1 back to phone: restores contact 1's original value.
        await wrapper.find('[data-testid="projectContacts[1].method.phone-add-choice-button"]').trigger('click');
        await flushPromises();
        expect((wrapper.find('[id="projectContacts[1].method.phone"]').element as HTMLInputElement).value).toBe('+1-555-0100');
      });

      it('sanity: the flag has no effect on a maxOccurs > 1 choice (out of scope, ST-02\'s own path)', async () => {
        const metadata = enablePreserveOnSwitch([{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 3,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
            { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
          ],
        }], 'pick');

        const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.apiEndpoint[0]"]').setValue('first');
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect((wrapper.find('[id="pick.apiEndpoint[0]"]').element as HTMLInputElement).value).toBe('');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Explicit selection — maxOccurs > 1 (ST-02)
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — maxOccurs>1 (ST-02)', () => {
    function mountExplicitRepeatableChoice(extraProps: Record<string, any> = {}) {
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
          ...extraProps,
        },
      });
    }

    // --- AC1 ---
    it('(AC1) adding an occurrence pushes a real placeholder item into the branch\'s array', async () => {
      const wrapper = mountExplicitRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.apiEndpoint[0]"]').exists()).toBe(true);
      expect((wrapper.find('[id="pick.apiEndpoint[0]"]').element as HTMLInputElement).value).toBe('');
      expect(formValues(wrapper).pick.apiEndpoint).toEqual([null]);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);
    });

    // --- AC2 ---
    describe('(AC2) canAddChoiceOccurrence respects both the branch\'s own maxOccurs and the shared choice budget', () => {
      it('disables only the branch whose own maxOccurs is reached, leaving siblings addable', async () => {
        const wrapper = mountExplicitRepeatableChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')).toBe(false);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(true);
      });

      it('disables every branch once the shared choice budget is exhausted, even with room left in a branch\'s own cap', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 2,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 3, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 3, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')).toBe(false);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(false);
      });
    });

    // --- AC3 ---
    it('(AC3) removeChoiceOccurrence(branchKey, index) removes the specified occurrence and shifts the remaining one down', async () => {
      const wrapper = mountExplicitRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[id="pick.apiEndpoint[0]"]').setValue('first');
      await flushPromises();
      await wrapper.find('[id="pick.apiEndpoint[1]"]').setValue('second');
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(formValues(wrapper).pick.apiEndpoint).toEqual(['second']);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);
    });

    // --- AC4 ---
    it('(AC4) activeChoiceOccurrences is grouped by branch declaration order, then index within branch', async () => {
      const wrapper = mountExplicitRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
      await flushPromises();

      const expectedOrder = [
        { branchKey: 'apiEndpoint', index: 0 },
        { branchKey: 'crmExport', index: 0 },
        { branchKey: 'crmExport', index: 1 },
      ];
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual(expectedOrder);

      // Re-derive purely from the resulting value tree (no ephemeral ordering state persisted).
      const remounted = mountExplicitRepeatableChoice({ initialValues: formValues(wrapper) });
      await flushPromises();

      expect(activeChoiceOccurrences(remounted, 'pick')).toEqual(expectedOrder);
    });

    // --- AC6 ---
    it('(AC6) the *-choice-item slot receives branchKey, and its removeItem calls through to removeChoiceOccurrence', async () => {
      const wrapper = mountExplicitRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(occurrenceBranchKey(wrapper, 'pick.apiEndpoint[0]')).toBe('apiEndpoint');

      await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(formValues(wrapper).pick.apiEndpoint).toEqual([]);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
    });

    // --- AC7 ---
    describe('(AC7) choice-in-array, maxOccurs > 1 reindex safety', () => {
      function mountChoiceInsideRepeatableArray() {
        return mount(TestForm, {
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
      }

      it('the surviving choice keeps tracking the reindexed path after an earlier sibling array item is removed', async () => {
        const wrapper = mountChoiceInsideRepeatableArray();
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts-add-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts[2].certifications.basic-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts[2].certifications.basic-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="projectContacts[0]-remove-button"]:not(.invisible)').trigger('click');
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'projectContacts[1].certifications')).toEqual([
          { branchKey: 'basic', index: 0 },
          { branchKey: 'basic', index: 1 },
        ]);
        expect(wrapper.find('[id="projectContacts[1].certifications.basic[0]"]').exists()).toBe(true);
        expect(wrapper.find('[id="projectContacts[1].certifications.basic[1]"]').exists()).toBe(true);
        expect(wrapper.find('[id="projectContacts[2].certifications.basic[0]"]').exists()).toBe(false);
        expect(formValues(wrapper).projectContacts[1].certifications.basic).toHaveLength(2);

        await wrapper.find('[data-testid="projectContacts[1].certifications.advanced-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="projectContacts[1].certifications.advanced[0]"]').exists()).toBe(true);
        expect(wrapper.find('[id="projectContacts[2].certifications.advanced[0]"]').exists()).toBe(false);
      });
    });

    // --- Edge cases ---
    describe('edge cases', () => {
      it('removing the last occurrence of a branch that had exhausted the shared budget frees room for other branches reactively', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 2,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 3, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 3, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(false);

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(true);
      });

      it('removeChoiceOccurrence with an out-of-range index is a no-op, no throw', async () => {
        const wrapper = mountExplicitRepeatableChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        const choiceComp = findDynamicFormItemChoiceByPath(wrapper, 'pick');
        expect(() => {
          (choiceComp!.vm as any).$.setupState.removeChoiceOccurrence('apiEndpoint', 99);
        }).not.toThrow();
        await flushPromises();

        expect(formValues(wrapper).pick.apiEndpoint).toHaveLength(1);
        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);
      });
    });
  });
});
