---
title: "Organization workflows"
description: "Register opaque events, actions, and tasks with app.organization — let the platform orchestrate across apps without coupling."
sidebar_label: "Organization workflows"
---

# Organization workflows

Cross-application work (purchase approval, stock replenishment, refunds)
must **not** couple apps to each other. Warehouse Pro never imports Finance
tools. Finance never calls Restaurant endpoints.

Organization is the platform capability that makes that possible
([ADR-005](https://github.com/qefro-ai/qefro-platform/blob/main/docs/adr-005-organization-capability.md)).

## Mental model

```text
Your app                          Platform                         Other apps / humans
────────                          ────────                         ───────────────────
app.organization({ events,        capability graph                 Admin: Workflow Builder
  actions, tasks })               organization tasks/inbox         Internal: Approvals Inbox
emit event / implement action  →  linear workflow runtime       →  complete task → resume
```

| You publish (metadata) | Platform owns |
|------------------------|---------------|
| Event ids (`stock_low`) | Capability graph discovery |
| Action ids (`create_replenishment`) | Workflow definitions + runs |
| Task ids (`replenishment_approval`) | Workspace inbox + task complete |

**Ids are opaque.** No dots, no app prefixes (`warehouse.stock_low` is invalid).
Suggested workspace type / team are hints only.

## Register capabilities

In `src/index.js` (starter already includes a sample):

```js
app.organization({
  version: 1,
  events: [
    { id: 'stock_low', label: 'Stock low', description: 'Below reorder threshold' },
    { id: 'fulfillment_requested', label: 'Fulfillment requested' },
  ],
  actions: [
    {
      id: 'create_replenishment',
      label: 'Create replenishment',
      description: 'Open a replenishment request in this app',
    },
  ],
  tasks: [
    {
      id: 'replenishment_approval',
      label: 'Replenishment approval',
      suggested_workspace_type: 'finance',
      priority: 'normal',
    },
  ],
});
```

Request permissions in `manifest.yaml`:

```yaml
permissions:
  - organization.read
  - organization.write
```

On install (with organization enabled on the platform), solution-service
upserts your envelope. Admin Console → **Organization → Capabilities** shows
nodes with provenance (which installation published them).

## Build a workflow (admin)

In Admin Console → **Organization → Workflows**:

1. **Save draft** — Trigger (event id) → Task and/or Action steps → End.
2. **Publish** — only published workflows run.
3. Keep graphs **linear** in Phase 2 (no branching, timers, or loops).

Runtime lives in **runtime-service**. Completing a task in the Internal
portal (**Approvals Inbox**) resumes the run and invokes the next Action via
the connector manager → your `/qefro` tool.

## Emit and handle (app code)

- **Emit events** through the organization/runtime APIs your install is
  granted (platform BFF / runtime internal). Pass opaque event ids only.
- **Implement actions** as normal `app.tool` handlers. Workflow Action steps
  invoke those tools — never another solution's tools.
- **Do not** hard-code Finance URLs, workspace ids, or tool names of peers.

## Operator surfaces

| Surface | Role |
|---------|------|
| Admin Console → Organization | Graph, workflow builder, task defs, inbox overview |
| Internal portal → Inbox | Day-to-day approvals / task complete |

## Feature flags

Platform ops must enable organization inject/sync (e.g.
`QEFRO_ORGANIZATION_ENABLED=true` and organization URL pointing at
solution-service). If flags are off, registration soft-fails and the graph
stays empty — your core app tools still work.

## Related

- Capability contract: platform `docs/organization-capability.md`
- [Build your first app](/docs/solutions/build-your-first-app)
- Example registrations: Restaurant Pro, Finance Pro under
  `qefro-plugin-platform/docs/examples/`
