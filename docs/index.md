---
layout: home

hero:
  name: Vue Dynamic Form
  text: Complex forms, without the complexity.
  tagline: An open source Vue form engine that keeps your business rules in one readable place, while the design stays fully yours. Built on top of vee-validate.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why This Library
      link: /guide/why
    - theme: alt
      text: Browse Examples
      link: /examples/

features:
  - title: Your rules, in one place
    details: Which fields exist, when they show, what makes them valid. The whole behaviour of a form lives in one readable definition instead of being scattered through UI code, so changes stay cheap and safe for years.
  - title: Your design, untouched
    details: The library renders nothing of its own. You bring your components, your HTML, your brand, your accessibility standards. Reskin the same form per client or design system without touching the logic.
  - title: The hard forms, built in
    details: Repeating sections where each row has its own logic, either/or branches, nested groups, back-office-grade validation. The cases where hand-built forms and most form tools break down are first-class here.
---

## The Problem It Solves

The forms that matter are never three fields and a button. They repeat ("add another applicant"), they branch (person *or* company), and they carry rules ("if business, require a VAT number"). Hand-built, those rules end up scattered through the UI code until nobody can safely answer "what happens if I change this field?"

Vue Dynamic Form separates **how a form behaves** from **how it looks**. The behaviour lives in one plain, readable definition, built on a model inspired by XSD (the schema language behind government, insurance, customs, and tax systems), so the hard cases were battle-tested long before this library existed. The look is built entirely from your own components on top of `vee-validate`, the most widely used Vue validation library. The whole engine is MIT licensed: no per-developer fees, no production licences, no paywalled features.

Curious how it stacks up against SurveyJS, FormKit, Form.io and the JSON Schema tools? Read [Why Vue Dynamic Form](/guide/why).

## Live Demo

<FormExampleClientOnboardingPlannerContext />

## Fields That Adapt Automatically

Most form logic comes down to "if this field has a certain value, show/hide/require/change that other field", and it usually ends up scattered across `v-if`s, computed properties, and `watch()` calls. Here it lives with the field itself: the **form definition decides when** something happens, and your **template decides what that looks like** in HTML.

::: code-group

```ts{8} [Form definition: the when]
const fields: Metadata[] = [
  { name: 'accountType', type: 'select', ... },
  {
    name: 'vatNumber',
    type: 'text',
    fieldOptions: { label: 'VAT Number' },
    computedProps: [
      (field) => { field.disabled = accountType.value !== 'business' }
    ]
  }
]
```

```vue{4} [Your template: the how]
<template #text-input="{ fieldMetadata, fieldContext: { value, handleChange } }">
  <input
    type="text"
    :disabled="fieldMetadata.disabled"
    :value="value.value"
    @input="handleChange"
  >
</template>
```

:::

Vue tracks whatever the function reads and re-runs it when that changes, no `watch()` needed. And `disabled` isn't a built-in: it's a property you declare in your template's metadata contract, so the vocabulary of behaviours is entirely yours. Components stay clean and reusable; the form definition is the single source of truth for behaviour.

[Learn how →](/guide/dynamic-fields)

## Next Steps

- Understand the value in five minutes: [Why Vue Dynamic Form](/guide/why)
- Start building with [Getting Started](/guide/getting-started)
- Read the step-by-step [Guide](/guide/define-metadata)
- Browse the full [Reference](/reference/)
- Explore [Examples](/examples/)
