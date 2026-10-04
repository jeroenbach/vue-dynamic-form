import type { Component } from 'vue';
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { starterMetadata } from '@/metadata';
import { addButton, click } from './choice.test-helpers';
import { autoChoiceMetadata, explicitChoiceArrayMetadata } from './fixtures/choiceMetadata';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

// The smallest template that renders a repeatable choice: any render a heavier template adds on top is its own cost.
const MinimalTemplate = defineComponent({
  setup: (_, { slots }) => () => h(DynamicFormTemplate as any, { metadataConfiguration: starterMetadata }, {
    'default': (scope: any) => slots.default?.(scope),
    'default-input': (scope: any) => h('input', {
      value: scope.fieldContext.value.value ?? '',
      onInput: (event: Event) => scope.fieldContext.handleChange((event.target as HTMLInputElement).value),
    }),
    'heading-choice-array': (scope: any) => [
      slots.default?.(scope),
      h('button', { 'data-testid': 'minimal-add-sms', 'onClick': () => scope.addChoiceOccurrence('sms') }, 'add'),
    ],
    'default-choice-array-item': (scope: any) => slots.default?.(scope),
  }),
});

async function mountWith(template?: Component, initialValues?: Record<string, unknown>) {
  return mountInForm({ metadata: explicitChoiceArrayMetadata, template, initialValues, settings: { analytics: true } });
}

describe('component StarterFormTemplate - choice-array render counts', () => {
  const initialValues = { channels: { email: ['ops@acme.example'] } };

  it('re-renders an existing occurrence no more often than a minimal template when another is added', async () => {
    const starter = await mountWith(undefined, initialValues);
    const minimal = await mountWith(MinimalTemplate, initialValues);
    const starterBefore = renderCount(starter.wrapper, 'channels.email[0]');
    const minimalBefore = renderCount(minimal.wrapper, 'channels.email[0]');

    await click(addButton(starter.wrapper, 'channels', 'sms'));
    await click(minimal.wrapper.find('[data-testid="minimal-add-sms"]'));

    const starterDelta = renderCount(starter.wrapper, 'channels.email[0]') - starterBefore;
    const minimalDelta = renderCount(minimal.wrapper, 'channels.email[0]') - minimalBefore;
    expect(starterDelta).toBeLessThanOrEqual(minimalDelta);
  });

  it('does not re-render a sibling occurrence when typing in another occurrence', async () => {
    const { wrapper } = await mountWith(undefined, { channels: { email: ['ops@acme.example'], sms: ['+1'] } });
    const before = renderCount(wrapper, 'channels.sms[0]');

    await wrapper.findAll('input')[0].setValue('changed@acme.example');
    await flushPromises();

    expect(renderCount(wrapper, 'channels.sms[0]') - before).toBe(0);
  });
});

describe('component StarterFormTemplate - automatic-mode choice render counts', () => {
  it('does not re-render an unrelated sibling field outside the choice when a branch field changes', async () => {
    const { wrapper } = await mountInForm({
      metadata: [autoChoiceMetadata, { name: 'sibling', type: 'text' }],
      settings: { analytics: true },
    });

    const before = renderCount(wrapper, 'sibling');

    await wrapper.find('[data-testid="payment.card-input"]').setValue('4242 4242 4242 4242');
    await flushPromises();

    expect(renderCount(wrapper, 'sibling')).toBe(before);
  });
});
