import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { customMessagesSampleValues, customMessagesTestCase, showOptionalInsteadOfRequiredSampleValues, showOptionalInsteadOfRequiredTestCase, validateAfterSubmitTestCase, validateOnBlurTestCase, validateOnSubmitOnlyTestCase, validateWhenInErrorTestCase, validationTimingSampleValues } from '@bach.software/vue-dynamic-form/examples';
import { sampleDataStory } from './sampleDataStory';

const meta = {
  title: 'Forms/TestCases/Settings',
  component: validateOnSubmitOnlyTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof validateOnSubmitOnlyTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Errors only appear on submit and stay unchanged while typing. Toggle "Load sample data" to pre-fill it. */
export const ValidateOnSubmitOnly: Story = sampleDataStory(validateOnSubmitOnlyTestCase, validationTimingSampleValues);

/** Errors appear when leaving a field, not while typing. Toggle "Load sample data" to pre-fill it. */
export const ValidateOnBlur: Story = sampleDataStory(validateOnBlurTestCase, validationTimingSampleValues);

/** No live validation until the first submit; afterwards every change validates. Toggle "Load sample data" to pre-fill it. */
export const ValidateAfterSubmit: Story = sampleDataStory(validateAfterSubmitTestCase, validationTimingSampleValues);

/** Fields only start live-validating once they are in error (after a submit). Toggle "Load sample data" to pre-fill it. */
export const ValidateWhenInError: Story = sampleDataStory(validateWhenInErrorTestCase, validationTimingSampleValues);

/** The extended showOptionalInsteadOfRequired setting: optional fields are marked instead of required ones. Toggle "Load sample data" to pre-fill it. */
export const ShowOptionalInsteadOfRequired: Story = sampleDataStory(showOptionalInsteadOfRequiredTestCase, showOptionalInsteadOfRequiredSampleValues);

/** Validation message overrides via settings.messages, with fallback to the library defaults. Toggle "Load sample data" to pre-fill it. */
export const CustomMessages: Story = sampleDataStory(customMessagesTestCase, customMessagesSampleValues);
