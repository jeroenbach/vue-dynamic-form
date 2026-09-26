import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { KeepValuesOnUnmountTestCase } from '@bach.software/vue-dynamic-form/examples';

const meta = {
  title: 'Forms/TestCases/KeepValuesOnUnmount',
  component: KeepValuesOnUnmountTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof KeepValuesOnUnmountTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Fill in the Contact field and its Certainty attribute, tick "keepValuesOnUnmount", then untick
 * "Show contact field" to unmount it and tick it again to remount it. Both the Contact value and
 * its Certainty attribute survive in the debug output below the form.
 */
export const HideAndShowWithFlagOn: Story = {};

/**
 * Fill in the Contact field and its Certainty attribute, leave "keepValuesOnUnmount" unticked,
 * then untick "Show contact field". Both the Contact value and its Certainty attribute disappear
 * from the debug output; ticking "Show contact field" again remounts it empty.
 */
export const HideAndShowWithFlagOff: Story = {};

/**
 * Fill in the Contact field and its Certainty attribute, tick "keepValuesOnUnmount", then clear
 * the Contact field's own text value while it stays mounted (do not toggle "Show contact field").
 * The Certainty attribute disappears from the debug output even though the flag is on, because an
 * empty complex value keeps no stale attributes.
 */
export const ClearOwnerValueWhileMounted: Story = {};
