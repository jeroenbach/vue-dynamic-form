import { flushPromises } from '@vue/test-utils';
import {
  ElButton,
  ElCascader,
  ElCheckbox,
  ElColorPicker,
  ElDatePicker,
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
import { describe, expect, it } from 'vitest';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const options = [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }];
const transferData = [{ key: 'a', label: 'Item A' }, { key: 'b', label: 'Item B' }];

const controls: [string, any, Record<string, unknown>][] = [
  ['text', ElInput, {}],
  ['select', ElSelect, { options }],
  ['checkbox', ElCheckbox, {}],
  ['radio', ElRadioGroup, { options }],
  ['date', ElDatePicker, {}],
  ['time', ElTimePicker, {}],
  ['datetime', ElDatePicker, {}],
  ['switch', ElSwitch, {}],
  ['number', ElInputNumber, {}],
  ['rate', ElRate, {}],
  ['slider', ElSlider, {}],
  ['color', ElColorPicker, {}],
  ['cascader', ElCascader, { options: [] }],
  ['upload', ElUpload, {}],
];

const sources: [string, Record<string, unknown>][] = [
  ['the field metadata', { disabled: true }],
  ['the engine', { maxOccurs: 0 }],
];

function metadataFor(type: string, extra: Record<string, unknown>) {
  return { name: 'f', type, label: 'Field', minOccurs: 0, ...extra };
}

describe('component ElementPlusFormTemplate - disabled state', () => {
  expectNoWarnings();

  describe.each(sources)('driven by %s', (_source, disabling) => {
    it.each(controls)('%s: disables the control', async (type, component, extra) => {
      const { wrapper } = await mountInForm({ metadata: metadataFor(type, { ...extra, ...disabling }) });

      expect(wrapper.findComponent(component).props('disabled')).toBe(true);
    });

    it('upload: disables the trigger button', async () => {
      const { wrapper } = await mountInForm({ metadata: metadataFor('upload', disabling) });

      expect(wrapper.findComponent(ElButton).props('disabled')).toBe(true);
    });

    it('transfer: flags every item as disabled and blocks moving them', async () => {
      const { wrapper, values } = await mountInForm({ metadata: metadataFor('transfer', { transfer: { data: transferData }, ...disabling }) });
      const transfer = wrapper.findComponent<any>(ElTransfer);

      expect(transfer.props('data')).toEqual([
        expect.objectContaining({ key: 'a', disabled: true }),
        expect.objectContaining({ key: 'b', disabled: true }),
      ]);

      const items = transfer.findAll<HTMLInputElement>('.el-transfer-panel__list input[type=checkbox]');
      expect(items).toHaveLength(2);
      for (const item of items)
        expect(item.element.disabled).toBe(true);

      await items[0].setValue(true);
      await transfer.findAll('.el-transfer__buttons button')[1].trigger('click');
      await flushPromises();

      expect(values().f ?? []).toEqual([]);
    });
  });

  it.each(controls)('%s: stays enabled when nothing disables it', async (type, component, extra) => {
    const { wrapper } = await mountInForm({ metadata: metadataFor(type, extra) });

    expect(wrapper.findComponent(component).props('disabled')).toBeFalsy();
  });

  it('transfer: leaves the items enabled when nothing disables it', async () => {
    const { wrapper } = await mountInForm({ metadata: metadataFor('transfer', { transfer: { data: transferData } }) });

    expect(wrapper.findComponent<any>(ElTransfer).props('data')).toEqual(transferData);
  });
});
