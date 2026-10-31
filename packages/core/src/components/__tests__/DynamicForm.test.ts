import { flushPromises, mount } from '@vue/test-utils';
// tests/DynamicForm.test.ts
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import DynamicForm from '@/components/DynamicForm.vue';
import { defaultTestCase } from '@/examples';
import TestForm from '@/examples/TestForm.vue';
import TestFormTemplate from '@/examples/TestFormTemplate.vue';

describe('dynamicForm Stories', () => {
  it('renders Default story', () => {
    const wrapper = mount(defaultTestCase);
    expect(wrapper.exists()).toBe(true);
  });
});

describe('dynamicForm template prop', () => {
  // The prop's runtime validator must accept every component flavour: object-based SFCs and
  // function components (what a generic SFC is at runtime).
  it.each([
    ['an object-based component', TestFormTemplate],
    ['a function component', (props: Record<string, any>, { slots }: { slots: Record<string, any> }) => h(TestFormTemplate, props, slots)],
  ])('accepts %s without a prop-type warning', async (_flavour, template) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(DynamicForm, {
      props: {
        metadata: [{ name: 'text', type: 'text' }],
        template,
      },
    });
    await flushPromises();

    expect(wrapper.find('input').exists()).toBe(true);
    const propWarnings = warn.mock.calls.filter(call => String(call[0]).includes('Invalid prop'));
    expect(propWarnings).toEqual([]);
    warn.mockRestore();
  });
});

describe('dynamicForm settings', () => {
  describe('showOptionalInsteadOfRequired - default field', () => {
    it('shows * next to required fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'text', type: 'text' }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('does not show * next to required fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'text', type: 'text' }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').exists()).toBe(false);
    });

    it('shows (optional) next to optional fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'text', type: 'text', minOccurs: 0 }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').text()).toBe('(optional)');
    });

    it('does not show (optional) next to optional fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'text', type: 'text', minOccurs: 0 }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').exists()).toBe(false);
    });
  });

  describe('showOptionalInsteadOfRequired - array field', () => {
    it('shows * next to required array fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'items', type: 'text', maxOccurs: 3 }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('does not show * next to required array fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'items', type: 'text', maxOccurs: 3 }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').exists()).toBe(false);
    });

    it('shows (optional) next to optional array fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'items', type: 'text', minOccurs: 0, maxOccurs: 3 }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').text()).toBe('(optional)');
    });

    it('does not show (optional) next to optional array fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{ name: 'items', type: 'text', minOccurs: 0, maxOccurs: 3 }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').exists()).toBe(false);
    });
  });

  describe('showOptionalInsteadOfRequired - choice field', () => {
    it('shows * next to required choice fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{
            name: 'pick',
            choice: [{ name: 'opt1' }, { name: 'opt2' }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('does not show * next to required choice fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{
            name: 'pick',
            choice: [{ name: 'opt1' }, { name: 'opt2' }],
          }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-red-500').exists()).toBe(false);
    });

    it('shows (optional) next to optional choice fields when showOptionalInsteadOfRequired is true', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{
            name: 'pick',
            minOccurs: 0,
            choice: [{ name: 'opt1' }, { name: 'opt2' }],
          }],
          settings: { showOptionalInsteadOfRequired: true },
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').text()).toBe('(optional)');
    });

    it('does not show (optional) next to optional choice fields by default', async () => {
      const wrapper = mount(TestForm, {
        props: {
          metadata: [{
            name: 'pick',
            minOccurs: 0,
            choice: [{ name: 'opt1' }, { name: 'opt2' }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('.text-gray-400').exists()).toBe(false);
    });
  });
});
