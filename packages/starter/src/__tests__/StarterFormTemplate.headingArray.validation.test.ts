import { describe, expect, it } from 'vitest';
import { section } from './fixtures/arrayHelpers';
import { headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - heading-array section-level error', () => {
  it('shows a section-level sft-error, distinct from any per-field sft-error, when below minOccurs', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        ...headingArrayMetadata,
        minOccurs: 2,
        autoAddMinOccurs: false,
        children: [{ name: 'first', type: 'text', restriction: { minLength: 5 }, fieldOptions: { label: 'First' } }],
      },
      initialValues: { contacts: [{ first: 'Al' }] },
    });

    await validate();

    const root = section(wrapper, 'contacts');
    const sectionError = root.find('header .sft-error');
    expect(sectionError.exists()).toBe(true);

    const fieldError = root.find('article .sft-error');
    expect(fieldError.exists()).toBe(true);
    expect(sectionError.element).not.toBe(fieldError.element);
  });

  it('shows no empty state and no section error at exactly minOccurs', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 1, autoAddMinOccurs: false },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }] },
    });

    await validate();

    const root = section(wrapper, 'contacts');
    expect(root.find('.sft-empty').exists()).toBe(false);
    expect(root.find('header .sft-error').exists()).toBe(false);
  });
});
