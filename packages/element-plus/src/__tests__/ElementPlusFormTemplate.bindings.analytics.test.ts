import { flushPromises } from '@vue/test-utils';
import { ElTransfer } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

const transferData = [{ key: 'a', label: 'Item A' }, { key: 'b', label: 'Item B' }];

describe('component ElementPlusFormTemplate - control write loops', () => {
  expectNoWarnings();

  it('upload: renders a bounded number of times for one selection', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { name: 'f', type: 'upload', label: 'Files', minOccurs: 0, upload: { autoUpload: false } },
      settings: { analytics: true },
    });
    const before = renderCount(wrapper, 'f');

    const input = wrapper.find('input[type=file]');
    Object.defineProperty(input.element, 'files', { value: [new File(['hello'], 'one.txt')], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect(values().f).toHaveLength(1);
    expect(renderCount(wrapper, 'f') - before).toBe(0);
  });

  it('transfer: renders a bounded number of times for one move', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { name: 'f', type: 'transfer', label: 'Items', minOccurs: 0, transfer: { data: transferData } },
      settings: { analytics: true },
    });
    const before = renderCount(wrapper, 'f');
    const transfer = wrapper.findComponent(ElTransfer);

    await transfer.findAll('.el-transfer-panel__list input[type=checkbox]')[0].setValue(true);
    await transfer.findAll('.el-transfer__buttons button')[1].trigger('click');
    await flushPromises();

    expect(values().f).toHaveLength(1);
    expect(renderCount(wrapper, 'f') - before).toBe(0);
  });
});
