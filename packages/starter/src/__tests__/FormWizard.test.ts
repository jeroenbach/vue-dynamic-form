import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import FormWizard from '@/FormWizard.vue';
import { expectNoAxeViolations } from './helpers/axe';

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

  it('shows no error alert and an enabled submit button when no step has errors', () => {
    const wrapper = mount(FormWizard, {
      props: { ...baseProps, isLast: true, steps: [{ title: 'One' }, { title: 'Two' }] },
    });

    expect(wrapper.find('.sft-wizard-alert').exists()).toBe(false);
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();
  });

  it('shows the error alert and disables the submit button on the last step when a step has errors', () => {
    const wrapper = mount(FormWizard, {
      props: { ...baseProps, isLast: true, steps: [{ title: 'One', hasError: true }, { title: 'Two' }] },
    });

    const alert = wrapper.find('.sft-wizard-alert');
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toBe('Some steps still contain errors. Fix the steps marked in red before submitting.');
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('takes the error alert text from the stepErrorsText prop and derives its data-testid from dataTestid', () => {
    const wrapper = mount(FormWizard, {
      props: {
        ...baseProps,
        isLast: true,
        dataTestid: 'wizard',
        steps: [{ title: 'One', hasError: true }],
        stepErrorsText: 'Fix the red steps first.',
      },
    });

    const alert = wrapper.find('[data-testid="wizard-step-errors-message"]');
    expect(alert.text()).toBe('Fix the red steps first.');
  });

  it('shows no error alert on a step before the last one, even when a step has errors', () => {
    const wrapper = mount(FormWizard, {
      props: { ...baseProps, isLast: false, steps: [{ title: 'One', hasError: true }, { title: 'Two' }] },
    });

    expect(wrapper.find('.sft-wizard-alert').exists()).toBe(false);
  });

  describe('accessibility', () => {
    it('has no violations in the default step-1 render', async () => {
      const wrapper = mount(FormWizard, {
        props: { ...baseProps, title: 'Client Onboarding', subTitle: 'Your profile', steps: [{ title: 'One' }, { title: 'Two' }] },
        slots: { default: () => h('div', { 'data-page': '0' }, [h('label', { for: 'field0' }, 'Field 1'), h('input', { id: 'field0' })]) },
        attachTo: document.body,
      });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
