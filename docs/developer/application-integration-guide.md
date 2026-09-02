---
title: "Building Applications for Qefro"
description: "Primary developer manual: metadata Marketplace Apps vs External SDK Connection. Qefro Runtime executes Marketplace Apps; the SDK connects external systems."
sidebar_label: "Building applications"
---

# Building Applications for Qefro

A **Qefro Marketplace App** is a **declarative package** executed by
Qefro Runtime. Developers do not need a backend to create Restaurant,
Clinic, Real Estate, Booking, or CRM apps.

The **Qefro SDK** is how you connect an **external** ERP / POS / CRM to
Qefro over the signed `/qefro` protocol.

```text
Marketplace App (default)
  Developer → Create App Metadata → Validate → Package → Publish
    → Install into Workspace → Qefro Runtime
    (UI, Entities, Storage, Business Flows, Business Events, CRM, Automation)

External integration
  External ERP / POS / CRM → Qefro SDK → /qefro → Qefro Runtime
```

The old default — Marketplace App → SDK → `/qefro` — is no longer the
Marketplace story.

## Domain examples

| App | What you ship |
| --- | --- |
| **Restaurant Pro Runtime** | Metadata: tables, reservations, menu, `create-reservation` |
| **Real Estate Runtime** | Metadata: properties, leads, viewings, `create-viewing` |
| **Shopify Runtime** | Metadata: products, customers, orders — no Shopify API in the package |
| **ABM / Focus / Yaaz** (external) | SDK tools: product search, pricing, quotation |

---

## Critical distinction

|                | Marketplace App       | External Integration          |
| -------------- | --------------------- | ----------------------------- |
| Definition     | Metadata              | SDK                           |
| Runtime        | Qefro Runtime         | External server               |
| Business logic | Qefro Runtime         | Customer system               |
| Storage        | Qefro managed storage | External system               |
| Tools          | Runtime capabilities  | SDK capabilities              |
| Events         | Runtime events        | SDK events                    |
| Flow           | Qefro FlowRunner      | Qefro FlowRunner + SDKAdapter |

**Marketplace App** = "Declare entities, UI, and flows; Qefro Runtime runs them."

**External SDK Connection** = "Bring your existing backend / ERP to Qefro."

---

## Side-by-side architecture

```text
             MARKETPLACE APP

Developer
    │
    ▼
Metadata package (manifest · entities · workflows · ui)
    │
    ▼
Qefro Marketplace / registry
    │
    ▼
Workspace Installation
    │
    ▼
Qefro Runtime
    ├── UI
    ├── Entity tools + managed storage
    ├── FlowRunner
    └── CRM / Automation
```

```text
             EXTERNAL SDK

Customer Systems (ERP / POS / CRM)
       │
       ▼
┌───────────────────┐
│ Customer Server   │
│ SDK Application   │
│      /qefro       │
└─────────┬─────────┘
          │  HMAC-signed POST
          ▼
     Qefro Platform
          │
          ▼
 FlowRunner + SDKAdapter
```

---

## Decision guide

```text
Are you connecting an existing ERP / POS / CRM?

YES
 ↓
External SDK Connection

NO
 ↓
Metadata Marketplace App (hosting: runtime)
```

### Choose External SDK when

- Integrating an existing ERP / CRM / on-prem API
- Enterprise requires customer-owned infrastructure
- Sensitive systems must stay inside the customer network
- The customer already has a backend you wrap with `/qefro`
- You control deployment, scaling, and monitoring

**Example:** ABM / Focus / Yaaz keep the connector on their own
infrastructure because it accesses their systems of record.

### Choose Marketplace App when

- Building a Qefro-native product (Restaurant, Clinic, Real Estate, …)
- Selling / distributing through Marketplace
- You do not want to run a backend
- The app is reusable across many tenants/workspaces

Tutorial: [managed-marketplace-app.md](./managed-marketplace-app.md).

---

## Application surface (SDK — external systems only)

The rest of this page is the **SDK / `/qefro` contract** for connecting
external systems. Skip it if you are building a metadata Marketplace App.

Package (JavaScript/TypeScript): **`@qefro-ai/backend`** (current documented version **1.7.0**).

```javascript
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({
  signingSecret: process.env.QEFRO_SIGNING_SECRET,
  endpointPath: '/qefro', // default
});

app.tool('searchProducts', { description: '...', input_schema: { ... } }, async (ctx) => {
  // domain logic
  return { items: [] };
});

await app.listen({ port: Number(process.env.PORT || 8080) });
```

Also available:

| Method | Role |
| --- | --- |
| `app.tool(...)` | Business tools |
| `app.flow(...)` | Flow metadata (runtime orchestrates) |
| `app.event` / `app.webhook` / `app.schedule` | Named handlers advertised via `capabilities.list` |
| `app.customer(provider)` | Optional external CRM auth provider |
| `app.marketing({...})` | Marketing metadata (platform owns campaigns) |
| `app.organization({...})` | Organization capability metadata |
| `app.listen({ port, host?, path? })` | HTTP server for `POST /qefro` |

Tool handlers receive `ctx` with `parameters`, `identity`, `conversation`, `channel`, `platform`, `storage`, `customer`, `person`, `timeline`, `membership`, `consent`, and auth helpers. See [Tools](./tools.md) and [SDK application development](./sdk-application-development.md).

Python (`qefro-backend`) and Rust (`qefro-backend-sdk`) implement the same protocol. Prefer the JS examples in this manual; language notes live under [Developer SDK](/docs/developer/sdk/javascript).

---

## How Qefro reaches your app

```text
AI / Workflow / Admin Sync
        │
        ▼
ACS Tool Invoker  or  Runtime → Connector Manager
        │
        │  POST {endpoint}/qefro
        │  Headers: x-qefro-signature, x-qefro-timestamp, x-qefro-protocol, …
        │  Body: { protocol_version, request_id, type, tool?, parameters?, … }
        ▼
SDK Application
```

Request `type` values (protocol **1**):

| `type` | Purpose |
| --- | --- |
| `ping` | Health / handshake |
| `tools.list` | Discover tools (**legacy** — prefer `capabilities.list`) |
| `capabilities.list` | Tools + flows + events + marketing + organization |
| `tool.invoke` | Execute a tool |
| `tool.resume` | Resume after an auth challenge |

Details: [qefro-protocol.md](./qefro-protocol.md), [authentication.md](./authentication.md).

---

## Model A — External SDK Connection (summary)

```text
Customer Infrastructure
        │
        ▼
SDK Application
        │
      /qefro
        │
        ▼
Qefro Connector Manager / ACS SdkWebhookClient
        │
        ▼
Qefro Runtime / AI / Workflows
```

1. Build and deploy your `/qefro` server.
2. Org Portal → **Business Tools** → **SDK Connections** → **Add Connection**  
   Fields: **Name**, **Webhook URL**, **Signing Secret** (optional — platform can generate), **Enabled**.
3. **Test Connection** (`ping` → `pong`).
4. Select a workspace → **Sync Tools** (`capabilities.list` preferred; `tools.list` is legacy → Business Tools).
5. Enable tools for chat / workflows and invoke.

UI lives in the Org Portal (not `ai-customer-support-admin`). Product copy may still say “Admin Console.”

Full tutorial: [external-sdk-connection.md](./external-sdk-connection.md).

Reference repos: `abm-demo` (product & quotation), `mock-order-status-sdk` (minimal).

### Ownership

You control: infrastructure, source, deployment, databases, secrets, APIs, availability, scaling, monitoring.

Qefro controls: connection routing, HMAC signing, tenant/workspace routing, AI, workflow orchestration, platform capabilities.

---

## Model B — Marketplace App (summary)

```text
Qefro Marketplace
        │
        ▼
Metadata package
        │
        ▼
Solution Installation
        │
        ▼
Qefro Runtime (no /qefro process)
```

1. Scaffold with `qefro app init <id>`.
2. Declare `entities/`, `workflows/`, `ui/`.
3. `qefro app validate` → `qefro app package` → `qefro publish`.
4. Tenant installs into a workspace.
5. Runtime runs entity tools and FlowRunner.

Full tutorial: [managed-marketplace-app.md](./managed-marketplace-app.md).

Reference: `restaurant-pro-runtime`, `real-estate-runtime`, `shopify-runtime`.

---

## Lifecycle comparison

### External

```text
Developer creates app
       ↓
Deploy server (HTTPS /qefro)
       ↓
Register SDK connection
       ↓
Test Connection (health)
       ↓
Sync Tools
       ↓
Qefro invokes /qefro
       ↓
Developer deploys updates
```

### Managed (metadata)

```text
Developer creates metadata
       ↓
Validate (`qefro app validate`)
       ↓
Package + publish
       ↓
Install into workspace
       ↓
Qefro Runtime executes UI / entities / FlowRunner
```

---

## Versioning

### External

You control application version, deployment version, and SDK package version. The SDK connection points at the currently deployed webhook URL.

### Managed

Qefro tracks published solution version and installed version. Upgrades go through solution-service (`upgrade_for_tenant`). Rollback follows platform install versioning rules (see [marketplace-publishing.md](./marketplace-publishing.md)).

---

## Tenancy context (important differences)

On `tool.invoke`, the platform may inject a `platform` block (storage, customer, marketing, organization, channels).

| Field | External SDK connection | Managed marketplace install |
| --- | --- | --- |
| `organization_id` / tenant | Yes (request + headers) | Yes |
| `workspace_id` | Often present on invoke context | Yes (install scope) |
| `connection_id` | Binding is the SDK connection | N/A (install binding) |
| `installation_id` | Only if provided in invoke scope | Yes |
| `solution_id` | Only if provided in invoke scope | Yes |
| `platform.storage` | **Omitted** unless install/solution scope exists | Present when storage-service configured |
| `trace_id` / tool invocation headers | Via headers when forwarded | Via connector-manager headers |

**Implementation detail:** ACS omits `platform.storage` for pure org SDK tools without `installation_id` / `solution_id` so `ctx.storage` fails closed. External ERP connectors typically use their own data stores (ABM pattern).

See [tenancy-and-workspaces.md](./tenancy-and-workspaces.md).

---

## Platform capabilities (shared contract)

### Storage — `ctx.storage`

Managed document CRUD via storage-service (`insert` / `find` / `get` / `update` / `delete`). Requires `platform.storage` (or env `QEFRO_STORAGE_URL` + context). Domain collections (e.g. `reservations`) stay application-owned documents — not Customer Hub.

### Customer Hub — `ctx.customer` / `timeline` / `membership` / `consent`

Prefer Hub for people identity. Keep domain entities in the app. Optional external `app.customer(provider)` for connector CRM auth.

### Organization — `app.organization({ events, actions, tasks })`

Metadata only in Phase 1. Opaque capability ids (no `app.` prefix). Platform owns workflows and inbox. Applications must not call each other directly.

```text
purchase_requested  →  Organization Workflow  →  Approval Task  →  approve_purchase
```

### Marketing — `app.marketing({ audiences, variables, actions, landingPages, channels })`

App contributes metadata; platform owns campaigns, delivery, analytics.

Deep dives: [storage](./storage.md), [customer-hub](./customer-hub.md), [organization](./organization.md), [marketing](./marketing.md), [workflows](./workflows.md).

---

## ABM example (External)

```text
ABM ERP
   ↓
ABM SDK Connector (@qefro-ai/backend)
   ↓
Qefro SDK Connection (Org Portal)
   ↓
AI Sales Assistant
   ↓
Product Search → Pricing → Quotation
   ↓
Organization Approval (opaque actions)
```

ABM should keep the connector on its own infrastructure because the connector accesses ABM’s existing systems. Do not publish ABM as a Marketplace managed app unless you intentionally re-host that integration.

---

## Restaurant Pro Runtime example (Marketplace)

```text
restaurant-pro-runtime
      ↓
manifest.yaml (hosting: runtime)
      ↓
entities/ + workflows/ + ui/
      ↓
Qefro Marketplace
      ↓
Workspace Installation
      ↓
Qefro Runtime → entity.reservation.create + FlowRunner
      + Person CRM + Automations
```

---

## Shared application code

Ideal architecture:

```text
Same SDK application
       │
       ├── External deployment (webhook URL + SDK connection)
       │
       └── Managed deployment (manifest + Dockerfile + install)
```

**Should stay the same:** tool names/schemas, business logic, `/qefro` handlers, marketing/organization metadata shapes, Customer Hub usage patterns.

**May change:** packaging (`manifest.yaml`, `Dockerfile`), how secrets are supplied, whether `ctx.storage` is available, registration path (connection vs install), upgrade process.

Migration guide: [migration-external-to-managed.md](./migration-external-to-managed.md).

---

## Developer checklists

### External SDK checklist

```text
[ ] Create SDK application (`new Qefro({ signingSecret })`)
[ ] Define tools (`app.tool`)
[ ] Expose POST /qefro (`app.listen`)
[ ] Configure signing secret (match Org Portal SDK Connection)
[ ] Deploy externally (HTTPS recommended)
[ ] Register SDK Connection (Name, Webhook URL, Secret)
[ ] Test Connection
[ ] Sync Tools into a workspace
[ ] Test tool invocation from chat / Test Tool
[ ] Optional: marketing / organization / customer provider
[ ] Verify tenant/workspace isolation assumptions
[ ] Monitor availability of your endpoint
```

### Managed Marketplace checklist

```text
[ ] qefro app init <id>
[ ] Declare entities/ and workflows/
[ ] Optional: ui/ (including host: contacts / automations)
[ ] qefro app validate
[ ] qefro app package
[ ] qefro publish (platform admin)
[ ] qefro app install
[ ] Open UI + run one flow on FlowRunner
```

---

## Next steps

| Goal | Doc |
| --- | --- |
| Choose a model | [integration-models.md](./integration-models.md) · [Runtime vs SDK](/docs/solutions/runtime-vs-sdk) |
| First Marketplace App | [managed-marketplace-app.md](./managed-marketplace-app.md) |
| First external connector | [external-sdk-connection.md](./external-sdk-connection.md) |
| Protocol details | [qefro-protocol.md](./qefro-protocol.md) |
| HMAC & secrets | [authentication.md](./authentication.md) |
| Errors & debugging | [troubleshooting.md](./troubleshooting.md) |

Manual index: [README.md](./README.md).
