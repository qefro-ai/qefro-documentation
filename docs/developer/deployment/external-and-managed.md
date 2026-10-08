---
title: "Deploying External SDK Connections"
description: "How to deploy and configure external backend SDK services connecting ERP, POS, and CRM systems to Qefro via signed webhooks."
sidebar_label: "Deploy external SDK connections"
---

# Deploying External SDK Connections

When integrating external enterprise systems (such as Focus ERP, ERPNext, Odoo, custom CRM backends, or on-premise inventory databases), the **Qefro Backend SDK** (`@qefro-ai/backend`, `qefro-backend`, `qefro-backend-sdk`) runs in the customer's or partner's infrastructure and communicates with Qefro over an HMAC-signed HTTPS webhook (`POST /qefro`).

:::note Marketplace Apps require no deployment
Metadata Marketplace Apps (`hosting: runtime`) do **not** run external servers or Docker containers. They are executed directly by Qefro Runtime. See **[Marketplace Apps Execution Model](/docs/solutions/managed-apps)**.
:::

---

## 1. Hosting Architectures for External SDK Connections

An external SDK service can run on any infrastructure capable of receiving inbound HTTPS POST requests from Qefro:

- **Containerized Workloads:** Docker, Kubernetes, AWS ECS, Google Cloud Run, Azure Container Apps.
- **Serverless / PaaS:** Vercel, Fly.io, Railway, Heroku.
- **Virtual Machines / On-Premise:** Linux VMs with Nginx reverse proxy and TLS termination.
- **Private VPC / Tunnel:** Cloudflare Tunnels, AWS PrivateLink, or reverse proxies connecting private ERP servers to public HTTPS endpoints.

---

## 2. Production Deployment Checklist

| Requirement | Specification | Notes |
|---|---|---|
| **HTTPS Endpoint** | Valid public TLS certificate (Let's Encrypt, Cloudflare, etc.) | Qefro requires valid HTTPS; plaintext HTTP is rejected in production. |
| **Endpoint Path** | Standard `/qefro` (configurable) | Default webhook route handling signed RPC payloads. |
| **Shared Secret** | `QEFRO_SIGNING_SECRET` | 32+ character high-entropy secret matching the Workspace SDK Connection secret. |
| **Timeout Budget** | $\le 30$ seconds | Connector Manager times out operations exceeding 30s. Long jobs should use asynchronous patterns. |
| **Health Check** | Test Connection sends signed `ping` | The SDK framework responds to signed `ping` actions out of the box. |

---

## 3. Example: Container Deployment with Docker

```dockerfile title="Dockerfile"
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "server.js"]
```

```bash
docker run -d \
  --name my-erp-connector \
  -p 8080:8080 \
  -e PORT=8080 \
  -e QEFRO_SIGNING_SECRET="your-256-bit-hex-secret" \
  -e ERP_API_KEY="your-internal-erp-key" \
  your-org/erp-connector:v1.0.0
```

---

## 4. Connecting the External Service in Qefro

1. Deploy the service and note its public HTTPS URL (e.g. `https://erp-connector.example.com/qefro`).
2. In the Admin Console, navigate to **AI Workspace ➔ Integrations ➔ External Connections ➔ Add SDK Connection**.
3. Enter the Webhook URL and the shared signing secret.
4. Click **Test Connection** — Qefro sends a signed `ping` request to verify cryptographic authenticity.
5. Click **Sync Tools** — Qefro discovers advertised business tools and registers them as workspace capabilities.

---

## Related Documentation

- [External SDK Connection Guide](/docs/developer/external-sdk-connection)
- [Backend SDK Reference](/docs/business-tools/backend-sdk)
- [Application Security & HMAC Verification](/docs/security/application-security)
- [Secrets & Credential Management](/docs/security/secrets)
