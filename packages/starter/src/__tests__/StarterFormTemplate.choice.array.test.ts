import { describe, expect, it } from 'vitest';
import { addButton, addReason, click, isDisabled, section } from './choice.test-helpers';
import { explicitChoiceArrayMetadata } from './fixtures/choiceMetadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - repeatable choice chrome (heading-choice-array)', () => {
  it('renders one add-bar item per branch, inside sft-choice-addbar', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceArrayMetadata });

    const root = section(wrapper, 'channels');
    const addbar = root.find('.sft-choice-addbar');
    expect(addbar.exists()).toBe(true);
    expect(addbar.findAll('.sft-choice-addbar-item')).toHaveLength(3);
    expect(addButton(wrapper, 'channels', 'email').text()).toContain('Add Email');
    expect(addButton(wrapper, 'channels', 'sms').text()).toContain('Add SMS');
    expect(addButton(wrapper, 'channels', 'webhook').text()).toContain('Add Webhook');
  });

  it('shows the used-of-max count as the section pill', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { webhook: ['https://example.com/webhook'] } },
    });

    expect(section(wrapper, 'channels').find('.sft-pill').text()).toBe('1 of 3');
  });

  it('renders a reason only for the branch whose Add is disabled, not for every branch', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { webhook: ['https://example.com/webhook'] } },
    });

    expect(isDisabled(addButton(wrapper, 'channels', 'webhook'))).toBe(true);
    expect(addReason(wrapper, 'channels', 'webhook').text()).toBe('The limit for Webhook has been reached.');

    expect(isDisabled(addButton(wrapper, 'channels', 'email'))).toBe(false);
    expect(addReason(wrapper, 'channels', 'email').exists()).toBe(false);
    expect(isDisabled(addButton(wrapper, 'channels', 'sms'))).toBe(false);
    expect(addReason(wrapper, 'channels', 'sms').exists()).toBe(false);
  });

  it('ties the disabled button to its reason through aria-describedby', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { webhook: ['https://example.com/webhook'] } },
    });

    const button = addButton(wrapper, 'channels', 'webhook');
    const reason = addReason(wrapper, 'channels', 'webhook');
    expect(button.attributes('aria-describedby')).toBe(reason.attributes('id'));
  });

  it('renders each active occurrence through RepeaterCard chrome (sft-repeater)', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { email: ['ops@acme.example'] } },
    });

    const repeater = section(wrapper, 'channels').find('.sft-repeater');
    expect(repeater.exists()).toBe(true);
    expect(repeater.find('.sft-repeater-header').exists()).toBe(true);
    expect(repeater.find('.sft-repeater-title-group').exists()).toBe(true);
    expect(repeater.find('.sft-repeater-badge').text()).toBe('1');
    expect(repeater.find('.sft-repeater-title').text()).toBe('Email');
  });

  it('adds a new occurrence of a branch when its add button is clicked', async () => {
    const { wrapper, values } = await mountInForm({ metadata: explicitChoiceArrayMetadata });

    await click(addButton(wrapper, 'channels', 'email'));

    expect(section(wrapper, 'channels').findAll('.sft-repeater')).toHaveLength(1);
    expect(values().channels.email).toHaveLength(1);
  });
});
