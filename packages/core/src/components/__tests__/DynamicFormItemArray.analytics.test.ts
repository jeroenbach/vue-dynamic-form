import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { renderCount } from './DynamicFormItem.test-helpers';
import { arrayConstructValidationCount as constructValidationCount } from './DynamicFormItemArray.test-helpers';

describe('component DynamicFormItemArray - analytics', () => {
  describe('render count', () => {
    it('renders exactly once on mount, unaffected by the added xsd_maxOccurs rule', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 0,
            maxOccurs: 2,
          }] as any,
          initialValues: { items: ['a', 'b', 'c'] },
        },
      });
      await flushPromises();

      expect(renderCount(wrapper, 'items')).toBe(1);
    });
  });

  describe('combinedValidation recompute count', () => {
    it('does not recompute when a sibling field changes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'sibling', type: 'text' },
            {
              name: 'items',
              fieldOptions: { label: 'Items' },
              minOccurs: 0,
              maxOccurs: 2,
            },
          ] as any,
          initialValues: { items: ['a', 'b', 'c'] },
        },
      });
      await flushPromises();

      const countBefore = constructValidationCount(wrapper, 'items');

      await wrapper.find('#sibling').setValue('hello');
      await flushPromises();

      expect(constructValidationCount(wrapper, 'items')).toBe(countBefore);
    });

    it('does not recompute when the array\'s own value changes, is added to, or removed from', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 0,
            maxOccurs: 3,
          }] as any,
          initialValues: { items: ['a'] },
        },
      });
      await flushPromises();

      const countAfterMount = constructValidationCount(wrapper, 'items');

      await wrapper.find('input[id="items[0]"]').setValue('changed');
      await flushPromises();
      expect(constructValidationCount(wrapper, 'items')).toBe(countAfterMount);

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      expect(constructValidationCount(wrapper, 'items')).toBe(countAfterMount);

      await wrapper.find('[data-testid="items[1]-remove-button"]').trigger('click');
      await flushPromises();
      expect(constructValidationCount(wrapper, 'items')).toBe(countAfterMount);
    });
  });

  describe('sibling isolation', () => {
    it('does not re-render a sibling array field when this array is loaded over its max and submitted', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            {
              name: 'sibling',
              fieldOptions: { label: 'Sibling' },
              maxOccurs: 3,
            },
            {
              name: 'items',
              fieldOptions: { label: 'Items' },
              minOccurs: 0,
              maxOccurs: 2,
            },
          ] as any,
          initialValues: { items: ['a', 'b', 'c'] },
        },
      });
      await flushPromises();

      const siblingCountBefore = renderCount(wrapper, 'sibling');

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(renderCount(wrapper, 'sibling')).toBe(siblingCountBefore);
    });
  });

  describe('child identity across error transitions', () => {
    it('does not remount the surviving item when an over-limit array is trimmed back within its max', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 0,
            maxOccurs: 2,
          }] as any,
          initialValues: { items: ['a', 'b', 'c'] },
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

      const survivingInput = wrapper.find('input[id="items[0]"]').element;

      await wrapper.find('[data-testid="items[2]-remove-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      expect(wrapper.find('input[id="items[0]"]').element).toBe(survivingInput);
    });
  });
});
