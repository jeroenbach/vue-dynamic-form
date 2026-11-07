import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { focusFirstInvalid } from '@/index';
import { mountInForm } from './fixtures/mountInForm';

describe('focusFirstInvalid', () => {
  it('moves focus to the first invalid field inside a plain, non-wizard template', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: [
        { name: 'valid', type: 'text', fieldOptions: { label: 'Valid' }, minOccurs: 0 },
        { name: 'invalid', type: 'text', fieldOptions: { label: 'Invalid' }, minOccurs: 1 },
      ],
    });
    await validate();
    await flushPromises();

    focusFirstInvalid(wrapper.element as HTMLElement);

    expect(document.activeElement).toBe(wrapper.find('[data-testid="invalid-input"]').element);
  });

  it('lands on the first radio input when the invalid field is a radio group (aria-invalid sits on the group)', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: [
        {
          name: 'contactMethod',
          type: 'radio',
          fieldOptions: { label: 'Contact' },
          minOccurs: 1,
          options: [{ key: 'email', value: 'Email' }, { key: 'phone', value: 'Phone' }],
        },
      ],
    });
    await validate();
    await flushPromises();

    focusFirstInvalid(wrapper.element as HTMLElement);

    expect(document.activeElement).toBe(wrapper.find('input[type="radio"]').element);
  });

  it('lands on the visually-hidden native input when the invalid field is a file field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: [{ name: 'resume', type: 'file', fieldOptions: { label: 'Resume' }, minOccurs: 1 }],
    });
    await validate();
    await flushPromises();

    focusFirstInvalid(wrapper.element as HTMLElement);

    expect(document.activeElement).toBe(wrapper.find('.sft-file-native').element);
  });

  it('is a no-op when the container has no invalid fields', async () => {
    const { wrapper } = await mountInForm({
      metadata: [{ name: 'valid', type: 'text', fieldOptions: { label: 'Valid' } }],
    });

    const activeBefore = document.activeElement;
    focusFirstInvalid(wrapper.element as HTMLElement);

    expect(document.activeElement).toBe(activeBefore);
  });

  it('does not throw and does not change focus when called with null', () => {
    const activeBefore = document.activeElement;

    expect(() => focusFirstInvalid(null)).not.toThrow();
    expect(document.activeElement).toBe(activeBefore);
  });
});
