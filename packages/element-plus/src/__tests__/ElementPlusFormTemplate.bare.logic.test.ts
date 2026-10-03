import { flushPromises } from '@vue/test-utils';
import { ElFormItem, ElInput } from 'element-plus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountInput } from './ElementPlusFormTemplate.test-helpers';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { attributesMetadata, headingMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component ElementPlusFormTemplate - bare usage', () => {
  it('wraps the input of a field in a form item with its label and required marker', async () => {
    const { wrapper } = await mountInForm({ metadata: textMetadata });

    const formItem = wrapper.findComponent(ElFormItem);
    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(1);
    expect(formItem.find('.el-form-item__label').text()).toBe('First name');
    expect(formItem.classes()).toContain('is-required');
    expect(formItem.findComponent(ElInput).exists()).toBe(true);
    expect(wrapper.findAllComponents(ElInput)).toHaveLength(1);
  });

  it('binds the input to the form values in both directions', async () => {
    const { wrapper, values } = await mountInForm({ metadata: textMetadata, initialValues: { text: 'Jeroen' } });

    expect(wrapper.find('input').element.value).toBe('Jeroen');

    await wrapper.find('input').setValue('abc');
    await flushPromises();

    expect(values().text).toBe('abc');
  });

  it('does not mark an optional field as required', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 0 } });

    expect(wrapper.findComponent(ElFormItem).classes()).not.toContain('is-required');
  });

  it('disables the input through the field metadata', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, disabled: true } });

    expect(wrapper.findComponent(ElInput).props('disabled')).toBe(true);
  });

  it('keeps rendering the field after a failed validation', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: textMetadata });

    await validate();
    await flushPromises();

    expect(wrapper.findComponent(ElFormItem).exists()).toBe(true);
    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
  });

  it('renders the attribute items of a complex type once it has a value and binds them next to the value', async () => {
    const { wrapper, values } = await mountInForm({ metadata: attributesMetadata, initialValues: { text: { value: 'hello' } } });

    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(2);

    await inputs[0].setValue('one');
    await inputs[1].setValue('two');
    await flushPromises();

    const { value, lang } = values().text;
    expect([value, lang].sort()).toEqual(['one', 'two']);
  });

  it('renders the children of a heading inside the heading', async () => {
    const { wrapper } = await mountInForm({ metadata: headingMetadata });

    const heading = wrapper.find('h3');
    expect(heading.text()).toBe('Person');
    const inputs = wrapper.findAllComponents(ElInput);
    expect(inputs).toHaveLength(2);
    for (const input of inputs)
      expect(heading.element.parentElement!.contains(input.element)).toBe(true);
    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(2);
  });

  it('mounts a field type named input without throwing', async () => {
    await expect(mountInForm({ metadata: { name: 'x', type: 'input' } })).resolves.toBeDefined();
  });
});

describe('component ElementPlusFormTemplate - wrapped usage with default forwards', () => {
  it('keeps the children of a heading', async () => {
    const { wrapper } = await mountInForm({ metadata: headingMetadata, template: createConsumerWrapper() });

    expect(wrapper.findAllComponents(ElInput)).toHaveLength(2);
    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(2);
  });

  it('mounts without throwing when the field render is not forwarded', async () => {
    await expect(
      mountInForm({ metadata: headingMetadata, template: createConsumerWrapper({ forwardInput: false }) }),
    ).resolves.toBeDefined();
  });
});

describe('component ElementPlusFormTemplate - standalone mount', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each(['text', 'custom-input'])('renders the built-in fallback for %s without slots and without slot warnings', (type) => {
    const { wrapper } = mountInput(type, { fieldMetadata: { label: 'Label' } });

    expect(wrapper.exists()).toBe(true);
    expect(warn.mock.calls.filter(([message]) => /slot/i.test(String(message)))).toEqual([]);
    expect(wrapper.findComponent(type === 'text' ? ElFormItem : ElInput).exists()).toBe(true);
  });
});
