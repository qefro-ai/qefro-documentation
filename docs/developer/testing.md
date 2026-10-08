---
title: "Testing"
description: "Test SDK tools locally, external connections, and managed installs."
sidebar_label: "Testing"
---

# Testing

## Local SDK test

Exercise the process without the Org Portal:

| Area | How |
| --- | --- |
| Tool invocation | Sign a `tool.invoke` body and `POST /qefro` (or unit-test handlers) |
| Schema / validation | Assert handler rejects bad inputs |
| Authentication | Wrong signature → `invalid_signature`; skew → fail |
| Storage | Only when `platform.storage` fixture provided |
| Customer Hub | Mock `platform.customer` or disable Hub flags |

`mock-order-status-sdk` provides `npm run smoke` for a local signed round-trip.

Minimal ping (pseudo-flow):

1. Body `{"protocol_version":"1","request_id":"t1","type":"ping"}`
2. Sign with your secret
3. Expect `{ "type": "pong", … }`

## External connection test

```text
Qefro Org Portal
 ↓ Test Connection (ping)
SDK connection
 ↓
/qefro
 ↓
tool.invoke (chat or Test Tool)
```

Checklist:

1. Test Connection healthy
2. Sync Tools with workspace selected
3. Invoke a public tool (`auth: none`) from chat
4. Invoke an authenticated tool with identity
5. Confirm org-only tools blocked on customer channels

## Marketplace app validation & test

```text
qefro app validate <dir>
 ↓
qefro app package <dir>
 ↓
qefro app install <name>
 ↓
runtime execution test (FlowRunner & entity ops)
 ↓
upgrade + re-test
```

Run schema validation with `qefro app validate` to assert that all entity schemas, workflow steps, and UI views adhere to platform constraints.

## What to assert

- Tool names stable across Sync / install
- HMAC failure modes
- Tenant isolation (no cross-workspace document leaks)
- Organization actions not callable from WhatsApp when marked staff-only
