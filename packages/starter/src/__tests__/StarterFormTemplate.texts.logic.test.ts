import { describe, expect, it } from 'vitest';
import { addButton, addReason } from './choice.test-helpers';
import { explicitChoiceArrayMetadata } from './fixtures/choiceMetadata';
import { headingArrayMetadata, inlineArrayMetadata, passwordMetadata, selectMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';
import { wizardMetadata } from './fixtures/wizardMetadata';
import { click, mountWizardForm, nextButton, prevButton, submitButton } from './wizard.test-helpers';

describe('component StarterFormTemplate - overridable texts', () => {
  describe('wizard chrome', () => {
    it('falls back to the built-in button labels and step line', async () => {
      const { wrapper } = await mountWizardForm(wizardMetadata({ pages: 2 }));

      expect(nextButton(wrapper).text()).toBe('Continue');
      expect(prevButton(wrapper).text()).toBe('Back');
      expect(wrapper.find('.sft-wizard-helper').text()).toContain('Step 1 of 2');

      await click(nextButton(wrapper));

      expect(submitButton(wrapper).text()).toBe('Submit');
    });

    it('takes the button labels and step line from the wizard field metadata', async () => {
      const metadata = wizardMetadata({
        pages: 2,
        extra: {
          nextButtonText: 'Verder',
          prevButtonText: 'Terug',
          submitButtonText: 'Versturen',
          stepText: 'Stap {current} van {total}',
        },
      });
      const { wrapper } = await mountWizardForm(metadata);

      expect(nextButton(wrapper).text()).toBe('Verder');
      expect(prevButton(wrapper).text()).toBe('Terug');
      expect(wrapper.find('.sft-wizard-helper').text()).toContain('Stap 1 van 2');

      await click(nextButton(wrapper));

      expect(submitButton(wrapper).text()).toBe('Versturen');
    });

    it('takes the stepper aria labels from the wizard field metadata', async () => {
      const metadata = wizardMetadata({
        pages: 2,
        extra: { stepperAriaLabel: 'Voortgang', stepAriaLabel: 'Stap {number}: {title}' },
      });
      const { wrapper } = await mountWizardForm(metadata);

      expect(wrapper.find('.sft-stepper').attributes('aria-label')).toBe('Voortgang');
      expect(wrapper.find('[data-testid="wizard-step-0"]').attributes('aria-label')).toBe('Stap 1: Page 1');
    });

    it('takes the review confirmation title from the summary field metadata', async () => {
      const metadata = wizardMetadata({ pages: 1, confirmation: 'Check everything before sending.' });
      (metadata.children[1].children[0] as Record<string, unknown>).wizardSummaryConfirmationTitle = 'Klaar om te versturen?';
      const { wrapper } = await mountWizardForm(metadata);

      expect(wrapper.find('.sft-confirm-strong').text()).toBe('Klaar om te versturen?');
    });
  });

  describe('optional tag', () => {
    it('takes the optional tag text from the settings', async () => {
      const { wrapper } = await mountInForm({
        metadata: { ...textMetadata, minOccurs: 0 },
        settings: { showRequiredOrOptional: 'optional', optionalText: 'Optioneel' },
      });

      expect(wrapper.find('.sft-tag-optional').text()).toBe('Optioneel');
    });
  });

  describe('select placeholder', () => {
    it('falls back to the built-in placeholder option', async () => {
      const { wrapper } = await mountInForm({ metadata: selectMetadata });

      expect(wrapper.find('option[value=""]').text()).toBe('Select an option');
    });

    it('takes the placeholder option from the field metadata', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...selectMetadata, placeholder: 'Kies een optie' } });

      expect(wrapper.find('option[value=""]').text()).toBe('Kies een optie');
    });
  });

  describe('heading-array chrome', () => {
    const translated = {
      ...headingArrayMetadata,
      arrayNoItemsTitle: 'Nog geen contacten',
      arrayAddFirstButtonText: 'Eerste contact toevoegen',
      arrayAddButtonText: 'Contact toevoegen',
      arrayNewItemTitle: 'Nieuw contact',
      arrayRemoveButtonText: 'Verwijder',
      arrayRemoveAriaLabel: 'Verwijder contact {number}',
    };

    it('takes the empty-state title and add button labels from the field metadata', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...translated, autoAddMinOccurs: false } });

      expect(wrapper.find('.sft-empty-title').text()).toBe('Nog geen contacten');
      const addButtons = wrapper.findAll('[data-testid="contacts-add-button"]');
      expect(addButtons[0].text()).toContain('Eerste contact toevoegen');
      expect(addButtons[1].text()).toContain('Contact toevoegen');
    });

    it('takes the item placeholder title and remove button texts from the field metadata', async () => {
      const { wrapper } = await mountInForm({
        metadata: translated,
        initialValues: { contacts: [{ first: '', last: '' }] },
      });

      expect(wrapper.find('.sft-repeater-title').text()).toBe('Nieuw contact');
      const remove = wrapper.find('[data-testid="contacts[0]-remove-button"]');
      expect(remove.text()).toContain('Verwijder');
      expect(remove.attributes('aria-label')).toBe('Verwijder contact 1');
    });
  });

  describe('inline array chrome', () => {
    it('takes the add button label and item wording from the field metadata', async () => {
      const { wrapper } = await mountInForm({
        metadata: { ...inlineArrayMetadata, arrayItemName: 'tag', arrayItemNamePlural: 'tags', arrayAddButtonText: 'Meer' },
        initialValues: { tags: ['one'] },
      });

      expect(wrapper.find('[data-testid="tags-add-button"]').text()).toBe('Meer');
      expect(wrapper.find('[data-testid="tags-count"]').text()).toBe('1 tag');
    });
  });

  describe('repeatable choice chrome', () => {
    it('takes the per-branch add button and limit texts from the field metadata', async () => {
      const { wrapper } = await mountInForm({
        metadata: {
          ...explicitChoiceArrayMetadata,
          choiceAddButtonText: '{option} toevoegen',
          choiceLimitReachedText: 'Limiet voor {option} bereikt.',
        },
        initialValues: { channels: { webhook: ['https://example.com/webhook'] } },
      });

      expect(addButton(wrapper, 'channels', 'email').text()).toContain('Email toevoegen');
      expect(addReason(wrapper, 'channels', 'webhook').text()).toBe('Limiet voor Webhook bereikt.');
    });
  });

  describe('password chrome', () => {
    it('takes the visibility toggle aria labels and strength labels from the field metadata', async () => {
      const { wrapper } = await mountInForm({
        metadata: {
          ...passwordMetadata,
          showPasswordAriaLabel: 'Toon wachtwoord',
          hidePasswordAriaLabel: 'Verberg wachtwoord',
          passwordStrengthLabels: { weak: 'Zwak' },
        },
        initialValues: { password: 'abc' },
      });

      const toggle = wrapper.find('[data-testid="password-input-toggle"]');
      expect(toggle.attributes('aria-label')).toBe('Toon wachtwoord');

      await click(toggle);

      expect(toggle.attributes('aria-label')).toBe('Verberg wachtwoord');
      expect(wrapper.find('[data-testid="password-input-strength"]').text()).toBe('Zwak');
    });
  });
});
