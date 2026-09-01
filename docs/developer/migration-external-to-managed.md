---
title: "Migration: External → Managed"
description: "Platform-hosted /qefro Marketplace Apps were removed. Keep SDK Connections for external systems."
sidebar_label: "Migrate to managed"
---

# Migration: External → Managed

This path is **removed**. Qefro no longer hosts a `/qefro` container as a
Marketplace App (`hosting: managed`).

- **Marketplace App** → metadata (`hosting: runtime`) → Qefro Runtime
- **External ERP / POS / CRM** → Qefro SDK → SDK Connection (`hosting: external`)

Do not wrap Focus ERP, Yaaz, or similar systems as Marketplace Apps.
Keep them as [SDK Connections](./external-sdk-connection.md).

New in-Qefro products: [Build your first app](/docs/solutions/build-your-first-app).
