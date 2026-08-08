---
title: "Example: marketing-lab"
description: "Marketing Lab — minimal SDK app that registers app.marketing so Admin → Marketing shows real registrations."
sidebar_label: "marketing-lab"
---

# Example: marketing-lab

`marketing-lab` is a **smoke / lab** installable SDK app. Its only job is to
register `app.marketing({…})` so Admin Console → **Marketing** shows real
audiences, variables, actions, and channels ([ADR-004](/docs/solutions/marketing)).

It is **not** a production marketing product.

```text
install marketing-lab
  → solution-service capabilities.list on /qefro
  → marketing_registrations upsert
  → portal Marketing page lists registrations
```

## What it registers

| Kind | Ids |
| --- | --- |
| Audiences | `promo_opt_in`, `vip_people`, `all_static` |
| Variables | `person_name`, `phone`, `booking_url` |
| Actions | `open_landing` (WhatsApp CTA) |
| Landing | `promo_landing` |
| Channels | `whatsapp`, `website_widget` |

## Develop & install

```bash
cd docs/examples/marketing-lab   # qefro-plugin-platform
npm install
export QEFRO_SIGNING_SECRET=dev-secret
npm run dev

# Managed deploy (example)
docker build -t qefro-marketing-lab:0.1.0 .
qefro solution publish .
# Then install from Marketplace into a workspace
```

Until the package is **installed** in a workspace, the Marketing page stays empty.

## Related topics

- [Marketing](/docs/solutions/marketing)
- [Marketplace](/docs/solutions/marketplace)
- [Build your first app](/docs/solutions/build-your-first-app)
