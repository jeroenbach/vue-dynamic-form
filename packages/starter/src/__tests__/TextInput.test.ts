import type { Component } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import TextInput from '@/TextInput.vue';
import { expectNoAxeViolations } from './helpers/axe';

// Cast to a plain Component: calling `h(TextInput, ...)` twice with differently-shaped
// attrs in this file otherwise makes TextInput's inherited HTML attributes blow up into
// a union TypeScript refuses to represent (TS2590). The props still reach the DOM at runtime;
// only the compile-time prop check on this call site is traded away.
const TextInputComponent = TextInput as unknown as Component;

describe('component TextInput', () => {
  it('passes an aria-describedby attribute through to the native input unchanged', () => {
    const wrapper = mount(TextInput, { attrs: { 'aria-describedby': 'name-desc name-error' } });

    expect(wrapper.find('input').attributes('aria-describedby')).toBe('name-desc name-error');
  });

  it('renders no aria-describedby when none is given', () => {
    const wrapper = mount(TextInput);

    expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined();
  });

  describe('accessibility', () => {
    it('has no violations when labelled, with no error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'name' }, 'Name'),
          h(TextInputComponent, { id: 'name' }),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when labelled, invalid, and described by a rendered error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'name' }, 'Name'),
          h(TextInputComponent, { 'id': 'name', 'errorMessage': 'Required', 'aria-describedby': 'name-error' }),
          h('span', { id: 'name-error', role: 'alert' }, 'Required'),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
