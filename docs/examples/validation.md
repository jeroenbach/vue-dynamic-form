# Validation

A focused showcase of every validation strategy the library supports — declarative restrictions, custom validation functions, async server-side checks, and reactive cross-field rules — all in a single form.

## What It Demonstrates

- `restriction` properties (minLength, maxLength, pattern, whiteSpace, fractionDigits, minExclusive, …) that need zero validation code
- A custom `validation` function for password complexity with a real-time strength bar
- An `async` validation function that simulates a server-side uniqueness check
- Cross-field validation — the rule re-runs automatically when the referenced field changes using `computedProps`
- A custom `password` field type with a show/hide toggle and animated strength indicator

## Example

<FormExampleValidation />

## Restrictions — No Code Required

Restrictions are declared inline on the field and automatically converted to vee-validate rules by the library. No `validation` function is needed.

The `username` field combines three restrictions at once — length bounds and a character-set pattern:

<<< @/.vitepress/theme/components/FormExampleValidation.vue#restriction-example{ts} [FormExampleValidation.vue]

Other restriction flavours used in this example:

| Field | Restriction | What it enforces |
|---|---|---|
| `displayName` | `whiteSpace: 'collapse'` | Rejects leading/trailing spaces and double spaces |
| `bio` | `maxLength: 200` | Hard character cap |
| `startDate` / `endDate` | `pattern: '^\\d{4}-\\d{2}-\\d{2}$'` | YYYY-MM-DD format |
| `amount` | `minExclusive: 0`, `maxInclusive: 10000`, `fractionDigits: 2` | Positive monetary value, max 2 decimals |
| `promoCode` | `pattern: '^[A-Z0-9]{4,8}$'` | 4–8 uppercase alphanumeric chars |

## Async Validation

The `validation` property accepts a function that returns a `Promise`. vee-validate handles the pending state automatically — the field stays invalid while the promise is in flight.

The email field first checks the format via a `restriction`, then calls the async function to simulate a round-trip to the server. Try entering `admin@example.com` to see the taken-email error.

<<< @/.vitepress/theme/components/FormExampleValidation.vue#async-validation{ts} [FormExampleValidation.vue]

::: tip
You can combine `restriction` and `validation` on the same field. The restriction runs first; the async function only fires if the value already passes it.
:::

## Password Complexity + Strength Bar

The `validation` function on the password field checks five criteria and lists any that are still missing:

<<< @/.vitepress/theme/components/FormExampleValidation.vue#password-validation{ts} [FormExampleValidation.vue]

The animated strength bar (`PasswordStrengthBar.vue`) is rendered directly inside the custom `#password-input` slot in `AdvancedFormTemplate`. It reads the same `value.value` ref that vee-validate tracks, so the bar updates on every keystroke without any extra wiring.

The new `password` field type was added to the template by:
1. Registering `password: string` in `defineMetadata`
2. Adding a `showStrengthBar?: boolean` extended property
3. Dropping in a `#password-input` slot that renders `PasswordInput` (with the eye toggle) followed by `PasswordStrengthBar`

## Cross-field Validation

Each field's `validation` function is a plain closure that reads a reactive ref at the moment it runs. The validation for `confirmPassword` and `endDate` both do exactly that:

**Confirm password** — reads `passwordValue.value` at validation time:

<<< @/.vitepress/theme/components/FormExampleValidation.vue#cross-field-password{ts} [FormExampleValidation.vue]

**End date** — reads `startDateValue.value` at validation time. YYYY-MM-DD strings compare correctly as plain strings, so no date parsing is needed:

<<< @/.vitepress/theme/components/FormExampleValidation.vue#cross-field-date{ts} [FormExampleValidation.vue]

### Re-triggering when the source field changes

A `validation` function only runs when its own field is validated (on blur, input, or submit). Both fields above use `computedProps` to re-trigger `validateField` whenever the source field changes.

`computedProps` callbacks run inside a Vue `computed`, which means any reactive ref read inside them is tracked automatically. When `passwordValue` (or `startDateValue`) changes, the computed re-runs and — if both fields already have a value — calls `validateField` on the dependent field. The two concerns stay cleanly separated: the logic lives in `validation`, and the re-trigger lives in `computedProps`.

## Website Validation

A plain synchronous function validates the URL format. Using the browser's built-in `URL` constructor keeps the code short and handles edge cases correctly:

<<< @/.vitepress/theme/components/FormExampleValidation.vue#website-validation{ts} [FormExampleValidation.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleValidation.vue#metadata{ts} [FormExampleValidation.vue]

## Related Source

- [FormExampleValidation.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleValidation.vue)
- [PasswordStrengthBar.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/PasswordStrengthBar.vue)
- [PasswordInput.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/PasswordInput.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
