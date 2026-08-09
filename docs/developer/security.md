---
title: "Security"
description: "Trust boundaries for external SDK connections and managed marketplace apps."
sidebar_label: "Security"
---

# Security

## Trust boundary

| Party | Trusted for |
| --- | --- |
| Qefro platform | Signing invokes, tenancy headers, injecting `platform` bindings |
| Your application | Domain logic, whatever data plane you connect (ERP, `ctx.storage`) |
| End user | Only via channel identity + challenges — never raw signing secret |

## Tenant & workspace isolation

- Storage documents scoped by `platform.storage.context` (tenant/workspace/installation/solution)
- ACS SDK connections are **per organization/tenant**
- Managed installs bind per tenant/workspace
- Pure external tools without install scope should not assume managed storage

## Connection authentication

HMAC `v1=` over `v1:{ts}:{body}` — [authentication.md](./authentication.md). Reject skew > configured window (default 300s).

## Secrets

| Secret | External | Managed |
| --- | --- | --- |
| `/qefro` signing secret | Customer env + ACS encrypted secret | Platform-injected env |
| ERP credentials | Customer secret store | Prefer platform secret mechanisms / install settings — not git |
| Storage bearer | N/A or platform token when scoped | `platform.storage.token` / service token |

Never commit real secrets. Docs and demos use placeholders like `dev-secret`.

## Permissions

Managed manifests declare `permissions` / `capabilities` (storage, organization, marketing, workflow). Runtime enforces platform-side authorization for gated APIs.

## Customer Hub isolation

Hub operations require `platform.customer` binding and Hub feature enablement. Apps must not invent cross-tenant customer ids.

## Managed application isolation

Each install gets its own binding and storage scope (`installation_id` / `solution_id`). Do not share mutable global state across tenants inside one process without explicit multi-tenant design.

## External application trust

An external connector is a **privileged peer**: it can return tool outputs the AI will trust. Protect your webhook network path; rotate secrets; validate inputs; avoid SSRF from your own outbound calls.

## SDK permissions field

Tool `permissions: string[]` is advertised metadata (default `[]`). Do not confuse with solution-service install permission grants.
