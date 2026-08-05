---
title: "Validation"
description: "Every publish-time check applied to a solution package — run them locally with the build before you publish."
sidebar_label: "Validation"
---

# Validation

Validation happens at two gates: **build time** (`qefro solution build`)
and **publish time** (registry). The registry applies the same checks as
the build, so a package that builds cleanly is publishable. Fix errors at
the first gate — publishing a broken package is impossible by design.

## The checklist

### Manifest

| Check | Failure message pattern |
| --- | --- |
| `id` is kebab-case (lowercase, digits, `-`, starts with a letter) | `solution id must be kebab-case` |
| `name` non-empty | `solution name is empty` |
| `version` non-empty | `solution version is empty` |
| Connector dependencies non-empty | `empty connector dependency` |
| Every `flows` entry has a definition in `workflows/` | `workflow file missing` |
| Unknown `permissions` / `capabilities` values | `unknown capability` |

### Widgets

| Check | Detail |
| --- | --- |
| Closed widget kind list | Unknown `type` values are rejected (`unknown widget type`) |
| Widget ids unique | Duplicate ids fail |
| `source` references resolve | Every data-driven widget must name a declared source |
| `markdown` content cap | `content` larger than 20 KB is rejected |
| `form` fields valid | Known field types; `select` requires `options` |

### Pages and layouts

| Check | Detail |
| --- | --- |
| Layout type | Must be `grid` |
| Column range | `columns` between 1 and 12 (`bad grid columns`) |
| Span range | Placement spans fit within the layout's column count |
| Placement references | Every placement names a declared widget |

### Navigation

| Check | Detail |
| --- | --- |
| Page references | Every entry's `page` must exist in `pages.yaml` |
| Closed icon set | Icons outside the host set are rejected — see [Navigation](/docs/solutions/navigation) |

### Sources

| Check | Detail |
| --- | --- |
| Source type | `runtime` or `connector` only |
| Runtime targets | `metrics`, `executions`, `workflows` |
| Connector targets | Declared under `connectors/` and exposed by the connector |

### Assets

| Check | Detail |
| --- | --- |
| Image extensions only | `png`, `jpg`, `jpeg`, `svg`, `webp` |
| Executable content rejected | `script`, `iframe`, `js` kinds and other extensions (`executable asset paths`) |
| Manifest references resolve | `ui.logo` / `ui.icon` must point at packaged images |

### Capabilities

| Check | Detail |
| --- | --- |
| Known capability names | Unknown names rejected at publish (`unknown capability`) |
| Grant preconditions | `workflow.trigger` needs `workflow.execute`; `connector.invoke` needs ≥ 1 declared connector; ungrantable requests are negotiated away at install |

## Local validation loop

```bash
qefro solution build .
```

The build performs the full checklist, then assembles and signs the
package. Typical failures and fixes:

```text
Error: unknown widget type: sparkline
→ widget kinds are a closed list; pick one of the supported kinds.

Error: icon outside the closed set: utensils
→ use a host icon, e.g. chef-hat. See Navigation.

Error: bad grid columns: 16
→ columns must be between 1 and 12.

Error: executable asset paths: assets/widget.js
→ packages ship data only; remove the file.
```

## Render-time defense

Validation does not make render-time checks redundant. The portal applies
defensive schema coercion and clamps values (spans, columns) before
render, and an error boundary degrades any broken definition to a scoped
error card. The two gates have different jobs:

- **Publish-time validation** keeps bad packages out of the registry.
- **Render-time coercion** keeps the portal alive if a definition is
  degenerate.

## Related topics

- [Packaging](/docs/solutions/packaging) — what the build produces
- [Publishing](/docs/solutions/publishing) — registry-side enforcement
- [Security](/docs/solutions/security) — why the checklist exists
