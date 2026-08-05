---
title: "Navigation"
description: "Declare sidebar entries and path aliases with navigation.yaml and routes.yaml, using the closed host icon set."
sidebar_label: "Navigation"
---

# Navigation

Navigation is declared data: `ui/navigation.yaml` defines the sidebar
entries of your solution UI. Each entry doubles as the route alias the
portal mounts the page on, and the navigation engine injects the entries
as a `Solutions · {name}` group in the portal sidebar.

## navigation.yaml

Each entry maps a sidebar item to a declared page:

```yaml title="ui/navigation.yaml"
- id: dashboard
  page: dashboard
  title: Dashboard
  icon: home
- id: reservations
  page: reservations
  title: Reservations
  icon: calendar
- id: tables
  page: tables
  title: Tables
  icon: users
- id: kitchen
  page: kitchen
  title: Kitchen
  icon: chef-hat
- id: orders
  page: orders
  title: Orders
  icon: receipt
- id: payments
  page: payments
  title: Payments
  icon: credit-card
- id: reports
  page: reports
  title: Reports
  icon: report
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Route alias used in the URL path. |
| `page` | string | Yes | Page id declared in `pages.yaml`. |
| `title` | string | Yes | Sidebar and page label. |
| `icon` | string | Yes | Icon from the closed host icon set. |

:::warning
Every navigation `page` must resolve to a declared page. Unknown page ids
fail publish-time validation — the portal never renders dangling entries.
:::

## The closed icon set

Icons come from a fixed host set; packages cannot ship icon fonts or SVG
sprites for navigation. Unknown icons are rejected at publish time (and
would fall back at render).

| Icon | Icon | Icon | Icon |
| --- | --- | --- | --- |
| `home` | `calendar` | `chef-hat` | `receipt` |
| `users` | `user` | `file-text` | `bar-chart` |
| `settings` | `package` | `clipboard` | `credit-card` |
| `activity` | `list` | `clock` | `map` |
| `stethoscope` | `wallet` | `report` | |

Domain hints: `stethoscope` for hospital pages, `chef-hat` for kitchen
views, `package` for inventory, `wallet` for payments, `clipboard` for
school or audit lists.

## Route aliases

Every navigation entry is also a route alias: its `id` is the path segment
the portal mounts the page on, under the solution UI route:

```text
/app/solutions/ui/{solution}/{page}
```

For `restaurant-pro`, the dashboard entry (`id: dashboard`,
`page: dashboard`) lives at `/app/solutions/ui/restaurant-pro/dashboard`.
Renaming an entry id therefore changes a tenant-facing URL — treat ids as
stable identifiers.

## Navigation events

Selecting an entry emits `ui.navigate` onto the platform event bus, and
host-side navigation is validated against the bundle on every call
(`ui.navigate` host API). See [Events](/docs/solutions/events) and
[Capabilities](/docs/solutions/capabilities).

## Guidelines

- Keep 5–8 top-level entries; group detail views inside pages rather than
  adding entries.
- Use stable ids — renaming an entry changes URLs for tenants.
- One navigation entry per audience: staff-facing (kitchen) and
  front-of-house (reservations) entries can coexist because access is
  governed by portal roles, not by hiding entries.

## Related topics

- [Pages](/docs/solutions/pages) — what each entry renders
- [Events](/docs/solutions/events) — `ui.navigate`
- [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
