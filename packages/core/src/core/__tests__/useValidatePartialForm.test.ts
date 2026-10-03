import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import DynamicForm from '@/components/DynamicForm.vue';
import { useDynamicForm } from '@/core/useDynamicForm';
import TestFormTemplate from '@/examples/TestFormTemplate.vue';

function mountForm(metadata: object[], initialValues?: Record<string, unknown>) {
  const TestForm = defineComponent({
    setup() {
      const { validateSection } = useDynamicForm({ initialValues });
      return { validateSection };
    },
    render() {
      return h('form', [
        h(DynamicForm, { template: TestFormTemplate, metadata: metadata as any }),
      ]);
    },
  });

  return mount(TestForm, { attachTo: document.body });
}

describe('useValidatePartialForm', () => {
  describe('validateSection(sectionPath)', () => {
    it('returns valid with empty results when no fields match the path', async () => {
      const wrapper = mountForm([
        { name: 'firstName', fieldOptions: { label: 'First Name' } },
      ]);
      await flushPromises();

      const result = await (wrapper.vm as any).validateSection('nonexistent');

      expect(result.valid).toBe(true);
      expect(result.results).toEqual({});
      expect(result.errors).toEqual({});
      expect(result.source).toBe('fields');
    });

    it('returns valid: true when all required fields in the section have values', async () => {
      const wrapper = mountForm([
        {
          name: 'contact',
          children: [
            { name: 'name', fieldOptions: { label: 'Name' } },
            { name: 'email', fieldOptions: { label: 'Email' } },
          ],
        },
      ]);
      await flushPromises();

      await wrapper.find('input[id="contact.name"]').setValue('John');
      await wrapper.find('input[id="contact.email"]').setValue('john@example.com');
      await flushPromises();

      const result = await (wrapper.vm as any).validateSection('contact');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns valid: false when a required field in the section is empty', async () => {
      const wrapper = mountForm([
        {
          name: 'contact',
          children: [
            { name: 'name', fieldOptions: { label: 'Name' } },
          ],
        },
      ]);
      await flushPromises();

      const result = await (wrapper.vm as any).validateSection('contact');

      expect(result.valid).toBe(false);
      expect(result.errors['contact.name']).toBeDefined();
    });

    it('only validates fields under the given path, leaving other sections unaffected', async () => {
      const wrapper = mountForm([
        { name: 'sectionA', children: [{ name: 'field', fieldOptions: { label: 'A' } }] },
        { name: 'sectionB', children: [{ name: 'field', fieldOptions: { label: 'B' } }] },
      ]);
      await flushPromises();

      await wrapper.find('input[id="sectionA.field"]').setValue('hello');
      await flushPromises();

      const resultA = await (wrapper.vm as any).validateSection('sectionA');
      expect(resultA.valid).toBe(true);
      expect('sectionB.field' in resultA.results).toBe(false);

      const resultB = await (wrapper.vm as any).validateSection('sectionB');
      expect(resultB.valid).toBe(false);
      expect('sectionA.field' in resultB.results).toBe(false);
    });

    it('populates results with an entry for every validated field', async () => {
      const wrapper = mountForm([
        {
          name: 'contact',
          children: [
            { name: 'name', fieldOptions: { label: 'Name' } },
            { name: 'email', fieldOptions: { label: 'Email' } },
          ],
        },
      ]);
      await flushPromises();

      await wrapper.find('input[id="contact.name"]').setValue('John');
      await flushPromises();

      const result = await (wrapper.vm as any).validateSection('contact');

      expect(result.results).toHaveProperty('contact.name');
      expect(result.results).toHaveProperty('contact.email');
    });

    it('validates only the exact leaf field when its full path is passed', async () => {
      const wrapper = mountForm([
        {
          name: 'personal',
          children: [
            { name: 'firstName', fieldOptions: { label: 'First name' } },
            { name: 'lastName', fieldOptions: { label: 'Last name' } },
            { name: 'phone', fieldOptions: { label: 'Phone' } },
          ],
        },
        {
          name: 'work',
          children: [
            { name: 'company', fieldOptions: { label: 'Company' } },
            { name: 'role', fieldOptions: { label: 'Role' } },
          ],
        },
      ]);
      await flushPromises();

      // Fill all fields except personal.firstName
      await wrapper.find('input[id="personal.lastName"]').setValue('Doe');
      await wrapper.find('input[id="personal.phone"]').setValue('+1 555 0100');
      await wrapper.find('input[id="work.company"]').setValue('Acme');
      await wrapper.find('input[id="work.role"]').setValue('Engineer');
      await flushPromises();

      const result = await (wrapper.vm as any).validateSection('personal.firstName');

      expect(result.valid).toBe(false);
      expect(result.results).toHaveProperty('personal.firstName');
      // Other fields in personal and the entire work section must not be included
      expect(result.results).not.toHaveProperty('personal.lastName');
      expect(result.results).not.toHaveProperty('personal.phone');
      expect(result.results).not.toHaveProperty('work.company');
      expect(result.results).not.toHaveProperty('work.role');
    });

    describe('occurrence maximum rules (wizard-step gating)', () => {
      it('fails the section when an array in it is loaded over its maxOccurs', async () => {
        const wrapper = mountForm(
          [{
            name: 'step1',
            children: [{ name: 'items', minOccurs: 0, maxOccurs: 2, fieldOptions: { label: 'Items' } }],
          }],
          { step1: { items: ['a', 'b', 'c'] } },
        );
        await flushPromises();

        const result = await (wrapper.vm as any).validateSection('step1');

        expect(result.valid).toBe(false);
        expect(result.results).toHaveProperty('step1.items');
      });

      it('fails the section when a choice in it is loaded over its maxOccurs, via the choice\'s anchored path', async () => {
        const wrapper = mountForm(
          [{
            name: 'step1',
            children: [{
              name: 'pick',
              fieldOptions: { label: 'Pick One' },
              choice: [
                { name: 'opt1', fieldOptions: { label: 'Option 1' } },
                { name: 'opt2', fieldOptions: { label: 'Option 2' } },
              ],
            }],
          }],
          { step1: { pick: { opt1: 'a', opt2: 'b' } } },
        );
        await flushPromises();

        const result = await (wrapper.vm as any).validateSection('step1');

        expect(result.valid).toBe(false);
      });

      it('fails the section when a choice branch in it breaches its maxOccursTotal', async () => {
        const wrapper = mountForm(
          [{
            name: 'step1',
            children: [{
              name: 'pick',
              minOccurs: 0,
              maxOccurs: 5,
              fieldOptions: { label: 'Pick' },
              choice: [
                { name: 'branchA', maxOccurs: 3, maxOccursTotal: 1, fieldOptions: { label: 'Branch A' } },
                { name: 'branchB', fieldOptions: { label: 'Branch B' } },
              ],
            }],
          }],
          { step1: { pick: { branchA: ['a', 'b', 'c'] } } },
        );
        await flushPromises();

        const result = await (wrapper.vm as any).validateSection('step1');

        expect(result.valid).toBe(false);
      });
    });
  });
});
