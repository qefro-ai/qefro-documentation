---
title: "Build your first app"
description: "Scaffold, customize, publish, and install an SDK app with qefro create-app — without asking the platform team."
sidebar_label: "Build your first app"
---

# Build your first app

The maturity test for Qefro is not another internal vertical. It is:

```text
qefro create-app warehouse-pro
  → customize
  → publish
  → install
  → works
```

This guide is that loop, written so you can finish it without Slack.

## What you will build

`qefro create-app` scaffolds a **full booking starter**: managed storage,
Customer Hub (optional), Marketing metadata, Organization capability ids,
WhatsApp booking bridge, onboarding, and a staff dashboard.

Rename the domain nouns to your vertical (warehouse, clinic, salon, …).
Keep the platform capabilities — that is the point.

| Reference examples | Path |
|--------------------|------|
| Restaurant Pro | `qefro-plugin-platform/docs/examples/restaurant-pro` |
| Clinic Pro | `…/clinic-pro` |
| Salon Pro | `…/salon-pro` |
| Finance Pro | `…/finance-pro` |

## Prerequisites

1. **`qefro` CLI** on your `PATH`  
   Build from the platform checkout if you do not have a release binary:

   ```bash
   cd qefro-plugin-platform/services/qefro-cli
   cargo install --path .
   ```

   For `create-app`, either run the CLI from a tree that contains
   `templates/sdk-app-starter`, or set:

   ```bash
   export QEFRO_APP_TEMPLATE=/absolute/path/to/templates/sdk-app-starter
   ```

2. **Node.js 18+** (starter is `@qefro-ai/backend`).

3. **Publish credentials** (only for the publish step — see
   [Publishing](/docs/solutions/publishing)):

   | Env | Purpose |
   |-----|---------|
   | `QEFRO_SOLUTION_URL` | solution-service base URL |
   | `QEFRO_PUBLISHER_ID` | UUID in `QEFRO_PLATFORM_ADMIN_IDS` |
   | `QEFRO_SIGNING_KEY_HEX` | Ed25519 private key (32-byte hex) matching catalog trust anchors |
   | `QEFRO_TENANT_ID` / `QEFRO_ORGANIZATION_ID` | For `qefro solution install` |
   | `QEFRO_INTERNAL_BEARER` | When service auth is enforce |

:::info Partner publish
Today, **catalog publish is platform-admin only**. Tenant admins install;
they do not publish. Ask your Qefro contact for a publisher UUID + signing
key, or use a local stack with `QEFRO_PUBLISH_OPEN=true`. See
[Marketplace](/docs/solutions/marketplace).
:::

## Step 1 — Scaffold

```bash
qefro create-app warehouse-pro --name "Warehouse Pro"
cd warehouse-pro
npm install
npm run dev
# → listening on http://0.0.0.0:8080/qefro
```

Useful flags:

```bash
qefro create-app warehouse-pro --hosting managed          # default
qefro create-app warehouse-pro --hosting external --endpoint https://api.example.com/qefro
qefro create-app scratch --minimal                        # hello-only stub
```

Generated layout:

```text
warehouse-pro/
├── manifest.yaml      # id, version, tools, onboarding, settings
├── src/index.js       # required SDK app (/qefro)
├── package.json
├── Dockerfile
├── workflows/         # optional orchestration → app tools
├── prompts/
├── booking/           # static WhatsApp bridge (store-nothing)
├── onboarding/
├── ui/                # staff dashboard
└── assets/
```

## Step 2 — Make it your domain

You do **not** need a new ADR. Change nouns and collections:

1. **Tools** — `__TOOL_PREFIX__` becomes `warehouse` automatically from the
   app id. Rename handlers (`createAppointment` → `createPick`, …) in
   `src/index.js` and `manifest.yaml` `tools:`.
2. **Storage** — pick collections that match the domain
   (`bins`, `skus`, `picks` instead of `staff` / `services` / `appointments`).
   Persist only via `ctx.storage.*`.
3. **Workflows / prompts / UI** — update YAML to call your new tool ids.
4. **Marketing / Organization** — keep `app.marketing` and
   `app.organization` registrations; change **opaque ids** and labels to
   fit the domain (`stock_low`, `fulfillment_requested`, …). Never put
   another app's name in an id (`finance.approve` is forbidden).

Rules that never change:

- Business logic only in the SDK process on `/qefro`.
- Workflows and UI call **app tools**, never `storage/*`.
- WhatsApp number comes from the **workspace channel**, not install settings.
- Same package version for every tenant.

## Step 3 — Validate locally

```bash
qefro dev .
```

This assembles the package (including `onboarding/*.yaml`) and checks
forbidden storage targets. Fix any errors before publish.

Smoke the app:

```bash
curl -s http://127.0.0.1:8080/qefro   # expect signed protocol responses via runtime in real installs
```

For a full local stack, run solution-service + runtime + storage per
[Managed apps](/docs/solutions/managed-apps).

## Step 4 — Build and publish

```bash
export QEFRO_SOLUTION_URL=https://…          # or http://127.0.0.1:8105
export QEFRO_PUBLISHER_ID=<admin-uuid>
export QEFRO_SIGNING_KEY_HEX=<32-byte-hex>

# Bump version in manifest.yaml when re-publishing
qefro solution build .
qefro solution publish .
# alias: qefro publish .
```

Success returns a `201` with `name`, `version`, and `checksum`.  
Details: [Publishing](/docs/solutions/publishing).

**Managed hosting:** the platform must run your container image at the
manifest `endpoint` (e.g. `http://warehouse-pro:8080`). Ship a `Dockerfile`
(the starter includes one). Coordinate image build/tag with ops until
partner self-serve image push exists.

**External hosting:** deploy `/qefro` yourself, then:

```bash
qefro register --endpoint https://your-host/qefro --solution warehouse-pro
```

## Step 5 — Install

From the Admin Console (**Applications → Marketplace → Install**), or CLI:

```bash
export QEFRO_TENANT_ID=…
export QEFRO_ORGANIZATION_ID=…
# workspace context as required by your deployment

qefro solution install warehouse-pro --version 0.1.0
```

Then in the portal:

1. Open the workspace → Installed solutions → Configure (`business_name`, brand).
2. **Settings → Customer channels** → connect WhatsApp (one active number per workspace).
3. Complete onboarding (WhatsApp, business name, optional demo seed, booking link).
4. Open the solution UI and create a real record (skip demo seed for production).

Tenant install docs: [Installation](/docs/solutions/installation).  
Catalog discovery: [Marketplace](/docs/solutions/marketplace).

## Acceptance checklist

You are done when **all** of these pass without platform-team intervention
beyond provisioned credentials:

- [ ] `qefro create-app warehouse-pro` produced a runnable tree
- [ ] `npm run dev` serves `/qefro`
- [ ] `qefro solution build .` succeeds (onboarding packaged)
- [ ] `qefro solution publish .` returns 201
- [ ] Install appears in Marketplace / Installed
- [ ] Staff UI loads and writes through app tools → `ctx.storage`
- [ ] WhatsApp or widget can complete one domain action end-to-end

## Next

| Guide | When you need it |
|-------|------------------|
| [Publishing](/docs/solutions/publishing) | Signing, versions, yank |
| [Marketplace](/docs/solutions/marketplace) | How tenants find and install |
| [Organization workflows](/docs/solutions/organization-workflows) | Cross-app events/tasks |
| [Customer Hub](/docs/solutions/customer-hub) | Shared customer identity |
| [Marketing](/docs/solutions/marketing) | Audiences and WhatsApp campaigns |
| [Troubleshooting](/docs/solutions/troubleshooting) | Common failures |

Engineering deep-dive: [Building SDK-based solutions](https://github.com/qefro-ai/qefro-platform/blob/main/docs/building-sdk-based-solutions.md).
