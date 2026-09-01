---
title: "Deploy external and managed apps"
description: "Deploy external /qefro endpoints or managed Docker packages."
sidebar_label: "External & managed deploy"
---

# Deploy external and managed apps

## External SDK Connection

Compatible patterns (any environment that can serve HTTPS to Qefro):

- Docker container
- VM / bare metal
- Kubernetes Service + Ingress
- Cloud runtimes (Cloud Run, ECS, App Service, …)
- On-premise (with network path to Qefro or reverse tunnel)

### Requirements

| Requirement | Notes |
| --- | --- |
| HTTPS endpoint | ACS validates URL safety; prefer public HTTPS |
| Path | Default `/qefro` (`endpointPath`) |
| Secret | Match Org Portal SDK Connection signing secret |
| Health | **Test Connection** sends `ping` (SDK has no `GET /health`) |
| Timeout | ~30s invoke budget (ACS / CM defaults) |

Example:

```bash
docker run -e QEFRO_SIGNING_SECRET=… -e PORT=8080 -p 8080:8080 your/connector:tag
# Webhook URL: https://connector.example.com/qefro
```

Local Docker + ACS in Docker often uses `http://host.docker.internal:8090/qefro`.

## Marketplace App

Metadata Marketplace Apps (`hosting: runtime`) are **not** deployed as
containers — Qefro Runtime executes the installed package. See
[Managed Marketplace App](/docs/developer/managed-marketplace-app).

`hosting: managed` (platform-hosted `/qefro` Marketplace App) is not
supported.

To connect an external system, register an SDK Connection:

```bash
qefro create-app my-erp --hosting external --endpoint https://api.example.com/qefro
qefro register --endpoint https://api.example.com/qefro --solution my-erp
```

## Shared runtime concerns

- Pin `@qefro-ai/backend` version
- Do not log signing secrets
- Keep tool contracts backward compatible across deploys/upgrades
