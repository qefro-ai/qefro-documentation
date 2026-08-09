---
title: "/qefro protocol"
description: "Request and response shapes for the Qefro Backend SDK protocol version 1."
sidebar_label: "/qefro protocol"
---

# `/qefro` protocol

Protocol version documented here: **`1`** (`protocol_version: "1"`).

SDK constants: `SDK_NAME = '@qefro-ai/backend'`, `SDK_VERSION = '1.7.0'` (as of the inspected package).

## Transport

- **Method / path:** `POST` to `endpointPath` (default `/qefro`)
- **Body:** JSON `ProtocolRequest`
- **Auth:** HMAC headers — [authentication.md](./authentication.md)
- **Response headers** set by SDK: `X-Qefro-Protocol`, `X-Qefro-Protocol-Version`, `X-Qefro-SDK`, `X-Qefro-Version`

## Request types

```typescript
type QefroRequestType =
  | 'ping'
  | 'tools.list'
  | 'capabilities.list'
  | 'tool.invoke'
  | 'tool.resume';
```

### Common fields

| Field | Type | Notes |
| --- | --- | --- |
| `protocol_version` | string | Must be `"1"` |
| `request_id` | string | Correlation |
| `type` | QefroRequestType | Dispatch key |
| `organization_id` | string? | Tenant/org |
| `conversation_id` | string? | Conversation |
| `channel` | string? | e.g. whatsapp, widget |
| `identity` | object? | Channel identity attributes |
| `tool` | string? | Required for invoke/resume |
| `parameters` | object? | Tool input |
| `authentication` | object? | Prior auth context |
| `resume_token` | string? | Challenge resume |
| `challenge_response` | string? | OTP / challenge answer |
| `person` | object \| null? | Customer Hub Person snapshot |
| `platform` | object? | Storage / customer / marketing / organization / channels bindings |

## Responses

| `type` | Shape (summary) |
| --- | --- |
| `pong` | `{ protocol_version?, sdk_version? }` |
| `tools.list` | `{ tools: RegisteredTool[], protocol_version?, sdk_version? }` — **legacy**; prefer `capabilities.list` |
| `capabilities.list` | `{ tools, flows, events?, webhooks?, schedules?, marketing?, organization?, protocol_version?, sdk_version?, sdk_name? }` |
| `result` | `{ output, authentication_context?, person_mutations? }` |
| `challenge` | `{ resume_token, challenge }` |
| `error` | `{ code, message }` |

## Dispatch

1. Verify signature + optional protocol header
2. Parse body
3. Switch on `type`
4. For `tool.invoke` / `tool.resume`, build `ToolContext` and run the handler
5. Return JSON

**Implementation detail:** Flows, events, webhooks, and schedules are **advertised** on `capabilities.list` only. The JS SDK process does **not** execute `app.flow` / `app.event` / `app.webhook` / `app.schedule` handlers — the Qefro Runtime owns delivery and FlowRunner.

**Implementation detail:** `app.listen` → `handleHttp` does not pass request headers into `handle()`, so `x-qefro-trace-id` → `ctx.trace_id` works when using `handleRaw(body, headers)` today. Prefer logging `request_id` from the body for correlation on the default listen path.

There is **no** dedicated `GET /health` route in the SDK. Health = signed `ping` → `pong` (Org Portal **Test Connection**).

HTTP status codes used by SDK `listen`:

| Status | When |
| --- | --- |
| 200 | Protocol response body |
| 400 | Protocol header mismatch |
| 401 | Invalidinvalid_signature` |
| 404 | Wrong method/path |
| 500 | Uncaught handler error → `internal_error` |

## Error codes (protocol body)

| Code | Meaning |
| --- | --- |
| `invalid_signature` | HMAC failed (also HTTP 401) |
| `protocol_mismatch` | Unsupported version |
| `invalid_request` | Missing tool / resume fields |
| `not_found` | Unknown tool or resume token |
| `denied` | Auth denied |
| `customer_not_found` | Customer auth failed |
| `person_not_found` | Person required but missing |
| `configuration_error` | Misconfiguration surfaced by handler path |
| `internal_error` | Unexpected failure |

## Platform egress paths

| Caller | How `/qefro` is reached |
| --- | --- |
| ACS `SdkWebhookClient` | Direct POST to `webhook_url`, or via connector-manager `POST /v1/invoke` with `target_id: sdk:{connection_id}` + endpoint + signing_secret |
| Runtime / managed install | connector-manager `install:{solution}` → installation binding endpoint |
| connector-manager | Signs `v1=` and POSTs `{endpoint}/qefro` |

**Implementation detail:** Until ACS connection registry is synced into connector-manager, `sdk:{id}` targets require `endpoint` (and optionally `signing_secret`) on the invoke request. ACS already passes both. Registry sync so CM can resolve `sdk:` without endpoint is **not implemented**.
