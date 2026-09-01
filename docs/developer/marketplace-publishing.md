---
title: "Marketplace publishing"
description: "Build, publish, install, and upgrade Marketplace App packages (metadata first)."
sidebar_label: "Marketplace publishing"
---

# Marketplace publishing

Applies to **Marketplace Apps**. External SDK Connections do not use this
path — they register a webhook under Business Tools.

Default packages are **metadata** (`hosting: runtime`). SDK-hosted
`hosting: managed` packages remain supported; see
[Managed apps](/docs/solutions/managed-apps).

## Lifecycle

```text
qefro app init → edit entities/workflows/ui → qefro app validate
  → qefro app package → publish → Marketplace/catalog
  → tenant install → Qefro Runtime
```

## CLI commands (current)

```text
qefro app init <id> [--name NAME] [--hosting runtime]
qefro app validate [dir]
qefro app package [dir]
qefro app install <name> [--version V] [--settings JSON]
qefro create-app <id> [--name NAME] [--hosting managed|external|runtime]
                                                    [--endpoint URL] [--minimal]
qefro dev [dir]
qefro publish [dir]                 # alias of solution publish
qefro solution build <dir>
qefro solution publish <dir>
qefro solution install <name> [--version V] [--settings JSON]
qefro solution list
qefro register --endpoint URL [--solution ID]
```

Only **platform admins** can publish (`QEFRO_PUBLISHER_ID` ∈ `QEFRO_PLATFORM_ADMIN_IDS`). Tenants install.

## Versioning

| Concept | Owner |
| --- | --- |
| Published solution version (`manifest.version`) | Publisher |
| Installed version per tenant | solution-service |
| Upgrade | `upgrade_for_tenant` / install with newer version |
| Rollback | Follow platform install version history (use supported install APIs — do not invent CLI flags) |

On upgrade, solution-service re-registers with the runtime plane and best-effort refreshes marketing + organization capability sync.

## Manifest essentials

`id`, `name`, `version`, `hosting` (`runtime` for metadata apps),
`entities` / `flows` / `events`, `permissions`, `capabilities`, optional
`ui`, `triggers`, `conversation_slots`. SDK-hosted packages also set
`endpoint`, `tools`, `Dockerfile`.

See [managed-marketplace-app.md](./managed-marketplace-app.md) and [Solution packaging](/docs/solutions/packaging).

## Secrets & settings

- **Signing secret** — only for SDK `/qefro` processes
- **Install settings** — brand and business config from `manifest.settings`
- **Internal bearers** — platform ↔ storage-service (`QEFRO_INTERNAL_BEARER`, …)

Do not put long-lived customer ERP credentials in manifest defaults; use install settings or secret injection mechanisms provided by the platform.

## Catalog UX

Portal Marketplace / Solutions UI installs published packages into workspaces. Deep UI docs: [solutions/marketplace](/docs/solutions/marketplace), [solutions/installation](/docs/solutions/installation).
