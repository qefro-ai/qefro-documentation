---
id: v1-examples
title: Examples
slug: /v1/examples
unlisted: true
sidebar_label: Examples
---

Backend examples:

- **TypeScript** — [`@qefro-ai/backend`](https://www.npmjs.com/package/@qefro-ai/backend): [qefro-js-backend-sdk/examples](https://github.com/qefro-ai/qefro-js-backend-sdk/tree/main/examples)
- **Rust** — [`qefro-backend-sdk`](https://crates.io/crates/qefro-backend-sdk): [qefro-rust-backend-sdk/examples](https://github.com/qefro-ai/qefro-rust-backend-sdk/tree/main/examples)

```bash
# TypeScript
git clone https://github.com/qefro-ai/qefro-js-backend-sdk.git
cd qefro-js-backend-sdk/examples/<example>
cp .env.example .env && npm install && npm start

# Rust
cargo add qefro-backend-sdk
# or clone https://github.com/qefro-ai/qefro-rust-backend-sdk and run:
# cargo run --example basic
```

All example backends expose `POST /qefro` and include:
- customer lookup + authorization split
- authenticated tools with argument validation
- deterministic, structured response envelopes

Every example also ships with `scripts/smoke.sh` to run signed protocol checks (`ping`, `tools.list`, `tool.invoke`) against localhost.

## Included examples
- `basic-sdk`: minimal framework usage with profile/context tools
- `order-status`: public order lookup + authenticated my-orders list
- `rest-api`: REST-shaped order tools (`orders_list`, `orders_get`)
- `ecommerce`: order tracking, return creation, invoice link generation
- `crm`: lead listing, note writeback, escalation ticket opening
- `erp`: inventory balance, purchase order draft, sales-order ETA
- `helpdesk`: ticket intake and knowledge-base search
- `banking`: account balance checks and beneficiary validation
- `healthcare`: appointment slot listing and booking confirmation
- `education`: catalog lookup and enrollment request flow
- `multilingual`: locale detection plus response localization
- `whatsapp`: template preview and outbound send simulation
- `internal-portal`: KPI snapshots and approval workflows

Each includes:
- README
- env template
- run instructions
- production-safe validation patterns
