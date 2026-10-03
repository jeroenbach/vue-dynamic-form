import { flushPromises } from '@vue/test-utils';
import { ElDatePicker, ElFormItem, ElInput } from 'element-plus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, useSlots } from 'vue';
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';
import { extendMetadata } from '@/metadata';
import { mountInput } from './ElementPlusFormTemplate.test-helpers';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import DocumentedRichTextWrapper from './fixtures/DocumentedRichTextWrapper.vue';
import DocumentedWrapper from './fixtures/DocumentedWrapper.vue';
import { attributesMetadata, dateAndTextMetadata, richTextMetadata, richTextMetadataConfiguration, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

function customMarkup(testId: string) {
  return vi.fn((scope: any) => h('div', { 'data-testid': testId }, scope.fieldMetadata.name));
}

describe('component ElementPlusFormTemplate - slots for consumer field types', () => {
  it('renders a consumer field type through its own input slot', async () => {
    const richTextInput = customMarkup('custom-rich-text');
    const { wrapper, values } = await mountInForm({
      metadata: richTextMetadata,
      template: createConsumerWrapper({
        metadataConfiguration: richTextMetadataConfiguration,
        overrides: { 'richText-input': richTextInput },
      }),
    });

    expect(wrapper.findAll('[data-testid="custom-rich-text"]')).toHaveLength(1);
    expect(wrapper.findComponent(ElInput).exists()).toBe(false);

    const scope = richTextInput.mock.calls[0][0];
    expect(scope.fieldMetadata.type).toBe('richText');
    scope.fieldContext.handleChange('<p>hi</p>');
    await flushPromises();
    expect(values().body).toBe('<p>hi</p>');
  });

  it('renders the default input when the consumer type has no input slot', async () => {
    const { wrapper } = await mountInForm({
      metadata: richTextMetadata,
      template: createConsumerWrapper({ metadataConfiguration: richTextMetadataConfiguration }),
    });

    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
  });

  it('works with the documented wrapper written as template syntax', async () => {
    const { wrapper } = await mountInForm({ metadata: dateAndTextMetadata, template: DocumentedWrapper });

    expect(wrapper.findAll('[data-testid="documented-date"]')).toHaveLength(1);
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(2);
    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
  });

  it('renders a consumer field type in the documented wrapper written as template syntax', async () => {
    const { wrapper, values } = await mountInForm({ metadata: richTextMetadata, template: DocumentedRichTextWrapper });

    expect(wrapper.findAll('[data-testid="documented-rich-text"]')).toHaveLength(1);
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(values().body).toBe('typed');
  });

  it('lets a consumer type that overrides a built-in type win', async () => {
    const textInput = customMarkup('custom-text');
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({
        metadataConfiguration: extendMetadata<{ text: { doc: string } }>(),
        overrides: { 'text-input': textInput },
      }),
    });

    expect(wrapper.findAll('[data-testid="custom-text"]')).toHaveLength(1);
    expect(wrapper.findComponent(ElInput).exists()).toBe(false);
  });

  it('forwards a slot the consumer adds after the form was mounted', async () => {
    const showRichText = ref(false);
    const Wrapper = defineComponent({
      setup: (_, { slots }) => () => h(
        ElementPlusFormTemplate as any,
        { metadataConfiguration: richTextMetadataConfiguration },
        {
          input: (scope: any) => slots.default?.(scope),
          ...(showRichText.value ? { 'richText-input': customMarkup('late-rich-text') } : {}),
        },
      ),
    });
    const { wrapper } = await mountInForm({ metadata: richTextMetadata, template: Wrapper });
    expect(wrapper.findAll('[data-testid="late-rich-text"]')).toHaveLength(0);

    showRichText.value = true;
    await flushPromises();

    expect(wrapper.findAll('[data-testid="late-rich-text"]')).toHaveLength(1);
  });
});

describe('component ElementPlusFormTemplate - slots without a built-in fallback', () => {
  it('forwards a per-type slot that has no built-in content', () => {
    const arrayItem = customMarkup('custom-array-item');
    const { wrapper } = mountInput('date-array-item', {
      fieldMetadata: { name: 'd', path: 'd', type: 'date' },
      slots: { 'date-array-item': arrayItem },
    });

    expect(wrapper.find('[data-testid="custom-array-item"]').exists()).toBe(true);
    expect(arrayItem.mock.calls[0][0].fieldMetadata.name).toBe('d');
  });

  it('falls back to the array item card when the per-type slot is not supplied', async () => {
    const { wrapper } = await mountInForm({ metadata: { name: 'd', type: 'date', maxOccurs: 2 } });

    expect(wrapper.find('[data-testid="custom-array-item"]').exists()).toBe(false);
    expect(wrapper.find('.epft-array-item').exists()).toBe(true);
  });
});

describe('component ElementPlusFormTemplate - which slots are forwarded', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('consumes the reserved and built-in names and forwards only the others', async () => {
    const received: string[][] = [];
    const DispatcherRecorder = defineComponent({
      name: 'DynamicFormTemplate',
      setup: () => {
        const slots = useSlots();
        return () => {
          received.push(Object.keys(slots));
          return null;
        };
      },
    });
    const everySlot = {
      'input': customMarkup('slot-input'),
      'attributes': customMarkup('slot-attributes'),
      'default': customMarkup('slot-default'),
      'default-input': customMarkup('slot-default-input'),
      'default-array': customMarkup('slot-default-array'),
      'default-array-item': customMarkup('slot-default-array-item'),
      'default-choice': customMarkup('slot-default-choice'),
      'default-choice-array': customMarkup('slot-default-choice-array'),
      'default-choice-array-item': customMarkup('slot-default-choice-array-item'),
      'default-wizard': customMarkup('slot-default-wizard'),
      'default-wizard-page': customMarkup('slot-default-wizard-page'),
      'text-wizard': customMarkup('slot-text-wizard'),
      'text-input': customMarkup('slot-text-input'),
      'date-input': customMarkup('slot-date-input'),
      'richText-input': customMarkup('slot-rich-text-input'),
    };

    await mountInForm({
      metadata: dateAndTextMetadata,
      template: createConsumerWrapper({ metadataConfiguration: richTextMetadataConfiguration, overrides: everySlot }),
      stubs: { DynamicFormTemplate: DispatcherRecorder },
    });

    const slotNames = received.flat();
    expect(slotNames).toContain('richText-input');
    expect(slotNames).toContain('text-wizard');
    expect(slotNames).not.toContain('input');
    expect(slotNames).not.toContain('attributes');
    for (const names of received)
      expect(new Set(names).size).toBe(names.length);
  });

  it('renders every field once and warns about no slots when many slots are supplied', async () => {
    const { wrapper } = await mountInForm({
      metadata: [
        { name: 'date', type: 'date' },
        { name: 'note', type: 'text' },
        richTextMetadata,
        { ...attributesMetadata, name: 'complex' },
      ],
      initialValues: { complex: { value: 'x' } },
      template: createConsumerWrapper({
        metadataConfiguration: richTextMetadataConfiguration,
        overrides: {
          'input': (scope, slots) => slots.default?.(scope),
          'attributes': (scope, slots) => slots.attributes?.(scope),
          'default': (scope, slots) => h('section', { 'data-testid': `chrome-${scope.fieldMetadata.name}` }, slots.default?.(scope)),
          'default-input': customMarkup('slot-default-input'),
          'text-input': customMarkup('slot-text-input'),
          'date-input': customMarkup('slot-date-input'),
          'richText-input': customMarkup('slot-rich-text-input'),
        },
      }),
    });

    for (const name of ['date', 'note', 'body', 'complex'])
      expect(wrapper.findAll(`[data-testid="chrome-${name}"]`)).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="slot-date-input"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="slot-rich-text-input"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="slot-text-input"]')).toHaveLength(3);
    expect(warn.mock.calls.filter(([message]) => /slot|duplicate|extraneous/i.test(String(message)))).toEqual([]);
  });
});
