---
id: v1-sdk-framework
title: SDK Framework
slug: /v1/sdk-framework
sidebar_label: SDK Framework
---

## Framework lifecycle
1. new Qefro
2. optional middleware
3. customer provider
4. tool registration
5. listen

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

## Deployment
Expose POST /qefro behind HTTPS with stable secret management.
