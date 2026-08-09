---
title: "Tenancy and workspaces"
description: "Tenant, workspace, installation, and connection context passed to SDK applications."
sidebar_label: "Tenancy & workspaces"
---

# Tenancy and workspaces

## Identifiers you will see

| Identifier | Meaning |
| --- | --- |
| `tenant_id` / `organization_id` | Customer organization (ACS often uses organization id as tenant scope for connections) |
| `workspace_id` | AI / ops workspace within the org |
| `connection_id` | External **SDK Connection** row id |
| `installation_id` | Managed **solution installation** id |
| `solution_id` | Marketplace / package id (e.g. `restaurant-pro`) |
| `conversation_id` | Chat / session |
| `request_id` | Protocol / platform request id |
| `trace_id` | Distributed trace (`x-qefro-trace-id`) |
| `tool_invocation_id` / `execution_id` | Runtime execution headers (connector-manager) |
| `identity` / `person` | End-user / Customer Hub person |

## Where they appear

### Protocol body

`organization_id`, `conversation_id`, `identity`, `person`, `platform`.

### Headers (connector-manager egress)

Examples: `x-qefro-tenant-id`, `x-qefro-organization-id`, `x-qefro-workspace-id`, `x-qefro-request-id`, `x-qefro-conversation-id`, `x-qefro-trace-id`, tool invocation / execution / idempotency headers.

### `platform.*.context`

When injected:

```typescript
// platform.storage.context
{
  tenant_id, workspace_id, installation_id, solution_id,
  identity_id?, capabilities[], source?
}
```

Customer / marketing / organization contexts use similar tenant/workspace/installation/solution fields.

## External SDK connection vs managed install

| Value | External SDK Connection | Managed Marketplace App |
| --- | --- | --- |
| Routing key | `sdk_connection_id` on Business Tools; webhook URL | Installation binding (`install:{solution}`) |
| `connection_id` | Yes (ACS connection) | No (install-centric) |
| `installation_id` | Only if invoke scope provides it | Yes |
| `solution_id` | Only if invoke scope provides it | Yes |
| `workspace_id` | From tool invoke auth context when present | From install / tenant context |
| `platform.storage` | **Omitted** unless install/solution scope exists | Present when storage-service configured |
| Domain data default | Your ERP/DB | `ctx.storage` collections |

**Implementation detail (ACS):** `build_platform_storage` returns `None` when there is no `installation_id` and no non-empty `solution_id`, so pure org SDK tools fail closed on `ctx.storage`.

## Isolation rules

- Never trust client-supplied tenant ids without platform context.
- Scope all writes using `platform.storage.context` (managed) or your own per-tenant credentials (external ERP).
- Do not call other applications’ tools directly — use Organization workflows across apps.

## User / execution context

- `identity` — channel-resolved attributes (phone, email, …)
- `person` — Hub Person snapshot when linked
- `authentication` — prior SDK auth payload
- `channel` — whatsapp / widget / …
- `trace_id` on `ctx.trace_id` when `x-qefro-trace-id` is passed through `handleRaw` (default `listen` path does not forward headers into dispatch today — use body `request_id` for correlation)
