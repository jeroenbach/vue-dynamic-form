import type { Component } from 'vue';
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { elementPlusMetadata } from '@/metadata';
import { addButton, removeButtons, tagsMetadata } from './fixtures/arrayHelpers';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

const initialValues = { tags: ['a', 'b', 'c'] };

// The smallest template that renders an array: any render a heavier template adds on top is its own cost.
const MinimalTemplate = defineComponent({
  setup: (_, { slots }) => () => h(DynamicFormTemplate as any, { metadataConfiguration: elementPlusMetadata }, {
    'default': (scope: any) => slots.default?.(scope),
    'default-input': (scope: any) => h('input', {
      value: scope.fieldContext.value.value ?? '',
      onInput: (event: Event) => scope.fieldContext.handleChange((event.target as HTMLInputElement).value),
    }),
    'default-array': (scope: any) => [
      slots.default?.(scope),
      h('button', { 'data-testid': 'minimal-add', 'onClick': scope.addItem }, 'add'),
    ],
    'default-array-item': (scope: any) => [
      slots.default?.(scope),
      h('button', { 'data-testid': `minimal-remove-${scope.index}`, 'onClick': scope.removeItem }, 'remove'),
    ],
  }),
});

async function mountWith(template?: Component) {
  return mountInForm({ metadata: tagsMetadata, initialValues, template, settings: { analytics: true } });
}

function counts(wrapper: Awaited<ReturnType<typeof mountWith>>['wrapper'], items = 3) {
  return Array.from({ length: items }, (_, index) => index).map(index => renderCount(wrapper, `tags[${index}]`));
}

function deltas(before: number[], after: number[]) {
  return after.map((count, index) => count - before[index]);
}

describe('component ElementPlusFormTemplate - array render counts', () => {
  it('does not re-render sibling items when typing in one item', async () => {
    const { wrapper } = await mountWith();
    const before = counts(wrapper);

    await wrapper.findAll('input')[0].setValue('x');
    await flushPromises();

    const [, second, third] = deltas(before, counts(wrapper));
    expect(second).toBe(0);
    expect(third).toBe(0);
  });

  it('re-renders existing items no more often than a minimal template when an item is added', async () => {
    const element = await mountWith();
    const minimal = await mountWith(MinimalTemplate);
    const elementBefore = counts(element.wrapper);
    const minimalBefore = counts(minimal.wrapper);

    await addButton(element.wrapper, 'tags').trigger('click');
    await minimal.wrapper.find('[data-testid="minimal-add"]').trigger('click');
    await flushPromises();

    const elementDelta = deltas(elementBefore, counts(element.wrapper));
    const minimalDelta = deltas(minimalBefore, counts(minimal.wrapper));
    elementDelta.forEach((delta, index) => expect(delta).toBeLessThanOrEqual(minimalDelta[index]));
  });

  it('re-renders remaining items no more often than a minimal template when an item is removed', async () => {
    const element = await mountWith();
    const minimal = await mountWith(MinimalTemplate);
    const elementBefore = counts(element.wrapper);
    const minimalBefore = counts(minimal.wrapper);

    await removeButtons(element.wrapper, 'tags')[2].trigger('click');
    await minimal.wrapper.find('[data-testid="minimal-remove-2"]').trigger('click');
    await flushPromises();

    const elementDelta = deltas(elementBefore, counts(element.wrapper, 2));
    const minimalDelta = deltas(minimalBefore, counts(minimal.wrapper, 2));
    elementDelta.forEach((delta, index) => expect(delta).toBeLessThanOrEqual(minimalDelta[index]));
  });
});
