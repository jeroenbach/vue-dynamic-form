import type { Metadata } from '@/examples/TestFormTemplate.vue';
import type { ComputedPropsFieldOf } from '@/types/FieldMetadata';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { removeNullValues } from '@/utils/removeNullValues';
import { formValues } from './DynamicFormItem.test-helpers';
import { activeChoiceOccurrences, canAddChoiceOccurrence, childValuesEntry, enableDisplayOrder, enablePreserveOnSwitch, enablePreserveOrder, findDynamicFormItemChoiceByPath, insertionOrdersMap, occurrenceBranchKey, occurrenceGlobalIndex, occurrenceInsertionOrder, renderedChoiceOccurrences, usedChoiceOccurrences } from './DynamicFormItemChoice.test-helpers';

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
  // 9. Explicit selection — maxOccurs:1
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — maxOccurs:1', () => {
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

    // --- Auto mode regression baseline ---
    it('renders byte-identical html whether explicitChoiceSelection is absent or explicitly false', async () => {
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

    it('renders no branch and activeChoiceOccurrences is empty when nothing is selected', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      const choiceComp = findDynamicFormItemChoiceByPath(wrapper, 'pick');
      expect(choiceComp).toBeDefined();
      expect(choiceComp!.findAllComponents({ name: 'DynamicFormItem' })).toHaveLength(0);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
    });

    it('addChoiceOccurrence selects a branch immediately with no value required', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    it('switching branches clears the deselected branch and mounts the new one', async () => {
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

    it('removeChoiceOccurrence deselects the active branch', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
    });

    it('canAddChoiceOccurrence is false for every branch when the choice is disabled', async () => {
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

    it('canAddChoiceOccurrence is true for an enabled choice, before and after a selection', async () => {
      const wrapper = mountExplicitSingleChoice();
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').attributes('disabled')).toBeUndefined();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').attributes('disabled')).toBeUndefined();
    });

    describe('single-branch choice bypasses the singleChild fast path when explicit', () => {
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

    describe('explicitChoiceSelection is static metadata, not computed', () => {
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

    describe('choice inside an array occurrence (maxOccurs:1)', () => {
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

    it('post-switch residue matches the accepted contract, and removeNullValues prunes it', async () => {
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
  // 9b. Preserve-on-switch — maxOccurs:1
  // ─────────────────────────────────────────────────────────────────────────
  describe('preserve-on-switch', () => {
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

    // --- Default behaviour unchanged (opt-in, defaulted off) ---
    describe('default behaviour is unchanged', () => {
      it('1a. flag absent: switching away clears, and switching back renders empty, not restored', async () => {
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

    it('stashes before clearing, and switching back restores the stashed data', async () => {
      const wrapper = mountPreserveOnSwitchChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('hello');
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      // The residue shape at the moment of stashing is byte-identical to the flag-off shape.
      expect(formValues(wrapper).pick.selfServe).toBeUndefined();
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      // Restored: guidedRollout unmounted, exactly one branch mounted.
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('hello');
      expect(formValues(wrapper).pick.selfServe).toBe('hello');
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(false);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    // Regression: a branch with children reads back as an object (a Vue reactive Proxy) rather
    // than a primitive. Stashing used structuredClone, which throws a DataCloneError on a Proxy,
    // so switching away from a filled object-valued branch aborted mid-switch and the selection
    // could never be changed again. The leaf-branch tests above never caught this because their
    // stashed values are plain strings.
    it('stash and restore also work for a branch with children (object value, reactive Proxy)', async () => {
      const metadata = enablePreserveOnSwitch([{
        name: 'pick',
        explicitChoiceSelection: true,
        fieldOptions: { label: 'Pick One' },
        choice: [
          {
            name: 'homeDelivery',
            fieldOptions: { label: 'Home Delivery' },
            children: [
              { name: 'street', fieldOptions: { label: 'Street' } },
              { name: 'city', fieldOptions: { label: 'City' } },
            ],
          },
          {
            name: 'pickupPoint',
            fieldOptions: { label: 'Pickup Point' },
            children: [
              { name: 'pointId', fieldOptions: { label: 'Point Id' } },
            ],
          },
        ],
      }], 'pick');
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
      await flushPromises();

      await wrapper.find('[data-testid="pick.homeDelivery-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.homeDelivery.street"]').setValue('Main Street 1');
      await wrapper.find('[id="pick.homeDelivery.city"]').setValue('Amsterdam');
      await flushPromises();

      // Switching away must actually happen (this is the call that used to throw) …
      await wrapper.find('[data-testid="pick.pickupPoint-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(formValues(wrapper).pick.homeDelivery).toBeUndefined();
      expect(wrapper.find('[id="pick.homeDelivery.street"]').exists()).toBe(false);
      expect(wrapper.find('[id="pick.pickupPoint.pointId"]').exists()).toBe(true);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'pickupPoint', index: 0 }]);

      // … and switching back restores the whole object.
      await wrapper.find('[data-testid="pick.homeDelivery-add-choice-button"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('[id="pick.homeDelivery.street"]').element as HTMLInputElement).value).toBe('Main Street 1');
      expect((wrapper.find('[id="pick.homeDelivery.city"]').element as HTMLInputElement).value).toBe('Amsterdam');
      expect(formValues(wrapper).pick.homeDelivery).toEqual({ street: 'Main Street 1', city: 'Amsterdam' });
    });

    // --- Pure ephemeral UI state ---
    // Only the metadata-declared branch names may appear as keys of `pick` — no extra,
    // stash-shaped key (e.g. `_stash`/`stashedBranchValues`) is ever allowed to leak in. This is
    // deliberately NOT an exact-key-set check: which branch keys are present at any given moment
    // is governed by vee-validate's own field (un)registration lifecycle, not by the stash
    // feature: the stash itself never touches `values` at all.
    describe('the stash never appears in values', () => {
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

      it('per-instance isolation inside an array: each contact restores its own stash, not the other\'s', async () => {
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

      it('sanity: the flag has no effect on a maxOccurs > 1 choice', async () => {
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
  // 10. Explicit selection — maxOccurs > 1
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — maxOccurs>1', () => {
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

    it('adding an occurrence pushes a real placeholder item into the branch\'s array', async () => {
      const wrapper = mountExplicitRepeatableChoice();
      await flushPromises();

      await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[id="pick.apiEndpoint[0]"]').exists()).toBe(true);
      expect((wrapper.find('[id="pick.apiEndpoint[0]"]').element as HTMLInputElement).value).toBe('');
      expect(formValues(wrapper).pick.apiEndpoint).toEqual([null]);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);
    });

    // The occurrence's own slot also receives addItem/canAddItems (wired to the choice
    // primitives, scoped to that occurrence's branch), so an occurrence behaves like a regular
    // array item, including through the -array-item fallback slots.
    describe('occurrence-level addItem/canAddItems', () => {
      it('addItem on an occurrence appends another occurrence of that occurrence\'s own branch', async () => {
        const wrapper = mountExplicitRepeatableChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[id="pick.apiEndpoint[1]"]').exists()).toBe(true);
        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([
          { branchKey: 'apiEndpoint', index: 0 },
          { branchKey: 'apiEndpoint', index: 1 },
        ]);
        expect(formValues(wrapper).pick.crmExport ?? []).toEqual([]);
      });

      it('canAddItems turns false (add button hides) when the branch\'s budget is exhausted', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 2,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 1, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 1, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="pick.apiEndpoint[0]-add-choice-button"]').exists()).toBe(true);

        // Second occurrence consumes the last shared slot: every add affordance disappears.
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(wrapper.find('[data-testid="pick.apiEndpoint[0]-add-choice-button"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="pick.apiEndpoint[1]-add-choice-button"]').exists()).toBe(false);

        // Removing one occurrence frees the slot and the affordance returns.
        await wrapper.find('[data-testid="pick.apiEndpoint[1]-remove-choice-button"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="pick.apiEndpoint[0]-add-choice-button"]').exists()).toBe(true);
      });
    });

    describe('canAddChoiceOccurrence follows XSD batching: a branch\'s own maxOccurs is the slot size, not an independent total cap', () => {
      // choice.maxOccurs=5, branch maxOccurs 1 and 2: every 2 "pair" items consume 1 of the 5
      // shared slots, so up to 10 "pair" items fit when "single" is empty.
      function mountXsdBatchingChoice() {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 5,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'single', maxOccurs: 1, fieldOptions: { label: 'Single' } },
                { name: 'pair', maxOccurs: 2, fieldOptions: { label: 'Pair' } },
              ],
            }],
          },
        });
      }

      async function addOccurrence(wrapper: ReturnType<typeof mount>, branchKey: string) {
        await wrapper.find(`[data-testid="pick.${branchKey}-add-choice-button"]`).trigger('click');
        await flushPromises();
      }

      it('allows up to 10 items of the maxOccurs:2 branch when the other branch is empty', async () => {
        const wrapper = mountXsdBatchingChoice();
        await flushPromises();

        for (let i = 0; i < 10; i++)
          await addOccurrence(wrapper, 'pair');

        expect(formValues(wrapper).pick.pair).toHaveLength(10);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'pair')).toBe(false);
      });

      it('8 items of the maxOccurs:2 branch (4 slots) leave exactly 1 shared slot for the other branch', async () => {
        const wrapper = mountXsdBatchingChoice();
        await flushPromises();

        for (let i = 0; i < 8; i++)
          await addOccurrence(wrapper, 'pair');

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'single')).toBe(true);
        await addOccurrence(wrapper, 'single');

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'single')).toBe(false);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'pair')).toBe(false);
      });

      it('adding a second item of the maxOccurs:2 branch consumes exactly one shared slot, not two', async () => {
        const wrapper = mountXsdBatchingChoice();
        await flushPromises();

        await addOccurrence(wrapper, 'pair');
        await addOccurrence(wrapper, 'pair');

        expect(usedChoiceOccurrences(wrapper, 'pick')).toBe(1);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'single')).toBe(true);
      });
    });

    describe('maxOccursTotal — opt-in non-XSD per-branch cap', () => {
      function mountWithCap() {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 5,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 1, maxOccursTotal: 3, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 1, maxOccursTotal: 3, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
      }

      it('disables only the capped branch once its raw item count reaches maxOccursTotal, leaving the sibling addable', async () => {
        const wrapper = mountWithCap();
        await flushPromises();

        for (let i = 0; i < 3; i++)
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')).toBe(false);
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(true);
      });

      it('removing an item below the cap re-enables the add reactively', async () => {
        const wrapper = mountWithCap();
        await flushPromises();

        for (let i = 0; i < 3; i++) {
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();
        }
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')).toBe(false);

        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')).toBe(true);
      });

      it('clamps the auto-mode array headroom to maxOccursTotal even when the shared choice budget would allow more', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              maxOccurs: 5,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 1, maxOccursTotal: 2, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', maxOccurs: 1, fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
        await flushPromises();

        await addButton(wrapper, 'pick.apiEndpoint').trigger('click');
        await flushPromises();
        await addButton(wrapper, 'pick.apiEndpoint').trigger('click');
        await flushPromises();

        expect(addButton(wrapper, 'pick.apiEndpoint').exists()).toBe(false);
        expect(addButton(wrapper, 'pick.crmExport').exists()).toBe(true);
      });
    });

    it('removeChoiceOccurrence(branchKey, index) removes the specified occurrence and shifts the remaining one down', async () => {
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

    it('removeChoiceOccurrence(branchKey) with no index removes the last occurrence, symmetric with addChoiceOccurrence(branchKey)', async () => {
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

      // The slot-level "Remove apiEndpoint" button passes no index; it must drop the last occurrence.
      await wrapper.find('[data-testid="pick.apiEndpoint-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(formValues(wrapper).pick.apiEndpoint).toEqual(['first']);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'apiEndpoint', index: 0 }]);

      await wrapper.find('[data-testid="pick.apiEndpoint-remove-choice-button"]').trigger('click');
      await flushPromises();

      // Removing the final occurrence empties the branch; a further click is a no-op, no throw.
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
      expect(() => wrapper.find('[data-testid="pick.apiEndpoint-remove-choice-button"]').trigger('click')).not.toThrow();
    });

    it('activeChoiceOccurrences is grouped by branch declaration order, then index within branch', async () => {
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

    it('the *-choice-array-item slot receives branchKey, and its removeItem calls through to removeChoiceOccurrence', async () => {
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

    describe('choice-in-array, maxOccurs > 1 reindex safety', () => {
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

    describe('globalIndex', () => {
      function mountExplicitRepeatableObjectBranchChoice(extraProps: Record<string, any> = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 4,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                {
                  name: 'apiEndpoint',
                  maxOccurs: 2,
                  fieldOptions: { label: 'Api Endpoint' },
                  children: [{ name: 'url', type: 'text', fieldOptions: { label: 'URL' } }],
                },
                {
                  name: 'crmExport',
                  maxOccurs: 2,
                  fieldOptions: { label: 'Crm Export' },
                  children: [{ name: 'system', type: 'text', fieldOptions: { label: 'System' } }],
                },
              ],
            }],
            ...extraProps,
          },
        });
      }

      it('reflects each occurrence\'s cross-branch position in activeChoiceOccurrences (grouped) order, not add-press order', async () => {
        const wrapper = mountExplicitRepeatableChoice();
        await flushPromises();

        // Press order deliberately does not match grouped order, proving globalIndex follows
        // activeChoiceOccurrences (branch declaration order, then index within branch), not clicks.
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[1]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(2);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(3);

        // Same values read directly off the internal prop: no drift between the internal
        // forwarding value and what the slot actually receives.
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[0]').props('globalIndex')).toBe(0);
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[1]').props('globalIndex')).toBe(1);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[0]').props('globalIndex')).toBe(2);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[1]').props('globalIndex')).toBe(3);
      });

      it('removal renumbers survivors live, with no order/index value written to values', async () => {
        const wrapper = mountExplicitRepeatableObjectBranchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[id="pick.apiEndpoint[0].url"]').setValue('first');
        await flushPromises();
        await wrapper.find('[id="pick.apiEndpoint[1].url"]').setValue('second');
        await flushPromises();
        await wrapper.find('[id="pick.crmExport[0].system"]').setValue('salesforce');
        await flushPromises();
        await wrapper.find('[id="pick.crmExport[1].system"]').setValue('hubspot');
        await flushPromises();

        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[1]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(2);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(3);

        // Remove the occurrence at globalIndex 1.
        await wrapper.find('[data-testid="pick.apiEndpoint[1]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(2);
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[0]').props('globalIndex')).toBe(0);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[0]').props('globalIndex')).toBe(1);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[1]').props('globalIndex')).toBe(2);

        const values = formValues(wrapper);
        for (const occurrence of values.pick.apiEndpoint)
          expect(Object.keys(occurrence)).toEqual(['url']);
        for (const occurrence of values.pick.crmExport)
          expect(Object.keys(occurrence)).toEqual(['system']);

        // A submit-capture round-trip introduces no extra key either.
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        const submittedValues = formValues(wrapper);
        for (const occurrence of submittedValues.pick.apiEndpoint)
          expect(Object.keys(occurrence)).toEqual(['url']);
        for (const occurrence of submittedValues.pick.crmExport)
          expect(Object.keys(occurrence)).toEqual(['system']);
      });

      it('leaves the per-branch index prop unaffected while globalIndex counts across all branches', async () => {
        const wrapper = mountExplicitRepeatableChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[0]').props('index')).toBe(0);
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[1]').props('index')).toBe(1);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[0]').props('index')).toBe(0);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[1]').props('index')).toBe(1);

        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[0]').props('globalIndex')).toBe(0);
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[1]').props('globalIndex')).toBe(1);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[0]').props('globalIndex')).toBe(2);
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[1]').props('globalIndex')).toBe(3);
      });

      it('introduces no globalIndex on a maxOccurs:1 explicit choice, which never renders through the -choice-array-item slot', async () => {
        const wrapper = mount(TestForm, {
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
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(findDynamicFormItemByPath(wrapper, 'pick.selfServe').props('globalIndex')).toBeUndefined();
        expect(wrapper.find('[data-testid="pick.selfServe-global-index"]').exists()).toBe(false);
      });

      it('is undefined on a plain (non-choice) repeatable array item', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'items',
              type: 'text',
              maxOccurs: 2,
              fieldOptions: { label: 'Items' },
            }],
          },
        });
        await flushPromises();

        await wrapper.find('[data-testid="items-add-button"]').trigger('click');
        await flushPromises();

        expect(findDynamicFormItemByPath(wrapper, 'items[0]').props('globalIndex')).toBeUndefined();
        expect(wrapper.find('[data-testid="items[0]-global-index"]').exists()).toBe(false);
      });

      it('is undefined on a non-explicit (automatic) choice\'s branch', async () => {
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

        expect(findDynamicFormItemByPath(wrapper, 'pick.opt1').props('globalIndex')).toBeUndefined();
        expect(wrapper.find('[data-testid="pick.opt1-global-index"]').exists()).toBe(false);
      });

      it('is undefined on a top-level plain field with no array/choice ancestry', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{ name: 'sibling', fieldOptions: { label: 'Sibling' } }],
          },
        });
        await flushPromises();

        expect(findDynamicFormItemByPath(wrapper, 'sibling').props('globalIndex')).toBeUndefined();
      });

      it('stays correct through a reindexing ancestor array: the ancestor\'s reindex does not affect this choice\'s own globalIndex', async () => {
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
        await wrapper.find('[data-testid="projectContacts[1].certifications.basic-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="projectContacts[1].certifications.advanced-add-choice-button"]').trigger('click');
        await flushPromises();

        // Grouped order: both basic occurrences first (declared before advanced), then advanced.
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[1].certifications.basic[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[1].certifications.basic[1]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[1].certifications.advanced[0]')).toBe(2);

        await wrapper.find('[data-testid="projectContacts[0]-remove-button"]:not(.invisible)').trigger('click');
        await flushPromises();

        // Same globalIndex values; only the path prefix changed (projectContacts[1] -> [0]).
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[0].certifications.basic[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[0].certifications.basic[1]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'projectContacts[0].certifications.advanced[0]')).toBe(2);
      });

      describe('edge cases', () => {
        it('does not run the -choice-array-item loop and renders no globalIndex testid when there are zero active occurrences', async () => {
          const wrapper = mountExplicitRepeatableChoice();
          await flushPromises();

          expect(wrapper.find('[data-testid="pick.apiEndpoint[0]-global-index"]').exists()).toBe(false);
          expect(wrapper.find('[data-testid="pick.crmExport[0]-global-index"]').exists()).toBe(false);
        });

        it('is 0 for exactly one active occurrence', async () => {
          const wrapper = mountExplicitRepeatableChoice();
          await flushPromises();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(0);
        });

        it('counts across the whole merged list, not restarting per branch and not following add-press order', async () => {
          const wrapper = mountExplicitRepeatableChoice();
          await flushPromises();

          // Press order: crmExport, crmExport, apiEndpoint (deliberately not matching grouped order).
          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(1);
          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(2);
        });
      });
    });

    describe('insertionOrder / displayOrder', () => {
      function scalarChoiceMetadata(): Metadata[] {
        return [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 3,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
            { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
          ],
        }];
      }

      function objectBranchChoiceMetadata(): Metadata[] {
        return [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 4,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            {
              name: 'apiEndpoint',
              maxOccurs: 2,
              fieldOptions: { label: 'Api Endpoint' },
              children: [{ name: 'url', type: 'text', fieldOptions: { label: 'URL' } }],
            },
            {
              name: 'crmExport',
              maxOccurs: 2,
              fieldOptions: { label: 'Crm Export' },
              children: [{ name: 'system', type: 'text', fieldOptions: { label: 'System' } }],
            },
          ],
        }];
      }

      function mountObjectBranchChoice(extraProps: Record<string, any> = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: { metadata: objectBranchChoiceMetadata(), ...extraProps },
        });
      }

      function assertNoInsertionOrderKeyAnywhere(value: unknown) {
        if (Array.isArray(value)) {
          value.forEach(assertNoInsertionOrderKeyAnywhere);
          return;
        }
        if (value && typeof value === 'object') {
          expect(Object.keys(value as object)).not.toContain('insertionOrder');
          Object.values(value as object).forEach(assertNoInsertionOrderKeyAnywhere);
        }
      }

      describe('default is byte-identical to today (displayOrder absent or grouped)', () => {
        it('renders byte-identical html whether displayOrder is absent or explicitly grouped', async () => {
          const absent = mountExplicitRepeatableChoice({ metadata: scalarChoiceMetadata() });
          const grouped = mountExplicitRepeatableChoice({ metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'grouped') });
          await flushPromises();

          async function runSequence(wrapper: ReturnType<typeof mount>) {
            await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.crmExport[0]-remove-choice-button"]').trigger('click');
            await flushPromises();
          }

          await runSequence(absent);
          await runSequence(grouped);

          expect(grouped.html()).toBe(absent.html());
        });

        it('renderedChoiceOccurrences equals activeChoiceOccurrences in membership and order at every step', async () => {
          const wrapper = mountExplicitRepeatableChoice({ metadata: scalarChoiceMetadata() });
          await flushPromises();

          function assertEqualAtCurrentStep() {
            expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual(activeChoiceOccurrences(wrapper, 'pick'));
          }

          assertEqualAtCurrentStep();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          assertEqualAtCurrentStep();

          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();
          assertEqualAtCurrentStep();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          assertEqualAtCurrentStep();

          await wrapper.find('[data-testid="pick.crmExport[0]-remove-choice-button"]').trigger('click');
          await flushPromises();
          assertEqualAtCurrentStep();
        });

        it('globalIndex values over the render list are unaffected when displayOrder is absent', async () => {
          const wrapper = mountExplicitRepeatableChoice({ metadata: scalarChoiceMetadata() });
          await flushPromises();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
          expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[1]')).toBe(1);
          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(2);
          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(3);
        });
      });

      it('assigns insertionOrder at add-press time, in press order, across branches', async () => {
        const wrapper = mountExplicitRepeatableChoice({ metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added') });
        await flushPromises();

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(occurrenceInsertionOrder(wrapper, 'pick.crmExport[0]')).toBe(1);
        expect(occurrenceInsertionOrder(wrapper, 'pick.apiEndpoint[0]')).toBe(2);
        expect(occurrenceInsertionOrder(wrapper, 'pick.crmExport[1]')).toBe(3);
      });

      it('leaves insertionOrder undefined for occurrences already present when the form mounts', async () => {
        const wrapper = mountExplicitRepeatableChoice({
          metadata: scalarChoiceMetadata(),
          initialValues: { pick: { apiEndpoint: [null], crmExport: [null] } },
        });
        await flushPromises();

        expect(wrapper.find('[data-testid="pick.apiEndpoint[0]-insertion-order"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="pick.crmExport[0]-insertion-order"]').exists()).toBe(false);
        expect(findDynamicFormItemByPath(wrapper, 'pick.apiEndpoint[0]').props('insertionOrder')).toBeUndefined();
        expect(findDynamicFormItemByPath(wrapper, 'pick.crmExport[0]').props('insertionOrder')).toBeUndefined();
      });

      it('never writes insertionOrder into form values, keeping the counter instance-local', async () => {
        const wrapper = mountObjectBranchChoice();
        await flushPromises();

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        const values = formValues(wrapper);
        expect(Object.keys(values.pick.apiEndpoint[0])).toEqual(['url']);
        expect(Object.keys(values.pick.crmExport[0])).toEqual(['system']);
        expect(Object.keys(values.pick.crmExport[1])).toEqual(['system']);
        assertNoInsertionOrderKeyAnywhere(values);

        expect(insertionOrdersMap(wrapper, 'pick')).toBeInstanceOf(Map);

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        const submittedValues = formValues(wrapper);
        assertNoInsertionOrderKeyAnywhere(submittedValues);
      });

      it('sorts the render list with a deterministic two-key comparator when mixing loaded and added occurrences, repeatably', async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          const wrapper = mountExplicitRepeatableChoice({
            metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added'),
            initialValues: { pick: { apiEndpoint: [null], crmExport: [null] } },
          });

          await flushPromises();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');

          await flushPromises();

          expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual([
            { branchKey: 'apiEndpoint', index: 0 },
            { branchKey: 'crmExport', index: 0 },
            { branchKey: 'crmExport', index: 1 },
          ]);
        }
      });

      it('derives globalIndex from the displayed sequence, not the grouped one, when interleaving makes the two diverge', async () => {
        // apiEndpoint is declared first, so its grouped position is 0; crmExport[0] is loaded
        // (no insertionOrder) at grouped position 1. Adding a new apiEndpoint occurrence gives it
        // an insertionOrder, moving it into the numbered group after crmExport[0] in the displayed
        // sequence, deliberately reversing the two occurrences' relative order versus grouped.
        const wrapper = mountExplicitRepeatableChoice({
          metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added'),
          initialValues: { pick: { crmExport: [null] } },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([
          { branchKey: 'apiEndpoint', index: 0 },
          { branchKey: 'crmExport', index: 0 },
        ]);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(1);
      });

      describe('displayOrder is static, read once at setup', () => {
        it('a computedProps mutation of displayOrder (via an as any cast) after mount does not affect the already-captured render order', async () => {
          // DynamicFormItemChoice captures displayOrder once, at its own setup: the very first
          // computedField evaluation happens before that capture, so a mutation applied there
          // would show up in the initial render (a separate concern from this test). What this
          // test pins is the actual guarantee: once mounted, a *later* computedProps-driven
          // mutation (forced here via computeOnChildValueChange, triggered by adding an
          // occurrence) can no longer reach the already-fixed static capture.
          let recomputeCount = 0;
          const metadata = enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added');
          (metadata[0] as any).computeOnChildValueChange = true;
          (metadata[0] as any).computedProps = [(thisField: any) => {
            recomputeCount++;
            if (recomputeCount > 1)
              thisField.displayOrder = 'grouped';
          }];

          const wrapper = mountExplicitRepeatableChoice({
            metadata,
            initialValues: { pick: { crmExport: [null] } },
          });
          await flushPromises();

          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();

          // Still interleaved: crmExport[0] (loaded, no insertionOrder) sorts ahead of
          // apiEndpoint[0] (added this session), unaffected by the post-mount mutation.
          expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(0);
          expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(1);
        });

        it('type-level: displayOrder is not assignable inside computedProps', () => {
          // Checked by vue-tsc during `pnpm typecheck` / `pnpm ci`. If displayOrder is ever
          // re-added to ComputedPropsFieldType, this line stops erroring and vue-tsc fails
          // with TS2578 (unused '@ts-expect-error' directive).
          function typeCheckOnly(thisField: ComputedPropsFieldOf<Metadata>) {
            // @ts-expect-error displayOrder is excluded from ComputedPropsFieldType
            thisField.displayOrder = 'added';
          }
          expect(typeof typeCheckOnly).toBe('function');
        });
      });

      it('renumbers globalIndex live across the whole interleaved sequence when an occurrence is removed', async () => {
        const wrapper = mountExplicitRepeatableChoice({
          metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added'),
          initialValues: { pick: { apiEndpoint: [null], crmExport: [null] } },
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        // Missing-insertionOrder group first (apiEndpoint[0], crmExport[0], grouped order),
        // then the numbered group in press order (apiEndpoint[1], crmExport[1]).
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(1);
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[1]')).toBe(2);
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[1]')).toBe(3);
        expect(occurrenceInsertionOrder(wrapper, 'pick.apiEndpoint[1]')).toBe(1);
        expect(occurrenceInsertionOrder(wrapper, 'pick.crmExport[1]')).toBe(2);

        // Remove the occurrence at displayed position 1 (crmExport[0], the loaded one).
        await wrapper.find('[data-testid="pick.crmExport[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')).toBe(0);
        expect(occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[1]')).toBe(1);
        // crmExport[1] reindexed to crmExport[0]; its insertionOrder followed the stable
        // occurrenceKey through the reindex, unaffected by the array-position shift.
        expect(occurrenceGlobalIndex(wrapper, 'pick.crmExport[0]')).toBe(2);
        expect(occurrenceInsertionOrder(wrapper, 'pick.crmExport[0]')).toBe(2);
      });

      it('has no effect on a maxOccurs:1 explicit choice', async () => {
        function singleChoiceMetadata(withDisplayOrder: boolean): Metadata[] {
          return [{
            name: 'pick',
            explicitChoiceSelection: true,
            fieldOptions: { label: 'Pick One' },
            ...(withDisplayOrder ? { displayOrder: 'added' as const } : {}),
            choice: [
              { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
              { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
            ],
          }];
        }

        const withFlag = mount(TestForm, { attachTo: document.body, props: { metadata: singleChoiceMetadata(true) } });
        const withoutFlag = mount(TestForm, { attachTo: document.body, props: { metadata: singleChoiceMetadata(false) } });
        await flushPromises();

        await withFlag.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await withoutFlag.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(withFlag.html()).toBe(withoutFlag.html());
        expect(withFlag.find('[data-testid="pick.selfServe-global-index"]').exists()).toBe(false);
        expect(withFlag.find('[data-testid="pick.selfServe-insertion-order"]').exists()).toBe(false);
      });

      describe('edge cases', () => {
        it('equals grouped order exactly when every occurrence was loaded and none was added this session', async () => {
          const wrapper = mountExplicitRepeatableChoice({
            metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added'),
            initialValues: { pick: { apiEndpoint: [null, null], crmExport: [null] } },
          });
          await flushPromises();

          expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual(activeChoiceOccurrences(wrapper, 'pick'));
        });

        it('does not reuse a removed occurrence\'s insertionOrder; the counter keeps incrementing', async () => {
          const wrapper = mountExplicitRepeatableChoice({ metadata: enableDisplayOrder(scalarChoiceMetadata(), 'pick', 'added') });
          await flushPromises();

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          expect(occurrenceInsertionOrder(wrapper, 'pick.crmExport[0]')).toBe(1);

          await wrapper.find('[data-testid="pick.crmExport[0]-remove-choice-button"]').trigger('click');
          await flushPromises();

          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(occurrenceInsertionOrder(wrapper, 'pick.apiEndpoint[0]')).toBe(2);
        });

        it('keeps insertionOrder tied to the stable occurrenceKey through an ancestor reindex', async () => {
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
                  displayOrder: 'added',
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
          await wrapper.find('[data-testid="projectContacts[1].certifications.advanced-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(occurrenceInsertionOrder(wrapper, 'projectContacts[1].certifications.basic[0]')).toBe(1);
          expect(occurrenceInsertionOrder(wrapper, 'projectContacts[1].certifications.advanced[0]')).toBe(2);

          await wrapper.find('[data-testid="projectContacts[0]-remove-button"]:not(.invisible)').trigger('click');
          await flushPromises();

          // Only the path prefix changed (projectContacts[1] -> [0]); the insertionOrder values,
          // keyed by the stable occurrenceKey, are unchanged by the ancestor reindex.
          expect(occurrenceInsertionOrder(wrapper, 'projectContacts[0].certifications.basic[0]')).toBe(1);
          expect(occurrenceInsertionOrder(wrapper, 'projectContacts[0].certifications.advanced[0]')).toBe(2);
        });
      });
    });

    describe('preserveOrder', () => {
      function objectBranchesMetadata(): Metadata[] {
        return [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 5,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            {
              name: 'apiEndpoint',
              maxOccurs: 3,
              fieldOptions: { label: 'Api Endpoint' },
              children: [{ name: 'url', type: 'text', fieldOptions: { label: 'URL' } }],
            },
            {
              name: 'crmExport',
              maxOccurs: 3,
              fieldOptions: { label: 'Crm Export' },
              children: [{ name: 'system', type: 'text', fieldOptions: { label: 'System' } }],
            },
          ],
        }];
      }

      function mountExplicitRepeatableChoiceObjectBranches(extraProps: Record<string, any> = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: enablePreserveOrder(objectBranchesMetadata(), 'pick'),
            ...extraProps,
          },
        });
      }

      function bothScalarBranchesMetadata(): Metadata[] {
        return [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 3,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
            { name: 'crmExport', maxOccurs: 2, fieldOptions: { label: 'Crm Export' } },
          ],
        }];
      }

      function mixedBranchesMetadata(): Metadata[] {
        return [{
          name: 'pick',
          explicitChoiceSelection: true,
          maxOccurs: 3,
          fieldOptions: { label: 'Pick Several' },
          choice: [
            { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
            {
              name: 'crmExport',
              maxOccurs: 2,
              fieldOptions: { label: 'Crm Export' },
              children: [{ name: 'system', type: 'text', fieldOptions: { label: 'System' } }],
            },
          ],
        }];
      }

      function mountExplicitRepeatableChoiceMixedBranches(extraProps: Record<string, any> = {}) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: enablePreserveOrder(mixedBranchesMetadata(), 'pick'),
            ...extraProps,
          },
        });
      }

      it('writes order on add, seeded directly in the push and counted across the whole choice', async () => {
        const wrapper = mountExplicitRepeatableChoiceObjectBranches();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(3);

        // Stable across a further tick with no interaction: the value settled immediately on
        // push, not through a later follow-up write.
        await flushPromises();
        expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(3);
      });

      it('compacts survivors to a contiguous order on removal, and the next add continues from the survivor count', async () => {
        const wrapper = mountExplicitRepeatableChoiceObjectBranches();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
        expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);
        expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(3);
        expect(formValues(wrapper).pick.crmExport[1].order).toBe(4);

        await wrapper.find('[data-testid="pick.crmExport[0]-remove-choice-button"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
        expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(2);
        expect(formValues(wrapper).pick.crmExport[0].order).toBe(3);

        // The compaction write (shouldValidate: false) did not flip the still-empty survivor's
        // own field into an already-errored state; nothing was touched or submitted.
        expect(wrapper.find('[data-testid="pick.apiEndpoint[1].url-error-message"]').exists()).toBe(false);

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        expect(formValues(wrapper).pick.crmExport[1].order).toBe(4);
      });

      describe('mount-time backfill for legacy data missing order', () => {
        it('backfills every occurrence from its grouped position when all are missing order', async () => {
          const wrapper = mountExplicitRepeatableChoiceObjectBranches({
            initialValues: {
              pick: {
                apiEndpoint: [{ url: 'a' }, { url: 'b' }],
                crmExport: [{ system: 'c' }],
              },
            },
          });
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
          expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(2);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(3);

          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();
          expect(formValues(wrapper).pick.crmExport[1].order).toBe(4);
        });

        it('only backfills occurrences that are actually missing order, leaving an existing value untouched', async () => {
          const wrapper = mountExplicitRepeatableChoiceObjectBranches({
            initialValues: {
              pick: {
                apiEndpoint: [{ url: 'a', order: 1 }, { url: 'b' }],
                crmExport: [{ system: 'c' }],
              },
            },
          });
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
          expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(2);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(3);
        });

        it('performs zero writes when every occurrence already carries a contiguous order', async () => {
          const initialValues = {
            pick: {
              apiEndpoint: [{ url: 'a', order: 1 }, { url: 'b', order: 2 }],
              crmExport: [{ system: 'c', order: 3 }],
            },
          };
          const wrapper = mountExplicitRepeatableChoiceObjectBranches({ initialValues });
          await flushPromises();

          expect(formValues(wrapper).pick).toEqual(initialValues.pick);
        });

        it('skips a scalar-leaf occurrence already present at mount, backfilling only the object-shaped one', async () => {
          const wrapper = mountExplicitRepeatableChoiceMixedBranches({
            initialValues: {
              pick: {
                apiEndpoint: ['already here'],
                crmExport: [{ system: 'c' }],
              },
            },
          });
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0]).toBe('already here');
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);
        });

        it('trusts a non-contiguous or duplicated legacy order as-is, only sorting it, and self-heals to contiguous 1..N on the next removal', async () => {
          const wrapper = mountExplicitRepeatableChoiceObjectBranches({
            metadata: enableDisplayOrder(enablePreserveOrder(objectBranchesMetadata(), 'pick'), 'pick', 'added'),
            initialValues: {
              pick: {
                apiEndpoint: [{ url: 'a', order: 5 }, { url: 'b', order: 10 }],
                crmExport: [{ system: 'c', order: 20 }],
              },
            },
          });
          await flushPromises();

          // Untouched: none of the three had a missing order, so the backfill wrote nothing.
          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(5);
          expect(formValues(wrapper).pick.apiEndpoint[1].order).toBe(10);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(20);

          // The two-key sort remains deterministic over any numeric set: ascending by order.
          expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual([
            { branchKey: 'apiEndpoint', index: 0 },
            { branchKey: 'apiEndpoint', index: 1 },
            { branchKey: 'crmExport', index: 0 },
          ]);

          await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
          await flushPromises();

          // Compaction re-ranks the survivors by their current order, self-healing to 1..N.
          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);
        });
      });

      it('sorts the render list by order, not insertionOrder, and the sort survives a remount', async () => {
        const wrapper = mountExplicitRepeatableChoiceObjectBranches({
          metadata: enableDisplayOrder(enablePreserveOrder(objectBranchesMetadata(), 'pick'), 'pick', 'added'),
        });
        await flushPromises();

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        const interleaved = [
          { branchKey: 'crmExport', index: 0 },
          { branchKey: 'apiEndpoint', index: 0 },
          { branchKey: 'crmExport', index: 1 },
        ];
        expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual(interleaved);

        // No add-press this session, so every occurrence's ephemeral insertionOrder is undefined
        // in the fresh instance — the exact condition under which the ephemeral tier's own sort
        // would fall back to grouped order. The persisted order survives instead.
        const remounted = mountExplicitRepeatableChoiceObjectBranches({
          metadata: enableDisplayOrder(enablePreserveOrder(objectBranchesMetadata(), 'pick'), 'pick', 'added'),
          initialValues: formValues(wrapper),
        });
        await flushPromises();

        expect(renderedChoiceOccurrences(remounted, 'pick')).toEqual(interleaved);
      });

      it('writes and compacts order even when display stays grouped, proving persistence and display are independent', async () => {
        const wrapper = mountExplicitRepeatableChoiceObjectBranches();
        await flushPromises();

        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.crmExport[0].order).toBe(1);
        expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(2);
        expect(formValues(wrapper).pick.crmExport[1].order).toBe(3);

        // Press order was interleaved, but the DOM/render order stays grouped: displayOrder was
        // never set, so renderedChoiceOccurrences equals the grouped activeChoiceOccurrences.
        expect(renderedChoiceOccurrences(wrapper, 'pick')).toEqual(activeChoiceOccurrences(wrapper, 'pick'));
      });

      it('is real submitted data: present alongside declared fields, kept by removeNullValues, and present after submit', async () => {
        const wrapper = mountExplicitRepeatableChoiceObjectBranches();
        await flushPromises();

        await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
        await flushPromises();
        await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
        await flushPromises();

        const values = formValues(wrapper);
        expect(Object.keys(values.pick.apiEndpoint[0]).sort()).toEqual(['order', 'url']);
        expect(Object.keys(values.pick.crmExport[0]).sort()).toEqual(['order', 'system']);

        const cleaned = removeNullValues(values)!;
        expect(cleaned.pick.apiEndpoint[0].order).toBe(1);

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();

        expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
        expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);
      });

      describe('scalar-leaf branch is a no-op with a dev warning', () => {
        it('skips the write and warns for a scalar-leaf branch, while the object-shaped branch in the same choice still gets order', async () => {
          const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
          try {
            const wrapper = mountExplicitRepeatableChoiceMixedBranches();
            await flushPromises();

            await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
            await flushPromises();

            expect(formValues(wrapper).pick.apiEndpoint[0]).toBeNull();
            expect(warn).toHaveBeenCalledTimes(1);
            expect(String(warn.mock.calls[0][0])).toContain('apiEndpoint');

            await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
            await flushPromises();

            // The shared counter still counts the scalar placeholder structurally, so the
            // object-shaped branch's occurrence gets order 2, not 1.
            expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);

            // A second add-press of the same scalar branch warns again: no dedup for the
            // component's lifetime.
            await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
            await flushPromises();

            expect(warn).toHaveBeenCalledTimes(2);
          }
          finally {
            warn.mockRestore();
          }
        });
      });

      describe('preserveOrder is static, read once at setup', () => {
        it('a computedProps mutation of preserveOrder (via an as any cast) after mount does not stop order from being written', async () => {
          let recomputeCount = 0;
          const metadata = enablePreserveOrder(objectBranchesMetadata(), 'pick');
          (metadata[0] as any).computeOnChildValueChange = true;
          (metadata[0] as any).computedProps = [(thisField: any) => {
            recomputeCount++;
            if (recomputeCount > 1)
              thisField.preserveOrder = false;
          }];

          const wrapper = mountExplicitRepeatableChoiceObjectBranches({ metadata });
          await flushPromises();

          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
        });

        it('type-level: preserveOrder is not assignable inside computedProps', () => {
          // Checked by vue-tsc during `pnpm typecheck` / `pnpm ci`. If preserveOrder is ever
          // re-added to ComputedPropsFieldType, this line stops erroring and vue-tsc fails
          // with TS2578 (unused '@ts-expect-error' directive).
          function typeCheckOnly(thisField: ComputedPropsFieldOf<Metadata>) {
            // @ts-expect-error preserveOrder is excluded from ComputedPropsFieldType
            thisField.preserveOrder = false;
          }
          expect(typeof typeCheckOnly).toBe('function');
        });
      });

      describe('edge cases', () => {
        it('does not run compaction for a no-op removal (already removed / out-of-range index)', async () => {
          const wrapper = mountExplicitRepeatableChoiceObjectBranches();
          await flushPromises();

          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();
          await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);

          const choiceComp = findDynamicFormItemChoiceByPath(wrapper, 'pick');
          expect(() => {
            (choiceComp!.vm as any).$.setupState.removeChoiceOccurrence('apiEndpoint', 99);
          }).not.toThrow();
          await flushPromises();

          expect(formValues(wrapper).pick.apiEndpoint[0].order).toBe(1);
          expect(formValues(wrapper).pick.crmExport[0].order).toBe(2);
        });

        it('never writes an order key anywhere when a choice with two scalar branches has preserveOrder enabled, and warns on every add-press with no dedup', async () => {
          const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
          try {
            const wrapper = mountExplicitRepeatableChoice({ metadata: enablePreserveOrder(bothScalarBranchesMetadata(), 'pick') });
            await flushPromises();

            // Three add-presses of scalar-leaf branches, including two of the exact same branch:
            // a dedup implementation would suppress the repeat, so counting the calls pins the
            // "no dedup" reading directly rather than merely "warns at least once".
            await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.crmExport-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
            await flushPromises();
            await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
            await flushPromises();

            const values = formValues(wrapper);
            for (const value of values.pick.apiEndpoint)
              expect(value === null || typeof value === 'string').toBe(true);
            for (const value of values.pick.crmExport)
              expect(value === null || typeof value === 'string').toBe(true);

            expect(warn).toHaveBeenCalledTimes(3);
            expect(warn.mock.calls.every(call => typeof call[0] === 'string')).toBe(true);
          }
          finally {
            warn.mockRestore();
          }
        });

        it('has no effect on a maxOccurs:1 explicit choice', async () => {
          function singleChoiceMetadata(withPreserveOrder: boolean): Metadata[] {
            return [{
              name: 'pick',
              explicitChoiceSelection: true,
              fieldOptions: { label: 'Pick One' },
              ...(withPreserveOrder ? { preserveOrder: true as const } : {}),
              choice: [
                { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
                { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
              ],
            }];
          }

          const withFlag = mount(TestForm, { attachTo: document.body, props: { metadata: singleChoiceMetadata(true) } });
          const withoutFlag = mount(TestForm, { attachTo: document.body, props: { metadata: singleChoiceMetadata(false) } });
          await flushPromises();

          await withFlag.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
          await withoutFlag.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
          await flushPromises();

          expect(withFlag.html()).toBe(withoutFlag.html());
        });
      });
    });

    // --- Edge cases ---
    describe('edge cases', () => {
      it('removing occurrences of a branch that had exhausted the shared budget frees room for other branches reactively', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              explicitChoiceSelection: true,
              maxOccurs: 2,
              fieldOptions: { label: 'Pick Several' },
              choice: [
                { name: 'apiEndpoint', maxOccurs: 2, fieldOptions: { label: 'Api Endpoint' } },
                { name: 'crmExport', fieldOptions: { label: 'Crm Export' } },
              ],
            }],
          },
        });
        await flushPromises();

        // 4 items of a maxOccurs:2 branch consume both of the choice's 2 shared slots.
        for (let i = 0; i < 4; i++) {
          await wrapper.find('[data-testid="pick.apiEndpoint-add-choice-button"]').trigger('click');
          await flushPromises();
        }
        expect(canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')).toBe(false);

        // Down to 2 items = 1 slot consumed, freeing the other slot for crmExport.
        await wrapper.find('[data-testid="pick.apiEndpoint[0]-remove-choice-button"]').trigger('click');
        await flushPromises();
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

  // ─────────────────────────────────────────────────────────────────────────
  // Loaded initialValues: a branch is active purely because saved data put a
  // value in it, without addChoiceOccurrence ever being called.
  // ─────────────────────────────────────────────────────────────────────────
  describe('explicit selection — loaded initialValues (value-driven active branch)', () => {
    function singleChoiceMetadata() {
      return [{
        name: 'pick',
        explicitChoiceSelection: true,
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
          { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
        ],
      }];
    }

    it('loading a value activates only that branch; the sibling stays inactive', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: singleChoiceMetadata(), initialValues: { pick: { selfServe: 'hello' } } },
      });
      await flushPromises();

      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(false);
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    it('switching away from a loaded branch clears it and leaves only the new branch active', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: singleChoiceMetadata(), initialValues: { pick: { selfServe: 'hello' } } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();

      // A single-occurrence choice is mutually exclusive: the loaded branch must be cleared.
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'guidedRollout', index: 0 }]);
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(true);
      expect(formValues(wrapper).pick.selfServe).toBeUndefined();
    });

    it('removing a loaded (value-driven-only) branch clears it and leaves nothing active', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: singleChoiceMetadata(), initialValues: { pick: { selfServe: 'hello' } } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await flushPromises();

      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([]);
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);
      expect(formValues(wrapper).pick?.selfServe).toBeUndefined();
    });

    it('switching away then back to a loaded branch leaves only the loaded branch active (empty, without restore)', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: singleChoiceMetadata(), initialValues: { pick: { selfServe: 'hello' } } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      // Only selfServe active; its value was cleared on the first switch and (no preserveOnSwitch) not restored.
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      expect(formValues(wrapper).pick.guidedRollout).toBeUndefined();
    });

    it('invalid loaded data (two branches populated in a maxOccurs:1 choice) renders both and self-heals on the first selection', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: singleChoiceMetadata(), initialValues: { pick: { selfServe: 'hello', guidedRollout: 'world' } } },
      });
      await flushPromises();

      // A maxOccurs:1 choice can legitimately hold only one branch, but schema-invalid input is
      // reflected as-is rather than rejected, matching auto mode: both loaded branches render and
      // both read active. There is no choice-level maximum rule, so no error is raised here.
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([
        { branchKey: 'selfServe', index: 0 },
        { branchKey: 'guidedRollout', index: 0 },
      ]);
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(true);
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(true);

      // The first explicit selection self-heals the mutually-exclusive choice: picking one branch
      // clears every other active branch, so the form converges to a single valid selection while
      // keeping the picked branch's own loaded value intact.
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
      expect(wrapper.find('[id="pick.guidedRollout"]').exists()).toBe(false);
      expect(formValues(wrapper).pick.guidedRollout).toBeUndefined();
      expect(formValues(wrapper).pick.selfServe).toBe('hello');
    });

    it('maxOccurs > 1: loaded occurrences across branches are reflected in activeChoiceOccurrences', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            maxOccurs: 5,
            fieldOptions: { label: 'Pick Several' },
            choice: [
              { name: 'apiEndpoint', maxOccurs: 1, fieldOptions: { label: 'Api Endpoint' } },
              { name: 'crmExport', maxOccurs: 1, fieldOptions: { label: 'Crm Export' } },
            ],
          }],
          initialValues: { pick: { apiEndpoint: ['a', 'b'], crmExport: ['c'] } },
        },
      });
      await flushPromises();

      // Grouped by branch declaration order, then by index within the branch.
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([
        { branchKey: 'apiEndpoint', index: 0 },
        { branchKey: 'apiEndpoint', index: 1 },
        { branchKey: 'crmExport', index: 0 },
      ]);
    });

    it('choice nested in an array: each loaded occurrence activates its own branch independently', async () => {
      const wrapper = mount(TestForm, {
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
          initialValues: { projectContacts: [{ method: { email: 'a@b.com' } }, { method: { phone: '123' } }] },
        },
      });
      await flushPromises();

      expect(activeChoiceOccurrences(wrapper, 'projectContacts[0].method')).toEqual([{ branchKey: 'email', index: 0 }]);
      expect(activeChoiceOccurrences(wrapper, 'projectContacts[1].method')).toEqual([{ branchKey: 'phone', index: 0 }]);
      expect(wrapper.find('[id="projectContacts[0].method.email"]').exists()).toBe(true);
      expect(wrapper.find('[id="projectContacts[1].method.phone"]').exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // preserve-on-switch: loaded data and post-removal freshness.
  // ─────────────────────────────────────────────────────────────────────────
  describe('preserve-on-switch — loaded initialValues & post-removal', () => {
    function preserveMetadata() {
      return enablePreserveOnSwitch([{
        name: 'pick',
        explicitChoiceSelection: true,
        fieldOptions: { label: 'Pick One' },
        choice: [
          { name: 'selfServe', fieldOptions: { label: 'Self Serve' } },
          { name: 'guidedRollout', fieldOptions: { label: 'Guided Rollout' } },
        ],
      }], 'pick');
    }

    it('switching away from a loaded branch stashes it, and switching back restores the loaded value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: preserveMetadata(), initialValues: { pick: { selfServe: 'hello' } } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[id="pick.selfServe"]').exists()).toBe(false);

      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('hello');
      expect(activeChoiceOccurrences(wrapper, 'pick')).toEqual([{ branchKey: 'selfServe', index: 0 }]);
    });

    it('re-selecting a branch after explicitly removing it starts empty, not resurrected from an earlier stash', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata: preserveMetadata() } });
      await flushPromises();

      // Build a stash for selfServe: select + fill, switch away (stashes "x"), switch back (restores).
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('x');
      await flushPromises();
      await wrapper.find('[data-testid="pick.guidedRollout-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[id="pick.selfServe"]').setValue('y');
      await flushPromises();

      // Explicitly remove selfServe (a discard, not a switch), then re-select it.
      await wrapper.find('[data-testid="pick.selfServe-remove-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.selfServe-add-choice-button"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('[id="pick.selfServe"]').element as HTMLInputElement).value).toBe('');
      expect(formValues(wrapper).pick.selfServe).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // maxOccursTotal cap set below the branch's own maxOccurs.
  // ─────────────────────────────────────────────────────────────────────────
  describe('maxOccursTotal — cap set below the branch\'s own maxOccurs', () => {
    it('repeatable choice: the branch stops at the cap even though a single slot could hold more', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'pick',
            explicitChoiceSelection: true,
            maxOccurs: 5,
            fieldOptions: { label: 'Pick Several' },
            choice: [
              // A branch that batches 3 raw items per choice slot, but is capped at 2 total.
              { name: 'tags', maxOccurs: 3, maxOccursTotal: 2, fieldOptions: { label: 'Tags' } },
              { name: 'note', maxOccurs: 1, fieldOptions: { label: 'Note' } },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="pick.tags-add-choice-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('[data-testid="pick.tags-add-choice-button"]').trigger('click');
      await flushPromises();

      // Two items reached; the cap (2) blocks a third even though one 3-item slot is not full.
      expect(activeChoiceOccurrences(wrapper, 'pick')!.filter(o => o.branchKey === 'tags')).toHaveLength(2);
      expect(canAddChoiceOccurrence(wrapper, 'pick', 'tags')).toBe(false);
      expect(canAddChoiceOccurrence(wrapper, 'pick', 'note')).toBe(true);
    });

    it('maxOccurs:1 explicit choice with a repeatable branch: the cap is honored, matching auto mode', async () => {
      function mountMode(explicit: boolean) {
        return mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'pick',
              ...(explicit ? { explicitChoiceSelection: true } : {}),
              fieldOptions: { label: 'Pick' },
              choice: [
                { name: 'tags', maxOccurs: 5, maxOccursTotal: 2, fieldOptions: { label: 'Tags' } },
                { name: 'note', fieldOptions: { label: 'Note' } },
              ],
            }],
          },
        });
      }

      async function fillTags(wrapper: ReturnType<typeof mount>, explicit: boolean) {
        if (explicit) {
          await wrapper.find('[data-testid="pick.tags-add-choice-button"]').trigger('click');
          await flushPromises();
        }
        for (let i = 0; i < 5; i++) {
          const btn = wrapper.find('[data-testid="pick.tags-add-button"]');
          if (btn.exists() && btn.attributes('disabled') === undefined)
            await btn.trigger('click');
          await flushPromises();
        }
        return wrapper.findAll('input').filter(w => (w.attributes('id') ?? '').startsWith('pick.tags[')).length;
      }

      const autoWrapper = mountMode(false);
      await flushPromises();
      const autoCount = await fillTags(autoWrapper, false);

      const explicitWrapper = mountMode(true);
      await flushPromises();
      const explicitCount = await fillTags(explicitWrapper, true);

      expect(autoCount).toBe(2);
      expect(explicitCount).toBe(autoCount);
    });
  });
});
