# Angle: checkout-complexity

Anchor source: Baymard Institute (the recognized authority on checkout UX; 150,000+ hours of testing).

## Key verified statistics (fetched directly from baymard.com, 2026-10-23)

Source: https://baymard.com/research-articles/checkout-flow-average-form-fields

- Average checkout flow for a new user: **5.1 steps**, **11.3 form fields** (2024; down from 12.7 in 2019).
- **17% of users have abandoned an order due to checkout complexity.**
- Ideal: most sites need only **8 form fields** total.
- Baymard's five field-reduction tactics: single Full Name field (89% of sites fail), hide Address Line 2 behind a link (75% fail), hide coupon code behind a link (35% fail), hide billing address when same as shipping (24% fail), delay account creation until after order (84% fail).

Also relevant: https://baymard.com/research/checkout-usability and https://baymard.com/blog/checkout-optimization-from-16-fields-to-8

## Canonical structure of a modern (Shopify-style one-page) checkout

Sources: https://www.shopify.com/enterprise/blog/one-page-checkout, https://www.charle.co.uk/articles/shopify-one-page-checkout/

1. **Express checkout strip**: Shop Pay / PayPal / Google Pay buttons, OR continue with the manual form.
2. **Contact**: email (plus optional phone), newsletter opt-in.
3. **Delivery address**: country, name, street + house number, apartment (optional, hidden), postal code, city, company (optional), phone.
4. **Shipping method**: mutually exclusive options (standard / express / pickup point), price per option, sometimes a nested field (pickup point selector).
5. **Payment**: mutually exclusive branches, each with its own fields: card (number, expiry, CVC, name on card), iDEAL (bank select), PayPal (no fields), invoice/Klarna (date of birth etc.).
6. **Billing address**: "same as shipping" toggle; unchecking reveals a full second address group.
7. **Extras**: discount code(s), gift wrap + gift message, order notes.

This is the structure that both Baymard's ideal and Shopify's one-page checkout converge on.
