# Qefro Documentation

Official documentation website for **[Qefro](https://qefro.com)** — the AI Workspace Platform for Customer AI, Employee AI, and Business Actions.

Built with [Docusaurus 3](https://docusaurus.io/), React, TypeScript, and MDX.

---

## Canonical Architecture

Qefro unifies AI workspaces, metadata-driven marketplace apps, and external enterprise systems under a single runtime execution model:

```text
                         QEFRO
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   AI Workspaces      Marketplace         External Systems
        │                  │                  │
        │                  ▼                  │
        │          Metadata Apps             │
        │                  │                  │
        │                  ▼                  │
        │            Qefro Runtime            │
        │                  │                  │
        ├──────────────┬───┼──────────────┐   │
        │              │   │              │   │
        ▼              ▼   ▼              ▼   ▼
      RAG         FlowRunner Events    Actions  SDK/REST
        │              │   │              │     │
        └──────────────┴───┴──────────────┘     │
                                               │
                                      ERP / CRM / POS /
                                      external services
```

### Application & Integration Models

The platform cleanly separates two integration models:

1. **Metadata Marketplace Apps (`hosting: runtime`)**:
   - Declarative packages consisting of `manifest.json`, `entities/`, `workflows/`, and `ui/`.
   - Executed and rendered directly by the Qefro Runtime.
   - Requires **zero application servers or custom containers** from the developer.
   - Governed by triple-keyed tenant isolation (`tenant_id`, `workspace_id`, `installation_id`), optimistic concurrency, and managed entity storage.

2. **External System Integrations**:
   - Connects external customer systems of record (ERP, CRM, POS, internal microservices).
   - Integrated via REST/OpenAPI tools or Backend SDK connections (`@qefro-ai/backend`, `qefro-backend`, `qefro-backend-sdk`) receiving signed HMAC webhooks on `POST /qefro`.
   - Ideal for bespoke business logic and legacy database systems.

---

## Documentation Hubs

The documentation is organized across four core hubs:

- **Start**: Overview, core architecture, conceptual foundations, and platform comparisons.
- **Build Apps**: Marketplace App development, App Generator, entity schemas, FlowRunner workflows, UI views, and SDK integrations.
- **Operate**: AI Workspaces, omnichannel conversation management (Website Widget, WhatsApp, Instagram), Customer Hub, approvals, and administration.
- **Reference**: REST APIs, SDK references, connector specifications, event catalogs, CLI tooling, and security models.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the documentation locally.

---

## Scripts & Validation

| Command | Description |
| --- | --- |
| `npm run start` | Local dev server with hot reload |
| `npm run build` | Production static build → `build/` (triggers `generate:llms` automatically) |
| `npm run generate:llms` | Refresh `static/llms.txt` and `static/llms-full.txt` |
| `npm run serve` | Serve the production build locally |
| `npm run typecheck` | TypeScript verification |
| `npm run lint:md` | Markdown linting |
| `npm run check:links` | Internal broken link checker (post-build) |

---

## Repository Layout

```text
docs/
  ├── architecture/       System architecture, execution planes, tenant isolation
  ├── business-tools/     REST & SDK business tool integrations
  ├── compare/            Architectural comparisons with ecosystem tools
  ├── developer/          Runtime concepts, FlowRunner, SDK references, deployment
  ├── guides/             Task-oriented implementation runbooks
  ├── introduction/       Foundational concepts and platform overview
  ├── platform/           Channels (WhatsApp, Instagram, Widget), RBAC, workspaces
  ├── reference/          API specifications, schemas, events, configuration
  ├── security/           Action authority, encryption, tenancy, compliance
  ├── solutions/          Marketplace apps, App Generator, entities, storage, tax engine
  └── user/               Operator guide for Admin Console and workflows
blog/                     Product and engineering architectural updates
src/components/           Reusable MDX components
src/css/                  Brand styling and typography
static/                   Logos, robots.txt, llms.txt, llms-full.txt
scripts/                  LLM export generator and link verification
```

---

## Deployment & AI Discovery (GEO)

Static assets are built via `npm run build` for Cloudflare Pages (`https://docs.qefro.com`).

### AI Discovery Endpoints

- **Curated Index**: [`https://docs.qefro.com/llms.txt`](https://docs.qefro.com/llms.txt) (llmstxt.org standard)
- **Full Markdown Export**: [`https://docs.qefro.com/llms-full.txt`](https://docs.qefro.com/llms-full.txt)

---

## Contributing

1. **Architecture Alignment**: Ensure new pages adhere to the canonical Qefro Runtime and FlowRunner architecture. Never introduce obsolete V1 or legacy managed-app hosting concepts.
2. **Implementation Wins**: Align all specifications with working runtime implementations in Qefro repositories.
3. **Internal Links**: Use root-relative markdown links (`/docs/...`). Run `npm run check:links` before committing.
4. **Validation**: Ensure `npm run typecheck`, `npm run lint:md`, and `npm run build` pass cleanly with zero warnings or errors.

---

## License

Documentation © Qefro. All rights reserved.
