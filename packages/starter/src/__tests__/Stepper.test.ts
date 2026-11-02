import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Stepper from '@/Stepper.vue';

const steps = [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }];

describe('component Stepper', () => {
  it('omits data-testid attributes when no dataTestid prop is given, and still emits goto on click', async () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 1 } });

    expect(wrapper.find('nav').attributes('data-testid')).toBeUndefined();
    expect(wrapper.findAll('button')[0].attributes('data-testid')).toBeUndefined();

    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('goto')).toEqual([[0]]);
  });

  it('marks only the clicked step as clickable when forward jumps are disabled', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 1, allowForwardJump: false } });

    const buttons = wrapper.findAll('button');
    expect(buttons[0].attributes('disabled')).toBeUndefined();
    expect(buttons[1].attributes('disabled')).toBeUndefined();
    expect(buttons[2].attributes('disabled')).toBeDefined();
  });

  it('allows clicking any step when forward jumps are enabled', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 0, allowForwardJump: true } });

    expect(wrapper.findAll('button').every(button => button.attributes('disabled') === undefined)).toBe(true);
  });

  it('renders a step with errors in red, with the "!" marker, aria-invalid, and the aria-label suffix', () => {
    const erroredSteps = [{ title: 'One', hasError: true }, { title: 'Two' }];
    const wrapper = mount(Stepper, { props: { steps: erroredSteps, currentStep: 0 } });

    const button = wrapper.findAll('button')[0];
    expect(button.classes()).toContain('is-error');
    expect(button.attributes('aria-invalid')).toBe('true');
    expect(button.attributes('aria-label')).toBe('Step 1: One (contains errors)');
    expect(button.find('.sft-step-dot > span[aria-hidden="true"]').text()).toBe('!');
  });

  it('renders no error state and no aria-invalid for a step without errors', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 1 } });

    const button = wrapper.findAll('button')[1];
    expect(button.classes()).not.toContain('is-error');
    expect(button.attributes('aria-invalid')).toBeUndefined();
    expect(button.attributes('aria-label')).toBe('Step 2: Two');
  });
});
