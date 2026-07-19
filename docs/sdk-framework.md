---
id: v1-sdk-framework
title: SDK Framework
slug: /v1/sdk-framework
sidebar_label: SDK Framework
---

The Qefro Backend Framework (`@qefro-ai/backend` for TypeScript, `qefro-sdk` for Rust) is how organizations register **Business Tool handlers** and own customer authentication.

Qefro calls your backend over one signed webhook (typically `POST /qefro`). You never implement `/auth/evaluate` on Qefro — auth lives inside your handlers.

## Install

```bash
# TypeScript
npm install @qefro-ai/backend

# Rust
cargo add qefro-sdk
```

```bash
export QEFRO_SIGNING_SECRET="your-signing-secret"
```

## Framework lifecycle

1. `new Qefro({ signingSecret })`
2. Optional middleware (`app.use`)
3. Customer Provider (`app.customer({ lookup, authorize })`)
4. Tool registration (`app.tool(definition, handler)`)
5. `app.listen({ port, path: '/qefro' })`

## Register Business Tools

Every `app.tool(...)` becomes discoverable via `tools.list`. After you create an **SDK Connection** in Admin Console and run **Sync Tools** with a workspace, those handlers become workspace Business Tools (`implementation_kind = sdk`).

```ts
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({ signingSecret: process.env.QEFRO_SIGNING_SECRET! });

app.customer({
  async lookup(ctx) {
    return { id: String(ctx.identity.phone ?? 'demo') };
  },
  async authorize(ctx) {
    return {
      kind: 'success',
      customer: ctx.customer,
      auth: { type: 'bearer_token', access_token: 'dev', expires_in: 900 },
    };
  },
});

app.tool(
  {
    name: 'get_orders',
    description: 'List orders for the authenticated customer',
    auth: 'required',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  async (ctx) => {
    return [{ orderId: 'ord_1', customerId: String(ctx.customer.require().id) }];
  },
);

await app.listen({ port: 8088, path: '/qefro' });
```

### Tool definition fields

| Field | Description |
| --- | --- |
| `name` | Unique handler name (synced as `sdk_handler_name`) |
| `description` | LLM-facing description |
| `input_schema` | JSON Schema for parameters |
| `auth` | `none` \| `optional` \| `required` |
| `authentication_methods` | e.g. `['email_otp']` — non-empty → Sync sets organization challenge |
| `permissions` | Checked in your SDK |
| `timeout` | Handler timeout hint (seconds) |

Full console + API walkthrough: [Register SDK Business Tools](/docs/guides/register-sdk-business-tools).

## Protocol

| Type | Direction | Purpose |
| --- | --- | --- |
| `ping` | Qefro → you | Health / Test Connection |
| `tools.list` | Qefro → you | Discovery / Sync Tools |
| `tool.invoke` | Qefro → you | Execute a handler |
| `tool.resume` | Qefro → you | Continue after customer challenge reply |

Headers: `X-Qefro-Protocol: 1`, `X-Qefro-SDK`, `X-Qefro-Version`, plus HMAC signature headers. `app.listen()` verifies signatures and routes messages.

## Request lifecycle

```mermaid
flowchart TD
  A[tool.invoke] --> B[lookup]
  B --> C[authorize]
  C -->|success| D[handler]
  C -->|challenge| E[tool.resume]
  E --> C
  D --> F[result]
```

## Connect to Qefro Admin Console

1. Deploy webhook at HTTPS.
2. **Business Tools → SDK Connections → Add Connection** (webhook URL + signing secret).
3. **Test Connection** (`ping`).
4. Select a workspace → **Sync Tools** (`tools.list` + auto-register).

APIs:

- `POST /api/v1/org/sdk-connections`
- `POST /api/v1/org/sdk-connections/:id/test`
- `POST /api/v1/org/sdk-connections/:id/sync-tools` with `{ "workspace_id", "auto_register": true }`

## Deployment

Expose `POST /qefro` behind HTTPS with stable secret management. Rotate secrets from Admin Console and update `QEFRO_SIGNING_SECRET` together.

See also: [Business Tools](/docs/v1/business-tools), [Customer Provider](/docs/v1/customer-provider), [Examples](/docs/v1/examples) ([GitHub](https://github.com/qefro-ai/qefro-js-backend-sdk/tree/main/examples)).
