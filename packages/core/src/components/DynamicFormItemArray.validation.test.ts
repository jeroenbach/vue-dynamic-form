import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';

describe('component DynamicFormItemArray', () => {
  describe('xsd_minOccurs restriction', () => {
    afterEach(() => {
      configure({ generateMessage: undefined as any });
    });

    it.each`
      label      | minOccurs | maxOccurs | filledCount | message                                         | expected
      ${'Items'} | ${1}      | ${3}      | ${0}        | ${'At least {0} item(s) required for {field}'} | ${'At least 1 item(s) required for Items'}
      ${'Items'} | ${2}      | ${4}      | ${1}        | ${'At least {0} item(s) required for {field}'} | ${'At least 2 item(s) required for Items'}
    `('shows custom settings message with positional {0} for minOccurs=$minOccurs with $filledCount filled', async ({ label, minOccurs, maxOccurs, filledCount, message, expected }: any) => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label },
            minOccurs,
            maxOccurs,
          }] as any,
          settings: {
            messages: { minOccurs: message },
          },
        },
      });

      await flushPromises(); // allow watchEffect to auto-add items

      const inputs = wrapper.findAll('input');
      for (let i = 0; i < filledCount; i++) {
        await inputs[i].setValue('value');
      }

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain(expected);
    });

    it('shows custom settings message with named {min} placeholder', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
          }] as any,
          settings: {
            messages: { minOccurs: '{field} requires at least {min} items' },
          },
        },
      });

      await flushPromises();
      await wrapper.findAll('input')[0].setValue('value'); // fill only 1 of 2

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('Items requires at least 2 items');
    });

    it('shows configure.generateMessage when no settings message is provided', async () => {
      configure({
        generateMessage: ctx =>
          `${ctx.field}: needs at least ${(ctx.rule?.params as unknown[])?.[0]} items`,
      });

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
          }] as any,
          settings: {},
        },
      });

      await flushPromises();
      await wrapper.findAll('input')[0].setValue('value'); // fill only 1 of 2

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('Items: needs at least 2 items');
    });

    it('does not show an error when enough items are filled', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });

      await flushPromises();
      for (const input of wrapper.findAll('input')) {
        await input.setValue('value');
      }

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });

    it('does not show an error when minOccurs=0 and no items are filled', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 0,
            maxOccurs: 3,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });

      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });

    it('error disappears when the missing item is filled and reappears when cleared again', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });

      await flushPromises();
      const inputs = wrapper.findAll('input');
      await inputs[0].setValue('value'); // fill only 1 of 2

      // Submit to trigger validation
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');

      // Fill the second input — error should disappear
      await inputs[1].setValue('value');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);

      // Clear the second input — error should reappear
      await inputs[1].setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });
  });
});
