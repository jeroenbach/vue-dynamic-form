# Angle: famous-checkouts

Searched 2026-10-23 (solo). Question: which checkout flows are household names among developers?

## Candidates found

### Shopify checkout / Shop Pay
- Shopify's own claim page: "Shopify's Checkout is the Best in the World", https://www.shopify.com/partners/blog/shopify-best-checkout
- Third-party study by an unnamed "Big Three" consulting firm (May 2023): Shopify checkout "outpaces the competition by up to 36% and an average of 15%" (5% better than Magento, 12% better than BigCommerce, 36% better than Salesforce Commerce Cloud). Methodology, sample size, date range undisclosed. Secondary coverage: https://www.digismoothie.com/blog/shopify-the-best-converting-checkout
- Shop Pay: "can lift conversion by as much as 50% compared to guest checkout, outpacing other accelerated checkouts by at least 10%"; "over 100 million high-intent buyers are pre-opted into one-click checkout".
- Engineering scale quote (Shopify): "larger teams working just on innovating checkout than some other platforms have on their entire commerce solution"; $3.5M sales per minute at 2022 peak; roughly 10% of US e-commerce.

#### Live checkouts to browse (reference while building the example)
Add any product to the cart, hit checkout, abandon before paying; no account needed.
- https://shopify.supply : Shopify's own hardware store, so the canonical, unmodified checkout.
- https://www.allbirds.com and https://www.gymshark.com : big well-known Shopify stores, same structure.

What to recognize there (maps to our metadata shapes): express wallet buttons (Shop Pay / Apple Pay / PayPal) at the top with an "OR" divider above the manual form (our express/manual `choice`), contact, delivery address with country-dependent postal format, shipping method radio cards, payment method radio cards with per-method fields, a "billing address same as shipping" toggle, discount code behind a field/link, and the order summary beside/below it, all on one page (single scrolling page, not a wizard or accordion).

### Amazon 1-Click
- Patent filed 1999, expired 2017: https://digiday.com/marketing/end-era-amazons-one-click-buying-patent-finally-expires/
- The patent was so valuable Apple licensed it; its expiry is what unleashed the one-click checkout wave (Shop Pay launched 2017).
- Caveat: Amazon's fame is the *absence* of a checkout form (1-Click). Its actual multi-step checkout form is not what people admire. Weaker as a buildable form example.

### Stripe Checkout / Payment Element
- Stripe blog: "Teams of Stripe engineers and designers obsess over every aspect of the checkout page... sweating the details to an extent that would be irrational for nearly any company building their own checkout flow." https://stripe.com/blog/checkout
- Real-time validation trained on millions of transactions; adaptive payment methods. Developer reputation for polish is strong but largely anecdotal/vendor-stated.
- Caveat: Stripe Checkout is a payment form, not a full webshop checkout (no shipping method step, minimal address handling in the base form). Covers fewer of our metadata shapes.

### The "$300 Million Button" (Jared Spool / UIE)
- The most famous checkout UX case study in existence: replacing a forced Register button with Continue (guest checkout) raised completed purchases 45% and added $300M in the first year. https://www.lukew.com/ff/entry.asp?760= and Spool's own retellings.
- Retailer never officially named; widely reported/rumored to be Best Buy, unconfirmed. Treat the brand as unverified.
- Useful as a narrative hook in docs copy (why guest checkout matters), not as a buildable form.

## Dead ends / dismissed
- Booking.com: famous for A/B testing but it is travel booking, not a webshop checkout; also dark-pattern reputation, not something to equal ourselves to.
- Apple Store checkout: admired visually but little citable engineering material.
- bol.com / Coolblue: strong in NL but unknown to the international docs audience; keep as possible localized alternates only.
