---
title: "Example: shopify-runtime"
description: "Metadata Marketplace App for products, customers, and orders — hosting: runtime, generic HTTP tools, no Shopify SDK."
sidebar_label: "shopify-runtime"
---

# Example: shopify-runtime

`shopify-runtime` is a **metadata Marketplace App** for commerce. App id:
**`shopify-runtime`**. Display name: **Shopify**. `hosting: runtime`.

There is no SDK process, no `/qefro` server, and no Shopify SDK, REST
client, GraphQL client, or `ShopifyWebhookServer` in this package.
Credentials never appear in YAML. **Shopify does not use the Qefro SDK**
(SDK remains Focus ERP / Yaaz).

```text
Shopify Marketplace App (metadata only, hosting: runtime)
  → FlowRunner → RuntimeAdapter → Generic HTTP Executor → Shopify Admin API
```

The HTTP executor is **provider-agnostic**. The same path runs the
`http-catalog-runtime` example (a non-Shopify catalog fixture). Restaurant
Pro and Real Estate keep `entity.*` storage tools.

Package path:
`qefro-plugin-platform/docs/examples/shopify-runtime/`.

## What it proves

A commerce app ships as metadata. Chat tools call the **generic HTTP
Runtime**, not Qefro-managed storage and not a Shopify-specific adapter.

```text
manifest + connections + http_tools + entities + workflows + ui
  → qefro app validate / package / install
  → Connect Shopify (workspace OAuth)
  → Qefro Runtime (FlowRunner → RuntimeAdapter → HTTP executor)
```

Chat “find black shoes” starts **search-products** (`search_products`,
`execution: http`). Chat “show my recent orders” starts
**list-recent-orders** (`list_orders`). Host and token come from the
**workspace connection**, never from package URLs or caller parameters.

Contacts stay on the existing Person model (Customer Hub).

## Package layout

```text
shopify-runtime/
├── manifest.yaml
├── connections/
│   └── shopify.yaml          # declaration + OAuth/webhook metadata — no secrets
├── tools/
│   ├── search_products.yaml
│   ├── list_products.yaml
│   ├── get_product.yaml
│   ├── list_customers.yaml
│   ├── get_customer.yaml
│   ├── list_orders.yaml
│   └── get_order.yaml
├── entities/                 # staff UI schema (not the chat execution path)
├── workflows/
│   ├── search-products.yaml
│   └── list-recent-orders.yaml
└── ui/
```

No `src/`, no Dockerfile, no Shopify HMAC server.

## Connection model

`connections/shopify.yaml` names the connection, auth header type, OAuth
URL templates, scopes, and webhook topic → Business Event mapping.
It does **not** contain `base_url`, shop domain, or `X-Shopify-Access-Token`.

**Connect Shopify** (workspace Tools) runs OAuth in Qefro Runtime:

1. Admin enters `your-store.myshopify.com` plus the Shopify app client ID and secret **for this workspace**.
2. Runtime stores an unpredictable, short-lived, one-time `state` bound to
   the workspace and session (app secret encrypted in that state).
3. Shopify redirects to `/api/v1/integrations/http/oauth/callback`.
4. Callback reads workspace from the state store (never from the browser).
5. Code is exchanged over HTTPS on the validated shop host (SSRF policy
   is not weakened). Token is encrypted at rest.
6. A shop already connected to workspace A cannot be claimed by B.

Client id/secret are **per workspace**, entered at Connect. They are not
process env and not in YAML.

SSRF: the executor blocks localhost, private, and metadata addresses.
Allowlist comes from the workspace connection (`*.myshopify.com`).
Redirects are not followed.

Missing OAuth scopes reject tool execution (`required_scopes` on each
HTTP tool). Disconnect revokes the token and deletes credentials.

## HTTP tools

| Tool | Method / path | Scope |
| --- | --- | --- |
| `search_products` | `GET /admin/api/2024-10/products.json` | `read_products` |
| `list_products` | `GET /admin/api/2024-10/products.json` | `read_products` |
| `get_product` | `GET /admin/api/2024-10/products/{id}.json` | `read_products` |
| `list_customers` / `get_customer` | customers.json | `read_customers` |
| `list_orders` / `get_order` | orders.json | `read_orders` |

These are generic HTTP tool specs (`connection`, `method`, `path`). There
is no `if provider == "shopify"` in the executor.

SDK-connected apps (Focus ERP / Yaaz) cannot call these tools or steal
another workspace's HTTP connection.

## Business Flows

```yaml
id: search-products
steps:
  - id: ask_query
    type: ask
    field: query
  - id: list
    type: tool
    tool: search_products
    execution: http
    input_map:
      query: query
  - id: done
    type: complete
```

Restaurant Pro / Real Estate keep `execution: runtime` + `entity.*`.

## Events and webhooks

Manifest events (`order.created`, `customer.updated`, …) are CRM
business-event **names** on the existing bus.

Inbound Shopify webhooks POST to Qefro `/webhooks/http/shopify` (generic
HMAC ingest, not a server in this package). HMAC (`X-Shopify-Hmac-Sha256`)
is verified on the **raw body** with a small helper outside the package.
Invalid/missing signatures are rejected before processing.

Shop domain selects the workspace connection. Topic headers map through
YAML metadata onto `order.created|updated|cancelled` and
`customer.created|updated`. Idempotency uses the Shopify webhook id plus
the existing `orchestration_events` unique key, so CRM Automation runs
once. Person mapping uses Customer Hub (email/phone/external identity) —
webhook/customer ids are never Person IDs.

## Production config

Shopify app credentials are **not** system-wide. Each workspace Connect
form stores client id (plaintext) and client secret (encrypted). HMAC
webhooks use that workspace’s secret.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_API_URL` | HTTPS origin for OAuth callback and webhook URL |
| `FRONTEND_URL` | Portal origin for post-OAuth redirect |
| `ENCRYPTION_KEY` | Encrypts tokens and the tenant app secret at rest |

## Related topics

- [Connect Shopify](/docs/user/how-to/connect-shopify)
- [restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime) (`entity.*` storage)
- [real-estate-runtime](/docs/solutions/examples/real-estate-runtime) (`entity.*` storage)
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
