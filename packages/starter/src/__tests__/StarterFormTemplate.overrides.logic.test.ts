import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import StarterFormTemplate from '@/StarterFormTemplate.vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { headingMetadata, richTextMetadata, richTextMetadataConfiguration, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

function customMarkup(testId: string) {
  return vi.fn((scope: any) => h('div', { 'data-testid': testId }, scope.fieldMetadata.name));
}

function findByTestId(wrapper: VueWrapper, testId: string) {
  return wrapper.findAll(`[data-testid="${testId}"]`);
}

describe('component StarterFormTemplate - extendMetadata as metadataConfiguration', () => {
  it('renders a field using an extended property and reaches the value through to the input slot', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: richTextMetadata,
      template: createConsumerWrapper({ metadataConfiguration: richTextMetadataConfiguration }),
      initialValues: { body: 'hello' },
    });

    const input = wrapper.find('input.sft-input').element as HTMLInputElement;
    expect(input.value).toBe('hello');

    await wrapper.find('input').setValue('updated');
    expect(values().body).toBe('updated');
  });

  it('types the extended field property on the default-input slot scope', () => {
    type Field = GetMetadataType<typeof richTextMetadataConfiguration>;
    const field: Field = { name: 'body', toolbar: true };
    expectTypeOf(field.toolbar).toEqualTypeOf<boolean | undefined>();
  });
});

describe('component StarterFormTemplate - per-type slots passed through to the dispatcher', () => {
  it('renders a consumer slot for a custom field type inside the built-in chrome', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { name: 'notes', type: 'richText', fieldOptions: { label: 'Notes' }, rows: 6 },
      template: createConsumerWrapper({
        overrides: {
          'richText-input': (scope: any) => h('textarea', {
            'data-testid': 'custom-richtext',
            'rows': scope.fieldMetadata.rows,
            'value': scope.fieldContext.value.value,
            'onInput': (e: Event) => scope.fieldContext.handleChange((e.target as HTMLTextAreaElement).value),
          }),
        },
      }),
      initialValues: { notes: 'hello' },
    });

    const textarea = wrapper.find('[data-testid="custom-richtext"]');
    expect(textarea.exists()).toBe(true);
    expect((textarea.element as HTMLTextAreaElement).rows).toBe(6);
    expect(wrapper.find('.sft-field').exists()).toBe(true);
    expect(wrapper.find('input.sft-input').exists()).toBe(false);

    await textarea.setValue('updated');
    expect(values().notes).toBe('updated');
  });

  it('prefers a dedicated built-in per-type slot over default-input', async () => {
    const customInput = customMarkup('custom-text-input');
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({
        overrides: { 'text-input': customInput, 'default-input': customMarkup('default-input-override') },
      }),
    });

    expect(findByTestId(wrapper, 'custom-text-input')).toHaveLength(1);
    expect(findByTestId(wrapper, 'default-input-override')).toHaveLength(0);
  });

  it('forwards a slot the consumer adds after the form was mounted', async () => {
    const showRichText = ref(false);
    const Wrapper = defineComponent({
      setup: (_, { slots }) => () => h(
        StarterFormTemplate as any,
        {},
        {
          input: (scope: any) => slots.default?.(scope),
          ...(showRichText.value ? { 'richText-input': customMarkup('late-richtext') } : {}),
        },
      ),
    });
    const { wrapper } = await mountInForm({
      metadata: { name: 'notes', type: 'richText', fieldOptions: { label: 'Notes' } },
      template: Wrapper,
    });
    expect(findByTestId(wrapper, 'late-richtext')).toHaveLength(0);

    showRichText.value = true;
    await flushPromises();

    expect(findByTestId(wrapper, 'late-richtext')).toHaveLength(1);
  });
});

describe('component StarterFormTemplate - overriding one input slot', () => {
  it('replaces only the overridden control and keeps the chrome around it', async () => {
    const customInput = customMarkup('custom-text-input');
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({ overrides: { 'default-input': customInput } }),
    });

    expect(findByTestId(wrapper, 'custom-text-input')).toHaveLength(1);
    expect(wrapper.find('input.sft-input').exists()).toBe(false);
    expect(wrapper.find('.sft-field').exists()).toBe(true);
  });

  it('hands the override the field metadata, the field context, and the disabled flag', async () => {
    const customInput = customMarkup('custom-text-input');
    const { values } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({ overrides: { 'default-input': customInput } }),
    });

    const scope = customInput.mock.calls[0][0];
    expect(scope.fieldMetadata.name).toBe('text');
    expect(typeof scope.fieldContext.handleChange).toBe('function');
    expect(typeof scope.disabled).toBe('boolean');

    scope.fieldContext.handleChange('changed');
    expect(values().text).toBe('changed');
  });
});

describe('component StarterFormTemplate - overriding the chrome wrapper', () => {
  it('shows the consumer chrome around the input instead of the built-in field wrapper', async () => {
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({
        overrides: { default: (scope, slots) => h('section', { 'data-testid': 'custom-chrome' }, slots.default?.(scope)) },
      }),
    });

    const chrome = wrapper.find('[data-testid="custom-chrome"]');
    expect(chrome.exists()).toBe(true);
    expect(chrome.find('input.sft-input').exists()).toBe(true);
    expect(wrapper.find('.sft-field').exists()).toBe(false);
  });

  it('keeps the children of a heading inside a replaced heading wrapper', async () => {
    const { wrapper } = await mountInForm({
      metadata: headingMetadata,
      template: createConsumerWrapper({
        overrides: { heading: (scope, slots) => h('section', { 'data-testid': 'custom-heading' }, slots.default?.(scope)) },
      }),
    });

    const heading = wrapper.find('[data-testid="custom-heading"]');
    expect(heading.exists()).toBe(true);
    expect(heading.findAll('input.sft-input')).toHaveLength(2);
    expect(wrapper.text()).not.toContain('Person');
  });
});
