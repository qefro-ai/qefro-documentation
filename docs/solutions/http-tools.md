---
title: "HTTP tools"
description: "Generic Runtime HTTP tools: workspace connections, staff vs customer surfaces, Hub identity, email OTP, and ownership checks. No provider-specific executor code."
sidebar_label: "HTTP tools"
---

# HTTP tools

Marketplace Apps can declare **HTTP tools** in `tools/*.yaml`. Qefro
Runtime runs them through the **generic HTTP executor** against a
**workspace connection** (host + encrypted token). The executor has no
`if provider == "shopify"` branch.

```text
package YAML → FlowRunner → RuntimeAdapter → HTTP executor → upstream API
```

Reference commerce package: [`shopify-runtime`](/docs/solutions/examples/shopify-runtime)
in [qefro-marketplace-apps](https://github.com/qefro-ai/qefro-marketplace-apps).

## Connection

`connections/<name>.yaml` declares auth header type, OAuth URL templates,
scopes, and webhook metadata. It does **not** contain host, token, or
client secret. Those come from **Connect** on the workspace.

The LLM cannot pass `url`, `host`, `access_token`, `email`, `phone`,
`person_id`, `customer_id`, or `workspace_id`. Identity placeholders such
as `{person.email}` are merged from Customer Hub after those keys are
stripped.

## Surfaces

```yaml
access:
  surfaces:
    - staff      # Admin Console / Portal
    # or
    - customer   # WhatsApp, website widget, public API
```

Empty `surfaces` means every channel. Staff shop-wide tools (for example
`list_orders`) must stay `staff`. Customer channels never execute them.

Portal is staff. WhatsApp, widget, and API are customer.

## Hub identity

```yaml
identity:
  require_any:
    - person.email
  collect: email_otp
```

`require_any` lists Hub fields that must exist **before** the HTTP call
(`person.email`, `person.phone`, `person.external_id`). If none are
present, Runtime does not send an unfiltered request.

`collect: email_otp` is the generic collection path when `person.email`
is required and missing:

1. Ask the customer for the email on their orders.
2. Mail a 6-digit code (same verification mailer as widget OTP).
3. On a matching reply, write the verified email on the Hub **Person**.
4. Retry the tool. `{person.email}` is still server-resolved — never an
   LLM parameter.

WhatsApp already has a verified phone. That is not enough for
email-scoped commerce APIs. Do not look up Shopify (or any provider) by
phone in Rust. Later, `require_any: [person.email, person.external_id]`
can admit customers who only have a mapped external id — still through
this metadata.

## Ownership

Query filters (for example `?email={person.email}`) are not sufficient.
`ownership` runs **after** the upstream response and drops or denies
records that do not match Hub identity (email, mapped external id, or
phone on the record).

A customer who supplies someone else's order number still fails
ownership. Tests cover a malicious/incorrect upstream payload.

## Staff vs customer (commerce)

| Tool | Surface | Scope |
| --- | --- | --- |
| `list_products` / `get_product` / `search_products` | all | Catalog |
| `list_my_orders` / `get_my_order` | customer | That Person's orders |
| `list_orders` / `get_order` / `list_customers` / `get_customer` | staff | Shop-wide |

Same Admin API token. Isolation is surface + Hub identity + ownership.

## Related

- [Marketplace Apps collection](/docs/solutions/examples/marketplace-apps)
- [Customer Hub](/docs/developer/customer-hub)
- [Connect Shopify](/docs/user/how-to/connect-shopify)
