---
aside: false
pageClass: inbox-rules-page
---

# Inbox Rules Builder

Gmail filters, firewall ACLs, routing tables: they all do the same thing. Walk an ordered list of rules top to bottom, and stop at the first one that matches. Move a rule up, and it starts catching messages a rule below it used to catch. The order is not decoration, it is the behavior: first match wins.

The form below is one repeatable ordered `choice`: a single metadata tree, rendered through one template, with no bespoke engine code behind the reorder-and-reroute effect. Each row is a rule with genuinely different fields per condition type. Reorder two rules and the live test inbox on the right re-routes a message the instant the order changes.

::: tip What you are looking at
The test inbox on the right is six fixed, fictional messages, routed entirely in your browser. There is no real mailbox here, no mail server or account is involved, and no rule or message is ever sent anywhere.
:::

This page specializes a shape the library already demonstrates more generically on [Choices](/examples/choices), and that [Checkout](/examples/checkout#split-payment) also shows, opt-in and lower stakes, inside its split-payment section. See [Related Source](#related-source) below for why this page exists as the dedicated showcase for it.

## The rule list, live {#live-form}

Add a rule of any of the four condition types, give it an action, and reorder with the up/down arrows. The rules you build here live only in this page's own memory: no rule set is ever saved anywhere outside your browser tab, and the "mailbox" on the right stays fixed demo data, never a real inbox, no matter what you add.

<InboxRulesExample />

## Metadata walkthrough {#metadata-walkthrough}

Since this page sets `aside: false`, there is no "On this page" outline. Use this short list instead:

- [The rule list, a repeatable ordered choice](#the-rule-list-choice)
- [Four condition branches, four shapes](#condition-branches)
- [The per-rule action](#the-action)
- [The reorder control](#reorder-control)
- [The live routing module](#routing-module)
- [The unreachable-rule check](#unreachable-check)
- [What It Demonstrates](#what-it-demonstrates)
- [How It Works](#how-it-works)
- [Related Source](#related-source)

### The rule list, a repeatable ordered choice {#the-rule-list-choice}

The whole form is one node: `maxOccurs > 1` combined with a `choice`, in explicit selection mode, with `preserveOrder: true` so each occurrence gets a real, reload-surviving `order` field to reorder against:

<<< @/.vitepress/theme/components/InboxRulesExample.vue#metadata{ts} [InboxRulesExample.vue]

### Four condition branches, four shapes {#condition-branches}

Each branch is a genuinely different condition, not a cosmetic relabel: an email leaf with a pattern (From sender), a plain text leaf (Subject contains), a number-plus-unit pair (Larger than), and a branch with no filter field of its own (Has attachment). That last branch still needs `children` for `preserveOrder` to work, so it carries only the shared action block below, which is already enough: no presence marker is written or needed, unlike the checkout's truly childless express/home-delivery/PayPal branches.

<<< @/.vitepress/theme/components/InboxRulesExample.vue#hasattachment-branch{ts} [InboxRulesExample.vue]

### The per-rule action {#the-action}

Every rule carries an action: move to folder, apply label, forward, or delete. It is modeled as one `select` with three companion leaves (`folder` / `label` / `forwardTo`) revealed by `computedProps`, mirroring the checkout's business/VAT toggle. The twist here is that each rule occurrence has its own action, so there is no single shared flag to key a reveal off: each companion field's own `validation` closure reads its own occurrence's action straight off the form, by path:

<<< @/.vitepress/theme/components/InboxRulesExample.vue#action-reveal{ts} [InboxRulesExample.vue]

### The reorder control {#reorder-control}

The up/down buttons write the two affected occurrences' `order` values directly through the normal field-write path, exactly as the checkout's split-payment ledger row does. The engine's `renderedChoiceOccurrences` re-sorts with no remount. The row only decides which pair of occurrences to swap and what their new `order` values should be; the arithmetic itself lives in a pure helper so it stays correct even when `order` values are not contiguous (for example, right after an earlier removal):

<<< @/.vitepress/theme/components/InboxRuleRow.vue#reorder-plan{ts} [InboxRuleRow.vue]

<<< @/.vitepress/theme/components/inboxRoutingMath.ts#plan-reorder-swap{ts} [inboxRoutingMath.ts]

### The live routing module {#routing-module}

A small, pure, synchronous TypeScript module (mirroring the checkout's own ledger math) walks the rules in their current displayed order and returns, per sample message, the first rule that matches and its action. A template-level computed reads the form's values directly, never through `computedProps`, and feeds the result into the inbox panel on every add, edit, remove, or reorder:

<<< @/.vitepress/theme/components/inboxRoutingMath.ts#matches{ts} [inboxRoutingMath.ts]

<<< @/.vitepress/theme/components/inboxRoutingMath.ts#route-inbox{ts} [inboxRoutingMath.ts]

<<< @/.vitepress/theme/components/InboxRulesExample.vue#live-routing{ts} [InboxRulesExample.vue]

The inbox panel itself just renders whatever it is handed, with a muted treatment for "no rule matched" since that is a perfectly valid outcome, never an error:

<<< @/.vitepress/theme/components/TestInboxPanel.vue#routed-badge{vue} [TestInboxPanel.vue]

### The unreachable-rule check {#unreachable-check}

Because order is causally decisive, a rule placed after another rule of the same condition type that already catches everything it would catch can never fire. A derived function reads the live rule list and flags that rule by naming the earlier rule that subsumes it. This never blocks submit: a dead rule is not invalid data, so the result is a display-only flag, never a validation vehicle:

<<< @/.vitepress/theme/components/inboxRoutingMath.ts#find-unreachable-rules{ts} [inboxRoutingMath.ts]

<<< @/.vitepress/theme/components/InboxRuleRow.vue#unreachable-badge{ts} [InboxRuleRow.vue]

## What It Demonstrates

- A repeatable ordered `choice` (`maxOccurs > 1` + `explicitChoiceSelection` + `preserveOrder`) as the entire form, not a footnote
- Four condition branches with genuinely different fields, including a branch with no filter field of its own
- A per-rule action with a conditionally revealed companion field via `computedProps`, specified per occurrence rather than off one shared flag
- Position badges from `globalIndex + 1`, and up/down reordering that writes the affected `order` values directly
- A live side panel routing a fixed test inbox first-match-wins, re-routing on every reorder
- A cross-row unreachable-rule check that warns without blocking submit

## How It Works

The rule list is a `choice` with `maxOccurs > 1`, `explicitChoiceSelection`, and `preserveOrder: true`. Each "Add rule" button pushes an occurrence into its branch's field array; reordering rewrites two occurrences' `order` values and the engine re-sorts `renderedChoiceOccurrences` with no remount, the same technique the [Choices](/examples/choices) page demonstrates generically and the checkout's split-payment ledger already uses end to end.

The action block's companion fields are the one piece that is not a direct carryover: because every rule occurrence has its own action, each companion field's `validation` closure reads its own occurrence's action straight off the form by path, rather than a single module-level flag the way the checkout's business/VAT toggle can afford to.

Routing and the unreachable check both live in one small, pure, framework-free module, read through the form's own reactive values, never through `computedProps`. That keeps the routing math testable on its own, with no form needed, and keeps the engine itself out of the display path entirely. Submit is gated on the form's aggregate `meta.valid`; an unreachable rule never affects it, since a dead rule is dead configuration, not invalid data.

## Related Source

- [InboxRulesExample.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/InboxRulesExample.vue) (the metadata tree and the host)
- [InboxRulesTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/InboxRulesTemplate.vue) (this page's own neutral template)
- [InboxRuleRow.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/InboxRuleRow.vue) (one rule row: reorder, the unreachable badge)
- [inboxRoutingMath.ts](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/inboxRoutingMath.ts) (the pure routing and unreachable-rule module)
- [TestInboxPanel.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/TestInboxPanel.vue) (the sticky inbox rail)
- [Choices](/examples/choices) for the repeatable ordered choice mechanics this page specializes into a single, genuinely consequential form
- [Checkout](/examples/checkout#split-payment)'s split-payment section, the other existing demonstration of a repeatable ordered choice, there as an opt-in finale rather than the whole page
