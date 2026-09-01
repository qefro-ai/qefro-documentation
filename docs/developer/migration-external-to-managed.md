---
title: "Migration: External → Managed"
description: "Move an external SDK connection to a managed marketplace application without rewriting tool contracts."
sidebar_label: "Migrate to managed"
---

# Migration: External → Managed

:::info SDK packaging, not Marketplace metadata
This page moves an **SDK** `/qefro` connector from an org SDK Connection
to a `hosting: managed` package. It does **not** convert an ERP adapter
into a metadata Marketplace App (`hosting: runtime`).

New Marketplace Apps: [Build your first app](/docs/solutions/build-your-first-app).
:::

## Ideal architecture

```text
Same SDK application
       │
       ├── External deployment
       │
       └── Managed deployment
```

Only deployment and platform plumbing change.

## What should NOT change

- Tool names and input contracts
- Business logic / domain rules
- `/qefro` protocol handling
- Marketing / organization metadata shapes
- Customer Hub usage patterns

## What must change

| Area | Change |
| --- | --- |
| Package | Add `manifest.yaml`, optional `workflows/`, `ui/`, `prompts/` |
| Container | Add `Dockerfile`; set `hosting: managed` |
| Registration | From SDK Connection → publish + install |
| Configuration | Install `settings` instead of only process env |
| Secrets | Platform-managed runtime secret injection |
| Data plane | Optionally adopt `ctx.storage` (requires install scope) |
| Upgrades | Solution version upgrades instead of ad-hoc redeploys |

## Suggested path

1. **Freeze tool contracts** on the external connector.
2. **Scaffold** `qefro create-app my-app --hosting managed`.
3. **Copy** tool handlers into `src/` (same `@qefro-ai/backend` code).
4. **Declare** tools/permissions/collections in `manifest.yaml`.
5. **Decide storage:** keep calling external ERP **or** migrate documents to `ctx.storage`.
6. **`qefro dev` → publish → install** in a non-prod workspace.
7. **Parity test** tool.invoke results against the external connector.
8. **Cut over** workspace routing; keep external connection as fallback until stable.
9. **Decommission** old webhook when no longer needed.

## Dual-running

During migration you may run:

- External connection for ERP-backed tools
- Managed install for new Qefro-native features

Do not duplicate conflicting tool names on the same workspace without a clear enablement plan.

## ABM note

ABM-style ERP connectors often **remain external** permanently. Migrate to managed only if you intentionally productize a Qefro-hosted variant that does not need on-prem ERP network access.

## Checklist

```text
[ ] Tool contracts documented and frozen
[ ] Managed package builds (`qefro dev`)
[ ] Manifest permissions match actual ctx.* usage
[ ] Dockerfile health / PORT / QEFRO_SIGNING_SECRET understood
[ ] Install + invoke parity tests pass
[ ] Organization/marketing metadata still advertise correctly
[ ] Rollback plan (keep external connection until cutover done)
```
