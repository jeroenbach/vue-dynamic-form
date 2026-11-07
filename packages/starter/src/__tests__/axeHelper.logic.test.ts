import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('expectNoAxeViolations', () => {
  it('resolves without throwing for a clean container', async () => {
    const Labelled = defineComponent({
      render: () => h('button', { type: 'button' }, 'Submit'),
    });
    const wrapper = mount(Labelled, { attachTo: document.body });

    await expect(expectNoAxeViolations(wrapper.element)).resolves.toBeUndefined();
  });

  it('throws with the rule id and a node reference for a deliberate violation', async () => {
    const Unlabelled = defineComponent({
      render: () => h('input', { type: 'text' }),
    });
    const wrapper = mount(Unlabelled, { attachTo: document.body });

    await expect(expectNoAxeViolations(wrapper.element)).rejects.toThrow(/label/);
  });

  it('reports the affected node alongside the rule id', async () => {
    const Unlabelled = defineComponent({
      render: () => h('input', { type: 'text', id: 'orphan-input' }),
    });
    const wrapper = mount(Unlabelled, { attachTo: document.body });

    await expect(expectNoAxeViolations(wrapper.element)).rejects.toThrow(/orphan-input/);
  });
});
