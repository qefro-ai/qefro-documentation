---
title: "Authentication"
description: "HMAC v1 signing for /qefro — headers, payload format, skew, and secret rotation."
sidebar_label: "Authentication"
---

# Authentication

Qefro authenticates platform → application calls with a shared **signing secret** and HMAC-SHA256.

Customer/user authentication inside tools (OTP, CRM login) is separate — see `ctx.requireCustomer` / challenges in [tools.md](./tools.md).

## Connection secret

### External SDK Connection

- Created with Org Portal **Signing Secret** or generated when omitted.
- Stored encrypted on ACS (`encrypted_signing_secret`).
- Must match `Qefro({ signingSecret })` / `QEFRO_SIGNING_SECRET` in your process.
- Returned once on create/update when plaintext is available (`SdkConnectionWithSecret`). List APIs expose `has_secret` only.

### Managed app

- Runtime receives a signing secret via environment / platform injection (`QEFRO_SIGNING_SECRET` is the conventional name used by examples).
- Connector-manager may use service default `QEFRO_SIGNING_SECRET` or per-invoke `signing_secret`.

## Signature format

Verified by `@qefro-ai/backend` `verifySignature` and produced by ACS `SdkWebhookClient::sign` / connector-manager `sign_v1`:

```text
payload   = "v1:" + timestamp + ":" + raw_request_body
signature = "v1=" + hex( HMAC_SHA256(signing_secret, payload) )
```

Example (illustrative — not a real secret):

```http
POST /qefro HTTP/1.1
Content-Type: application/json
X-Qefro-Signature: v1=0123abcd…   # hex digest
X-Qefro-Timestamp: 1710000000
X-Qefro-Protocol: 1

{"protocol_version":"1","request_id":"req_1","type":"ping"}
```

Header names are matched case-insensitively by HTTP stacks; the SDK reads lowercase `x-qefro-signature` / `x-qefro-timestamp`. ACS also sets `X-Qefro-Signature` / `X-Qefro-Timestamp`.

## Replay protection

- Timestamp must be finite Unix seconds.
- Default max skew: **300 seconds** (`maxTimestampSkewSeconds`).
- Outside window → signature verification fails → `invalid_signature`.

## Verification (SDK)

```javascript
// Inside listen / handleRaw — you normally do not call this yourself:
app.verifySignature(signatureHeader, timestampHeader, rawBody);
```

Failed verification on HTTP listener:

```json
{ "type": "error", "code": "invalid_signature", "message": "Invalid Qefro signature" }
```

HTTP status **401**.

## Secret rotation

ACS update API: set `signing_secret` on `PATCH /api/v1/org/sdk-connections/{id}`. Empty/null generation behavior follows `UpdateSdkConnectionRequest` (rotate / generate new). Redeploy your app with the new value before/when cutting over.

## What this is not

HMAC authenticates **Qefro platform → your `/qefro`**. It does not replace:

- Customer OTP / login challenges
- Org Portal / admin user JWTs
- Internal service bearer tokens used for storage-service (`Authorization: Bearer …` on `ctx.storage` calls)
