import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import FormWizard from '@/FormWizard.vue';

const baseProps = {
  currentStepIndex: 0,
  isFirst: true,
  isLast: false,
  isValidating: false,
  next: vi.fn(),
  prev: vi.fn(),
  gotoStep: vi.fn(),
};

describe('component FormWizard', () => {
  it('renders no head when neither title nor subTitle is given', () => {
    const wrapper = mount(FormWizard, { props: baseProps });

    expect(wrapper.find('.sft-wizard-head').exists()).toBe(false);
  });

  it('omits data-testid attributes on its buttons when no dataTestid prop is given', async () => {
    const wrapper = mount(FormWizard, { props: baseProps });

    expect(wrapper.find('[data-testid]').exists()).toBe(false);

    const back = wrapper.findAll('button')[0];
    await back.trigger('click');
    expect(baseProps.prev).toHaveBeenCalledTimes(1);
  });

  it('disables the Next button while validating', () => {
    const wrapper = mount(FormWizard, { props: { ...baseProps, isValidating: true } });

    const next = wrapper.findAll('button')[1];
    expect(next.attributes('disabled')).toBeDefined();
  });

  it('renders only the eyebrow when subTitle is omitted', () => {
    const wrapper = mount(FormWizard, { props: { ...baseProps, title: 'Onboarding' } });

    expect(wrapper.find('.sft-wizard-eyebrow').text()).toBe('Onboarding');
    expect(wrapper.find('.sft-wizard-title').exists()).toBe(false);
  });

  it('renders only the title when title is omitted', () => {
    const wrapper = mount(FormWizard, { props: { ...baseProps, subTitle: 'Launch approach' } });

    expect(wrapper.find('.sft-wizard-eyebrow').exists()).toBe(false);
    expect(wrapper.find('.sft-wizard-title').text()).toBe('Launch approach');
  });

  it('omits the submit button data-testid when no dataTestid prop is given', () => {
    const wrapper = mount(FormWizard, { props: { ...baseProps, isLast: true } });

    const submit = wrapper.findAll('button')[1];
    expect(submit.attributes('type')).toBe('submit');
    expect(submit.attributes('data-testid')).toBeUndefined();
  });
});
