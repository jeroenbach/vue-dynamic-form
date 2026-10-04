import { describe, expect, it } from 'vitest';
import StarterIcon from '@/StarterIcon.vue';
import { choiceCard, choiceCards, section } from './choice.test-helpers';
import { autoChoiceMetadata, autoChoiceSingleBranchMetadata, explicitChoiceArrayMetadata, explicitChoiceMetadata } from './fixtures/choiceMetadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - automatic-mode choice chrome (default-choice)', () => {
  it('renders the dashed group chrome and the active branch fields in the body', async () => {
    const { wrapper } = await mountInForm({
      metadata: autoChoiceMetadata,
      initialValues: { payment: { card: '4242 4242 4242 4242' } },
    });

    const group = section(wrapper, 'payment');
    expect(group.classes()).toContain('sft-choice-group');
    expect(group.find('.sft-choice-group-title').text()).toContain('Payment method');
    expect(group.find('.sft-choice-group-desc').text()).toBe('Fields switch automatically with the selected method.');
    const body = group.find('.sft-choice-group-body');
    expect(body.exists()).toBe(true);
    expect(body.find('input.sft-input').element.getAttribute('value')).toBe('4242 4242 4242 4242');
  });

  it('renders no card picker, only the active branch content', async () => {
    const { wrapper } = await mountInForm({
      metadata: autoChoiceMetadata,
      initialValues: { payment: { card: '4242 4242 4242 4242' } },
    });

    expect(wrapper.find('.sft-choice-card').exists()).toBe(false);
  });

  it('renders the same chrome for a single-branch automatic choice, with no special-casing', async () => {
    const { wrapper } = await mountInForm({
      metadata: autoChoiceSingleBranchMetadata,
      initialValues: { payment: { card: '4242 4242 4242 4242' } },
    });

    const group = section(wrapper, 'payment');
    expect(group.classes()).toContain('sft-choice-group');
    expect(group.find('.sft-choice-group-title').exists()).toBe(true);
    expect(group.find('.sft-choice-group-body').exists()).toBe(true);
  });
});

describe('component StarterFormTemplate - explicit-mode choice chrome (heading-choice)', () => {
  it('renders one card per branch inside the choice grid', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    const cards = choiceCards(wrapper, 'launch');
    expect(cards).toHaveLength(3);
    expect(section(wrapper, 'launch').find('.sft-choice-grid').exists()).toBe(true);
  });

  it('gives every card the radio, text, title-row, title, and description chrome', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    const card = choiceCard(wrapper, 'launch', 'selfServe');
    expect(card.find('.sft-choice-radio').exists()).toBe(true);
    expect(card.find('.sft-choice-radio-dot').exists()).toBe(true);
    expect(card.find('.sft-choice-text').exists()).toBe(true);
    expect(card.find('.sft-choice-title-row').exists()).toBe(true);
    expect(card.find('.sft-choice-title').text()).toBe('Self-serve rollout');
    expect(card.find('.sft-choice-desc').text()).toBe('Your team configures and launches at its own pace.');
  });

  it('starts with no card selected and marks is-selected only once a branch is active', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    expect(choiceCard(wrapper, 'launch', 'selfServe').classes()).not.toContain('is-selected');
    expect(choiceCard(wrapper, 'launch', 'guided').classes()).not.toContain('is-selected');
  });

  it('marks the card for the branch carrying a loaded value as is-selected', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata, initialValues: { launch: { selfServe: 'x' } } });

    expect(choiceCard(wrapper, 'launch', 'selfServe').classes()).toContain('is-selected');
    expect(choiceCard(wrapper, 'launch', 'guided').classes()).not.toContain('is-selected');
  });
});

describe('component StarterFormTemplate - choiceShowChoiceSelect toggles the picker UI', () => {
  it('renders no choice grid or add bar when choiceShowChoiceSelect is false', async () => {
    const { wrapper: singleWrapper } = await mountInForm({ metadata: { ...explicitChoiceMetadata, choiceShowChoiceSelect: false } });
    expect(singleWrapper.find('.sft-choice-grid').exists()).toBe(false);

    const { wrapper: arrayWrapper } = await mountInForm({ metadata: { ...explicitChoiceArrayMetadata, choiceShowChoiceSelect: false } });
    expect(arrayWrapper.find('.sft-choice-addbar').exists()).toBe(false);
  });
});

describe('component StarterFormTemplate - choice-card icons render through StarterIcon', () => {
  it('renders the icon registry name on the card carrying iconName', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    const card = choiceCard(wrapper, 'launch', 'selfServe');
    expect(card.find('.sft-choice-icon').exists()).toBe(true);
    expect(card.findComponent(StarterIcon).props('name')).toBe('rocket');
  });

  it('renders no icon region for a branch with no iconName', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitChoiceMetadata });

    const card = choiceCard(wrapper, 'launch', 'guided');
    expect(card.find('.sft-choice-icon').exists()).toBe(false);
    expect(card.find('.sft-choice-title').text()).toBe('Guided rollout');
  });
});
