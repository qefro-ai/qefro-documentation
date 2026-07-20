---
id: v1-customer-provider
title: Customer Provider
slug: /v1/customer-provider
unlisted: true
sidebar_label: Customer Provider
---

Customer Provider separates identity from authentication.

## lookup
Resolve customer from channel identity.

## authorize
Return one of:
- success
- challenge
- denied
- not_found

## Lifecycle

```mermaid
sequenceDiagram
  participant Q as Qefro
  participant B as Backend
  Q->>B: tool.invoke
  B->>B: lookup
  B->>B: authorize
  alt challenge
    B-->>Q: challenge
    Q->>B: tool.resume
  end
  B-->>Q: result
```

## Common patterns
- OTP
- JWT reuse
- OAuth session
- passkey gateway integration
