---
title: "Marketplace publishing"
description: "Build, publish, install, and upgrade managed solution packages."
sidebar_label: "Marketplace publishing"
---

# Marketplace publishing

Applies to **Managed Marketplace Apps**. External SDK Connections do not use this path.

## Lifecycle

```text
create-app → develop src/ + manifest → qefro dev → publish → Marketplace/catalog
    → tenant install → managed runtime → upgrade
```

## CLI commands (current)

```text
qefro create-app <id> [--name NAME] [--hosting managed|external] [--endpoint URL] [--minimal]
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

`id`, `name`, `version`, `hosting`, `endpoint`, `permissions`, `capabilities`, `tools`, optional `ui`, `workflows`, `settings`, `collections`.

See [managed-marketplace-app.md](./managed-marketplace-app.md) and [Solution packaging](/docs/solutions/packaging).

## Secrets & settings

- **Signing secret** — runtime env for `/qefro` HMAC
- **Install settings** — brand and business config from `manifest.settings` (e.g. `business_name`, colors)
- **Internal bearers** — platform ↔ storage-service (`QEFRO_INTERNAL_BEARER`, …)

Do not put long-lived customer ERP credentials in manifest defaults; use install settings or secret injection mechanisms provided by the platform.

## Catalog UX

Portal Marketplace / Solutions UI installs published packages into workspaces. Deep UI docs: [solutions/marketplace](/docs/solutions/marketplace), [solutions/installation](/docs/solutions/installation).
