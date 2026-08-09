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

## Managed Marketplace App

| Artifact | Role |
| --- | --- |
| `Dockerfile` | Required for `hosting: managed` |
| Solution package | Built/signed by `qefro solution build` / `publish` |
| Install | `qefro solution install` per tenant/workspace |
| Runtime | Qefro starts/routes container; binding stores endpoint |

```bash
qefro create-app my-app --hosting managed
qefro dev .
qefro publish .
qefro solution install my-app
```

External hosting option on create-app (`--hosting external`) plus `qefro register --endpoint URL` binds a third-party endpoint for an install — confirm in your environment before production use.

## Shared runtime concerns

- Pin `@qefro-ai/backend` version
- Do not log signing secrets
- Keep tool contracts backward compatible across deploys/upgrades
