import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { choiceCard } from './choice.test-helpers';
import { explicitChoiceMetadata } from './fixtures/choiceMetadata';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - selecting a card updates the bound value', () => {
  it('moves is-selected to the clicked card and switches the field value to that branch', async () => {
    const { wrapper, values } = await mountInForm({ metadata: explicitChoiceMetadata });

    await choiceCard(wrapper, 'launch', 'selfServe').trigger('click');
    await wrapper.find('[data-testid="launch.selfServe-input"]').setValue('rolling out');

    expect(choiceCard(wrapper, 'launch', 'selfServe').classes()).toContain('is-selected');
    expect(choiceCard(wrapper, 'launch', 'guided').classes()).not.toContain('is-selected');
    expect(values().launch.selfServe).toBe('rolling out');
  });

  it('moves is-selected again when a second card is clicked', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    await choiceCard(wrapper, 'launch', 'selfServe').trigger('click');
    await choiceCard(wrapper, 'launch', 'guided').trigger('click');

    expect(choiceCard(wrapper, 'launch', 'selfServe').classes()).not.toContain('is-selected');
    expect(choiceCard(wrapper, 'launch', 'guided').classes()).toContain('is-selected');
  });
});

describe('component StarterFormTemplate - the #icon slot reaches choice-card glyphs', () => {
  it('replaces a choice-card icon with the custom render output', async () => {
    const { wrapper } = await mountInForm({
      metadata: explicitChoiceMetadata,
      template: createConsumerWrapper({
        icon: props => h('i', { 'data-testid': 'custom-icon', 'data-name': props.name }),
      }),
    });

    const card = choiceCard(wrapper, 'launch', 'selfServe');
    const custom = card.find('[data-testid="custom-icon"]');
    expect(custom.exists()).toBe(true);
    expect(custom.attributes('data-name')).toBe('rocket');
    expect(card.find('svg').exists()).toBe(false);
  });
});

describe('component StarterFormTemplate - choice-card icon fail-soft', () => {
  it('renders nothing and warns once for an iconName outside the registry, keeping the card text', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    const card = choiceCard(wrapper, 'launch', 'legacy');
    expect(card.find('svg').exists()).toBe(false);
    expect(card.find('.sft-choice-title').text()).toBe('Legacy migration');
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });
});
