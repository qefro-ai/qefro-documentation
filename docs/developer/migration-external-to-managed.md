---
title: "Migrating to Native Metadata Marketplace Apps"
description: "How to migrate external backends or bespoke integrations to native Qefro Metadata Marketplace Apps (hosting: runtime)."
sidebar_label: "Migrate to metadata apps"
---

# Migrating to Native Metadata Marketplace Apps

When building business applications on Qefro (such as reservations, clinic management, appointments, or CRM extensions), migrating from bespoke external backends to **native Metadata Marketplace Apps** simplifies operations and eliminates hosting overhead.

---

## 1. The Migration Paradigm

```text
BEFORE (External Custom Backend):
  Customer Infrastructure ──▶ Custom Server ──▶ Backend SDK (POST /qefro) ──▶ Qefro SDKAdapter
  • Requires managing Docker containers, cloud hosting, and database backups.

AFTER (Native Metadata Marketplace App):
  Declarative Metadata (YAML) ──▶ Qefro Runtime
  • Zero hosting required. Qefro Runtime executes entities, workflows, storage, and UI natively.
```

---

## 2. Migration Steps

### Step 1: Map Database Tables to Entities (`entities/*.yaml`)

Instead of writing database migrations in SQL or ORMs, define your entities declaratively:

```yaml title="entities/order.yaml"
id: order
name: Order
allocate_code:
  prefix: ORD-
  start: 10001
fields:
  - name: customer_name
    type: string
    required: true
  - name: total_amount
    type: float
    required: true
  - name: status
    type: enum
    enum_values: [pending, paid, fulfilled, cancelled]
    default: pending
```

### Step 2: Convert Backend Procedures to FlowRunner Workflows (`workflows/*.yaml`)

Convert multi-step code procedures into declarative FlowRunner steps (`ask`, `tool`, `condition`, `complete`):

- Replace database `INSERT` queries with `entity.<name>.create` tools (`execution: runtime`).
- Replace authorization checks with runtime authority and Customer Hub Person bindings (`type: person`).
- Replace custom scheduling algorithms with native `entity.<name>.availability` tools.

### Step 3: Replace Custom Admin Dashboards with Metadata UI (`ui/*.yaml`)

Rather than maintaining a separate React or Vue admin panel, declare your staff views in YAML:

- Define tables and filters in `ui/pages.yaml`.
- Define navigation menus in `ui/navigation.yaml`.
- Define metric cards and charts in `ui/widgets.yaml`.

---

## 3. When NOT to Migrate (Keep as SDK Connection)

Do **not** migrate to a Marketplace App if:
1. The business system is an established enterprise ERP (e.g. Focus ERP, SAP, Oracle, ERPNext).
2. The system of record MUST live on customer premises or in a private cloud VPC.
3. The data is managed by existing legacy software with complex external transactional boundaries.

In those cases, maintain an **[External SDK Connection](/docs/developer/external-sdk-connection)** using the Qefro Backend SDK.

---

## Related Documentation

- [Integration Decision Guide](/docs/developer/integration-models)
- [Marketplace App Development Tutorial](/docs/developer/managed-marketplace-app)
- [Runtime Execution Architecture](/docs/solutions/runtime-execution)
