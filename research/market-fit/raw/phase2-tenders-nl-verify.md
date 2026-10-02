# Phase 2 lead verification: NL tenders / Open Formulieren repeating-groups gap

Verified 2026-09-30.

## 1. Epic #4942 "Herhalende groep" (Den Haag / Utrecht / Dimpact)
- URL: https://github.com/open-formulieren/open-forms/issues/4942
- Verdict: live
- Notes: Confirmed open, opened 2024-12-17. Labels present exactly as claimed: `owner: den-haag`, `owner: dimpact`, `owner: utrecht`, `topic: repeating group`, `waiting for approval`. Umbrella epic tracking 11+ related repeating-group issues (validation, file uploads, logic, UI positioning). Matches the lead description closely.

## 2. Issue #2441 "Repeating groups: No possibility to use logic for each item in a group"
- URL: https://github.com/open-formulieren/open-forms/issues/2441
- Verdict: live
- Notes: Confirmed open, opened 2022-12-07, still unresolved as of 2026-09-30 (nearly four years). Labels: `discuss`, `owner: utrecht`, `topic: form renderer`, `topic: repeating group`. Content matches: logic cannot target fields inside individual repeating-group items even though dot-path references like `RepeatingGroup.0.FieldA` exist.

## 3. Issue #6619 "missing support for showWhenEmpty in new renderer"
- URL: https://github.com/open-formulieren/open-forms/issues/6619
- Verdict: misdescribed
- Notes: Issue is real, open, dated 2026-09-03, reporter handle `justiandevs`, who did offer "We can help build a fix for this" — that part checks out. However the title in the lead ("missing showWhenEmpty in new renderer") is correct but the lead's framing overstates confirmed attribution: the issue body itself does not name Delta10 or Gemeente Ede anywhere; it only contains "Moerdijk acceptation" in a customer-reference field, not prose confirming Gemeente Moerdijk by name. The link between `justiandevs` and Delta10, and the Moerdijk connection, is an inference from the GitHub handle/field, not stated in the issue text. Treat the Delta10/Moerdijk identification as plausible but unconfirmed from this source alone.

## 4. Delta10 — Open Formulieren solutions page
- URL: https://www.delta10.nl/solutions/open-formulieren
- Verdict: misdescribed
- Notes: Page exists and confirms Delta10 positions itself as an implementation partner ("Delta10 begeleidt gemeenten stap voor stap bij de functionele en technische implementatie van Open Formulieren"). However the page itself does **not** mention Gemeente Ede or Gemeente Moerdijk anywhere — those client references come from elsewhere (a separate blog post and the GitHub issue #6619 customer field respectively), not from this URL. The lead's core claim (Delta10 = Open Formulieren implementation partner) is accurate; the specific municipality evidence is not on this page.

## 5. xxllnc x Maykin partnership announcement
- URL: https://xxllnc.nl/nieuws/xxllnc-start-samenwerking-met-maykin
- Verdict: live
- Notes: Page exists, confirms xxllnc (commercial vendor) partnering with Maykin to integrate/improve Open Formulieren within xxllnc's platform, framed around Common Ground principles. No publication date on the page itself, but content is forward-looking ("coming months") and consistent with an active, current partnership. No signal it is stale/closed.

## 6. Dimpact — Open Formulieren milestone article
- URL: https://www.dimpact.nl/nieuws/mijlpaal-voor-open-formulieren-bouw-open-source-oplossing-gestart/
- Verdict: stale
- Notes: Page exists but is dated 2021-06-25 (over 5 years old), announcing that Maykin won the original procurement and that the solution would launch "eind 2021." This is the origin-story article, not evidence of Dimpact's ongoing/current funding role. The lead's claim that Dimpact is "the recurring owner label across the repeating-group backlog" is independently true (confirmed via issue #4942's `owner: dimpact` label), but this specific URL only supports Dimpact's historical involvement in 2021, not a current 2026 funding commitment to the repeating-groups epic. Use issue #4942 itself, not this article, as the evidence citation for Dimpact's current stake.

## Summary
| # | Lead | Verdict |
|---|------|---------|
| 1 | Epic #4942 | live |
| 2 | Issue #2441 | live |
| 3 | Issue #6619 (Delta10/Moerdijk) | misdescribed — attribution to Delta10/Moerdijk not confirmed by the issue text itself |
| 4 | Delta10 partner page | misdescribed — page doesn't mention Ede/Moerdijk; partner status itself confirmed |
| 5 | xxllnc x Maykin | live |
| 6 | Dimpact milestone article | stale — 2021 origin article, not current funding evidence |
