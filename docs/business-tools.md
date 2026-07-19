---
id: v1-business-tools
title: Business Tools
slug: /v1/business-tools
sidebar_label: Business Tools
---

Business Tools are workspace-scoped capabilities the AI can invoke during chat. Qefro supports two implementation kinds:

| Kind | How you register | Best for |
| --- | --- | --- |
| `rest` / OpenAPI | Admin Console or OpenAPI import | Existing HTTPS APIs |
| `sdk` | `@qefro/backend` / `qefro-sdk` + Sync Tools | Auth, workflows, custom logic |

Platform overview: [Business Tools](/docs/platform/business-tools).  
SDK registration guide: [Register SDK Business Tools](/docs/guides/register-sdk-business-tools).

## SDK tool metadata

When you register with the framework:

- `name`
- `description`
- `auth` — `none` \| `optional` \| `required`
- `authentication_methods` — optional list (e.g. `email_otp`)
- `permissions`
- `timeout`
- `input_schema`

## Example

```ts
app.tool({
  name: "download_invoice",
  description: "Download customer invoice",
  auth: "required",
  permissions: ["invoice.read"],
  timeout: 30,
  authentication_methods: ["email_otp"],
}, async (ctx) => {
  return invoiceService.download(String(ctx.customer.require().id));
});
```

After **Sync Tools** with `auto_register` into a workspace, this handler becomes a Business Tool with:

- `implementation_kind = sdk`
- `sdk_handler_name = download_invoice`
- `required_auth_level = organization_challenge` (because `authentication_methods` is set)

## Return values

Return structured JSON and predictable schemas so the LLM can ground replies.

## Errors

Use clear business-safe errors and avoid leaking internal details.

## Timeouts

Keep tools bounded; optimize handler logic before raising timeout limits.

## Related

- [SDK Framework](/docs/v1/sdk-framework)
- [Customer Provider](/docs/v1/customer-provider)
- [Connect REST APIs](/docs/guides/connect-rest-apis)
- [Import OpenAPI](/docs/guides/import-openapi)
