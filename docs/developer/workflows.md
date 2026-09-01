---
title: "Workflows"
description: "How application tools and organization capabilities participate in Qefro workflows."
sidebar_label: "Workflows"
---

# Workflows

## Four related concepts

| Kind | Where defined | Who runs it |
| --- | --- | --- |
| **Marketplace App flows** (`workflows/*.yaml`, `execution: runtime`) | Metadata package | FlowRunner → Runtime entity tools |
| **Business Flows** (`app.flow`) | SDK metadata (external systems) | FlowRunner → SDKAdapter `/qefro` |
| **SDK-hosted solution workflows** | `hosting: managed` package | Runtime — call **app tools** on `/qefro` |
| **Organization workflows** | Platform builder | Organization Runtime — events → tasks → actions |

Marketplace App default: [Solution workflows](/docs/solutions/workflows).
SDK (ERP / POS / CRM): sections below.

## Business Flows (SDK)

```javascript
app.flow({
  id: 'reservation',
  trigger: { type: 'conversation' }, // event | schedule | webhook
});
```

Advertised on `capabilities.list.flows`. Your process does **not** run FlowRunner — and registered `app.event` / `app.webhook` / `app.schedule` handlers are **not** invoked by the SDK HTTP dispatcher either (metadata + runtime delivery).

## Solution YAML workflows (managed)

Orchestrate UX / channel steps. Steps invoke tools like `restaurant-pro/restaurant.createReservation` — never `storage/insert`.

## Organization workflows

```text
Restaurant Pro event: purchase_requested
        ↓
Organization Workflow
        ↓
Finance / manager Task
        ↓
action: approve_purchase  →  /qefro tool on owning app
```

Finance Pro may expose `approve_purchase`-style actions; Restaurant Pro exposes events. **No direct app-to-app HTTP.**

## ABM external pattern

Opaque actions (`approve_purchase`, `continue_purchase`) invoked from Internal Portal / org inbox, not from customer WhatsApp (`chat: false` / channel guards).

## Rule

> Applications must never call each other directly.

Wire cross-domain processes through Organization events, tasks, and actions.
