export interface StarterFormExample {
  exampleId: string
  title: string
  description: string
  metadata: Record<string, any>[]
  initialValues?: Record<string, any>
  /** Render through the bare template instead of the wrapper that carries the icon override. */
  bare?: boolean
  /** The wizard brings its own submit button. */
  hideSubmit?: boolean
}

const planOptions = [
  { key: 'starter', value: 'Starter' },
  { key: 'team', value: 'Team' },
  { key: 'enterprise', value: 'Enterprise' },
];

export const plainExample: StarterFormExample = {
  exampleId: 'plain',
  title: 'Plain field, select, switch, and group',
  description: 'A plain text field (prototype.html#text-field), a select field (prototype.html#select-field), a switch field (prototype.html#switch-field), all inside a group (prototype.html#group), rendered by the bare starter template with no overrides.',
  metadata: [
    {
      name: 'profile',
      type: 'heading',
      fieldOptions: { label: 'Profile' },
      description: 'Groups every field below into one labelled section.',
      children: [
        { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' }, placeholder: 'Enter your first name' },
        { name: 'plan', type: 'select', fieldOptions: { label: 'Plan' }, options: planOptions },
        { name: 'newsletter', type: 'checkbox', fieldOptions: { label: 'Subscribe to the newsletter' }, minOccurs: 0 },
      ],
    },
  ],
  initialValues: { profile: { firstName: 'Ada', plan: 'team' } },
  bare: true,
};

export const arrayExample: StarterFormExample = {
  exampleId: 'array',
  title: 'Repeatable fields',
  description: 'An inline repeatable field with no empty-state card, a repeatable group starting empty (prototype.html#array-empty), and a repeatable group starting with an item (prototype.html#array-filled). Remove the vendor below its minimum to see the section-level error.',
  metadata: [
    {
      name: 'team',
      type: 'heading',
      fieldOptions: { label: 'Team' },
      children: [
        { name: 'phoneNumbers', type: 'text', fieldOptions: { label: 'Phone numbers' }, maxOccurs: 4, minOccurs: 0 },
        {
          name: 'contacts',
          type: 'heading',
          fieldOptions: { label: 'Contacts' },
          maxOccurs: 3,
          minOccurs: 0,
          // Without this, the engine keeps at least one placeholder item; this array demonstrates the genuine empty state instead.
          autoAddMinOccurs: false,
          arrayItemName: 'contact',
          arrayItemNamePlural: 'contacts',
          arrayItemFieldForTitle: 'name',
          children: [
            { name: 'name', type: 'text', fieldOptions: { label: 'Name' } },
            { name: 'role', type: 'select', fieldOptions: { label: 'Role' }, options: [{ key: 'developer', value: 'Developer' }, { key: 'designer', value: 'Designer' }] },
          ],
        },
        {
          name: 'vendors',
          type: 'heading',
          fieldOptions: { label: 'Vendors' },
          maxOccurs: 3,
          minOccurs: 1,
          arrayItemName: 'vendor',
          arrayItemNamePlural: 'vendors',
          arrayItemFieldForTitle: 'name',
          children: [
            { name: 'name', type: 'text', fieldOptions: { label: 'Name' } },
          ],
        },
      ],
    },
  ],
  initialValues: { team: { phoneNumbers: ['020 123 4567'], vendors: [{ name: 'Acme Supplies' }] } },
  bare: true,
};

const contactBranches = [
  { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
  { name: 'phone', type: 'text', fieldOptions: { label: 'Phone number' } },
];

export const choiceAutomaticExample: StarterFormExample = {
  exampleId: 'choiceAutomatic',
  title: 'Choice, automatic selection',
  description: 'The branch follows the value: fill in one branch and the other clears (prototype.html#choice-auto).',
  metadata: [
    {
      name: 'payment',
      type: 'text',
      fieldOptions: { label: 'Payment method' },
      description: 'Fields switch automatically with the selected method.',
      choice: contactBranches,
    },
  ],
  initialValues: { payment: { email: 'jordan.fay@acme.example' } },
  bare: true,
};

export const choiceExplicitExample: StarterFormExample = {
  exampleId: 'choiceExplicit',
  title: 'Choice, explicit selection (icon cards)',
  description: 'Click-to-pick icon cards, one branch active at a time (prototype.html#choice-explicit).',
  metadata: [
    {
      name: 'launch',
      type: 'heading',
      fieldOptions: { label: 'Launch approach' },
      description: 'How do you want to go live?',
      explicitChoiceSelection: true,
      choiceShowChoiceSelect: true,
      choice: [
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
          description: 'A specialist plans kickoff, training, and go-live with you.',
          iconName: 'users',
        },
      ],
    },
  ],
  bare: true,
};

export const choiceArrayExample: StarterFormExample = {
  exampleId: 'choiceArray',
  title: 'Choice, repeatable branches',
  description: 'Up to 3 occurrences in any mix, each kind capped independently so its add button disables on its own (prototype.html#choice-array).',
  metadata: [
    {
      name: 'integrations',
      type: 'heading',
      fieldOptions: { label: 'Integrations' },
      description: 'Add one or more ways to reach the team.',
      maxOccurs: 3,
      explicitChoiceSelection: true,
      choiceShowChoiceSelect: true,
      choice: [
        { name: 'email', type: 'text', fieldOptions: { label: 'Email' }, iconName: 'building2' },
        { name: 'webhook', type: 'text', fieldOptions: { label: 'Webhook' }, maxOccursTotal: 1, iconName: 'zap' },
      ],
    },
  ],
  bare: true,
};

export const wizardExample: StarterFormExample = {
  exampleId: 'wizard',
  title: 'Wizard with review step',
  description: 'Each page validates before Next moves on (prototype.html#wizard). The final page reviews every answer and asks for confirmation (prototype.html#review).',
  metadata: [
    {
      name: 'onboarding',
      wizard: true,
      fieldOptions: { label: 'Client onboarding' },
      description: 'Launch approach',
      children: [
        {
          name: 'company',
          type: 'heading',
          fieldOptions: { label: 'Company' },
          children: [
            { name: 'companyName', type: 'text', fieldOptions: { label: 'Company name' } },
            { name: 'website', type: 'text', fieldOptions: { label: 'Website' }, minOccurs: 0 },
          ],
        },
        {
          name: 'plan',
          type: 'heading',
          fieldOptions: { label: 'Plan' },
          children: [
            { name: 'planName', type: 'select', fieldOptions: { label: 'Plan' }, options: planOptions },
          ],
        },
        {
          name: 'review',
          type: 'heading',
          fieldOptions: { label: 'Review' },
          children: [
            {
              name: 'summary',
              type: 'wizardSummaryPage',
              fieldOptions: { label: 'Review and submit' },
              wizardSummary: [
                { title: 'Company', rows: [['Company name', 'Acme Industries'], ['Website', '']] },
                { title: 'Plan', rows: [['Plan', 'Team']] },
              ],
              wizardSummaryConfirmation: 'We will email you within one business day.',
            },
          ],
        },
      ],
    },
  ],
  hideSubmit: true,
  bare: true,
};

export const iconOverrideExample: StarterFormExample = {
  exampleId: 'iconOverride',
  title: 'Icon override',
  description: 'The wrapper-component pattern supplies the #icon slot, swapping every Lucide glyph for a solid square, at the password show/hide toggle and the choice-card icon alike (prototype.html#icons).',
  metadata: [
    {
      name: 'account',
      type: 'heading',
      fieldOptions: { label: 'Account' },
      children: [
        { name: 'password', type: 'password', fieldOptions: { label: 'Password' }, showStrengthBar: true },
      ],
    },
    {
      name: 'launch',
      type: 'heading',
      fieldOptions: { label: 'Launch approach' },
      explicitChoiceSelection: true,
      choiceShowChoiceSelect: true,
      choice: [
        { name: 'selfServe', type: 'text', fieldOptions: { label: 'Self-serve rollout' }, iconName: 'rocket' },
        { name: 'guided', type: 'text', fieldOptions: { label: 'Guided rollout' }, iconName: 'users' },
      ],
    },
  ],
  initialValues: { account: { password: 'Passw0rd!99' } },
  bare: false,
};
