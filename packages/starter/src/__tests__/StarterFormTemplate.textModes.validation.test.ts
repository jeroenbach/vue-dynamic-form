import { describe, expect, it } from 'vitest';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - HTML5 text-mode types keep validating the lexical value', () => {
  it('fails xsd_minInclusive/xsd_maxInclusive on a number field exactly as it would for a text field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        name: 'age',
        type: 'number',
        fieldOptions: { label: 'Age' },
        restriction: { minInclusive: 0, maxInclusive: 50 },
      },
    });

    await wrapper.find('input.sft-input').setValue('99');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('fails xsd_totalDigits/xsd_fractionDigits on a number field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        name: 'price',
        type: 'number',
        fieldOptions: { label: 'Price' },
        restriction: { totalDigits: 3, fractionDigits: 1 },
      },
    });

    await wrapper.find('input.sft-input').setValue('12345.678');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('fails xsd_pattern on an email field, exactly as it would for a text field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        name: 'email',
        type: 'email',
        fieldOptions: { label: 'Email' },
        restriction: { pattern: '^[^@]+@[^@]+$' },
      },
    });

    await wrapper.find('input.sft-input').setValue('not-an-email');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('fails xsd_pattern on a url field, exactly as it would for a text field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        name: 'website',
        type: 'url',
        fieldOptions: { label: 'Website' },
        restriction: { pattern: '^https://.+' },
      },
    });

    await wrapper.find('input.sft-input').setValue('ftp://example.com');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('enforces nothing on submit from number.min/max alone, with no matching restriction', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: {
        name: 'age',
        type: 'number',
        fieldOptions: { label: 'Age' },
        number: { min: 0, max: 50 },
      },
    });

    await wrapper.find('input.sft-input').setValue('999');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });
});
