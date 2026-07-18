---
slug: widget-to-whatsapp
title: Tutorial — from website widget to WhatsApp
description: Ship Customer AI on the website first, validate retrieval quality, then add WhatsApp on Growth+ using the same Support workspace.
authors: [abu]
tags: [tutorials, product]
---

Ship **Customer AI** on the website first, validate retrieval quality, then add WhatsApp on Growth+ — preferably bound to the same Support workspace so answers stay consistent.

<!-- truncate -->

## Why website first

The website widget is the fastest loop for:

- Citation quality on real FAQs
- Refusal behavior when knowledge is missing
- Branding and tone
- Optional `identify()` before any Business Tools

WhatsApp adds Meta Cloud API setup, webhook verification, and plan limits. Validate the brain before you multiply channels.

## Step 1 — Create a Support workspace

1. Sign in at [app.qefro.com](https://app.qefro.com).
2. Create a workspace named for Support.
3. Upload policies and FAQs (or crawl approved URLs).
4. Ask ten real customer questions and check citations.

Guides: [Quick Start](/docs/getting-started/quick-start), [Build AI Customer Support](/docs/guides/build-ai-customer-support).

## Step 2 — Embed the website widget

```html
<script
  src="https://cdn.qefro.com/widget.js"
  data-token="YOUR_WIDGET_TOKEN"
  data-endpoint="https://api.qefro.com"
  data-workspace-id="YOUR_WORKSPACE_ID">
</script>
```

Full guide: [Deploy Website Widget](/docs/guides/deploy-website-widget). Platform notes: [Website Widget](/docs/platform/website-widget).

If Business Tools need the logged-in shopper or account holder, add [`identify()`](/docs/platform/identity-forwarding) after your existing session is established.

## Step 3 — Add WhatsApp (Growth+)

1. Confirm your plan includes WhatsApp.
2. Configure Meta Cloud API credentials in the Admin Console.
3. Point Meta’s webhook to Qefro’s WhatsApp webhook path on `api.qefro.com`.
4. Bind the same Support workspace you already validated.

Guide: [Deploy WhatsApp AI](/docs/guides/deploy-whatsapp-ai). Platform: [WhatsApp](/docs/platform/whatsapp).

## Step 4 — Keep audiences separate

Customer AI (widget + WhatsApp) should not share an HR or payroll workspace. See [Customer AI vs Employee AI](/docs/concepts/customer-ai-vs-employee-ai).

## Done when

- Website answers cite the right sources
- Unknown topics refuse cleanly
- WhatsApp replies match website quality for the same questions
- Tools (if any) are logged and least-privileged

Next: [Production Deployment](/docs/guides/production-deployment).
