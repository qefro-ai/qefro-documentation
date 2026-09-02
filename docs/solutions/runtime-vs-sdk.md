---
title: "Runtime vs SDK"
description: "Marketplace Apps are metadata executed by Qefro Runtime. The SDK connects external systems — it is not how you build a Marketplace App."
sidebar_label: "Runtime vs SDK"
---

# Runtime vs SDK

**Build a Qefro Marketplace App with metadata.**

A Marketplace App is a declarative application package. Qefro Runtime
executes the application's entities, UI, workflows, events, automations,
and business operations.

Use the Qefro SDK only when your application needs to connect Qefro to an
external system whose data or business logic lives outside Qefro.

```text
Marketplace App
      ↓
Metadata Package
      ↓
Qefro Plugin Platform (catalog, install, versioning)
      ↓
Qefro Runtime
      ├── UI Runtime
      ├── FlowRunner
      └── Data Runtime
```

```text
External ERP / POS / CRM
          ↓
      Qefro SDK
          ↓
     SDKAdapter
          ↓
    Qefro Runtime
```

There is no Marketplace App `/qefro` backend. You do not write an SDK
server to ship Restaurant, Clinic, Real Estate, Booking, or CRM apps.

## Comparison

|                | Marketplace App              | External Integration          |
| -------------- | ---------------------------- | ----------------------------- |
| Definition     | Metadata                     | SDK                           |
| Runtime        | Qefro Runtime                | External server               |
| Business logic | Qefro Runtime                | Customer system               |
| Data plane     | Managed storage **or** generic HTTP (workspace connection) | External system |
| Tools          | `entity.*` or HTTP tool YAML | SDK capabilities              |
| Events         | Runtime events               | SDK events                    |
| Flow           | Qefro FlowRunner + RuntimeAdapter | Qefro FlowRunner + SDKAdapter |

**Three execution paths** (no Shopify SDK in Marketplace Apps):

1. **Marketplace metadata** — YAML package, `hosting: runtime`.
2. **Runtime HTTP** — generic APIs (`execution: http` → HTTP executor, host from the workspace connection). Shopify Admin API and the `http-catalog-runtime` fixture use this path.
3. **SDK** — custom / on-prem systems (Focus ERP, Yaaz). `SDKAdapter` only. Cannot call `entity.*` or steal HTTP connections.

Restaurant Pro and Real Estate keep `entity.*` storage. Shopify chat tools use generic HTTP.

## Marketplace App

A **Qefro Marketplace App** is a declarative package (`hosting: runtime`).
`qefro-plugin-platform` validates, stores, versions, and installs it.
**Qefro Runtime** executes it.

- No `src/`, no Dockerfile, no `/qefro` process.
- Entities live under `entities/`; UI under `ui/`; flows under `workflows/`.
- Tools are Runtime capabilities: `entity.reservation.create` (storage) or HTTP tool YAML (`execution: http`) against a workspace connection.
- Contacts stay on the platform Person CRM (`host: contacts`). Automations
  stay on the platform CRM Automation host (`host: automations`).

Canonical packages:

- [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime)
- [`real-estate-runtime`](/docs/solutions/examples/real-estate-runtime)
- [`shopify-runtime`](/docs/solutions/examples/shopify-runtime)

Start: [Build your first app](/docs/solutions/build-your-first-app).

## External Integration

Use the **Qefro SDK** when the system of record already lives outside
Qefro — Focus ERP, Yaaz, ABM, an on-prem POS, a customer CRM.

```text
Customer ERP / POS / CRM
        │
        ▼
SDK process  POST /qefro
        │
        ▼
Qefro Runtime (FlowRunner + SDKAdapter)
```

The SDK advertises tools, events, and optional flow metadata. FlowRunner
still owns orchestration; an **SDKAdapter** invokes the customer's
`/qefro` tools. Storage stays in the external system unless you
explicitly use `ctx.storage`.

`hosting: managed` (a platform-hosted `/qefro` Marketplace App) is not
supported. Register an [SDK Connection](/docs/developer/external-sdk-connection)
instead.

Start: [External SDK Connection](/docs/developer/external-sdk-connection).

## Hosting values

| `manifest.hosting` | What it is | When to use |
| --- | --- | --- |
| `runtime` | Metadata Marketplace App. No SDK process. | **Every Marketplace App** |
| `external` | You run `/qefro`; Qefro binds the URL | SDK Connection to an external system |

## Related topics

- [Solution Development overview](/docs/solutions/overview)
- [Architecture](/docs/solutions/architecture)
- [Integration models](/docs/developer/integration-models)
- [SDK application development](/docs/developer/sdk-application-development)
