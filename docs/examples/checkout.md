---
aside: false
pageClass: checkout-page
---

# A complete webshop checkout, Shopify-style

One typed metadata tree, one template component, and the most consequential form on the web. This example rebuilds the _structure_ of a modern one-page checkout, not its branding, and ends with a split-payment finale that no other page here demonstrates.

Years ago, a usability team at a major retailer studied why so many shoppers filled a cart and never bought. The culprit was a single button next to the sign-in form that read "Register". First-time buyers assumed they had to create an account to purchase, so they abandoned. The team replaced it with a "Continue" button and a quiet line of text: you can check out as a guest. Sales rose 45% in the first month, an additional 300 million dollars in the first year. Jared Spool told this story for years and never named the retailer, so neither do we.

The lesson is not about one button. It is that checkout is the highest-stakes form on the web, and small structural choices move real money. [Baymard Institute](https://baymard.com/research-articles/checkout-flow-average-form-fields) finds the average checkout asks for **11.3 fields across 5.1 steps**, while an optimized checkout needs only about **8 fields**, and that **17% of shoppers have abandoned a purchase** purely because checkout was too long or complicated.

Few companies talk about this more publicly than Shopify. According to [a study Shopify commissioned from one of the Big Three consulting firms](https://www.shopify.com/partners/blog/shopify-best-checkout), its checkout converts about **15% better on average, and up to 36% better**, than comparable checkouts, with Shop Pay lifting conversion by up to 50% against guest checkout. Those are vendor-published figures from an unnamed study, so treat them as Shopify's own claim rather than independent fact. Either way, this is the checkout we rebuild below, as the benchmark worth matching.

::: tip What you are looking at
Everything in the live form below is rendered by the library from one metadata tree through one neutrally styled template. We rebuild the checkout's structure, not Shopify's visual design or logo. Payment inputs are inert demo fields, called out again next to them below.
:::

## The checkout, live {#live-form}

The first decision is a `choice`: check out with an express wallet, or enter details manually. Picking a branch is all it takes for the engine to mount that branch and relax validation on the other. From there the form walks through contact details, a delivery address with per-country postal validation, an optional business and VAT section, shipping, payment, and an optional gift message, with a sticky order summary reacting live on the right.

This checkout intentionally stays one page, matching the benchmark it rebuilds. For a page that validates one step at a time with `validateSection()` instead, see the [Wizard](/examples/wizard) and [Client Onboarding Wizard](/examples/advanced) examples.

<CheckoutFormExample />

::: warning Ordering is UI-level, not XSD
Open "Split your payment across multiple methods" above to see the finale: a repeatable, ordered list of payment sources where reordering redistributes the remaining amount live. The display order and the per-row `order` value it writes are library behavior layered on the shape; they have no equivalent in `<xs:choice>` occurrence semantics.
:::

## One metadata tree, one template {#one-metadata-tree}

Everything above is declarative. The engine walks the tree, classifies each node by its shape, and renders it through the neutral template below. The rest of this page walks through the metadata behind it, the same way the other advanced examples do.

## Metadata walkthrough {#metadata-walkthrough}

Since this page sets `aside: false`, there is no "On this page" outline. Use this short list instead:

- [Express vs. manual checkout](#express-vs-manual)
- [Delivery address and per-country postal validation](#delivery-address-postal)
- [Conditional visibility and validation](#conditional-visibility)
- [Shipping method](#shipping-method)
- [Payment method](#payment-method)
- [Split payment, the finale](#split-payment)
- [Gift message](#gift-message)
- [What It Demonstrates](#what-it-demonstrates)
- [How It Works](#how-it-works)
- [Related Source](#related-source)

### Express vs. manual checkout {#express-vs-manual}

The top-level decision is a `choice` with `preserveOnSwitch: true`, so switching to express and back to manual restores whatever was already typed. The express branch has no fields of its own, so it declares a [`presenceValue`](/reference/field-metadata#presencevalue): the value written into the form the moment the branch is picked, which is what lets a branch with nothing to fill in pass validation and stay selected when saved values are loaded back in:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#express-manual-choice{ts} [CheckoutFormExample.vue]

### Delivery address and per-country postal validation {#delivery-address-postal}

The country field carries an `xsd_enumeration` restriction. The postal code field reads its sibling country through `computedProps`, deriving the path with `thisField.parent.path` rather than a hard-coded one, which is exactly what lets the same address fragment mount again at the billing path further down:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#per-country-postal{ts} [CheckoutFormExample.vue]

### Conditional visibility and validation {#conditional-visibility}

The business toggle reveals a company name and a VAT number, both hidden and not required until the toggle is on:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#business-vat-toggle{ts} [CheckoutFormExample.vue]

The billing "same as shipping" toggle reuses the exact same address fields, by spreading the function that builds them a second time:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#billing-reuse{ts} [CheckoutFormExample.vue]

### Shipping method {#shipping-method}

A `choice` whose pickup branch nests a pickup-point field; home delivery has no fields of its own:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#shipping-choice{ts} [CheckoutFormExample.vue]

### Payment method {#payment-method}

Four branches, four different flavours: plain text inputs, a bank `<select>`, an empty redirect-only branch, and an installment-plan enumeration:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#payment-choice{ts} [CheckoutFormExample.vue]

### Split payment, the finale {#split-payment}

Here is the shape no other page here covers: a repeatable ordered `choice` (`maxOccurs > 1` combined with `choice`). Split payment is opt-in, so it never inflates the default field count. Add payment sources (gift card, voucher, card, PayPal); they apply top to bottom. Every row is a live occurrence of the choice, not a static line item: each one seeds a starting value by occurrence index (a second gift card gets a different code and amount than the first) and stays fully editable, with its own per-occurrence validation (`splitPayment.giftCard[0].amount` and `splitPayment.giftCard[1].amount` are separate fields with separate errors). Change an amount and the ledger redistributes the remainder live. Each row shows the amount it covers and what remains after it, and reordering rewrites the two affected occurrences' `order` values directly, building on the repeatable ordered choice and persisted `order` the [Choices](/examples/choices) page demonstrates:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#split-payment-choice{ts} [CheckoutFormExample.vue]

### Gift message {#gift-message}

An optional field with an `xsd_maxLength` restriction, revealed behind a toggle (one of the Baymard reduction tactics) and paired with a character counter that lives in the template, not the engine:

<<< @/.vitepress/theme/components/CheckoutFormExample.vue#gift-message-field{ts} [CheckoutFormExample.vue]

## What It Demonstrates

- A top-level `choice` for express vs. manual checkout, shown with minimal inert UI
- Email `xsd_pattern`, and a country `xsd_enumeration` that drives per-country postal validation through `computedProps`
- Conditional visibility and validation: the business and VAT toggle, and the billing "same as shipping" toggle
- A shipping `choice` with a field nested only on the pickup branch
- A payment `choice` with four branch flavours: card inputs, a bank select, an empty branch, an enumeration select
- The finale: a repeatable ordered `choice` (`maxOccurs > 1`) for split payment, with editable per-occurrence fields that validate independently, a computed per-row remaining amount, template-driven reordering, and a hard cross-field rule that the rows cover the order total
- A gift message with `xsd_maxLength` and a character counter

## How It Works

The split-payment list is a `choice` with `maxOccurs > 1` and `explicitChoiceSelection`. Each source is a branch; adding one pushes an occurrence whose fields register like any other (`splitPayment.giftCard[0].amount`), so editing an amount flows through the normal field-write path and every derived figure follows. The per-row remaining amount is a plain computed value inside the ledger row component, reading the form's values through vee-validate's `useFormContext` rather than through `computedProps`; the container's `computedProps` hides the section, and each row field's `computedProps` only seeds a starting value by occurrence index, leaving the field editable. The row rules themselves are closures that stand down when split payment is switched off, so a hidden, half-edited row can never block submit. The [Choices](/examples/choices) page demonstrates the underlying repeatable ordered choice and its persisted `order` value; the reorder control itself, which writes the two affected occurrences' `order` values directly through the normal field-write path, is this page's own addition on top of that mechanism. No new engine primitive is involved.

Moving a remainder-covering source (card or PayPal) above a fixed source can push the running total past the order total. Every displayed amount clamps at 0 in that case, and the amber "still unassigned" readout turns into a rose banner naming the exact overshoot, blocking submit until the rows are reordered or a source is removed. Submission itself goes through vee-validate's `handleSubmit`, which re-validates the whole form before placing the order; the place-order button's disabled state reads the live aggregate `meta.valid`. The coverage check is backed by a hidden field whose own validation message is what the banner shows, so it stays correct even if the live readout has not re-rendered yet.

## Related Source

- [CheckoutFormExample.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/CheckoutFormExample.vue) (the metadata tree)
- [CheckoutFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/CheckoutFormTemplate.vue) (the checkout's own neutral template component)
- [Choices](/examples/choices) for the repeatable ordered choice mechanics
- [Wizard](/examples/wizard) and [Client Onboarding Wizard](/examples/advanced) for the `validateSection()` step pattern (this page is intentionally one page, matching the benchmark it rebuilds)
