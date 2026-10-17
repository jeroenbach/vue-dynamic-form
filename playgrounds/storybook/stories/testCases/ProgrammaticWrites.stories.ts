import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { ProgrammaticWritesTestCase } from '@bach.software/vue-dynamic-form/examples';

const meta = {
  title: 'Forms/TestCases/ProgrammaticWrites',
  component: ProgrammaticWritesTestCase,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ProgrammaticWritesTestCase>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every value the buttons write is deliberately invalid. With "shouldValidate" unticked, click
 * "setFieldValue('code', ...)" or "setValues({ ... })": the values appear in the fields and in the
 * debug output, but no error messages show, the write asked to skip validation. Then edit any
 * field by hand or submit: validation runs with its normal timing and the errors appear.
 */
export const WriteWithoutValidating: Story = {};

/**
 * Tick "shouldValidate" and click either button: the same invalid values are written, but now the
 * error messages appear immediately, a validating write (the default) behaves exactly as before.
 */
export const WriteAndValidate: Story = {};

/**
 * Write values (either way), submit to surface all errors, then click "Reset": the form returns to
 * empty with every error cleared, and the errors stay away, the reset's own value change no longer
 * writes the just-cleared errors back.
 */
export const ResetStaysClean: Story = {};
