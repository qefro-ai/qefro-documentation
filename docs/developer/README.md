---
title: "Application Integration Manual"
description: "Developer index: metadata Marketplace Apps executed by Qefro Runtime vs external integrations via Backend SDK and REST/OpenAPI."
sidebar_label: "Integration manual"
---

# Application Integration Manual

This manual provides developers and system architects with the definitive guide to building and integrating on Qefro.

---

## 1. Two Application & Integration Paradigms

```text
A. METADATA MARKETPLACE APP (DOMAIN APPLICATION)
   Developer ──▶ Metadata Package ──▶ Validate ──▶ Publish ──▶ Workspace Install ──▶ Qefro Runtime
   (Pure declarative YAML: entities, workflows, UI, events. Zero application servers.)

B. EXTERNAL SYSTEM INTEGRATION (ERP / POS / CRM)
   External Backend ──▶ Qefro Backend SDK ──▶ POST /qefro ──▶ SDKAdapter ──▶ Qefro Runtime
   (Connect existing systems of record over signed webhooks or REST/OpenAPI.)
```

Full comparison: **[Runtime vs SDK](/docs/solutions/runtime-vs-sdk)** · **[Integration Decision Guide](./integration-models.md)**.

---

## 2. Core Guides

1. **[Build Your First App](/docs/solutions/build-your-first-app)** — Step-by-step metadata Marketplace App walkthrough.
2. **[Marketplace App Development Tutorial](./managed-marketplace-app.md)** — In-depth tutorial covering manifest, entities, workflows, and UI.
3. **[External SDK Connection Guide](./external-sdk-connection.md)** — Connecting external ERP, POS, and CRM backends over signed webhooks.
4. **[Integration Models & Decision Guide](./integration-models.md)** — Architectural decision matrix (Marketplace vs SDK vs REST).
5. **[Migrating to Metadata Apps](./migration-external-to-managed.md)** — Transitioning bespoke code to native metadata apps.

---

## 3. Protocol & SDK Reference (External Systems)

For connecting existing external systems of record:

| Topic | Description | Documentation |
|---|---|---|
| **Backend SDK Development** | Building signed RPC handlers in Node.js, Python, or Rust | [SDK Application Development](./sdk-application-development.md) |
| **The `/qefro` Protocol** | JSON-RPC wire format, headers, and payload schemas | [Qefro Protocol Reference](./qefro-protocol.md) |
| **Tool Definitions** | Exposing business tools with parameter schemas | [Tools](./tools.md) |
| **HMAC Authentication** | Cryptographic verification via `X-Qefro-Signature` | [Authentication](./authentication.md) |
| **Tenancy & Workspaces** | Handling tenant and workspace context in external tools | [Tenancy & Workspaces](./tenancy-and-workspaces.md) |
| **Deployment** | Deploying SDK webhook processes in Docker, Kubernetes, or VMs | [Deploying External SDK Connections](./deployment/external-and-managed.md) |

---

## 4. Platform Capabilities

| Capability | Overview | Documentation |
|---|---|---|
| **Managed Runtime Storage** | Declarative persistence with triple-keyed isolation | [Storage](./storage.md) · [Managed Storage](/docs/solutions/managed-storage) |
| **Customer Hub** | Universal customer identity linking people across channels | [Customer Hub](./customer-hub.md) · [People](/docs/user/people/overview) |
| **Organization & Teams** | Tenant RBAC, permissions, and workspace scoping | [Organization](./organization.md) · [RBAC](/docs/platform/rbac) |
| **FlowRunner** | Multi-step deterministic state machine execution | [FlowRunner Concepts](/docs/developer/concepts/flows) · [Workflows](/docs/solutions/workflows) |
| **Global Tax Engine** | Jurisdiction-based calculation rules for transactions | [Tax Engine](/docs/solutions/tax-engine) |

---

## 5. Publishing & Marketplace

- **[Validation](/docs/solutions/validation)** — Validating metadata with `qefro app validate`.
- **[Packaging](/docs/solutions/packaging)** — Generating signed distribution artifacts with `qefro app package`.
- **[Marketplace Publishing](/docs/solutions/publishing)** — Publishing packages to the global catalog.
- **[Installation](/docs/solutions/installation)** — Installing apps into tenant workspaces.

---

## Related Documentation

- [Runtime Architecture Overview](/docs/developer/concepts/runtime)
- [Security & Trust Boundaries](/docs/security/overview)
- [Connect REST APIs](/docs/guides/connect-rest-apis)
