import { checkboxMetadata, fileMetadata, headingArrayMetadata, numberMetadata, passwordMetadata, radioMetadata, selectMetadata, textareaMetadata, textMetadata } from './metadata';

// A clean explicit choice group: unlike `choiceMetadata.ts`'s `explicitChoiceMetadata`, this one
// carries no deliberately-broken icon name, so it does not add unrelated noise to this fixture.
const launchChoiceMetadata = {
  name: 'launch',
  type: 'heading',
  fieldOptions: { label: 'Launch approach' },
  description: 'How do you want to go live?',
  explicitChoiceSelection: true,
  choicePicker: { show: true },
  choice: [
    { name: 'selfServe', type: 'text', fieldOptions: { label: 'Self-serve rollout' }, description: 'Configure and launch on your own.' },
    { name: 'guided', type: 'text', fieldOptions: { label: 'Guided rollout' }, description: 'A specialist plans it with you.' },
  ],
};

/**
 * One field of every type the starter template renders, combined under a single root so a
 * regression in any one of them is caught by a single render, not only by its own
 * per-component test.
 */
export const axeFormMetadata = {
  name: 'profile',
  fieldOptions: { label: 'Profile' },
  children: [
    { ...textMetadata, minOccurs: 1 },
    { ...selectMetadata, minOccurs: 1 },
    { ...passwordMetadata, minOccurs: 1 },
    { ...textareaMetadata, minOccurs: 1, description: 'A short introduction.' },
    { ...radioMetadata, minOccurs: 1, description: 'Pick the channel you prefer.' },
    { ...fileMetadata, minOccurs: 1 },
    { ...numberMetadata, minOccurs: 1 },
    checkboxMetadata,
    launchChoiceMetadata,
    headingArrayMetadata,
  ],
};
