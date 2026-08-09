---
title: "Getting started"
description: "Install @qefro-ai/backend, expose POST /qefro, and connect to Qefro."
sidebar_label: "Getting started"
---

# Getting started

## Goal

Run a minimal signed `/qefro` process and register it with Qefro (external path), or scaffold a managed app package.

## Prerequisites

- Node.js **≥ 18**
- Org Portal access to **Business Tools → SDK Connections**
- For managed apps: `qefro` CLI and platform admin rights to publish

## Install the SDK

```bash
npm install @qefro-ai/backend
```

Current documented package version: **1.7.0** (`SDK_VERSION` in the SDK).

Other languages:

| Language | Package |
| --- | --- |
| Python | `qefro-backend` |
| Rust | `qefro-backend-sdk` |

## Minimal external app

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
# or: npm start  (if defined in your package.json)
```

The SDK’s own `npm run dev` builds the library in watch mode — it does **not** start your application server. Application repos typically use `npm start` (see `mock-order-status-sdk`, `abm-demo`).

## Connect (external)

1. Expose HTTPS to `…/qefro` (or tunnel for local: ngrok / `host.docker.internal`).
2. Org Portal → **Business Tools** → **SDK Connections** → **Add Connection**
   - **Name**
   - **Webhook URL** (must end at `/qefro` or your configured path)
   - **Signing Secret** (same as `QEFRO_SIGNING_SECRET`, or leave empty to let the platform generate one)
   - **Enabled** (create API defaults `enabled` to false if omitted)
3. **Test Connection**
4. Select a workspace → **Sync Tools**

API: `POST /api/v1/org/sdk-connections` with `{ name, webhook_url, enabled?, signing_secret? }`.

## Scaffold (managed)

```bash
qefro create-app my-app --hosting managed
cd my-app
# edit src/, manifest.yaml
qefro dev .
# platform admin:
qefro publish .
qefro solution install my-app
```

## Next

- [Integration models](./integration-models.md)
- [External SDK Connection tutorial](./external-sdk-connection.md)
- [Managed Marketplace App tutorial](./managed-marketplace-app.md)
- [Primary manual](./application-integration-guide.md)
