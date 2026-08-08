---
title: "Marketing"
description: "Register audiences, variables, and CTAs with app.marketing — platform owns campaign send."
sidebar_label: "Marketing"
---

# Marketing

Your app declares **what can be marketed**. The platform owns **campaign
creation, audience resolution, and WhatsApp/widget delivery**
([ADR-004](https://github.com/qefro-ai/qefro-platform/blob/main/docs/adr-004-marketing-capability.md)).

## Mental model

```text
app.marketing({ audiences, variables, actions, landingPages, channels })
  → install sync → marketing registrations
  → Admin Marketing / staff offer tools
  → platform send (ACS WhatsApp)
  → guest taps CTA → booking/?n=&campaign_id=&offer_id=
  → your create* tool persists attribution
```

## Register metadata

Starter includes a working registration. Customize ids and tools:

```js
app.marketing({
  version: 1,
  audiences: [
    {
      id: 'recent_clients',
      label: 'Recent clients',
      source: 'app_query',
      appQuery: { tool: 'warehouse.listAppointments', input: { limit: 100 } },
    },
    {
      id: 'vip',
      label: 'VIP',
      source: 'customer_hub',
      customerHub: { tags: ['vip'], consentPurpose: 'marketing' },
    },
  ],
  variables: [
    { id: 'client_name', label: 'Client name', type: 'string', source: 'customer_hub', path: 'display_name', required: true },
    { id: 'booking_url', label: 'Booking URL', type: 'url', source: 'app_context', path: 'booking.url' },
  ],
  actions: [
    {
      id: 'book_appointment',
      label: 'Book',
      kind: 'whatsapp_cta',
      landingPageId: 'booking',
      urlTemplate: '{{booking_url}}',
      payload: { text: 'Book now' },
    },
  ],
  landingPages: [
    { id: 'booking', label: 'Booking', path: '/booking', host: 'platform' },
  ],
  channels: [
    { id: 'whatsapp', provider: 'meta', enabled: true },
  ],
});
```

Manifest permissions:

```yaml
permissions:
  - marketing.read
  - marketing.write
```

## Attribution

Booking / landing bridges should accept `campaign_id` / `offer_id` (and
aliases) and round-trip them into the conversation or create payload.
Restaurant Pro appends a hidden `---` metadata block to the WhatsApp
message; `createReservation` persists `source=marketing` when present.

Always prefer workspace WhatsApp digits via `?n=` from
`ctx.platform.channels` — never hardcode a restaurant number in shared
static hosts.

## Feature flags

Campaign send requires marketing enabled on solution-service / ACS
(`QEFRO_MARKETING_ENABLED` and related URLs). If disabled, registration may
still store metadata while send soft-fails — design staff UI accordingly.

## Admin surface

Admin Console → **Marketing** lists registrations and (when enabled)
campaign ops. Applications Capability Explorer shows whether your install
synced marketing capabilities.

## Related

- Platform contract: `qefro-plugin-platform/docs/marketing-capability.md`
- [Customer Hub](/docs/solutions/customer-hub)
- [Build your first app](/docs/solutions/build-your-first-app)
- [Marketplace](/docs/solutions/marketplace)
