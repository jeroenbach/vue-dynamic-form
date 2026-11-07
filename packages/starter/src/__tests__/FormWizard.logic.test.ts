import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import FormWizard from '@/FormWizard.vue';

const steps = [{ title: 'Step One' }, { title: 'Step Two' }, { title: 'Step Three' }];

function mountWizard(propsOverrides: Record<string, unknown> = {}, slotHtml?: string) {
  return mount(FormWizard, {
    attachTo: document.body,
    props: {
      currentStepIndex: 0,
      isFirst: true,
      isLast: false,
      isValidating: false,
      steps,
      dataTestid: 'wizard',
      next: vi.fn(),
      prev: vi.fn(),
      gotoStep: vi.fn(),
      ...propsOverrides,
    },
    slots: {
      default: slotHtml ?? `
        <div data-page="0"><input /></div>
        <div data-page="1"><input aria-invalid="true" /></div>
        <div data-page="2"></div>
      `,
    },
  });
}

describe('component FormWizard - focus on step change', () => {
  it('never steals focus on mount', () => {
    mountWizard();

    expect(document.activeElement).toBe(document.body);
  });

  it('focuses the new page container, with a temporary tabindex and a label naming the step', async () => {
    const wrapper = mountWizard();

    await wrapper.setProps({ currentStepIndex: 1 });
    await flushPromises();

    const page1 = wrapper.find('[data-page="1"]');
    expect(document.activeElement).toBe(page1.element);
    expect(page1.attributes('tabindex')).toBe('-1');

    const labelledbyId = page1.attributes('aria-labelledby');
    expect(labelledbyId).toBeDefined();
    expect(document.getElementById(labelledbyId!)?.textContent).toBe('Step Two');
  });

  it('still carries a real accessible name when dataTestid is unset, such as a wizard with path: \'\' on its root', async () => {
    const wrapper = mountWizard({ dataTestid: undefined });

    await wrapper.setProps({ currentStepIndex: 1 });
    await flushPromises();

    const page1 = wrapper.find('[data-page="1"]');
    const labelledbyId = page1.attributes('aria-labelledby');
    expect(labelledbyId).toBeDefined();
    expect(labelledbyId).not.toBe('');
    expect(document.getElementById(labelledbyId!)?.textContent).toBe('Step Two');
  });

  it('removes the temporary tabindex once the container loses focus', async () => {
    const wrapper = mountWizard();

    await wrapper.setProps({ currentStepIndex: 1 });
    await flushPromises();

    const page1 = wrapper.find('[data-page="1"]').element as HTMLElement;
    page1.dispatchEvent(new Event('blur'));

    expect(page1.hasAttribute('tabindex')).toBe(false);
  });

  it('focuses an empty page container without error', async () => {
    const wrapper = mountWizard({ currentStepIndex: 1 });

    await wrapper.setProps({ currentStepIndex: 2 });
    await flushPromises();

    const page2 = wrapper.find('[data-page="2"]');
    expect(document.activeElement).toBe(page2.element);
    expect(page2.attributes('tabindex')).toBe('-1');
  });

  it('settles on the latest step after rapid repeated changes, never focusing the skipped-over step', async () => {
    const wrapper = mountWizard();

    // Fired back to back, with no await in between, mirroring a double-clicked Continue.
    wrapper.setProps({ currentStepIndex: 1 });
    wrapper.setProps({ currentStepIndex: 2 });
    await flushPromises();

    const page1 = wrapper.find('[data-page="1"]');
    const page2 = wrapper.find('[data-page="2"]');
    expect(document.activeElement).toBe(page2.element);
    expect(page2.attributes('tabindex')).toBe('-1');
    expect(page1.attributes('tabindex')).toBeUndefined();
  });
});

describe('component FormWizard - focus on a failed Continue', () => {
  it('focuses the first invalid field on the current page, not the page container', async () => {
    const next = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountWizard({ currentStepIndex: 1, next });

    await wrapper.find('[data-testid="wizard-next-button"]').trigger('click');
    await flushPromises();

    const page1 = wrapper.find('[data-page="1"]');
    expect(document.activeElement).toBe(page1.find('input').element);
    expect(page1.attributes('tabindex')).toBeUndefined();
  });

  it('does nothing when a failed Continue leaves no matching page container to search, such as a fully overridden page wrapper', async () => {
    const next = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountWizard({ currentStepIndex: 0, next }, '<div>no data-page attribute here</div>');

    await wrapper.find('[data-testid="wizard-next-button"]').trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(document.body);
  });

  it('does nothing extra when next() succeeds, leaving the step-change watch in charge', async () => {
    let wrapper: ReturnType<typeof mountWizard>;
    const next = vi.fn().mockImplementation(async () => {
      await wrapper.setProps({ currentStepIndex: 1 });
    });
    wrapper = mountWizard({ currentStepIndex: 0, next });

    await wrapper.find('[data-testid="wizard-next-button"]').trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find('[data-page="1"]').element);
  });

  it('focuses the nearest focusable descendant when the only invalid control is a group whose aria-invalid lives on a non-focusable wrapper, such as a required choice group', async () => {
    const next = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountWizard({ currentStepIndex: 0, next }, `
      <div data-page="0">
        <div role="radiogroup" aria-invalid="true">
          <button tabindex="-1">Option A</button>
          <button tabindex="0">Option B</button>
        </div>
      </div>
    `);

    await wrapper.find('[data-testid="wizard-next-button"]').trigger('click');
    await flushPromises();

    const page0 = wrapper.find('[data-page="0"]');
    expect(document.activeElement).toBe(page0.findAll('button')[1].element);
    expect(page0.attributes('tabindex')).toBeUndefined();
  });

  it('skips an invalid field hidden inside the current page, focusing a later visible invalid field instead', async () => {
    const next = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountWizard({ currentStepIndex: 0, next }, `
      <div data-page="0">
        <div style="display:none"><input aria-invalid="true" id="hidden" /></div>
        <input aria-invalid="true" id="visible" />
      </div>
    `);

    await wrapper.find('[data-testid="wizard-next-button"]').trigger('click');
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find('#visible').element);
  });
});
