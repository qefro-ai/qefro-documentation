---
title: "Organization"
description: "Register organization capability metadata and participate in cross-app workflows."
sidebar_label: "Organization"
---

# Organization

Applications publish **capability metadata**. The platform owns the capability graph, workflows, and inbox.

## Register metadata

```javascript
app.organization({
  version: 1,
  events: [
    { id: 'purchase_requested', label: 'Purchase requested', description: '…', payloadSchema: { … } },
  ],
  actions: [
    { id: 'approve_purchase', label: 'Approve purchase', inputSchema: { … }, outputSchema: { … } },
  ],
  tasks: [
    {
      id: 'quotation_approval',
      label: 'Quotation approval',
      suggested_workspace_type: 'finance',
      priority: 'high',
    },
  ],
});
```

Ids must be **opaque** — no `.` characters (no `restaurant.approve`). Validated by the SDK.

Advertised on `capabilities.list.organization` as:

```json
{ "version": 1, "metadata": { "events": [], "actions": [], "tasks": [] } }
```

## Capability metadata vs workflow execution

| Layer | Owner |
| --- | --- |
| Events / actions / tasks metadata | Application (`app.organization`) |
| Workflow definitions & runs | Organization Runtime / platform |
| Human tasks & inbox | Platform |
| Action execution → app tool | Platform invokes `/qefro` tool |

## Flow

```text
Application Event
      ↓
Organization Workflow
      ↓
Task
      ↓
Action
      ↓
Application tool (/qefro)
```

Example (Restaurant + Finance / ABM):

```text
purchase_requested
       ↓
Organization Workflow
       ↓
Approval Task
       ↓
approve_purchase
```

## Runtime client

When `platform.organization` is injected, the SDK exports `buildOrganizationContext` / `OrganizationContext` with:

```typescript
getCapabilities(): Promise<Record<string, unknown> | null>
```

**Not confirmed on `ToolContext`:** handlers do **not** receive `ctx.organization` in `@qefro-ai/backend` 1.7.0 — only `app.organization({…})` advertisement plus the optional exported builder. Gated by `QEFRO_ORGANIZATION_ENABLED`.

## Rules

> **Applications must never call each other directly.**

Emit events / expose actions; let Organization workflows connect Restaurant Pro → Finance Pro (or ABM connector actions).

## External connectors

ABM demo optionally posts org events using env such as `QEFRO_ORG_EVENT_URL`, `QEFRO_ORG_EVENT_TOKEN`, `QEFRO_ORG_TENANT_ID`, `QEFRO_ORG_WORKSPACE_ID`. Confirm current platform routes before wiring production emitters.

Managed installs sync organization capabilities after install/upgrade (solution-service best-effort `capabilities.list` pull).
