import { describe, expect, it } from 'vitest';
import { mountInForm } from './fixtures/mountInForm';

const cases: [string, string][] = [
  ['number', '42'],
  ['email', 'jordan@example.com'],
  ['tel', '+31612345678'],
  ['url', 'https://example.com'],
  ['date', '2026-11-03'],
  ['time', '14:30'],
  ['datetime-local', '2026-11-03T14:30'],
];

describe('component StarterFormTemplate - HTML5 text-mode types keep a string model', () => {
  it.each(cases)('%s: stores the raw string, never a coerced value', async (type, value) => {
    const { wrapper, values } = await mountInForm({
      metadata: { name: 'field', type, fieldOptions: { label: 'Field' } },
    });

    await wrapper.find('input.sft-input').setValue(value);

    expect(values().field).toBe(value);
    expect(typeof values().field).toBe('string');
  });
});
