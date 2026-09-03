---
title: "Marketplace Apps collection"
description: "Metadata-only Marketplace Apps live in qefro-marketplace-apps — Shopify, Restaurant Pro, Real Estate, and HTTP catalog fixtures executed by Qefro Runtime."
sidebar_label: "Collection"
---

# Marketplace Apps collection

Canonical packages live in **[qefro-marketplace-apps](https://github.com/qefro-ai/qefro-marketplace-apps)**.
Each app is YAML only. Qefro Runtime executes it. There is no SDK process
and no `/qefro` server in the package.

```text
qefro-marketplace-apps/apps/<app-id>
  → qefro app validate / package / publish
  → Plugin Platform catalog
  → workspace install
  → Qefro Runtime (FlowRunner → RuntimeAdapter)
```

| App | Vertical | Execution |
| --- | --- | --- |
| [`shopify-runtime`](/docs/solutions/examples/shopify-runtime) | Commerce | Generic HTTP → workspace Shopify connection |
| [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime) | Hospitality | `entity.*` managed storage |
| [`real-estate-runtime`](/docs/solutions/examples/real-estate-runtime) | Real estate | `entity.*` managed storage |
| `http-catalog-runtime` | HTTP fixture | Generic HTTP (proves the executor is not Shopify-specific) |

Copy a tree from the collection repo, change nouns and HTTP metadata, then
validate. Do not add provider-specific Rust to Runtime.

HTTP identity, surfaces, email OTP, and ownership:
[HTTP tools](/docs/solutions/http-tools). Architecture:
[Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

`qefro-plugin-platform/docs/examples/` still vendors copies so platform
validator tests can compile packages in CI. **Author and publish from
the collection repo.**
