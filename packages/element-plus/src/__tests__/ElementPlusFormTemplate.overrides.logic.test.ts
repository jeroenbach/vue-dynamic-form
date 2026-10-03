import type { VueWrapper } from '@vue/test-utils';
import type { Component } from 'vue';
import { flushPromises } from '@vue/test-utils';
import {
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElDivider,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTransfer,
  ElUpload,
} from 'element-plus';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { allTypesMetadata, attributesMetadata, dateAndTextMetadata, headingMetadata, richTextMetadata, richTextMetadataConfiguration, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const options = [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }];

function field(type: string, name = type) {
  return { name, type, label: `${name} label`, options, transfer: { data: [] } };
}

function customMarkup(testId: string) {
  return vi.fn((scope: any) => h('div', { 'data-testid': testId }, scope.fieldMetadata.name));
}

function findByTestId(wrapper: VueWrapper, testId: string) {
  return wrapper.findAll(`[data-testid="${testId}"]`);
}

describe('component ElementPlusFormTemplate - overriding one input slot', () => {
  it('replaces only the overridden control and keeps the form item around it', async () => {
    const dateInput = customMarkup('custom-date');
    const { wrapper } = await mountInForm({
      metadata: dateAndTextMetadata,
      template: createConsumerWrapper({ overrides: { 'date-input': dateInput } }),
    });

    expect(findByTestId(wrapper, 'custom-date')).toHaveLength(1);
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(false);
    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(2);
    const [dateItem, textItem] = wrapper.findAllComponents(ElFormItem);
    expect(dateItem.find('[data-testid="custom-date"]').exists()).toBe(true);
    expect(textItem.findComponent(ElInput).exists()).toBe(true);
  });

  it('hands the override the field metadata, the field context, and the disabled flag', async () => {
    const dateInput = customMarkup('custom-date');
    const { values } = await mountInForm({
      metadata: dateAndTextMetadata,
      template: createConsumerWrapper({ overrides: { 'date-input': dateInput } }),
    });

    const scope = dateInput.mock.calls[0][0];
    expect(scope.fieldMetadata.name).toBe('date');
    expect(typeof scope.fieldContext.handleChange).toBe('function');
    expect('value' in scope.fieldContext).toBe(true);
    expect(typeof scope.disabled).toBe('boolean');

    scope.fieldContext.handleChange('2024-01-02');
    await flushPromises();
    expect(values().date).toBe('2024-01-02');
  });

  it('only matches the dispatcher spelling of the slot name', async () => {
    const wrongSpelling = customMarkup('custom-date');
    const { wrapper } = await mountInForm({
      metadata: dateAndTextMetadata,
      template: createConsumerWrapper({ overrides: { dateInput: wrongSpelling } }),
    });

    expect(wrongSpelling).not.toHaveBeenCalled();
    expect(wrapper.findComponent(ElDatePicker).exists()).toBe(true);
  });

  it('replaces the built-in text control through the text input slot', async () => {
    const textInput = customMarkup('custom-text');
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({ overrides: { 'text-input': textInput } }),
    });

    expect(findByTestId(wrapper, 'custom-text')).toHaveLength(1);
    expect(wrapper.findComponent(ElInput).exists()).toBe(false);
  });
});

describe('component ElementPlusFormTemplate - overriding the group wrapper', () => {
  it('shows the consumer chrome around the input instead of the form item', async () => {
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({
        overrides: { default: (scope, slots) => h('section', { 'data-testid': 'custom-chrome' }, slots.default?.(scope)) },
      }),
    });

    const chrome = wrapper.find('[data-testid="custom-chrome"]');
    expect(chrome.exists()).toBe(true);
    expect(chrome.findComponent(ElInput).exists()).toBe(true);
    expect(wrapper.findComponent(ElFormItem).exists()).toBe(false);
  });

  it('drops the input when the override does not render it', async () => {
    const { wrapper } = await mountInForm({
      metadata: textMetadata,
      template: createConsumerWrapper({
        overrides: { default: () => h('section', { 'data-testid': 'custom-chrome' }) },
      }),
    });

    expect(wrapper.find('[data-testid="custom-chrome"]').exists()).toBe(true);
    expect(wrapper.findComponent(ElInput).exists()).toBe(false);
  });

  it('keeps the attribute items when the group wrapper is overridden', async () => {
    const { wrapper } = await mountInForm({
      metadata: attributesMetadata,
      initialValues: { text: { value: 'hello' } },
      template: createConsumerWrapper({
        overrides: { default: (scope, slots) => h('section', slots.default?.(scope)) },
      }),
    });

    expect(wrapper.findAll('input')).toHaveLength(2);
  });

  it('calls the override once per field for the group wrapper render', async () => {
    const chrome = vi.fn((scope: any, slots: any) => h('section', slots.default?.(scope)));
    await mountInForm({
      metadata: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }],
      template: createConsumerWrapper({ overrides: { default: chrome } }),
    });

    const fieldNames = chrome.mock.calls.map(([scope]) => scope.fieldMetadata.name);
    expect(fieldNames.filter(name => name === 'a')).toHaveLength(1);
    expect(fieldNames.filter(name => name === 'b')).toHaveLength(1);
  });
});

const builtInTypes: [string, Component][] = [
  ['text', ElInput],
  ['select', ElSelect],
  ['checkbox', ElCheckbox],
  ['radio', ElRadioGroup],
  ['date', ElDatePicker],
  ['time', ElTimePicker],
  ['datetime', ElDatePicker],
  ['switch', ElSwitch],
  ['number', ElInputNumber],
  ['rate', ElRate],
  ['slider', ElSlider],
  ['color', ElColorPicker],
  ['cascader', ElCascader],
  ['transfer', ElTransfer],
  ['upload', ElUpload],
];

const wrapperTypes: [string, Component | undefined][] = [
  ['heading', undefined],
  ['divider', ElDivider],
];

function neighbourFor(type: string) {
  return type === 'text' ? field('number', 'neighbour') : field('text', 'neighbour');
}

describe('component ElementPlusFormTemplate - built-in fallbacks of every slot', () => {
  it.each(builtInTypes)('renders the %s control once without overrides', async (type, control) => {
    const { wrapper } = await mountInForm({ metadata: field(type), template: createConsumerWrapper() });

    expect(wrapper.findAllComponents(control as any)).toHaveLength(1);
    if (type === 'datetime')
      expect(wrapper.findComponent(ElDatePicker).props('type')).toBe('datetime');
  });

  it.each(builtInTypes)('replaces only the %s control when its input slot is overridden', async (type, control) => {
    const custom = customMarkup('custom-input');
    const { wrapper } = await mountInForm({
      metadata: [field(type), neighbourFor(type)],
      template: createConsumerWrapper({ overrides: { [`${type}-input`]: custom } }),
    });

    expect(findByTestId(wrapper, 'custom-input')).toHaveLength(1);
    expect(custom).toHaveBeenCalledTimes(1);
    if (type === 'text') {
      const bareInputs = wrapper.findAllComponents(ElInput).filter(input => !input.element.closest('.el-input-number'));
      expect(bareInputs).toHaveLength(0);
      expect(wrapper.findComponent(ElInputNumber).exists()).toBe(true);
    }
    else {
      expect(wrapper.findAllComponents(control as any)).toHaveLength(0);
      expect(wrapper.findComponent(ElInput).exists()).toBe(true);
    }
  });

  it('renders the heading chrome with its label', async () => {
    const { wrapper } = await mountInForm({ metadata: field('heading'), template: createConsumerWrapper() });

    expect(wrapper.find('h3').text()).toBe('heading label');
  });

  it.each(wrapperTypes)('replaces the %s wrapper when its slot is overridden', async (type, control) => {
    const custom = customMarkup('custom-wrapper');
    const { wrapper } = await mountInForm({
      metadata: [field(type), field('number', 'neighbour')],
      template: createConsumerWrapper({ overrides: { [type]: custom } }),
    });

    expect(findByTestId(wrapper, 'custom-wrapper')).toHaveLength(1);
    if (control)
      expect(wrapper.findComponent(control as any).exists()).toBe(false);
    else
      expect(wrapper.find('h3').exists()).toBe(false);
    expect(wrapper.findComponent(ElInputNumber).exists()).toBe(true);
  });

  it.each(['checkbox', 'switch'])('wraps the %s input in a replaceable wrapper that stays independent of the input slot', async (type) => {
    const { wrapper } = await mountInForm({
      metadata: field(type),
      template: createConsumerWrapper({
        overrides: { [type]: (scope, slots) => h('section', { 'data-testid': 'custom-wrapper' }, slots.default?.(scope)) },
      }),
    });

    const section = wrapper.find('[data-testid="custom-wrapper"]');
    expect(section.exists()).toBe(true);
    expect(section.findComponent(type === 'checkbox' ? ElCheckbox : ElSwitch).exists()).toBe(true);
  });

  it('keeps the children of a heading inside a replaced heading wrapper', async () => {
    const { wrapper } = await mountInForm({
      metadata: headingMetadata,
      template: createConsumerWrapper({
        overrides: { heading: (scope, slots) => h('section', { 'data-testid': 'custom-wrapper' }, slots.default?.(scope)) },
      }),
    });

    expect(wrapper.find('[data-testid="custom-wrapper"]').findAllComponents(ElInput)).toHaveLength(2);
  });

  it('prints the label of a switch and a checkbox once', async () => {
    const switchForm = await mountInForm({ metadata: field('switch'), template: createConsumerWrapper() });
    const checkboxForm = await mountInForm({ metadata: field('checkbox'), template: createConsumerWrapper() });

    expect(switchForm.wrapper.text().split('switch label')).toHaveLength(2);
    expect(checkboxForm.wrapper.text().split('checkbox label')).toHaveLength(2);
  });

  it('renders a switch without a label text when the field has none', async () => {
    const { wrapper } = await mountInForm({
      metadata: { name: 'enabled', type: 'switch' },
      template: createConsumerWrapper(),
    });

    expect(wrapper.findComponent(ElSwitch).exists()).toBe(true);
    expect(wrapper.text().trim()).toBe('');
  });

  it('renders the default input for a type without a dedicated input slot', async () => {
    const { wrapper } = await mountInForm({
      metadata: richTextMetadata,
      template: createConsumerWrapper({ metadataConfiguration: richTextMetadataConfiguration }),
    });

    expect(wrapper.findAllComponents(ElInput)).toHaveLength(1);
  });

  it('lets the default input slot take over for a type without a dedicated input slot', async () => {
    const defaultInput = customMarkup('custom-default-input');
    const { wrapper } = await mountInForm({
      metadata: richTextMetadata,
      template: createConsumerWrapper({
        metadataConfiguration: richTextMetadataConfiguration,
        overrides: { 'default-input': defaultInput },
      }),
    });

    expect(findByTestId(wrapper, 'custom-default-input')).toHaveLength(1);
    expect(defaultInput.mock.calls[0][0].fieldMetadata.name).toBe('body');
    expect(wrapper.findComponent(ElInput).exists()).toBe(false);
  });

  it('uses the group wrapper for a type without a dedicated wrapper', async () => {
    const { wrapper } = await mountInForm({ metadata: field('number'), template: createConsumerWrapper() });

    expect(wrapper.findComponent(ElFormItem).exists()).toBe(true);
  });
});

describe('component ElementPlusFormTemplate - forwards of the engine renders', () => {
  it('renders no attribute items when only the field render is forwarded', async () => {
    const { wrapper } = await mountInForm({
      metadata: attributesMetadata,
      initialValues: { text: { value: 'hello' } },
      template: createConsumerWrapper({ forwardAttributes: false }),
    });

    expect(wrapper.findAll('input')).toHaveLength(1);
  });

  it('renders the attribute items when both renders are forwarded', async () => {
    const { wrapper } = await mountInForm({
      metadata: attributesMetadata,
      initialValues: { text: { value: 'hello' } },
      template: createConsumerWrapper(),
    });

    expect(wrapper.findAll('input')).toHaveLength(2);
  });
});

describe('component ElementPlusFormTemplate - equivalence of bare and wrapped usage', () => {
  const normalize = (html: string) => html
    .replace(/el-id-\d+-\d+/g, 'el-id')
    .replace(/ tabindex="-1"/g, '');

  it('renders every built-in type identically with and without the wrapper', async () => {
    const bare = await mountInForm({ metadata: allTypesMetadata });
    const wrapped = await mountInForm({ metadata: allTypesMetadata, template: createConsumerWrapper() });

    expect(wrapped.wrapper.text()).toBe(bare.wrapper.text());
    expect(normalize(wrapped.wrapper.html())).toBe(normalize(bare.wrapper.html()));
  });
});
