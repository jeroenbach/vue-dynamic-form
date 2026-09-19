# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Remembering Instructions

Whenever the user says **"remember this"** (or similar) about an instruction or preference, add it to this CLAUDE.md file in the appropriate section (create one if needed), then commit it. Keep CLAUDE.md as one single file, do not split it into partials.

## Writing Style

- **Never use em dashes (—)** in any text you write: content, copy, descriptions, PR text, etc. Rephrase the sentence or use a comma, colon, or parentheses instead.

## Code Comments

- **Never reference specs, features, stories, or process artifacts in code comments or test names**: no FEAT-001, ST-05, AC4, ADR-2, "QA plan", "feature spec", "finding 3", "decision 4", etc. Specs are process artifacts; the code must stand on its own for a reader who has never seen them.
- Write sensible comments: short and powerful. Let function and variable names carry the explanation; a comment only earns its place when it states a constraint or rationale the code itself cannot show.

## Interactive vs Autonomous Sessions

- **Working together (interactive session)**: only make the changes, do **not** commit or push; the user handles git themselves.
- **Working autonomously (e.g. GitHub Actions, scheduled agents, or when explicitly asked to finish a task end-to-end)**: follow the full "Before Every Push" workflow below, including commits, screenshots, and the PR.

## Spec-Driven Development

Larger work runs through the spec workflow in `specs/` (see `specs/README.md` for the full lifecycle): epics, features, and stories with approval gates that only Jeroen may pass. The `/spec:*` commands in `.claude/commands/spec/` drive it, the agents live in `.claude/agents/`, and `specs/components.md` is the living inventory of the library's public surface (keep it up to date on every public-surface change). Bug fixes and trivial changes can use `/spec:quick`.

## Before Every Push

Always run these steps before committing or pushing changes.

Before running any of them, **verify `node_modules` is actually installed** (e.g. `ls node_modules | head`), don't assume it is. Fresh/sandboxed checkouts can start with an empty `node_modules`, and tools like bare `npx eslint`/`npx vue-tsc` will then fail with confusing module-not-found errors that look unrelated to the real cause. If it's missing or empty, run `pnpm install` first (it also installs the `docs/` and `playgrounds/storybook/` sub-projects).

When a step fails, fix the error and re-run **only that step**, don't restart the whole list from the top (the earlier steps already passed). If the failing tool supports scoping, narrow the re-run to just the affected area first (e.g. `npx eslint --fix <file>`, `cd packages/core && npx vitest run <test-file>`), then run the full step once more to confirm it's clean before moving on.

1. **Run all pipeline checks** — `pnpm ci` (runs tests, lint, and typecheck together). Fix every error before pushing.
2. **Keep coverage green** — run `pnpm -r ci:test:coverage` and verify that statement/branch/function coverage does not drop compared to the baseline. The codecov integration tracks this on every PR.
3. **Add tests** — any functional change must be accompanied by tests that exercise the new or fixed behaviour.
4. **Take screenshots** — for any visual/UI change, take a screenshot using Playwright. Chromium is pre-installed at `/opt/pw-browsers/chromium`; the `playwright` package is available under `playgrounds/storybook/node_modules/playwright`. Launch with `args: ['--no-proxy-server']` when screenshotting localhost (the environment proxy does not forward to local ports). Run the docs or Storybook server first, screenshot it, and attach the image to the PR or commit.
5. **Check the Cloudflare Pages preview** — if `docs/` content changed, run `pnpm docs:build` locally first to confirm the VitePress site compiles. Cloudflare Pages automatically builds a preview environment for every PR (the URL is posted as a PR comment by the `cloudflare-workers-and-pages` bot). Verify the preview before merging. On merge to `main`, Cloudflare deploys to production at [vue-dynamic-form.bach.software](https://vue-dynamic-form.bach.software).
6. **Add a changeset** — only required when `packages/core/src/` has changed (the published library). Skip it for changes that only touch `docs/`, `playgrounds/`, `packages/element-plus/` (private), root config files, or CI workflows — those don't affect the published package.

   Run `pnpm changeset` and choose the bump type based on backwards compatibility:
   - **patch** — bug fix or internal change with no API impact
   - **minor** — new feature or export that is backwards compatible (existing code keeps working unchanged)
   - **major** — breaking change: removed or renamed export, changed function/component signature, behaviour change that existing consumers relied on

   Commit the generated `.changeset/*.md` file with the branch.

## Commands

```bash
# Install dependencies (also installs docs/ and playgrounds/storybook/ sub-projects)
pnpm install

# Development: rebuild core on file change + run Storybook playground
pnpm dev

# Run separately:
pnpm build:watch   # watch rebuild of packages/core
pnpm storybook     # Storybook playground UI
pnpm docs:dev      # VitePress documentation site

# Quality checks (run all three together)
pnpm test          # vitest (all packages)
pnpm typecheck     # vue-tsc --noEmit (all packages)
pnpm lint          # eslint (all packages)
pnpm ci            # runs test + lint + typecheck together

# Run a single test file
cd packages/core && npx vitest run src/components/__tests__/DynamicForm.test.ts

# Run tests with coverage
pnpm -r ci:test:coverage   # TZ=Europe/Amsterdam is required; the ci:test:coverage script sets it

# Build
pnpm build         # build all packages
```

## Monorepo Structure

The workspace (`pnpm-workspace.yaml`) includes only `packages/*` — `docs/` and `playgrounds/storybook` are excluded from the workspace and have their own `node_modules`.

```
packages/core          — the published library (@bach.software/vue-dynamic-form)
playgrounds/storybook  — Storybook component playground (not published)
docs/                  — VitePress documentation site (not published)
```

The only published package is `packages/core`. All source lives under `packages/core/src/`.

The `@/` alias resolves to `packages/core/src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Architecture

### The Three-Layer Contract

The library separates concerns into three layers:

1. **Metadata** — a typed tree of `FieldMetadata` objects describing structure, validation, and dynamic behaviour
2. **`DynamicForm`** — the runtime engine; accepts metadata + a template component, normalises paths, provides settings via `provide/inject`, and renders `DynamicFormItem` trees
3. **Template** — a user-written `DynamicFormTemplate`-based component; owns all layout and styling via named slots, with no knowledge of the engine internals

### Metadata Tree Shapes

Each node is classified by the engine based on its properties:

| Condition | Shape | Rendered by |
|---|---|---|
| `maxOccurs > 1` | Array / repeatable | `DynamicFormItemArray` |
| `choice` is non-empty | Mutually exclusive branches | `DynamicFormItemChoice` |
| `children` is non-empty | Group / parent | `DynamicFormItem` (recursive) |
| `attributes` is non-empty | Complex type with attributes | `DynamicFormItem` (attribute sub-items) |
| Leaf node | Input field | rendered directly into the template |

The engine walks the tree in `DynamicForm.vue:correctMetadataAndSetDefaults()`, filling in `name`, `path`, `type`, `minOccurs`, `maxOccurs`, and linking each node to its `parent`.

### DynamicFormItem: The Core Component

`DynamicFormItem.vue` is the most complex file in the codebase. Each instance:

- Registers with vee-validate via `useField(normalizedPath, combinedValidation)`
- Runs `computedProps` functions inside a `computed()` that re-evaluates reactively
- Detects its own shape (isArray / isChoice / isParent / isInput) and delegates to the appropriate sub-component or renders directly into the template
- Emits `update:computedField` upward so parents can track child computed state changes (used by `computedProps` that need to react to sibling/child field state)
- Guards against infinite loops in `computedProps` via `assertNoComputeLoop()`

Paths use dot-notation (`person.firstName`, `contacts[0].email`). For complex types (fields with `attributes`), the vee-validate path uses bracket notation: `path['value']` so dot-segment counting stays consistent.

### DynamicFormTemplate: The Slot Contract

`DynamicFormTemplate.vue` is the rendering bridge. It receives an `attrs` object from the engine and dispatches to the correct named slot using a priority fallback:

- Dedicated per-type slot (e.g. `text`) → `default-input` → `default`
- Dedicated per-type array slot (e.g. `text-array`) → `default-array` → `default`
- Dedicated per-type array-item slot (e.g. `text-array-item`) → `default-array-item` → `default`
- Dedicated per-type choice slot (e.g. `text-choice`) → `default-choice` → `default`

The slot props passed to each slot are typed via `defineMetadata()`.

### defineMetadata: Type-Level Configuration

`defineMetadata<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>()` is a pure TypeScript type carrier — its runtime values are empty stubs. It is used to:

- Narrow slot prop types in `DynamicFormTemplate` (slot `text` receives `fieldContext.value: string`)
- Add extra properties to `FieldMetadata` (e.g. `label`, `options`)
- Define `slotProps` shape passed between template layers
- Extend the `DynamicFormSettings` object

### Validation Model

Built on top of vee-validate. XSD-inspired rules are globally registered in `packages/core/src/core/validation.ts`. The rules are: `xsd_required`, `xsd_minOccurs`, `xsd_choiceMinOccurs`, `xsd_minLength`, `xsd_maxLength`, `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`, `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`.

`DynamicFormItem` builds a `combinedValidation` array reactively from `field.restriction` + `field.validation`, using a `watchEffect` (not `computed`) to avoid a circular dependency: `combinedValidation → computedField → value → fieldContext → combinedValidation`.

Validation message resolution priority: `settings.messages` → vee-validate `generateMessage` → rule default. Supports positional (`{0}`, `{1}`) and named (`{min}`, `{max}`, `{field}`) placeholders.

### useDynamicForm

Wraps vee-validate's `useForm()` and adds:
- `useFieldValue(path)` — path-aware accessor with full `TValues` type inference
- `validateSection(sectionPath)` — validates only fields under a given path prefix (for wizard-step validation)

`useValidatePartialForm` has a quirk: when called in the same component as `useDynamicForm`, it reads the form context from the current instance's own `provides` rather than via `inject`, because `inject` looks at the parent's provides.

### Settings Propagation

`DynamicForm` provides a `ComputedRef<DynamicFormSettings>` under `dynamicFormSettingsKey` (a Symbol). All `DynamicFormItem` instances inject this to read validation timing settings and message overrides.

## Testing

Tests live in `__tests__/` subdirectories next to the source they test. The test setup file (`packages/core/src/tests/test-setup.ts`) calls `enableAutoUnmount(afterEach)` from `@vue/test-utils`.

Test files follow naming conventions:
- `*.test.ts` — general tests
- `*.logic.test.ts` — logic/behaviour tests
- `*.validation.test.ts` — validation-specific tests
- `*.analytics.test.ts` — render-count / reactivity tests

The `analytics` setting on `DynamicFormSettings` enables hidden DOM elements (`data-testid="<path>-analytics-render-count"`) for render-count assertions in tests.

Time-sensitive tests must run with `TZ=Europe/Amsterdam` (set in CI scripts, not in `vitest.config`).

## Code Style

ESLint uses `@antfu/eslint-config` with `formatters: true`, `stylistic: true`, `typescript: true`, `vue: true`. Semicolons are required (`style/semi: error`). The docs directory disables `vue/attribute-hyphenation`.

Additional conventions:

- **Vue: always use camelCase, never kebab-case** (component names, props, event names, ...).
- **Every user-runnable script gets a `package.json` script.** Whenever you add a script meant to be run by the user (e.g. anything under a `scripts/` folder), add a matching entry to the `scripts` section of `package.json` so it can be run via `pnpm <name>` instead of a long raw command. Name it clearly.

## Git

- **Commit message wrapping: no hard line breaks mid-sentence.** Write each paragraph and each bullet as one continuous line, so the editor's word-wrap handles the display. Only insert a real newline where a new paragraph, bullet, or the subject/body separation actually starts. Never hard-wrap a sentence across multiple lines at a fixed column, because those breaks show up as awkward mid-sentence line breaks when pasted into the VS Code commit box.

## Release Process

Uses [Changesets](https://github.com/changesets/changesets). Before merging a PR:

```bash
pnpm changeset   # interactive prompt to describe change and bump type
```

Commit the generated `.changeset/*.md` file with the branch. When ready to release:

```bash
pnpm changeset version   # bumps version, updates CHANGELOG.md, deletes .changeset files
```

PRs should be **merged** (not squash-merged) to preserve the commit history that Changesets depends on.
