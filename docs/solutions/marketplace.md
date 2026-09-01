---
title: "Marketplace"
description: "How tenants discover, install, and upgrade Marketplace Apps from the catalog — and what publishers must ship."
sidebar_label: "Marketplace"
---

# Marketplace

The Marketplace is the **tenant-facing catalog** of published solutions.
Publishing writes to the catalog; installing binds a version into a workspace.

```text
Publisher (platform admin today)
  → qefro app package && qefro publish
  → global catalog (solution-service)
  → Admin Console → Applications → Marketplace
  → Install wizard → workspace + Qefro Runtime
```

Default packages are **metadata** (`hosting: runtime`). The SDK is not a
Marketplace App hosting model — see [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## For tenants (installers)

1. Open **Applications → Marketplace** in the Admin Console (`app.qefro.com`).
2. Pick a solution (e.g. Restaurant Pro, Clinic Pro, or your published app).
3. Run the install wizard: workspace, settings, optional onboarding steps.
4. Connect **Settings → Customer channels** (WhatsApp) when the app needs chat.
5. Open the solution UI from **Installed**.

CLI equivalent (automation / ops):

```bash
export QEFRO_SOLUTION_URL=…
export QEFRO_TENANT_ID=…
export QEFRO_ORGANIZATION_ID=…
qefro app install <solution-id> --version <semver>
```

Full install contract: [Installation](/docs/solutions/installation).

### What installers never do

- Publish or yank catalog versions
- Call solution-service internal APIs from the browser
- Configure WhatsApp as an *install* setting (workspace owns the channel)

## For publishers

Today the publisher identity is a **platform admin** UUID listed in
`QEFRO_PLATFORM_ADMIN_IDS`. Partner self-serve listing is on the roadmap;
until then, use [Publishing](/docs/solutions/publishing) with provisioned keys.

### Listing checklist

| Requirement | Why |
|-------------|-----|
| Unique `manifest.id` + semver `version` | Catalog key |
| Valid signed package | Trust anchors |
| `hosting: runtime` + `entities/` | Marketplace App |
| No `storage/*` in workflows/UI | Rejected at validate/publish |
| Honest settings defaults | Install wizard |

### Upgrade path

Publish a new version → tenant upgrades from Installed (or
`qefro solution install … --version`). Versions are immutable; yank only for
severe issues ([Publishing](/docs/solutions/publishing)).

## Applications Health

Admin Console → **Applications → Health** (and Capability Explorer) show
whether installed apps registered Marketing / Organization capabilities and
whether bindings are healthy. Use this after install to confirm the package
synced metadata — not to debug tenant business data.

## Related

- [Build your first app](/docs/solutions/build-your-first-app)
- [Publishing](/docs/solutions/publishing)
- [Managed apps](/docs/solutions/managed-apps)
