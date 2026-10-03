---
id: ST-07
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Wizards render as Element Plus steps with validated navigation

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- Button text → plain English strings, no labels mechanism (reversible: additive follow-up)


## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Submit contract → `ElButton nativeType="submit"` inside the consumer's own native `<form>`; inert without one, by design (consumer-owned submit)
- Wizard's own validation message → rendered by the built-in container, like the array section's error
- Disabled wizard → Previous, Next, Submit and step clicks honour `disabled`, like every built-in control

## Functional
### User story
As an end user filling in a multi-step form, I want a step indicator, Previous and Next buttons that follow the wizard's rules, and a Submit button on the last step, so that I can move through the form one page at a time without losing what I entered.

As a template author, I want `default-wizard` and `default-wizard-page` (and the per-type variants) to be overridable with built-in Element Plus fallbacks, so that I can change only the wizard chrome or one page's wrapper.

### Acceptance criteria

Each criterion is verifiable by a Vitest component test (mounting inside `DynamicForm` with `wizard: true` metadata and multiple `children` pages) unless marked manual.

**Wizard container (`default-wizard`)**

1. **The indicator reflects the pages.**
   Given a wizard with three pages,
   When it renders,
   Then an `ElSteps` with `active` equal to `currentStepIndex` and three `ElStep` entries renders, the entries built from the `pages` slot prop (titles from each page's `label`, else its `name`), never from `fieldMetadata.children`.

2. **Next and Previous follow the slot actions and flags.**
   Given the wizard on its first page,
   When it renders,
   Then Previous is not rendered (`isFirst`), and clicking Next calls `next()` and, when validation of the page passes, `currentStepIndex` becomes 1; when validation fails, the index stays 0 and the page shows its validation errors.

3. **Submit on the last page.**
   Given the wizard on its last page,
   When it renders,
   Then a submit `ElButton` is shown in place of Next (`isLast`), rendering a native `<button type="submit">` set through `ElButton`'s `nativeType="submit"` prop (not `type`, which on `ElButton` is the colour variant). The wizard exposes no `submit` function and `DynamicForm` renders no `<form>`, so the button submits through the consumer's surrounding native `<form>` (submit stays consumer-owned); in bare usage with no form it is inert by design. Previous and Next render `nativeType="button"` so they never implicitly submit that form. Clicking Submit does not call `next()`.

   DECIDED (research): the Submit button is a native submit control inside the consumer's own `<form>`, and the surrounding-form requirement is documented wherever bare wizard usage is described (README and the playground example).
   Why: the approved wizard feature decides that submit stays consumer-owned (native form submit plus `handleSubmit`, the engine contributes only `isLast`, no `submit` method is added), and the docs site's own wizard renders a native `type="submit"` last-page button that the example forwards to `handleSubmit`. `ElButton`'s `nativeType` is the native button type.
   Sources: the wizard feature spec (submit stays consumer-owned, `isLast` decides the submit control), `docs/.vitepress/theme/components/FormWizard.vue` and `FormExampleWizard.vue`, element-plus.org Button API (`nativeType`)

4. **Busy state.**
   Given `isValidating` is true,
   When the wizard renders,
   Then the Next and Submit buttons show a loading or disabled state.

5. **Forward jump is gated by `wizardConfig.allowForwardJump`.**
   Given `wizardConfig.allowForwardJump` is false and then true,
   When the test clicks a later `ElStep` (click handler layered on the step, as `ElSteps` has no per-step click event),
   Then with false nothing changes; with true `gotoStep(index)` is called. Backward jumps are allowed per `wizardConfig`; the test reads `wizardConfig` from the slot scope rather than `fieldMetadata.wizard`. The template calls `gotoStep(index)` with no options for an earlier step (always), and for a later step only when `allowForwardJump` is true; when it is false the template does not call `gotoStep` for a later step. The policy decision stays in the engine.

6. **The container reaches the pages through the `input` slot chain.**
   Given the wizard,
   When it renders,
   Then the pages render inside the chrome through `<slot name="input"><slot /></slot>`, exactly as other container shapes do.

**Wizard page (`default-wizard-page`)**

7. **Pages are hidden with `v-show`, never `v-if`.**
   Given a wizard with three pages each containing a field,
   When the current page changes,
   Then the non-current pages remain mounted with `display: none` (asserted on the DOM: elements exist and are hidden), and all three pages' fields stay registered with vee-validate (a test reads the form's registered paths or values before and after navigation and sees no deregistration or cleared values).

8. **Values survive navigation.**
   Given a value typed on page 1,
   When the user goes to page 2 and back,
   Then page 1's value is unchanged and still validated.

9. **Current page visibility.**
   Given `isCurrent`,
   When a page renders,
   Then exactly the current page is visible and each page wrapper carries `data-page` equal to its zero-based `pageIndex`, for tests and styling.

**Overrides, forwards, and shapes**

10. **Overridable with built-in fallback.**
    Given a wrapper overriding only `#default-wizard-page`,
    When a wizard renders,
    Then the step indicator and buttons are the built-in ones and each page wrapper is the consumer's (which must still apply `v-show`); overriding only `#default-wizard` keeps the built-in page wrapper.

11. **Per-type variants are forwarded.**
    Given a wrapper supplying `#text-wizard` (not enumerated by the template),
    When a wizard whose field type is `text` renders,
    Then the consumer's markup renders for the container (generic forward), and other types keep the built-in wizard.

12. **A wizard nested in a choice or an array works.**
    Given a choice branch that is a wizard, and a repeated wizard,
    When they render,
    Then each wizard navigates independently (per the engine) and renders through the same fallbacks.

13. **Empty wizard.**
    Given a wizard with no children,
    When it renders,
    Then no `ElStep` renders, no Previous and no Next render, and the Submit button renders as on any last page (`isLast`; the engine makes `isFirst` and `isLast` both true for an empty wizard); clicking it submits the consumer's surrounding form if any, which for an empty wizard carries no wizard values. No error is thrown.

14. **Plain CSS only.**
    Given the new markup,
    When reviewed,
    Then chrome uses `ElSteps`/`ElStep`/`ElButton` plus scoped CSS in the package stylesheet; no Tailwind classes; the CSS story's source-scan test stays green; `ElSpace`/`ElRow`/`ElCol` are not used.

15. **Code hygiene.**
    Given all new source and test files,
    When reviewed,
    Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, and `ci:test`, `ci:lint`, `ci:typecheck` pass for `packages/element-plus`.

16. **The wizard's own validation message is shown.**
    Given a wizard node that carries its own rule and whose `fieldContext.errorMessage` is set,
    When the wizard renders,
    Then the built-in container shows that message above the navigation; with no message nothing extra renders.

    DECIDED (research): the built-in container renders the wizard node's own `errorMessage`.
    Why: the engine anchors a field context at the wizard's own path precisely so templates can show this message, and the array section in the sibling story renders its own section-level error the same way, so a wizard with its own rule would otherwise fail silently. One conditional element, no new API, a local edit to undo.
    Sources: `packages/core/src/components/DynamicFormItemWizard.vue` (the wizard's own `useField` and `fieldContext`), the array story's error criteria

17. **A disabled wizard disables its controls.**
    Given a wizard with `maxOccurs: 0` (the engine passes `disabled`),
    When it renders,
    Then Previous, Next, Submit, and step clicks are disabled or inert, and the pages render without error.

    DECIDED (research): the built-in chrome honours the `disabled` slot prop.
    Why: every built-in control in this package honours `field.disabled || disabled`, and the array story disables its add control under the same flag, so ignoring it only here would be the inconsistent choice. A local edit to undo.
    Sources: `packages/core/src/components/DynamicFormItemWizard.vue` (`disabled` passed to the container slot), existing `*-input` fallbacks in `packages/element-plus/src/ElementPlusDynamicForm.vue`

### Edge cases
- A page whose fields fail validation cannot be left forward, but can be left backward (per `wizardConfig`).
- `wizardConfig` with `allowForwardJump` true while earlier pages are invalid: the engine decides; the template only calls `gotoStep`.
- Step titles fall back to `Step N` when a page has neither `label` nor `name`.
- Wizard with one page: Previous hidden, Submit shown immediately.

### Open points
- ASSUMED (story prep): built-in button text ("Previous", "Next", "Submit") is plain English strings in this version, overridable by overriding the slot; no labels mechanism.
  Why: no clear winner. The feature spec defines no labels or i18n mechanism, the only precedent in this package is the hard-coded "Click to upload", and the core settings `messages` mechanism covers validation messages only.
  Tie broken on: smallest scope (no new setting, prop, or export).
  Alternative: a settings-driven labels mechanism. Adding it later is additive and non-breaking, so reversing costs a follow-up feature, not a breaking change.
- Resolved during review: the Submit contract (AC3), the wizard's own validation message (AC16), and the disabled wizard (AC17) are settled as recorded in those criteria.
- For the developer, not a decision: confirm the per-step click layering works on the `>=2.0.0` floor and record it in Implementation notes.

### Out of scope
- Array and choice chrome.
- Progress persistence across page reloads.
- `packages/core` is untouched; the package stays `private: true`, so no changeset.

## Design reference
No prototype. Visual reference is Element Plus `Steps` and `Button` documentation plus the structure of the docs site's hand-built wizard, rebuilt with Element Plus.

## Architecture reference
Implements seam 3: `default-wizard` and `default-wizard-page` fallbacks in `ElementPlusFormTemplate.vue` per the feature's Data flow "Wizard" section and ADR-4. Slot scope: `WizardAttributes` (`pages`, `currentStepIndex`, `pageCount`, `isFirst`, `isLast`, `isValidating`, `wizardConfig`, `next`, `prev`, `gotoStep`) for the container; `WizardPageAttributes` (`isCurrent`, `pageIndex`, plus the same navigation props) for a page. Visibility gating follows the engine contract: `v-show`, never `v-if`.

Depends on ST-02 (forwarding contract) and ST-04 (stylesheet build and export). Independent of ST-05 and ST-06.

## QA plan
Filled by qa-planner.

### Approach

Two mount styles, used together so each behaviour is pinned at the right level:

- **Slot-scope tests (isolated).** Mount `ElementPlusFormTemplate` directly with the engine's attrs (`type: 'default-wizard'` or `'default-wizard-page'`, a `fieldMetadata`, and the wizard flags as attrs), `next`/`prev`/`gotoStep` as `vi.fn()`, and a stub default slot. This makes the flags (`isFirst`, `isLast`, `isValidating`, `wizardConfig`) fully controllable and lets the test assert exact calls (`gotoStep` called with exactly `(index)`). It is the only way to reach states the engine will not produce on demand (`isValidating` true mid-flight, a page with neither `label` nor `name`, `pages` that deliberately disagree with `fieldMetadata.children`). This relies on attrs falling through `ElementPlusFormTemplate` to its inner `DynamicFormTemplate`; if ST-01/ST-02 wrap the dispatcher in another root, these tests need a `DynamicFormTemplate`-level harness instead (flag to the developer).
- **Engine tests (integrated).** Mount a host component that calls `useDynamicForm()`, renders a native `<form @submit.prevent>` and a `DynamicForm` with `template` set to `ElementPlusFormTemplate` (bare) or to a test wrapper (override cases), always `attachTo: document.body` (jsdom only fires implicit submit for connected forms). Real `wizard: true` metadata with several `children` pages. The host exposes the form's `values`, `errors`, `getPathState`, and a submit spy.

### Files

| File | Convention | Holds |
| --- | --- | --- |
| `packages/element-plus/src/__tests__/ElementPlusFormTemplate.wizard.logic.test.ts` | logic/behaviour | Indicator, buttons, forward-jump gate, `input` slot chain, overrides, per-type forward, nested shapes, empty and one-page wizards |
| `packages/element-plus/src/__tests__/ElementPlusFormTemplate.wizard.validation.test.ts` | validation | Blocked `next`, backward leave, errors surfacing on the page, busy state in flight, values and registration surviving navigation, whole-form submit reaching hidden pages |
| `packages/element-plus/src/__tests__/ElementPlusFormTemplate.wizard.analytics.test.ts` | render-count | Navigation does not re-render or remount untouched pages |
| `packages/element-plus/src/__tests__/ElementPlusFormTemplate.wizard.test-helpers.ts` | helper (not a test) | `mountWizardForm`, `mountWrapped`, page/step/button finders, the deferred-validator helper |

Follow whatever directory and naming ST-01 settles for the package's `__tests__` folder; the names above assume `src/__tests__/` next to `ElementPlusFormTemplate.vue`. The extra ST-04 source-scan test is extended, not duplicated (see AC14).

### Fixtures and utilities

Existing, reused:
- `DynamicForm`, `useDynamicForm`, `defineMetadata` from `@bach.software/vue-dynamic-form`; `ElementPlusFormTemplate` and `elementPlusMetadata` from ST-01.
- The wrapper boilerplate and any `mountWrapped`-style helper ST-02 introduces for the `#input`/`#attributes` forwards (reuse it, do not re-invent it; if ST-02 has not shipped one, create it in the wizard helpers file and let ST-02 adopt it).
- Core's wizard test vocabulary as the model: `twoPageWizard`/`threePageWizard` metadata builders, `renderCount`, `flushPromises`. Core's `TestForm`/`TestFormTemplate` are not importable from this package (they are test-only and not exported), so the element-plus helpers mirror their shape instead.
- `packages/core/dist` is what this package's tests import, so core must be built and current when the tests run (`pnpm build` first; `pnpm -r ci` already orders this). A stale core build is the most likely cause of a confusing wizard failure here.

New (all in the helpers file):
- `mountWizardForm(metadata, { settings, template, initialValues })`: the host described above.
- `wizardMetadata({ pages, wizard })`: builds `{ name: 'wizard', wizard, children: [...] }` with one text field per page; fields default to `minOccurs: 0`, each test opts individual fields into required.
- `makeWrapper(overrides)`: a `defineComponent` render-function wrapper around `ElementPlusFormTemplate` that forwards `#input`/`#attributes` and adds only the given override slots (`default-wizard`, `default-wizard-page`, `text-wizard`, `default-choice` for the nested-choice test).
- `deferredRule()`: a validation function whose promise the test resolves on demand, to hold `isValidating` true.
- Finders keyed on `data-testid`: the developer adds `<path>-step-<i>`, `<path>-prev-button`, `<path>-next-button`, `<path>-submit-button` on the built-in chrome and `data-page="<pageIndex>"` plus `<path>-page` on the page wrapper. `ElStep` and `ElButton` both fall attrs through to their root element, so the ids survive.

### Acceptance criteria to test map

Test names are behaviour statements with no process references.

| AC | Test (file) | Level |
| --- | --- | --- |
| 1 | `renders one step per page with the active step following currentStepIndex` (logic): `findComponent(ElSteps).props('active')` equals the index; step titles equal each page's `label`, else `name`; DOM smoke check that exactly one `.el-step` is `is-process`, earlier ones `is-finish`, later ones `is-wait`. `builds the steps from the pages prop, not from fieldMetadata.children` (logic, isolated): pass `pages` whose titles differ from `fieldMetadata.children`, assert the titles come from `pages`. `falls back to "Step N" when a page has no label and no name` (logic, isolated; the engine fills `name`, so this edge is only reachable here) | component |
| 2 | `hides Previous on the first page` (logic); `Next calls next and moves to the next page when the page is valid` and `Next keeps the current page and shows the page errors when it is invalid` (validation, engine, real required field on page 0, assert index, the error text, and that page 1 stays hidden); `Next calls next exactly once per click` (logic, isolated, spy) | component |
| 3 | `shows a submit button instead of Next on the last page` (logic, isolated and engine); `the submit button is a native submit button` asserts the rendered `<button>` has `type="submit"` (see finding 2); `clicking Submit fires the form submit and does not call next` (logic, engine host submit spy plus isolated `next` spy not called) | component |
| 4 | `disables Next and Submit while validation is in flight` (validation, isolated with `isValidating: true` for both buttons, plus engine with `deferredRule()`: click Next, assert the `disabled` attribute while pending, resolve, assert it clears and the index advances) | component |
| 5 | `clicking a later step calls gotoStep with that index when allowForwardJump is true` (logic, isolated, `toHaveBeenCalledWith(2)` exactly, so no option override leaks); `clicking a later step does nothing when allowForwardJump is false` (logic, isolated: spy not called; engine: index unchanged); `clicking an earlier step goes back in both modes` (logic, engine, from page 2 click step 0); `clicking the current step is a no-op`. The mode is read from the `wizardConfig` slot prop: a variant where `fieldMetadata.wizard` disagrees with `wizardConfig` proves the slot scope is the source (isolated) | component |
| 6 | `renders the pages inside the wizard chrome through the input slot chain` (logic): bare mount, assert the page content is a DOM descendant of the chrome root; same under `makeWrapper` with the `#input` forward. Also asserted for the page wrapper (the page's field is reached through the same chain) | component |
| 7 | `keeps every page mounted and hides the others with display none` (validation): all page wrappers exist, non-current ones carry `display: none`, current one does not. `keeps all page fields registered across navigation`: `getPathState` defined for every page field before and after next/prev, `values` not cleared. Asserts DOM hiding, not just the prop | component |
| 8 | `keeps a typed value across a round trip` (validation): type into page 0's `ElInput` via `setValue`, go next, go back, assert input value and `values` unchanged, then clear it and make it required to assert it is still validated (blocked `next` from page 0 again) | component |
| 9 | `marks exactly the current page as visible and exposes its position` (logic): `data-page` equals the page index on every wrapper; exactly one is visible; moving the step moves the visibility | component |
| 10 | `overriding only the page wrapper keeps the built-in indicator and buttons` and `overriding only the wizard container keeps the built-in page wrapper` (logic, `makeWrapper`); the override page wrapper in the test applies `v-show`, and a companion test documents that an override that omitted it would show all pages (asserts the consumer's duty, not the package's). `no duplicate-slot warning is emitted` by spying `console.warn` | component |
| 11 | `forwards a per-type wizard slot the template does not enumerate` (logic): wrapper supplies `#text-wizard`, a `text` wizard renders the consumer markup; a wizard of another type (or a second wizard node with a different `type`) keeps the built-in chrome | component |
| 12 | `a wizard inside a choice branch navigates independently` and `repeated wizards navigate independently` (logic). Choice: the test wrapper supplies its own minimal `#default-choice` (buttons calling `addChoiceOccurrence`) so the test does not depend on the later choice story; repeated: `maxOccurs: 2, minOccurs: 2, autoAddMinOccurs: true` around a wizard, array chrome falls back to the `default` fallback. Step `teams[0].wiz` forward, assert `teams[1].wiz` stays on 0 and both render the built-in steps | component |
| 13 | `renders no steps and does not throw for a wizard without pages` (logic, engine and isolated with `pages: []`): zero `ElStep`, no Next, no Previous, no console error; see finding 4 for the Submit button | component |
| 14 | Extend the ST-04 source-scan test: the wizard markup introduces no Tailwind tokens, and the `.vue` source contains no `ElSpace`/`ElRow`/`ElCol`. Stylesheet content is verified by the `build` step (`dist/style.css` contains the wizard classes) and review; `pnpm ci:test` keeps the scan green | scan + manual |
| 15 | `pnpm --filter ./packages/element-plus run ci:test`, `ci:lint`, `ci:typecheck`; manual grep (below) for spec tokens and em dashes in every new or changed file | commands + manual |

Edge cases from the story:
- Invalid page cannot be left forward but can be left backward: validation file (blocked `next` test, then a `prev` from page 1 after filling and advancing, then invalidating page 1 and confirming `prev` still works).
- `allowForwardJump` true with earlier pages invalid: logic file, engine: the template calls `gotoStep`, the engine decides; assert the template makes the call and the resulting index equals what core does (forward jump lands, errors surface), without re-implementing the policy.
- `Step N` fallback: isolated only (AC1 row).
- One-page wizard: logic file, Previous absent, Submit shown immediately, no Next.

### States to assert (from the feature's states policy, for this slice)

- Default/first page, middle page, last page (Previous and Next, Previous and Next, Previous and Submit).
- Empty (no pages): no steps, no throw.
- Loading/busy: `isValidating` true disables Next and Submit.
- Error: a blocked Next surfaces the failing field's error inside its `ElFormItem` on the current page; the wizard stays put. The hidden pages' errors are not visible until their page is shown.
- Disabled wizard (`maxOccurs: 0` on the wizard node): pages receive `disabled`; assert the page wrapper still renders and does not throw (engine passes `disabled`; the built-in chrome does not need to grey out the buttons unless the developer chooses to, see question 2).
- Validation states: required marker and error message on a page field (covered because the inputs are the ST-02 `ElFormItem` fallbacks).
- Nested: inside a choice and inside an array (AC12).

### Reactivity (analytics file)

The wizard re-renders on every navigation and the engine deliberately caches the page slot scope so children do not re-render (`stableSlotProps`). The built-in page wrapper is what could silently defeat that (for example by spreading its slot scope into the inner slot, creating a fresh object per render). So, with `settings: { analytics: true }` and `data-testid="<path>-analytics-render-count"`:
- `navigating to another page does not re-render fields on untouched pages`: three pages, render counts of the page 2 field and of a sibling field outside the wizard are identical before and after going to page 1.
- `a round trip does not remount or re-render the page 0 field`: same count before and after next then prev.
- `a blocked next re-renders only the failing field and keeps the same wizard instance`.
Counts are compared relative to a baseline taken after mount, never absolute numbers. These mirror core's wizard analytics cases, run against the Element Plus chrome, which is the thing under test.

### Coverage

The baseline is whatever `pnpm -r ci:test:coverage` reports for `packages/element-plus` at the start of the story (the package currently has only a placeholder test, so ST-01 raises it first). The plan covers every branch of the new wizard code: first, middle, last, empty, one page, busy, forward gate true and false, label and name and `Step N` title fallbacks, bare and wrapped input chain. Knowingly uncovered: nothing in the wizard fallbacks. The scoped CSS and `dist/style.css` content are not measured by coverage and are verified through the build and the source-scan test.

### Time sensitivity

None of these tests depend on dates or times. They run under the package's `ci:test` script, which already sets `TZ=Europe/Amsterdam`; no test reads the clock, so no additional handling is needed.

### Regression risk

- `ElementPlusFormTemplate.vue` is the shared SFC: ST-02 (forward contract), ST-03 (bindings), ST-04 (CSS), ST-05 and ST-06 (array and choice chrome) all edit it. The highest-risk interaction is the ST-02 `forwardedSlotNames` exclusion set: adding explicit `default-wizard` and `default-wizard-page` templates without adding both names to that set would register a slot twice (duplicate-slot warning, or the consumer's `default-wizard` being forwarded ahead of the fallback). Guarded by the no-warning assertion in the override tests, and the ST-02 exclusion test must be extended to list `default-wizard` and `default-wizard-page` as consumed-by-explicit-template. `text-wizard` must stay forwarded (AC11), so the set is an enumeration of the two structural names, not a `-wizard` suffix match.
- The page wrapper shares the `<slot name="input"><slot /></slot>` chain with every other shape. Guarded by the ST-02 bare-usage tests plus AC6 here.
- ST-04's Tailwind source scan covers the new markup automatically; a wizard class name that collides with a scanned token (for example a scoped class literally named `flex`) would fail it. Choose names like `wizardSteps` (kebab-case in CSS).
- `packages/core` is untouched, but the tests depend on its wizard contract (`v-show` visibility, `stableSlotProps`, `isFirst`/`isLast` for an empty wizard). The core suite (`DynamicFormItemWizard.logic/validation/analytics.test.ts`) guards that contract; if a core change breaks these element-plus tests, the core contract moved.
- Element Plus `2.14.2` is the pinned dev version; the `is-process`/`is-finish`/`is-wait` class names are an implementation detail of that version, so the DOM smoke assertion is kept secondary to the `ElSteps` prop assertion. The `>=2.0.0` peer floor (per-step click layering) cannot be exercised by these tests; it is a manual/developer check recorded in Implementation notes (the story's open developer point).
- jsdom gaps: `ElSteps` does not need `ResizeObserver`, but if a future control pulled in by the wizard chrome does, stub it in the test setup rather than in individual tests.

### Manual verification checklist

Not automatable, done once against a Storybook wizard example (the playground story from the later Storybook story, or a temporary local story if it has not landed) and recorded in the Verification report:
- [ ] Indicator, Previous/Next/Submit, and a forward-jump-enabled wizard look correct with only `element-plus/dist/index.css` plus the package stylesheet imported, and the wizard still lays out acceptably with the package stylesheet removed.
- [ ] Step indicator and buttons in both Element Plus color modes if the playground exposes a dark toggle (no dark-mode work is promised; only confirm nothing is illegible).
- [ ] Clickable steps give a pointer cursor only when forward jumping is allowed (or the step is behind the current one), and a non-clickable step does not look clickable.
- [ ] Keyboard: Tab reaches Previous/Next/Submit in order, Enter activates them, and Enter inside a field on the last page submits the form (not jumps a step).
- [ ] Real validation round trip: fill a required field, advance, go back, clear it, try to advance.
- [ ] `element-plus >=2.0.0` floor: confirm the per-step click layering mechanism does not use an API newer than the floor (developer records the source check in Implementation notes).
- [ ] Hygiene greps over every new or changed file: no em dash character, no `FEAT`/`ST-`/`AC`/`ADR`/`finding` tokens in comments or test names.

### Findings on the acceptance criteria

1. **AC2 and the one-page edge case disagree on Previous.** AC2 says Previous is "hidden or disabled"; the edge case says "hidden". A test cannot assert "either". Proposed rewrite: "Previous is not rendered when `isFirst`." The plan asserts non-existence; if the developer prefers disabled, change the assertion to the `disabled` attribute, but it must be one of them.
2. **AC3: `type="submit"` on an `ElButton` is wrong.** On `ElButton`, `type` is the color variant (`primary`, `success`, ...); the native button type is `nativeType`. A literal reading yields a button that never submits. Proposed rewrite: "the submit button renders a native `<button type="submit">` (set through `nativeType`)". The plan asserts the rendered DOM attribute and the host's submit event, which would catch the mistake. The Next and Previous buttons must render `type="button"` (the `ElButton` default) so they never submit; add that assertion.
3. **AC5: the forward-gate behaviour is under-specified.** "Nothing changes" does not say whether the template calls `gotoStep` when forward jumping is off (the engine also refuses, so the outcome is the same either way). Proposed rewrite: "With `allowForwardJump` false the template does not call `gotoStep` for a later step; it always calls `gotoStep(index)` with no options for an earlier step and for a later step when allowed." The plan tests exactly that, with `toHaveBeenCalledWith(index)`.
4. **AC13 is inconsistent with AC3.** An empty wizard has `isFirst` and `isLast` both true, so AC3 says a Submit button shows, while AC13 says "buttons do nothing". Submit in a form does submit. Proposed rewrite: "no steps render, no Previous or Next renders, and the Submit button renders as on any last page." The plan asserts that; if the intent is no buttons at all, the story must say so.
5. **AC9: "for example a `data-page` attribute" is not testable.** Proposed rewrite: "each page wrapper carries `data-page` equal to its zero-based `pageIndex`." The plan uses that.
6. **AC12 depends on later-story chrome if read literally.** Selecting a wizard branch in an explicit choice needs the choice section's add buttons, which belong to the choice story (not a dependency of this one). The plan supplies a test-local `#default-choice` so the test stands alone; the criterion is otherwise testable as written.
7. **AC14 and AC15 are review criteria.** AC14's "no Tailwind classes" and the `ElSpace`/`ElRow`/`ElCol` ban are automated through the extended source scan; "scoped CSS in the package stylesheet" is verified by the build output. AC15 is commands plus manual greps. No untestable criterion remains, but these two are not pure Vitest behaviour tests.

### Questions for Jeroen or the adversarial review

1. The story does not say whether the built-in wizard container shows the wizard node's own validation message (a rule on the wizard itself, which the engine surfaces through `fieldContext.errorMessage`; core's test harness renders it). No criterion and therefore no test covers it. If it should show, add a criterion; otherwise the message is silently invisible for wizards with their own rules.
2. Should the built-in chrome react to `disabled` (a wizard with `maxOccurs: 0`)? Not specified; the plan only asserts it does not throw.
3. The story says the package stays on plain English button text; tests assert presence of the buttons by `data-testid`, not by text, so the later labels mechanism (if ever added) will not break them. Confirm that is acceptable, or ask for text assertions.

## Adversarial review
Reviewer running as opus (story level, lite: blockers first). Findings and resolutions.

The QA planner had already surfaced the substance of most of these in "Findings on the acceptance criteria" and "Questions for Jeroen"; this review verified each against the core wizard contract (`packages/core/src/components/DynamicFormItemWizard.vue`, `DynamicForm.vue`) and element-plus `2.14.2`, and routes concrete rewrites into the acceptance criteria so Jeroen approves a fix, not a hole.

1. **BLOCKER — AC3 is factually wrong about `ElButton` and silently assumes a `<form>` the library never renders.**
   Two independently verified problems, both fatal to the submit path as written:
   (a) On `ElButton`, `type` is the colour variant (`primary`/`success`/...); the native HTML button type is `nativeType` (default `"button"`), verified against the element-plus Button API. `<ElButton type="submit">` renders `<button type="button">` and never submits. A developer reading AC3's `type="submit"` literally ships a submit button that does nothing.
   (b) The core wizard slot scope exposes only `next`, `prev`, `gotoStep` (verified in `DynamicFormItemWizard.vue`: no `submit`), and `DynamicForm` renders no `<form>` element (verified in `DynamicForm.vue`: it renders bare `DynamicFormItem`s). So a `nativeType="submit"` button fires a submit only when the consumer has wrapped `DynamicForm` in a native `<form>`. In bare, zero-config usage (the feature's "zero further template work ... wizards" promise) there is no form and the built-in Submit button is inert. AC3 states "clicking it triggers the form's submit path" unconditionally, which is false without an ambient form.
   Additionally, because there is no `submit` function, Prev and Next are plain click handlers and MUST render `nativeType="button"` (the `ElButton` default) so that, inside a consumer form, clicking them (or pressing Enter in a field on a non-last page) does not implicitly submit. This also underpins the manual checklist's "Enter on the last page submits, not jumps a step".
   Resolution: rewrite of AC3 adopted and recorded as a research decision (consumer-owned submit, per the approved wizard feature).

2. **SHOULD-FIX — AC2 "hidden or disabled" is not testable and contradicts the one-page edge case.**
   AC2 says Previous is "hidden or disabled"; the edge cases and the states section say "Previous hidden" / "Previous absent". A test cannot assert "either". Resolution: adopted; AC2 now says Previous is not rendered when `isFirst`, matching the edge case. If the developer prefers `disabled`, the story must say so and the edge case must change too.

3. **SHOULD-FIX — AC13 contradicts AC3 for the empty wizard.**
   Verified against core: `pageCount === 0` makes `isLast` return `true` and `isFirst` is `true` (`DynamicFormItemWizard.vue` lines 85-89). So by AC3 a Submit button renders, yet AC13 says "buttons do nothing". Both cannot hold. Resolution: adopted; AC13 now states what actually renders (no steps, no Prev/Next; the Submit button renders as on any last page, and submitting an empty form is a no-op unless the consumer's form handles it), reconciled with the AC3 rewrite.

4. **SHOULD-FIX — AC5 under-specifies the template's call contract when forward-jump is off.**
   Verified against core `gotoStep` (lines 167-193): a disallowed forward jump returns early, so whether the template calls `gotoStep` or not for a later step when `allowForwardJump` is false yields the same visible result, which makes "nothing changes" ambiguous to test. Resolution: adopted; AC5 now pins the exact call contract (`gotoStep(index)` with no options for an earlier step, and for a later step only when allowed; no call for a later step when off), which the QA map already tests with `toHaveBeenCalledWith(index)`.

5. **SHOULD-FIX — AC9 "for example a `data-page` attribute" is not testable.**
   "For example" leaves the observable contract open. Resolution: adopted; AC9 now names `data-page` equal to the zero-based `pageIndex`, which the QA map already uses.

6. **RESOLVED (research), the wizard node's own validation message.**
   Verified the mechanism exists: `DynamicFormItemWizard.vue` (lines 49-50) anchors a `fieldContext` at the wizard's own path exposing `errorMessage`, and core's `TestFormTemplate` renders it. The story's Question 1 correctly notes no criterion covers whether `default-wizard` surfaces it, so a wizard carrying its own rule (e.g. required via `minOccurs`) would show no message with the built-in chrome. Not an adversarial call to settle: this is a design decision for Jeroen. Settled afterwards by research: added as AC16.

7. **RESOLVED (research), disabled wizard chrome.**
   Verified: a wizard with `maxOccurs: 0` passes `disabled: true` to the container slot (`DynamicFormItemWizard.vue` lines 97, 243-256). The story's Question 2 asks whether the built-in chrome should react (grey out nav). Settled afterwards by research: added as AC17.

8. **NIT — AC4's `isValidating` is unreachable while Submit is visible in real navigation.**
   Core sets `isValidating` true only inside `validateCurrentPage`, which runs on `next`/forward-jump (lines 129-142). The last page has no `next`, so during a real whole-form submit the wizard's `isValidating` is never true while the Submit button is shown; the "Submit disabled while busy" branch is only reachable in the isolated test. A genuine submit-busy indicator would need the form's submitting/validating state, which the wizard slot scope does not expose. Harmless (the isolated assertion still pins the rendering), but worth noting so nobody expects it to fire in the engine flow. No status impact.

9. **CONSISTENCY PASS (no finding) — the ST-02 exclusion-set dependency is explicit on both sides.**
   ST-02's `forwardedSlotNames` is a single named enumeration, not an automatic "exclude every enumerated name" match, so each later story that adds an explicit `<template #X>` must add `X` to that set. ST-02's regression-risk section already states ST-05 to ST-07 extend it, and ST-07's own regression-risk commits to adding `default-wizard` and `default-wizard-page` (and keeping `text-wizard` forwarded). The dependency is declared on both sides and consistent; no gap. The QA map's no-duplicate-slot-warning assertion guards the failure mode.

### Status rationale
Originally `awaiting-discussion` (one blocker, two open questions). All three were then settled by research against the approved wizard feature and the codebase pattern, findings 2 to 5 were adopted into the criteria, so nothing remains open and the story is `awaiting-approval`.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built in `packages/element-plus/src/ElementPlusFormTemplate.vue`: `#default-wizard` (ElSteps/ElStep indicator from `pages`, pages via `<slot name="input"><slot /></slot>`, own `errorMessage`, Previous/Next/Submit `ElButton`s) and `#default-wizard-page` (`v-show="isCurrent"` wrapper with `data-page`). `default-wizard` and `default-wizard-page` were added to the unforwarded slot set; `text-wizard` stays forwarded. Scoped classes `epft-wizard`, `epft-wizard-navigation`, `epft-wizard-step-clickable` end up in `dist/style.css` (verified after `pnpm run build`). `packages/core` untouched, no changeset, `specs/components.md` updated.

Tests: `ElementPlusFormTemplate.wizard.logic/validation/analytics.test.ts` plus `wizard.test-helpers.ts` (named like the existing `choice.test-helpers.ts` instead of the QA plan's `ElementPlusFormTemplate.wizard.test-helpers.ts`). The forwarding test now lists the wizard slots. AC14 needed no scan change: the existing scan covers every `.vue` under `src`. Results: package `ci:test` 461 passed, `ci:lint` and `ci:typecheck` clean, coverage 100 statements / 99.17 branches / 100 functions, core 686 passed.

Deviations and findings:
- **Field error text added to the default wrapper.** AC2 and the QA plan expect a blocked Next to show the page's errors, but the default `ElFormItem` showed none. `ElFormItem` renders its message only inside an `ElForm` (the `error` prop only sets the `is-error` class here), so the default fallback now renders `fieldContext.errorMessage` under the control in a `<p class="epft-field-error" data-testid="<path>-error-message">`. Not the `error` prop, so a consumer who wraps in `ElForm` gets no duplicate message. This widens the shared default wrapper beyond the wizard; the one-line template block and one CSS rule are easy to undo. Its test helper `mountInput` gained `errorMessage` in the mocked field context, because the real context always has it.
- Step status classes: `finishStatus="success"` is set on `ElSteps`, so finished steps carry `is-success` on `.el-step__head` (not `is-finish`); the smoke assertion reads that.
- Step click layering: `@click` on `ElStep` works through attribute fallthrough (2.14.2 `ElStep` has one root and no `inheritAttrs: false`). I could not check the `2.0.0` source offline, so the floor claim rests on the `ElStep` single-root structure and is left for the verifier to confirm.
- AC12 nested choice test uses the built-in explicit choice section (now available) instead of a test-local `#default-choice`.
- The repeated-wizard test logs a vee-validate `field with path teams was not found` warning on teardown only (after the test's own warning assertions). Not caused by the wizard chrome; left as is.
- AC3 requires documenting the surrounding-form requirement in the README and the playground example. Neither exists yet, so this is carried by the README story and the playground story. The inventory entry in `specs/components.md` already states it.
- Not done here: the manual checklist (Storybook look in both color modes, keyboard, cursor) and Playwright screenshots, since no wizard playground example exists until the playground story. No `docs/` change, so no docs build.

## Verification report
Verdict: **pass-with-notes**.

### Pipeline results (re-run independently)
- `pnpm run ci:test`: core 686 passed, `packages/element-plus` 461 passed (31 files).
- `pnpm run ci:lint`: clean (core and element-plus).
- `pnpm run ci:typecheck`: clean (core and element-plus).
- `pnpm -r ci:test:coverage`: core 97.57 / 92.61 / 97.14 / 97.57 (unchanged, `packages/core` has no diff); element-plus 100 statements / 99.17 branches / 100 functions / 100 lines, matching the developer's numbers. All 461 tests green under coverage.
- `pnpm run build` in `packages/element-plus`: succeeds; `dist/style.css` contains `epft-wizard`, `epft-wizard-navigation`, `epft-wizard-step-clickable`.
- No `docs/` change, so no docs build.

### Mutation checks (tree restored byte-identical, sha1 of `ElementPlusFormTemplate.vue` verified before and after)
| Mutation | Result |
| --- | --- |
| page wrapper `v-show` to `v-if` | 15 wizard tests fail |
| Submit `nativeType` to `button` | 3 fail (native type, surrounding-form submit, empty-wizard submit) |
| forward-jump gate removed | 3 fail |
| Submit `disabled` dropped | 1 fail (disabled wizard) |
| steps built from `fieldMetadata.children` instead of `pages` | 10 fail |

### Criterion table
| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 | pass | wizard.logic `renders one step per page ...` (ElSteps `active` prop, titles, statuses); `builds the steps from the pages prop and not from the field metadata children`; `falls back to a numbered title ...` (`Step N`). Template iterates `s.pages`. |
| 2 | pass | `does not render Previous on the first page`; `calls next exactly once per click`; validation `keeps the page and shows its errors when the current page is invalid`, `moves to the next page when the current page is valid`. |
| 3 | pass | `renders Previous and Next as plain buttons and Submit as a native submit button` (DOM `type`), `does not call next when Submit is clicked`, `submits the surrounding form from the last page`, `does not submit the surrounding form when Next or Previous is clicked`. Submit uses `nativeType`. The README and playground documentation of the surrounding-form requirement is carried by the later stories (see notes); `specs/components.md` states it. |
| 4 | pass | validation `disables Next and Submit while the wizard validates` (disabled plus `is-loading`), `keeps Next disabled while the page validates and moves on once it settles` (deferred rule in the engine). |
| 5 | pass | `calls gotoStep with exactly the index ...` (`toHaveBeenCalledWith(2)`), `does not call gotoStep ... not allowed`, `reads the jump policy from the wizard config and not from the field metadata`, earlier-step `it.each`, current-step no-op, three engine-level jump tests. |
| 6 | pass | `wizard input chain` block: bare, with `#input` forward wrapper, direct slot, and page field through the same chain. |
| 7 | pass | validation `keeps every page mounted and hides the others with display none` (DOM style assertion), `keeps all page fields registered across navigation` (`getPathState` and values). Mutation M1 proves it. |
| 8 | pass | validation `keeps a typed value across a round trip and still validates it`. |
| 9 | pass | `marks every page wrapper with its zero-based index and shows exactly the current one`; `shows the current page and hides the others`. |
| 10 | pass | `wizard overrides` block: page-only override, container-only override, omitted-gate companion, all under `expectNoWarnings` (no duplicate-slot warning). `default-wizard` and `default-wizard-page` are in the unforwarded set (lines 61-62). |
| 11 | pass | `forwards a per-type wizard slot the template does not enumerate` (`text` type customised, `number` type keeps built-in). |
| 12 | pass | `navigates a wizard inside a choice branch`, `navigates repeated wizards independently`. |
| 13 | pass | `renders no steps, no Previous, no Next, and a Submit button for a wizard without pages` (engine and isolated), `submits the surrounding form from a wizard without pages`. |
| 14 | pass | No `ElSpace`/`ElRow`/`ElCol` in the SFC (grep; only `ElColorPicker` matches the prefix); `noTailwind.test.ts` and `layoutClasses.test.ts` green; scoped CSS present in `dist/style.css`. |
| 15 | pass | Independent grep over the SFC and all wizard test files: no em dash, no FEAT/ST/AC/ADR/finding/QA plan tokens; `sourceHygiene.test.ts` green; ci:test, ci:lint, ci:typecheck pass. |
| 16 | pass | `own validation message` block: message shown above the navigation, nothing extra without one. |
| 17 | pass | `disables Previous, Next, and Submit and ignores step clicks` (also asserts `next`/`gotoStep` not called), `renders the pages of a wizard with maxOccurs zero without error`. M4 proves the Submit disabled assertion bites. |

Edge cases: invalid page left backward (validation tests via Previous and via step click), forward jump with earlier pages invalid (`lets the engine decide ...`), `Step N` fallback, one-page wizard: all covered by named tests above.

### Process compliance
- `specs/components.md` updated: the `ElementPlusFormTemplate` entry describes the wizard chrome, the submit contract, test ids, the `v-show` duty for overriding consumers, and the new default-wrapper field error.
- Changeset: not required; `git status` shows no change under `packages/core`, and the element-plus package is private.
- Test naming: `*.logic/validation/analytics.test.ts` follow the repo conventions; no spec or process references in names.
- Public surface: no new exports. Slot names `default-wizard`/`default-wizard-page` were already part of the inventory.
- Analytics file covers untouched-page, round-trip and blocked-next render counts, passing.
- DECIDED/ASSUMED entries honoured: native `submit` inside consumer form, wizard error rendered by the container, disabled honoured, plain English button text. No silent deviation.

### Prototype comparison
No prototype for this story. Visual and manual checks were not run (see notes).

### Notes (non-blocking)
1. **Scope widening, disclosed:** the default field wrapper now renders `fieldContext.errorMessage` under the control (`epft-field-error`, `<path>-error-message`) because `ElFormItem` shows no message outside an `ElForm`. It is needed for the AC2 "page shows its validation errors" outcome, affects every leaf field, and is documented in `specs/components.md`. Worth Jeroen's eye as it reaches beyond the wizard; one template block and one CSS rule to undo.
2. **Floor claim unverified:** the `element-plus >=2.0.0` per-step click layering (`@click` on `ElStep` via attribute fallthrough) could not be confirmed offline for 2.0.0; it rests on `ElStep` being single-root without `inheritAttrs: false` in 2.14.2. Left open as a manual check.
3. **Documentation carried forward:** AC3 asks for the surrounding-form requirement in the README and the playground example. Neither exists yet; they belong to the README story (ST-09) and the playground story (ST-08), which must include it.
4. **Manual checklist not run:** Storybook look in both color modes, keyboard behaviour, cursor, and screenshots need a wizard playground example, which does not exist until ST-08. To be done there.
5. The wizard's own error `<p>` reuses the `epft-array-error` class; harmless but couples the styles.
6. The developer's repeated-wizard test logs a vee-validate "field with path teams was not found" warning at teardown only; not caused by the wizard chrome.
7. Mutation check on `ElementPlusFormTemplate.vue` was done via a scratchpad backup and restored (checksum identical).

Remind Jeroen to link the PR in the frontmatter `pr` field. This is not necessarily the feature's last open story (ST-08 to ST-10 remain), so FEAT-004 stays `in-progress`.

Suggested commit message:

```
FEAT-004: Render wizards as Element Plus steps with validated navigation (ST-07)

Let end users move through a multi-step form one page at a time with an Element Plus step indicator, Previous and Next buttons that follow the wizard's rules, and a Submit button on the last page, without any template work from the consumer.

The built-in `default-wizard` and `default-wizard-page` fallbacks build the steps from the engine's `pages`, gate forward jumps on `wizardConfig.allowForwardJump`, disable the controls while validating or disabled, show the wizard's own validation message, and hide inactive pages with `v-show` so their fields stay registered. Submit is a native submit button inside the consumer's own form. The default field wrapper now also shows each field's error message under the control. Both slots stay overridable and per-type variants are forwarded.

Co-Authored-By: Claude <noreply@anthropic.com>
```
