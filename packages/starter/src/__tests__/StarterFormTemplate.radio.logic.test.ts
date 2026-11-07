import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { radioMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - radio field, id/name wiring and overrides', () => {
  it('names the radiogroup via aria-labelledby pointing at the rendered field label, which carries no `for`', async () => {
    const { wrapper } = await mountInForm({ metadata: radioMetadata });

    const group = wrapper.find('.sft-radio-group');
    expect(group.attributes('aria-labelledby')).toBe('contactMethod-label');

    const label = wrapper.find('#contactMethod-label');
    expect(label.exists()).toBe(true);
    expect(label.text()).toContain('How should we contact you?');
    // A `label for` aimed at one radio would give that radio two labels (the field label plus
    // its own option label), so the field label is a plain span for this field type.
    expect(label.element.tagName).not.toBe('LABEL');
    expect(label.attributes('for')).toBeUndefined();
  });

  it('gives every option input the same name, so the browser groups them, and exactly one label each', async () => {
    const { wrapper } = await mountInForm({ metadata: radioMetadata });

    const inputs = wrapper.findAll('input[type="radio"]');
    expect(inputs.map(input => input.attributes('name'))).toEqual(['contactMethod', 'contactMethod']);

    for (const input of inputs) {
      expect(input.attributes('id')).toBeUndefined();
      expect(input.element.closest('label')?.classList.contains('sft-radio-option')).toBe(true);
    }
  });

  it('updates the model when a different option is chosen, selecting only that option', async () => {
    const { wrapper, values } = await mountInForm({ metadata: radioMetadata, initialValues: { contactMethod: 'email' } });

    await wrapper.findAll('input[type="radio"]')[1].setValue();

    expect(values().contactMethod).toBe('phone');
    const rows = wrapper.findAll('.sft-radio-option');
    expect(rows[1].classes()).toContain('is-selected');
    expect(rows[0].classes()).not.toContain('is-selected');
  });

  it('follows an externally driven value change with no stale local-state copy', async () => {
    const { wrapper, setFieldValue } = await mountInForm({ metadata: radioMetadata, initialValues: { contactMethod: 'email' } });

    expect(wrapper.findAll('.sft-radio-option')[0].classes()).toContain('is-selected');

    setFieldValue('contactMethod', 'phone');
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('.sft-radio-option');
    expect(rows[1].classes()).toContain('is-selected');
    expect(rows[0].classes()).not.toContain('is-selected');
  });

  it('replaces only the radio control when #radio-input is overridden, keeping the chrome around it', async () => {
    const customInput = vi.fn((scope: any) => h('div', { 'data-testid': 'custom-radio' }, scope.fieldMetadata.name));
    const { wrapper } = await mountInForm({
      metadata: radioMetadata,
      template: createConsumerWrapper({ overrides: { 'radio-input': customInput } }),
    });

    expect(wrapper.find('[data-testid="custom-radio"]').exists()).toBe(true);
    expect(wrapper.find('.sft-radio-group').exists()).toBe(false);
    expect(wrapper.find('.sft-field').exists()).toBe(true);
  });

  it('renders RadioGroup inside the normal field chrome when no override is supplied', async () => {
    const { wrapper } = await mountInForm({
      metadata: radioMetadata,
      template: createConsumerWrapper(),
    });

    expect(wrapper.find('.sft-field .sft-radio-group').exists()).toBe(true);
  });
});
