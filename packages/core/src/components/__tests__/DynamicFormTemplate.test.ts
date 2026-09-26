import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';

// Standalone unit tests of DynamicFormTemplate.vue's slot-resolution (typeWithFallback), mounted
// directly (not through TestForm/TestFormTemplate) so each test controls exactly which slots are
// defined. This is the only way to exercise every tier of the *-choice-array /
// *-choice-array-item fallback chains without adding slot-priority permutations to the shared
// TestFormTemplate.vue fixture.

const metadata = defineMetadata<{ text: string }>();

// The component's entire render is gated by `v-if="attrs.fieldMetadata"` (DynamicFormTemplate.vue),
// so every mount below must supply a truthy fieldMetadata attr, or all three fallback tiers would
// render empty and a "falls back to default" assertion would pass vacuously instead of actually
// exercising typeWithFallback.
function mountTemplate(type: string, slots: Record<string, string>) {
  return mount(DynamicFormTemplate, {
    props: {
      metadataConfiguration: metadata as any,
    },
    attrs: {
      type,
      fieldMetadata: { path: 'field', type: 'text' },
    },
    slots: slots as any,
  });
}

describe('component DynamicFormTemplate — slot fallback priority', () => {
  describe('*-choice-array / default-choice-array fallback chain', () => {
    it('renders the dedicated per-type slot when both it and default-choice-array are defined', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'text-choice-array': '<div data-testid="dedicated" />',
        'default-choice-array': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="dedicated"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('renders default-choice-array when only that fallback is defined', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-choice-array': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('falls back to default when neither the dedicated slot nor default-choice-array is defined', () => {
      const wrapper = mountTemplate('text-choice-array', {
        default: '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  // A repeatable choice receives the same ChoiceAttributes as a single choice, so once its own
  // dedicated tiers are absent it degrades into the -choice family: templates written before the
  // -choice-array family existed keep rendering repeatable choices through their -choice slots.
  describe('*-choice-array falls back into the -choice family', () => {
    it('default-choice-array wins over the per-type -choice slot', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-choice-array': '<div data-testid="choice-array-fallback" />',
        'text-choice': '<div data-testid="per-type-choice" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="choice-array-fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="per-type-choice"]').exists()).toBe(false);
    });

    it('falls back to the per-type -choice slot when no -choice-array slots are defined', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'text-choice': '<div data-testid="per-type-choice" />',
        'default-choice': '<div data-testid="choice-fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="per-type-choice"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="choice-fallback"]').exists()).toBe(false);
    });

    it('falls back to default-choice when only the family fallbacks are defined', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-choice': '<div data-testid="choice-fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="choice-fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });
  });

  // A repeatable-choice occurrence receives a superset of ItemAttributes, so once its own
  // dedicated tiers are absent it degrades into the -array-item family: a generic array-item
  // card renders occurrences without a dedicated slot.
  describe('*-choice-array-item falls back into the -array-item family', () => {
    it('default-choice-array-item wins over the per-type -array-item slot', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'default-choice-array-item': '<div data-testid="choice-array-item-fallback" />',
        'text-array-item': '<div data-testid="per-type-array-item" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="choice-array-item-fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="per-type-array-item"]').exists()).toBe(false);
    });

    it('falls back to the per-type -array-item slot when no -choice-array-item slots are defined', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'text-array-item': '<div data-testid="per-type-array-item" />',
        'default-array-item': '<div data-testid="array-item-fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="per-type-array-item"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-item-fallback"]').exists()).toBe(false);
    });

    it('falls back to default-array-item when only the family fallbacks are defined', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'default-array-item': '<div data-testid="array-item-fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="array-item-fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });
  });

  describe('*-choice-array-item / default-choice-array-item fallback chain', () => {
    it('renders the dedicated per-type slot when both it and default-choice-array-item are defined', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'text-choice-array-item': '<div data-testid="dedicated" />',
        'default-choice-array-item': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="dedicated"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('renders default-choice-array-item when only that fallback is defined', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'default-choice-array-item': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('falls back to default when neither the dedicated slot nor default-choice-array-item is defined', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        default: '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  // "text-choice-array" also ends with "-array" (and "text-choice-array-item" with "-array-item"),
  // so the resolution order must pick the choice-array families' own tiers before any fallback
  // into another family: the container family falls back into -choice (never -array), and the
  // item family falls back into -array-item only after its own tiers are exhausted.
  describe('regression — the -choice-array families resolve their own tiers first', () => {
    it('-choice-array prefers default-choice-array over default-array', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-array': '<div data-testid="array" />',
        'default-choice-array': '<div data-testid="choice-array" />',
      });
      expect(wrapper.find('[data-testid="choice-array"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(false);
    });

    it('-choice-array-item prefers default-choice-array-item over default-array-item', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'default-array-item': '<div data-testid="array-item" />',
        'default-choice-array-item': '<div data-testid="choice-array-item" />',
      });
      expect(wrapper.find('[data-testid="choice-array-item"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-item"]').exists()).toBe(false);
    });

    it('-choice-array without any choice-family slot falls to default, not to default-array', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-array': '<div data-testid="array" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(false);
    });
  });

  // Regression guard: a misplaced branch in the resolution chain could shadow an existing family.
  describe('regression — the other dispatch families are not shadowed', () => {
    it('-array still resolves to default-array', () => {
      const wrapper = mountTemplate('text-array', {
        'default-array': '<div data-testid="array" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('-array-item still resolves to default-array-item', () => {
      const wrapper = mountTemplate('text-array-item', {
        'default-array-item': '<div data-testid="array-item" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="array-item"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('-choice still resolves to default-choice', () => {
      const wrapper = mountTemplate('text-choice', {
        'default-choice': '<div data-testid="choice" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="choice"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('-choice does not resolve to default-choice-array', () => {
      const wrapper = mountTemplate('text-choice', {
        'default-choice-array': '<div data-testid="choice-array" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="choice-array"]').exists()).toBe(false);
    });

    it('a plain (non-suffixed) type still resolves to default', () => {
      const wrapper = mountTemplate('text', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  // -wizard / -wizard-page fallback ladders (AC14, AC15), mirroring the -choice-array blocks above.
  describe('*-wizard / default-wizard fallback chain', () => {
    it('renders the dedicated per-type slot when both it and default-wizard are defined', () => {
      const wrapper = mountTemplate('horizontal-wizard', {
        'horizontal-wizard': '<div data-testid="dedicated" />',
        'default-wizard': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="dedicated"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(false);
    });

    it('renders default-wizard when only that fallback is defined', () => {
      const wrapper = mountTemplate('horizontal-wizard', {
        'default-wizard': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('falls back to default when neither the dedicated slot nor default-wizard is defined', () => {
      const wrapper = mountTemplate('horizontal-wizard', {
        default: '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });

    it('a typeless wizard resolves through its engine-default type and falls back to default-wizard', () => {
      const wrapper = mountTemplate('text-wizard', {
        'default-wizard': '<div data-testid="fallback" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
    });
  });

  describe('*-wizard-page / default-wizard-page fallback chain', () => {
    it('renders the dedicated per-type slot when both it and default-wizard-page are defined', () => {
      const wrapper = mountTemplate('text-wizard-page', {
        'text-wizard-page': '<div data-testid="dedicated" />',
        'default-wizard-page': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="dedicated"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(false);
    });

    it('renders default-wizard-page when only that fallback is defined, with no per-page type set', () => {
      const wrapper = mountTemplate('text-wizard-page', {
        'default-wizard-page': '<div data-testid="fallback" />',
        'default': '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="fallback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(false);
    });

    it('falls back to default when neither the dedicated slot nor default-wizard-page is defined', () => {
      const wrapper = mountTemplate('text-wizard-page', {
        default: '<div data-testid="default" />',
      });

      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });

  describe('regression — -wizard and -wizard-page are not shadowed by, and do not shadow, other families', () => {
    it('-wizard does not resolve to default-array or default-choice', () => {
      const wrapper = mountTemplate('text-wizard', {
        'default-array': '<div data-testid="array" />',
        'default-choice': '<div data-testid="choice" />',
        'default': '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="choice"]').exists()).toBe(false);
    });

    it('-array still resolves to default-array when a -wizard slot is also defined', () => {
      const wrapper = mountTemplate('text-array', {
        'default-array': '<div data-testid="array" />',
        'default-wizard': '<div data-testid="wizard" />',
      });
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="wizard"]').exists()).toBe(false);
    });
  });

  // The shared TestFormTemplate.vue fixture always defines the default-* fallback slot of each
  // family, so the "neither defined, falls all the way to default" side of these ternaries is
  // only exercised here.
  describe('falls back all the way to default when the tier-specific default-* slot is absent too', () => {
    it('-input falls back to default when default-input is not defined', () => {
      const wrapper = mountTemplate('text-input', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });

    it('-array falls back to default when default-array is not defined', () => {
      const wrapper = mountTemplate('text-array', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });

    it('-choice falls back to default when default-choice is not defined', () => {
      const wrapper = mountTemplate('text-choice', {
        default: '<div data-testid="default" />',
      });
      expect(wrapper.find('[data-testid="default"]').exists()).toBe(true);
    });
  });
});
