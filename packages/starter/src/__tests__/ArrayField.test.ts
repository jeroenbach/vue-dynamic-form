import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import ArrayField from '@/ArrayField.vue';
import RepeaterCard from '@/RepeaterCard.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component ArrayField', () => {
  it('omits the add button data-testid when no dataTestid prop is given, and still emits add on click', async () => {
    const wrapper = mount(ArrayField, { props: { label: 'Tags', canAddItems: true } });

    const button = wrapper.find('button');
    expect(button.attributes('data-testid')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('spans the full grid row by default', () => {
    const wrapper = mount(ArrayField, { props: { label: 'Tags' } });

    expect(wrapper.classes()).toContain('sft-span-full');
  });

  it('renders no add button when canAddItems is false', () => {
    const wrapper = mount(ArrayField, { props: { label: 'Tags', canAddItems: false } });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  describe('accessibility', () => {
    it('has no violations with a label and at least one item', async () => {
      const wrapper = mount(ArrayField, {
        props: { label: 'Contacts', itemsLength: 1, canAddItems: true },
        slots: { default: () => h(RepeaterCard, { index: 0, title: 'Jordan Fay' }) },
        attachTo: document.body,
      });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations in the empty state with only the add button', async () => {
      const wrapper = mount(ArrayField, {
        props: { label: 'Contacts', itemsLength: 0, canAddItems: true },
        attachTo: document.body,
      });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
