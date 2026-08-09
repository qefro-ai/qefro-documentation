---
title: "Building Applications for Qefro"
description: "Primary developer manual: External SDK Connection vs Managed Marketplace App, /qefro protocol, tools, and platform capabilities."
sidebar_label: "Building applications"
---

# Building Applications for Qefro

A **Qefro application** is a backend application that implements the Qefro `/qefro` protocol and exposes business capabilities through SDK tools.

The application owns its domain logic. Qefro owns AI interaction, workflow orchestration, connection routing, and platform capabilities (Customer Hub, Organization, Marketing, managed storage).

```text
Application
    │
    ├── Tools
    ├── Events / webhooks / schedules
    ├── Flows (metadata; runtime executes)
    ├── Customer capabilities
    ├── Marketing metadata
    ├── Organization capabilities
    └── Storage (managed via ctx.storage when scoped)
```

## Domain examples

| App | Domain tools (examples) |
| --- | --- |
| **Restaurant Pro** | reservations, menu, orders, kitchen, tables |
| **Clinic Pro** | doctors, appointments, availability |
| **Finance Pro** | invoices, approvals, payments |
| **ABM Sales Connector** (external) | product search, pricing, quotation, approval |

Qefro does not need to know how the application obtains data — ERP, CRM, database, or `ctx.storage`.

---

## Critical distinction

> **The application contract is the same. The deployment and platform plumbing are different.**

| | External SDK Connection | Managed Marketplace App |
| --- | --- | --- |
| Runtime owner | Developer / customer | Qefro |
| Server location | Customer infrastructure | Qefro infrastructure |
| Deployment | Developer deploys | Qefro installs / runs |
| Registration | SDK connection (`webhook_url` + secret) | Solution installation |
| Endpoint | Developer's `/qefro` URL | Managed connector / installation binding |
| Marketplace | Not required | Required for distribution |
| Installation binding | No | Yes |
| Container | Customer-managed | Qefro-managed (`hosting: managed`) |
| Upgrades | Developer-controlled | Solution upgrade |
| Secrets | Customer environment + connection secret | Connection/platform secrets + install settings |
| Scaling | Customer | Qefro |
| Availability | Customer responsibility | Qefro platform |
| Domain data | Application-owned | Application-owned (often via `ctx.storage`) |
| `/qefro` protocol | Same | Same |
| SDK | Same (`@qefro-ai/backend`, …) | Same |
| Tool contract | Same | Same |
| Customer Hub | Same platform capability | Same platform capability |
| Organization | Same platform capability | Same platform capability |
| Marketing | Same platform capability | Same platform capability |

**External SDK Connection** = "Bring your application/backend to Qefro."

**Managed Marketplace App** = "Let Qefro host and distribute your application."

**Both use the same Qefro application contract and `/qefro` protocol.**

---

## Side-by-side architecture

```text
             EXTERNAL SDK

Customer Systems
       │
       ▼
┌───────────────────┐
│ Customer Server   │
│                   │
│ SDK Application   │
│      /qefro       │
└─────────┬─────────┘
          │  HMAC-signed POST
          ▼
     Qefro Platform (ACS)
          │
          ▼
 Connector Manager (optional) / SdkWebhookClient
```

```text
             MANAGED APP

Developer
    │
    ▼
Solution Package (manifest + Dockerfile + src/)
    │
    ▼
Qefro Marketplace / registry
    │
    ▼
Workspace Installation
    │
    ▼
Managed Runtime
    │
    ▼
     /qefro
    │
    ▼
Connector Manager
```

> **Same application protocol. Different ownership and deployment model.**

---

## Decision guide

```text
Do you need to run the application yourself?

YES
 ↓
External SDK Connection

NO
 ↓
Do you want Qefro to host/manage it?

YES
 ↓
Managed Marketplace App
```

### Choose External SDK when

- Integrating an existing ERP / CRM / on-prem API
- Enterprise requires customer-owned infrastructure
- Sensitive systems must stay inside the customer network
- The customer already has a backend you wrap with `/qefro`
- You control deployment, scaling, and monitoring

**Example:** ABM keeps the connector on its own infrastructure because it accesses ABM’s systems of record.

### Choose Managed Marketplace when

- Building a Qefro-native product (Restaurant Pro, Clinic Pro, …)
- Selling / distributing through Marketplace
- Qefro should handle deploy, health, upgrade
- The app is reusable across many tenants/workspaces

---

## Application surface (SDK)

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

## Model B — Managed Marketplace App (summary)

```text
Qefro Marketplace
        │
        ▼
Solution Package
        │
        ▼
Solution Installation
        │
        ▼
Qefro Managed Runtime
        │
      /qefro
        │
        ▼
Connector Manager
        │
        ▼
Qefro Runtime
```

1. Scaffold with `qefro create-app <id> [--hosting managed]`.
2. Implement tools in `src/` (same SDK).
3. Fill `manifest.yaml`, `Dockerfile`, optional `workflows/`, `ui/`.
4. `qefro publish` (platform admin) → registry / Marketplace.
5. Tenant installs into a workspace → solution-service starts managed runtime and records an **installation binding**.
6. Runtime invokes `install:{solution}` / binding → connector-manager → `/qefro`.

Full tutorial: [managed-marketplace-app.md](./managed-marketplace-app.md).

Reference: `restaurant-pro` (`hosting: managed`), `clinic-pro`, `finance-pro`.

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

### Managed

```text
Developer creates app
       ↓
Build package (manifest + image)
       ↓
Validate (`qefro dev`)
       ↓
Publish
       ↓
Install into workspace
       ↓
Qefro starts runtime
       ↓
Qefro upgrades / rolls versions
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

## Restaurant Pro example (Managed)

```text
Restaurant Pro
      ↓
manifest.yaml (hosting: managed)
      ↓
solution package + Dockerfile
      ↓
Qefro Marketplace
      ↓
Workspace Installation
      ↓
Managed Runtime → /qefro
      ↓
restaurant.* tools + ctx.storage
      + Customer Hub + Marketing + Organization metadata
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
[ ] Create SDK application (same tool contract)
[ ] Define tools
[ ] Add manifest.yaml (`hosting: managed`, permissions, tools, …)
[ ] Add Dockerfile
[ ] Configure permissions / capabilities
[ ] Optional: workflows, prompts, ui/
[ ] `qefro dev` validate
[ ] `qefro publish` (platform admin)
[ ] Install into workspace
[ ] Verify managed runtime / health
[ ] Test tools
[ ] Test upgrade path
```

---

## Next steps

| Goal | Doc |
| --- | --- |
| Choose a model | [integration-models.md](./integration-models.md) |
| First external connector | [external-sdk-connection.md](./external-sdk-connection.md) |
| First managed app | [managed-marketplace-app.md](./managed-marketplace-app.md) |
| Protocol details | [qefro-protocol.md](./qefro-protocol.md) |
| HMAC & secrets | [authentication.md](./authentication.md) |
| Errors & debugging | [troubleshooting.md](./troubleshooting.md) |

Manual index: [README.md](./README.md).
