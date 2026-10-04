import { describe, expect, it } from 'vitest';
import ArraySectionCard from '@/ArraySectionCard.vue';
import { addButton, section } from './fixtures/arrayHelpers';
import { headingArrayMetadata, inlineArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - inline array chrome (default-array)', () => {
  it('renders label, description, a count pill, the grid, and the footer, with no empty-state card', async () => {
    const { wrapper } = await mountInForm({ metadata: inlineArrayMetadata, initialValues: { tags: ['a', 'b'] } });

    const root = section(wrapper, 'tags');
    expect(root.classes()).toContain('sft-section');
    expect(root.find('.sft-section-title').text()).toBe('Tags');
    expect(root.find('.sft-pill').text()).toBe('2 items');
    expect(root.find('.sft-grid').exists()).toBe(true);
    expect(root.find('.sft-array-footer').exists()).toBe(true);
    expect(root.findAll('input.sft-input')).toHaveLength(2);
    expect(root.find('.sft-empty').exists()).toBe(false);
  });

  it('shows a singular item label for exactly one item', async () => {
    const { wrapper } = await mountInForm({ metadata: inlineArrayMetadata, initialValues: { tags: ['a'] } });

    expect(section(wrapper, 'tags').find('.sft-pill').text()).toBe('1 item');
  });

  it('has no empty-state card even with zero items', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...inlineArrayMetadata, minOccurs: 0, autoAddMinOccurs: false } });

    expect(section(wrapper, 'tags').find('.sft-empty').exists()).toBe(false);
    expect(section(wrapper, 'tags').find('.sft-pill').text()).toBe('0 items');
  });

  it('applies sft-col-span when the field is full width', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...inlineArrayMetadata, fullWidth: true }, initialValues: { tags: ['a'] } });

    expect(section(wrapper, 'tags').classes()).toContain('sft-col-span');
  });

  it('renders the add button inside the footer', async () => {
    const { wrapper } = await mountInForm({ metadata: inlineArrayMetadata, initialValues: { tags: ['a'] } });

    const add = addButton(wrapper, 'tags');
    expect(add.exists()).toBe(true);
    expect(section(wrapper, 'tags').find('.sft-array-footer').element.contains(add.element)).toBe(true);
  });
});

describe('component StarterFormTemplate - Decision C: ArrayField and ArraySectionCard stay distinct', () => {
  it('default-array never renders the empty-state card and heading-array never renders through ArrayField-only markup', async () => {
    const { wrapper } = await mountInForm({
      metadata: [
        { ...inlineArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
        { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
      ],
    });

    expect(section(wrapper, 'tags').find('.sft-empty').exists()).toBe(false);
    expect(section(wrapper, 'contacts').find('.sft-empty').exists()).toBe(true);
    expect(wrapper.findComponent(ArraySectionCard).exists()).toBe(true);
  });
});
