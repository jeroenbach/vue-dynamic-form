import { flushPromises } from '@vue/test-utils';
import { ElUpload } from 'element-plus';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { watch } from 'vue';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

const uploadMetadata = { name: 'f', type: 'upload', label: 'Files', minOccurs: 0, upload: { autoUpload: false } };

const existing = [
  { name: 'one.txt', url: 'blob:one' },
  { name: 'two.txt', url: 'blob:two' },
];

async function mountUpload(initial?: unknown, extra: Record<string, unknown> = {}) {
  const mounted = await mountInForm({
    metadata: { ...uploadMetadata, ...extra },
    initialValues: initial === undefined ? undefined : { f: initial },
  });
  return { ...mounted, value: () => mounted.values().f, upload: () => mounted.wrapper.findComponent(ElUpload) };
}

async function selectFile(wrapper: Awaited<ReturnType<typeof mountUpload>>['wrapper'], file: File) {
  const input = wrapper.find('input[type=file]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
}

describe('component ElementPlusFormTemplate - upload binding', () => {
  expectNoWarnings();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the stored list as the file list of the upload', async () => {
    const { wrapper, upload } = await mountUpload(existing);

    expect(upload().props('fileList')).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'one.txt' })]));
    expect(wrapper.text()).toContain('one.txt');
    expect(wrapper.text()).toContain('two.txt');
  });

  it('does not pass a model value to the upload', async () => {
    const { upload } = await mountUpload(existing);
    const passed = Object.keys(upload().vm.$.vnode.props ?? {});

    expect(passed).not.toContain('modelValue');
    expect(passed).not.toContain('onUpdate:modelValue');
  });

  it('writes the new file list into the form when a file is selected', async () => {
    const { wrapper, value } = await mountUpload(existing);

    await selectFile(wrapper, new File(['hello'], 'three.txt'));

    expect(value().map((file: { name: string }) => file.name)).toEqual(['one.txt', 'two.txt', 'three.txt']);
  });

  it('keeps the selected file on the stored item', async () => {
    const { wrapper, value } = await mountUpload();

    await selectFile(wrapper, new File(['hello'], 'three.txt'));

    expect(value()).toHaveLength(1);
    expect(value()[0].name).toBe('three.txt');
    expect(value()[0].raw).toBeInstanceOf(File);
  });

  it('writes the form value once per selection', async () => {
    const { wrapper } = await mountUpload();
    const writes = vi.fn();
    const form = wrapper.vm as unknown as { values: { f?: unknown } };
    watch(() => form.values.f, writes, { flush: 'sync' });

    await selectFile(wrapper, new File(['hello'], 'three.txt'));

    expect(writes).toHaveBeenCalledTimes(1);
  });

  it('keeps a removed file out of the form value', async () => {
    const { upload, value } = await mountUpload(existing);
    const [first, second] = upload().props('fileList') as { name: string }[];

    const onRemove = upload().props('onRemove') as unknown as (file: unknown, list: unknown[]) => void;
    onRemove(first, [second]);
    await flushPromises();

    expect(value().map((file: { name: string }) => file.name)).toEqual(['two.txt']);
  });

  it('removes a file through the remove control of the list', async () => {
    const { wrapper, value } = await mountUpload(existing);

    const item = wrapper.findAll('.el-upload-list__item').find(entry => entry.text().includes('one.txt'))!;
    await item.find('[aria-label="Delete"]').trigger('click');
    await flushPromises();

    expect(value().map((file: { name: string }) => file.name)).toEqual(['two.txt']);
  });

  it('makes no network request when auto upload is off and there is no action', async () => {
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { wrapper, value } = await mountUpload();

    await selectFile(wrapper, new File(['hello'], 'three.txt'));

    expect(value()).toHaveLength(1);
    expect(open).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
