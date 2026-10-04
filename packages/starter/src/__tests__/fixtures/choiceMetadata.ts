const paymentBranches = [
  { name: 'card', type: 'text', fieldOptions: { label: 'Card number' } },
  { name: 'bank', type: 'text', fieldOptions: { label: 'Bank account' } },
];

/** Automatic mode: the engine picks the branch that already carries a value, no selector cards. */
export const autoChoiceMetadata = {
  name: 'payment',
  type: 'text',
  fieldOptions: { label: 'Payment method' },
  description: 'Fields switch automatically with the selected method.',
  choice: paymentBranches,
};

export const autoChoiceSingleBranchMetadata = {
  name: 'payment',
  type: 'text',
  fieldOptions: { label: 'Payment method' },
  choice: [paymentBranches[0]],
};

const launchBranches = [
  {
    name: 'selfServe',
    type: 'text',
    fieldOptions: { label: 'Self-serve rollout' },
    description: 'Your team configures and launches at its own pace.',
    iconName: 'rocket',
  },
  {
    name: 'guided',
    type: 'text',
    fieldOptions: { label: 'Guided rollout' },
    description: 'A specialist plans kickoff, training and go-live with you.',
  },
  {
    name: 'legacy',
    type: 'text',
    fieldOptions: { label: 'Legacy migration' },
    // Deliberately outside the registry: exercises StarterIcon's fail-soft contract.
    iconName: 'doesNotExist',
  },
];

/** Explicit single-select: click-to-pick cards, one branch active at a time. */
export const explicitChoiceMetadata = {
  name: 'launch',
  type: 'heading',
  fieldOptions: { label: 'Launch approach' },
  description: 'How do you want to go live?',
  explicitChoiceSelection: true,
  choiceShowChoiceSelect: true,
  choice: launchBranches,
};

/** Explicit, repeatable: one Add button per branch, each capped independently via maxOccursTotal. */
export const explicitChoiceArrayMetadata = {
  name: 'channels',
  type: 'heading',
  fieldOptions: { label: 'Notification channels' },
  description: 'Add one or more ways to reach the team.',
  maxOccurs: 3,
  explicitChoiceSelection: true,
  choiceShowChoiceSelect: true,
  choice: [
    { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
    { name: 'sms', type: 'text', fieldOptions: { label: 'SMS' } },
    { name: 'webhook', type: 'text', fieldOptions: { label: 'Webhook' }, maxOccursTotal: 1 },
  ],
};
