---
layout: home

hero:
  name: Vue Dynamic Form
  text: Define your fields once. Render them your way.
  tagline: A schema-driven form engine that handles groups, repeating sections, choices, and validation — so you only write the HTML.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Reference
      link: /reference/
    - theme: alt
      text: Browse Examples
      link: /examples/

features:
  - title: You own the UI
    details: Define your field types once in your own template — the HTML, the components, the styling. The library handles the wiring.
  - title: Complex fields, simple API
    details: Arrays, grouped fields, and mutually exclusive choices work out of the box. No fighting vee-validate's field array API.
  - title: Grows with your needs
    details: computedProps let fields react to other field values — show/hide, change options, override labels — without touching the schema.
---

## What You Get

Vue Dynamic Form separates two things that usually get tangled together: **what your form looks like** and **how it behaves**.

You describe your form as metadata — a plain object tree that says which fields exist, whether they repeat, whether they're part of a group or a mutually exclusive choice, and what validation rules apply. The library reads that description and takes care of the rest: generating field paths, managing repeating sections, tracking which choice branch is active, and keeping everything in sync with `vee-validate`.

Your template layer stays completely under your control. You decide which field types your app supports, what extra properties they need, and what HTML gets rendered.

## A Model Built for Real Complexity

The metadata model is inspired by XSD — one of the most battle-tested formats for describing structured data. That heritage means the model can express almost any form scenario you'll encounter: required fields, length limits, allowed values, repeating groups, conditional branches, and nested structures. You don't need to know anything about XSD to use it. The benefit is that the hard edge cases were already thought through.

## Live Demo

<ClientOnboardingPlannerExampleContext />

## What You Will Find Here

- `README.md` at the repository root for GitHub-friendly orientation
- `packages/core/README.md` for the detailed package explanation
- this VitePress manual for guided usage plus interactive demo forms

## Next Steps

- Start with [Getting Started](/guide/getting-started)
- Read the step-by-step [Guide](/guide/define-metadata)
- Browse the full [Reference](/reference/)
- Explore [Examples](/examples/)
