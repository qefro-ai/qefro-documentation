---
title: "Tools"
description: "Define, validate, and expose Qefro SDK business tools."
sidebar_label: "Tools"
---

# Tools

Tools are the unit of business capability. AI, workflows, and Portal **Sync Tools** discover them via `capabilities.list` (preferred) or legacy `tools.list`, and execute them with `tool.invoke`.

When `auth: 'required'`, the SDK auto-calls `ctx.customer.authorize({ method: default_auth_method })` before the handler.

## Definition fields

From `ToolDefinition` / `RegisteredTool`:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Stable tool id |
| `description` | string? | For AI / catalog |
| `input_schema` | JSON Schema object? | Parameters |
| `auth` | `'none' \| 'optional' \| 'required'` | Default `optional` |
| `authentication_methods` | string[]? | Declared methods |
| `permissions` | string[]? | Default `[]` |
| `timeout` | number? | Hint |
| `lookup` | `{ by?: string, required?: string[] }` | Identity attrs runtime must resolve |
| `chat` | boolean? | `false` = staff/org only (not offered on WhatsApp/widget). Default effectively public when omitted/`true` |
| `default_auth_method` | string? | Optional |

There is **no separate `output_schema` field** on the current JS `ToolDefinition`. Document outputs in `description` / return values. TypeScript generics `ToolHandler<TInput, TOutput>` provide compile-time typing only.

## Handler context

```typescript
interface ToolContext {
  identity: Record<string, unknown>;
  parameters: /* TInput */;
  conversation: { id: string };
  channel?: string;
  authentication?: Record<string, unknown>;
  logger: Pick<Console, 'info' | 'warn' | 'error'>;
  platform?: PlatformCapabilities;
  trace_id?: string;
  customer: CustomerContext;
  person: PersonContext;
  storage: StorageContext;
  timeline: TimelineContext;
  membership: MembershipContext;
  consent: ConsentContext;
  requireCustomer / authorizeCustomer / requireAuthentication;
}
```

## Example

```javascript
app.tool(
  'calculateQuote',
  {
    description: 'Calculate quotation totals',
    auth: 'optional',
    chat: true,
    input_schema: {
      type: 'object',
      properties: {
        lines: { type: 'array' },
        tier: { type: 'string' },
      },
    },
  },
  async (ctx) => {
    ctx.logger.info('calculateQuote', ctx.parameters);
    // validate inputs in handler; throw or return structured errors
    return { total: 0, currency: 'INR' };
  },
);
```

## Validation & errors

- Schema validation of `input_schema` is **not** automatically enforced by the SDK on every invoke — validate in your handler (or rely on upstream runtime checks where present).
- Unknown tool → `{ type: 'error', code: 'not_found', message: 'Unknown tool: …' }`.
- Auth challenge → `{ type: 'challenge', resume_token, challenge }` then `tool.resume`.
- Throw / reject → often `{ type: 'error', code: 'internal_error', message }` (or mapped auth codes).

## Authentication / context

- Use `auth: 'none' | 'optional' | 'required'` and optional `app.customer(provider)`.
- Hub identity: `ctx.customer.resolve` / `lookup` / …
- Conversation auth helpers: `ctx.requireCustomer`, `ctx.authorizeCustomer`.

## Exposure path

```text
app.tool registration
    ↓
capabilities.list (preferred) / tools.list (legacy)
    ↓
Admin Sync Tools → Business Tools (external)
  or
manifest tools + install (managed)
    ↓
tool.invoke → handler
```

## Naming conventions

| Model | Common pattern |
| --- | --- |
| Managed apps | Prefixed ids: `restaurant.createReservation` |
| Organization actions | Opaque ids **without** dots: `approve_purchase` |
| External connectors | Prefixed (`abm.searchProducts`) or simple names |

Org capability ids must not contain `.` (SDK validation).
