import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { selectFile } from './fixtures/fileHelpers';
import { fileMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';
import { renderCount } from './fixtures/renderCount';

describe('component StarterFormTemplate - file render counts', () => {
  it('stays at its initial render count through a pick and a clear, confirming the native-value-reset watch never bumps it, the same guarantee every other field type gets on its own value changes', async () => {
    const { wrapper } = await mountInForm({ metadata: fileMetadata, settings: { analytics: true } });

    const initial = renderCount(wrapper, 'resume');

    await selectFile(wrapper.find('.sft-file-native'), 'resume.pdf');
    await flushPromises();
    expect(renderCount(wrapper, 'resume')).toBe(initial);

    await wrapper.find('.sft-file-clear').trigger('click');
    await flushPromises();
    expect(renderCount(wrapper, 'resume')).toBe(initial);
  });

  it('does not bump an unrelated sibling field when a file is picked', async () => {
    const metadata = {
      name: 'root',
      children: [
        fileMetadata,
        { name: 'nickname', type: 'text', fieldOptions: { label: 'Nickname' } },
      ],
    };
    const { wrapper } = await mountInForm({ metadata, settings: { analytics: true } });

    expect(renderCount(wrapper, 'root.resume')).toBe(1);
    expect(renderCount(wrapper, 'root.nickname')).toBe(1);

    await selectFile(wrapper.find('.sft-file-native'), 'resume.pdf');
    await flushPromises();

    expect(renderCount(wrapper, 'root.nickname')).toBe(1);
  });
});
