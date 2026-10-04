import { describe, expect, it } from 'vitest';
import { headingMetadata, selectMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - text, select, and heading chrome', () => {
  it('renders a text field with the field, label, control, and description classes', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, description: 'Your legal first name', minOccurs: 1 },
      settings: { showRequiredOrOptional: 'required' },
    });

    const field = wrapper.find('.sft-field');
    expect(field.exists()).toBe(true);
    expect(field.find('.sft-field-label').text()).toContain('First name');
    expect(field.find('.sft-field-label .sft-tag-required').exists()).toBe(true);
    expect(field.find('.sft-field-control-row .sft-field-control .sft-input').exists()).toBe(true);
    expect(field.find('.sft-field-desc').text()).toBe('Your legal first name');
    expect(wrapper.find('.sft-error').exists()).toBe(false);
    expect(wrapper.html()).not.toMatch(/class="[^"]*\b(?:flex|grid|rounded|text-sm|bg-)/);
  });

  it('shows the optional tag when the field is not required', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 0 } });

    expect(wrapper.find('.sft-tag-optional').text()).toBe('Optional');
    expect(wrapper.find('.sft-tag-required').exists()).toBe(false);
  });

  it('renders a select field with the sft-select class and its options', async () => {
    const { wrapper } = await mountInForm({ metadata: selectMetadata });

    const select = wrapper.find('.sft-field select.sft-select');
    expect(select.exists()).toBe(true);
    expect(select.findAll('option')).toHaveLength(3);
    expect(select.find('option[value="software"]').text()).toBe('Software');
  });

  it('renders a heading-typed field with children through the section card chrome, label, description, and the nested children', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...headingMetadata, description: 'Basic details' } });

    const section = wrapper.find('.sft-section');
    expect(section.exists()).toBe(true);
    expect(section.find('.sft-section-title').text()).toContain('Person');
    expect(section.find('.sft-section-desc').text()).toBe('Basic details');
    expect(section.findAll('.sft-input')).toHaveLength(2);
    expect(wrapper.find('.sft-choice-group-title').exists()).toBe(false);
  });

  it('shows a validation error as sft-error after validating an empty required text field', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('shows the dependent placeholder instead of the control when dependentOnMessage is set', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, dependentOnMessage: 'Available once migration is enabled' },
    });

    expect(wrapper.find('.sft-dependent').text()).toBe('Available once migration is enabled');
    expect(wrapper.find('input.sft-input').exists()).toBe(false);
  });
});
