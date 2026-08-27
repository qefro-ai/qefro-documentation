---
title: "Managed Marketplace App"
description: "Tutorial: package Restaurant Pro–style apps with manifest, Dockerfile, publish, install, and managed runtime."
sidebar_label: "Managed Marketplace App"
---

# Managed Marketplace App

## Goal

Build a Qefro-native application (Restaurant Pro pattern), package it, publish to the registry/Marketplace, install into a workspace, and let Qefro run `/qefro`.

Reference packages (plugin platform examples):

| Package | Notes |
| --- | --- |
| `restaurant-pro` | Reservations, menu, takeaway, marketing + organization metadata, `ctx.storage` |
| `clinic-pro` | Appointments / clinical booking pattern |
| `finance-pro` | Organization approval actions (ADR-005) |

## Prerequisites

- Node.js ≥ 18 and `@qefro-ai/backend`
- `qefro` CLI configured (`QEFRO_SOLUTION_URL`, tenant headers, publisher credentials)
- Platform admin id listed in solution-service `QEFRO_PLATFORM_ADMIN_IDS` to **publish**
- Docker for `hosting: managed` images

## Architecture

```text
Application source
      ↓
manifest.yaml
      ↓
solution package
      ↓
publish
      ↓
Marketplace / catalog
      ↓
workspace installation
      ↓
managed runtime
      ↓
/qefro
      ↓
connector-manager
```

## Create

```bash
qefro create-app restaurant-pro --name "Restaurant Pro" --hosting managed
cd restaurant-pro
```

Typical package layout (from managed-apps / restaurant-pro):

```text
restaurant-pro/
├── manifest.yaml          # id, version, hosting, endpoint, permissions, tools, ui, …
├── package.json
├── Dockerfile             # required for hosting: managed
├── src/                   # SDK application — business logic
│   └── index.js
├── workflows/             # optional YAML — call app tools only
├── prompts/               # optional
├── assets/                # optional
└── ui/                    # optional staff UI (theme, pages, widgets, …)
```

## Application code

Same SDK as external:

```javascript
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({
  signingSecret: process.env.QEFRO_SIGNING_SECRET || 'dev-secret',
  endpointPath: '/qefro',
});

app.tool('restaurant.createReservation', { /* … */ }, async (ctx) => {
  const customer = await ctx.customer.resolve({
    phone: ctx.parameters.phone,
    display_name: ctx.parameters.guest_name,
  });
  const doc = await ctx.storage.insert('reservations', {
    guest_name: ctx.parameters.guest_name,
    covers: ctx.parameters.covers,
    customer_id: customer?.id,
  }, { allocate_code: { prefix: 'R-', start: 1001 } });
  return doc;
});

await app.listen({ port: Number(process.env.PORT || 8080) });
```

Restaurant Pro also registers `app.marketing({…})` and `app.organization({…})` — metadata advertised on `capabilities.list`.

## Manifest (actual fields)

From `restaurant-pro` / starter templates. Only document fields that exist in those manifests:

| Field | Example | Role |
| --- | --- | --- |
| `id` | `restaurant-pro` | Solution id |
| `name` | `Restaurant Pro` | Display name |
| `version` | `1.10.4` | Package version |
| `hosting` | `managed` | Runtime ownership |
| `endpoint` | `http://restaurant-pro:8080` | In-cluster base (platform appends `/qefro`) |
| `description` | … | Catalog copy |
| `category` / `tags` | hospitality / … | Discovery |
| `connectors` | `[]` | Pool connector deps (often empty for self-contained apps) |
| `channels` | `widget`, `whatsapp` | Channel support |
| `flows` / `prompts` | ids | Declared orchestration assets |
| `permissions` | `storage.read`, `organization.write`, … | Install permissions |
| `capabilities` | `runtime.query`, `storage.write`, … | Declared platform capabilities |
| `settings` | brand colors, business_name, … | Per-install settings |
| `onboarding` | step ids | Install checklist |
| `triggers` | intent → workflow | Channel trigger map |
| `collections` | name + `allocate_code` | Storage collection hints |
| `ui` | logo, icon, pages… | Staff UI |
| `tools` | tool ids + parameters | Catalog / chat tool metadata |

**ADR-003:** workflows and UI must call **app tools**, never platform `storage/*` directly. Persist only via `ctx.storage` inside the SDK process.

## Configure permissions

Restaurant Pro requests storage + organization permissions, for example:

```yaml
permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
  - organization.read
  - organization.write
```

## Run locally

```bash
# validate package
qefro dev .

# run SDK process (example)
export QEFRO_SIGNING_SECRET=dev-secret
npm start   # or node src/index.js — follow package.json
```

## Publish & install

```bash
# Platform admin
qefro publish .
# or: qefro solution publish .

# Tenant install
qefro solution install restaurant-pro --version 1.10.4
# optional: --settings '{"business_name":"Demo Bistro"}'
```

CLI env (from `qefro-cli`):

- `QEFRO_SOLUTION_URL` (default `http://127.0.0.1:8105`)
- `QEFRO_TENANT_ID`, `QEFRO_ORGANIZATION_ID`
- `QEFRO_PUBLISHER_ID` (must be a platform admin)
- `QEFRO_SIGNING_KEY_HEX` or `QEFRO_KEYS_FILE`
- `QEFRO_INTERNAL_BEARER` when service auth is enforced

Tenants **install**; they cannot publish.

## Managed runtime

```text
Solution Installation
       ↓
solution-service
       ↓
managed runtime / connector instance
       ↓
/qefro
       ↓
connector-manager  POST /v1/invoke  target install:{solution}
```

Qefro:

1. Accepts published package
2. Validates / signs registry artifact
3. On install: records tenant install + **installation binding** (`hosting`, `endpoint_url`, generated `public_key` / `secret_key`, capabilities, status)
4. Starts/routes managed process (`hosting: managed`)
5. Health via lifecycle / ping paths used by the platform
6. Invokes tools through connector-manager with HMAC
7. Upgrades via `upgrade_for_tenant` (re-registers runtime; refreshes marketing/organization sync best-effort)
8. Stop/remove follows solution uninstall lifecycle

Binding lookup (connector-manager):  
`GET {SOLUTION_SERVICE_URL}/v1/tenant/solutions/{solution}/connector?workspace_id=…`

GET binding response includes `installation_id`, `solution_id`, `workspace_id`, `hosting`, `endpoint`, `public_key`, `capabilities`, `status` — **`secret_key` is never returned**.

External register path: `POST /v1/tenant/solutions/:name/connector` sets `hosting: external`.

## Managed storage

Application-owned domain data (Restaurant):

```text
reservations, orders, menu, tables  →  ctx.storage collections
```

Platform-owned:

```text
Customer Hub identity
Organization workflow state / inbox
Marketing campaigns / delivery
```

See [storage.md](./storage.md) and [customer-hub.md](./customer-hub.md).

## Test

```text
publish → install → health / ping → tool.invoke → upgrade
```

Use package smoke scripts when present (e.g. Restaurant Pro `scripts/smoke-tools.mjs`).

## Production considerations

- Pin SDK version in `package.json`
- Treat `QEFRO_SIGNING_SECRET` as platform-injected for managed runtimes
- Keep tool contracts stable across upgrades
- Never call other solutions’ tools directly — use Organization workflows

## Troubleshoot

| Symptom | Check |
| --- | --- |
| Install fails | Manifest validation; image; permissions |
| Tools not available | Install active? Binding endpoint? Sync after upgrade? |
| Storage errors | Permissions + `platform.storage` on invoke |
| Wrong workspace | Installation binding / workspace headers |

More: [troubleshooting.md](./troubleshooting.md), [marketplace-publishing.md](./marketplace-publishing.md).
