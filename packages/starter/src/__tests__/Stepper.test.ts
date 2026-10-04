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
});
