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

## Wizard forms

Multi-step forms no longer need to call `validateSection` by hand. Marking a node `wizard: true` (or `wizard: { allowForwardJump?, validateOnJump? }`) makes it a first-class shape rendered through `DynamicFormItemWizard`, which calls `validateSection` internally to gate `next()`/`gotoStep()` against the current page's own path — read straight from the corrected metadata tree, never re-derived or hand-tracked. See [`wizard`](/reference/field-metadata#wizard) on `FieldMetadata` and the `-wizard` / `-wizard-page` slot families in [DynamicFormTemplate](/reference/dynamic-form-template#wizard-container-and-page-slots).

`validateSection` itself stays public API for the cases a wizard does not cover: validating an arbitrary section on demand outside step navigation, for example a "save draft" action that only needs one sub-form to be valid before persisting:

```ts
const { validateSection } = useDynamicForm<MyValues>();

async function saveDraft() {
  const result = await validateSection('company');
  if (!result.valid)
    return; // show errors, keep editing
  // persist the draft
}
```
