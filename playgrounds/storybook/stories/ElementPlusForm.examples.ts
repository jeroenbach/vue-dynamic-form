export interface ElementPlusExample {
  exampleId: string
  title: string
  description: string
  metadata: Record<string, any>[]
  initialValues?: Record<string, any>
  /** Render through the bare template instead of the wrapper that carries the overrides. */
  bare?: boolean
  /** The wizard brings its own submit button. */
  hideSubmit?: boolean
}

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Dutch', value: 'nl' },
  { label: 'French', value: 'fr' },
];

const planOptions = [
  { label: 'Starter', value: 'starter' },
  { label: 'Team', value: 'team' },
  { label: 'Enterprise', value: 'enterprise' },
];

const plainMetadata = [
  {
    name: 'profile',
    type: 'heading',
    label: 'Profile',
    children: [
      { name: 'firstName', label: 'First name', placeholder: 'Enter your first name' },
      { name: 'lastName', label: 'Last name', placeholder: 'Enter your last name' },
      { name: 'email', label: 'Email', placeholder: 'Enter your email' },
      { name: 'age', type: 'number', label: 'Age', min: 18, max: 120 },
    ],
  },
  {
    name: 'preferences',
    type: 'heading',
    label: 'Preferences',
    children: [
      { name: 'theme', type: 'select', label: 'Theme', options: themeOptions },
      { name: 'language', type: 'radio', label: 'Language', options: languageOptions },
      { name: 'notifications', type: 'checkbox', label: 'Enable notifications', minOccurs: 0 },
      { name: 'newsletter', type: 'switch', label: 'Subscribe to the newsletter', minOccurs: 0 },
    ],
  },
  {
    name: 'details',
    type: 'heading',
    label: 'Details',
    children: [
      { name: 'birthDate', type: 'date', label: 'Birth date', placeholder: 'Select your birth date', minOccurs: 0 },
      { name: 'rating', type: 'rate', label: 'Rate our service', max: 5, minOccurs: 0 },
      { name: 'satisfaction', type: 'slider', label: 'Satisfaction level', min: 0, max: 100, slider: { showStops: true }, minOccurs: 0 },
    ],
  },
];

export const plainExample: ElementPlusExample = {
  exampleId: 'plain',
  title: 'Plain form',
  description: 'Groups and leaf fields, rendered by the built-in Element Plus template with no overrides. Leave a required field empty and submit to see the errors.',
  metadata: plainMetadata,
  initialValues: { profile: { firstName: 'Ada' } },
  bare: true,
};

export const arrayExample: ElementPlusExample = {
  exampleId: 'array',
  title: 'Repeatable fields',
  description: 'A repeatable text field (1 to 4 entries) and a repeatable group (1 to 3 entries). The add button disables at the maximum and remove stops at the minimum.',
  metadata: [
    {
      name: 'team',
      type: 'heading',
      label: 'Team',
      children: [
        { name: 'phoneNumbers', label: 'Phone numbers', minOccurs: 1, maxOccurs: 4 },
        {
          name: 'members',
          type: 'group',
          label: 'Members',
          minOccurs: 1,
          maxOccurs: 3,
          children: [
            { name: 'name', label: 'Name' },
            { name: 'role', type: 'select', label: 'Role', options: [{ label: 'Developer', value: 'developer' }, { label: 'Designer', value: 'designer' }] },
          ],
        },
      ],
    },
  ],
  initialValues: { team: { phoneNumbers: ['020 123 4567'], members: [{ name: 'Ada', role: 'developer' }] } },
  bare: true,
};

const contactBranches = [
  { name: 'email', type: 'group', label: 'Email', children: [{ name: 'address', label: 'Email address' }] },
  {
    name: 'phone',
    type: 'group',
    label: 'Phone',
    children: [
      { name: 'number', label: 'Phone number' },
      { name: 'allowSms', type: 'checkbox', label: 'Allow SMS', minOccurs: 0 },
    ],
  },
];

export const automaticChoiceExample: ElementPlusExample = {
  exampleId: 'choiceAutomatic',
  title: 'Choice, automatic selection',
  description: 'The branch follows the value: fill in one branch and the other clears. Exactly one branch is required.',
  metadata: [
    {
      name: 'automaticSection',
      type: 'heading',
      label: 'Contact',
      children: [
        { name: 'contact', label: 'Contact method', choice: contactBranches },
      ],
    },
  ],
  bare: true,
};

export const explicitChoiceExample: ElementPlusExample = {
  exampleId: 'choiceExplicit',
  title: 'Choice, explicit selection',
  description: 'Nothing renders until a branch is chosen. Switching branches clears the previous one.',
  metadata: [
    {
      name: 'explicitSection',
      type: 'heading',
      label: 'Contact',
      children: [
        { name: 'contact', label: 'Contact method', explicitChoiceSelection: true, choice: contactBranches },
      ],
    },
  ],
  bare: true,
};

export const repeatableChoiceExample: ElementPlusExample = {
  exampleId: 'choiceRepeatable',
  title: 'Choice, repeatable',
  description: 'Up to 5 occurrences in any mix. Each kind is also capped at 3, so its add button disables independently.',
  metadata: [
    {
      name: 'integrationsSection',
      type: 'heading',
      label: 'Integrations',
      children: [
        {
          name: 'integrations',
          label: 'Integrations',
          maxOccurs: 5,
          explicitChoiceSelection: true,
          choice: [
            {
              name: 'crmExport',
              label: 'CRM export',
              maxOccurs: 1,
              maxOccursTotal: 3,
              children: [
                { name: 'crmSystem', label: 'CRM system' },
                { name: 'exportSchedule', label: 'Export schedule' },
              ],
            },
            {
              name: 'apiEndpoint',
              label: 'API endpoint',
              maxOccurs: 1,
              maxOccursTotal: 3,
              children: [
                { name: 'url', label: 'Endpoint URL' },
                { name: 'apiKey', label: 'API key' },
              ],
            },
          ],
        },
      ],
    },
  ],
  initialValues: {
    integrationsSection: {
      integrations: {
        crmExport: [{ crmSystem: 'Salesforce', exportSchedule: 'Nightly' }],
        apiEndpoint: [{ url: 'https://api.example.com/orders', apiKey: 'key-1234' }],
      },
    },
  },
  bare: true,
};

export const wizardExample: ElementPlusExample = {
  exampleId: 'wizard',
  title: 'Wizard',
  description: 'Each page validates before Next moves on. Previous keeps the values, and Submit replaces Next on the last page.',
  metadata: [
    {
      name: 'onboarding',
      wizard: true,
      label: 'Onboarding',
      children: [
        {
          name: 'company',
          type: 'heading',
          label: 'Company',
          children: [
            { name: 'companyName', label: 'Company name' },
            { name: 'website', label: 'Website', minOccurs: 0 },
          ],
        },
        {
          name: 'plan',
          type: 'heading',
          label: 'Plan',
          children: [
            { name: 'planName', type: 'select', label: 'Plan', options: planOptions },
            { name: 'seats', type: 'number', label: 'Seats', min: 1, minOccurs: 0 },
          ],
        },
        {
          name: 'review',
          type: 'heading',
          label: 'Review',
          children: [
            { name: 'termsAccepted', type: 'checkbox', label: 'I accept the terms' },
          ],
        },
      ],
    },
  ],
  hideSubmit: true,
  bare: true,
};

export const overrideAndExtensionExample: ElementPlusExample = {
  exampleId: 'overrideAndExtension',
  title: 'Override and extension',
  description: 'The wrapper overrides the date-input slot (a native date input replaces the date picker) and the default slot (a plain form item chrome), and adds a richText field type with extendMetadata. Every other field keeps its built-in Element Plus rendering.',
  metadata: [
    {
      name: 'article',
      type: 'heading',
      label: 'Article',
      children: [
        { name: 'title', label: 'Title' },
        { name: 'theme', type: 'select', label: 'Theme', options: themeOptions },
        { name: 'publishDate', type: 'date', label: 'Publish date', minOccurs: 0 },
        { name: 'expiryDate', type: 'date', label: 'Expiry date', minOccurs: 0 },
        { name: 'body', type: 'richText', label: 'Body', rows: 3, minOccurs: 0 },
      ],
    },
  ],
  initialValues: {
    article: {
      title: 'Hello world',
      publishDate: '2024-05-17',
      body: 'A first paragraph.',
    },
  },
};

export const bareComparisonExample: ElementPlusExample = {
  ...overrideAndExtensionExample,
  exampleId: 'bareComparison',
  title: 'Same form, bare template',
  description: 'The same metadata rendered without the wrapper. The richText field has no built-in type, so it falls back to the default text input.',
  bare: true,
};
