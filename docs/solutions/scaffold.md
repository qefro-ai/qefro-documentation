---
title: "App scaffold"
description: "Ownership model and how qefro app init scaffolds a metadata Marketplace App (hosting: runtime)."
sidebar_label: "App scaffold"
---

# App scaffold

:::tip Prefer the full walkthrough
Primary path:
**[Build your first app](/docs/solutions/build-your-first-app)**
(`qefro app init restaurant-pro --hosting runtime`). This page covers
ownership + generated layout. The shorter [Quickstart](/docs/solutions/quickstart)
assumes you already have publish credentials.
:::

## Ownership model

```text
Tenant
  └── Workspace
        ├── Channels (e.g. WhatsApp — owned by the workspace)
        └── Application (one primary installable app per workspace)
```

| Layer | Owns | Notes |
| --- | --- | --- |
| **Tenant** | Org, users, billing | Portal login boundary |
| **Workspace** | Channels + one primary app | WhatsApp number binds to the workspace, not the package |
| **Application** | Metadata package (entities, flows, UI) | Shared catalog package; per-workspace install + settings. Qefro Runtime executes it. |

Installing a second primary app into a workspace that already has one is
rejected. Channel digits (`?n=` on booking links) come from the workspace
WhatsApp binding — do not put `whatsapp_business_number` in install settings.

See [Architecture](/docs/solutions/architecture) and
[Installation](/docs/solutions/installation).

## Create an app (default — metadata)

```bash
qefro app init restaurant-pro --name "Restaurant Pro" --hosting runtime
cd restaurant-pro
qefro app validate .
```

(`qefro app init` aliases `qefro create-app`.)

### Generated layout

```text
restaurant-pro/
├── manifest.yaml          # id, version, hosting: runtime, entities, flows, events
├── entities/              # required — domain schemas
│   └── record.yaml
├── workflows/             # Business Flows → FlowRunner
│   └── create-record.yaml
└── ui/
    ├── navigation.yaml
    ├── pages.yaml
    ├── widgets.yaml
    └── sources.yaml       # type: entity
```

No `src/`, no Dockerfile, no `/qefro` endpoint.

### Reference verticals

| App | Docs | Path (platform repo) |
| --- | --- | --- |
| Restaurant Pro Runtime | [example](/docs/solutions/examples/restaurant-pro-runtime) | `docs/examples/restaurant-pro-runtime/` |
| Real Estate Runtime | [example](/docs/solutions/examples/real-estate-runtime) | `docs/examples/real-estate-runtime/` |

## SDK-hosted scaffold (not the Marketplace default)

Use this only to wrap an **external** system or to maintain a legacy
`/qefro` package:

```bash
qefro create-app warehouse-pro --name "Warehouse Pro" --hosting managed
qefro create-app my-app --hosting external --endpoint https://api.example.com/qefro
qefro create-app my-app --minimal   # hello-only SDK stub

export QEFRO_APP_TEMPLATE=/path/to/templates/sdk-app-starter
```

That copies [`templates/sdk-app-starter`](https://github.com/qefro-ai/qefro-platform/tree/main/templates/sdk-app-starter)
(`src/` + Dockerfile). Historical verticals:
[`restaurant-pro`](/docs/solutions/examples/restaurant-pro),
[`clinic-pro`](/docs/solutions/examples/clinic-pro),
[`salon-pro`](/docs/solutions/examples/salon-pro).

See [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## From scaffold to live

1. Edit entities, workflows, and UI YAML.
2. `qefro app validate .`
3. `qefro app package .` — validate + sign.
4. **Platform admin** publishes — see [Publishing](/docs/solutions/publishing).
5. Tenant installs into a workspace — see [Installation](/docs/solutions/installation).

:::important
Tenants and workspace admins **install** apps. Only **platform admins**
publish versions into the global catalog.
:::

## Related topics

- [Build your first app](/docs/solutions/build-your-first-app) — primary path
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [Managed apps](/docs/solutions/managed-apps) — SDK-hosted packages
- [Manifest](/docs/solutions/manifest) — package identity
- [Publishing](/docs/solutions/publishing) — platform-admin-only catalog write
- [Quickstart](/docs/solutions/quickstart) — shorter loop
