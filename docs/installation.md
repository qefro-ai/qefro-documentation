---
id: v1-installation
title: Installation
slug: /v1/installation
sidebar_label: Installation
---

## Qefro platform install
1. Clone repositories.
2. Start API dependencies using Docker Compose.
3. Run API and portal locally.

## SDK install

### TypeScript (npm)

```bash
npm install @qefro-ai/backend
```

Package: [npmjs.com/package/@qefro-ai/backend](https://www.npmjs.com/package/@qefro-ai/backend)

### Rust (crates.io)

```bash
cargo add qefro-backend-sdk
```

```toml
[dependencies]
qefro-backend-sdk = "1"
```

Package: [crates.io/crates/qefro-backend-sdk](https://crates.io/crates/qefro-backend-sdk) · [docs.rs](https://docs.rs/qefro-backend-sdk)

## Verify installation
- Portal loads
- API health endpoint returns ok
- SDK app can respond to ping and tools.list
