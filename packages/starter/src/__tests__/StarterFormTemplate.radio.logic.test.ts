import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { radioMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - radio field, id/name wiring and overrides', () => {
  it('associates the visible field label with a real, rendered radio input via a shared id', async () => {
    const { wrapper } = await mountInForm({ metadata: radioMetadata });

    const labelFor = wrapper.find('label.sft-field-label').attributes('for');
    expect(labelFor).toBe('contactMethod');

    const target = wrapper.find(`#${labelFor}`);
    expect(target.exists()).toBe(true);
    expect(target.element.tagName).toBe('INPUT');
    expect((target.element as HTMLInputElement).type).toBe('radio');
  });

  it('gives every option input the same name, so the browser groups them, with no aria-label/aria-labelledby mechanism', async () => {
    const { wrapper } = await mountInForm({ metadata: radioMetadata });

    const names = wrapper.findAll('input[type="radio"]').map(input => input.attributes('name'));
    expect(names).toEqual(['contactMethod', 'contactMethod']);

    const group = wrapper.find('.sft-radio-group');
    expect(group.attributes('aria-label')).toBeUndefined();
    expect(group.attributes('aria-labelledby')).toBeUndefined();
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
