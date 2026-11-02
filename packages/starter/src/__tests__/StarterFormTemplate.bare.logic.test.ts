import type { MetadataConfiguration } from '@bach.software/vue-dynamic-form';
import type StarterFormTemplate from '@/StarterFormTemplate.vue';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { starterMetadata } from '@/metadata';
import { headingMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

// Vue compiles a generic `<script setup generic="...">` component into a generic function;
// extracting its first parameter is the only reliable way to read its props type back out.
type StarterFormTemplateProps = Parameters<typeof StarterFormTemplate>[0];

describe('component StarterFormTemplate - bare usage with no metadataConfiguration prop', () => {
  it('renders a text field through the default catalogue without a metadataConfiguration prop', async () => {
    const { wrapper } = await mountInForm({ metadata: textMetadata });

    expect(wrapper.find('input.sft-input').exists()).toBe(true);
  });

  it('binds the input to the form values in both directions', async () => {
    const { wrapper, values } = await mountInForm({ metadata: textMetadata, initialValues: { text: 'Jeroen' } });

    expect(wrapper.find('input').element.value).toBe('Jeroen');

    await wrapper.find('input').setValue('abc');
    await flushPromises();

    expect(values().text).toBe('abc');
  });

  it('renders the children of a heading-typed field inside the section card', async () => {
    const { wrapper } = await mountInForm({ metadata: headingMetadata });

    expect(wrapper.find('.sft-section-title').text()).toContain('Person');
    expect(wrapper.findAll('input.sft-input')).toHaveLength(2);
  });

  it('defaults its generic metadata configuration parameter to typeof starterMetadata', () => {
    expectTypeOf(starterMetadata).toMatchTypeOf<StarterFormTemplateProps['metadataConfiguration']>();
    expectTypeOf<undefined>().toMatchTypeOf<StarterFormTemplateProps['metadataConfiguration']>();
  });

  it('accepts any MetadataConfiguration as its generic bound', () => {
    expectTypeOf(starterMetadata).toMatchTypeOf<MetadataConfiguration>();
  });
});
