import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import SubmissionSuccess from '@/SubmissionSuccess.vue';

describe('submissionSuccess showJson state', () => {
  it('toggles the submitted JSON view and emits reset with no arguments', async () => {
    const wrapper = mount(SubmissionSuccess, {
      props: { submittedJson: '{"a":1}', dataTestid: 'success' },
    });

    expect(wrapper.find('pre').exists()).toBe(false);

    await wrapper.find('[data-testid="success-toggle-json-button"]').trigger('click');
    expect(wrapper.find('pre').text()).toBe('{"a":1}');

    await wrapper.find('[data-testid="success-toggle-json-button"]').trigger('click');
    expect(wrapper.find('pre').exists()).toBe(false);

    await wrapper.find('[data-testid="success-reset-button"]').trigger('click');
    expect(wrapper.emitted('reset')).toEqual([[]]);
  });
});

describe('submissionSuccess icon rendering, mounted standalone', () => {
  it('renders the Lucide default badge glyph with no form ancestor to provide an override', () => {
    const wrapper = mount(SubmissionSuccess, { props: { title: 'Done' } });

    expect(wrapper.find('.sft-success-badge svg').exists()).toBe(true);
  });

  it('still renders the Lucide default when an unrelated ancestor provides something under a different key', () => {
    const UnrelatedAncestor = defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.());
      },
    });

    const wrapper = mount(UnrelatedAncestor, {
      slots: {
        default: () => h(SubmissionSuccess, { title: 'Done' }),
      },
    });

    expect(wrapper.find('.sft-success-badge svg').exists()).toBe(true);
  });
});
