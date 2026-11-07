import type { StarterDynamicFormSettings as StarterSettings, StarterMetadata } from '@bach.software/vue-dynamic-form-starter';

export interface StarterFormExample {
  exampleId: string
  title: string
  description: string
  metadata: StarterMetadata[]
  /** Each example has its own value shape, so only the object form is pinned down. */
  initialValues?: Record<string, unknown>
  /** Render through the bare template instead of the wrapper that carries the icon override. */
  bare?: boolean
  /** The wizard brings its own submit button. */
  hideSubmit?: boolean
  /** Forwarded to `DynamicForm`'s `settings` prop. */
  settings?: StarterSettings
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
          array: {
            itemName: 'contact',
            itemNamePlural: 'contacts',
            itemFieldForTitle: 'name',
          },
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
          array: {
            itemName: 'vendor',
            itemNamePlural: 'vendors',
            itemFieldForTitle: 'name',
          },
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

const contactBranches: StarterMetadata[] = [
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
      choicePicker: { show: true },
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
      choicePicker: { show: true },
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
              wizardSummary: {
                groups: [
                  { title: 'Company', rows: [['Company name', 'Acme Industries'], ['Website', '']] },
                  { title: 'Plan', rows: [['Plan', 'Team']] },
                ],
                confirmation: 'We will email you within one business day.',
              },
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
        { name: 'password', type: 'password', fieldOptions: { label: 'Password' }, password: { showStrengthBar: true } },
      ],
    },
    {
      name: 'launch',
      type: 'heading',
      fieldOptions: { label: 'Launch approach' },
      explicitChoiceSelection: true,
      choicePicker: { show: true },
      choice: [
        { name: 'selfServe', type: 'text', fieldOptions: { label: 'Self-serve rollout' }, iconName: 'rocket' },
        { name: 'guided', type: 'text', fieldOptions: { label: 'Guided rollout' }, iconName: 'users' },
      ],
    },
  ],
  initialValues: { account: { password: 'Passw0rd!99' } },
  bare: false,
};

export const gridLayoutExample: StarterFormExample = {
  exampleId: 'gridLayout',
  title: 'Grid layout',
  description: 'The bare "grid" field type lays its children out in a responsive CSS grid with no card chrome. "columns" sets its own grid width per breakpoint, "colSpan" and "colStart" place a child inside that grid, and "full" spans the whole row.',
  metadata: [
    {
      name: 'availability',
      type: 'grid',
      fieldOptions: { label: 'Weekly availability' },
      columns: { base: 2, md: 4 },
      children: [
        { name: 'monday', type: 'checkbox', fieldOptions: { label: 'Mon' }, minOccurs: 0 },
        { name: 'tuesday', type: 'checkbox', fieldOptions: { label: 'Tue' }, minOccurs: 0 },
        { name: 'wednesday', type: 'checkbox', fieldOptions: { label: 'Wed' }, minOccurs: 0 },
        { name: 'thursday', type: 'checkbox', fieldOptions: { label: 'Thu' }, minOccurs: 0 },
        { name: 'manager', fieldOptions: { label: 'Approving manager' }, colStart: 3, minOccurs: 0 },
        { name: 'notes', fieldOptions: { label: 'Notes' }, colSpan: 'full', minOccurs: 0 },
      ],
    },
  ],
  bare: true,
};

export const settingsExample: StarterFormExample = {
  exampleId: 'settings',
  title: 'Settings and field states',
  description: 'DynamicForm settings tag optional fields instead of required ones (showRequiredOrOptional, optionalText) and mark a touched, valid field with a success border (showValidState). Below them: a disabled field, a field with a suffix, and a field with a dependentOnMessage that replaces its input entirely until a prerequisite is met.',
  metadata: [
    {
      name: 'account',
      type: 'heading',
      fieldOptions: { label: 'Account' },
      children: [
        { name: 'firstName', fieldOptions: { label: 'First name' }, placeholder: 'Jordan' },
        { name: 'middleName', fieldOptions: { label: 'Middle name' }, minOccurs: 0 },
        { name: 'accountId', fieldOptions: { label: 'Account ID' }, disabled: true },
        { name: 'monthlyBudget', fieldOptions: { label: 'Monthly budget' }, suffix: 'USD', minOccurs: 0 },
        { name: 'referralCode', fieldOptions: { label: 'Referral code' }, minOccurs: 0, dependentOnMessage: 'Unlocks once your email address is verified.' },
      ],
    },
  ],
  initialValues: { account: { accountId: 'ACC-10293' } },
  settings: {
    showRequiredOrOptional: 'optional',
    optionalText: 'Not required',
    showValidState: true,
  },
  bare: true,
};

export const textModesExample: StarterFormExample = {
  exampleId: 'textModes',
  title: 'HTML5 text-mode field types',
  description: 'The number, email, tel, url, date, time, and datetime-local types, rendered through the existing text-input chrome with no extendMetadata step. Age shows the native spinner from number.min/max/step (prototype.html#text-modes).',
  metadata: [
    {
      name: 'contact',
      type: 'heading',
      fieldOptions: { label: 'Contact details' },
      children: [
        { name: 'age', type: 'number', fieldOptions: { label: 'Age' }, number: { min: 0, max: 120, step: 1 } },
        { name: 'email', type: 'email', fieldOptions: { label: 'Email' }, restriction: { pattern: '^[^@]+@[^@]+\\.[^@]+$' } },
        { name: 'phone', type: 'tel', fieldOptions: { label: 'Phone' }, minOccurs: 0 },
        { name: 'website', type: 'url', fieldOptions: { label: 'Website' }, minOccurs: 0 },
        { name: 'birthDate', type: 'date', fieldOptions: { label: 'Birth date' }, minOccurs: 0 },
        { name: 'preferredTime', type: 'time', fieldOptions: { label: 'Preferred callback time' }, minOccurs: 0 },
        { name: 'meeting', type: 'datetime-local', fieldOptions: { label: 'Meeting' }, minOccurs: 0 },
      ],
    },
  ],
  bare: true,
};

export const textareaExample: StarterFormExample = {
  exampleId: 'textarea',
  title: 'Textarea field type',
  description: 'The textarea type, rendered through the new textarea-input slot (prototype.html#textarea). An empty required field, a pre-filled one, and a disabled one, side by side. Click Submit to see the empty field\'s error state.',
  metadata: [
    {
      name: 'application',
      type: 'heading',
      fieldOptions: { label: 'Application' },
      children: [
        { name: 'bio', type: 'textarea', fieldOptions: { label: 'Bio' }, placeholder: 'Share a few sentences on why this role is a fit.', restriction: { minLength: 50 } },
        {
          name: 'coverLetter',
          type: 'textarea',
          fieldOptions: { label: 'Cover letter' },
          minOccurs: 0,
        },
        { name: 'internalNotes', type: 'textarea', fieldOptions: { label: 'Internal notes' }, disabled: true, minOccurs: 0 },
      ],
    },
  ],
  initialValues: {
    application: {
      coverLetter: 'I have led three design-system rebuilds and care about accessible, themeable form UI.',
      internalNotes: 'Submitted applications cannot be edited.',
    },
  },
  bare: true,
};

export const radioExample: StarterFormExample = {
  exampleId: 'radio',
  title: 'Radio group field type',
  description: 'The radio type, rendered through the new radio-input slot (prototype.html#radio): a flat rendering of the same options property select reads, a sibling of select rather than the structural choice concept. An empty required field, a pre-selected one, and a disabled one, side by side. Click Submit to see the empty field\'s error state.',
  metadata: [
    {
      name: 'application',
      type: 'heading',
      fieldOptions: { label: 'Application' },
      children: [
        {
          name: 'howHeard',
          type: 'radio',
          fieldOptions: { label: 'How did you hear about us?' },
          options: [
            { key: 'search', value: 'A search engine' },
            { key: 'referral', value: 'A friend or colleague' },
            { key: 'social', value: 'Social media' },
          ],
        },
        {
          name: 'preferredContact',
          type: 'radio',
          fieldOptions: { label: 'Preferred contact method' },
          options: [
            { key: 'email', value: 'Email' },
            { key: 'phone', value: 'Phone' },
          ],
          minOccurs: 0,
        },
        {
          name: 'accountTier',
          type: 'radio',
          fieldOptions: { label: 'Account tier' },
          options: [
            { key: 'free', value: 'Free' },
            { key: 'pro', value: 'Pro' },
          ],
          disabled: true,
          minOccurs: 0,
        },
      ],
    },
  ],
  initialValues: {
    application: {
      preferredContact: 'email',
      accountTier: 'pro',
    },
  },
  bare: true,
};

export const fileExample: StarterFormExample = {
  exampleId: 'file',
  title: 'File input field type',
  description: 'The file type, rendered through the new file-input slot (prototype.html#file): the one uncontrolled control in the package. An empty required field, one already holding a file, and a disabled one, side by side. Click Submit to see the empty field\'s error state.',
  metadata: [
    {
      name: 'application',
      type: 'heading',
      fieldOptions: { label: 'Application' },
      children: [
        { name: 'resume', type: 'file', fieldOptions: { label: 'Resume' }, description: 'PDF or Word document, up to 5 MB.', file: { accept: '.pdf,.doc,.docx' } },
        { name: 'portfolio', type: 'file', fieldOptions: { label: 'Portfolio' }, description: 'Optional, any file type.', minOccurs: 0 },
        { name: 'referenceLetter', type: 'file', fieldOptions: { label: 'Reference letter' }, disabled: true, minOccurs: 0 },
      ],
    },
  ],
  initialValues: {
    application: {
      portfolio: new File(['placeholder content'], 'jeroen-bach-portfolio.pdf', { type: 'application/pdf' }),
    },
  },
  bare: true,
};

export const localizationExample: StarterFormExample = {
  exampleId: 'localization',
  title: 'Overridable and translatable texts',
  description: 'Every built-in label on repeatable chrome, explicit-choice add buttons, and the password strength bar is a field property, overridden here with Dutch text instead of the English defaults.',
  metadata: [
    {
      name: 'team',
      type: 'heading',
      fieldOptions: { label: 'Team' },
      children: [
        {
          name: 'contacts',
          type: 'heading',
          fieldOptions: { label: 'Contactpersonen' },
          maxOccurs: 3,
          minOccurs: 0,
          autoAddMinOccurs: false,
          array: {
            itemName: 'contactpersoon',
            itemNamePlural: 'contactpersonen',
            itemFieldForTitle: 'name',
            noItemsTitle: 'Nog geen contactpersonen toegevoegd',
            addFirstButtonText: 'Voeg een contactpersoon toe',
            addButtonText: 'Nog een contactpersoon toevoegen',
            removeButtonText: 'Verwijderen',
            removeAriaLabel: 'Verwijder contactpersoon {number}',
            newItemTitle: 'Nieuwe contactpersoon',
          },
          children: [
            { name: 'name', fieldOptions: { label: 'Naam' } },
          ],
        },
        {
          name: 'reachBy',
          type: 'heading',
          fieldOptions: { label: 'Bereikbaarheid' },
          description: 'Voeg een of meer manieren toe om het team te bereiken.',
          maxOccurs: 3,
          explicitChoiceSelection: true,
          choicePicker: {
            show: true,
            addButtonText: 'Voeg {option} toe',
            limitReachedText: 'De limiet voor {option} is bereikt.',
          },
          choice: [
            { name: 'email', type: 'text', fieldOptions: { label: 'E-mail' }, iconName: 'building2' },
            { name: 'webhook', type: 'text', fieldOptions: { label: 'Webhook' }, maxOccursTotal: 1, iconName: 'zap' },
          ],
        },
        {
          name: 'password',
          type: 'password',
          fieldOptions: { label: 'Wachtwoord' },
          password: {
            showStrengthBar: true,
            strengthLabels: { weak: 'Zwak', fair: 'Redelijk', good: 'Goed', strong: 'Sterk' },
            showAriaLabel: 'Wachtwoord tonen',
            hideAriaLabel: 'Wachtwoord verbergen',
          },
        },
      ],
    },
  ],
  bare: true,
};
