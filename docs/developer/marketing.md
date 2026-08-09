---
title: "Marketing"
description: "Register marketing metadata — audiences, variables, actions, landing pages, channels."
sidebar_label: "Marketing"
---

# Marketing

The application contributes **metadata**. The platform owns campaigns, delivery, and analytics.

## Register

```javascript
app.marketing({
  version: 1,
  audiences: [
    {
      id: 'vip_guests',
      label: 'VIP guests',
      source: 'customer_hub',
      customerHub: { tags: ['vip'], consentPurpose: 'marketing' },
    },
    {
      id: 'inactive_customers',
      label: 'Inactive customers',
      source: 'app_query',
      appQuery: { tool: 'restaurant.listInactiveCustomers', input: { days: 30 } },
    },
  ],
  variables: [
    { id: 'guest_name', label: 'Guest name', type: 'string', source: 'customer_hub', path: 'display_name', required: true },
    { id: 'offer_title', label: 'Offer title', type: 'string', source: 'campaign', required: true },
  ],
  actions: [
    { id: 'book_table', label: 'Book a table', kind: 'whatsapp_cta', landingPageId: 'booking', urlTemplate: '{{booking_url}}' },
  ],
  landingPages: [
    { id: 'booking', label: 'Booking', path: '/booking', host: 'app' },
  ],
  channels: [
    { id: 'whatsapp', enabled: true },
  ],
});
```

Call **once** per process (`marketing() may only be called once`).

## Field reference

| Concept | Allowed values (SDK) |
| --- | --- |
| Audience `source` | `customer_hub`, `app_query`, `static_filter` |
| Variable `type` | `string`, `number`, `datetime`, `boolean`, `url`, `currency` |
| Variable `source` | `customer_hub`, `app_context`, `campaign`, `literal` |
| Action `kind` | `url`, `deep_link`, `quick_reply`, `whatsapp_cta`, `postback` |
| Landing `host` | `app`, `platform` |
| Channel `id` | `whatsapp`, `email`, `website_widget`, or custom string |

`provider` on channels is reserved (multi-provider) — **not implemented in Phase 1**.

## Runtime client

```typescript
getRegistration(): Promise<Record<string, unknown> | null>
```

**Not confirmed on `ToolContext`:** handlers do **not** receive `ctx.marketing` in 1.7.0 — only `app.marketing({…})` metadata plus the optional exported `buildMarketingContext` helper. Gated by `QEFRO_MARKETING_ENABLED`. Audience resolve / campaigns = platform Phase 2+.

## Sync

Managed installs: solution-service refreshes marketing registration after install/upgrade via `capabilities.list` (best-effort).

## Ownership boundary

| App | Platform |
| --- | --- |
| Audience definitions | Campaign creation |
| Variables / CTAs / landing metadata | WhatsApp/email delivery |
| `app_query` tools that resolve audiences | Analytics |
