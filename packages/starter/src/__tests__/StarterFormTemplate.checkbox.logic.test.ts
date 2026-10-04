import { describe, expect, it } from 'vitest';
import { checkboxMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - checkbox via the checkbox/checkbox-input slots', () => {
  it('renders a ToggleSwitch with the switch classes, off by default', async () => {
    const { wrapper } = await mountInForm({ metadata: checkboxMetadata });

    const field = wrapper.find('.sft-switch-field');
    expect(field.exists()).toBe(true);
    expect(field.find('.sft-switch-field-label').text()).toContain('Subscribe');

    const switchEl = field.find('.sft-switch');
    expect(switchEl.find('.sft-switch-track').exists()).toBe(true);
    expect(switchEl.find('.sft-switch-thumb').exists()).toBe(true);
    expect(switchEl.classes()).not.toContain('is-on');
  });

  it('exposes the field label as the switch\'s accessible name', async () => {
    const { wrapper } = await mountInForm({ metadata: checkboxMetadata });

    expect(wrapper.find('.sft-switch').attributes('aria-label')).toBe('Subscribe');
  });

  it('shows is-on only when the value is checked', async () => {
    const { wrapper } = await mountInForm({ metadata: checkboxMetadata, initialValues: { subscribe: true } });

    expect(wrapper.find('.sft-switch').classes()).toContain('is-on');
  });

  it('clicking the switch calls the change handler with true then false', async () => {
    const { wrapper, values } = await mountInForm({ metadata: checkboxMetadata });

    await wrapper.find('.sft-switch').trigger('click');
    expect(values().subscribe).toBe(true);

    await wrapper.find('.sft-switch').trigger('click');
    expect(values().subscribe).toBe(false);
  });

  it('turning off reports undefined instead of false when falseAsUndefined is set', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { ...checkboxMetadata, falseAsUndefined: true },
      initialValues: { subscribe: true },
    });

    await wrapper.find('.sft-switch').trigger('click');

    expect(values().subscribe).toBeUndefined();
  });

  it('keyboard space and enter toggle the switch the same way a click does', async () => {
    const { wrapper, values } = await mountInForm({ metadata: checkboxMetadata });

    await wrapper.find('.sft-switch').trigger('keydown.space');
    expect(values().subscribe).toBe(true);

    await wrapper.find('.sft-switch').trigger('keydown.enter');
    expect(values().subscribe).toBe(false);
  });

  it('a disabled switch ignores clicks', async () => {
    const { wrapper, values } = await mountInForm({ metadata: { ...checkboxMetadata, disabled: true } });

    await wrapper.find('.sft-switch').trigger('click');

    expect(values().subscribe).toBeUndefined();
  });

  it('blurring the switch does not throw and leaves the value untouched', async () => {
    const { wrapper, values } = await mountInForm({ metadata: checkboxMetadata });

    await wrapper.find('.sft-switch').trigger('blur');

    expect(values().subscribe).toBeUndefined();
  });
});
