---
title: "App scaffold"
description: "Overall ownership model and how qefro create-app scaffolds an SDK application."
sidebar_label: "App scaffold"
---

# App scaffold

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
| **Application** | Domain tools on `/qefro` + optional UI/workflows | Shared catalog package; per-workspace install + settings |

Installing a second primary app into a workspace that already has one is
rejected. Channel digits (`?n=` on booking links) come from the workspace
WhatsApp binding — do not put `whatsapp_business_number` in install settings.

See [Architecture](/docs/solutions/architecture) and
[Installation](/docs/solutions/installation).

## Create an app

```bash
# Full booking starter (storage, Hub, marketing, organization, booking bridge, UI)
qefro create-app warehouse-pro --name "Warehouse Pro"
cd warehouse-pro
npm install && npm run dev

# Flags
qefro create-app my-app --hosting managed|external [--endpoint URL]
qefro create-app my-app --minimal   # hello-only stub

# Template path when the CLI is not run from a platform checkout:
export QEFRO_APP_TEMPLATE=/path/to/templates/sdk-app-starter
```

Walkthrough: [Build your first app](/docs/solutions/build-your-first-app).

The CLI copies [`templates/sdk-app-starter`](https://github.com/qefro-ai/qefro-platform/tree/main/templates/sdk-app-starter)
from the platform repo (or the hello stub with `--minimal`).

### Generated layout

```text
my-salon/
├── manifest.yaml          # id, version, hosting, endpoint, permissions
├── src/                   # required SDK app — tools + ctx.storage
├── package.json
├── Dockerfile             # managed hosting image
├── assets/
├── workflows/             # optional orchestration (calls app tools only)
├── prompts/
├── booking/               # static WhatsApp bridge (?n= filled by platform)
├── onboarding/
└── ui/                    # declarative portal UI
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

### Reference verticals

Same scaffold surface, different domain nouns:

| App | Path (platform repo) |
| --- | --- |
| Restaurant Pro | `docs/examples/restaurant-pro/` |
| Clinic Pro | `docs/examples/clinic-pro/` |
| Salon Pro | `docs/examples/salon-pro/` |

## From scaffold to live

1. Implement tools in `src/` (domain rules live here only).
2. Optional: workflows, prompts, declarative UI.
3. `qefro solution build .` — validate + sign.
4. **Platform admin** publishes — see [Publishing](/docs/solutions/publishing).
5. Tenant installs into a workspace — see [Installation](/docs/solutions/installation).
6. Deploy / bind the `/qefro` process (`hosting: managed` or `external`).

:::important
Tenants and workspace admins **install** apps. Only **platform admins**
publish versions into the global catalog.
:::

## Related topics

- [Managed apps](/docs/solutions/managed-apps) — ADR-003 developer guide
- [Quickstart](/docs/solutions/quickstart) — end-to-end loop
- [Manifest](/docs/solutions/manifest) — package identity
- [Publishing](/docs/solutions/publishing) — platform-admin-only catalog write
