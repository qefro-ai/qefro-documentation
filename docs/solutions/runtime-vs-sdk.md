---
title: "Runtime vs SDK"
description: "Marketplace Apps are metadata executed by Qefro Runtime. The SDK connects external systems — it is not how you build a Marketplace App."
sidebar_label: "Runtime vs SDK"
---

# Runtime vs SDK

Two different developer stories. Do not mix them.

```text
Marketplace App (default)
  Developer → Create App Metadata → Validate → Package → Publish
    → Install into Workspace → Qefro Runtime
    (UI, Entities, Storage, Business Flows, Business Events, CRM, Automation)

External integration (separate)
  External ERP / POS / CRM → Qefro SDK → /qefro protocol → Qefro Runtime
```

The old default — **Marketplace App → SDK → /qefro** — is no longer the
Marketplace story. You do **not** write a `/qefro` server to ship Restaurant,
Clinic, Real Estate, Booking, or CRM apps.

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
Qefro Runtime renders the UI, persists entities in managed storage, and
compiles `workflows/` into the same **BusinessFlow / FlowRunner** used
everywhere else.

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

Start: [External SDK Connection](/docs/developer/external-sdk-connection).

## Hosting values

| `manifest.hosting` | What it is | When to use |
| --- | --- | --- |
| `runtime` | Metadata Marketplace App. No SDK process. | **Default** for new Marketplace apps |
| `managed` | Qefro runs your `/qefro` container | Legacy / SDK-hosted Marketplace packages |
| `external` | You run `/qefro`; install binds the URL | Packaged SDK app pointing at your endpoint |

`managed` and `external` still exist for SDK-hosted packages (see
[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) takeaway). They
are **not** the default path for a new Marketplace App.

## Related topics

- [Solution Development overview](/docs/solutions/overview)
- [Architecture](/docs/solutions/architecture)
- [Managed apps](/docs/solutions/managed-apps) — SDK-hosted packages
- [Integration models](/docs/developer/integration-models)
- [SDK application development](/docs/developer/sdk-application-development)
