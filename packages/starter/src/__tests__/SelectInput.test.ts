import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import SelectInput from '@/SelectInput.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component SelectInput', () => {
  it('passes an aria-describedby attribute through to the native select unchanged', () => {
    const wrapper = mount(SelectInput, { attrs: { 'aria-describedby': 'industry-desc industry-error' } });

    expect(wrapper.find('select').attributes('aria-describedby')).toBe('industry-desc industry-error');
  });

  it('renders no aria-describedby when none is given', () => {
    const wrapper = mount(SelectInput);

    expect(wrapper.find('select').attributes('aria-describedby')).toBeUndefined();
  });

  describe('accessibility', () => {
    const options = [{ key: 'software', value: 'Software' }, { key: 'healthcare', value: 'Healthcare' }];

    it('has no violations when labelled, with no error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'industry' }, 'Industry'),
          h(SelectInput, { id: 'industry', options }),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when labelled, invalid, and described by a rendered error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'industry' }, 'Industry'),
          h(SelectInput, { 'id': 'industry', options, 'errorMessage': 'Required', 'aria-describedby': 'industry-error' }),
          h('span', { id: 'industry-error', role: 'alert' }, 'Required'),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
