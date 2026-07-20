---
id: v1-quick-start
title: Quick Start
slug: /v1/quick-start
unlisted: true
sidebar_label: Quick Start
---

Smallest complete SDK backend:

```ts
import { Qefro } from "@qefro-ai/backend";

const app = new Qefro({ signingSecret: process.env.QEFRO_SIGNING_SECRET! });

app.customer({
  async lookup(ctx) {
    return { id: String(ctx.identity.phone ?? "demo") };
  },
  async authorize(ctx) {
    return {
      kind: "success",
      customer: ctx.customer,
      auth: { type: "bearer_token", access_token: "dev", expires_in: 900 },
    };
  },
});

app.tool({ name: "get_orders", auth: "required" }, async (ctx) => {
  return [{ orderId: "ord_1", customerId: String(ctx.customer.id) }];
});

await app.listen({ port: 8088 });
```

## Explain each step
- Qefro instance configures protocol, signature, and endpoint.
- customer.lookup resolves who the request belongs to.
- customer.authorize decides auth outcome.
- tool metadata declares auth requirements.
- listen starts the signed webhook endpoint.
