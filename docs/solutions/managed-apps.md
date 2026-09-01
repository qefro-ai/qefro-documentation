---
title: "Managed apps"
description: "SDK-hosted packages (hosting: managed | external) — /qefro process, optional UI/workflows, ctx.storage. Not the default Marketplace App path."
sidebar_label: "Managed apps"
---

# Managed apps

This page is for **SDK-hosted** packages (`hosting: managed` or
`external`): a signed `/qefro` process is the application
([ADR-003](/docs/solutions/architecture)).

**That is not the default Marketplace App.** New Restaurant, Clinic, Real
Estate, Booking, and CRM apps are **metadata** (`hosting: runtime`)
executed by Qefro Runtime — no SDK server. Start at
[Build your first app](/docs/solutions/build-your-first-app) and
[Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

Use this page when you are wrapping an existing system of record or
maintaining a legacy `/qefro` Marketplace package such as
[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) (takeaway).

Business logic lives in `src/` (Node.js, Rust, or Python), exposed on a
signed `/qefro` endpoint. Optional YAML workflows, prompts, and UI only
**orchestrate and present** — they never own domain rules and never call
platform `storage/*` directly.

:::danger Deprecated (pre–ADR-003 YAML-only storage)
Packages that ship **only** YAML + UI and call `storage/insert` /
`storage/find` from workflows or UI sources are **incorrect** for the
SDK-hosted path. Metadata Marketplace Apps persist via Runtime entity
tools instead — see [restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime).
:::

## Managed app vs pool connector

| | SDK-hosted app | Pool connector | Metadata Marketplace App |
| --- | --- | --- | --- |
| Role | `/qefro` product wrapping your logic or SoR | Shared external SoR adapter | Declarative package, no SDK process |
| Process | Install’s own `/qefro` (`managed` or `external`) | Shared pool instance | Qefro Runtime |
| App state | [Managed storage](/docs/solutions/managed-storage) via `ctx.storage` | External API | Runtime entity tools → managed storage |
| Reference | [`restaurant-pro`](/docs/solutions/examples/restaurant-pro) | Commerce / POS connectors | [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime) |

You can mix both: the app owns solution documents in storage and calls a
pool connector when syncing to an external system of record.

## Architecture

```text
Channels (widget / WhatsApp) ─┐
Staff UI (portal / subdomain) ─┼─→ runtime → tool invoker
Install settings (brand, …) ───┘         │
                                         ▼
                              installation binding → app /qefro
                                         │
                                         ▼
                              app tools (restaurant.*)
                                         │
                                         ▼
                              ctx.storage.* → storage-service → MongoDB
```

- **`src/`** — required SDK application (business logic + storage access).
- **Workflows / UI** — optional; call **app tools** (`{solution}/{tool}`).
- **Install** — per workspace; settings and UI brand overlay are per install.
- **Portal** — renders the declarative UI bundle (no package JS in the UI).

## Package checklist

```text
my-app/
├── manifest.yaml          # id, version, hosting, endpoint, permissions, ui
├── src/                   # required — SDK app (@qefro-ai/backend, …)
├── package.json           # and/or Cargo.toml / pyproject.toml
├── Dockerfile             # required for hosting: managed
├── workflows/*.yaml       # optional — tool steps → my-app/…
├── prompts/*.yaml         # optional
├── assets/                # optional
└── ui/                    # optional staff UI
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml       # targets: my-app/myApp.listThings | runtime
```

Minimum surface for a storage-backed app:

```yaml title="manifest.yaml (excerpt)"
id: my-app
version: 1.0.0
hosting: managed
endpoint: http://my-app:8080
connectors: []
permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
capabilities:
  - theme.get
  - user.get
  - tenant.get
  - runtime.query
  - workflow.trigger
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
ui:
  name: My App
  logo: assets/logo.svg
  icon: assets/icon.svg
```

`storage.*` permissions authorize the **SDK process** to use managed
storage. UI list sources that call your own app tools are gated on
**`runtime.query`** (not `connector.invoke`, and not by calling
`storage/find` from the UI).

See [Manifest](/docs/solutions/manifest), [Packaging](/docs/solutions/packaging),
and [Publishing](/docs/solutions/publishing).

## SDK application (`src/`)

```js title="src/index.js (excerpt)"
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({
  signingSecret: process.env.QEFRO_SIGNING_SECRET,
  endpointPath: '/qefro',
});

app.tool(
  { name: 'myApp.createThing', description: '…', auth: 'none', input_schema: { … } },
  async (ctx) => {
    // Validate, allocate codes, enforce domain rules — then persist.
    return ctx.storage.insert('things', { name: ctx.parameters.name, status: 'open' });
  },
);

app.tool(
  { name: 'myApp.listThings', description: '…', auth: 'none', input_schema: { … } },
  async (ctx) => ctx.storage.find('things', { limit: ctx.parameters.limit ?? 50 }),
);

await app.listen({ port: Number(process.env.PORT || 8080) });
```

Handlers call `ctx.storage.insert|find|get|update|delete` — never Mongo, never
ad-hoc storage-service URLs. The runtime injects `platform.storage` on
`tool.invoke` (or you set `QEFRO_STORAGE_URL` for local dev).

## Workflows and UI (orchestration only)

**Workflow tool step** — call the app, not `storage/*`:

```yaml
- id: create
  type: tool
  tool: my-app/myApp.createThing
  params:
    name: "{{ variables.name }}"
```

**UI source** — list via an app tool (`{solution}/{tool}`):

```yaml title="ui/sources.yaml"
- id: things
  type: connector
  target: my-app/myApp.listThings
  params:
    limit: 50
```

(`type: connector` is the YAML shape; own-app targets are routed to the
install’s `/qefro` and gated on `runtime.query`.)

## Declarative UI patterns

### Pages and navigation

Declare pages in `ui/pages.yaml`, wire them in `ui/navigation.yaml`, and
place widgets with spans. See [Pages](/docs/solutions/pages),
[Navigation](/docs/solutions/navigation), [Layouts](/docs/solutions/layouts).

### Staff CRUD (form → workflow → app tool)

1. Add a `form` widget with `action.trigger: staff-*-create`.
2. Add a webhook workflow whose `tool` step calls `my-app/myApp.createThing`.
3. List data with a `table` bound to a `my-app/myApp.listThings` source.
4. Row click stores selection for `prefill_from_selection` forms.

```yaml title="ui/widgets.yaml (excerpt)"
- id: menu_create_form
  type: form
  title: Add menu item
  options:
    fields:
      - { name: name, label: Dish name, type: text, required: true }
      - { name: price, label: Price, type: number, required: true }
    submit_label: Add to menu
    action:
      trigger: staff-menu-create
```

Widget catalogue: [Forms](/docs/solutions/widgets/form),
[Tables](/docs/solutions/widgets/table), and siblings under Widgets.

### Floor plan (map widget)

Use `type: map` with `kind: floor` and `x` / `y` (0–100) on table documents
loaded from your app’s list tool.

## Brand customization (per install)

Package `ui/theme.yaml` sets **defaults**. Tenants override brand via
**installation settings** (Install wizard or Installed → Configure).

| Setting key | Type | Effect |
| --- | --- | --- |
| `business_name` | string | UI header + prompt variables |
| `logo_url` | url | HTTPS logo (overrides package asset) |
| `background_image_url` | url | Full-bleed shell background |
| `primary_color` | color | `--sui-primary` |
| `secondary_color` | color | `--sui-secondary` |
| `accent_color` | color | `--sui-accent` |
| `background_color` | color | `--sui-bg` |

Declare them under `settings:` in the manifest. At UI bundle load, the
platform overlays non-empty values onto the theme / name / logo.
See [Themes](/docs/solutions/themes).

### Workspace scoping

Installs and settings are **workspace-scoped**. Portal UI data queries must
send `workspace_id` so storage isolation matches the install (not the org id).

## Hosting surfaces

| Surface | URL shape |
| --- | --- |
| In-portal UI | `https://app.qefro.com/app/solutions/ui/{name}/…` |
| Solution subdomain | `https://{slug}.portal.qefro.com/…` |

| Mode | Manifest | Endpoint |
| --- | --- | --- |
| Managed | `hosting: managed` | Platform runs your image; e.g. `http://restaurant-pro:8080` |
| External | `hosting: external` | Your HTTPS `/qefro` URL |

## Build, publish, install

```bash
qefro solution build .    # requires src/
qefro solution publish
qefro solution install my-app
# upgrade: POST /api/v1/installations/my-app/upgrade
#   { "target_version": "1.7.0" }  (+ workspace_id as needed)
```

Platform prerequisites: `storage-service` + Mongo `managed_apps`, plus a
live installation binding to your `/qefro` process. See
[Managed storage](/docs/solutions/managed-storage) and
[Installation](/docs/solutions/installation).

## Reference: restaurant-pro

[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) (**1.7.0+**)
is the canonical ADR-003 package:

- Required `src/` SDK app (`restaurant.*` tools → `ctx.storage`)
- Optional workflows/UI that call `restaurant-pro/restaurant.*` only
- Brand settings, staff forms, conversation chips

## Related docs

- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk) — choose the right path
- [Overview](/docs/solutions/overview) — metadata Marketplace Apps (default)
- [Quickstart](/docs/solutions/quickstart)
- [Managed storage](/docs/solutions/managed-storage)
- [restaurant-pro (SDK takeaway)](/docs/solutions/examples/restaurant-pro)
- [Troubleshooting](/docs/solutions/troubleshooting)
