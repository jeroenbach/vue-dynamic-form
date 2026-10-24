# Why Vue Dynamic Form

This page explains, in plain words, what problem this library solves and how it compares to the alternatives. It is written for anyone who has to decide whether a team should use it: a manager, a product owner, or a developer making the case internally.

## The problem: forms are where projects get expensive

Every organisation runs on forms. Customer onboarding, insurance claims, permit applications, tax declarations, intake flows: this is where your users hand you the data your business runs on.

Simple forms are cheap. The forms that matter are not simple:

- **Repeating sections.** "Add another applicant", "add another vehicle", "add another income source", each with its own rules and validation.
- **Conditional logic.** "If the account type is business, require a VAT number." Dozens of these rules, interacting.
- **Either/or branches.** The user is a person *or* a company, pays by card *or* by invoice, and each branch has its own fields.
- **Validation that must match the back office.** The data has to arrive in exactly the shape your systems, standards, or regulators expect.

Teams usually hand-build this. The rules end up scattered across the user interface code: a hidden field here, a disabled button there, a special case in a change handler somewhere else. Six months later, nobody can safely answer "what happens if I change this field?" Every change request is slow, every release is risky, and when a second brand or client needs the same form, it gets rebuilt from scratch.

## What this library does about it

Vue Dynamic Form splits every form into two halves that normally get tangled together:

1. **The form definition**: which fields exist, when they appear, how they repeat, which branches exist, and what makes them valid. This is one readable description, the single source of truth for how the form behaves.
2. **The presentation**: your own components, your own HTML, your own brand. The library never renders a single element you did not choose.

That separation changes the economics of forms:

- **Changes become edits, not surgery.** "Also ask for a phone number when X applies" is a few lines in the definition, not a hunt through user interface code. The behaviour of any field is readable in one place.
- **One form, any brand.** The same definition renders through different templates. Agencies and software vendors can reskin per client without touching the logic; a design-system migration does not touch the business rules.
- **The hard cases are built in.** Repeating sections where every row has its own conditional logic, nested groups, and mutually exclusive branches are first-class concepts, not workarounds. These are exactly the cases where hand-built forms break down, and where most form tools model the behaviour as scattered visibility conditions rather than as structure.
- **Accessibility and compliance stay in your hands.** Because you own every element that is rendered, you can meet WCAG and design-system requirements with your own audited components instead of fighting a vendor's markup.

## Built on a standard that already solved this

The form model is based on XSD, the schema language that government, insurance, pensions, customs, and tax systems have used to describe structured data for over twenty years. You never need to see or know XSD to use the library. The point is that the model inherits semantics that were battle-tested on the most demanding paperwork in existence: occurrence counts, choice groups, nested structures, attributes, and a full set of validation rules.

For organisations whose data standards are literally defined in XSD (common in Dutch and EU government, insurance, and customs contexts), the mapping from schema to form is direct rather than approximate. JSON-Schema-based tools structurally cannot express some of these concepts; this model was built from them.

## How it compares

The form-tool market is crowded, so it is fair to ask what is genuinely different here. The honest summary: most tools either sell you a platform and own your UI, or give you a free engine whose schema is a component tree with conditions attached, not a data model with occurrence and choice semantics.

| | Vue Dynamic Form | FormVueLate | SurveyJS | Form.io | FormKit | Vueform | JSONForms / JSON Schema tools |
|---|---|---|---|---|---|---|---|
| Engine licence | MIT, everything free | MIT, everything free | Free core, commercial builder, PDF and dashboards | MIT renderer, OSL server, paid platform modules | MIT core, paid Pro inputs | MIT framework, commercial builder | Open source (MIT / Apache-2.0) |
| Who owns the HTML | **You, completely** | You (bring your own components) | Their widgets, themeable | Their renderer | Their structure, configurable | Their components, themeable | Their renderer sets |
| Vue-native | **Yes, built for Vue 3** | Yes, built for Vue 3 | Supported binding | Wrapper around their JS renderer | Yes (Vue-origin, now also React) | Yes | Supported binding |
| Repeating sections with per-row logic | **First-class** | Rows via `SchemaArray` (`min`/`max` bounds), per-row rules hand-coded | Yes (panel-scoped expressions) | Via advanced conditions (`row` variable) | Workarounds (index-based) | Yes (wildcard conditions) | Detail layouts only, not in table view |
| Either/or branches in the model | **First-class (choice), optional data preservation on switch** | Hand-coded (`condition` functions) | Via visibility expressions | Via visibility expressions | Via conditions | Via conditions | `oneOf` (clears data on switch) |
| Validation engine | vee-validate (the standard Vue validation library) | vee-validate (via plugin) | Own built-in rules | Own built-in rules | Own built-in rules | Own built-in rules | AJV |

A few of these deserve a sentence:

- **FormVueLate** is the closest neighbour in philosophy: schema-driven, headless (it ships no markup of its own), MIT, and it validates through the same validation library. The difference is what the schema describes. FormVueLate's schema says which components to show, and the dynamic behaviour lives in code you write around it. Here, the hard parts (repeating sections with their own rules, either/or branches) are part of the form definition itself, so they are things you describe rather than build. The project's maintenance history has also been bumpy, with long unmaintained stretches before the current revival.
- **SurveyJS and Form.io** are platforms. They are strong products if you want their builder, their hosting model, and their rendered UI, and you are comfortable with per-developer licences or monthly module pricing. You trade away control of the markup and take on licence cost that scales with your team.
- **FormKit** is an excellent Vue form framework, and its engine is free. The difference is philosophical: FormKit renders its own input structure that you configure and style, while Vue Dynamic Form renders nothing of its own. Its form descriptions are also about which components to show, not about how the data behaves.
- **Vueform** is in a similar position: the framework itself is free, with the drag-and-drop builder as the paid product. It renders its own components that you theme, and repetition and branching are expressed as display conditions rather than as structure in the form definition.
- **JSON Schema tools (JSONForms, react-jsonschema-form, and similar)** are the closest in spirit: schema in, form out, open source. Their ceiling is the schema language and how each tool maps it to a form. Either/or alternatives are possible, but switching between them typically throws away what the user already entered with no way to keep it (here, keeping it is an opt-in flag), and support for conditional logic varies from tool to tool, with gaps in exactly the repeating and cross-field cases that complex forms need. Those gaps are where projects stall.
- **vee-validate**, the most widely used Vue validation library, handles validation and form state but deliberately stops short of form generation. Its own documentation calls form building a repetitive task and offers a tutorial for building your own form generator rather than shipping one. Vue Dynamic Form is built on top of vee-validate, so adopting it is an extension of the ecosystem most Vue teams already use, not a replacement.

::: details For developers: the fine print behind these claims

- **FormVueLate**: conditions are per-field `condition` functions (or computed schemas you swap at runtime). `SchemaArray` wires repeating rows with `min`/`max` bounds, but the add/remove controls and any per-row rules are hand-coded. There is no choice concept, so either/or branches are hand-rolled. Versions 2 and 3 are unmaintained and the repository was archived for a period before the current 4.x revival.
- **FormKit**: the schema is a component tree. It has no occurrence or choice semantics of its own, so repetition and branching are built from conditions and index-based workarounds.
- **Vueform**: MIT since late 2023. Repetition and branching live in UI-level conditions (including wildcard conditions over list elements), not in a data model.
- **JSON Schema**: `oneOf` covers either/or alternatives, but it swaps whole subschemas rather than offering element-level choice groups, and switching branches typically discards entered data. For fairness: Vue Dynamic Form also clears the deselected branch by default, but preserving the entered data across a switch is a built-in opt-in (`preserveOnSwitch`) rather than unavailable. There is no concept of XML-style attributes. `if/then/else` support is uneven: react-jsonschema-form resolves it into the rendered form, but JSONForms does not turn it into dynamic UI at all, and JSONForms' own rules work in detail layouts but not in its table view and cannot reference fields outside the array.

:::

## What this means in business terms

- **No licence line item.** The entire engine is MIT licensed. There is no per-developer fee, no production domain fee, no paywalled "enterprise" logic tier. For public-sector and procurement-sensitive contexts, a clean MIT dependency is itself an advantage.
- **No vendor lock-in on your UI.** Your forms look like your product because they are built from your components. If you ever leave, your components and your form definitions (plain objects) remain yours.
- **Lower cost of change.** The expensive part of forms is not building them once, it is changing them for years. Centralised, readable form definitions make change requests cheap and testable.
- **Fit for regulated work.** If your domain speaks XSD (government data exchange, insurance standards such as SIVI AFD or ACORD, customs and tax schemas), this model can represent your forms without flattening them into something lossy.

## When not to use it

In the spirit of an honest comparison:

- If you need a **drag-and-drop form builder for non-developers**, this library does not ship one. Tools like SurveyJS or Form.io sell exactly that.
- If you need **hosted form infrastructure** (storage, submission APIs, dashboards), this is a rendering and logic engine, not a platform.
- If your forms are **three flat fields and a submit button**, plain components with vee-validate are enough. This library starts paying off when forms repeat, branch, and carry rules.

## Next steps

- See it handle a real scenario on the [home page demo](/) or in the [examples](/examples/)
- Have a developer skim [Getting Started](/guide/getting-started): the three-part setup takes minutes to understand
- Read [How It Works](/guide/how-it-works) for the architecture behind the separation
