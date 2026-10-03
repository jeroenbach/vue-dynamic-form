import { flushPromises } from '@vue/test-utils';
import { ElTransfer, ElUpload } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const transferData = [{ key: 'a', label: 'Item A' }, { key: 'b', label: 'Item B' }];

describe('component ElementPlusFormTemplate - required controls', () => {
  expectNoWarnings();

  it('upload: is invalid while empty and valid once a file is selected', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { name: 'f', type: 'upload', label: 'Files', minOccurs: 1, upload: { autoUpload: false } },
    });

    expect(wrapper.findComponent(ElUpload).exists()).toBe(true);
    expect((await validate() as { valid: boolean }).valid).toBe(false);

    const input = wrapper.find('input[type=file]');
    Object.defineProperty(input.element, 'files', { value: [new File(['hello'], 'one.txt')], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect((await validate() as { valid: boolean }).valid).toBe(true);
  });

  it('transfer: is invalid while nothing is selected and valid once an item is moved', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { name: 'f', type: 'transfer', label: 'Items', minOccurs: 1, transfer: { data: transferData } },
    });
    const transfer = wrapper.findComponent(ElTransfer);

    expect((await validate() as { valid: boolean }).valid).toBe(false);

    await transfer.findAll('.el-transfer-panel__list input[type=checkbox]')[0].setValue(true);
    await transfer.findAll('.el-transfer__buttons button')[1].trigger('click');
    await flushPromises();

    expect((await validate() as { valid: boolean }).valid).toBe(true);
  });
});
