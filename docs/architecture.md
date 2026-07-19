---
id: v1-architecture
title: Architecture
slug: /v1/architecture
sidebar_label: Architecture
---

Qefro V1 architecture is stable.

```mermaid
flowchart LR
  U[Customer] --> CH[Widget or WhatsApp]
  CH --> QR[Qefro Runtime]
  QR -->|REST/OpenAPI| API[Business APIs]
  QR -->|SDK invoke| BK[Backend POST /qefro]
  BK --> QR
  QR --> CH
```

## Locked foundation
- REST and OpenAPI tools
- SDK framework and SDK connections
- Customer lookup and authorization
- Suspend and resume
- Tool discovery and metadata
- Protocol versioning

## Design principle
Use existing abstractions. Prefer polish, reliability, and documentation.
