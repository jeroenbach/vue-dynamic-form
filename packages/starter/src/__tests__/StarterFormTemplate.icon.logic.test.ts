import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import StarterIcon from '@/StarterIcon.vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { passwordMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - the #icon slot on a wrapper', () => {
  it('replaces the password show/hide glyph with the custom render output', async () => {
    const { wrapper } = await mountInForm({
      metadata: passwordMetadata,
      template: createConsumerWrapper({
        icon: props => h('i', { 'data-testid': 'custom-icon', 'data-name': props.name }),
      }),
    });

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="custom-icon"]').attributes('data-name')).toBe('eye');
    expect(wrapper.find('.sft-password-toggle svg').exists()).toBe(false);
  });
});

describe('component StarterFormTemplate - the #icon slot is unreachable through the bare :template usage', () => {
  it('still renders the Lucide default when #icon is supplied directly on DynamicForm', async () => {
    const { wrapper } = await mountInForm({
      metadata: passwordMetadata,
      slots: {
        icon: () => h('i', { 'data-testid': 'custom-icon' }),
      },
    });

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(false);
    expect(wrapper.findComponent(StarterIcon).props('name')).toBe('eye');
  });
});
