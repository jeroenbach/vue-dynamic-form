import { describe, expect, it } from 'vitest';
import { groupMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - group field chrome', () => {
  it('renders a group through GroupField, never SectionCard', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata });

    expect(wrapper.find('.sft-choice-group-title').exists()).toBe(true);
    expect(wrapper.find('.sft-choice-group-title').text()).toBe('Billing address');
    expect(wrapper.find('.sft-choice-group-body').exists()).toBe(true);
    expect(wrapper.find('.sft-section').exists()).toBe(false);
  });

  it('renders the description as sft-field-desc', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata });

    expect(wrapper.find('.sft-field-desc').text()).toBe('Shown only when a paid tier is selected.');
  });

  it('renders no description element when the group has none', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...groupMetadata, description: undefined } });

    expect(wrapper.find('.sft-field-desc').exists()).toBe(false);
  });

  it('renders each child field inside the group body', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata, initialValues: { address: { street: '12 Market Street', city: 'Rotterdam' } } });

    const body = wrapper.find('.sft-choice-group-body');
    expect(body.findAll('input.sft-input')).toHaveLength(2);
    expect(wrapper.find('[data-testid="address.street-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="address.city-input"]').exists()).toBe(true);
  });

  it('does not apply sft-hide-tag when no setting is given', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata });

    expect(wrapper.find('.sft-choice-group-body').classes()).not.toContain('sft-hide-tag');
  });

  it('applies sft-hide-tag on the group body when the settings set optional mode', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata, settings: { showRequiredOrOptional: 'optional' } });

    expect(wrapper.find('.sft-choice-group-body').classes()).toContain('sft-hide-tag');
  });

  it('nests the per-field optional tag under sft-hide-tag so the stylesheet suppresses it', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...groupMetadata, children: [{ name: 'street', type: 'text', minOccurs: 0, fieldOptions: { label: 'Street' } }] },
      settings: { showRequiredOrOptional: 'optional' },
    });

    const tag = wrapper.find('.sft-tag-optional');
    expect(tag.exists()).toBe(true);
    expect(wrapper.find('.sft-choice-group-body.sft-hide-tag').element.contains(tag.element)).toBe(true);
  });

  it('does not apply sft-hide-tag in required mode', async () => {
    const { wrapper } = await mountInForm({ metadata: groupMetadata, settings: { showRequiredOrOptional: 'required' } });

    expect(wrapper.find('.sft-choice-group-body').classes()).not.toContain('sft-hide-tag');
  });

  it('dims the group when disabled', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...groupMetadata, disabled: true } });

    expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
  });

  it('falls back to FormField for a heading-typed field with no children', async () => {
    const { wrapper } = await mountInForm({ metadata: { name: 'note', type: 'heading', fieldOptions: { label: 'Note' } } });

    expect(wrapper.find('.sft-field-label').text()).toContain('Note');
    expect(wrapper.find('.sft-choice-group-title').exists()).toBe(false);
  });
});
