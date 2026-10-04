import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - the #icon slot reaches array chrome glyphs', () => {
  it('replaces the empty-state icon with the custom render output', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false },
      template: createConsumerWrapper({
        icon: props => h('i', { 'data-testid': 'custom-icon', 'data-name': props.name }),
      }),
    });

    const custom = wrapper.find('.sft-empty [data-testid="custom-icon"]');
    expect(custom.exists()).toBe(true);
    expect(custom.attributes('data-name')).toBe('grid');
    expect(wrapper.find('.sft-empty svg').exists()).toBe(false);
  });

  it('replaces the remove-button glyph on a RepeaterCard item', async () => {
    const { wrapper } = await mountInForm({
      metadata: headingArrayMetadata,
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }] },
      template: createConsumerWrapper({
        icon: props => h('i', { 'data-testid': 'custom-icon', 'data-name': props.name }),
      }),
    });

    const custom = wrapper.find('.sft-repeater [data-testid="custom-icon"]');
    expect(custom.exists()).toBe(true);
    expect(custom.attributes('data-name')).toBe('trash');
    expect(wrapper.find('.sft-repeater svg').exists()).toBe(false);
  });
});
