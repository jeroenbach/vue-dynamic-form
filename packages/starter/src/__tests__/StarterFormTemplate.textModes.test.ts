import { describe, expect, it, vi } from 'vitest';
import { emailMetadata, numberMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const textModeTypes = ['number', 'email', 'tel', 'url', 'date', 'time', 'datetime-local'];

describe('component StarterFormTemplate - HTML5 text-mode types', () => {
  it.each(textModeTypes)('%s: renders a native input with that type, through the default-input slot, with no extendMetadata step', async (type) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { wrapper } = await mountInForm({
      metadata: { name: 'field', type, fieldOptions: { label: 'Field' } },
    });

    const input = wrapper.find('input.sft-input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe(type);
    expect(wrapper.findAll('input, textarea, select')).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('forwards number.min/max/step onto the plain-branch input', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...numberMetadata, number: { min: 0, max: 50, step: 5 } },
    });

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('min')).toBe('0');
    expect(input.attributes('max')).toBe('50');
    expect(input.attributes('step')).toBe('5');
  });

  it('forwards number.min/max/step onto the suffix-row input', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...numberMetadata, number: { min: 0, max: 50, step: 5 }, suffix: 'yrs' },
    });

    const input = wrapper.find('.sft-input-suffix-row input.sft-input');
    expect(input.attributes('min')).toBe('0');
    expect(input.attributes('max')).toBe('50');
    expect(input.attributes('step')).toBe('5');
  });

  it('leaves min/max/step absent on a number field with no number group set', async () => {
    const { wrapper } = await mountInForm({ metadata: numberMetadata });

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('min')).toBeUndefined();
    expect(input.attributes('max')).toBeUndefined();
    expect(input.attributes('step')).toBeUndefined();
  });

  it.each([
    ['text', textMetadata],
    ['email', emailMetadata],
  ])('%s: never renders a stray min/max/step="undefined" attribute', async (_label, metadata) => {
    const { wrapper } = await mountInForm({ metadata });

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('min')).toBeUndefined();
    expect(input.attributes('max')).toBeUndefined();
    expect(input.attributes('step')).toBeUndefined();
    expect(wrapper.html()).not.toMatch(/\bmin="undefined"|\bmax="undefined"|\bstep="undefined"/);
  });
});
