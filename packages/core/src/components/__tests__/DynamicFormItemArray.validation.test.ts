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
          settings: { messages: {} },
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

  describe('validation trigger settings', () => {
    function mountArray(overrides = {}) {
      return mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required for {field}' },
            ...overrides,
          },
        },
      });
    }

    describe('validateOnBlur', () => {
      it('validates on blur when validateOnBlur is true', async () => {
        const wrapper = mountArray({ validateOnBlur: true, validateOnValueUpdate: false });
        await flushPromises(); // allow watchEffect to auto-add items

        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('value'); // fill only 1 of 2 required

        await inputs[0].trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);
      });

      it('does not validate on blur when validateOnBlur is not set', async () => {
        const wrapper = mountArray({ validateOnValueUpdate: false });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('value'); // fill only 1 of 2 required

        await inputs[0].trigger('blur');
        await flushPromises();

        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });
    });

    describe('validateOnValueUpdate', () => {
      it('validates immediately on value change without submit (default: true)', async () => {
        const wrapper = mountArray(); // no explicit validateOnValueUpdate — should default to true
        await flushPromises();

        const inputs = wrapper.findAll('input');
        // Filling only 1 of 2 required should show an error immediately — no submit needed
        await inputs[0].setValue('value');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

        // Filling the 2nd should immediately clear the error
        await inputs[1].setValue('value');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });

      it('does not validate on value change when validateOnValueUpdate is false', async () => {
        const wrapper = mountArray({ validateOnValueUpdate: false, validateWhenInError: false });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('value'); // fill only 1 of 2
        await flushPromises();
        // No error yet — no submit happened and validateOnValueUpdate is false
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);

        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

        // Filling the 2nd input should NOT clear the error — re-validation on change is disabled
        await inputs[1].setValue('value');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

        // Only a new submit should reflect the corrected count
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });
    });

    describe('validateWhenInError', () => {
      it('does not validate on value change when there is no error yet', async () => {
        const wrapper = mountArray({ validateOnValueUpdate: false, validateWhenInError: true });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        // Filling only 1 of 2 — no prior error exists yet
        await inputs[0].setValue('value');
        await flushPromises();

        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });

      it('re-validates on value change once an error exists, and clears when fixed', async () => {
        const wrapper = mountArray({ validateWhenInError: true });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        // Trigger the first error via submit
        await inputs[0].setValue('value');
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

        // Now that an error exists, filling the 2nd input should re-validate and clear the error
        await inputs[1].setValue('value');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });
    });

    describe('validateOnValueUpdateAfterSubmit', () => {
      it('does not validate on value change before the first submit', async () => {
        const wrapper = mountArray({ validateOnValueUpdateAfterSubmit: true });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        // Fill only 1 of 2 — no submit yet
        await inputs[0].setValue('value');
        await flushPromises();

        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });

      it('validates on value change after the first submit', async () => {
        const wrapper = mountArray({ validateOnValueUpdateAfterSubmit: true });
        await flushPromises();

        const inputs = wrapper.findAll('input');
        await inputs[0].setValue('value');
        await wrapper.find('[data-testid="submit"]').trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

        // After the first submit, filling the 2nd input should re-validate and clear the error
        await inputs[1].setValue('value');
        await flushPromises();
        expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      });
    });
  });

  describe('autoAddMinOccurs', () => {
    it('shows a minOccurs error on submit when autoAddMinOccurs is false and no items are added', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 1,
            maxOccurs: 3,
            autoAddMinOccurs: false,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 1 items required');
    });

    it('clears the minOccurs error once the user manually adds and fills an item', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 1,
            maxOccurs: 3,
            autoAddMinOccurs: false,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });
      await flushPromises();

      // Trigger a validation error first
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);

      // Manually add an item and fill it
      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[0]"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });

    it('still enforces minOccurs=2 when autoAddMinOccurs is false and only 1 item is filled', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            fieldOptions: { label: 'Items' },
            minOccurs: 2,
            maxOccurs: 4,
            autoAddMinOccurs: false,
          }] as any,
          settings: {
            messages: { minOccurs: 'At least {0} items required' },
          },
        },
      });
      await flushPromises();

      // Add one item and fill it
      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[0]"]').setValue('first');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });
  });
});
