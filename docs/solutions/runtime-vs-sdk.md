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

|                | Marketplace App       | External Integration          |
| -------------- | --------------------- | ----------------------------- |
| Definition     | Metadata              | SDK                           |
| Runtime        | Qefro Runtime         | External server               |
| Business logic | Qefro Runtime         | Customer system               |
| Storage        | Qefro managed storage | External system               |
| Tools          | Runtime capabilities  | SDK capabilities              |
| Events         | Runtime events        | SDK events                    |
| Flow           | Qefro FlowRunner      | Qefro FlowRunner + SDKAdapter |

## Marketplace App

A **Qefro Marketplace App** is a declarative package (`hosting: runtime`).
`qefro-plugin-platform` validates, stores, versions, and installs it.
**Qefro Runtime** executes it.

- No `src/`, no Dockerfile, no `/qefro` process.
- Entities live under `entities/`; UI under `ui/`; flows under `workflows/`.
- Tools are Runtime capabilities such as `entity.reservation.create`.
- Contacts stay on the platform Person CRM (`host: contacts`). Automations
  stay on the platform CRM Automation host (`host: automations`).

Canonical packages:

- [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime)
- [`real-estate-runtime`](/docs/solutions/examples/real-estate-runtime)

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
