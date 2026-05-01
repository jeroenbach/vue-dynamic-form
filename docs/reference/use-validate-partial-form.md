# useValidatePartialForm

`validateSection` validates only the fields that live under a specific path — without touching the rest of the form. It is returned directly from `useDynamicForm()`:

```ts
const { validateSection } = useDynamicForm<MyValues>();
```

The primary use case is wizard-style forms where each step should be validated before the user can advance, without triggering errors on fields the user has not seen yet.

## API

### `validateSection(sectionPath: string)`

Validates all registered fields whose path equals or starts with `sectionPath`.

```ts
const result = await validateSection('company');

if (!result.valid) {
  // show errors, block navigation
}
```

**Returns** `Promise<FormValidationResult<GenericObject>>` — the same shape as vee-validate's `validate()`:

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | `true` when every matched field passes validation |
| `errors` | `Record<string, string>` | Field path → first error message for each failing field |
| `results` | `Record<string, ValidationResult>` | Field path → full validation result for each matched field |
| `source` | `'fields'` | Always `'fields'` |

If no fields match `sectionPath`, the result is `{ valid: true, errors: {}, results: {}, source: 'fields' }`.

## Path matching

| `sectionPath` | What gets validated |
|---------------|---------------------|
| `'company'` | `company.name`, `company.address.street`, `company[0]`, … |
| `'company.address'` | `company.address.street`, `company.address.city`, … |
| `'contacts[0]'` | `contacts[0].name`, `contacts[0].email`, … |
| `'company.name'` | Only `company.name` (exact leaf match) |

## How it works

vee-validate maintains an internal registry of every active field in the form. `validateSection` reads that registry, filters to the paths that equal or start with `sectionPath`, then runs `validateField` on each match in parallel.

This means:
- You do not need to list which fields a section contains — the registry is the source of truth.
- Fields that are hidden or removed by `computedProps` are not in the registry and are not validated.

## Wizard example

```ts
const { validate, validateSection } = useDynamicForm<MyValues>();

// Records each wizard page's path the first time its computedProps run.
const wizardPagePaths: Record<number, string> = {};

function registerWizardPagePath(field: ComputedPropsFieldType<any, any>) {
  if (!field.parent?.children?.length) return;
  const index = field.parent.children.findIndex(x => x.name === field.name);
  if (index !== -1)
    wizardPagePaths[index] = field.path;
}

async function validatePage(pageIndex: number, resolve: LoadingResolve) {
  const result = await validateSection(wizardPagePaths[pageIndex] ?? '');
  resolve(result.valid);
}
```

Attach `registerWizardPagePath` to each wizard page via `computedProps`:

```ts
const metadata: Metadata[] = [
  {
    name: 'wizard',
    type: 'wizard',
    validatePage,
    submitForm: async (resolve) => {
      const result = await validate();
      resolve(result.valid);
    },
    children: [
      {
        name: 'company',
        type: 'wizardPage',
        computedProps: [registerWizardPagePath],
        children: [
          { name: 'companyName', fieldOptions: { label: 'Company name' } },
        ],
      },
      {
        name: 'contacts',
        type: 'wizardPage',
        computedProps: [registerWizardPagePath],
        children: [
          { name: 'fullName', fieldOptions: { label: 'Full name' } },
        ],
      },
    ],
  },
];
```

Each page's `computedProps` callback fires when the component renders, which populates `wizardPagePaths` automatically — no hardcoded path strings required.
