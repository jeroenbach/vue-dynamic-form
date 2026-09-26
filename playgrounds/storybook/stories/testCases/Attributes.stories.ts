import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { attributesSampleValues, attributesTestCase, complexTypeValuePropertySampleValues, complexTypeValuePropertyTestCase, individualSampleValues, individualTestCase } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Attributes',
  component: attributesTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof attributesTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Optional and required attributes on simple fields, plus isComplexType without attributes. Toggle "Load sample data" to see the { value, ...attributes } shape. */
export const AttributesAndComplexTypes: Story = sampleDataStory(attributesTestCase, attributesSampleValues);

/** A repeatable field (maxOccurs 3) where each item carries a lang attribute. Toggle "Load sample data" to pre-fill two items. */
export const AttributesOnArrayItems: Story = sampleDataStory(individualTestCase, individualSampleValues);

/** The complexTypeValueProperty setting renames the complex type value property (here to "val"). Toggle "Load sample data" to see the { val, lang } shape. */
export const ComplexTypeValueProperty: Story = sampleDataStory(complexTypeValuePropertyTestCase, complexTypeValuePropertySampleValues);
