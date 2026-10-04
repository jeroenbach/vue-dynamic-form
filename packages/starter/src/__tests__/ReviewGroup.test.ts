import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ReviewGroup from '@/ReviewGroup.vue';
import { reviewRows } from './fixtures/reviewRows';

// Matches the component's own dashed placeholder glyph without putting a literal em dash in this file.
const placeholder = String.fromCodePoint(0x2014);

describe('component ReviewGroup', () => {
  it('renders the chrome with one row per entry and emits edit with no arguments on click', async () => {
    const wrapper = mount(ReviewGroup, { props: { title: 'Company', rows: reviewRows(), dataTestid: 'company-review' } });

    expect(wrapper.find('[data-testid="company-review"]').classes()).toContain('sft-review-group');
    expect(wrapper.find('.sft-review-header').exists()).toBe(true);
    expect(wrapper.find('.sft-review-title').text()).toBe('Company');
    expect(wrapper.findAll('.sft-review-row')).toHaveLength(2);
    expect(wrapper.findAll('.sft-review-key').map(node => node.text())).toEqual(['Company name', 'Secondary contact']);
    expect(wrapper.findAll('.sft-review-val').map(node => node.text())).toEqual(['Acme Industries', placeholder]);

    await wrapper.find('[data-testid="company-review-edit-button"]').trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[]]);
  });

  it('renders the dashed placeholder for an empty value, never an empty cell', () => {
    const wrapper = mount(ReviewGroup, { props: { title: 'Contacts', rows: [['Secondary contact', '']] } });

    expect(wrapper.find('.sft-review-val').text()).toBe(placeholder);
  });

  it('mounts standalone with no StarterFormTemplate ancestor and applies no wrapper class', () => {
    const wrapper = mount(ReviewGroup, { props: { title: 'Standalone', rows: [] } });

    expect(wrapper.classes()).not.toContain('sft-root');
    expect(wrapper.html()).not.toContain('sft-root');
  });
});
