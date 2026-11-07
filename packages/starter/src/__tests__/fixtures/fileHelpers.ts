import type { DOMWrapper } from '@vue/test-utils';

/** Simulates picking a file on a native `<input type="file">` test wrapper and fires `change`. */
export async function selectFile(input: DOMWrapper<HTMLInputElement>, name: string, type = 'application/octet-stream') {
  const file = new File(['content'], name, { type });
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  return file;
}
