# Final report: which checkout to rebuild as the docs' advanced example

## Thesis

Rebuild a **Shopify-style one-page checkout**. It is the only candidate that is simultaneously world-famous among web developers, backed by citable engineering-benchmark claims (a Big Three consulting study, published conversion numbers, Shopify's own "larger teams working just on checkout than some platforms have on their entire commerce solution"), and structurally rich enough to exercise every metadata shape the library has: choice, array, group, computedProps, and layered XSD validation. Baymard Institute's research supplies the independent, non-vendor framing ("the average checkout has 11.3 fields across 5.1 steps; 17% of users have abandoned a purchase because of checkout complexity"), and the Jared Spool "$300 Million Button" story is the perfect opening anecdote.

## Ranking

Formula: brand recognition x citable engineering reputation x coverage of our metadata shapes x buildability as a static docs example. All four factors must be non-trivially present; a zero in any kills the candidate.

| # | Candidate | Recognition | Citable reputation | Shape coverage | Buildability | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Shopify one-page checkout** | Very high (every web dev knows it) | Big Three study: converts 15% better on average, up to 36%; Shop Pay up to +50% vs guest checkout (vendor-published, attribute carefully) | **Full**: choice (payment, shipping, express), array (discount codes), groups, computedProps (billing toggle, VAT, postal format), all validation rules | Fully static, no login wall | **Build this** |
| 2 | Stripe Checkout | Very high among devs | "Obsess over every detail" engineering narrative (vendor blog); strong anecdotal developer admiration | Partial: it is a payment form; no shipping method, minimal address, no arrays | Static | Alternate; mention in docs copy |
| 3 | Amazon checkout / 1-Click | Maximum brand recognition | 1-Click patent (1999 to 2017) is a legendary piece of checkout history | Weak: the fame is the absence of a form; the real multi-page form is not admired | Awkward | Use as anecdote only |
| 4 | "$300M Button" retailer | The story is famous, the brand is officially unnamed | The most cited checkout UX case study ever (guest checkout: +45% purchases, +$300M year one) | It is a login wall, not a form structure | n/a | Opening anecdote only; never name Best Buy (unverified) |
| - | Booking.com, Apple, bol.com/Coolblue | mixed | thin or dark-pattern-tainted or NL-only | mixed | mixed | Dismissed (see raw/famous-checkouts.md) |

## The recommended docs example, concretely

One page: **"Advanced example: a complete webshop checkout"**, live form on top, metadata walkthrough below. Narrative arc for the copy:

1. Open with the $300M Button story (a major retailer, +45% purchases from one form change) and Baymard's numbers: checkout forms are the highest-stakes forms on the web.
2. State the benchmark: Shopify treats checkout as its crown jewel and a commissioned Big Three study found it converts up to 36% better than competitors. This is the structure we rebuild.
3. Show the form, then reveal the entire thing is one typed metadata tree plus one template component.

Sections and the shape each demonstrates (full mapping in raw/library-fit.md):

- Express checkout vs manual form: `choice`
- Contact: email `xsd_pattern`, optional phone
- Delivery address group: nested paths, country `xsd_enumeration`, postal code validation that switches format per country via `computedProps`
- Business toggle revealing a VAT field: conditional visibility plus conditional validation
- Shipping method: `choice` with a nested pickup-point field
- Payment method: the flagship `choice` demo, card vs iDEAL vs PayPal vs Klarna, each branch with its own fields and rules
- Billing "same as shipping" toggle: `computedProps` revealing a reused address subtree
- Discount codes: repeatable array (`maxOccurs > 1`)
- Gift message: conditional field with `xsd_maxLength`
- Mobile wizard variant: `validateSection()` per checkout step

Keep the visible field count near Baymard's ideal of 8 by following their five reduction tactics (single full-name field, hidden address line 2, coupon behind a link, billing hidden behind the toggle, no forced account): the example then demonstrates not just that we can build a complex checkout, but that we can build the *correct* one, with the complexity living in the metadata instead of in the user's face.

## What to show first

The checkout example should lead the advanced-examples section, and within the page the **payment method choice branch** should be the first thing visitors see working, because switching between card, iDEAL, and PayPal with per-branch fields and validation is the single most impressive visual proof of the metadata-driven approach.

## Addendum (2026-10-23): repeatable ordered choice via split payment

Jeroen asked where the repeatable ordered choice shape (`maxOccurs > 1` + `choice`) can be demonstrated. Decision: extend the payment section into **split payment**, a list of payment sources (gift card / voucher / credit card / PayPal) applied in order, each row showing a computed "remaining" amount that depends on the rows above it. Reordering rows visibly redistributes the remainder, making order a functional behaviour instead of cosmetic drag handles. This becomes the finale of the docs page, escalating from the plain payment choice. Alternates considered: an ordered promotions list (codes/gift cards/points, stacking order affects the total) and editable order lines (order only cosmetic, undersells the feature). Note: ordering semantics live in the UI and `computedProps`, not in the XSD occurrence model.

## Caveats

- The 15%/36%/50% numbers are vendor-published (study commissioned by Shopify from an unnamed Big Three firm, methodology undisclosed). Always attribute, never state as independent fact.
- Never name Best Buy as the $300M retailer; Spool only ever said "a major retailer".
- Card and iDEAL inputs in the example are inert demo fields; say so on the page (no PCI concerns, but readers should not copy them as a real payment integration).
- Do not clone Shopify's visual design or logo; rebuild the *structure* and say "Shopify-style". The template component should have its own neutral styling.

## Suggested first week

| Day | Action |
|---|---|
| 1 | Decide placement in docs nav (new "Examples" section vs under Guide) and run it through `/spec:feature` since it is a full docs page with UI |
| 2-3 | Metadata tree + checkout template component (payment choice branch first) |
| 4 | Conditional behaviours: billing toggle, VAT, per-country postal validation, discount code array |
| 5 | Docs copy with the verified citations above, screenshots, Cloudflare preview check |
