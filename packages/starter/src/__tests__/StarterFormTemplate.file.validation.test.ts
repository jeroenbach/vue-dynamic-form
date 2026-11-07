import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { selectFile } from './fixtures/fileHelpers';
import { fileMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - file field, xsd_required against File/undefined', () => {
  it('fails required with no file, passes once one is picked, with no change needed to the required rule itself', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...fileMetadata, minOccurs: 1 } });

    await validate();
    expect(wrapper.find('.sft-error').exists()).toBe(true);

    await selectFile(wrapper.find('.sft-file-native'), 'resume.pdf');
    await flushPromises();
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });
});
