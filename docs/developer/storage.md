---
title: "Storage"
description: "Managed document storage via ctx.storage and platform.storage."
sidebar_label: "Storage"
---

# Storage

## Two kinds of data

### Application-owned domain data

Marketplace Apps persist declared entities through **Runtime** tools
(`entity.reservation.create`) into storage-service. No SDK process.

SDK-hosted / external apps use:

```text
ctx.storage  →  storage-service  →  documents
```

Examples (Restaurant Pro Runtime): `reservation`, `table`, `menu_item`.
SDK takeaway `restaurant-pro` still uses `ctx.storage` collections
(`orders`, `menu_items`, …).

### Platform-owned data

Customer Hub people, Organization workflow/inbox state, Marketing campaigns — **not** stored as your domain collections.

## API

```typescript
ctx.storage.insert(collection, document, options?: { allocate_code?: { prefix: string; start?: number } })
ctx.storage.find(collection, options?: { filter?, limit?, sort? })  // → { items, total }
ctx.storage.get(collection, id)
ctx.storage.update(collection, id, patch)
ctx.storage.delete(collection, id)
```

Calls `POST {base_url}/v1/internal/storage/{op}` with `{ …body, context }` and optional `Authorization: Bearer`.

## How binding is supplied

1. **Preferred:** `platform.storage` on `tool.invoke` (`base_url`, `token`, `context`)
2. **Env fallback for URL/token:** `QEFRO_STORAGE_URL`, `QEFRO_SERVICE_TOKEN` / `QEFRO_INTERNAL_TOKEN`

Still requires `platform.storage.context` on invoke — without context the SDK throws:

```text
ctx.storage requires platform.storage.context on tool.invoke
```

Without base URL:

```text
ctx.storage requires platform.storage.base_url or QEFRO_STORAGE_URL
```

## Isolation

`platform.storage.context` includes `tenant_id`, `workspace_id`, `installation_id`, `solution_id`, optional `identity_id`, and capability strings (`storage.read` / `write` / `update` / `delete`).

## Managed vs external

| | Managed Marketplace App | External SDK Connection |
| --- | --- | --- |
| Typical | `ctx.storage` with install scope | Own database / ERP |
| `platform.storage` | Injected when storage-service configured | Only if install/solution scope present |
| Manifest | May declare `collections` + `allocate_code` | N/A |

## Collections (manifest hint)

Restaurant Pro example:

```yaml
collections:
  - name: reservations
    allocate_code:
      prefix: "R-"
      start: 1001
```

Allocate codes are also available at insert time via `options.allocate_code`.
