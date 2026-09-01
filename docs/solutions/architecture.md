---
title: "Architecture"
description: "The Marketplace App pipeline: metadata package, registry, installer, Qefro Runtime (UI, entities, FlowRunner, storage). SDK is for external systems."
sidebar_label: "Architecture"
---

# Architecture

The **default** installable solution is a **metadata Marketplace App**
(`hosting: runtime`). The platform validates, stores, installs, renders
UI, persists entities, and runs Business Flows on FlowRunner.

Developers do not ship a `/qefro` server for Restaurant, Clinic, Real
Estate, Booking, or CRM apps. That SDK path is [external
integration](/docs/solutions/runtime-vs-sdk).

## Tenant → workspace → app

```text
Tenant
  └── Workspace
        ├── Channels (WhatsApp, …)     # owned by workspace
        └── One primary application    # install of a published package
```

- **Catalog** (global): signed packages published by **platform admins only**.
- **Install** (per workspace): tenant admins activate a published version
  and configure settings. Runtime apps have **no** `/qefro` binding.
- **Channels**: WhatsApp (and similar) bind to the **workspace**, not to
  package settings.

Scaffolding a new app: [App scaffold](/docs/solutions/scaffold).
Publishing into the catalog: [Publishing](/docs/solutions/publishing).

## Runtime vs SDK

|                | Marketplace App       | External Integration          |
| -------------- | --------------------- | ----------------------------- |
| Definition     | Metadata              | SDK                           |
| Runtime        | Qefro Runtime         | External server               |
| Business logic | Qefro Runtime         | Customer system               |
| Storage        | Qefro managed storage | External system               |
| Tools          | Runtime capabilities  | SDK capabilities              |
| Events         | Runtime events        | SDK events                    |
| Flow           | Qefro FlowRunner      | Qefro FlowRunner + SDKAdapter |

```text
Marketplace App:
  metadata → installer → Qefro Runtime → entity tools → managed storage

External ERP / POS / CRM:
  customer system → SDK → /qefro → FlowRunner + SDKAdapter
```

SDK-hosted Marketplace packages (`hosting: managed` / `external`) still
exist — see [Managed apps](/docs/solutions/managed-apps). They are not
the default.

## The pipeline

```mermaid
flowchart TB
    subgraph Build
        A[Marketplace App package<br/>manifest · entities · workflows · ui]
    end
    subgraph Control plane
        B[Registry<br/>publish · sign · version lifecycle]
        C[Installer<br/>capabilities · workspace install]
    end
    subgraph Execution plane
        D[Qefro Runtime<br/>FlowRunner · entity tools · events]
        S[Managed storage]
        F[Pool connector bridge]
        SDK[SDKAdapter — external /qefro only]
    end
    subgraph Presentation plane
        G[Portal renderer<br/>themes · navigation · pages · widgets]
        CRM[Person CRM · Automations]
    end
    A -->|signed package| B
    B -->|resolve version| C
    C -->|register workflows| D
    D --> S
    D --> F
    D -.->|external integrations only| SDK
    C -->|UI bundle| G
    D -->|entity + runtime sources| G
    G --> CRM
```

| Stage | Component | Tenant-scoped | Page |
| --- | --- | --- | --- |
| App package | Metadata directory (`entities/` required for `hosting: runtime`) | n/a | [Manifest](/docs/solutions/manifest) |
| Registry | Global signed catalog | No | [Publishing](/docs/solutions/publishing) |
| Installer | Tenant activation | Yes | [Installation](/docs/solutions/installation) |
| Qefro Runtime | FlowRunner + entity tools + event bus | Yes | [Workflows](/docs/solutions/workflows) |
| Managed storage | Documents for declared entities | Yes (per op) | [Managed storage](/docs/solutions/managed-storage) |
| Connector bridge | Shared pool for external SoR | Pool shared; calls carry tenant | [Connectors](/docs/solutions/connectors) |
| SDKAdapter | External `/qefro` tools | Yes (per connection) | [Runtime vs SDK](/docs/solutions/runtime-vs-sdk) |
| Portal renderer | Native widget registry | Yes | [Pages](/docs/solutions/pages) |


## Registry

The registry is the **global catalog** of published solutions and
connectors. It is not tenant-scoped: every tenant resolves against the same
signed catalog.

**Who can write:** only **platform admins** (UUIDs in
`QEFRO_PLATFORM_ADMIN_IDS` on solution-service). Tenant / workspace admins
install from the catalog; they cannot publish or yank versions.

Responsibilities:

- Accept signed packages (`manifest`, `components`, `signature`,
  `signature_kid`, `publisher_id`).
- Verify the Ed25519 signature over `id|version|checksum` before storing.
- Track version lifecycle: `draft → published → deprecated → yanked`.
- Resolve dependency constraints (connector versions) at install time.

Packages are immutable once published: a new version is a new package. See
[Publishing](/docs/solutions/publishing).

## Installer

The installer turns a published version into a **tenant installation**.
Installing a solution registers flows and prompts with the runtime — the
solution itself never executes anything.

```mermaid
sequenceDiagram
    participant T as Tenant (portal / CLI)
    participant I as Installer
    participant R as Registry
    participant RT as Runtime
    participant CM as Connector manager
    participant SM as Secret manager
    T->>I: install restaurant-pro@1.0.0
    I->>R: resolve version + connector dependencies
    R-->>I: package + signature verification
    I->>I: verify Ed25519 signature
    I->>I: negotiate capabilities (requested ∩ grantable)
    I->>CM: ensure connector pool instances
    I->>SM: store tenant connector credentials (AES-256-GCM)
    I->>RT: register workflows + prompts
    I->>I: persist UI bundle + granted capabilities
    I-->>T: installation active
```

Key properties:

- **Capability negotiation**: the granted set is the intersection of the
  capabilities requested by the package and what the installation grants.
  It is computed at install time, stored with the bundle, and re-checked on
  every host call. See [Capabilities](/docs/solutions/capabilities).
- **Activation plan**: the install pipeline executes explicit steps —
  enable tenant connectors, register flows, ensure connector pool, store
  secrets, register the UI bundle. The wizard shows requested vs granted
  capabilities before activation.

## Runtime

The runtime is the single execution engine of the platform. For Marketplace
Apps it provides:

- **Workflow execution** — installed workflow definitions run on
  FlowRunner (`ask`, `tool`, `condition`, `delay`, `approval`,
  `challenge`, `complete`). Metadata flows compile into the **same**
  BusinessFlow model. See [Runtime concept](/docs/developer/concepts/runtime).
- **Entity tools** — `entity.<id>.create` (and siblings) persist declared
  entities through managed storage. `execution: runtime` — no SDKAdapter.
- **Runtime data sources** — `metrics`, `executions` and `workflows`
  targets (capability `runtime.query`).
- **Event bus** — `ui.*` lifecycle events and business events.
  See [Events](/docs/solutions/events).

:::info
A solution never executes workflows itself. Installation *registers*
definitions; the runtime *owns* execution.
:::

### Domain boundary (ADR-006)

Runtime is **domain-agnostic**. It executes, routes, persists conversation
drafts, authorizes, and orchestrates. It does not know what a reservation,
appointment, guest, table, or visit type is.

| Layer | Owns |
| --- | --- |
| App (`entities/` + `workflows/` + manifest) | Business nouns, field names, choice values, when to confirm |
| Manifest | Generic `conversation_slots`, trigger `reply_signals` / `required_slots` / `identity` |
| Runtime | Extract declared slots, map `{chip_prefix}:{value}` chips, identity OTP, fire the **pending** declared capability on generic “yes” |

**Runtime-owned protocol vocabulary** (Runtime may understand these):
`conversation_slots`, `required_slots`, `forbidden_slots`, `reply_signals`,
`confirmation`, `identity_challenge`, `chip_prefix`, `chip_value`.

**App-owned opaque vocabulary** (Runtime must never special-case, even if
common): `guest_name`, `pickup_date`, `room_type`, `visit_type`, `table_id`,
`order_id`, …. If it is app-defined, it is opaque.

A new app (Hotel, Salon, Real Estate, …) plugs in by declaring entities,
slots, and triggers — no Runtime change. The contract is ADR-006
(`qefro-plugin-platform/docs/adr-006-domain-agnostic-runtime.md`).

## Managed storage

Marketplace App entities persist through **Qefro-managed storage**.
Packages never receive a Mongo connection string and never invent
storage-service URLs.

```text
entity.reservation.create (Runtime capability)
  → storage-service /v1/internal/storage/*
  → MongoDB `managed_apps`  ({solution_slug}__{logical})
```

Isolation, reserved metadata, soft delete, and audit are enforced by
storage-service. See [Managed storage](/docs/solutions/managed-storage).

SDK-hosted packages (`hosting: managed` / `external`) still persist only
via `ctx.storage` inside `/qefro` — never from workflow/UI YAML targeting
`storage/*`.

## Connector bridge

`connector` data sources that target **declared external pool connectors**
never call a connector directly. They are forwarded through the connector
bridge, which:

- routes `POST /v1/route` calls to a **shared, stateless connector pool**
  (containers named `qefro-connector-{name}-{version}-{id}` — never
  per-tenant),
- attaches the tenant context to every call,
- enforces that the calling solution holds `connector.invoke` and declared
  the connector in its manifest.

Sources whose `target` is `{solution}/{tool}` for an **SDK-hosted**
install skip the pool bridge and call that installation `/qefro` (gated
on `runtime.query`). Metadata apps use `type: entity` sources instead —
see [Sources](/docs/solutions/sources).

See [Connectors](/docs/solutions/connectors) and the
[connector reference](/docs/reference/connector-reference).

## Portal renderer

The portal renders solution UIs **natively** at
`/app/solutions/ui/:name/:pageId?` using its own component registry:

| Engine | Role |
| --- | --- |
| Solution UI host | Loads the tenant bundle, scoped theme container, page tabs, lifecycle events |
| Theme engine | `theme.yaml` → CSS custom properties on the solution container only |
| Navigation engine | Bundle navigation under **Managed solution** in the portal sidebar |
| Widget registry | Closed widget-kind list rendered with platform UI primitives |
| Layout engine | Responsive grid (1 column on mobile, `columns` at ≥ 1024 px) |
| Data sources | Capability-gated fetches from runtime, own-app `/qefro`, or pool bridge |
| Capabilities | The `ui.*` host API, implemented in-process |
| UI boundary | Error boundary + schema coercion — broken definitions degrade to a scoped error card |

Nothing from a package ever executes: no iframes, no `postMessage`, no
injected scripts. See [Security](/docs/solutions/security).

## Data ownership

| Data | Owner | Tenant-scoped |
| --- | --- | --- |
| Published packages (manifest, UI, workflows) | Registry / solution-service | No — global catalog |
| Installations, settings, granted capabilities | Installer / solution-service | Yes |
| Workflow executions | Runtime | Yes |
| Solution application documents | storage-service → Mongo `managed_apps` | Yes (per op) |
| Running connector containers | Connector manager | No — shared pool |
| Connector credentials | Secret manager | Yes |
| UI event log (`ui_events`) | Runtime | Yes |

## Trust boundaries

```mermaid
flowchart LR
    subgraph Untrusted
        P[Package content]
    end
    subgraph Enforced by platform
        V[Publish-time validation]
        S[Signature verification]
        N[Capability negotiation]
        G[Per-call capability re-check]
        B[Error boundary + schema coercion]
    end
    P --> V --> S --> N --> G --> B
```

1. **Validation** rejects unknown widget kinds, unknown capabilities,
   icons outside the closed set, non-grid layouts and executable assets —
   see [Validation](/docs/solutions/validation).
2. **Signing** binds every package to `id|version|checksum` with Ed25519.
3. **Negotiation** caps capabilities at install time.
4. **Re-check** gates every host call and every data-source fetch at
   runtime.
5. **Boundaries** ensure a malformed definition degrades to a scoped error
   card — the portal itself never crashes.

## Related topics

- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [App scaffold](/docs/solutions/scaffold)
- [Solution Development overview](/docs/solutions/overview)
- [Installation](/docs/solutions/installation)
- [Security model](/docs/solutions/security)
- [Platform architecture](/docs/architecture/overview)
