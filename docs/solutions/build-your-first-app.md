---
title: "Build your first app"
description: "Scaffold, validate, package, and install a metadata Marketplace App with qefro app init — Restaurant Pro Runtime, no SDK server."
sidebar_label: "Build your first app"
---

# Build your first app

The default Qefro Marketplace path is metadata, not an SDK server:

```text
qefro app init restaurant-pro
  → customize entities / workflows / ui
  → qefro app validate
  → qefro app package
  → qefro app install
  → Qefro Runtime (UI, storage, FlowRunner, CRM, Automation)
```

You do **not** write a `/qefro` process to ship Restaurant, Clinic, Real
Estate, Booking, or CRM apps. Connecting an existing ERP / POS / CRM uses
the [SDK](/docs/solutions/runtime-vs-sdk) — a separate story.

## What you will build

A **Restaurant Pro** style app: tables, reservations, menu, a staff UI,
and a conversation flow that books a table. The reference package is
[`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime)
(app id **`restaurant-pro-runtime`**, `hosting: runtime`).

`qefro app init` scaffolds the same shape with a generic `record` entity.
Rename nouns to match your vertical, or copy the Restaurant Pro Runtime
tree.

| Reference | Path | App id |
|-----------|------|--------|
| Restaurant Pro Runtime | `qefro-plugin-platform/docs/examples/restaurant-pro-runtime` | `restaurant-pro-runtime` |
| Real Estate Runtime | `qefro-plugin-platform/docs/examples/real-estate-runtime` | `real-estate-runtime` |
| Shopify Runtime | `qefro-plugin-platform/docs/examples/shopify-runtime` | `shopify-runtime` |

## Prerequisites

1. **`qefro` CLI** on your `PATH`

   ```bash
   cd qefro-plugin-platform/services/qefro-cli
   cargo install --path .
   ```

2. **Publish credentials** (only for publish / install against a live
   stack — see [Publishing](/docs/solutions/publishing)):

   | Env | Purpose |
   |-----|---------|
   | `QEFRO_SOLUTION_URL` | solution-service base URL |
   | `QEFRO_PUBLISHER_ID` | UUID in `QEFRO_PLATFORM_ADMIN_IDS` |
   | `QEFRO_SIGNING_KEY_HEX` | Ed25519 private key (32-byte hex) matching catalog trust anchors |
   | `QEFRO_TENANT_ID` / `QEFRO_ORGANIZATION_ID` | For `qefro app install` |
   | `QEFRO_INTERNAL_BEARER` | When service auth is enforced |

:::info Partner publish
Today, **catalog publish is platform-admin only**. Tenant admins install;
they do not publish. Ask your Qefro contact for a publisher UUID + signing
key, or use a local stack with `QEFRO_PUBLISH_OPEN=true`. See
[Marketplace](/docs/solutions/marketplace).
:::

No Node.js runtime is required for `hosting: runtime` apps.

## Step 1 — Scaffold

```bash
qefro app init restaurant-pro --name "Restaurant Pro"
cd restaurant-pro
```

(`qefro app init` is an alias of `qefro create-app`. It always scaffolds
a metadata Marketplace App.)

Generated layout (actual CLI output):

```text
restaurant-pro/
├── manifest.yaml
├── entities/
│   └── record.yaml
├── workflows/
│   └── create-record.yaml
└── ui/
    ├── navigation.yaml
    ├── pages.yaml
    ├── widgets.yaml
    └── sources.yaml
```

To study the full hospitality package instead of the generic stub, copy
`docs/examples/restaurant-pro-runtime/` — that tree adds `table`,
`reservation`, `menu_item`, themed pages, and `create-reservation`.

## Step 2 — Make it your domain

You do **not** need a new backend. Change YAML:

1. **Entities** — fields and types under `entities/`. Storage is
   Qefro-managed; you never open a database.
2. **Workflows** — `ask` → `tool` (`entity.<id>.create`,
   `execution: runtime`) → `complete`. Same FlowRunner as every Business
   Flow.
3. **UI** — pages, widgets, `type: entity` sources. Use `host: contacts`
   and `host: automations` for platform CRM surfaces.
4. **Manifest** — `entities:`, `flows:`, `events:`, `triggers`,
   `conversation_slots`.

Rules that never change:

- No `src/` and no `/qefro` endpoint on `hosting: runtime`.
- No direct database or `storage/*` from YAML.
- WhatsApp number comes from the **workspace channel**, not install settings.
- Same package version for every tenant.

## Step 3 — Validate

```bash
qefro app validate restaurant-pro
# alias of: qefro dev restaurant-pro
```

Expect `hosting=runtime` and “metadata package, no SDK process”. Fix
errors before packaging.

## Step 4 — Package and publish

```bash
export QEFRO_SOLUTION_URL=https://…          # or http://127.0.0.1:8105
export QEFRO_PUBLISHER_ID=<admin-uuid>
export QEFRO_SIGNING_KEY_HEX=<32-byte-hex>

qefro app package restaurant-pro
# alias of: qefro solution build restaurant-pro

qefro publish restaurant-pro
```

Success returns a signed `dist/package.json` (`name`, `version`,
`checksum`). Details: [Publishing](/docs/solutions/publishing).

Runtime apps are **not** container images. Qefro Runtime executes the
installed metadata.

## Step 5 — Install

From the Admin Console (**Applications → Marketplace → Install**), or CLI:

```bash
export QEFRO_TENANT_ID=…
export QEFRO_ORGANIZATION_ID=…

qefro app install restaurant-pro --version 0.1.0
```

Then in the portal:

1. Open the workspace → Installed solutions.
2. **Settings → Customer channels** → connect WhatsApp if you need chat.
3. Open the solution UI (tables, forms, Contacts, Automations).
4. In chat, try a declared intent (e.g. “book a table”).

Tenant install docs: [Installation](/docs/solutions/installation).  
Catalog discovery: [Marketplace](/docs/solutions/marketplace).

## Acceptance checklist

You are done when **all** of these pass without writing an SDK server:

- [ ] `qefro app init …` produced a metadata tree
- [ ] `qefro app validate` reports `hosting=runtime`
- [ ] `qefro app package` succeeds
- [ ] Publish returns 201 (platform admin)
- [ ] Install appears in Marketplace / Installed
- [ ] Staff UI lists entity records
- [ ] Chat or a form completes one flow on FlowRunner
- [ ] Contacts / Automations host pages open (if declared)

## Connecting an existing system instead

If the system of record is already an ERP, POS, or CRM (Focus, Yaaz, ABM):

```text
External system → Qefro SDK → /qefro → Qefro Runtime
```

That is [External SDK Connection](/docs/developer/external-sdk-connection),
not this tutorial.

## Next

| Guide | When you need it |
|-------|------------------|
| [restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime) | Full hospitality YAML |
| [real-estate-runtime](/docs/solutions/examples/real-estate-runtime) | Second vertical |
| [Runtime vs SDK](/docs/solutions/runtime-vs-sdk) | Which path you are on |
| [Publishing](/docs/solutions/publishing) | Signing, versions, yank |
| [Marketplace](/docs/solutions/marketplace) | How tenants find and install |
| [Events](/docs/solutions/events) | Tool vs Event vs Flow vs Automation |
| [Troubleshooting](/docs/solutions/troubleshooting) | Common failures |
