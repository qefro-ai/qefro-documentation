---
title: "Example: clinic-pro"
description: "Clinic Pro — doctors, visit types, and WhatsApp appointment booking on the installable SDK app surface."
sidebar_label: "clinic-pro"
---

# Example: clinic-pro

:::warning Historical SDK package
`clinic-pro` is an **SDK-hosted** `/qefro` vertical. New Marketplace Apps
use metadata (`hosting: runtime`) — see
[restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime)
and [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).
:::

`clinic-pro` is a **reference vertical** for clinics: doctors, visit types, and
WhatsApp appointment prebooking. Same ADR-003 surface as
[restaurant-pro](/docs/solutions/examples/restaurant-pro) — the `/qefro` process
is the application.

```text
widget / WhatsApp / staff UI
  → runtime → clinic-pro /qefro
  → clinic.* → ctx.storage + Customer Hub (patients)
```

Customer Hub owns **patients**. Clinic Pro owns **doctors** and **appointments**.
Slots are derived (working hours − existing appointments).

## Collections

| Logical | Purpose |
| --- | --- |
| `doctors` | Roster + working hours |
| `appointments` | Bookings with frozen status + visit type |
| `patient_profiles` | Optional local notes (not identity source of truth) |

## Develop

Canonical package lives in the platform repo:

```bash
cd docs/examples/clinic-pro   # qefro-plugin-platform
npm install
export QEFRO_SIGNING_SECRET=dev-secret
npm start
```

Booking bridge: `booking/` → `https://clinic-pro.portal.qefro.com/booking` after deploy.

## Related topics

- [Build your first app](/docs/solutions/build-your-first-app)
- [Customer Hub](/docs/solutions/customer-hub)
- [restaurant-pro](/docs/solutions/examples/restaurant-pro)
- [salon-pro](/docs/solutions/examples/salon-pro)
