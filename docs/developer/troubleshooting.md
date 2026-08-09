---
title: "Troubleshooting"
description: "Diagnose /qefro, HMAC, sync, storage, and install issues for both integration models."
sidebar_label: "Troubleshooting"
---

# Troubleshooting

## Comparison table

| Problem | External SDK | Managed App |
| --- | --- | --- |
| `/qefro` unreachable | Check customer endpoint, TLS, firewall, path | Check managed runtime / installation binding |
| Signature invalid | Secret mismatch, body mutated, clock skew | Platform secret / env mismatch |
| Tool missing | Re-register tools in process; Sync Tools | Package/version; install active; capabilities sync |
| Wrong workspace | Connection tools enabled on wrong workspace | Installation binding / workspace headers |
| Storage unavailable | Expected without install scope — use own DB | Check `platform.storage`, permissions, storage-service |
| App unavailable | Customer infrastructure | Qefro runtime / connector lifecycle |
| Upgrade issue | Redeploy webhook | Solution upgrade / republish |

## Protocol error codes

| Code | Typical cause |
| --- | --- |
| `invalid_signature` | Wrong secret; skew; middleware altered body |
| `protocol_mismatch` | `protocol_version` / header ≠ `"1"` |
| `invalid_request` | Missing `tool`, or resume fields |
| `not_found` | Unknown tool name; expired `resume_token` |
| `denied` | Auth denied |
| `customer_not_found` | Customer resolve/auth failed |
| `person_not_found` | Person required but absent |
| `configuration_error` | Handler/platform misconfiguration |
| `internal_error` | Uncaught exception |

HTTP: **401** signature, **400** protocol header mismatch, **404** wrong path, **500** internal.

## Connector-manager notes

- Retryable upstream statuses: **502 / 503 / 504**
- `sdk:{connection_id}` without endpoint → validation error until registry sync (ACS passes endpoint explicitly)
- `install:` targets need `SOLUTION_SERVICE_URL` and a connector binding

## Storage errors (SDK messages)

```text
ctx.storage requires platform.storage.base_url or QEFRO_STORAGE_URL
ctx.storage requires platform.storage.context on tool.invoke
storage.{op} failed ({status}): …
```

## Org Portal (SDK Connections)

| Symptom | Fix |
| --- | --- |
| Test Connection fails | Reachability + secret + `ping` handler |
| Sync without workspace | Tools snapshot only — select workspace to auto-register |
| Secret “Missing” | Edit connection and set signing secret |
| `last_error` on card | Read message; fix webhook; re-test |
| Connection `status` | `not_configured` \| `healthy` \| `degraded` \| `disabled` |

## Still stuck?

1. Confirm SDK version (`X-Qefro-Version` response header / `sdk_version` on pong)
2. Capture `request_id` / `x-qefro-trace-id`
3. Reproduce with mock-order-status-sdk smoke against the same secret scheme
