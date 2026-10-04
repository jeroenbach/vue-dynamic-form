import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../StarterFormTemplate.vue'), 'utf8');

const wiredSlotFamily = ['default', 'default-input', 'heading', 'checkbox', 'checkbox-input', 'select-input', 'password-input', 'default-array', 'heading-array', 'heading-array-item', 'default-choice', 'heading-choice', 'heading-choice-array', 'default-choice-array-item', 'default-wizard', 'default-wizard-page', 'wizardSummaryPage'];

describe('starterFormTemplate - wired slot family', () => {
  it('wires exactly the inputs/fields, arrays/groups, choice, and wizard slot family the package owns', () => {
    for (const name of wiredSlotFamily)
      expect(source).toContain(`#${name}=`);
  });
});
