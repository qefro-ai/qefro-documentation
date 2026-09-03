---
title: "Customer Hub"
description: "Use ctx.customer, timeline, membership, and consent instead of building a parallel CRM."
sidebar_label: "Customer Hub"
---

# Customer Hub

Use Customer Hub for **people identity**. Keep domain entities (reservations, invoices, quotes) in the application.

## `ctx.customer`

```typescript
resolve(input?: CustomerIdentityInput): Promise<HubCustomer | null>  // resolve-or-create
lookup(input?: CustomerIdentityInput): Promise<unknown | null>       // no create
lookupByPhone(phone?: string): Promise<unknown | null>
create(input: CustomerIdentityInput): Promise<HubCustomer | null>
update(input: CustomerUpdateInput): Promise<HubCustomer | null>
note(content: string, options?: { author_id?: string }): Promise<void>
tag(name: string, options?: { color?: string }): Promise<void>
authorize(options?: { method?: string }): Promise<unknown>
get<T>(): T | undefined
require<T>(): T
```

Identity fields accepted include `phone` / `phone_number` / `whatsapp_number`, `email`, `display_name` / `name`, `id`, `channel`, `identifier`.

Hub methods talk to the platform via `platform.customer` when Customer Hub is enabled for the invoke.

## Timeline / membership / consent

```typescript
ctx.timeline.append({ event_type, payload?, customer_id?, source? })
ctx.membership.attach({ customer_id?, solution_id?, role?, metadata? })
ctx.membership.detach({ … })
ctx.consent.grant({ purpose, customer_id?, metadata? })
ctx.consent.revoke({ purpose, customer_id?, metadata? })
```

## External CRM provider (optional)

```javascript
app.customer({
  async lookup(ctx) { /* return customer or null */ },
  async authorize(ctx) { /* return AuthOutcome via auth builder patterns */ },
});
```

Use for connector CRMs. Prefer Hub `resolve` for Qefro-native apps.

## Feature flags (SDK helpers)

SDK exports `isCustomerHubEnabled` / `isCustomerHubOptional` based on `QEFRO_CUSTOMER_HUB_*` env flags — Hub participation is optional.

## When to use Hub vs app data

| Use Customer Hub | Keep in app storage / ERP |
| --- | --- |
| Who the person is | Reservations, orders, SKUs |
| Phone / email / tags / consent | Quotation line items |
| Cross-app identity | Kitchen tickets, ledger entries |

## Person mutations

`tool.invoke` may include a `person` snapshot. Handlers can queue `person_mutations` on `result` for the runtime to apply. Prefer Hub APIs on `ctx` when available.

## Metadata HTTP tools (not SDK)

Marketplace HTTP tools do **not** call `ctx.customer`. Qefro Runtime
resolves the conversation **Person**, injects `{person.email}` (and
phone / mapped external id), and can collect a missing email with
`identity.collect: email_otp` on WhatsApp/widget. See
[HTTP tools](/docs/solutions/http-tools).
