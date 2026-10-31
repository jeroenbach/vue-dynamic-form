# Brief: a famous, complex checkout form as the docs' advanced example

## Refined question

Which real-world webshop checkout form should we rebuild with `@bach.software/vue-dynamic-form` as the advanced example on the docs site? The winner must satisfy three things at once:

1. **Complex enough** to exercise the library's full surface: choice branches (payment methods), repeatable arrays (order lines, multiple addresses), conditional fields via `computedProps` (billing same as shipping, business vs consumer), and layered XSD-style validation.
2. **Widely known**: a developer landing on the docs should recognize the checkout instantly by brand name.
3. **An established engineering reputation**: public evidence (engineering blogs, patents, famous UX case studies, conversion claims) that this checkout is considered a benchmark, so the docs can credibly say "rebuilt with our library."

## Scoping decisions (made autonomously, 2026-10-23)

- Jeroen was not available for live scoping; the raw question already fixes the deliverable (a ranked list plus a "show this first" recommendation) and the quality bar (the more known, the better).
- Geography: global brands preferred over Dutch-only ones (bol.com, Coolblue) because the docs audience is international; Dutch examples noted as alternates since the library's market research targets NL/EU.
- Scale: small. Solo research with self-verification of load-bearing claims.

## Mode decision

**SOLO.** Reasoning: 3 to 4 interdependent angles, small source volume, and the decisive step is judgment (mapping checkout structure onto our metadata shapes), not coverage. Delegating would duplicate library context into every agent for no breadth gain. Load-bearing claims (conversion statistics, famous case studies, patent facts) get verified against independent sources before being stated as fact.

## Angles

| Key | Focus |
|---|---|
| famous-checkouts | Which checkout flows are household names among developers: Amazon, Shopify Shop Pay, Stripe Checkout, Booking.com, Apple, others |
| engineering-reputation | Hard evidence each candidate is treated as an engineering benchmark: patents, engineering blog posts, famous case studies (e.g. the "$300 Million Button"), published conversion claims |
| checkout-complexity | What a realistically complex checkout contains: field inventory, branches, steps; Baymard Institute research as the anchor source |
| library-fit | Map each candidate's structure onto DynamicForm metadata shapes (choice, array, group, computedProps, validation); done from repo knowledge, no web needed |

## Ranking formula

score = brand recognition x engineering reputation (verifiable, citable) x coverage of our metadata shapes x buildability as a static docs example (no real backend, no login wall)
