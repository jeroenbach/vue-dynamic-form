import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DynamicFormTemplate from '@/components/DynamicFormTemplate.vue';
import { defineMetadata } from '@/core/defineMetadata';

// Standalone unit tests of DynamicFormTemplate.vue's slot-resolution (typeWithFallback), mounted
// directly (not through TestForm/TestFormTemplate) so each test controls exactly which slots are
// defined. This is the only way to exercise all three tiers of the *-choice-array /
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
  // so the resolution order must pick the choice-array families before the plain array families —
  // and never the other way around.
  describe('regression — the -choice-array families do not leak into the -array families', () => {
    it('-choice-array does not resolve to default-array', () => {
      const wrapper = mountTemplate('text-choice-array', {
        'default-array': '<div data-testid="array" />',
        'default-choice-array': '<div data-testid="choice-array" />',
      });
      expect(wrapper.find('[data-testid="choice-array"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array"]').exists()).toBe(false);
    });

    it('-choice-array-item does not resolve to default-array-item', () => {
      const wrapper = mountTemplate('text-choice-array-item', {
        'default-array-item': '<div data-testid="array-item" />',
        'default-choice-array-item': '<div data-testid="choice-array-item" />',
      });
      expect(wrapper.find('[data-testid="choice-array-item"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="array-item"]').exists()).toBe(false);
    });

    it('-choice-array without its own fallback falls to default, not to default-array', () => {
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
