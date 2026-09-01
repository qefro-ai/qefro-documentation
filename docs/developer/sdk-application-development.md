---
title: "SDK application development"
description: "How to structure a Qefro Backend SDK application for connecting external ERP / POS / CRM systems — tools, flows, events."
sidebar_label: "SDK application development"
---

# SDK application development

The **Qefro SDK** connects **external** systems to Qefro over `/qefro`.
It is **not** how you build a Marketplace App.

Marketplace Apps are metadata executed by Qefro Runtime — start at
[Build your first app](/docs/solutions/build-your-first-app) and
[Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

Use this page for Focus ERP, Yaaz, ABM, on-prem POS, or any customer
system of record.

## Package

```bash
npm install @qefro-ai/backend
```

Import:

```javascript
import { Qefro } from '@qefro-ai/backend';
// or: import Qefro from '@qefro-ai/backend';
```

## Application shape

```text
Application
    ├── Tools          app.tool
    ├── Flows          app.flow   (metadata; runtime executes)
    ├── Events         app.event / webhook / schedule
    ├── Customer       app.customer(provider) optional
    ├── Marketing      app.marketing({…}) metadata
    ├── Organization   app.organization({…}) metadata
    └── HTTP           app.listen → POST /qefro
```

## Constructor

```typescript
new Qefro({
  signingSecret: string;
  protocolVersion?: string;          // default '1'
  maxTimestampSkewSeconds?: number;  // default 300
  endpointPath?: string;             // default '/qefro'
});
```

## Middleware

```javascript
app.use(async (ctx, next) => { await next(); });
app.before(async (ctx) => {});
app.after(async (ctx, result) => {});
```

## Tool registration signatures

All supported by `app.tool`:

```javascript
app.tool('name', handler);
app.tool('name', metadata, handler);
app.tool('name', handler, metadata);
app.tool({ name: 'name', …metadata }, handler);
```

See [tools.md](./tools.md).

## Flows

Flows are **metadata only**. The SDK advertises them on `capabilities.list`; the Qefro Runtime orchestrates execution.

```javascript
app.flow({
  id: 'reservation',
  version: 1,
  trigger: { type: 'conversation' }, // or event / schedule / webhook
})
  .ask({ /* … */ })
  .tool({ /* … */ })
  .complete({ /* … */ });
```

## Events, webhooks, schedules

```javascript
app.event({ name: 'shopify.order.created', description: '…' }, async (ctx) => {});
app.webhook({ name: 'shipment.delivered' }, async (ctx) => {});
app.schedule({ name: 'daily.digest', cron: '0 9 * * *' }, async (ctx) => {});
```

Advertised under `capabilities.list` as `events`, `webhooks`, `schedules`.

**Implementation detail:** These handlers are stored and advertised only. The SDK `/qefro` dispatcher does **not** call them — the Qefro Runtime owns delivery.

## Marketing & organization

Call once each:

```javascript
app.marketing({ version: 1, audiences: […], variables: […], actions: […], landingPages: […], channels: […] });
app.organization({ version: 1, events: […], actions: […], tasks: […] });
```

Organization capability ids must be **opaque** (no `.` / app prefix).

## Listen

```javascript
const handle = await app.listen({ port: 8080, host: '0.0.0.0', path: '/qefro' });
// handle.url → http://0.0.0.0:8080/qefro
// await handle.close();
```

For embedding in an existing HTTP framework, use `handleRaw(body, headers)` (verifies signature then dispatches).

## Shared code across models

Keep tools, schemas, and domain logic identical whether the adapter is an
org SDK Connection or a packaged `hosting: external` process. Marketplace
Apps are metadata and do not use this SDK.
