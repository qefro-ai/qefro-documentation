---
title: "Marketplace App Generator & Scaffold"
description: "The metadata-driven Marketplace App Generator — planning from business requirements, generating metadata, validating, testing, and packaging for Qefro Runtime."
sidebar_label: "App generator"
---

# Marketplace App Generator & Scaffold

Qefro provides a **metadata-driven Marketplace App Generator** to build vertical domain applications (such as Restaurant Pro, Clinic Pro, Real Estate Pro, and Appointments).

Developers do not build a traditional backend server, maintain Dockerfiles, or write deployment scripts for Marketplace Apps. The generator produces declarative metadata that executes directly within **Qefro Runtime**.

---

## 1. The Generator Lifecycle

Building a Marketplace App follows a structured, verified progression:

```text
Natural / Business Requirements
            ↓
       App Planning
(Entity relationships, flow steps, channels, UI views)
            ↓
   Metadata Generation
(manifest.yaml, entities/*.yaml, workflows/*.yaml, ui/*.yaml)
            ↓
        Validation
(Schema checks, capability assertions, field integrity)
            ↓
          Tests
(Golden path test suite: conversation turns + staff UI)
            ↓
         Package
(Ed25519 cryptographic signing & bundle creation)
            ↓
         Publish
(Global Marketplace Registry distribution)
```

1. **Natural / Business Requirements:** You specify domain requirements (e.g. "We need a clinic management app with patients, appointments, doctors, and WhatsApp booking with Doctor availability checks").
2. **App Planning:** Identify domain nouns, entity schemas, required fields, foreign key relations, availability rules, and staff navigation pages.
3. **Metadata Generation:** Scaffold or generate the YAML metadata package structure.
4. **Validation:** Run `qefro app validate .` to ensure field types, flow steps, and capabilities meet the platform contract.
5. **Tests:** Validate conversational turns against FlowRunner and staff UI layouts against portal rendering schemas.
6. **Package:** Run `qefro app package .` to build the immutable distribution bundle with cryptographic checksums.
7. **Publish:** Platform administrators publish the package to the global Marketplace Registry.

---

## 2. Scaffolding with the CLI

To initialize a new app:

```bash
qefro app init restaurant-pro --name "Restaurant Pro"
cd restaurant-pro
```

### Generated Layout

```text
restaurant-pro/
├── manifest.yaml          # Identity, version, hosting: runtime, entities, flows, events
├── entities/              # Domain schemas (managed runtime storage)
│   ├── table.yaml
│   ├── reservation.yaml
│   └── menu_item.yaml
├── workflows/             # Business Flows executed by FlowRunner
│   ├── create-reservation.yaml
│   └── cancel-reservation.yaml
└── ui/                    # Staff portal presentation metadata
    ├── navigation.yaml    # Sidebar hierarchy and sections
    ├── pages.yaml         # Screen layouts (tables, forms, dashboards)
    ├── widgets.yaml       # Metrics, charts, calendars, lists
    ├── sources.yaml       # Data bindings to declared entities
    └── theme.yaml         # Brand palette and styling tokens
```

**Key architectural rule:** There is no `src/` directory, no `Dockerfile`, and no `/qefro` web server.

---

## 3. Ownership & Isolation Model

```text
Organization (Tenant)
  └── AI Workspace
        ├── Channels (WhatsApp, Widget, Instagram) — owned by Workspace
        └── Primary Application — Installation of a published Marketplace package
```

| Layer | Responsibility | Runtime Notes |
|---|---|---|
| **Organization** | Billing, teams, global Person identities | Top-level tenant boundary |
| **Workspace** | Channel credentials, knowledge index, team assignments | WhatsApp number and Widget token belong here |
| **Application Installation** | Deployed instance of a Marketplace App | Owns installation settings and triple-scoped storage |

Installing an app activates its entities and workflows within that specific workspace. Data written to entities is triple-keyed by `(tenant_id, workspace_id, installation_id)`.

---

## 4. Reference Verticals

Study the official reference implementations in the `qefro-marketplace-apps` repository:

| App ID | Vertical | Data Plane | Reference Path |
|---|---|---|---|
| `restaurant-pro-runtime` | Hospitality | Runtime entities + availability | `apps/restaurant-pro-runtime/` |
| `real-estate-runtime` | Property / Leads | Runtime entities + viewing booking | `apps/real-estate-runtime/` |
| `shopify-runtime` | Commerce | Generic Runtime HTTP + Hub email OTP | `apps/shopify-runtime/` |
| `appointment-runtime` | Professional Booking | Runtime entities + exclusive capacity | `apps/appointment-runtime/` |

---

## 5. From Scaffold to Production

```bash
# 1. Validate metadata against the strict schema
qefro app validate .

# 2. Build signed package
qefro app package .

# 3. Publish to catalog (Platform Admin)
qefro app publish .

# 4. Install into target workspace
qefro app install restaurant-pro-runtime --version 0.1.0
```

---

## Related Documentation

- [Build Your First App Walkthrough](/docs/solutions/build-your-first-app)
- [Marketplace Architecture](/docs/solutions/architecture)
- [Entity Schema Guide](/docs/solutions/entity-schema)
- [Workflow Definitions](/docs/solutions/workflows)
- [Packaging & Validation](/docs/solutions/packaging)
