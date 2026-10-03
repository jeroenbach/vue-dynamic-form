import type { Component } from 'vue';
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { elementPlusMetadata } from '@/metadata';
import { addButton, click, explicitRepeatable } from './choice.test-helpers';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

// The smallest template that renders a repeatable choice: any render a heavier template adds on top is its own cost.
const MinimalTemplate = defineComponent({
  setup: (_, { slots }) => () => h(DynamicFormTemplate as any, { metadataConfiguration: elementPlusMetadata }, {
    'default': (scope: any) => slots.default?.(scope),
    'default-input': (scope: any) => h('input', {
      value: scope.fieldContext.value.value ?? '',
      onInput: (event: Event) => scope.fieldContext.handleChange((event.target as HTMLInputElement).value),
    }),
    'default-choice-array': (scope: any) => [
      slots.default?.(scope),
      h('button', { 'data-testid': 'minimal-add-b', 'onClick': () => scope.addChoiceOccurrence('b') }, 'add'),
    ],
    'default-choice-array-item': (scope: any) => slots.default?.(scope),
  }),
});

async function mountWith(template?: Component, initialValues?: Record<string, unknown>) {
  return mountInForm({ metadata: explicitRepeatable, template, initialValues, settings: { analytics: true } });
}

describe('component ElementPlusFormTemplate - choice render counts', () => {
  const initialValues = { pick: { a: ['x'] } };

  it('re-renders an existing occurrence no more often than a minimal template when another is added', async () => {
    const element = await mountWith(undefined, initialValues);
    const minimal = await mountWith(MinimalTemplate, initialValues);
    const elementBefore = renderCount(element.wrapper, 'pick.a[0]');
    const minimalBefore = renderCount(minimal.wrapper, 'pick.a[0]');

    await click(addButton(element.wrapper, 'pick', 'b'));
    await click(minimal.wrapper.find('[data-testid="minimal-add-b"]'));

    const elementDelta = renderCount(element.wrapper, 'pick.a[0]') - elementBefore;
    const minimalDelta = renderCount(minimal.wrapper, 'pick.a[0]') - minimalBefore;
    expect(elementDelta).toBeLessThanOrEqual(minimalDelta);
  });

  it('does not re-render a sibling occurrence when typing in another occurrence', async () => {
    const { wrapper } = await mountWith(undefined, { pick: { a: ['x'], b: ['y'] } });
    const before = renderCount(wrapper, 'pick.b[0]');

    await wrapper.findAll('input')[0].setValue('changed');
    await flushPromises();

    expect(renderCount(wrapper, 'pick.b[0]') - before).toBe(0);
  });
});
