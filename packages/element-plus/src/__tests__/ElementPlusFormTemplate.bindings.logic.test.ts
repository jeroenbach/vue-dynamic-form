import type { Component } from 'vue';
import { flushPromises } from '@vue/test-utils';
import {
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTransfer,
} from 'element-plus';
import { describe, expect, it } from 'vitest';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const options = [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }];
const stringOptions = [{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }];
const cascaderOptions = [
  { value: 'a', label: 'A', children: [{ value: 'b', label: 'B' }, { value: 'c', label: 'C' }] },
];
const transferData = [
  { key: 'a', label: 'Item A' },
  { key: 'b', label: 'Item B' },
  { key: 'c', label: 'Item C' },
];

function field(type: string, extra: Record<string, unknown> = {}) {
  return { name: 'f', type, label: 'Field', minOccurs: 0, ...extra };
}

async function mountField(type: string, extra: Record<string, unknown> = {}, initial?: unknown) {
  const mounted = await mountInForm({
    metadata: field(type, extra),
    initialValues: initial === undefined ? undefined : { f: initial },
  });
  return { ...mounted, value: () => mounted.values().f };
}

describe('component ElementPlusFormTemplate - control value round trip', () => {
  expectNoWarnings();

  it('text: shows the stored value and writes typed input', async () => {
    const { wrapper, value } = await mountField('text', {}, 'abc');

    expect(wrapper.find('input').element.value).toBe('abc');

    await wrapper.find('input').setValue('xyz');
    await flushPromises();

    expect(value()).toBe('xyz');
  });

  it.each([
    ['string', stringOptions, 'a', 'b'],
    ['number', options, 1, 2],
  ])('select: shows the stored %s option and writes the chosen option value', async (_kind, selectOptions, initial, next) => {
    const { wrapper, value } = await mountField('select', { options: selectOptions }, initial);
    const select = wrapper.findComponent(ElSelect);

    expect(select.props('modelValue')).toBe(initial);
    expect(select.text()).toContain(selectOptions.find(option => option.value === initial)!.label);

    select.vm.$emit('update:modelValue', next);
    await flushPromises();

    expect(value()).toBe(next);
  });

  it('checkbox: shows the stored state and writes a boolean on click', async () => {
    const { wrapper, value } = await mountField('checkbox', {}, true);
    const checkbox = wrapper.findComponent(ElCheckbox);

    expect(checkbox.props('modelValue')).toBe(true);

    await checkbox.find('input').setValue(false);
    await flushPromises();

    expect(value()).toBe(false);
  });

  it('radio: checks the stored option and writes the clicked option value as its own type', async () => {
    const { wrapper, value } = await mountField('radio', { options }, 1);
    const radios = wrapper.findAllComponents(ElRadio);

    expect(radios[0].find('input').element.checked).toBe(true);
    expect(radios[1].find('input').element.checked).toBe(false);

    await radios[1].find('input').setValue(true);
    await flushPromises();

    expect(value()).toBe(2);
  });

  it.each([
    ['date', ElDatePicker, '2024-05-06', '2024-07-08'],
    ['time', ElTimePicker, '10:20:30', '11:22:33'],
    ['datetime', ElDatePicker, '2024-05-06 10:20:30', '2024-07-08 11:22:33'],
  ])('%s: shows the stored string and writes a string', async (type, picker, initial, next) => {
    const { wrapper, value } = await mountField(type, {}, initial);
    const control = wrapper.findComponent(picker);

    expect(control.find('input').element.value).toBe(initial);

    control.vm.$emit('update:modelValue', next);
    await flushPromises();

    expect(value()).toBe(next);
    expect(typeof value()).toBe('string');
  });

  it.each([
    ['date', ElDatePicker, '2024-05-06', 'YYYY-MM-DD'],
    ['time', ElTimePicker, '10:20:30', 'HH:mm:ss'],
    ['datetime', ElDatePicker, '2024-05-06 10:20:30', 'YYYY-MM-DD HH:mm:ss'],
  ])('%s: binds the default value format', async (type, picker, _initial, format) => {
    const { wrapper } = await mountField(type);

    expect(wrapper.findComponent(picker).props('valueFormat')).toBe(format);
  });

  it.each([
    ['date', ElDatePicker],
    ['time', ElTimePicker],
    ['datetime', ElDatePicker],
  ])('%s: lets an explicit value format win over the default', async (type, picker) => {
    const { wrapper } = await mountField(type, { valueFormat: 'x' });

    expect(wrapper.findComponent(picker).props('valueFormat')).toBe('x');
  });

  it('date: defaults to the datetime format when the picker type includes time', async () => {
    const { wrapper } = await mountField('date', { date: { type: 'datetime' } });

    expect(wrapper.findComponent(ElDatePicker).props('valueFormat')).toBe('YYYY-MM-DD HH:mm:ss');
  });

  it('date: binds the picker mode from the date group', async () => {
    const { wrapper } = await mountField('date', { date: { type: 'month' } });

    expect(wrapper.findComponent(ElDatePicker).props('type')).toBe('month');
  });

  it('date: defaults the picker mode to date', async () => {
    const { wrapper } = await mountField('date');

    expect(wrapper.findComponent(ElDatePicker).props('type')).toBe('date');
  });

  it('switch: shows the stored state and writes a boolean on click', async () => {
    const { wrapper, value } = await mountField('switch', {}, true);
    const control = wrapper.findComponent(ElSwitch);

    expect(control.props('modelValue')).toBe(true);

    await control.find('input').setValue(false);
    await flushPromises();

    expect(value()).toBe(false);
  });

  it('number: shows the stored number and writes a number on increase', async () => {
    const { wrapper, value } = await mountField('number', { step: 2 }, 4);
    const control = wrapper.findComponent(ElInputNumber);

    expect(control.find('input').element.value).toBe('4');

    await control.find('.el-input-number__increase').trigger('mousedown');
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flushPromises();

    expect(value()).toBe(6);
  });

  it('rate: shows the stored rating and writes the clicked star', async () => {
    const { wrapper, value } = await mountField('rate', {}, 2);
    const control = wrapper.findComponent(ElRate);

    expect(control.props('modelValue')).toBe(2);

    await control.findAll('.el-rate__item')[3].trigger('click');
    await flushPromises();

    expect(value()).toBe(4);
  });

  it('slider: shows the stored number and writes a number', async () => {
    const { wrapper, value } = await mountField('slider', {}, 20);
    const control = wrapper.findComponent(ElSlider);

    expect(control.props('modelValue')).toBe(20);

    control.vm.$emit('update:modelValue', 40);
    await flushPromises();

    expect(value()).toBe(40);
  });

  it('slider: round trips a range as a pair', async () => {
    const { wrapper, value } = await mountField('slider', { slider: { range: true } }, [10, 30]);
    const control = wrapper.findComponent(ElSlider);

    expect(control.props('modelValue')).toEqual([10, 30]);

    control.vm.$emit('update:modelValue', [20, 60]);
    await flushPromises();

    expect(value()).toEqual([20, 60]);
  });

  it('color: shows the stored color and writes a string', async () => {
    const { wrapper, value } = await mountField('color', {}, '#ff0000');
    const control = wrapper.findComponent(ElColorPicker);

    expect(control.props('modelValue')).toBe('#ff0000');

    control.vm.$emit('update:modelValue', '#00ff00');
    await flushPromises();

    expect(value()).toBe('#00ff00');
  });

  it('cascader: shows the stored path and writes a path array', async () => {
    const { wrapper, value } = await mountField('cascader', { options: cascaderOptions }, ['a', 'b']);
    const control = wrapper.findComponent(ElCascader);

    expect(control.props('modelValue')).toEqual(['a', 'b']);
    expect(control.find('input').element.value).toBe('A / B');

    control.vm.$emit('update:modelValue', ['a', 'c']);
    await flushPromises();

    expect(value()).toEqual(['a', 'c']);
  });

  it('cascader: round trips several paths when multiple is set', async () => {
    const { wrapper, value } = await mountField('cascader', { options: cascaderOptions, cascader: { props: { multiple: true } } }, [['a', 'b']]);
    const control = wrapper.findComponent(ElCascader);

    expect(control.props('modelValue')).toEqual([['a', 'b']]);

    control.vm.$emit('update:modelValue', [['a', 'b'], ['a', 'c']]);
    await flushPromises();

    expect(value()).toEqual([['a', 'b'], ['a', 'c']]);
  });

  it('transfer: shows the stored keys on the right and writes the moved keys', async () => {
    const { wrapper, value } = await mountField('transfer', { transfer: { data: transferData } }, ['a']);
    const control = wrapper.findComponent(ElTransfer as Component);
    const [left, right] = control.findAll('.el-transfer-panel');

    expect(right.text()).toContain('Item A');
    expect(left.text()).not.toContain('Item A');

    await left.findAll('input[type=checkbox]').at(-1)!.setValue(true);
    const buttons = control.findAll('.el-transfer__buttons button');
    await buttons[1].trigger('click');
    await flushPromises();

    expect(value()).toHaveLength(2);
    expect(value()).toContain('a');
  });
});

describe('component ElementPlusFormTemplate - transfer binding', () => {
  expectNoWarnings();

  it('binds the selected keys only through the model value', async () => {
    const { wrapper } = await mountField('transfer', { transfer: { data: transferData, targetKeys: ['b'] } });
    const control = wrapper.findComponent(ElTransfer as Component);

    expect(control.vm.$attrs).not.toHaveProperty('targetKeys');
    expect(control.vm.$attrs).not.toHaveProperty('target-keys');
    expect(wrapper.html()).not.toContain('target-keys');
  });

  it('ignores the targetKeys metadata property', async () => {
    const { wrapper } = await mountField('transfer', { transfer: { data: transferData, targetKeys: ['b'] } });
    const [, right] = wrapper.findAll('.el-transfer-panel');

    expect(right.text()).not.toContain('Item B');
  });
});

describe('component ElementPlusFormTemplate - empty initial values', () => {
  expectNoWarnings();

  it('number: renders empty and writes a number when increased', async () => {
    const { wrapper, value } = await mountField('number', { number: { precision: 2 }, min: 0 });
    const control = wrapper.findComponent(ElInputNumber);

    expect(control.find('input').element.value).toBe('');
    expect(value()).toBeUndefined();

    await control.find('.el-input-number__increase').trigger('mousedown');
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flushPromises();

    expect(typeof value()).toBe('number');
  });

  it('checkbox: renders unchecked and writes true on click', async () => {
    const { wrapper, value } = await mountField('checkbox');
    const checkbox = wrapper.findComponent(ElCheckbox);

    expect(checkbox.find('input').element.checked).toBe(false);

    await checkbox.find('input').setValue(true);
    await flushPromises();

    expect(value()).toBe(true);
  });

  it('cascader: renders empty from a null value and writes the chosen path', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: field('cascader', { options: cascaderOptions }),
      initialValues: { f: null },
    });
    const control = wrapper.findComponent(ElCascader);

    expect(control.find('input').element.value).toBe('');

    control.vm.$emit('update:modelValue', ['a', 'b']);
    await flushPromises();

    expect(values().f).toEqual(['a', 'b']);
  });
});

describe('component ElementPlusFormTemplate - text and select props', () => {
  expectNoWarnings();

  it('applies the text properties to the input', async () => {
    const { wrapper } = await mountField('text', { placeholder: 'Type here', clearable: true, size: 'small', readonly: true });
    const control = wrapper.findComponent(ElInput);

    expect(control.props('clearable')).toBe(true);
    expect(control.props('size')).toBe('small');
    expect(control.find('input').attributes('placeholder')).toBe('Type here');
    expect(control.find('input').attributes('readonly')).toBeDefined();
  });

  it('applies the select properties and renders one option per entry', async () => {
    const { wrapper } = await mountField('select', {
      options,
      placeholder: 'Pick one',
      clearable: true,
      filterable: true,
      multiple: true,
      size: 'large',
    });
    const control = wrapper.findComponent(ElSelect);

    expect(control.props('placeholder')).toBe('Pick one');
    expect(control.props('clearable')).toBe(true);
    expect(control.props('filterable')).toBe(true);
    expect(control.props('multiple')).toBe(true);
    expect(control.props('size')).toBe('large');

    await control.find('.el-select__wrapper').trigger('click');
    await flushPromises();

    const rendered = wrapper.findAllComponents(ElOption);
    expect(rendered.map(option => [option.props('label'), option.props('value')])).toEqual([['One', 1], ['Two', 2]]);
  });

  it('writes an array when the select is multiple', async () => {
    const { wrapper, value } = await mountField('select', { options, multiple: true }, [1]);

    wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', [1, 2]);
    await flushPromises();

    expect(value()).toEqual([1, 2]);
  });

  it('writes the single option value when the select is not multiple', async () => {
    const { wrapper, value } = await mountField('select', { options });

    wrapper.findComponent(ElSelect).vm.$emit('update:modelValue', 2);
    await flushPromises();

    expect(value()).toBe(2);
  });

  it('keeps the radio group on the group component', async () => {
    const { wrapper } = await mountField('radio', { options });

    expect(wrapper.findAllComponents(ElRadioGroup)).toHaveLength(1);
  });
});
