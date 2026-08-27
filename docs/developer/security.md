---
title: "Security"
description: "Trust boundaries for external SDK connections and managed marketplace apps — HMAC, tenancy, secrets, and what your process must not assume."
sidebar_label: "Security"
---

# Security

Platform-wide controls (isolation, encryption, SSRF, audit, compliance) live in the **[Security](/docs/security/overview)** section. This page is the **application-builder** contract: what you can trust from Qefro, and what your `/qefro` process must enforce itself.

Also read [Application security](/docs/security/application-security) and [Solution security](/docs/solutions/security).

## Trust boundary

| Party | Trusted for |
| --- | --- |
| Qefro platform | Signing invokes, tenancy headers, injecting `platform` bindings |
| Your application | Domain logic, whatever data plane you connect (ERP, `ctx.storage`) |
| End user | Only via channel identity + challenges — never raw signing secret |

An external connector is a **privileged peer**: it can return tool outputs the AI will trust. Protect your webhook network path; rotate secrets; validate inputs; apply SSRF controls on **your** outbound calls.

## Tenant & workspace isolation

- Storage documents scoped by `platform.storage.context` (tenant/workspace/installation/solution)
- ACS SDK connections are **per organization/tenant**
- Managed installs bind per tenant/workspace
- Pure external tools without install scope should not assume managed storage
- Never trust client-supplied tenant ids over platform context
- Do not share mutable global state across tenants inside one process without explicit multi-tenant design

See [Tenancy and workspaces](./tenancy-and-workspaces.md) and [Tenant isolation](/docs/security/tenant-isolation).

## Connection authentication

HMAC `v1=` over `v1:{ts}:{body}` — [authentication.md](./authentication.md). Reject skew outside the configured window (default 300s). HTTP **401** `invalid_signature` on failure.

This authenticates **Qefro → your `/qefro`**. It does not replace customer OTP, org user JWTs, or storage bearer tokens.

## Secrets

| Secret | External | Managed |
| --- | --- | --- |
| `/qefro` signing secret | Customer env + ACS encrypted secret | Platform-injected env |
| ERP credentials | Customer secret store | Prefer platform secret mechanisms / install settings — not git |
| Storage bearer | N/A or platform token when scoped | `platform.storage.token` / service token |

Never commit real secrets. Docs and demos use placeholders like `dev-secret`. Rotation: `PATCH /api/v1/org/sdk-connections/{id}` then redeploy. Details: [Secrets](/docs/security/secrets).

## Permissions

Managed manifests declare `permissions` / `capabilities` (storage, organization, marketing, workflow). Runtime enforces platform-side authorization for gated APIs.

Tool `permissions: string[]` is advertised metadata (default `[]`). Do not confuse it with solution-service install permission grants.

## Customer Hub isolation

Hub operations require `platform.customer` binding and Hub feature enablement. Apps must not invent cross-tenant customer ids.

## Design checklist

- Validate every tool argument server-side — treat the model as untrusted
- Return the minimum fields required for the assistant (tool output may enter transcripts)
- Least capabilities at publish time; treat permission escalation as a major version
- Keep tenant URLs and credentials out of signed package files
- Log authorization allow/deny on **your** API; Qefro logs the invoke attempt

## Related topics

- [Security overview](/docs/security/overview)
- [Application security](/docs/security/application-security)
- [HMAC authentication](./authentication.md)
- [Tenancy](./tenancy-and-workspaces.md)
- [Solution security](/docs/solutions/security)
