---
title: "Getting started"
description: "Start with a metadata Marketplace App, or connect an external system with the Qefro SDK over /qefro."
sidebar_label: "Getting started"
---

# Getting started

## Which path?

| Goal | Path |
| --- | --- |
| Ship Restaurant / Clinic / Real Estate / Booking / CRM on Marketplace | **Metadata** — no backend |
| Connect Focus ERP, Yaaz, ABM, on-prem POS / CRM | **SDK** → `/qefro` |

```text
Marketplace App (default)
  qefro app init → validate → package → publish → install → Qefro Runtime

External integration
  npm install @qefro-ai/backend → POST /qefro → SDK Connection
```

See [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## Marketplace App (default)

```bash
qefro app init restaurant-pro --name "Restaurant Pro" --hosting runtime
qefro app validate restaurant-pro
qefro app package restaurant-pro
qefro app install restaurant-pro
```

Tutorial: [Managed Marketplace App](./managed-marketplace-app.md) ·
[Build your first app](/docs/solutions/build-your-first-app).

Reference: `qefro-plugin-platform/docs/examples/restaurant-pro-runtime`
(app id `restaurant-pro-runtime`).

## External SDK (ERP / POS / CRM)

### Prerequisites

- Node.js **≥ 18**
- Org Portal access to **Business Tools → SDK Connections**

### Install the SDK

```bash
npm install @qefro-ai/backend
```

Current documented package version: **1.7.0** (`SDK_VERSION` in the SDK).

Other languages:

| Language | Package |
| --- | --- |
| Python | `qefro-backend` |
| Rust | `qefro-backend-sdk` |

### Minimal external app

```javascript
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({
  signingSecret: process.env.QEFRO_SIGNING_SECRET || 'dev-secret',
  endpointPath: '/qefro',
});

app.tool(
  'pingEcho',
  {
    description: 'Echo a message',
    auth: 'none',
    input_schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
  },
  async (ctx) => ({ ok: true, message: ctx.parameters.message ?? 'pong' }),
);

const port = Number(process.env.PORT || 8090);
await app.listen({ port });
console.log(`Listening on http://0.0.0.0:${port}/qefro`);
```

Run:

```bash
export QEFRO_SIGNING_SECRET=dev-secret
node index.js
```

### Connect (external)

1. Expose HTTPS to `…/qefro` (or tunnel for local: ngrok / `host.docker.internal`).
2. Org Portal → **Business Tools** → **SDK Connections** → **Add Connection**
   - **Name**
   - **Webhook URL** (must end at `/qefro` or your configured path)
   - **Signing Secret** (same as `QEFRO_SIGNING_SECRET`, or leave empty to let the platform generate one)
   - **Enabled**
3. **Test Connection**
4. Select a workspace → **Sync Tools**

API: `POST /api/v1/org/sdk-connections` with `{ name, webhook_url, enabled?, signing_secret? }`.

## Next

- [Integration models](./integration-models.md)
- [External SDK Connection tutorial](./external-sdk-connection.md)
- [Managed Marketplace App tutorial](./managed-marketplace-app.md)
- [Primary manual](./application-integration-guide.md)
