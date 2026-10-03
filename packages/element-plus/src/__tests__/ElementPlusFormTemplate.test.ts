import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { flushPromises, mount } from '@vue/test-utils';
import { ElInput, ElSelect } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, toRaw } from 'vue';
import ElementPlusFormTemplate from '@/ElementPlusFormTemplate.vue';
import { elementPlusMetadata, extendMetadata } from '@/metadata';
import { mountInput } from './ElementPlusFormTemplate.test-helpers';
import ExtendedMetadataUsage from './fixtures/ExtendedMetadataUsage.vue';

describe('metadataConfiguration', () => {
  it('defaults to the built-in catalogue when the prop is omitted', () => {
    const { wrapper } = mountInput('text-input', { value: 'a' });

    expect(wrapper.findComponent({ name: 'DynamicFormTemplate' }).props('metadataConfiguration')).toBe(elementPlusMetadata);
  });

  it('hands a given configuration through to the dispatcher', () => {
    const myMetadata = extendMetadata<{ richText: string }, { toolbar?: boolean }>();
    const { wrapper } = mountInput('text-input', { value: 'a', props: { metadataConfiguration: myMetadata } });

    expect(toRaw(wrapper.findComponent({ name: 'DynamicFormTemplate' }).props('metadataConfiguration'))).toBe(myMetadata);
  });

  it('renders the same output for an extended configuration as for the default', () => {
    const plain = mountInput('text-input', { value: 'a' });
    const extended = mountInput('text-input', { value: 'a', props: { metadataConfiguration: extendMetadata() } });

    // Element Plus marks only the first mounted input wrapper as programmatically focusable, which is unrelated to the configuration.
    const withoutFocusMarker = (html: string) => html.replaceAll(' tabindex="-1"', '');
    expect(withoutFocusMarker(extended.wrapper.html())).toBe(withoutFocusMarker(plain.wrapper.html()));
  });

  it('mounts a template typed with an extended configuration', () => {
    const wrapper = mount(ExtendedMetadataUsage);

    expect(wrapper.exists()).toBe(true);
  });
});

describe('under the engine', () => {
  const Template = defineComponent({
    setup: (_, { slots }) => () => h(ElementPlusFormTemplate as any, null, slots),
  });

  const Host = defineComponent({
    setup(_, { expose }) {
      const { values } = useDynamicForm();
      expose({ values });
      return () => h(DynamicForm, {
        template: Template as any,
        metadata: [
          { name: 'name', type: 'text' },
          { name: 'country', type: 'select', options: [{ label: 'Netherlands', value: 'nl' }] },
        ] as any,
      });
    },
  });

  it('renders the Element Plus controls for text and select fields', async () => {
    const wrapper = mount(Host);
    await flushPromises();

    expect(wrapper.findComponent(ElInput).exists()).toBe(true);
    expect(wrapper.findComponent(ElSelect).exists()).toBe(true);
  });

  it('stores typed text in the form values', async () => {
    const wrapper = mount(Host);
    await flushPromises();

    await wrapper.find('input').setValue('Jeroen');
    await flushPromises();

    expect((wrapper.vm as any).values.name).toBe('Jeroen');
  });
});
