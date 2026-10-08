---
title: "Marketplace Apps Execution Model"
description: "Why Qefro Marketplace Apps execute as declarative metadata in Qefro Runtime — no application server, no containers, and no SDK process required."
sidebar_label: "Marketplace apps"
---

# Marketplace Apps Execution Model

In Qefro, Marketplace Apps are **declarative metadata packages** executed natively by **Qefro Runtime**.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL MARKETPLACE MODEL                     │
│                                                                        │
│       Metadata Package ──▶ Marketplace ──▶ Installation ──▶ Runtime    │
│  (manifest, entities, flows, ui)                             (No App   │
│                                                               Server)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Why No Application Server Is Required

Traditional multi-tenant platforms often forced app developers to maintain, containerize, and deploy independent backend servers for every integration or vertical add-on.

Qefro eliminates this operational overhead through a **metadata-driven architecture**:

- **No Application Containers:** You do not build Dockerfiles, configure Kubernetes pods, or manage server processes for Marketplace Apps.
- **No `/qefro` Server for Marketplace Apps:** The Qefro Backend SDK and `/qefro` webhook process exist solely for **external system integrations** (e.g., connecting on-premise Focus ERP, Odoo, or existing customer backends).
- **Native Runtime Interpretation:** When a tenant installs an app, Qefro Runtime parses its declarative YAML files (`manifest.yaml`, `entities/`, `workflows/`, `ui/`) and handles storage, validation, state machines, and UI rendering directly.

---

## 2. Canonical Manifest Configuration

All Marketplace Apps specify `hosting: runtime`:

```yaml title="manifest.yaml (canonical example)"
id: restaurant-pro-runtime
name: Restaurant Pro
version: 0.1.0
hosting: runtime                # Interpreted directly by Qefro Runtime

category: hospitality
channels:
  - widget
  - whatsapp

entities:
  - table
  - reservation
  - menu_item

flows:
  - create-reservation
  - cancel-reservation

permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
```

Apps with `hosting: runtime` **must not** declare an external `/qefro` `endpoint`. Declaring an endpoint or custom container is rejected by the validation suite (`qefro app validate`).

---

## 3. The Runtime Execution Planes

Once installed in an AI Workspace, a Marketplace App leverages five native platform planes:

1. **Entity Data Plane:** Interprets `entities/*.yaml` and performs CRUD operations via `RuntimeAdapter` into managed storage, isolated by `(tenant_id, workspace_id, installation_id)`.
2. **Workflow Orchestration Plane:** Executes `workflows/*.yaml` through **FlowRunner**, providing deterministic step execution, human-in-the-loop approvals, and identity verification.
3. **Staff UI Presentation Plane:** Renders responsive dashboards, data tables, detail views, and forms in the Admin Console based on `ui/pages.yaml`, `ui/navigation.yaml`, and `ui/widgets.yaml`.
4. **Conversational Channel Plane:** Exposes workflows to end users across channels (Website Widget, WhatsApp, Instagram) with automatic slot extraction and natural language routing.
5. **Event & Automation Plane:** Emits lifecycle business events (e.g. `reservation.created`, `order.paid`) onto the platform event bus, driving CRM automations and notifications.

---

## 4. When to Use the Qefro Backend SDK

Use the **Qefro Backend SDK** (`@qefro-ai/backend`, `qefro-backend`, `qefro-backend-sdk`) only when connecting an external system of record whose business logic and database already reside outside Qefro:

```text
External System (Focus ERP / POS / SAP)
             ↓
     Backend SDK Server
      (POST /qefro)
             ↓
     Qefro SDKAdapter
             ↓
       Qefro Runtime
```

See **[External SDK Connection](/docs/developer/external-sdk-connection)** and **[Runtime vs SDK](/docs/solutions/runtime-vs-sdk)** for complete details on external integrations.

---

## Related Documentation

- [Build Your First App](/docs/solutions/build-your-first-app)
- [Marketplace Architecture Overview](/docs/solutions/architecture)
- [Entity Schemas & Data Model](/docs/solutions/entity-schema)
- [FlowRunner State Machine](/docs/developer/concepts/flows)
- [Integration Decision Guide](/docs/developer/integration-models)
