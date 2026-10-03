import {
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElDivider,
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountInput } from './ElementPlusFormTemplate.test-helpers';

describe('text input', () => {
  it('renders an ElInput bound to the field value', () => {
    const { wrapper } = mountInput('text-input', { value: 'Jeroen' });

    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
    expect(wrapper.find('input').element.value).toBe('Jeroen');
  });

  it('reports typed text to the field', async () => {
    const { wrapper, handleChange } = mountInput('text-input', { value: '' });

    await wrapper.find('input').setValue('x');

    expect(handleChange).toHaveBeenCalledWith('x');
  });

  it('follows changes of the field value', async () => {
    const { wrapper, value } = mountInput('text-input', { value: 'a' });

    value.value = 'b';
    await nextTick();

    expect(wrapper.find('input').element.value).toBe('b');
  });

  it.each([undefined, ''])('renders an empty input when the value is %j', (empty) => {
    const { wrapper } = mountInput('text-input', { value: empty });

    expect(wrapper.find('input').element.value).toBe('');
  });

  it('passes placeholder, readonly, size, and clearable to the control', () => {
    const { wrapper } = mountInput('text-input', {
      value: '',
      fieldMetadata: { placeholder: 'Your name', readonly: true, size: 'small', clearable: true },
    });
    const input = wrapper.findComponent(ElInput);

    expect(wrapper.find('input').attributes('placeholder')).toBe('Your name');
    expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    expect(input.props('size')).toBe('small');
    expect(input.props('clearable')).toBe(true);
  });

  it('is disabled through the field metadata', () => {
    const { wrapper } = mountInput('text-input', { value: '', fieldMetadata: { disabled: true } });

    expect(wrapper.findComponent(ElInput).props('disabled')).toBe(true);
  });

  it('is disabled through the slot disabled prop', () => {
    const { wrapper } = mountInput('text-input', { value: '', disabled: true });

    expect(wrapper.findComponent(ElInput).props('disabled')).toBe(true);
  });

  it('is enabled by default', () => {
    const { wrapper } = mountInput('text-input', { value: '' });

    expect(wrapper.findComponent(ElInput).props('disabled')).toBeFalsy();
  });
});

describe('select input', () => {
  const options = [
    { label: 'One', value: 1 },
    { label: 'Two', value: 2 },
  ];

  it('renders an ElSelect bound to the field value', () => {
    const { wrapper } = mountInput('select-input', { value: 2, fieldMetadata: { options } });

    expect(wrapper.findComponent(ElSelect).props('modelValue')).toBe(2);
  });

  it('passes placeholder, multiple, clearable, filterable, and size to the control', () => {
    const { wrapper } = mountInput('select-input', {
      value: [],
      fieldMetadata: { options, placeholder: 'Pick', multiple: true, clearable: true, filterable: true, size: 'large' },
    });
    const select = wrapper.findComponent(ElSelect);

    expect(select.props('placeholder')).toBe('Pick');
    expect(select.props('multiple')).toBe(true);
    expect(select.props('clearable')).toBe(true);
    expect(select.props('filterable')).toBe(true);
    expect(select.props('size')).toBe('large');
  });

  it('reports the chosen option to the field', () => {
    const { wrapper, handleChange } = mountInput('select-input', { value: undefined, fieldMetadata: { options } });

    wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', 1);

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('renders without options', () => {
    const { wrapper } = mountInput('select-input', { value: undefined });

    expect(wrapper.findComponent(ElSelect).exists()).toBe(true);
  });

  it('is disabled through the field metadata and through the slot disabled prop', () => {
    const viaMetadata = mountInput('select-input', { value: 1, fieldMetadata: { options, disabled: true } });
    const viaSlot = mountInput('select-input', { value: 1, fieldMetadata: { options }, disabled: true });

    expect(viaMetadata.wrapper.findComponent(ElSelect).props('disabled')).toBe(true);
    expect(viaSlot.wrapper.findComponent(ElSelect).props('disabled')).toBe(true);
  });
});

describe('every built-in control', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  const controls = [
    ['text-input', ElInput],
    ['select-input', ElSelect],
    ['checkbox-input', ElCheckbox],
    ['radio-input', ElRadioGroup],
    ['date-input', ElDatePicker],
    ['time-input', ElTimePicker],
    ['datetime-input', ElDatePicker],
    ['switch-input', ElSwitch],
    ['number-input', ElInputNumber],
    ['rate-input', ElRate],
    ['slider-input', ElSlider],
    ['color-input', ElColorPicker],
    ['cascader-input', ElCascader],
    ['transfer-input', ElTransfer],
    ['upload-input', ElUpload],
  ] as const;

  it.each(controls)('renders %s as its Element Plus control without Vue warnings', (type, control) => {
    const { wrapper } = mountInput(type, { fieldMetadata: { label: 'Label' } });

    expect(wrapper.findComponent(control).exists()).toBe(true);
    const vueWarnings = warn.mock.calls.filter(([message]) => String(message).includes('[Vue warn]'));
    expect(vueWarnings).toEqual([]);
  });

  it('renders the heading label', () => {
    const { wrapper } = mountInput('heading', { fieldMetadata: { label: 'Personal details' } });

    expect(wrapper.find('h3').text()).toBe('Personal details');
  });

  it('renders the divider label in an ElDivider', () => {
    const { wrapper } = mountInput('divider', { fieldMetadata: { label: 'Section' } });

    expect(wrapper.findComponent(ElDivider).text()).toBe('Section');
  });
});
