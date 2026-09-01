---
title: "Example: salon-pro"
description: "Salon Pro — stylists, services, and WhatsApp appointment booking on the installable SDK app surface."
sidebar_label: "salon-pro"
---

# Example: salon-pro

:::warning Historical SDK package
`salon-pro` is an **SDK-hosted** `/qefro` vertical. New Marketplace Apps
use metadata (`hosting: runtime`) — see
[real-estate-runtime](/docs/solutions/examples/real-estate-runtime)
and [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).
:::

`salon-pro` is a **reference vertical** for salons: stylists, services, and
WhatsApp appointment booking. Same platform surface as
[clinic-pro](/docs/solutions/examples/clinic-pro) and
[restaurant-pro](/docs/solutions/examples/restaurant-pro).

```text
widget / WhatsApp / staff UI
  → runtime → salon-pro /qefro
  → salon.* → ctx.storage + ctx.customer + app.marketing metadata
```

## Collections

| Collection | Purpose |
| --- | --- |
| `stylists` | Roster + working hours |
| `services` | Duration + price catalog |
| `appointments` | Client bookings |
| `client_profiles` | Optional Hub linkage |

WhatsApp digits come from the **workspace channel** (never install settings).

## Develop

```bash
cd docs/examples/salon-pro   # qefro-plugin-platform
npm install
npm run dev
```

## Related topics

- [Build your first app](/docs/solutions/build-your-first-app)
- [Marketing](/docs/solutions/marketing)
- [Customer Hub](/docs/solutions/customer-hub)
- [clinic-pro](/docs/solutions/examples/clinic-pro)
