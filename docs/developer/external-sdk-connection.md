---
title: "External SDK Connection"
description: "Tutorial: build a product & quotation connector, deploy /qefro, register an SDK Connection, and sync tools."
sidebar_label: "External SDK Connection"
---

# External SDK Connection

:::info Not a Marketplace App
This tutorial connects an **existing** product catalog / ERP / quotation
system to Qefro. To ship Restaurant, Clinic, or Real Estate on Marketplace
without a backend, use
[Managed Marketplace App](./managed-marketplace-app.md) instead.
:::

## Goal

Build a **Product & Quotation** style connector that runs on **your** infrastructure and registers as an org **SDK Connection**.

Reference implementations in the monorepo:

| Repo | Role |
| --- | --- |
| `abm-demo` | Full external sales connector (search, pricing, quotation, org approval) |
| `mock-order-status-sdk` | Minimal order-status webhook for Org Portal smoke tests |

This tutorial follows the ABM / quotation pattern with a smaller surface.

## Prerequisites

- Node.js ≥ 18
- `npm install @qefro-ai/backend`
- Public HTTPS URL (or tunnel) ending at `/qefro`
- Org Portal access to **Business Tools → SDK Connections**

## Architecture

```text
AI Sales Assistant
        ↓
ACS / connector-manager
        ↓  HMAC-signed POST
Your server  POST /qefro
        ↓
Existing ERP / catalog / DB
```

```text
ABM ERP
   ↓
ABM SDK Connector
   ↓
Qefro SDK Connection
   ↓
AI Sales Assistant
   ↓
Product Search → Pricing → Quotation → Organization Approval
```

## Create

Example layout (conceptual — mirror `abm-demo`):

```text
quotation-demo/
├── package.json
├── src/
│   └── index.ts   # or server.js
└── README.md
```

```bash
mkdir quotation-demo && cd quotation-demo
npm init -y
npm install @qefro-ai/backend
```

### Initialize the SDK (actual API)

```javascript
import { Qefro } from '@qefro-ai/backend';

const port = Number(process.env.PORT || 8095);
const signingSecret = process.env.QEFRO_SIGNING_SECRET || 'dev-secret-quotation';

const app = new Qefro({
  signingSecret,
  endpointPath: '/qefro',
});
```

Constructor config (`QefroConfig`):

| Field | Required | Default | Notes |
| --- | --- | --- | --- |
| `signingSecret` | Yes | — | Shared with the Org Portal SDK Connection |
| `protocolVersion` | No | `'1'` | Must match platform |
| `maxTimestampSkewSeconds` | No | `300` | Replay window |
| `endpointPath` | No | `'/qefro'` | HTTP path |

## Define tools

Conceptual flow:

```text
AI
 ↓
searchProducts
 ↓
External SDK Application
 ↓
Existing ERP / API / database
 ↓
result
```

Qefro does not need to know how you load products.

```javascript
app.tool(
  'searchProducts',
  {
    description: 'Search the product catalog',
    auth: 'none',
    chat: true,
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  async (ctx) => {
    const query = String(ctx.parameters.query || '').toLowerCase();
    // Replace with ERP/API call
    const items = []; // filtered catalog
    return { items, query };
  },
);

app.tool(
  'getProduct',
  {
    description: 'Fetch a single product by SKU',
    auth: 'none',
    input_schema: {
      type: 'object',
      required: ['sku'],
      properties: { sku: { type: 'string' } },
    },
  },
  async (ctx) => {
    const sku = String(ctx.parameters.sku || '');
    // ERP lookup…
    return { sku, name: 'Example tile', price: 120 };
  },
);

app.tool(
  'calculateQuote',
  {
    description: 'Calculate line totals for a quotation',
    auth: 'optional',
    input_schema: {
      type: 'object',
      properties: {
        lines: { type: 'array' },
        tier: { type: 'string' },
      },
    },
  },
  async (ctx) => {
    // pricing rules in your system
    return { subtotal: 0, tax: 0, total: 0 };
  },
);

app.tool(
  'createQuotation',
  {
    description: 'Persist a quotation; may require org approval above threshold',
    auth: 'optional',
    input_schema: {
      type: 'object',
      properties: {
        customer_name: { type: 'string' },
        lines: { type: 'array' },
        total: { type: 'number' },
      },
    },
  },
  async (ctx) => {
    // persist in your DB; optionally emit org event via platform APIs
    return { id: 'Q-1001', status: 'pending' };
  },
);
```

Optional organization metadata (opaque ids — no `app.` prefix), as in `abm-demo` / Restaurant Pro:

```javascript
app.organization({
  version: 1,
  events: [{ id: 'purchase_requested', label: 'Purchase requested' }],
  actions: [
    { id: 'approve_purchase', label: 'Approve purchase' },
    { id: 'continue_purchase', label: 'Continue purchase' },
  ],
  tasks: [{ id: 'quotation_approval', label: 'Quotation approval', priority: 'high' }],
});
```

## Run

```bash
export QEFRO_SIGNING_SECRET=dev-secret-quotation
export PORT=8095
node src/index.js
# → http://127.0.0.1:8095/qefro
```

`app.listen({ port })` binds `POST` on `endpointPath` only. Other methods/paths return `404` `{ error: 'not_found' }`.

## What `/qefro` receives

Signed JSON body (see [qefro-protocol.md](./qefro-protocol.md)):

```json
{
  "protocol_version": "1",
  "request_id": "…",
  "type": "tool.invoke",
  "organization_id": "…",
  "conversation_id": "…",
  "channel": "whatsapp",
  "identity": {},
  "tool": "searchProducts",
  "parameters": { "query": "flooring tiles" }
}
```

Headers (ACS / connector-manager):

| Header | Purpose |
| --- | --- |
| `x-qefro-signature` / `X-Qefro-Signature` | `v1={hex}` HMAC |
| `x-qefro-timestamp` | Unix seconds |
| `x-qefro-protocol` | `"1"` |
| `x-qefro-trace-id` | Correlation (when forwarded) |
| `x-qefro-tenant-id` / `x-qefro-workspace-id` | Tenancy (connector-manager path) |

Success tool response: `{ "type": "result", "output": { … } }`.

Errors: `{ "type": "error", "code": "…", "message": "…" }` — see [troubleshooting.md](./troubleshooting.md).

## Create an SDK Connection (Org Portal)

**Confirmed UI:** Org Portal page **SDK Connections** (under **Business Tools**). Route `/app/organization/sdk-connections` redirects to `/app/business-tools`. Product copy may say “Admin Console”; the implemented UI is the portal (`OrganizationAuthentication.tsx`). No SDK Connections UI was found in `ai-customer-support-admin`.

```text
Org Portal
    ↓
Business Tools
    ↓
SDK Connections
    ↓
Add Connection
```

| Field (UI) | API field | Notes |
| --- | --- | --- |
| Name | `name` | Required; unique per tenant |
| Webhook URL | `webhook_url` | Your public `/qefro` URL |
| Signing Secret | `signing_secret` | Optional on create — omitted → platform generates |
| Enabled | `enabled` | Defaults to **false** if omitted on create |

Then:

1. **Test Connection** → platform sends `ping`, expects `pong` (status → `healthy` / `degraded`)
2. Select a **workspace** on Business Tools
3. **Sync Tools** → prefer `capabilities.list` ( `tools.list` is legacy); with workspace selected, auto-registers Business Tools (`auto_register`)

REST (ACS; portal client prefixes with the API base):

- `GET/POST /api/v1/org/sdk-connections`
- `PATCH/DELETE /api/v1/org/sdk-connections/{id}`
- `POST /api/v1/org/sdk-connections/{id}/test`
- `POST /api/v1/org/sdk-connections/{id}/sync-tools`
- `GET /api/v1/org/sdk-connections/{id}/flows`

Create requires org admin (+ premium gate on create). Plaintext signing secret is returned only on create/update; list responses expose `has_secret`, not the secret.

```text
Qefro
   ↓
SDK connection
   ↓
External HTTPS endpoint
   ↓
/qefro
```

## Authentication

Shared **connection signing secret**. Platform signs every request:

```text
payload = "v1:{timestamp}:{raw_body}"
signature = "v1=" + hex(HMAC_SHA256(secret, payload))
```

SDK verifies with default **300s** skew. See [authentication.md](./authentication.md).

Rotate: update connection with a new `signing_secret` (API treats empty as generate-new) and redeploy your process with the same value.

## External ownership

You control infrastructure, source, deployment, database, secrets, APIs, availability, scaling, monitoring.

Qefro controls connection routing, HMAC, tenant/workspace routing, AI, workflows, platform capabilities.

**Do not** (ABM guidance): publish as Marketplace managed app, create solution-service installation bindings, or put ERP domain tables into ACS.

## Production considerations

- Prefer HTTPS; ACS validates URL safety (SSRF protections).
- Keep secret out of git; show once on create if platform-generated.
- Monitor `/qefro` latency (ACS timeout ~30s; connector-manager default 30s with retries).
- For org approval actions, keep manager tools off customer chat (`chat: false` on tools).

## Troubleshoot

| Symptom | Check |
| --- | --- |
| Test Connection fails | URL reachable? Path exact? Secret match? |
| `invalid_signature` | Same secret; clock skew; raw body not mutated |
| Tool missing after Sync | Re-sync; workspace selected; tool registered in process |
| `ctx.storage` errors | Expected without install scope — use your own DB |

More: [troubleshooting.md](./troubleshooting.md).
