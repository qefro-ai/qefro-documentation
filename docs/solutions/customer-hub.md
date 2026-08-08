---
title: "Customer Hub"
description: "Resolve and enrich customers with ctx.customer — shared identity without owning CRM storage in your app."
sidebar_label: "Customer Hub"
---

# Customer Hub

Customer Hub is the platform identity plane for people your apps talk to
(guests, patients, clients). Your app keeps **domain** documents in
`ctx.storage`; Hub holds **shared** customer identity when enabled.

## Mental model

```text
WhatsApp / widget message
  → runtime / ACS
  → your /qefro tool
  → ctx.customer.resolve({ phone })   # optional binding
  → ctx.storage.*                     # your appointments / orders / …
```

| Concern | Where |
|---------|--------|
| Display name, phone, tags, consent | Customer Hub (when enabled) |
| Reservations, picks, invoices | Your `ctx.storage` collections |
| Timeline notes (optional) | `ctx.timeline.append` when Hub + binding exist |

## Use it in the SDK

Starter pattern (soft-fail if Hub is off):

```js
async function resolveCustomer(ctx, phone) {
  if (!phone || typeof ctx.customer?.resolve !== 'function') return null;
  try {
    return await ctx.customer.resolve({ phone_number: phone });
  } catch (err) {
    ctx.logger?.warn?.('customer resolve skipped', err?.message || err);
    return null;
  }
}
```

When creating a domain record, attach `customer_id` if resolve succeeded.
Never require Hub for core booking/ops paths — pilots often run Hub-off.

## Platform inject

ACS / tool invoker injects `platform.customer` (and related bindings) when
Customer Hub is configured for the workspace. Your SDK maps that to
`ctx.customer`.

Ops flags (deployment-specific): Hub URL, enable/optional toggles on the
managed app environment. If Hub is optional and down, tools should still
succeed.

## What not to do

- Do not store a parallel “customers” SoR that duplicates Hub as source of truth
  for identity (local CRM tables for *app-specific* attributes are fine).
- Do not put WhatsApp Business numbers in install settings — workspace
  **Customer channels** owns the number; booking links use `?n=` from
  `ctx.platform.channels.whatsapp`.
- Do not call Hub HTTP APIs from the browser; stay inside `ctx.*`.

## Related

- Platform deep-dive: `qefro-plugin-platform/docs/customer-hub-integration.md`
- [Build your first app](/docs/solutions/build-your-first-app)
- [Marketing](/docs/solutions/marketing) (audiences often read Hub tags)
