---
title: "Packaging"
description: "Assembling a solution directory into a canonical, checksummed, Ed25519-signed package with the qefro CLI."
sidebar_label: "Packaging"
---

# Packaging

Packaging turns your solution directory into a single immutable artifact:
a canonical JSON document with a SHA-256 checksum and an Ed25519
signature. The registry accepts nothing else.

:::info Hosting
**Metadata Marketplace Apps** (`hosting: runtime`) must include `entities/`
and must **not** ship `src/` or an external `/qefro` endpoint.
`qefro app package` / `qefro solution build` accept that shape.

SDK connections (`external`) require `src/` and a `/qefro` process. See
[Runtime vs SDK](/docs/solutions/runtime-vs-sdk).
:::

## Build command

```bash
qefro app package .
# alias of: qefro solution build .
```

Output:

```text
built restaurant-pro@1.0.0
  checksum:  9f2c1e…
  signature: 71ab04…
  package:   ./dist/package.json
```

The signed package is written to `dist/package.json` inside the solution
directory.

## Assembly steps

```mermaid
flowchart TB
    A[manifest.yaml] --> M[Parse + validate]
    B[ui/*.yaml] --> M
    C[workflows/*.yaml] --> M
    ENT[entities/*.yaml] --> M
    D[connectors/*.yaml] --> M
    E[assets/] --> V[Asset validation<br/>images only]
    M --> J[Canonical JSON<br/>sorted keys · compact separators]
    V --> J
    J --> H[SHA-256 checksum]
    H --> S[Ed25519 signature<br/>over id|version|checksum]
    S --> P[dist/package.json]
```

1. **Assemble.** The manifest, UI definitions, workflow definitions and
   connector declarations are parsed into one document. Assets are
   validated ([images only](/docs/solutions/assets)) and attached.
2. **Canonicalize.** The document is serialized to canonical JSON —
   sorted keys, compact separators. Canonicalization is the checksum
   contract: the same content always yields the same bytes.
3. **Checksum.** SHA-256 of the canonical bytes becomes the package
   checksum.
4. **Sign.** Ed25519 signs the message `id|version|checksum`.
5. **Emit.** The package document carries:

```json
{
  "manifest": { "...": "parsed manifest" },
  "components": { "workflows": [], "ui": {}, "assets": [] },
  "signature": "hex…",
  "signature_kid": "k1",
  "publisher_id": "qefro"
}
```

## Signing keys

The CLI loads a signing key from one of:

| Source | Setting |
| --- | --- |
| Environment variable | `QEFRO_SIGNING_KEY_HEX` — 32 bytes of hex |
| Keys file | `QEFRO_KEYS_FILE` pointing to a file containing `REGISTRY_PRIVATE_KEY=<hex>` |

The publisher identity is taken from `QEFRO_PUBLISHER_ID` (defaults to
the built-in publisher UUID). That id **must** be listed in solution-service
`QEFRO_PLATFORM_ADMIN_IDS` — only platform admins can publish. See
[Publishing](/docs/solutions/publishing).

:::warning
The signing key is the root of trust for everything you publish. Keep it
out of source control, CI logs and shell history; rotate it through the
platform key process, never ad hoc.
:::

## Why canonical JSON

- **Deterministic checksums** — two builds of identical content produce
  identical checksums, so the registry can detect any tampering or drift.
- **Reproducible signatures** — `id|version|checksum` binds the identity
  *and* content of the release; changing either invalidates the
  signature.
- **Version immutability** — a published version's checksum can never
  change; fixes ship as new versions. See
  [Publishing](/docs/solutions/publishing).

## What does not enter the package

- Local caches, editor metadata and `dist/` itself.
- Anything outside the solution directory — packages are self-contained.
- Secrets of any kind; connector credentials are tenant data collected at
  install time. See [Connectors](/docs/solutions/connectors).

## Related topics

- [Validation](/docs/solutions/validation) — checks run before assembly
- [Publishing](/docs/solutions/publishing) — submitting the signed package
- [Security](/docs/solutions/security) — the trust model signatures support
