# Angle: library-fit

Mapping the canonical Shopify-style checkout structure onto DynamicForm metadata shapes (from repo knowledge, no web needed). Verdict: a Shopify-style one-page checkout exercises every shape the engine has, which no other candidate does.

| Checkout section | Metadata shape | Library feature exercised |
|---|---|---|
| Express checkout vs manual form | `choice` | `DynamicFormItemChoice`, `xsd_choiceMinOccurs` |
| Contact (email, phone, newsletter) | leaf fields | `xsd_required`, `xsd_pattern` (email), optional fields |
| Delivery address | group (`children`) | nested paths (`delivery.street`), group slots |
| Country select | leaf | `xsd_enumeration` |
| Postal code format per country | leaf + `computedProps` | validation that reacts to a sibling field (NL `1234 AB` vs DE 5 digits), `update:computedField` |
| Business customer toggle revealing VAT number | leaf + `computedProps` | conditional visibility plus conditional `xsd_pattern` |
| Shipping method (standard/express/pickup) | `choice` | branch with a nested field (pickup point selector); price shown per option via template slots |
| Payment method (card / iDEAL / PayPal / Klarna) | `choice` | the flagship demo: each branch has different fields and validation (card number `xsd_pattern` + `xsd_length`, expiry pattern, CVC `xsd_length`; iDEAL bank `xsd_enumeration`; PayPal empty branch) |
| Billing address "same as shipping" | `computedProps` + group | toggle hides/reveals a whole address group; demonstrates reusing one metadata subtree twice |
| Discount codes | `maxOccurs > 1` | `DynamicFormItemArray`, add/remove rows, `xsd_minOccurs`/`xsd_maxOccurs` |
| Gift wrap + gift message | leaf + `computedProps` | conditional field with `xsd_maxLength` (character counter in template) |
| Wizard-style section validation (mobile) | n/a | `useDynamicForm().validateSection()` per checkout section |

Buildability notes:
- Fully static: no backend needed; payment branches just collect values, submit shows the typed result object.
- Card/iDEAL fields are fake inputs (we never process payments), which should be stated on the docs page.
- The template component owns all layout, so the example doubles as the showcase for the template/engine separation: one metadata tree, swappable look.
- Fits the docs as a dedicated "Advanced example: checkout" page with the live form on top and the metadata tree walkthrough below.
