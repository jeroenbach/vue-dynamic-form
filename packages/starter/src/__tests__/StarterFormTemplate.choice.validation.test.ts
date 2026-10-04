import { describe, expect, it } from 'vitest';
import { section } from './choice.test-helpers';
import { explicitChoiceArrayMetadata, explicitChoiceMetadata } from './fixtures/choiceMetadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - choice section-level error (ChoiceSectionCard)', () => {
  it('shows a section-level sft-error in the header when the choice is below its minOccurs', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: explicitChoiceMetadata });

    await validate();

    const root = section(wrapper, 'launch');
    expect(root.find('header .sft-error').exists()).toBe(true);
  });

  it('shows no section error once a branch is selected', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: explicitChoiceMetadata, initialValues: { launch: { selfServe: 'x' } } });

    await validate();

    expect(section(wrapper, 'launch').find('header .sft-error').exists()).toBe(false);
  });
});

describe('component StarterFormTemplate - choice-array section-level error (ChoiceArraySectionCard)', () => {
  it('shows a section-level sft-error in the header when the choice is below its minOccurs', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: explicitChoiceArrayMetadata });

    await validate();

    const root = section(wrapper, 'channels');
    expect(root.find('header .sft-error').exists()).toBe(true);
  });

  it('shows no section error once at least one occurrence is active', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: explicitChoiceArrayMetadata,
      initialValues: { channels: { email: ['ops@acme.example'] } },
    });

    await validate();

    expect(section(wrapper, 'channels').find('header .sft-error').exists()).toBe(false);
  });
});
