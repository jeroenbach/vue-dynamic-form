import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { wizardMetadata } from './fixtures/wizardMetadata';
import { click, isHidden, mountWizardForm } from './wizard.test-helpers';

describe('component StarterFormTemplate - gotoStep forwarded through StarterSlotProperties', () => {
  it('forwards gotoStep through an overridden page wrapper and lets it jump forward when allowed', async () => {
    const customPage = (scope: any, slots: any) => h('div', {
      'data-testid': `custom-page-${scope.pageIndex}`,
      'style': scope.isCurrent ? undefined : { display: 'none' },
    }, [
      h('button', { 'data-testid': `jump-from-${scope.pageIndex}`, 'onClick': () => scope.gotoStep(2) }, 'jump'),
      slots.default?.(scope),
    ]);
    const template = createConsumerWrapper({ overrides: { 'default-wizard-page': customPage } });
    const { wrapper } = await mountWizardForm(
      wizardMetadata({ pages: 3, extra: { wizard: { allowForwardJump: true } } }),
      { template },
    );

    await click(wrapper.find('[data-testid="jump-from-0"]'));

    expect(isHidden(wrapper.find('[data-testid="custom-page-0"]'))).toBe(true);
    expect(isHidden(wrapper.find('[data-testid="custom-page-2"]'))).toBe(false);
  });

  it('forwards gotoStep into a field override inside a wizard page, through the page content slotProps chain', async () => {
    const metadata = wizardMetadata({ pages: 2, extra: { wizard: { allowForwardJump: true } } });
    (metadata.children[0] as { children: unknown[] }).children.push({
      name: 'section',
      type: 'heading',
      fieldOptions: { label: 'Section' },
      children: [{ name: 'note', type: 'text', fieldOptions: { label: 'Note' } }],
    });

    let capturedGotoStep: ((index: number) => unknown) | undefined;
    const template = createConsumerWrapper({
      overrides: {
        heading: (scope: any, slots: any) => {
          capturedGotoStep = scope.slotProps?.gotoStep;
          return h('section', { 'data-testid': 'custom-heading' }, slots.default?.(scope));
        },
      },
    });

    const { wrapper } = await mountWizardForm(metadata, { template });

    expect(typeof capturedGotoStep).toBe('function');

    await capturedGotoStep!(1);
    await flushPromises();

    expect(isHidden(wrapper.find('[data-testid="wizard.page1-page"]'))).toBe(false);
  });
});
