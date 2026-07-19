---
id: v1-business-tools
title: Business Tools
slug: /v1/business-tools
sidebar_label: Business Tools
---

## Tool metadata
- name
- description
- auth
- permissions
- timeout

## Example
```ts
app.tool({
  name: "download_invoice",
  description: "Download customer invoice",
  auth: "required",
  permissions: ["invoice.read"],
  timeout: 30,
}, async (ctx) => {
  return invoiceService.download(String(ctx.customer.id));
});
```

## Return values
Return structured JSON and predictable schemas.

## Errors
Use clear business-safe errors and avoid leaking internal details.

## Timeouts
Keep tools bounded; optimize handler logic before raising timeout limits.
